import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

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
const auth = getAuth(app);

async function check() {
  await signInWithEmailAndPassword(auth, 'admin@velocy.com', 'admin12345');
  console.log('Logged in successfully');
  try {
    const stations = await getDocs(collection(db, 'stations'));
    console.log('Stations count:', stations.size);
    if (stations.size > 0) {
      console.log('First station:', stations.docs[0].data());
    }
  } catch (e) {
    console.error('Error fetching stations:', e);
  }
  process.exit(0);
}

check().catch(console.error);
