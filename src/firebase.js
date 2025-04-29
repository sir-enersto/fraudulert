import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD9xkVUvcrM_zZUtJEcMNlPCxwbxbxXJCs",
  authDomain: "fraudulert.firebaseapp.com",
  projectId: "fraudulert",
  storageBucket: "fraudulert.firebasestorage.app",
  messagingSenderId: "256989260451",
  appId: "1:256989260451:web:dc5142f0233eebbf206d16"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
