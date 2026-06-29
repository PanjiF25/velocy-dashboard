const mqtt = require('mqtt');

const client = mqtt.connect('mqtts://ed8353af22094db7abcc96751b2e696d.s1.eu.hivemq.cloud:8883', {
  username: 'velocy',
  password: 'Velocy123',
  clientId: 'debug_' + Math.random()
});

client.on('connect', () => {
  console.log('Connected to HiveMQ!');
  client.subscribe('velocy/station/#');
});

client.on('message', (topic, message) => {
  console.log(`[${topic}] ${message.toString()}`);
});
