import { initializeApp } from 'firebase/app'
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
} from 'firebase/auth'
import {
  getDatabase,
  ref,
  push,
  serverTimestamp,
  onValue,
} from 'firebase/database'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getDatabase(app)

const submissionsRef = ref(db, 'submissions')

const addSubmission = async (text, uid) => {
  return push(submissionsRef, {
    text,
    uid: uid ?? null,
    createdAt: serverTimestamp(),
  })
}

const listenSubmissions = (callback) => {
  onValue(submissionsRef, (snapshot) => {
    const data = snapshot.val() || {}
    const list = Object.entries(data).map(([id, value]) => ({
      id,
      ...value,
    }))
    callback(list)
  })
}

const signInAnon = () => signInAnonymously(auth)

const onAuthChange = (callback) => onAuthStateChanged(auth, callback)

export {
  auth,
  db,
  addSubmission,
  listenSubmissions,
  signInAnon,
  onAuthChange,
}