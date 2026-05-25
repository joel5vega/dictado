import { useEffect, useState, useRef } from 'react'
import {
  addSubmission,
  listenSubmissions,
  listenSessions,
  signInTeacher,
  onAuthChange,
  updateSessionText,
} from './firebase'
import './App.css'

const coursesOptions = [
  '2A', '2B',
  '3A', '3B',
  '4A', '4B',
  '5A', '5B',
  '6A', '6B',
]

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function App() {
  const [text, setText] = useState('')
  const [name, setName] = useState('')
  const [course, setCourse] = useState('')

  const [submissions, setSubmissions] = useState([])
  const [sessions, setSessions] = useState([])
  const [user, setUser] = useState(null)

  const [isTeacherView, setIsTeacherView] = useState(false)
  const [loadingAuth, setLoadingAuth] = useState(false)
  const [teacherCourseFilter, setTeacherCourseFilter] = useState('ALL')

  const [teacherKeyUnlocked, setTeacherKeyUnlocked] = useState(false)
  const [teacherEmail, setTeacherEmail] = useState('')
  const [teacherPassword, setTeacherPassword] = useState('')
  const [teacherError, setTeacherError] = useState('')

  const [sendCelebration, setSendCelebration] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showHappyOverlay, setShowHappyOverlay] = useState(false)

  const autosaveTimeout = useRef(null)

  useEffect(() => {
    const unsubAuth = onAuthChange((u) => {
      setUser(u)
      setLoadingAuth(false)
      if (u) {
        setIsTeacherView(true)
      }
    })

    listenSubmissions(setSubmissions)
    listenSessions(setSessions)

    return () => {
      unsubAuth()
    }
  }, [])

  const autosave = async (value, studentName, studentCourse) => {
    try {
      await updateSessionText(value, user?.uid, studentName, studentCourse)
    } catch (e) {
      console.error('Autosave error', e)
    }
  }

  const scheduleAutosave = (value, studentName, studentCourse) => {
    if (autosaveTimeout.current) {
      clearTimeout(autosaveTimeout.current)
    }
    autosaveTimeout.current = setTimeout(() => {
      autosave(value, studentName, studentCourse)
    }, 800)
  }

  const handleLetterClick = (letter) => {
    const newText = text + letter
    setText(newText)
    scheduleAutosave(newText, name, course)
  }

  const handleBackspaceClick = () => {
    if (!text) return
    const newText = text.slice(0, -1)
    setText(newText)
    scheduleAutosave(newText, name, course)
  }

  const handleTextChange = (e) => {
    const value = e.target.value
    setText(value)
    scheduleAutosave(value, name, course)
  }

  const handleNameChange = (e) => {
    const newName = e.target.value
    setName(newName)

    // nombre secreto para teacher
    if (newName === 'lunaroja') {
      setTeacherKeyUnlocked(true)
      setTeacherError('')
    } else {
      setTeacherKeyUnlocked(false)
    }

    scheduleAutosave(text, newName, course)
  }

  const handleCourseChange = (e) => {
    const newCourse = e.target.value
    setCourse(newCourse)
    scheduleAutosave(text, name, newCourse)
  }

  const handleSend = async () => {
    const trimmedText = text.trim()
    const trimmedName = name.trim()

    // evitar submissions con nombre de teacher key
    if (trimmedName === 'lunaroja') return
    if (!trimmedName || !course || !trimmedText) return

    try {
      await addSubmission(trimmedText, user?.uid, trimmedName, course)
      setText('')

      setSendCelebration(true)
      setSuccessMessage('Great job! ✨')
      setShowHappyOverlay(true)

      setTimeout(() => {
        setSendCelebration(false)
        setSuccessMessage('')
        setShowHappyOverlay(false)
      }, 1500)
    } catch (e) {
      console.error('Error sending submission', e)
    }
  }

  const handleTeacherLogin = async (e) => {
    e.preventDefault()
    setLoadingAuth(true)
    setTeacherError('')
    try {
      await signInTeacher(teacherEmail, teacherPassword)
      setIsTeacherView(true)
    } catch (err) {
      console.error(err)
      setTeacherError('Login failed')
      setIsTeacherView(false)
      setLoadingAuth(false)
    }
  }

  const handleTeacherCourseFilterChange = (e) => {
    setTeacherCourseFilter(e.target.value)
  }

  const filteredSubmissions =
    teacherCourseFilter === 'ALL'
      ? submissions
      : submissions.filter((s) => s.course === teacherCourseFilter)

  const filteredSessions =
    teacherCourseFilter === 'ALL'
      ? sessions
      : sessions.filter((s) => s.course === teacherCourseFilter)

  const isTeacherLogged = !!user && isTeacherView
  const hasName = name.trim().length > 0
  const hasCourse = !!course

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-badge">👩‍🚀⭐</div>
        <h1>Space Dictation</h1>
        <p>Write your sentence among the stars.</p>
      </header>

      <main className="app-main">
        {/* Vista estudiante */}
        {!isTeacherLogged && (
          <section className="input-section">
            {/* Paso 1: Name */}
            <div className="step-title">
              <span className="step-badge">1</span>
              <span>Write your name</span>
            </div>
            <input
              className="input-text"
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="Your name"
            />

            {/* Paso 2: Course */}
            {hasName && (
              <>
                <div className="step-title">
                  <span className="step-badge">2</span>
                  <span>Choose your course</span>
                </div>
                <select
                  className="input-select"
                  value={course}
                  onChange={handleCourseChange}
                >
                  <option value="">Choose your course</option>
                  {coursesOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </>
            )}

            {/* Paso 3: Teclado + texto */}
            {hasName && hasCourse && (
              <>
                <div className="step-title">
                  <span className="step-badge">3</span>
                  <span>Build your sentence</span>
                </div>

                <div className="letters-keyboard">
                  {alphabet.map((letter) => (
                    <button
                      key={letter}
                      type="button"
                      className="letter-button"
                      onClick={() => handleLetterClick(letter)}
                    >
                      {letter}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="letter-button letter-button-delete"
                    onClick={handleBackspaceClick}
                  >
                    ⌫
                  </button>
                </div>

                <label className="input-label">Your sentence</label>
                <textarea
                  className="input-textarea"
                  value={text}
                  onChange={handleTextChange}
                  placeholder="I like English."
                />

                <button
                  className={`btn-primary ${
                    sendCelebration ? 'btn-primary-celebrate' : ''
                  }`}
                  onClick={handleSend}
                >
                  Send 🙂
                </button>

                {successMessage && (
                  <p className="success-message">{successMessage}</p>
                )}
              </>
            )}
          </section>
        )}

        {/* Sección teacher */}
        <section className="teacher-section">
          {/* Login teacher (desbloqueado por nombre lunaroja) */}
          {!isTeacherLogged && teacherKeyUnlocked && (
            <form
              className="teacher-login-form"
              onSubmit={handleTeacherLogin}
            >
              <h2 className="teacher-title">Teacher area</h2>
              <label className="input-label">
                Teacher email
                <input
                  className="input-text"
                  type="email"
                  value={teacherEmail}
                  onChange={(e) => setTeacherEmail(e.target.value)}
                  placeholder="beth@school.local"
                />
              </label>

              <label className="input-label">
                Password
                <input
                  className="input-text"
                  type="password"
                  value={teacherPassword}
                  onChange={(e) => setTeacherPassword(e.target.value)}
                  placeholder="Password"
                />
              </label>

              {teacherError && (
                <p className="error-text">{teacherError}</p>
              )}

              <button
                className="btn-secondary"
                type="submit"
                disabled={loadingAuth}
              >
                {loadingAuth ? 'Logging in...' : 'Teacher login'}
              </button>
            </form>
          )}

          {/* Vista teacher */}
          {isTeacherLogged && (
            <div className="teacher-panels">
              <div className="list-panel">
                <div className="teacher-controls">
                  <h2>Live typing (sessions)</h2>
                  <label className="input-label">
                    Course filter
                    <select
                      className="input-select"
                      value={teacherCourseFilter}
                      onChange={handleTeacherCourseFilterChange}
                    >
                      <option value="ALL">All courses</option>
                      {coursesOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <ul className="list">
                  {filteredSessions.map((s) => (
                    <li key={s.id} className="list-item">
                      <strong>{s.name || 'No name'}</strong>{' '}
                      <span>({s.course || 'No course'})</span>
                      <div className="list-text">
                        {s.text || '<empty>'}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="list-panel">
                <div className="teacher-controls">
                  <h2>Final sentences (submissions)</h2>
                </div>

                <ul className="list">
                  {filteredSubmissions.map((s) => (
                    <li key={s.id} className="list-item">
                      <strong>{s.name || 'No name'}</strong>{' '}
                      <span>({s.course || 'No course'})</span>
                      <div className="list-text">
                        {s.text}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>
      </main>

      {showHappyOverlay && (
        <div className="happy-overlay">
          <div className="happy-face">
            <span className="happy-emoji">😊</span>
            <p className="happy-text">Great job!</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App