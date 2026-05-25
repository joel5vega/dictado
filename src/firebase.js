import { initializeApp } from 'firebase/app'
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import {
  getDatabase,
  ref,
  push,
  serverTimestamp,
  onValue,
  set,
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

// submissions (frases finales)
const submissionsRef = ref(db, 'submissions')
const sessionsRef = ref(db, 'sessions')
const addSubmission = async (text, uid, name, course) => {
  return push(submissionsRef, {
    text,
    name: name ?? '',
    course: course ?? '',
    uid: uid ?? null,
    createdAt: serverTimestamp(),
  })
}

// sessions (texto en vivo por sesión)
const listenSessions = (callback) => {
  onValue(sessionsRef, (snapshot) => {
    const data = snapshot.val() || {}
    const list = Object.entries(data).map(([id, value]) => ({
      id,
      ...value,
    }))
    callback(list)
  })
}

const getSessionId = () => {
  const key = 'dictado_session_id'
  let val = localStorage.getItem(key)
  if (!val) {
    val = crypto.randomUUID()
    localStorage.setItem(key, val)
  }
  return val
}

const getSessionRef = () => {
  const sessionId = getSessionId()
  return ref(db, `sessions/${sessionId}`)
}

const updateSessionText = async (text, uid, name, course) => {
  const sessionRef = getSessionRef()
  return set(sessionRef, {
    text,
    name: name ?? '',
    course: course ?? '',
    uid: uid ?? null,
    updatedAt: serverTimestamp(),
  })
}

// teacher view: escucha submissions
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

// login teacher con email/contraseña
const signInTeacher = (email, password) =>
  signInWithEmailAndPassword(auth, email, password)

const onAuthChange = (callback) => onAuthStateChanged(auth, callback)

export {
  auth,
  db,
  addSubmission,
  listenSubmissions,
  signInTeacher,
  onAuthChange,
  updateSessionText,
  listenSessions
}