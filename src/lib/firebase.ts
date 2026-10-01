// ============================================
// CONFIGURACION DE FIREBASE
// ============================================
// INSTRUCCIONES:
// 1. Ve a https://console.firebase.google.com
// 2. Crea un proyecto nuevo
// 3. Ve a Configuracion del proyecto (icono de engranaje)
// 4. En "Tus apps", añade una app Web
// 5. Copia el objeto firebaseConfig que te dan
// 6. PEGA AQUI abajo, reemplazando TODO lo que hay entre las llaves
// ============================================

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAC4Lzvxd-lVQ3b0KM4f4zzTJ6D4zOZ-mo",
  authDomain: "noche-de-cartas.firebaseapp.com",
  projectId: "noche-de-cartas",
  storageBucket: "noche-de-cartas.firebasestorage.app",
  messagingSenderId: "638455937897",
  appId: "1:638455937897:web:49fb53454fb24addbddbf8",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
