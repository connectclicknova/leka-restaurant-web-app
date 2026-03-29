import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBWykjWpRYfqxOWRqWdr7WEm_tnSM_e_u0",
  authDomain: "leka-restaurant.firebaseapp.com",
  projectId: "leka-restaurant",
  storageBucket: "leka-restaurant.firebasestorage.app",
  messagingSenderId: "676065435614",
  appId: "1:676065435614:web:138a4ad1b79de41c3dc74f",
  measurementId: "G-FVL5TMMS10"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
