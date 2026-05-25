import { useEffect, useState, useRef } from 'react'
import {
  addSubmission,
  listenSubmissions,
  signInAnon,
  onAuthChange,
  updateSessionText,
} from './firebase'

function App() {
  const [text, setText] = useState('')
  const [submissions, setSubmissions] = useState([])
  const [user, setUser] = useState(null)
  const [isTeacherView, setIsTeacherView] = useState(false)
  const [loadingAuth, setLoadingAuth] = useState(false)
  const autosaveTimeout = useRef(null)

  useEffect(() => {
    const unsubAuth = onAuthChange((u) => {
      setUser(u)
      setLoadingAuth(false)
    })
    const unsubData = listenSubmissions(setSubmissions)
    return () => {
      unsubAuth()
      // para sessions usaríamos off() si añadimos escucha
    }
  }, [])

  const autosave = async (value) => {
    // guarda texto actual de esta sesión en /sessions
    try {
      await updateSessionText(value, user?.uid)
    } catch (e) {
      console.error('Autosave error', e)
    }
  }

  const handleChange = (e) => {
    const value = e.target.value
    setText(value)

    if (autosaveTimeout.current) {
      clearTimeout(autosaveTimeout.current)
    }
    autosaveTimeout.current = setTimeout(() => {
      autosave(value)
    }, 800) // pausa de 0.8s antes de guardar
  }

  const handleSend = async () => {
    if (!text.trim()) return
    await addSubmission(text.trim(), user?.uid)
  }

  const handleTeacherMode = async () => {
    if (user) {
      setIsTeacherView((prev) => !prev)
      return
    }
    setLoadingAuth(true)
    try {
      await signInAnon()
      setIsTeacherView(true)
    } catch (e) {
      console.error(e)
      setLoadingAuth(false)
    }
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Dictation</h1>
        <p>Write the sentence. It saves as you type.</p>
      </header>

      <main className="app-main">
        <section className="input-section">
          <label className="input-label">Your sentence</label>
          <textarea
            className="input-textarea"
            value={text}
            onChange={handleChange}
            placeholder="I like English."
          />
          <button className="btn-primary" onClick={handleSend}>
            Send
          </button>
        </section>

        <section className="teacher-section">
          <button
            className="btn-secondary"
            onClick={handleTeacherMode}
            disabled={loadingAuth}
          >
            {isTeacherView ? 'Hide teacher view' : 'Teacher mode'}
          </button>

          {isTeacherView && (
            <div className="list-panel">
              <h2>All sentences</h2>
              <ul className="list">
                {submissions.map((s) => (
                  <li key={s.id} className="list-item">
                    {s.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App