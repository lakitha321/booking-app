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

function minutesBetween(start, end) {
  return Math.max(0, Math.round((end - start) / 60000))
}

function formatDuration(minutes) {
  if (minutes <= 0) return 'No time left'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (!hours) return `${mins} min${mins === 1 ? '' : 's'}`
  if (!mins) return `${hours} hr${hours === 1 ? '' : 's'}`
  return `${hours} hr${hours === 1 ? '' : 's'} ${mins} min${mins === 1 ? '' : 's'}`
}

function formatTimeRange(start, end, withDate = false) {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const dateOptions = withDate ? undefined : { hour: 'numeric', minute: '2-digit' }
  const startLabel = startDate.toLocaleString(undefined, dateOptions)
  const endLabel = endDate.toLocaleString(undefined, dateOptions)
  return `${startLabel} → ${endLabel}`
}

function buildAvailableWindows(slot, ignoreReservationId) {
  if (!slot) return []
  const slotStart = new Date(slot.startDateTime)
  const slotEnd = new Date(slot.endDateTime)

  const reservations = [...(slot.reservations || [])]
    .filter((res) => (res._id || '').toString() !== (ignoreReservationId || '').toString())
    .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime))

  const windows = []
  let cursor = slotStart

  reservations.forEach((res) => {
    const resStart = new Date(res.startDateTime)
    const resEnd = new Date(res.endDateTime)
    if (resStart > cursor) {
      windows.push({ start: cursor, end: resStart })
    }
    if (resEnd > cursor) cursor = resEnd
  })

  if (cursor < slotEnd) {
    windows.push({ start: cursor, end: slotEnd })
  }

  return windows
}

