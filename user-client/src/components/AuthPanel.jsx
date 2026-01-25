import { useState } from 'react'

export default function AuthPanel({ mode, onModeChange, onLogin, onRegister, loading, error }) {
  const isLogin = mode === 'login'
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isLogin) onLogin({ email: form.email, password: form.password })
    else onRegister(form)
  }

  return (
    <div className="card auth-card">
      <div className="control-bar">
        <div>
          <h2>{isLogin ? 'Welcome back' : 'Create an account'}</h2>
          <p className="subtitle">
            {isLogin ? 'Log in with your email and password.' : 'Sign up with your name, email, and a password.'}
          </p>
        </div>
        <div className="section-actions">
          <button className="btn tertiary" onClick={() => onModeChange(isLogin ? 'register' : 'login')} type="button">
            {isLogin ? 'Need an account?' : 'Have an account?'}
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <form className="form-grid" onSubmit={handleSubmit}>
        {!isLogin && (
          <>
            <label className="form-field">
              <span>First name</span>
              <input name="firstName" value={form.firstName} onChange={handleChange} required={!isLogin} />
            </label>
            <label className="form-field">
              <span>Last name</span>
              <input name="lastName" value={form.lastName} onChange={handleChange} required={!isLogin} />
            </label>
          </>
        )}
        <label className="form-field">
          <span>Email</span>
          <input name="email" type="email" value={form.email} onChange={handleChange} required />
        </label>
        <label className="form-field">
          <span>Password</span>
          <input name="password" type="password" value={form.password} onChange={handleChange} required />
        </label>
        <button className="btn primary" type="submit" disabled={loading}>
          {loading ? 'Submitting…' : isLogin ? 'Login' : 'Register'}
        </button>
      </form>
    </div>
  )
}
