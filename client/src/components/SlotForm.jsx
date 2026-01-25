import { useEffect, useState } from 'react'
import { CalendarIcon, NoteIcon, PowerIcon, TrashIcon } from '../icons'

function toLocalParts(value) {
  if (!value) return { date: '', time: '' }
  const date = new Date(value)
  const off = date.getTimezoneOffset()
  const local = new Date(date.getTime() - off * 60000)
  const isoString = local.toISOString()
  return {
    date: isoString.slice(0, 10),
    time: isoString.slice(11, 16),
  }
}

function formatModelLabel(model) {
  if (!model) return ''
  if (typeof model === 'string') return model
  const sizeLabel = model.size?.name || 'Unknown size'
  return `${model.name} - ${sizeLabel}`
}

export default function SlotForm({
  onSubmit,
  onCancel,
  initialData = null,
  submitting,
  mode,
  models = [],
  resetSignal,
}) {
  const [form, setForm] = useState({
    model: '',
    date: '',
    startTime: '',
    endTime: '',
    notes: '',
    isActive: true,
  })

  const [validationError, setValidationError] = useState('')

  useEffect(() => {
    if (initialData) {
      const startParts = toLocalParts(initialData.startDateTime)
      const endParts = toLocalParts(initialData.endDateTime)
      const modelValue = formatModelLabel(initialData.model)
      setForm({
        model: modelValue,
        date: startParts.date,
        startTime: startParts.time,
        endTime: endParts.time,
        notes: initialData.notes || '',
        isActive: Boolean(initialData.isActive),
      })
    } else {
      setForm({ model: '', date: '', startTime: '', endTime: '', notes: '', isActive: true })
    }
    setValidationError('')
  }, [initialData, resetSignal])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setValidationError('')

    if (!form.date) {
      setValidationError('Select a date before choosing start and end times.')
      return
    }

    if (!form.startTime || !form.endTime) {
      setValidationError('Provide both start and end times for the selected date.')
      return
    }

    if (form.endTime < form.startTime) {
      setValidationError('End time must be after start time on the same date.')
      return
    }

    const { date, startTime, endTime, ...rest } = form

    onSubmit({
      ...rest,
      startDateTime: `${date}T${startTime}`,
      endDateTime: `${date}T${endTime}`,
    })
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <div className="form-row">
        <label htmlFor="model">
          <CalendarIcon size={16} /> Model *
        </label>
        <select
          id="model"
          name="model"
          required
          value={form.model}
          onChange={handleChange}
          disabled={!models.length}
        >
          <option value="" disabled>
            {models.length ? 'Select a model' : 'Create a model first'}
          </option>
          {models.map((model) => (
            <option key={model._id} value={formatModelLabel(model)}>
              {formatModelLabel(model)}
            </option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <label htmlFor="date">
          <CalendarIcon size={16} /> Date
        </label>
        <input id="date" name="date" type="date" required value={form.date} onChange={handleChange} />
      </div>

      <div className="form-row">
        <label htmlFor="startDateTime">
          <CalendarIcon size={16} /> Start time
        </label>
        <input
          id="startDateTime"
          name="startTime"
          type="time"
          required
          disabled={!form.date}
          value={form.startTime}
          onChange={handleChange}
        />
      </div>

      <div className="form-row">
        <label htmlFor="endDateTime">
          <CalendarIcon size={16} /> End time
        </label>
        <input
          id="endDateTime"
          name="endTime"
          type="time"
          required
          disabled={!form.date}
          value={form.endTime}
          onChange={handleChange}
        />
      </div>

      <div className="form-row">
        <label htmlFor="notes">
          <NoteIcon size={16} /> Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          placeholder="Optional notes that show up with the slot"
          value={form.notes}
          onChange={handleChange}
        />
      </div>

      <div className="form-row">
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            name="isActive"
            checked={form.isActive}
            onChange={handleChange}
          />
          <PowerIcon size={16} /> Active
        </label>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn primary" type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create slot'}
        </button>
        {mode === 'edit' && (
          <button
            className="btn secondary icon-only"
            type="button"
            onClick={onCancel}
            disabled={submitting}
            aria-label="Discard changes"
          >
            <TrashIcon size={14} />
          </button>
        )}
      </div>
      {validationError && <div className="error" role="alert">{validationError}</div>}
    </form>
  )
}
