// Import the functions you need from the SDKs you need
import { initializeApp ,getApps} from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore/lite';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAzu1kSeLggLm4gjvwh1CAsCeXTzF_oOpU",
  authDomain: "amongusgdsc.firebaseapp.com",
  databaseURL: "https://amongusgdsc-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "amongusgdsc",
  storageBucket: "amongusgdsc.appspot.com",
  messagingSenderId: "1009487601323",
  appId: "1:1009487601323:web:b11657fedd9ad289e4e1ee",
  measurementId: "G-7JSTSG6B7E"
};

// Initialize Firebase
let firebase_app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export default firebase_app;