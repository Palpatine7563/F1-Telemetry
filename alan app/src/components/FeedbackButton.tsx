import { useState, useRef, useEffect } from 'react'

type FeedbackType = 'bug' | 'suggestion' | 'other'

const TYPE_LABELS: Record<FeedbackType, string> = {
  bug:        'Bug report',
  suggestion: 'Suggestion',
  other:      'Other',
}

export default function FeedbackButton() {
  const [open, setOpen]       = useState(false)
  const [type, setType]       = useState<FeedbackType>('suggestion')
  const [message, setMessage] = useState('')
  const [sent, setSent]       = useState(false)
  const textareaRef           = useRef<HTMLTextAreaElement>(null)
  const panelRef              = useRef<HTMLDivElement>(null)

  // Focus textarea when panel opens
  useEffect(() => {
    if (open && !sent) textareaRef.current?.focus()
  }, [open, sent])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  function handleSubmit() {
    if (!message.trim()) return
    const subject = encodeURIComponent(`[f1vis] ${TYPE_LABELS[type]}`)
    const body    = encodeURIComponent(
      `${message.trim()}\n\n---\nURL: ${window.location.href}`
    )
    window.open(`mailto:privatetiles@gmail.com?subject=${subject}&body=${body}`)
    setSent(true)
    setTimeout(() => {
      setOpen(false)
      setSent(false)
      setMessage('')
      setType('suggestion')
    }, 2200)
  }

  return (
    <div className="fb-root" ref={panelRef}>
      {/* Slide-up panel */}
      <div className={`fb-panel ${open ? 'fb-panel-open' : ''}`} role="dialog" aria-label="Send feedback">
        {sent ? (
          <div className="fb-sent">
            <span className="fb-sent-check">✓</span>
            <span>Opening your email client…</span>
          </div>
        ) : (
          <>
            <div className="fb-panel-header">
              <span className="fb-panel-title">Send feedback</span>
              <button className="fb-close" onClick={() => setOpen(false)} aria-label="Close">✕</button>
            </div>

            <div className="fb-type-row">
              {(Object.keys(TYPE_LABELS) as FeedbackType[]).map(t => (
                <button
                  key={t}
                  className={`fb-type-pill ${type === t ? 'active' : ''}`}
                  onClick={() => setType(t)}
                >
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>

            <textarea
              ref={textareaRef}
              className="fb-textarea"
              placeholder={
                type === 'bug'
                  ? 'Describe what happened and how to reproduce it…'
                  : type === 'suggestion'
                  ? 'What would make this more useful?'
                  : "What's on your mind?"
              }
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
              }}
            />

            <div className="fb-footer">
              <span className="fb-hint">⌘↵ to send</span>
              <button
                className="fb-submit"
                onClick={handleSubmit}
                disabled={!message.trim()}
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>

      {/* Trigger tab */}
      <button
        className={`fb-trigger ${open ? 'fb-trigger-open' : ''}`}
        onClick={() => setOpen(v => !v)}
        aria-label="Open feedback"
      >
        Feedback
      </button>
    </div>
  )
}
