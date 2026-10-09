import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDQ2pMUbdVSo1vdVC2vI4OD0L_xcm3Pg0I",
  authDomain: "entre-nosotros-16e41.firebaseapp.com",
  projectId: "entre-nosotros-16e41",
  storageBucket: "entre-nosotros-16e41.firebasestorage.app",
  messagingSenderId: "977266156499",
  appId: "1:977266156499:web:16cb1e724de255c097c526"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
