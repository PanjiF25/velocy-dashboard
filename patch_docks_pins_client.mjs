import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDLj5CA2ZfuwQQe46XEkXJ18W8G_FI3Q8A",
  appId: "1:555617500653:web:1de3c27f3641f909917be4",
  messagingSenderId: "555617500653",
  projectId: "velocy-app",
  authDomain: "velocy-app.firebaseapp.com",
  storageBucket: "velocy-app.firebasestorage.app",
  measurementId: "G-FYQE499PDL",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function patchDocks() {
  console.log("Fetching docks...");
  const snapshot = await getDocs(collection(db, 'docks'));
  let count = 0;
  for (const dock of snapshot.docs) {
    const data = dock.data();
    const order = data.order || 1;
    
    // Assign dummy pins
    const sensorPin = order - 1;
    const actuatorPin = order - 1;
    
    await updateDoc(dock.ref, {
      sensorPin: sensorPin,
      actuatorPin: actuatorPin
    });
    console.log(`Updated ${dock.id} with sensorPin: ${sensorPin}, actuatorPin: ${actuatorPin}`);
    count++;
  }
  console.log(`Successfully updated ${count} docks!`);
  process.exit(0);
}

patchDocks().catch(e => {
  console.error(e);
  process.exit(1);
});
