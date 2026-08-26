import { useEffect, useRef, useState } from 'react'

export type Theme = 'default' | 'pitwall' | 'carbon' | 'livery'

const TEAM_LIVERIES: Array<{ name: string; color: string; color2?: string; bg: string }> = [
  { name: 'McLaren',         color: '#ff8000', color2: '#000000', bg: '#120800' },
  { name: 'Ferrari',         color: '#e8002d', color2: '#ffed00', bg: '#150003' },
  { name: 'Mercedes',        color: '#00d2be', color2: '#c0c0c0', bg: '#001a18' },
  { name: 'Red Bull Racing', color: '#3671c6', color2: '#fcc900', bg: '#03091a' },
  { name: 'Aston Martin',    color: '#358c75', color2: '#a9c23f', bg: '#021410' },
  { name: 'Alpine',          color: '#0093cc', color2: '#ff87bc', bg: '#00101a' },
  { name: 'Williams',        color: '#005aff', color2: '#e8e8e8', bg: '#04081a' },
  { name: 'Racing Bulls',    color: '#6692ff', color2: '#cc1e1e', bg: '#05091a' },
  { name: 'Haas F1 Team',    color: '#b6babd', color2: '#e8002d', bg: '#131517' },
  { name: 'Audi',            color: '#bb0000', color2: '#c0c0c0', bg: '#160000' },
  { name: 'Cadillac',        color: '#c0c8ff', color2: '#0033ff', bg: '#090a1a' },
]

const PRESETS = [
  { key: 'default',  label: 'Red Flag',  swatch: '#e10600', desc: 'Classic F1 red accent' },
  { key: 'pitwall',  label: 'Pit Wall',  swatch: '#e8e4dc', desc: 'Monochrome — team colors only' },
  { key: 'carbon',   label: 'Carbon',    swatch: '#b8b4ae', desc: 'Warm-dark, titanium accent' },
] as const

const STORAGE_KEY = 'f1vis-theme'
const LIVERY_KEY  = 'f1vis-livery-team'

export function getStoredTheme(): { theme: Theme; liveryTeam: string | null } {
  try {
    const theme = (localStorage.getItem(STORAGE_KEY) as Theme) ?? 'default'
    const liveryTeam = localStorage.getItem(LIVERY_KEY)
    return { theme, liveryTeam }
  } catch {
    return { theme: 'default', liveryTeam: null }
  }
}

export function applyTheme(theme: Theme, liveryTeam: string | null) {
  const root = document.documentElement
  if (theme === 'livery' && liveryTeam) {
    const team = TEAM_LIVERIES.find(t => t.name === liveryTeam)
    if (team) {
      root.setAttribute('data-theme', 'default')
      root.style.setProperty('--accent',   team.color)
      root.style.setProperty('--accent-2', team.color2 ?? team.color)
      root.style.setProperty('--accent-dark', team.color + 'cc')
      root.style.setProperty('--accent-dim',  team.color + '18')
      root.style.setProperty('--bg-base', team.bg)
      return
    }
  }
  root.removeAttribute('style')
  root.style.setProperty('--accent-2', 'var(--accent)')
  if (theme === 'default') {
    root.removeAttribute('data-theme')
  } else {
    root.setAttribute('data-theme', theme)
  }
}

interface Props {
  onClose: () => void
}

export default function Settings({ onClose }: Props) {
  const [theme, setTheme]           = useState<Theme>(() => getStoredTheme().theme)
  const [liveryTeam, setLiveryTeam] = useState<string | null>(() => getStoredTheme().liveryTeam)
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [onClose])

  function selectPreset(t: Theme) {
    setTheme(t)
    try {
      localStorage.setItem(STORAGE_KEY, t)
      localStorage.removeItem(LIVERY_KEY)
    } catch {}
    applyTheme(t, null)
  }

  function selectLivery(teamName: string) {
    setTheme('livery')
    setLiveryTeam(teamName)
    try {
      localStorage.setItem(STORAGE_KEY, 'livery')
      localStorage.setItem(LIVERY_KEY, teamName)
    } catch {}
    applyTheme('livery', teamName)
  }

  return (
    <div className="settings-panel" ref={panelRef}>
      <div className="settings-header">
        <span className="settings-title">Appearance</span>
        <button className="settings-close" onClick={onClose}>✕</button>
      </div>

      <div className="settings-section-label">Theme</div>
      <div className="settings-presets">
        {PRESETS.map(p => (
          <button
            key={p.key}
            className={`settings-preset ${theme === p.key ? 'active' : ''}`}
            onClick={() => selectPreset(p.key)}
          >
            <span className="settings-swatch" style={{ background: p.swatch }} />
            <span className="settings-preset-label">{p.label}</span>
            <span className="settings-preset-desc">{p.desc}</span>
          </button>
        ))}
      </div>

      <div className="settings-section-label" style={{ marginTop: 16 }}>Team Livery</div>
      <div className="settings-liveries">
        {TEAM_LIVERIES.map(t => {
          const swatchStyle = t.color2
            ? { background: `linear-gradient(135deg, ${t.color} 50%, ${t.color2} 50%)` }
            : { background: t.color }
          return (
            <button
              key={t.name}
              className={`settings-livery-btn ${theme === 'livery' && liveryTeam === t.name ? 'active' : ''}`}
              onClick={() => selectLivery(t.name)}
              title={t.name}
              style={{ '--team-color': t.color } as React.CSSProperties}
            >
              <span className="settings-livery-dot" style={swatchStyle} />
              <span className="settings-livery-name">{t.name.replace(' F1 Team', '').replace(' Racing', '')}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
