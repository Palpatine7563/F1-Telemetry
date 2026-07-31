const CHANGELOG: { version: string; date: string; entries: { tag: string; text: string }[] }[] = [
  {
    version: '1.4',
    date: 'Jul 2026',
    entries: [
      { tag: 'new',  text: 'Real-time comments — live across all viewers via WebSocket' },
      { tag: 'new',  text: 'Sign in with Google or GitHub' },
      { tag: 'new',  text: 'F1vis Pro — ad-free, custom comment color, CSV telemetry download, Pro badge' },
    ],
  },
  {
    version: '1.3',
    date: 'Jul 2026',
    entries: [
      { tag: 'new',  text: 'Race control messages — sector yellows, safety car, and red flag overlays on the track map' },
      { tag: 'new',  text: 'White default track color with flag-state coloring' },
      { tag: 'new',  text: 'SC / VSC / RED FLAG badge indicator on the track map' },
    ],
  },
  {
    version: '1.2',
    date: 'Jun 2026',
    entries: [
      { tag: 'new',  text: 'Team radio synchronized to full-race replays' },
      { tag: 'new',  text: 'Radio timestamp navigation — jump to previous/next call' },
      { tag: 'new',  text: 'Transcribed radio captions via Whisper' },
    ],
  },
  {
    version: '1.1',
    date: 'Jun 2026',
    entries: [
      { tag: 'new',  text: 'Interactive tutorial tour for new visitors' },
      { tag: 'new',  text: 'Feedback button — report bugs or suggest features' },
      { tag: 'fix',  text: 'Tutorial card no longer goes off-screen on smaller displays' },
    ],
  },
  {
    version: '1.0',
    date: 'May 2026',
    entries: [
      { tag: 'new',  text: 'Full-race telemetry replay with play/pause and speed controls' },
      { tag: 'new',  text: 'Mini sector timeline at the bottom of the replay' },
      { tag: 'new',  text: 'Pace analysis — compare fastest laps across the grid' },
      { tag: 'new',  text: 'Battle tracker — gap chart between drivers through the race' },
      { tag: 'new',  text: 'Daily telemetry challenge' },
      { tag: 'new',  text: 'Historic race replays' },
      { tag: 'new',  text: 'Race insights, standings, results, calendar, drivers, teams, circuits pages' },
    ],
  },
]

const TAG_STYLE: Record<string, { label: string; color: string }> = {
  new:  { label: 'New',  color: '#6366f1' },
  fix:  { label: 'Fix',  color: '#22c55e' },
  impr: { label: 'Impr', color: '#f59e0b' },
}

export default function ChangelogPage() {
  return (
    <div className="static-page changelog-page">
      <h1 className="static-page-title">What's new</h1>
      <div className="changelog-list">
        {CHANGELOG.map(release => (
          <div key={release.version} className="changelog-release">
            <div className="changelog-release-header">
              <span className="changelog-version">v{release.version}</span>
              <span className="changelog-date">{release.date}</span>
            </div>
            <ul className="changelog-entries">
              {release.entries.map((e, i) => {
                const tag = TAG_STYLE[e.tag] ?? TAG_STYLE.new
                return (
                  <li key={i} className="changelog-entry">
                    <span className="changelog-tag" style={{ background: tag.color }}>{tag.label}</span>
                    <span className="changelog-text">{e.text}</span>
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
