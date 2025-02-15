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
import { 
    getFirestore, 
    collection, 
    doc, 
    setDoc, 
    getDoc, 
    getDocs, 
    addDoc,
    updateDoc, 
    deleteDoc, 
    where, 
    orderBy, 
    limit, 
    onSnapshot,
    Timestamp,
    enableIndexedDbPersistence,
    CACHE_SIZE_UNLIMITED
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';

// Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyAK8cgAKNDAfXIOzA_0kn4QhVk5OYkcGbk",
  authDomain: "bank-mannru2.firebaseapp.com",
  projectId: "bank-mannru2",
  storageBucket: "bank-mannru2.firebasestorage.app",
  messagingSenderId: "666672164834",
  appId: "1:666672164834:web:d221a89a4c4ed88d4c13bb",
  measurementId: "G-85BL0L97NP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Включаем оффлайн персистентность
enableIndexedDbPersistence(db, {
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
}).catch((err) => {
    if (err.code == 'failed-precondition') {
        // Несколько вкладок открыто
        console.warn('Persistence failed: Multiple tabs open');
    } else if (err.code == 'unimplemented') {
        // Браузер не поддерживает
        console.warn('Persistence not available');
    }
});

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
    signOut,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    where,
    orderBy,
    limit,
    onSnapshot,
    Timestamp
};
