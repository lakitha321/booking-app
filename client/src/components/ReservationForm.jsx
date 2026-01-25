import { useEffect, useMemo, useState } from 'react'
import { CalendarIcon, MailIcon, NoteIcon, TrashIcon } from '../icons'

function formatTimeRange(start, end) {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const sameDay = startDate.toDateString() === endDate.toDateString()
  const timeOptions = { hour: 'numeric', minute: '2-digit', second: '2-digit' }
  const startLabel = startDate.toLocaleString()
  const endLabel = sameDay ? endDate.toLocaleTimeString(undefined, timeOptions) : endDate.toLocaleString()
  return `${startLabel} → ${endLabel}`
}

export default function ReservationForm({
  mode = 'create',
  slots = [],
  onSubmit,
  onCancel,
  submitting,
  initialData = null,
  resetSignal,
}) {
  const [form, setForm] = useState({ userEmail: '', slotId: '', notes: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialData) {
      setForm({
        userEmail: initialData.userEmail || '',
        slotId: initialData.slot?._id || initialData.slot || '',
        notes: initialData.notes || '',
      })
    } else {
      setForm({ userEmail: '', slotId: '', notes: '' })
    }
    setError('')
  }, [initialData, resetSignal])

  const slotOptions = useMemo(
    () =>
      [...slots]
        .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime))
        .map((slot) => ({
          id: slot._id,
          label: `${typeof slot.model === 'string' ? slot.model : slot.model?.name || 'Model'} — ${formatTimeRange(
            slot.startDateTime,
            slot.endDateTime
          )}`,
        })),
    [slots]
  )

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (!form.userEmail || !form.slotId) {
      setError('User email and slot are required.')
      return
    }
    onSubmit(form)
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <div className="form-row">
        <label htmlFor="userEmail">
          <MailIcon size={16} /> User email
        </label>
        <input
          id="userEmail"
          name="userEmail"
          type="email"
          value={form.userEmail}
          onChange={handleChange}
          required
          placeholder="person@example.com"
        />
      </div>

      <div className="form-row">
        <label htmlFor="slotId">
          <CalendarIcon size={16} /> Slot
        </label>
        <select id="slotId" name="slotId" value={form.slotId} onChange={handleChange} required disabled={!slotOptions.length}>
          <option value="" disabled>
            {slotOptions.length ? 'Select a slot' : 'Create a slot first'}
          </option>
          {slotOptions.map((slot) => (
            <option key={slot.id} value={slot.id}>
              {slot.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <label htmlFor="notes">
          <NoteIcon size={16} /> Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          placeholder="Optional notes for this reservation"
          value={form.notes}
          onChange={handleChange}
        />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn primary" type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create reservation'}
        </button>
        {mode === 'edit' && (
          <button
            className="btn ghost danger icon-only"
            type="button"
            onClick={onCancel}
            disabled={submitting}
            aria-label="Discard changes"
          >
            <TrashIcon size={14} />
          </button>
        )}
      </div>

      {error && <div className="error">{error}</div>}
    </form>
  )
}
