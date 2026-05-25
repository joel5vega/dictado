import { useEffect, useState } from 'react'
import {
  addSubmission,
  listenSubmissions,
  signInAnon,
  onAuthChange,
} from './firebase'
import './App.css'

function App() {
  const [text, setText] = useState('')
  const [submissions, setSubmissions] = useState([])
  const [user, setUser] = useState(null)
  const [isTeacherView, setIsTeacherView] = useState(false)
  const [loadingAuth, setLoadingAuth] = useState(false)

  useEffect(() => {
    const unsubAuth = onAuthChange((u) => {
      setUser(u)
      setLoadingAuth(false)
    })
    const unsubData = listenSubmissions(setSubmissions)
    return () => {
      unsubAuth()
      // onValue no da función de cleanup directa; en un proyecto
      // grande usarías off() con la referencia
    }
  }, [])

  const handleSend = async () => {
    if (!text.trim()) return
    await addSubmission(text.trim(), user?.uid)
    setText('')
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
        <p>Write the sentence. Press Send.</p>
      </header>

      <main className="app-main">
        <section className="input-section">
          <label className="input-label">Your sentence</label>
          <textarea
            className="input-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
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