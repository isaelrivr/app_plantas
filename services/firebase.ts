/**
 * Configuración de Firebase (Auth y Firestore)
 * 
 * NOTA DE ARQUITECTURA:
 * La aplicación actualmente funciona de forma autónoma con datos mock y Context API.
 * Para conectar Firebase en producción:
 * 1. Instala los paquetes:
 *    npx expo install firebase
 * 2. Reemplaza los valores de `firebaseConfig` con las credenciales de tu consola de Firebase.
 * 3. Descomenta las importaciones y la inicialización de `initializeApp`, `getAuth` y `getFirestore`.
 */

export const firebaseConfig = {
  apiKey: "AIzaSyYOUR_API_KEY_HERE",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

/*
// Ejemplo de inicialización cuando instales la librería:
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
*/

export const isFirebaseConfigured = false;
