import { useEffect, useRef, useState } from 'react'

export type Theme = 'default' | 'pitwall' | 'carbon' | 'livery'

const TEAM_LIVERIES: Array<{ name: string; colors: string[]; bg: string }> = [
  // Papaya orange · black chassis · white · silver chrome
  { name: 'McLaren',         colors: ['#ff8000', '#1a1a1a', '#ffffff', '#8a8a8a'], bg: '#120800' },
  // Scuderia red · prancing-horse yellow · white · carbon black
  { name: 'Ferrari',         colors: ['#e8002d', '#ffed00', '#ffffff', '#1a1a1a'], bg: '#150003' },
  // Petronas teal · silver · black · white
  { name: 'Mercedes',        colors: ['#00d2be', '#c0c0c0', '#1a1a1a', '#ffffff'], bg: '#001a18' },
  // Navy blue · yellow · red · white
  { name: 'Red Bull Racing', colors: ['#1b3a8f', '#fcc900', '#cc1e1e', '#ffffff'], bg: '#03091a' },
  // BRG · lime-green · Aramco pink · silver
  { name: 'Aston Martin',    colors: ['#005038', '#a9c23f', '#f596b5', '#c0c0c0'], bg: '#021410' },
  // Blue · pink · white · black
  { name: 'Alpine',          colors: ['#0093cc', '#ff87bc', '#ffffff', '#1a1a1a'], bg: '#00101a' },
  // Gulf blue · white · red · dark blue
  { name: 'Williams',        colors: ['#005aff', '#ffffff', '#cc0000', '#0a1a66'], bg: '#04081a' },
  // Visa red · blue · white · dark navy
  { name: 'Racing Bulls',    colors: ['#cc1e1e', '#6692ff', '#ffffff', '#0f1a3d'], bg: '#1a0304' },
  // White · grey · MoneyGram red · black
  { name: 'Haas F1 Team',    colors: ['#eaeaea', '#b6babd', '#e10600', '#1a1a1a'], bg: '#131517' },
  // Dark red · silver · white · black
  { name: 'Audi',            colors: ['#bb0000', '#c8c8c8', '#ffffff', '#1a1a1a'], bg: '#160000' },
  // Light blue · navy · white · chrome
  { name: 'Cadillac',        colors: ['#c0c8ff', '#0a1033', '#ffffff', '#a0a8c0'], bg: '#090a1a' },
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
      const [c1, c2 = c1, c3 = c2, c4 = c3] = team.colors
      root.setAttribute('data-theme', 'default')
      root.style.setProperty('--accent',        c1)
      root.style.setProperty('--accent-2',      c2)
      root.style.setProperty('--accent-3',      c3)
      root.style.setProperty('--accent-4',      c4)
      root.style.setProperty('--accent-dark',   c1 + 'cc')
      root.style.setProperty('--accent-dim',    c1 + '18')
      root.style.setProperty('--bg-base',       team.bg)
      root.style.setProperty('--wash-opacity',  '0.13')
      return
    }
  }
  root.removeAttribute('style')
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
          const n = t.colors.length
          const stops = t.colors.map((c, i) => {
            const from = (i / n * 100).toFixed(0)
            const to   = ((i + 1) / n * 100).toFixed(0)
            return `${c} ${from}% ${to}%`
          }).join(', ')
          const swatchStyle = { background: `linear-gradient(135deg, ${stops})` }
          return (
            <button
              key={t.name}
              className={`settings-livery-btn ${theme === 'livery' && liveryTeam === t.name ? 'active' : ''}`}
              onClick={() => selectLivery(t.name)}
              title={t.name}
              style={{ '--team-color': t.colors[0] } as React.CSSProperties}
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
