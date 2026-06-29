const mqtt = (window as any).mqtt;
import { addDock } from './firestoreService';

let client: any = null;
let isSyncEnabled = false;
let existingDocksRef: any[] = [];
let existingStationsRef: any[] = [];
let currentOnLog: ((msg: string) => void) | null = null;

export const connectMqtt = () => {
  if (client) return;
  // Connect to public HiveMQ via WebSockets
  client = mqtt.connect('wss://ed8353af22094db7abcc96751b2e696d.s1.eu.hivemq.cloud:8884/mqtt', {
    clientId: 'velocy-dashboard-' + Math.random().toString(16).substr(2, 8),
    username: 'velocy',
    password: 'Velocy123',
    clean: true,
  });

  client.on('connect', () => {
    console.log('Terhubung ke MQTT Broker (WebSocket).');
    client?.subscribe('velocy/station/+/config');
  });

  client.on('error', (err: any) => {
    console.error('MQTT Error: ', err);
  });

  client.on('message', async (topic: string, message: any) => {
    if (!isSyncEnabled) return;
    
    if (topic.endsWith('/config')) {
      try {
        const payload = JSON.parse(message.toString());
        const { stationId, dockCount, sensorPins } = payload;
        
        if (!stationId || !sensorPins || !Array.isArray(sensorPins)) return;

        if (currentOnLog) currentOnLog(`Menerima broadcast dari stasiun ${stationId} dengan ${dockCount} docks.`);
        
        let newDocksCount = 0;

        // Auto-add missing docks
        for (let i = 0; i < sensorPins.length; i++) {
          const pin = sensorPins[i];
          // Pisahkan penamaan berdasarkan I/O Box (1 Box = 8 port)
          const boxNum = Math.floor(i / 8) + 1;
          const dockNum = (i % 8) + 1;
          const dockCode = `Box ${boxNum} - D${dockNum}`;
          
          // Check if it exists in current docks list
          const exists = existingDocksRef.some(
            (d) => d.stationId === stationId && (String(d.sensorPin) === String(pin) || String(d.number) === String(dockCode))
          );

          if (!exists) {
            if (currentOnLog) currentOnLog(`DEBUG: Memeriksa D1... existingDocks ada ${existingDocksRef.length} item.`);
            const matchesId = existingDocksRef.filter(d => d.stationId === stationId);
            if (currentOnLog) currentOnLog(`DEBUG: Ada ${matchesId.length} dock dgn stationId sama. Sample: ${matchesId.slice(0,2).map(d => `(${d.number}, pin:${d.sensorPin})`).join(', ')}`);
            
            if (currentOnLog) currentOnLog(`Menambahkan dock baru ${dockCode} ke stasiun ${stationId}...`);
            const st = existingStationsRef.find(s => s.id === stationId);
            const realStationName = st ? st.name : stationId;
            // Add via firestoreService
            // Pass 'i' as the relayPin so it matches the Shift Register index (0 to 7)
            await addDock(stationId, realStationName, dockCode, i, pin);
            newDocksCount++;

            // Fix: Add to existingDocksRef immediately so we don't add it again if another message arrives fast
            existingDocksRef.push({
              stationId: stationId,
              number: dockCode,
              sensorPin: pin
            });
          }
        }

        if (newDocksCount > 0) {
          if (currentOnLog) currentOnLog(`Berhasil mensinkronisasi ${newDocksCount} dock baru untuk ${stationId}!`);
        } else {
          if (currentOnLog) currentOnLog(`Dock stasiun ${stationId} sudah tersinkronisasi (tidak ada yang baru).`);
        }

      } catch (err) {
        console.error('Failed to parse MQTT config message:', err);
      }
    }
  });
};



export const initMqttSync = (docksList: any[], stationsList: any[], onLog: (msg: string) => void) => {
  existingDocksRef = docksList;
  existingStationsRef = stationsList;
  currentOnLog = onLog;
  connectMqtt();
};

export const setSyncEnabled = (enabled: boolean, currentDocks: any[], currentStations: any[]) => {
  isSyncEnabled = enabled;
  existingDocksRef = currentDocks;
  existingStationsRef = currentStations;
  
  if (enabled && client) {
    // Resubscribe to force the broker to resend any retained messages
    client.unsubscribe('velocy/station/+/config');
    setTimeout(() => {
      client.subscribe('velocy/station/+/config');
    }, 100);
  }
};

export const publishOpenCommand = (stationId: string, relayPin: number, duration: number = 5) => {
  if (!client || !client.connected) {
    connectMqtt();
    console.warn("MQTT: Client wasn't connected, attempting to connect now...");
  }
  const topic = `velocy/station/${stationId}/command`;
  const payload = JSON.stringify({
    action: "open",
    relayPin: relayPin,
    duration: duration
  });
  client.publish(topic, payload);
  console.log(`MQTT: Published to ${topic}: ${payload}`);
  return true;
};

export const disconnectMqttSync = () => {
  if (client) {
    client.end();
    client = null;
  }
};
