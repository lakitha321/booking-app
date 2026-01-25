import { LogoutIcon, MailIcon, UserIcon } from '../icons'

export default function ProfileView({ user, onLogout }) {
  return (
    <div className="card">
      <div className="control-bar">
        <div>
          <h2>
            <UserIcon size={18} /> Profile
          </h2>
          <p className="subtitle">Review the details you used to register.</p>
        </div>
        <div className="section-actions">
          <button className="btn secondary" onClick={onLogout}>
            <LogoutIcon size={16} /> Logout
          </button>
        </div>
      </div>

      <div className="profile-grid">
        <div className="profile-item">
          <span className="label">First name</span>
          <span>{user.firstName}</span>
        </div>
        <div className="profile-item">
          <span className="label">Last name</span>
          <span>{user.lastName}</span>
        </div>
        <div className="profile-item">
          <span className="label">Email</span>
          <span className="pill">
            <MailIcon size={14} /> {user.email}
          </span>
        </div>
      </div>
    </div>
  )
}
