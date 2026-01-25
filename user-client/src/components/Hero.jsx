export default function Hero() {
  return (
    <header className="hero">
      <div>
        <div className="tag-pill">Public booking portal</div>
        <h1>Reserve time with our models</h1>
        <p className="lead">
          Sign in to explore which models are available and keep your profile up to date. Everything is
          powered by the same backend as the admin console.
        </p>
        <div className="status-line">
          <span className="status-dot" />
          <span>API base:</span>
          <code className="code">{import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'}</code>
        </div>
      </div>
    </header>
  )
}
