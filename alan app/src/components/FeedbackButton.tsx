import { useState, useRef, useEffect } from 'react'

const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbwMeaEG79AvBdxlpOilHIbQja5eEw0xBcKRjoqZsOPR1LQkjZHdJpNJc8DdF1dqLU5lhg/exec'

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
  const [contact, setContact] = useState('')
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
    fetch(SHEETS_URL, {
      method:  'POST',
      mode:    'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        type:    TYPE_LABELS[type],
        message: message.trim(),
        contact: contact.trim() || undefined,
        url:     window.location.href,
      }),
    }).catch(() => {})
    setSent(true)
    setTimeout(() => {
      setOpen(false)
      setSent(false)
      setMessage('')
      setContact('')
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
            <span>Feedback sent — thanks!</span>
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

            <input
              className="fb-contact"
              type="text"
              placeholder="Contact (optional) — email, X, Discord…"
              value={contact}
              onChange={e => setContact(e.target.value)}
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
