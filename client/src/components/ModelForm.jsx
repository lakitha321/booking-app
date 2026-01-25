import { useEffect, useState } from 'react'
import { NoteIcon, TrashIcon, UsersIcon } from '../icons'

export default function ModelForm({
  onSubmit,
  onCancel,
  initialData = null,
  submitting,
  mode,
  resetSignal,
  sizes = [],
}) {
  const [form, setForm] = useState({ name: '', sizeId: '', notes: '' })

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '',
        sizeId: initialData.size?._id || initialData.size || '',
        notes: initialData.notes || '',
      })
    } else {
      setForm({ name: '', sizeId: '', notes: '' })
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
        <label htmlFor="sizeId">
          <UsersIcon size={16} /> Size *
        </label>
        <select
          id="sizeId"
          name="sizeId"
          required
          value={form.sizeId}
          onChange={handleChange}
          disabled={!sizes.length}
        >
          <option value="" disabled>
            {sizes.length ? 'Select a size' : 'Create a size first'}
          </option>
          {sizes.map((size) => (
            <option key={size._id} value={size._id}>
              {size.name}
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
    </form>
  )
}
