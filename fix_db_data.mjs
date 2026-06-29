import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

// Try to find the service account key
const possiblePaths = [
  './serviceAccountKey.json',
  '../serviceAccountKey.json',
  '../velocy-app/serviceAccountKey.json',
  'g:/Kuliah/Mata Kuliah/Semester 6/Proyek Telematika/velocy-project/velocy-app/serviceAccountKey.json'
];

let serviceAccount = null;
for (const p of possiblePaths) {
  try {
    if (fs.existsSync(p)) {
      serviceAccount = JSON.parse(fs.readFileSync(p, 'utf8'));
      console.log('Found serviceAccountKey at:', p);
      break;
    }
  } catch (e) {}
}

if (!serviceAccount) {
  console.error("Could not find serviceAccountKey.json");
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function fixDB() {
  const stations = await db.collection('stations').get();
  console.log(`Found ${stations.size} stations`);
  
  for (const st of stations.docs) {
    const data = st.data();
    console.log(`Checking station: ${data.name}`);
    
    // Get docks for this station
    const docks = await db.collection('docks').where('stationId', '==', st.id).get();
    
    if (docks.empty) {
      console.log(`  - No docks found! Creating 6 empty docks...`);
      for (let i = 1; i <= 6; i++) {
        const dockId = `dock_${st.id}_${i}`;
        await db.collection('docks').doc(dockId).set({
          stationId: st.id,
          label: `Dok ${i}`,
          status: 'available',
          currentBikeCode: null,
          order: i,
          sensorPin: 10 + i,
          actuatorPin: 20 + i,
          dockCode: `D${i}`,
        });
      }
      console.log(`  - Created 6 empty docks.`);
    } else {
      console.log(`  - Found ${docks.size} docks. Resetting to 0 bikes...`);
      for (const dock of docks.docs) {
        await dock.ref.update({
          status: 'available',
          currentBikeCode: null
        });
      }
      console.log(`  - Reset complete.`);
    }
  }
  
  // Also reset all bikes
  const bikes = await db.collection('bikes').get();
  for (const b of bikes.docs) {
    await b.ref.update({
      status: 'available',
      currentDockId: null
    });
  }
  console.log(`Reset ${bikes.size} bikes.`);
  
  console.log("Database fix completed successfully!");
}

fixDB().catch(console.error);
