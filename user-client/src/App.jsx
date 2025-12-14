import { useEffect, useMemo, useState } from 'react'
import {
  fetchModels,
  fetchSlots,
  fetchProfile,
  loginUser,
  registerUser,
} from './api'
import {
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  LogoutIcon,
  MailIcon,
  MoonIcon,
  RefreshIcon,
  ShieldIcon,
  SunIcon,
  UserIcon,
  UsersIcon,
} from './icons'

function Hero() {
  return (
    <header className="hero">
      <div>
        <div className="tag-pill">Public booking portal</div>
        <h1>Reserve time with our models</h1>
        <p className="lead">
          Sign in to explore which models are available and keep your profile up to date. Everything is
          powered by the same backend as the admin console.
        </p>
        <div className="status-line">
          <span className="status-dot" />
          <span>API base:</span>
          <code className="code">{import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'}</code>
        </div>
      </div>
    </header>
  )
}

function AuthPanel({ mode, onModeChange, onLogin, onRegister, loading, error }) {
  const isLogin = mode === 'login'
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isLogin) onLogin({ email: form.email, password: form.password })
    else onRegister(form)
  }

  return (
    <div className="card auth-card">
      <div className="control-bar">
        <div>
          <h2>{isLogin ? 'Welcome back' : 'Create an account'}</h2>
          <p className="subtitle">
            {isLogin ? 'Log in with your email and password.' : 'Sign up with your name, email, and a password.'}
          </p>
        </div>
        <div className="section-actions">
          <button className="btn tertiary" onClick={() => onModeChange(isLogin ? 'register' : 'login')} type="button">
            {isLogin ? 'Need an account?' : 'Have an account?'}
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <form className="form-grid" onSubmit={handleSubmit}>
        {!isLogin && (
          <>
            <label className="form-field">
              <span>First name</span>
              <input name="firstName" value={form.firstName} onChange={handleChange} required={!isLogin} />
            </label>
            <label className="form-field">
              <span>Last name</span>
              <input name="lastName" value={form.lastName} onChange={handleChange} required={!isLogin} />
            </label>
          </>
        )}
        <label className="form-field">
          <span>Email</span>
          <input name="email" type="email" value={form.email} onChange={handleChange} required />
        </label>
        <label className="form-field">
          <span>Password</span>
          <input name="password" type="password" value={form.password} onChange={handleChange} required />
        </label>
        <button className="btn primary" type="submit" disabled={loading}>
          {loading ? 'Submitting…' : isLogin ? 'Login' : 'Register'}
        </button>
      </form>
    </div>
  )
}

function NavTabs({ page, onChange }) {
  return (
    <nav className="tabs">
      <button className={page === 'availability' ? 'tab active' : 'tab'} onClick={() => onChange('availability')}>
        <ClockIcon size={16} /> Availability
      </button>
      <button className={page === 'profile' ? 'tab active' : 'tab'} onClick={() => onChange('profile')}>
        <UserIcon size={16} /> Profile
      </button>
    </nav>
  )
}

