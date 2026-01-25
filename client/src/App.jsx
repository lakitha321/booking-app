import { useEffect, useMemo, useState } from 'react'
import {
  createModel,
  createSlot,
  deleteModel,
  deleteSlot,
  fetchModels,
  fetchSizes,
  fetchSlots,
  fetchReservations,
  updateModel,
  deleteReservation,
  updateSlot,
  createSize,
  updateSize,
  deleteSize,
} from './api'
import ModelForm from './components/ModelForm'
import ModelTable from './components/ModelTable'
import ReservationTable from './components/ReservationTable'
import SizeForm from './components/SizeForm'
import SizeTable from './components/SizeTable'
import SlotForm from './components/SlotForm'
import SlotTable from './components/SlotTable'
import {
  CalendarIcon,
  ClockIcon,
  EditIcon,
  MoonIcon,
  PlusIcon,
  PowerIcon,
  RefreshIcon,
  ShieldIcon,
  SunIcon,
  UsersIcon,
} from './icons'

function toIso(datetimeLocal) {
  return datetimeLocal ? new Date(datetimeLocal).toISOString() : ''
}

function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark'
  return (
    <button className="toggle" type="button" onClick={onToggle} aria-label="Toggle color theme">
      {isDark ? <MoonIcon size={18} /> : <SunIcon size={18} />}
      <span>{isDark ? 'Dark' : 'Light'} mode</span>
    </button>
  )
}

function getPreferredTheme() {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark') return stored
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  return prefersDark ? 'dark' : 'light'
}

