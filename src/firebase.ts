import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDLj5CA2ZfuwQQe46XEkXJ18W8G_FI3Q8A",
  authDomain: "velocy-app.firebaseapp.com",
  projectId: "velocy-app",
  storageBucket: "velocy-app.firebasestorage.app",
  messagingSenderId: "555617500653",
  appId: "1:555617500653:web:1de3c27f3641f909917be4",
  measurementId: "G-FYQE499PDL"
};

// Initialize primary Firebase (for regular usage)
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Initialize secondary Firebase app (for registering new users without logging out)
const secondaryApp = initializeApp(firebaseConfig, "Secondary");
export const secondaryAuth = getAuth(secondaryApp);
