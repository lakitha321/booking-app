import { useEffect, useMemo, useState } from 'react'
import { CalendarIcon, EditIcon, TrashIcon } from '../icons'
import { formatModelLabel, formatTimeRange, toDatetimeLocal } from '../utils/booking'

export default function ReservationsView({ reservations, slots, onUpdate, onDelete, submitting }) {
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
        label: `${formatModelLabel(slot.model)} — ${formatTimeRange(slot.startDateTime, slot.endDateTime, true)}`,
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
          <p className="subtitle">Update or remove reservations you created.</p>
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
                <td>
                  {typeof reservation.model === 'string'
                    ? reservation.model
                    : reservation.model?.name ||
                      (typeof reservation.slot?.model === 'string'
                        ? reservation.slot.model
                        : reservation.slot?.model?.name) ||
                      'Model'}
                </td>
                <td>
                  <div className="pill">
                    <CalendarIcon size={14} />
                    <span>
                      {formatTimeRange(reservation.startDateTime, reservation.endDateTime, true)}
                    </span>
                  </div>
                </td>
                <td className="mono">{reservation.notes || '—'}</td>
                <td className="actions">
                  <button className="btn tertiary icon-only" onClick={() => setEditing(reservation)} aria-label="Update reservation">
                    <EditIcon size={14} />
                  </button>
                  <button
                    className="btn ghost danger icon-only"
                    onClick={() => onDelete(reservation._id)}
                    disabled={submitting}
                    aria-label="Remove reservation"
                  >
                    <TrashIcon size={14} />
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
            <button
              className="btn ghost danger icon-only"
              type="button"
              onClick={() => setEditing(null)}
              disabled={submitting}
              aria-label="Discard changes"
            >
              <TrashIcon size={14} />
            </button>
          </div>

          {error && <div className="error">{error}</div>}
        </form>
      )}
    </div>
  )
}
