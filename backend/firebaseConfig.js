// Import the functions you need from the SDKs you need
const { initializeApp ,getApps} = require("firebase/app");
// import { getAnalytics } from "firebase/analytics";
// import { getFirestore } from 'firebase/firestore/lite';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDzgiMStIeck1w92Y4-4UjqFTLquA3KPIQ",
  authDomain: "amongus-9d388.firebaseapp.com",
  databaseURL: "https://amongus-9d388-default-rtdb.firebaseio.com",
  projectId: "amongus-9d388",
  storageBucket: "amongus-9d388.firebasestorage.app",
  messagingSenderId: "189863224347",
  appId: "1:189863224347:web:ec8f37918419faca5b04be",
  measurementId: "G-BM6N6977TB"
};

// Initialize Firebase
let firebase_app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

module.exports = firebase_app;