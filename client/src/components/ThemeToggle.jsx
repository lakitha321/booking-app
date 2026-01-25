import { MoonIcon, SunIcon } from '../icons'

export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark'
  return (
    <button className="toggle" type="button" onClick={onToggle} aria-label="Toggle color theme">
      {isDark ? <MoonIcon size={18} /> : <SunIcon size={18} />}
      <span>{isDark ? 'Dark' : 'Light'} mode</span>
    </button>
  )
}
