import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAW8AlmGjyb-KoMkbTtl1CFvRx53mY4jnk",
  authDomain: "asvspoof-web-app.firebaseapp.com",
  projectId: "asvspoof-web-app",
  storageBucket: "asvspoof-web-app.firebasestorage.app",
  messagingSenderId: "317369739072",
  appId: "1:317369739072:web:bfdb01d8c49a2f522d7ca5",
  measurementId: "G-E4BQ8ZE8M9"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);