export default function App() {
  const [page, setPage] = useState('slots')

  const [slots, setSlots] = useState([])
  const [models, setModels] = useState([])
  const [sizes, setSizes] = useState([])
  const [reservations, setReservations] = useState([])

  const [slotLoading, setSlotLoading] = useState(false)
  const [modelLoading, setModelLoading] = useState(false)
  const [sizeLoading, setSizeLoading] = useState(false)
  const [reservationLoading, setReservationLoading] = useState(false)

  const [slotError, setSlotError] = useState('')
  const [modelError, setModelError] = useState('')
  const [sizeError, setSizeError] = useState('')
  const [reservationError, setReservationError] = useState('')

  const [slotSubmitting, setSlotSubmitting] = useState(false)
  const [modelSubmitting, setModelSubmitting] = useState(false)
  const [sizeSubmitting, setSizeSubmitting] = useState(false)

  const [editingSlot, setEditingSlot] = useState(null)
  const [editingModel, setEditingModel] = useState(null)
  const [editingSize, setEditingSize] = useState(null)

  const [slotFormReset, setSlotFormReset] = useState(0)
  const [modelFormReset, setModelFormReset] = useState(0)
  const [sizeFormReset, setSizeFormReset] = useState(0)

  const [theme, setTheme] = useState(getPreferredTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const sortedSlots = useMemo(
    () => [...slots].sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime)),
    [slots]
  )

  const sortedModels = useMemo(
    () => [...models].sort((a, b) => a.name.localeCompare(b.name)),
    [models]
  )

  const sortedSizes = useMemo(
    () => [...sizes].sort((a, b) => a.name.localeCompare(b.name)),
    [sizes]
  )

  const sortedReservations = useMemo(
    () => [...reservations].sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime)),
    [reservations]
  )

  const activeSlots = useMemo(() => slots.filter((slot) => slot.isActive).length, [slots])
  const upcomingSlots = useMemo(
    () => slots.filter((slot) => new Date(slot.startDateTime) > new Date()).length,
    [slots]
  )
  const totalReservations = useMemo(() => reservations.length, [reservations])

  const loadModels = async () => {
    setModelLoading(true)
    setModelError('')
    try {
      const data = await fetchModels()
      setModels(data)
    } catch (e) {
      setModelError(e.message)
    } finally {
      setModelLoading(false)
    }
  }

  const loadSizes = async () => {
    setSizeLoading(true)
    setSizeError('')
    try {
      const data = await fetchSizes()
      setSizes(data)
    } catch (e) {
      setSizeError(e.message)
    } finally {
      setSizeLoading(false)
    }
  }

  const loadSlots = async () => {
    setSlotLoading(true)
    setSlotError('')
    try {
      const data = await fetchSlots()
      setSlots(data)
    } catch (e) {
      setSlotError(e.message)
    } finally {
      setSlotLoading(false)
    }
  }

  const loadReservations = async () => {
    setReservationLoading(true)
    setReservationError('')
    try {
      const data = await fetchReservations()
      setReservations(data)
    } catch (e) {
      setReservationError(e.message)
    } finally {
      setReservationLoading(false)
    }
  }

  useEffect(() => {
    loadModels()
    loadSizes()
    loadSlots()
    loadReservations()
  }, [])

  const handleSlotCreate = async (form) => {
    setSlotSubmitting(true)
    setSlotError('')
    try {
      const payload = {
        ...form,
        startDateTime: toIso(form.startDateTime),
        endDateTime: toIso(form.endDateTime),
      }
      const created = await createSlot(payload)
      setSlots((prev) => [...prev, created])
      setEditingSlot(null)
      setSlotFormReset((v) => v + 1)
    } catch (e) {
      setSlotError(e.message)
    } finally {
      setSlotSubmitting(false)
    }
  }

  const handleSlotUpdate = async (form) => {
    if (!editingSlot) return
    setSlotSubmitting(true)
    setSlotError('')
    try {
      const payload = { ...form }
      if (payload.startDateTime) payload.startDateTime = toIso(payload.startDateTime)
      if (payload.endDateTime) payload.endDateTime = toIso(payload.endDateTime)
      const updated = await updateSlot(editingSlot._id, payload)
      setSlots((prev) => prev.map((slot) => (slot._id === updated._id ? updated : slot)))
      setEditingSlot(null)
      setSlotFormReset((v) => v + 1)
    } catch (e) {
      setSlotError(e.message)
    } finally {
      setSlotSubmitting(false)
    }
  }

  const handleSlotDelete = async (id) => {
    if (!confirm('Delete this slot?')) return
    setSlotError('')
    try {
      await deleteSlot(id)
      setSlots((prev) => prev.filter((slot) => slot._id !== id))
    } catch (e) {
      setSlotError(e.message)
    }
  }

  const handleModelCreate = async (form) => {
    setModelSubmitting(true)
    setModelError('')
    try {
      const created = await createModel(form)
      setModels((prev) => [...prev, created])
      setEditingModel(null)
      setModelFormReset((v) => v + 1)
    } catch (e) {
      setModelError(e.message)
    } finally {
      setModelSubmitting(false)
    }
  }

  const handleModelUpdate = async (form) => {
    if (!editingModel) return
    setModelSubmitting(true)
    setModelError('')
    try {
      const updated = await updateModel(editingModel._id, form)
      setModels((prev) => prev.map((model) => (model._id === updated._id ? updated : model)))
      setEditingModel(null)
      setModelFormReset((v) => v + 1)
    } catch (e) {
      setModelError(e.message)
    } finally {
      setModelSubmitting(false)
    }
  }

  const handleModelDelete = async (id) => {
    if (!confirm('Delete this model?')) return
    setModelError('')
    try {
      await deleteModel(id)
      setModels((prev) => prev.filter((model) => model._id !== id))
      setSlots((prev) => prev.filter((slot) => slot.model?._id !== id && slot.model !== id))
    } catch (e) {
      setModelError(e.message)
    }
  }

  const handleSizeCreate = async (form) => {
    setSizeSubmitting(true)
    setSizeError('')
    try {
      const created = await createSize(form)
      setSizes((prev) => [...prev, created])
      setEditingSize(null)
      setSizeFormReset((v) => v + 1)
    } catch (e) {
      setSizeError(e.message)
    } finally {
      setSizeSubmitting(false)
    }
  }

  const handleSizeUpdate = async (form) => {
    if (!editingSize) return
    setSizeSubmitting(true)
    setSizeError('')
    try {
      const updated = await updateSize(editingSize._id, form)
      setSizes((prev) => prev.map((size) => (size._id === updated._id ? updated : size)))
      setModels((prev) =>
        prev.map((model) =>
          model.size?._id === updated._id
            ? { ...model, size: { ...model.size, name: updated.name } }
            : model
        )
      )
      setEditingSize(null)
      setSizeFormReset((v) => v + 1)
    } catch (e) {
      setSizeError(e.message)
    } finally {
      setSizeSubmitting(false)
    }
  }

  const handleSizeDelete = async (id) => {
    if (!confirm('Delete this size?')) return
    setSizeError('')
    try {
      await deleteSize(id)
      setSizes((prev) => prev.filter((size) => size._id !== id))
      setModels((prev) =>
        prev.map((model) => (model.size?._id === id ? { ...model, size: null } : model))
      )
    } catch (e) {
      setSizeError(e.message)
    }
  }

  const handleReservationDelete = async (id) => {
    if (!confirm('Delete this reservation?')) return
    setReservationError('')
    try {
      await deleteReservation(id)
      setReservations((prev) => prev.filter((r) => r._id !== id))
    } catch (e) {
      setReservationError(e.message)
    }
  }

  return (
    <div className="app-shell">
      <header>
        <div className="hero">
          <div className="tag-pill">
            <CalendarIcon size={16} /> Booking admin
          </div>
          <h1>Availability cockpit</h1>
          <p className="lead">Manage models, curate their availability, and keep schedules conflict free.</p>
          <div className="status-line">
            <span className="status-dot"></span>
            <span>API base:</span>
            <code className="code">{import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'}</code>
          </div>
        </div>
        <div className="toolbar">
          <ThemeToggle theme={theme} onToggle={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} />
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <ClockIcon size={18} />
          </div>
          <div>
            <p className="stat-label">Total slots</p>
            <p className="stat-value">{slots.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <ShieldIcon size={18} />
          </div>
          <div>
            <p className="stat-label">Active slots</p>
            <p className="stat-value">{activeSlots}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <CalendarIcon size={18} />
          </div>
          <div>
            <p className="stat-label">Upcoming slots</p>
            <p className="stat-value">{upcomingSlots}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <UsersIcon size={18} />
          </div>
          <div>
            <p className="stat-label">Models</p>
            <p className="stat-value">{models.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <CalendarIcon size={18} />
          </div>
          <div>
            <p className="stat-label">Reservations</p>
            <p className="stat-value">{totalReservations}</p>
          </div>
        </div>
      </div>

      <nav className="tabs">
        <button className={page === 'slots' ? 'tab active' : 'tab'} onClick={() => setPage('slots')}>
          <ClockIcon size={16} /> Availability slots
        </button>
        <button className={page === 'models' ? 'tab active' : 'tab'} onClick={() => setPage('models')}>
          <UsersIcon size={16} /> Models
        </button>
        <button className={page === 'sizes' ? 'tab active' : 'tab'} onClick={() => setPage('sizes')}>
          <UsersIcon size={16} /> Sizes
        </button>
        <button
          className={page === 'reservations' ? 'tab active' : 'tab'}
          onClick={() => setPage('reservations')}
        >
          <CalendarIcon size={16} /> Reservations
        </button>
      </nav>

      {page === 'slots' && (
        <div className="grid two">
          <div className="card">
            <div className="control-bar">
              <div>
                <h2>
                  {editingSlot ? (
                    <>
                      <EditIcon size={18} /> Update slot
                    </>
                  ) : (
                    <>
                      <PlusIcon size={18} /> Create slot
                    </>
                  )}
                </h2>
                <p className="subtitle">Pick a model, then set start and end times in your local timezone.</p>
              </div>
              <div className="section-actions">
                <span className="tag-pill">
                  <PowerIcon size={16} /> {activeSlots} active
                </span>
              </div>
            </div>
            {slotError && <div className="error">{slotError}</div>}
            <SlotForm
              mode={editingSlot ? 'edit' : 'create'}
              initialData={editingSlot}
              onSubmit={editingSlot ? handleSlotUpdate : handleSlotCreate}
              onCancel={() => setEditingSlot(null)}
              submitting={slotSubmitting}
              models={sortedModels}
              resetSignal={slotFormReset}
            />
            {!sortedModels.length && (
              <p className="helper" style={{ marginTop: 8 }}>
                Create a model first to add availability.
              </p>
            )}
          </div>

          <div className="card">
            <div className="control-bar">
              <h2>
                <CalendarIcon size={18} /> Existing slots
              </h2>
              <div className="section-actions">
                <button className="btn secondary" onClick={loadSlots} disabled={slotLoading}>
                  <RefreshIcon size={16} /> {slotLoading ? 'Refreshing…' : 'Reload'}
                </button>
              </div>
            </div>
            {slotError && <div className="error">{slotError}</div>}
            <SlotTable slots={sortedSlots} onEdit={setEditingSlot} onDelete={handleSlotDelete} />
          </div>
        </div>
      )}

      {page === 'models' && (
        <div className="grid two">
          <div className="card">
            <div className="control-bar">
              <div>
                <h2>
                  {editingModel ? (
                    <>
                      <EditIcon size={18} /> Update model
                    </>
                  ) : (
                    <>
                      <PlusIcon size={18} /> Create model
                    </>
                  )}
                </h2>
                <p className="subtitle">Model name is required and must be unique.</p>
              </div>
            </div>
            {modelError && <div className="error">{modelError}</div>}
            <ModelForm
              mode={editingModel ? 'edit' : 'create'}
              initialData={editingModel}
              onSubmit={editingModel ? handleModelUpdate : handleModelCreate}
              onCancel={() => setEditingModel(null)}
              submitting={modelSubmitting}
              resetSignal={modelFormReset}
              sizes={sortedSizes}
            />
            {!sortedSizes.length && (
              <p className="helper" style={{ marginTop: 8 }}>
                Create a size first to add models.
              </p>
            )}
          </div>

          <div className="card">
            <div className="control-bar">
              <h2>
                <UsersIcon size={18} /> Models
              </h2>
              <div className="section-actions">
                <button className="btn secondary" onClick={loadModels} disabled={modelLoading}>
                  <RefreshIcon size={16} /> {modelLoading ? 'Refreshing…' : 'Reload'}
                </button>
              </div>
            </div>
            {modelError && <div className="error">{modelError}</div>}
            <ModelTable models={sortedModels} onEdit={setEditingModel} onDelete={handleModelDelete} />
          </div>
        </div>
      )}

      {page === 'sizes' && (
        <div className="grid two">
          <div className="card">
            <div className="control-bar">
              <div>
                <h2>
                  {editingSize ? (
                    <>
                      <EditIcon size={18} /> Update size
                    </>
                  ) : (
                    <>
                      <PlusIcon size={18} /> Create size
                    </>
                  )}
                </h2>
                <p className="subtitle">Size name is required and must be unique.</p>
              </div>
            </div>
            {sizeError && <div className="error">{sizeError}</div>}
            <SizeForm
              mode={editingSize ? 'edit' : 'create'}
              initialData={editingSize}
              onSubmit={editingSize ? handleSizeUpdate : handleSizeCreate}
              onCancel={() => setEditingSize(null)}
              submitting={sizeSubmitting}
              resetSignal={sizeFormReset}
            />
          </div>

          <div className="card">
            <div className="control-bar">
              <h2>
                <UsersIcon size={18} /> Sizes
              </h2>
              <div className="section-actions">
                <button className="btn secondary" onClick={loadSizes} disabled={sizeLoading}>
                  <RefreshIcon size={16} /> {sizeLoading ? 'Refreshing…' : 'Reload'}
                </button>
              </div>
            </div>
            {sizeError && <div className="error">{sizeError}</div>}
            <SizeTable sizes={sortedSizes} onEdit={setEditingSize} onDelete={handleSizeDelete} />
          </div>
        </div>
      )}

      {page === 'reservations' && (
        <div className="card">
          <div className="control-bar">
            <div>
              <h2>
                <CalendarIcon size={18} /> Reservations
              </h2>
              <p className="subtitle">
                Reservations are created by users. Review their selections or remove entries when needed.
              </p>
            </div>
            <div className="section-actions">
              <button className="btn secondary" onClick={loadReservations} disabled={reservationLoading}>
                <RefreshIcon size={16} /> {reservationLoading ? 'Refreshing…' : 'Reload'}
              </button>
            </div>
          </div>
          {reservationError && <div className="error">{reservationError}</div>}
          <ReservationTable reservations={sortedReservations} onDelete={handleReservationDelete} />
        </div>
      )}
    </div>
  )
}
