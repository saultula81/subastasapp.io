// Firebase Configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCSkwb3GRMQVnI90Jm8L2QxjlSkBdr5KbE",
    authDomain: "subastasapp-7f968.firebaseapp.com",
    databaseURL: "https://subastasapp-7f968-default-rtdb.firebaseio.com",
    projectId: "subastasapp-7f968",
    storageBucket: "subastasapp-7f968.firebasestorage.app",
    messagingSenderId: "193286291732",
    appId: "1:193286291732:web:3cc707ad4e9230d1d1c201",
    measurementId: "G-9HTSPFYW0X"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get references to Firebase services
const auth = firebase.auth();
const database = firebase.database();

// Export for use in other modules
window.auth = auth;
window.database = database;

console.log('Firebase initialized successfully');