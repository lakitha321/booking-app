import { useEffect, useState } from 'react'

function toLocalInputValue(value) {
  if (!value) return ''
  const date = new Date(value)
  const off = date.getTimezoneOffset()
  const local = new Date(date.getTime() - off * 60000)
  return local.toISOString().slice(0, 16)
}

export default function SlotForm({ onSubmit, onCancel, initialData = null, submitting, mode }) {
  const [form, setForm] = useState({
    title: '',
    startDateTime: '',
    endDateTime: '',
    notes: '',
    isActive: true,
  })

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title || '',
        startDateTime: toLocalInputValue(initialData.startDateTime),
        endDateTime: toLocalInputValue(initialData.endDateTime),
        notes: initialData.notes || '',
        isActive: Boolean(initialData.isActive),
      })
    }
  }, [initialData])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ ...form })
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <div className="form-row">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          name="title"
          type="text"
          placeholder="Optional name for the slot"
          value={form.title}
          onChange={handleChange}
        />
      </div>

      <div className="form-row">
        <label htmlFor="startDateTime">Start</label>
        <input
          id="startDateTime"
          name="startDateTime"
          type="datetime-local"
          required
          value={form.startDateTime}
          onChange={handleChange}
        />
      </div>

      <div className="form-row">
        <label htmlFor="endDateTime">End</label>
        <input
          id="endDateTime"
          name="endDateTime"
          type="datetime-local"
          required
          value={form.endDateTime}
          onChange={handleChange}
        />
      </div>

      <div className="form-row">
        <label htmlFor="notes">Notes</label>
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
          Active
        </label>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn primary" type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create slot'}
        </button>
        {mode === 'edit' && (
          <button className="btn secondary" type="button" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
