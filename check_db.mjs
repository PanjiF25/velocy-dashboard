import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDLj5CA2ZfuwQQe46XEkXJ18W8G_FI3Q8A",
  authDomain: "velocy-app.firebaseapp.com",
  projectId: "velocy-app",
  storageBucket: "velocy-app.firebasestorage.app",
  messagingSenderId: "555617500653",
  appId: "1:555617500653:web:1de3c27f3641f909917be4",
  measurementId: "G-FYQE499PDL"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const stations = await getDocs(collection(db, 'stations'));
  console.log('Stations count:', stations.size);
  
  const docks = await getDocs(collection(db, 'docks'));
  console.log('Total Docks count:', docks.size);
  
  const docksData = docks.docs.map(d => d.data());
  
  for (const st of stations.docs) {
    const data = st.data();
    const stDocks = docksData.filter(d => d.stationId === st.id);
    let bikes = 0, empty = 0;
    stDocks.forEach(d => {
       if (d.status === 'occupied') bikes++;
       else empty++;
    });
    console.log(`[${data.name}] -> ID: ${st.id} | ${bikes} bikes, ${empty} empty docks`);
  }
  
  process.exit(0);
}

check().catch(console.error);
