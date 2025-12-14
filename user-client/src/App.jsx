import { useEffect, useMemo, useState } from 'react'
import {
  fetchModels,
  fetchSlots,
  fetchProfile,
  loginUser,
  registerUser,
  fetchMyReservations,
  createMyReservation,
  updateMyReservation,
  deleteMyReservation,
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

function toDatetimeLocal(value) {
  if (!value) return ''
  const date = new Date(value)
  const tzOffset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16)
}

function toIso(value) {
  return value ? new Date(value).toISOString() : ''
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
      <button className={page === 'reservations' ? 'tab active' : 'tab'} onClick={() => onChange('reservations')}>
        <CalendarIcon size={16} /> Reservations
      </button>
      <button className={page === 'profile' ? 'tab active' : 'tab'} onClick={() => onChange('profile')}>
        <UserIcon size={16} /> Profile
      </button>
    </nav>
  )
}

function AvailabilityView({ models, slots, loading, onRefresh, onReserve, myReservations, submitting }) {
  const activeSlots = useMemo(() => slots.filter((slot) => slot.isActive), [slots])
  const reservationMap = useMemo(() => {
    const map = new Map()
    myReservations.forEach((r) => {
      const id = r.slot?._id || r.slot
      map.set(id, r)
    })
    return map
  }, [myReservations])
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
          <p className="subtitle">
            Browse models and click an active slot to pick the exact start and end time you want.
          </p>
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
              {modelSlots.map((slot) => {
                const existing = reservationMap.get(slot._id)
                return (
                  <li key={slot._id}>
                    <CheckIcon size={14} />
                    <span>
                      {new Date(slot.startDateTime).toLocaleString()} → {new Date(slot.endDateTime).toLocaleString()}
                    </span>
                    {existing && <span className="pill">You reserved</span>}
                    <button
                      className="btn tertiary"
                      style={{ marginLeft: 8 }}
                      onClick={() => onReserve(slot)}
                      disabled={submitting && !existing}
                    >
                      {existing ? 'View details' : submitting ? 'Opening…' : 'Select time'}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReservationModal({ slot, reservation, onClose, onSubmit, submitting }) {
  const [startDateTime, setStartDateTime] = useState(
    toDatetimeLocal(reservation?.startDateTime || slot.startDateTime)
  )
  const [endDateTime, setEndDateTime] = useState(toDatetimeLocal(reservation?.endDateTime || slot.endDateTime))
  const [notes, setNotes] = useState(reservation?.notes || '')
  const [error, setError] = useState('')

  useEffect(() => {
    setStartDateTime(toDatetimeLocal(reservation?.startDateTime || slot.startDateTime))
    setEndDateTime(toDatetimeLocal(reservation?.endDateTime || slot.endDateTime))
    setNotes(reservation?.notes || '')
    setError('')
  }, [slot, reservation])

  const minTime = toDatetimeLocal(slot.startDateTime)
  const maxTime = toDatetimeLocal(slot.endDateTime)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    const start = new Date(startDateTime)
    const end = new Date(endDateTime)
    if (!(start < end)) {
      setError('End time must be after start time.')
      return
    }
    if (start < new Date(slot.startDateTime) || end > new Date(slot.endDateTime)) {
      setError('Please choose times within the available slot window.')
      return
    }
    onSubmit({ slotId: slot._id, startDateTime, endDateTime, notes })
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <div>
            <p className="tag-pill">{slot.model?.name || 'Model'} availability</p>
            <h3>Select your time</h3>
            <p className="helper">
              {new Date(slot.startDateTime).toLocaleString()} → {new Date(slot.endDateTime).toLocaleString()}
            </p>
          </div>
          <button className="btn ghost" onClick={onClose} type="button">
            Close
          </button>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Start time</span>
            <input
              type="datetime-local"
              value={startDateTime}
              min={minTime}
              max={maxTime}
              onChange={(e) => setStartDateTime(e.target.value)}
              required
            />
          </label>

          <label className="form-field">
            <span>End time</span>
            <input
              type="datetime-local"
              value={endDateTime}
              min={minTime}
              max={maxTime}
              onChange={(e) => setEndDateTime(e.target.value)}
              required
            />
          </label>

          <label className="form-field">
            <span>Notes</span>
            <textarea
              value={notes}
              placeholder="Optional details for the model"
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn secondary" type="button" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button className="btn primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : reservation ? 'Update reservation' : 'Reserve time'}
            </button>
          </div>

          {error && <div className="error">{error}</div>}
          {reservation && <p className="helper">You already reserved this slot; updating will replace your time.</p>}
        </form>
      </div>
    </div>
  )
}

function ReservationsView({ reservations, slots, onUpdate, onDelete, submitting }) {
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ slotId: '', startDateTime: '', endDateTime: '', notes: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    if (editing) {
      setForm({
        slotId: editing.slot?._id || editing.slot || '',
        startDateTime: toDatetimeLocal(editing.startDateTime),
        endDateTime: toDatetimeLocal(editing.endDateTime),
        notes: editing.notes || '',
      })
    } else {
      setForm({ slotId: '', startDateTime: '', endDateTime: '', notes: '' })
    }
    setError('')
  }, [editing])

  const slotOptions = useMemo(() => {
    const active = slots.filter((slot) => slot.isActive || slot._id === form.slotId)
    return active
      .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime))
      .map((slot) => ({
        id: slot._id,
        label: `${slot.model?.name || 'Model'} — ${new Date(slot.startDateTime).toLocaleString()} → ${new Date(
          slot.endDateTime
        ).toLocaleString()}`,
      }))
  }, [slots, form.slotId])

  const selectedSlot = useMemo(
    () => slots.find((slot) => slot._id === form.slotId) || null,
    [slots, form.slotId]
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!editing) return
    setError('')
    const start = new Date(form.startDateTime)
    const end = new Date(form.endDateTime)
    if (!(start < end)) {
      setError('End time must be after start time.')
      return
    }
    if (selectedSlot) {
      if (start < new Date(selectedSlot.startDateTime) || end > new Date(selectedSlot.endDateTime)) {
        setError('Pick times that sit within the slot availability window.')
        return
      }
    }

    onUpdate(editing._id, form)
  }

  return (
    <div className="card">
      <div className="control-bar">
        <div>
          <h2>
            <CalendarIcon size={18} /> Your reservations
          </h2>
          <p className="subtitle">Update or cancel reservations you created.</p>
        </div>
      </div>

      {!reservations.length && <p className="helper">You have not made any reservations yet.</p>}

      {reservations.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>Model</th>
              <th>Times</th>
              <th>Notes</th>
              <th style={{ width: 170 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((reservation) => (
              <tr key={reservation._id}>
                <td>{reservation.model?.name || reservation.slot?.model?.name || 'Model'}</td>
                <td>
                  <div className="pill">
                    <CalendarIcon size={14} />
                    <span>
                      {new Date(reservation.startDateTime).toLocaleString()} →{' '}
                      {new Date(reservation.endDateTime).toLocaleString()}
                    </span>
                  </div>
                </td>
                <td className="mono">{reservation.notes || '—'}</td>
                <td className="actions">
                  <button className="btn tertiary" onClick={() => setEditing(reservation)}>
                    Edit
                  </button>
                  <button className="btn ghost danger" onClick={() => onDelete(reservation._id)} disabled={submitting}>
                    Cancel
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing && (
        <form className="form-grid" style={{ marginTop: 16 }} onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Pick a different slot</span>
            <select
              name="slotId"
              value={form.slotId}
              onChange={(e) => {
                const nextSlot = slots.find((slot) => slot._id === e.target.value)
                setForm((prev) => ({
                  ...prev,
                  slotId: e.target.value,
                  startDateTime: toDatetimeLocal(nextSlot?.startDateTime || ''),
                  endDateTime: toDatetimeLocal(nextSlot?.endDateTime || ''),
                }))
              }}
              required
            >
              <option value="" disabled>
                Select a slot
              </option>
              {slotOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>Start time</span>
            <input
              type="datetime-local"
              name="startDateTime"
              min={selectedSlot ? toDatetimeLocal(selectedSlot.startDateTime) : undefined}
              max={selectedSlot ? toDatetimeLocal(selectedSlot.endDateTime) : undefined}
              value={form.startDateTime}
              onChange={(e) => setForm((prev) => ({ ...prev, startDateTime: e.target.value }))}
              required
            />
          </label>

          <label className="form-field">
            <span>End time</span>
            <input
              type="datetime-local"
              name="endDateTime"
              min={selectedSlot ? toDatetimeLocal(selectedSlot.startDateTime) : undefined}
              max={selectedSlot ? toDatetimeLocal(selectedSlot.endDateTime) : undefined}
              value={form.endDateTime}
              onChange={(e) => setForm((prev) => ({ ...prev, endDateTime: e.target.value }))}
              required
            />
          </label>

          <label className="form-field">
            <span>Notes</span>
            <textarea
              name="notes"
              value={form.notes}
              placeholder="Optional notes"
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </label>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save changes'}
            </button>
            <button className="btn secondary" type="button" onClick={() => setEditing(null)} disabled={submitting}>
              Cancel
            </button>
          </div>

          {error && <div className="error">{error}</div>}
        </form>
      )}
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
  const [reservations, setReservations] = useState([])
  const [loadingData, setLoadingData] = useState(false)
  const [dataError, setDataError] = useState('')
  const [reservationError, setReservationError] = useState('')
  const [reservationSubmitting, setReservationSubmitting] = useState(false)
  const [reservationDraft, setReservationDraft] = useState(null)

  const stats = useMemo(
    () => ({
      models: models.length,
      activeSlots: slots.filter((slot) => slot.isActive).length,
      reservations: reservations.length,
    }),
    [models, slots, reservations]
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

  const openReservationDraft = (slot) => {
    if (!slot) return
    const existing = reservations.find((r) => (r.slot?._id || r.slot) === slot._id) || null
    setReservationError('')
    setReservationDraft({ slot, reservation: existing })
  }

  const closeReservationDraft = () => setReservationDraft(null)

  const handleSubmitReservation = async ({ slotId, startDateTime, endDateTime, notes }) => {
    if (!token) return
    setReservationSubmitting(true)
    setReservationError('')
    const payload = {
      slotId,
      startDateTime: toIso(startDateTime),
      endDateTime: toIso(endDateTime),
      notes,
    }

    try {
      if (reservationDraft?.reservation) {
        const updated = await updateMyReservation(token, reservationDraft.reservation._id, payload)
        setReservations((prev) => prev.map((r) => (r._id === updated._id ? updated : r)))
      } else {
        const created = await createMyReservation(token, payload)
        setReservations((prev) => [...prev, created])
      }
      setPage('reservations')
      setReservationDraft(null)
    } catch (e) {
      setReservationError(e.message)
    } finally {
      setReservationSubmitting(false)
    }
  }

  const handleUpdateReservation = async (id, payload) => {
    if (!token) return
    setReservationSubmitting(true)
    setReservationError('')
    try {
      const updated = await updateMyReservation(token, id, {
        ...payload,
        startDateTime: toIso(payload.startDateTime),
        endDateTime: toIso(payload.endDateTime),
      })
      setReservations((prev) => prev.map((r) => (r._id === updated._id ? updated : r)))
    } catch (e) {
      setReservationError(e.message)
    } finally {
      setReservationSubmitting(false)
    }
  }

  const handleDeleteReservation = async (id) => {
    if (!token) return
    if (!confirm('Cancel this reservation?')) return
    setReservationError('')
    try {
      await deleteMyReservation(token, id)
      setReservations((prev) => prev.filter((r) => r._id !== id))
      if (reservationDraft?.reservation?._id === id) setReservationDraft(null)
    } catch (e) {
      setReservationError(e.message)
    }
  }

  const loadData = async (tkn = token) => {
    setLoadingData(true)
    setDataError('')
    try {
      const [modelData, slotData, reservationData] = await Promise.all([
        fetchModels(tkn),
        fetchSlots(),
        tkn ? fetchMyReservations(tkn) : Promise.resolve([]),
      ])
      setModels(modelData)
      setSlots(slotData)
      setReservations(reservationData)
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
    setReservations([])
    setReservationDraft(null)
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
          <div className="stat-card">
            <div className="stat-icon">
              <CalendarIcon size={18} />
            </div>
            <div>
              <p className="stat-label">Reservations</p>
              <p className="stat-value">{stats.reservations}</p>
            </div>
          </div>
        </div>

          <NavTabs page={page} onChange={setPage} />

          {dataError && <div className="error">{dataError}</div>}
          {reservationError && <div className="error">{reservationError}</div>}

          {page === 'availability' && (
            <AvailabilityView
              models={models}
              slots={slots}
              loading={loadingData}
              onRefresh={() => loadData(token)}
              onReserve={openReservationDraft}
              myReservations={reservations}
              submitting={reservationSubmitting}
            />
          )}
          {page === 'reservations' && (
            <ReservationsView
              reservations={reservations}
              slots={slots}
              onUpdate={handleUpdateReservation}
              onDelete={handleDeleteReservation}
              submitting={reservationSubmitting}
            />
          )}
          {page === 'profile' && <ProfileView user={user} onLogout={handleLogout} />}
          {reservationDraft && (
            <ReservationModal
              slot={reservationDraft.slot}
              reservation={reservationDraft.reservation}
              onClose={closeReservationDraft}
              onSubmit={handleSubmitReservation}
              submitting={reservationSubmitting}
            />
          )}
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
