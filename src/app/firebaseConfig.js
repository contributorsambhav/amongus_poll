// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCkVb4yjIndEtM9SlqPab0vfHbf0O4eBa4",
  authDomain: "among-us-85e0d.firebaseapp.com",
  projectId: "among-us-85e0d",
  storageBucket: "among-us-85e0d.appspot.com",
  messagingSenderId: "527148462400",
  appId: "1:527148462400:web:a3bf62e199729cbd2e4aa5",
  measurementId: "G-1CV392DMYC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);