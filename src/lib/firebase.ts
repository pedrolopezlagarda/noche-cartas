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
  // REEMPLAZA ESTO CON TU CONFIGURACION DE FIREBASE:
  apiKey: "Pega aqui tu apiKey",
  authDomain: "Pega aqui tu authDomain",
  projectId: "Pega aqui tu projectId",
  storageBucket: "Pega aqui tu storageBucket",
  messagingSenderId: "Pega aqui tu messagingSenderId",
  appId: "Pega aqui tu appId",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
