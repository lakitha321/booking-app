import { useMemo } from 'react'
import { formatTimeRange } from '../utils/booking'

export default function SlotTimeline({ slot, selection, highlightUserId, compact = false }) {
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
