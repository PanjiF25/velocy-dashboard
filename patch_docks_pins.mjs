import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function patchDocks() {
  const snapshot = await db.collection('docks').get();
  let count = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const order = data.order || 1;
    
    // Assign dummy pins
    const sensorPin = 10 + order;
    const actuatorPin = 20 + order;
    
    await doc.ref.update({
      sensorPin: sensorPin,
      actuatorPin: actuatorPin
    });
    console.log(`Updated ${doc.id} with sensorPin: ${sensorPin}, actuatorPin: ${actuatorPin}`);
    count++;
  }
  console.log(`Successfully updated ${count} docks!`);
}

patchDocks().catch(console.error);