function remainingMinutesForSlot(slot) {
  if (!slot) return 0
  const start = new Date(slot.startDateTime)
  const end = new Date(slot.endDateTime)
  const total = minutesBetween(start, end)
  const reserved = (slot.reservations || []).reduce((sum, res) => {
    const resStart = new Date(res.startDateTime)
    const resEnd = new Date(res.endDateTime)
    return sum + minutesBetween(resStart, resEnd)
  }, 0)
  return Math.max(0, total - reserved)
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

function SlotTimeline({ slot, selection, highlightUserId, compact = false }) {
  const slotStart = useMemo(() => new Date(slot.startDateTime), [slot])
  const slotEnd = useMemo(() => new Date(slot.endDateTime), [slot])
  const duration = slotEnd - slotStart || 1

  const reservations = useMemo(
    () => [...(slot.reservations || [])].sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime)),
    [slot]
  )

  const getPercent = (value) => {
    const delta = new Date(value) - slotStart
    return Math.max(0, Math.min(100, (delta / duration) * 100))
  }

  const selectionSegment = selection
    ? { start: getPercent(selection.startDateTime), end: getPercent(selection.endDateTime) }
    : null

  return (
    <div className={compact ? 'timeline compact' : 'timeline'}>
      <div className="timeline-track">
        {reservations.map((res) => {
          const start = getPercent(res.startDateTime)
          const end = getPercent(res.endDateTime)
          const isMine = res.user === highlightUserId || res.user?._id === highlightUserId
          return (
            <div
              key={res._id || `${res.startDateTime}-${res.endDateTime}`}
              className={isMine ? 'timeline-block mine' : 'timeline-block'}
              style={{ left: `${start}%`, width: `${Math.max(1, end - start)}%` }}
              title={`${formatTimeRange(res.startDateTime, res.endDateTime, true)}${
                isMine ? ' (Your reservation)' : ''
              }`}
            />
          )
        })}
        {selectionSegment && (
          <div
            className="timeline-selection"
            style={{
              left: `${selectionSegment.start}%`,
              width: `${Math.max(1, selectionSegment.end - selectionSegment.start)}%`,
            }}
            title={`Selected window: ${formatTimeRange(selection.startDateTime, selection.endDateTime, true)}`}
          />
        )}
      </div>
      <div className="timeline-labels">
        <span>{slotStart.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
        <span>{slotEnd.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
      </div>
    </div>
  )
}

function AvailabilityView({ models, slots, loading, onRefresh, onReserve, myReservations, submitting, user }) {
  const activeSlots = useMemo(() => slots.filter((slot) => slot.isActive), [slots])
  const reservationMap = useMemo(() => {
    const map = new Map()
    myReservations.forEach((r) => {
      const id = r.slot?._id || r.slot
      if (!map.has(id)) map.set(id, [])
      map.get(id).push(r)
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
            Every active slot shows remaining time and a visual timeline. Select any opening to reserve.
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
                const userReservations = reservationMap.get(slot._id) || []
                const remainingMinutes = remainingMinutesForSlot(slot)
                const hasAvailability = remainingMinutes > 0
                const totalReservations = slot.reservations?.length || 0

                return (
                  <li key={slot._id} className="slot-row">
                    <div className="slot-row-header">
                      <div className="slot-times">
                        <CheckIcon size={14} />
                        <span>{formatTimeRange(slot.startDateTime, slot.endDateTime, true)}</span>
                      </div>
                      <div className="slot-meta">
                        <span className={hasAvailability ? 'pill success' : 'pill warning'}>
                          {hasAvailability
                            ? `${formatDuration(remainingMinutes)} remaining`
                            : 'Fully booked'}
                        </span>
                        <span className="pill neutral">{totalReservations} reservations</span>
                      </div>
                    </div>

                    <SlotTimeline slot={slot} highlightUserId={user?.id} compact />

                    <div className="reservation-chip-row">
                      {slot.reservations?.length ? (
                        slot.reservations.map((res) => {
                          const isMine = res.user === user?.id || res.user?._id === user?.id
                          return (
                            <div key={res._id} className={isMine ? 'reservation-chip mine' : 'reservation-chip'}>
                              <span className="mono">{formatTimeRange(res.startDateTime, res.endDateTime)}</span>
                              <span className="pill neutral">{isMine ? 'Your reservation' : 'Booked'}</span>
                              {isMine && (
                                <button
                                  className="btn tertiary"
                                  type="button"
                                  onClick={() => onReserve(slot, res._id)}
                                  disabled={submitting}
                                >
                                  Edit
                                </button>
                              )}
                            </div>
                          )
                        })
                      ) : (
                        <p className="helper">No reservations yet — pick any time inside this window.</p>
                      )}
                    </div>

                    <button
                      className="btn tertiary"
                      style={{ marginTop: 8 }}
                      onClick={() => onReserve(slot)}
                      disabled={submitting || !hasAvailability}
                    >
                      {hasAvailability
                        ? userReservations.length
                          ? 'Reserve more time'
                          : 'Select time'
                        : 'Fully booked'}
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

function ReservationModal({ slot, reservationId, myReservations, user, onClose, onSubmit, submitting }) {
  const slotReservations = useMemo(
    () => [...(slot.reservations || [])].sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime)),
    [slot]
  )
  const mySlotReservations = useMemo(
    () => myReservations.filter((r) => (r.slot?._id || r.slot) === slot._id),
    [myReservations, slot]
  )

  const [activeReservationId, setActiveReservationId] = useState(reservationId || 'new')
  useEffect(() => {
    setActiveReservationId(reservationId || 'new')
  }, [reservationId, slot._id])

  const activeReservation = useMemo(
    () => mySlotReservations.find((res) => res._id === activeReservationId) || null,
    [activeReservationId, mySlotReservations]
  )

  const slotStart = useMemo(() => new Date(slot.startDateTime), [slot])
  const slotEnd = useMemo(() => new Date(slot.endDateTime), [slot])
  const availableWindows = useMemo(
    () => buildAvailableWindows(slot, activeReservation?._id),
    [slot, activeReservation]
  )
  const defaultWindow = availableWindows[0] || { start: slotStart, end: slotEnd }
  const defaultEnd = useMemo(
    () =>
      new Date(
        Math.min(defaultWindow.end.getTime(), defaultWindow.start.getTime() + 60 * 60 * 1000)
      ),
    [defaultWindow.end, defaultWindow.start]
  )

  const [startDateTime, setStartDateTime] = useState(toDatetimeLocal(defaultWindow.start))
  const [endDateTime, setEndDateTime] = useState(toDatetimeLocal(defaultEnd))
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (activeReservation) {
      setStartDateTime(toDatetimeLocal(activeReservation.startDateTime))
      setEndDateTime(toDatetimeLocal(activeReservation.endDateTime))
      setNotes(activeReservation.notes || '')
    } else {
      setStartDateTime(toDatetimeLocal(defaultWindow.start))
      setEndDateTime(toDatetimeLocal(defaultEnd))
      setNotes('')
    }
    setError('')
  }, [activeReservation, defaultWindow.start, defaultWindow.end, defaultEnd])

  const totalMinutes = Math.max(1, minutesBetween(slotStart, slotEnd))
  const startMinutes = Math.min(
    totalMinutes,
    Math.max(0, Math.round((new Date(startDateTime) - slotStart) / 60000))
  )
  const endMinutes = Math.min(
    totalMinutes,
    Math.max(startMinutes + 5, Math.round((new Date(endDateTime) - slotStart) / 60000))
  )

  const hasAvailability = availableWindows.some((w) => w.end > w.start)
  const selectionDuration = startDateTime && endDateTime
    ? minutesBetween(new Date(startDateTime), new Date(endDateTime))
    : 0

  const handleSliderChange = (field, minutes) => {
    const nextDate = new Date(slotStart.getTime() + minutes * 60000)
    if (field === 'start') {
      setStartDateTime(toDatetimeLocal(nextDate))
      if (minutes >= endMinutes) {
        const padded = new Date(nextDate.getTime() + 30 * 60000)
        setEndDateTime(toDatetimeLocal(padded <= slotEnd ? padded : slotEnd))
      }
    } else {
      setEndDateTime(toDatetimeLocal(nextDate))
      if (minutes <= startMinutes) {
        const padded = new Date(nextDate.getTime() - 30 * 60000)
        setStartDateTime(toDatetimeLocal(padded >= slotStart ? padded : slotStart))
      }
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    const start = new Date(startDateTime)
    const end = new Date(endDateTime)
    if (!(start < end)) {
      setError('End time must be after start time.')
      return
    }
    if (start < slotStart || end > slotEnd) {
      setError('Please choose times within the available slot window.')
      return
    }

    const overlaps = slotReservations.some((res) => {
      if (activeReservation && res._id === activeReservation._id) return false
      const resStart = new Date(res.startDateTime)
      const resEnd = new Date(res.endDateTime)
      return resStart < end && resEnd > start
    })
    if (overlaps) {
      setError('That time overlaps an existing reservation on this slot.')
      return
    }

    if (!hasAvailability && !activeReservation) {
      setError('This slot is fully booked. Pick another slot or edit an existing reservation.')
      return
    }

    onSubmit({
      slotId: slot._id,
      reservationId: activeReservation?._id || null,
      startDateTime,
      endDateTime,
      notes,
    })
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <div>
            <p className="tag-pill">{slot.model?.name || 'Model'} availability</p>
            <h3>Select your time</h3>
            <p className="helper">{formatTimeRange(slot.startDateTime, slot.endDateTime, true)}</p>
          </div>
          <button className="btn ghost" onClick={onClose} type="button">
            Close
          </button>
        </div>

        {mySlotReservations.length > 0 && (
          <div className="reservation-chip-row" style={{ marginBottom: 12 }}>
            <span className="label">Your reservations in this slot:</span>
            {mySlotReservations.map((res) => (
              <button
                key={res._id}
                className={
                  activeReservationId === res._id ? 'btn tertiary active-chip' : 'btn tertiary'
                }
                type="button"
                onClick={() => setActiveReservationId(res._id)}
              >
                {formatTimeRange(res.startDateTime, res.endDateTime)}
              </button>
            ))}
            <button
              className={activeReservationId === 'new' ? 'btn secondary' : 'btn tertiary'}
              type="button"
              onClick={() => setActiveReservationId('new')}
            >
              Start a new reservation
            </button>
          </div>
        )}

        <SlotTimeline
          slot={slot}
          selection={{ startDateTime, endDateTime }}
          highlightUserId={user?.id}
        />

        <div className="slider-row">
          <label className="form-field" style={{ flex: 1 }}>
            <span>Start marker</span>
            <input
              type="range"
              min={0}
              max={totalMinutes}
              step={15}
              value={startMinutes}
              onChange={(e) => handleSliderChange('start', Number(e.target.value))}
            />
          </label>
          <label className="form-field" style={{ flex: 1 }}>
            <span>End marker</span>
            <input
              type="range"
              min={0}
              max={totalMinutes}
              step={15}
              value={endMinutes}
              onChange={(e) => handleSliderChange('end', Number(e.target.value))}
            />
          </label>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Start time</span>
            <input
              type="datetime-local"
              value={startDateTime}
              min={toDatetimeLocal(slotStart)}
              max={toDatetimeLocal(slotEnd)}
              onChange={(e) => setStartDateTime(e.target.value)}
              required
            />
          </label>

          <label className="form-field">
            <span>End time</span>
            <input
              type="datetime-local"
              value={endDateTime}
              min={toDatetimeLocal(slotStart)}
              max={toDatetimeLocal(slotEnd)}
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

          <div className="availability-windows">
            <p className="label">Available windows in this slot</p>
            {availableWindows.length ? (
              <ul>
                {availableWindows.map((window) => (
                  <li key={window.start.toISOString()}>{formatTimeRange(window.start, window.end, true)}</li>
                ))}
              </ul>
            ) : (
              <p className="helper">This slot is currently booked end-to-end.</p>
            )}
          </div>

          <p className="helper">Selected duration: {formatDuration(selectionDuration)}.</p>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn secondary" type="button" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button className="btn primary" type="submit" disabled={submitting || (!hasAvailability && !activeReservation)}>
              {submitting
                ? 'Saving…'
                : activeReservation
                ? 'Update reservation'
                : 'Reserve time'}
            </button>
          </div>

          {error && <div className="error">{error}</div>}
          {!hasAvailability && !activeReservation && (
            <p className="helper">This slot is fully booked. Pick a different slot or edit an existing one.</p>
          )}
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
    let nextReservationId = reservationId
    if (!nextReservationId) {
      const existingReservations = reservations
        .filter((res) => (res.slot?._id || res.slot) === slot._id)
        .sort((a, b) => new Date(b.startDateTime) - new Date(a.startDateTime))
      if (existingReservations.length) {
        nextReservationId = existingReservations[0]._id
      }
    }
    setReservationDraft({ slot, reservationId: nextReservationId })
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
    if (!confirm('Cancel this reservation?')) return
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
