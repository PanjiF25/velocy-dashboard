import mqtt from "mqtt";

const host = "mqtts://ed8353af22094db7abcc96751b2e696d.s1.eu.hivemq.cloud:8883";
const options = {
  clientId: `velocy_monitor_${Math.random().toString(16).slice(3)}`,
  username: "velocy",
  password: "Velocy123",
  rejectUnauthorized: false
};

console.log("Connecting to MQTT broker...");
const client = mqtt.connect(host, options);

client.on("connect", () => {
  console.log("Connected! Subscribing to velocy/#");
  client.subscribe("velocy/#", (err) => {
    if (err) console.error("Subscribe error:", err);
    else console.log("Subscribed successfully. Waiting for messages...");
  });
});

client.on("message", (topic, message) => {
  console.log(`\n[${new Date().toISOString()}] Topic: ${topic}`);
  console.log(`Payload: ${message.toString()}`);
});

client.on("error", (error) => {
  console.error("MQTT Error:", error);
});