function AvailabilityView({ models, slots, loading, onRefresh }) {
  const activeSlots = useMemo(() => slots.filter((slot) => slot.isActive), [slots])
  const grouped = useMemo(() => {
    const map = new Map()
    models.forEach((model) => map.set(model._id, { model, slots: [] }))
    activeSlots.forEach((slot) => {
      const modelId = slot.model?._id || slot.model
      if (map.has(modelId)) {
        map.get(modelId).slots.push(slot)
      }
    })
    return Array.from(map.values())
  }, [models, activeSlots])

  return (
    <div className="card">
      <div className="control-bar">
        <div>
          <h2>
            <CalendarIcon size={18} /> Upcoming availability
          </h2>
          <p className="subtitle">Browse models and see which time slots are marked active.</p>
        </div>
        <div className="section-actions">
          <button className="btn secondary" onClick={onRefresh} disabled={loading}>
            <RefreshIcon size={16} /> {loading ? 'Refreshing…' : 'Reload'}
          </button>
        </div>
      </div>

      {loading && <p className="helper">Loading availability…</p>}
      {!loading && !grouped.length && <p className="helper">No models available yet.</p>}

      <div className="model-grid">
        {grouped.map(({ model, slots: modelSlots }) => (
          <div key={model._id} className="model-card">
            <div className="model-header">
              <div className="model-avatar">{model.name.slice(0, 1).toUpperCase()}</div>
              <div>
                <h3>{model.name}</h3>
                <p className="helper">{modelSlots.length} active slot(s)</p>
              </div>
            </div>
            <ul className="slot-list">
              {modelSlots.length === 0 && <li className="helper">No active slots yet</li>}
              {modelSlots.map((slot) => (
                <li key={slot._id}>
                  <CheckIcon size={14} />
                  <span>
                    {new Date(slot.startDateTime).toLocaleString()} → {new Date(slot.endDateTime).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProfileView({ user, onLogout }) {
  return (
    <div className="card">
      <div className="control-bar">
        <div>
          <h2>
            <UserIcon size={18} /> Profile
          </h2>
          <p className="subtitle">Review the details you used to register.</p>
        </div>
        <div className="section-actions">
          <button className="btn secondary" onClick={onLogout}>
            <LogoutIcon size={16} /> Logout
          </button>
        </div>
      </div>

      <div className="profile-grid">
        <div className="profile-item">
          <span className="label">First name</span>
          <span>{user.firstName}</span>
        </div>
        <div className="profile-item">
          <span className="label">Last name</span>
          <span>{user.lastName}</span>
        </div>
        <div className="profile-item">
          <span className="label">Email</span>
          <span className="pill">
            <MailIcon size={14} /> {user.email}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [authMode, setAuthMode] = useState('login')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const [page, setPage] = useState('availability')
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('userToken') || '')

  const [models, setModels] = useState([])
  const [slots, setSlots] = useState([])
  const [loadingData, setLoadingData] = useState(false)
  const [dataError, setDataError] = useState('')

  const stats = useMemo(
    () => ({
      models: models.length,
      activeSlots: slots.filter((slot) => slot.isActive).length,
    }),
    [models, slots]
  )

  const applyAuth = (nextToken, profile) => {
    localStorage.setItem('userToken', nextToken)
    setToken(nextToken)
    setUser(profile)
  }

  const handleLogin = async (payload) => {
    setAuthLoading(true)
    setAuthError('')
    try {
      const res = await loginUser(payload)
      applyAuth(res.token, res.user)
      await loadData(res.token)
    } catch (e) {
      setAuthError(e.message)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleRegister = async (payload) => {
    setAuthLoading(true)
    setAuthError('')
    try {
      const res = await registerUser(payload)
      applyAuth(res.token, res.user)
      await loadData(res.token)
    } catch (e) {
      setAuthError(e.message)
    } finally {
      setAuthLoading(false)
    }
  }

  const loadProfile = async (tkn) => {
    try {
      const res = await fetchProfile(tkn)
      setUser(res.user)
    } catch (e) {
      setToken('')
      localStorage.removeItem('userToken')
    }
  }

  const loadData = async (tkn = token) => {
    setLoadingData(true)
    setDataError('')
    try {
      const [modelData, slotData] = await Promise.all([fetchModels(tkn), fetchSlots()])
      setModels(modelData)
      setSlots(slotData)
    } catch (e) {
      setDataError(e.message)
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    if (token) {
      loadProfile(token)
      loadData(token)
    }
  }, [token])

  const handleLogout = () => {
    localStorage.removeItem('userToken')
    setToken('')
    setUser(null)
    setModels([])
    setSlots([])
    setPage('availability')
  }

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <div className="app-shell">
      <div className="toolbar">
        <button className="toggle" onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}>
          {theme === 'dark' ? <MoonIcon size={18} /> : <SunIcon size={18} />}
          <span>{theme === 'dark' ? 'Dark' : 'Light'} mode</span>
        </button>
      </div>

      <Hero />

      {user ? (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <ShieldIcon size={18} />
              </div>
              <div>
                <p className="stat-label">Active slots</p>
                <p className="stat-value">{stats.activeSlots}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <UsersIcon size={18} />
              </div>
              <div>
                <p className="stat-label">Models</p>
                <p className="stat-value">{stats.models}</p>
              </div>
            </div>
          </div>

          <NavTabs page={page} onChange={setPage} />

          {dataError && <div className="error">{dataError}</div>}

          {page === 'availability' && (
            <AvailabilityView models={models} slots={slots} loading={loadingData} onRefresh={() => loadData(token)} />
          )}
          {page === 'profile' && <ProfileView user={user} onLogout={handleLogout} />}
        </>
      ) : (
        <AuthPanel
          mode={authMode}
          onModeChange={setAuthMode}
          onLogin={handleLogin}
          onRegister={handleRegister}
          loading={authLoading}
          error={authError}
        />
      )}
    </div>
  )
}
