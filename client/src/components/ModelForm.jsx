import { useEffect, useState } from 'react'
import { NoteIcon, UsersIcon } from '../icons'

export default function ModelForm({ onSubmit, onCancel, initialData = null, submitting, mode, resetSignal }) {
  const [form, setForm] = useState({ name: '', nic: '', notes: '' })

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '',
        nic: initialData.nic || '',
        notes: initialData.notes || '',
      })
    } else {
      setForm({ name: '', nic: '', notes: '' })
    }
  }, [initialData, resetSignal])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ ...form })
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <div className="form-row">
        <label htmlFor="name">
          <UsersIcon size={16} /> Model name *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="Unique model name"
          value={form.name}
          onChange={handleChange}
        />
      </div>

      <div className="form-row">
        <label htmlFor="nic">
          <UsersIcon size={16} /> NIC
        </label>
        <input
          id="nic"
          name="nic"
          type="text"
          placeholder="Optional nic"
          value={form.nic}
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
          placeholder="Optional notes about this model"
          value={form.notes}
          onChange={handleChange}
        />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn primary" type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create model'}
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
