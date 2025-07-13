import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC47lZOQWp0RuqmqwUGCsxKl5gBex2L2Xk",
  authDomain: "bowlling-ea83d.firebaseapp.com",
  projectId: "bowlling-ea83d",
  storageBucket: "bowlling-ea83d.firebasestorage.app",
  messagingSenderId: "422882323899",
  appId: "1:422882323899:web:93fbf080161902a871289e",
  measurementId: "G-26EY5Z4EFE",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
