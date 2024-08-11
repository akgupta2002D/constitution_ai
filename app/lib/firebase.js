// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics } from 'firebase/analytics'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyDJFGchnpZRdulWXB61EBluKZr8R73z_Qk',
  authDomain: 'customer-support-ai-44f96.firebaseapp.com',
  projectId: 'customer-support-ai-44f96',
  storageBucket: 'customer-support-ai-44f96.appspot.com',
  messagingSenderId: '8537396826',
  appId: '1:8537396826:web:19e6010ac28e41ef432a63',
  measurementId: 'G-TWMT17Y5B9'
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
// const analytics = getAnalytics(app)

// Export db
export const db = getFirestore(app)
