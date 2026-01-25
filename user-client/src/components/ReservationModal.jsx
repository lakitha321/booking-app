import { useEffect, useMemo, useState } from 'react'
import { TrashIcon } from '../icons'
import {
  buildAvailableWindows,
  formatDuration,
  formatModelLabel,
  formatTimeRange,
  minutesBetween,
  toDatetimeLocal,
} from '../utils/booking'
import SlotTimeline from './SlotTimeline'

export default function ReservationModal({ slot, reservationId, myReservations, user, onClose, onSubmit, submitting }) {
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
      setError('This slot is fully booked. Pick another slot or update an existing reservation.')
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
            <p className="tag-pill">{formatModelLabel(slot.model)} availability</p>
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
            <button className="btn secondary icon-only" type="button" onClick={onClose} disabled={submitting}>
              <TrashIcon size={14} />
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
            <p className="helper">This slot is fully booked. Pick a different slot or update an existing one.</p>
          )}
        </form>
      </div>
    </div>
  )
}
