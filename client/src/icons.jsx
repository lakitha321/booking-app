const baseProps = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }

const Icon = ({ size = 18, children, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...baseProps} {...rest}>
    {children}
  </svg>
)

export const CalendarIcon = (props) => (
  <Icon {...props}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M8 2.5v3" />
    <path d="M16 2.5v3" />
    <path d="M4 9h16" />
    <path d="M8 13h3" />
    <path d="M8 16h3" />
    <path d="M14 13h2" />
  </Icon>
)

export const UsersIcon = (props) => (
  <Icon {...props}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="8" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </Icon>
)

export const ClockIcon = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Icon>
)

export const PlusIcon = (props) => (
  <Icon {...props}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </Icon>
)

export const RefreshIcon = (props) => (
  <Icon {...props}>
    <path d="M3 12a9 9 0 0 1 15.54-5.64L21 9" />
    <path d="M21 3v6h-6" />
    <path d="M21 12a9 9 0 0 1-15.54 5.64L3 15" />
    <path d="M3 21v-6h6" />
  </Icon>
)

export const EditIcon = (props) => (
  <Icon {...props}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
  </Icon>
)

export const TrashIcon = (props) => (
  <Icon {...props}>
    <path d="M3 6h18" />
    <path d="M8 6v13" />
    <path d="M16 6v13" />
    <path d="M5 6l1-3h12l1 3" />
    <path d="M10 6V3h4v3" />
  </Icon>
)

export const NoteIcon = (props) => (
  <Icon {...props}>
    <path d="M4 5a2 2 0 0 1 2-2h7l5 5v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
    <path d="M13 3v4a1 1 0 0 0 1 1h4" />
  </Icon>
)

export const SunIcon = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </Icon>
)

export const MoonIcon = (props) => (
  <Icon {...props}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
  </Icon>
)

export const ShieldIcon = (props) => (
  <Icon {...props}>
    <path d="M12 3 4 7v5c0 5 3.5 9 8 9s8-4 8-9V7Z" />
    <path d="M9 12h6" />
    <path d="M9 16h6" />
  </Icon>
)

export const PowerIcon = (props) => (
  <Icon {...props}>
    <path d="M12 2v10" />
    <path d="M7.5 4.2a8 8 0 1 0 9 0" />
  </Icon>
)
