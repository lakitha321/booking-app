import { CalendarIcon, ClockIcon, UserIcon } from '../icons'

export default function NavTabs({ page, onChange }) {
  return (
    <nav className="tabs">
      <button className={page === 'availability' ? 'tab active' : 'tab'} onClick={() => onChange('availability')}>
        <ClockIcon size={16} /> Availability
      </button>
      <button className={page === 'reservations' ? 'tab active' : 'tab'} onClick={() => onChange('reservations')}>
        <CalendarIcon size={16} /> Reservations
      </button>
      <button className={page === 'profile' ? 'tab active' : 'tab'} onClick={() => onChange('profile')}>
        <UserIcon size={16} /> Profile
      </button>
    </nav>
  )
}
