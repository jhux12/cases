// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCyRm6dWH-fAmfWy83zLTrPFVi9Ny8gyxE",
  authDomain: "cases-e5b4e.firebaseapp.com",
  databaseURL: "https://cases-e5b4e-default-rtdb.firebaseio.com",
  projectId: "cases-e5b4e",
  storageBucket: "cases-e5b4e.appspot.com",
  messagingSenderId: "22502548396",
  appId: "1:22502548396:web:aac335672c21f07524d009"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Export reference to Firebase Database
const db = firebase.database();

