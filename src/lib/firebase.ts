import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "sustained-city-z8gvj",
  appId: "1:735277982102:web:48e5bc35bee331eafe3db7",
  apiKey: "AIzaSyB3jEXvge7neg2HWOg_cKhRs82_i-9zYgA",
  authDomain: "sustained-city-z8gvj.firebaseapp.com",
  storageBucket: "sustained-city-z8gvj.firebasestorage.app",
  messagingSenderId: "735277982102"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom database ID
export const db = getFirestore(app, "ai-studio-billingsystemkom-b7f836d3-7752-44f8-ba11-b0c7dcb20cd5");

