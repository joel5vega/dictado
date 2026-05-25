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

function App() {
  const [text, setText] = useState('')
  const [name, setName] = useState('')
  const [course, setCourse] = useState('2A')

  const [submissions, setSubmissions] = useState([])
  const [sessions, setSessions] = useState([])
  const [user, setUser] = useState(null)

  const [isTeacherView, setIsTeacherView] = useState(false)
  const [loadingAuth, setLoadingAuth] = useState(false)
  const [teacherCourseFilter, setTeacherCourseFilter] = useState('ALL')

  // teacher access
  const [teacherKeyInput, setTeacherKeyInput] = useState('')
  const [teacherKeyUnlocked, setTeacherKeyUnlocked] = useState(false)
  const [teacherEmail, setTeacherEmail] = useState('')
  const [teacherPassword, setTeacherPassword] = useState('')
  const [teacherError, setTeacherError] = useState('')

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

  const handleTextChange = (e) => {
    const value = e.target.value
    setText(value)
    scheduleAutosave(value, name, course)
  }

  const handleNameChange = (e) => {
    const newName = e.target.value
    setName(newName)
    scheduleAutosave(text, newName, course)
  }

  const handleCourseChange = (e) => {
    const newCourse = e.target.value
    setCourse(newCourse)
    scheduleAutosave(text, name, newCourse)
  }

  const handleSend = async () => {
    if (!text.trim()) return
    await addSubmission(text.trim(), user?.uid, name.trim(), course)
  }

  // clave secreta para desbloquear login teacher
  const handleTeacherKeySubmit = (e) => {
    e.preventDefault()
    if (teacherKeyInput === 'lunaroja') {
      setTeacherKeyUnlocked(true)
      setTeacherError('')
    } else {
      setTeacherError('Wrong key')
      setTeacherKeyUnlocked(false)
    }
  }

  // login email/password para teacher
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

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Dictation</h1>
        <p>Write the sentence. It saves as you type.</p>
      </header>

      <main className="app-main">
        {/* Vista estudiante: solo si NO hay teacher logueado */}
        {!isTeacherLogged && (
          <section className="input-section">
            <label className="input-label">Name</label>
            <input
              className="input-text"
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="Your name"
            />

            <label className="input-label">Course</label>
            <select
              className="input-select"
              value={course}
              onChange={handleCourseChange}
            >
              {coursesOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <label className="input-label">Your sentence</label>
            <textarea
              className="input-textarea"
              value={text}
              onChange={handleTextChange}
              placeholder="I like English."
            />

            <button className="btn-primary" onClick={handleSend}>
              Send
            </button>
          </section>
        )}

        {/* Sección teacher */}
        <section className="teacher-section">
          {/* Si teacher NO está logueado, mostramos key + login */}
          {!isTeacherLogged && (
            <>
              <form
                className="teacher-key-form"
                onSubmit={handleTeacherKeySubmit}
              >
                <label className="input-label">
                  Teacher key
                  <input
                    className="input-text"
                    type="password"
                    value={teacherKeyInput}
                    onChange={(e) => setTeacherKeyInput(e.target.value)}
                    placeholder="Teacher key"
                  />
                </label>
                <button className="btn-secondary" type="submit">
                  Unlock teacher login
                </button>
              </form>

              {teacherKeyUnlocked && (
                <form
                  className="teacher-login-form"
                  onSubmit={handleTeacherLogin}
                >
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
            </>
          )}

          {/* Vista teacher: live typing + final sentences */}
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
    </div>
  )
}

export default App