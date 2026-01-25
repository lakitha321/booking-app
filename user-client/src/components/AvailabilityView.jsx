import { useMemo } from 'react'
import {
  CalendarIcon,
  CheckIcon,
  EditIcon,
  RefreshIcon,
  TrashIcon,
} from '../icons'
import {
  formatDuration,
  formatModelLabel,
  formatTimeRange,
  remainingMinutesForSlot,
} from '../utils/booking'
import SlotTimeline from './SlotTimeline'

export default function AvailabilityView({ models, slots, loading, onRefresh, onReserve, onDelete, myReservations, submitting, user }) {
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
    models.forEach((model) => {
      const label = formatModelLabel(model)
      map.set(label, { model: { ...model, label }, slots: [] })
    })
    activeSlots.forEach((slot) => {
      const label = formatModelLabel(slot.model)
      if (!map.has(label)) {
        map.set(label, { model: { name: label, label }, slots: [] })
      }
      map.get(label).slots.push(slot)
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
          <div key={model.label || model.name} className="model-card">
            <div className="model-header">
              <div className="model-avatar">{(model.label || model.name).slice(0, 1).toUpperCase()}</div>
              <div>
                <h3>{model.label || model.name}</h3>
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
                              {isMine === false && (
                                <span className="pill neutral">{'Booked'}</span>
                              )}
                              {isMine && (
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <button
                                    className="btn tertiary icon-only"
                                    type="button"
                                    aria-label="Update reservation"
                                    onClick={() => onReserve(slot, res._id)}
                                    disabled={submitting}
                                  >
                                    <EditIcon size={14} />
                                  </button>
                                  <button
                                    className="btn ghost danger icon-only"
                                    type="button"
                                    aria-label="Remove reservation"
                                    onClick={() => onDelete(res._id)}
                                    disabled={submitting}
                                  >
                                    <TrashIcon size={14} />
                                  </button>
                                </div>
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
