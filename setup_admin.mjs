import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

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

async function setup() {
  const email = 'admin@velocy.com';
  const password = 'admin12345';

  let user;
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    user = userCredential.user;
    console.log('Successfully created new user:', user.uid);
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      user = userCredential.user;
      console.log('User already exists, signed in:', user.uid);
    } else {
      throw error;
    }
  }

  const userDocRef = doc(db, 'users', user.uid);
  await setDoc(userDocRef, {
    displayName: 'Administrator',
    email: email,
    role: 'officer',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  console.log('Successfully set role to officer.');
  process.exit(0);
}

setup().catch(console.error);
