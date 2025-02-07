// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
    getDatabase,
    ref,
    set,
    get,
    update,
    remove,
    push,
    onValue,
    off,
    query,
    orderByChild,
    equalTo,
    limitToLast,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
import { 
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: "AIzaSyAK8cgAKNDAfXIOzA_0kn4QhVk5OYkcGbk",
  authDomain: "bank-mannru2.firebaseapp.com",
  databaseURL: "https://bank-mannru2-default-rtdb.firebaseio.com",
  projectId: "bank-mannru2",
  storageBucket: "bank-mannru2.firebasestorage.app",
  messagingSenderId: "666672164834",
  appId: "1:666672164834:web:d221a89a4c4ed88d4c13bb",
  measurementId: "G-85BL0L97NP"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const auth = getAuth(app);

// Export everything from Firebase
export {
    ref,
    set,
    get,
    update,
    remove,
    push,
    onValue,
    off,
    query,
    orderByChild,
    equalTo,
    limitToLast,
    serverTimestamp,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
};
