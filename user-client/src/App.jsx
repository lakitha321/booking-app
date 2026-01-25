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
  MoonIcon,
  ShieldIcon,
  SunIcon,
  UsersIcon,
} from './icons'
import AuthPanel from './components/AuthPanel'
import AvailabilityView from './components/AvailabilityView'
import Hero from './components/Hero'
import NavTabs from './components/NavTabs'
import ProfileView from './components/ProfileView'
import ReservationModal from './components/ReservationModal'
import ReservationsView from './components/ReservationsView'
import { toIso } from './utils/booking'

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

  const upsertSlotReservation = (reservation) => {
    const reservationSlotId = reservation.slot?._id || reservation.slot
    const normalized = {
      _id: reservation._id,
      slot: reservationSlotId,
      startDateTime: reservation.startDateTime,
      endDateTime: reservation.endDateTime,
      user: reservation.user?._id || reservation.user,
      userEmail: reservation.userEmail,
      userName: reservation.userName,
    }

    setSlots((prev) =>
      prev.map((slot) => {
        if (slot._id !== reservationSlotId) return slot
        const nextReservations = [...(slot.reservations || [])]
        const idx = nextReservations.findIndex((r) => r._id === normalized._id)
        if (idx >= 0) nextReservations[idx] = normalized
        else nextReservations.push(normalized)
        nextReservations.sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime))
        return { ...slot, reservations: nextReservations }
      })
    )
  }

  const removeSlotReservation = (reservationId) => {
    setSlots((prev) =>
      prev.map((slot) => {
        if (!slot.reservations) return slot
        const nextReservations = slot.reservations.filter((res) => res._id !== reservationId)
        if (nextReservations.length === slot.reservations.length) return slot
        return { ...slot, reservations: nextReservations }
      })
    )
  }

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

  const openReservationDraft = (slot, reservationId = null) => {
    if (!slot) return
    setReservationError('')
    setReservationDraft({ slot, reservationId })
  }

  const closeReservationDraft = () => setReservationDraft(null)

  const handleSubmitReservation = async ({ slotId, reservationId, startDateTime, endDateTime, notes }) => {
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
      if (reservationId) {
        const updated = await updateMyReservation(token, reservationId, payload)
        setReservations((prev) => prev.map((r) => (r._id === updated._id ? updated : r)))
        upsertSlotReservation(updated)
      } else {
        const created = await createMyReservation(token, payload)
        setReservations((prev) => [...prev, created])
        upsertSlotReservation(created)
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
      upsertSlotReservation(updated)
    } catch (e) {
      setReservationError(e.message)
    } finally {
      setReservationSubmitting(false)
    }
  }

  const handleDeleteReservation = async (id) => {
    if (!token) return
    if (!confirm('Remove this reservation?')) return
    setReservationError('')
    try {
      await deleteMyReservation(token, id)
      setReservations((prev) => prev.filter((r) => r._id !== id))
      removeSlotReservation(id)
      if (reservationDraft?.reservationId === id) setReservationDraft(null)
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
        fetchSlots({ includeReservations: true }),
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
              onDelete={handleDeleteReservation}
              myReservations={reservations}
              submitting={reservationSubmitting}
              user={user}
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
              reservationId={reservationDraft.reservationId}
              myReservations={reservations}
              user={user}
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
