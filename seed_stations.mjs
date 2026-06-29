import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "dummy",
  authDomain: "velocy-project.firebaseapp.com",
  projectId: "velocy-project",
  storageBucket: "velocy-project.appspot.com",
  messagingSenderId: "dummy",
  appId: "dummy"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  const snapshot = await getDocs(collection(db, 'stations'));
  if (snapshot.empty) {
    console.log('No stations found. Seeding dummy stations...');
    await addDoc(collection(db, 'stations'), {
      name: 'Stasiun ITS Mulyorejo',
      address: 'Jl. Raya ITS, Keputih',
      lat: -7.2831,
      lng: 112.7952,
      totalDocks: 10
    });
    await addDoc(collection(db, 'stations'), {
      name: 'Stasiun Bundaran ITS',
      address: 'Bundaran Kampus ITS',
      lat: -7.2815,
      lng: 112.7960,
      totalDocks: 12
    });
    console.log('Dummy stations seeded successfully.');
  } else {
    console.log(Found  stations. No seeding required.);
    snapshot.forEach(doc => {
      console.log(doc.id, doc.data().name);
    });
  }
}

seed().catch(console.error);
