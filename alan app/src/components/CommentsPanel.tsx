import { useState, useEffect, useRef } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Comment, Profile } from '../lib/supabase'

interface Props {
  circuitId: string
  user: User | null
  profile: Profile | null
  onSignInClick: () => void
  onUpgradeClick: () => void
  onProfileUpdate: (p: Profile) => void
}

const PRESET_COLORS = [
  '#ffffff', '#ff4444', '#ff9900', '#ffcc00',
  '#44ff88', '#00ccff', '#aa66ff', '#ff66cc',
]

export default function CommentsPanel({ circuitId, user, profile, onSignInClick, onUpgradeClick, onProfileUpdate }: Props) {
  const [comments, setComments]     = useState<Comment[]>([])
  const [text, setText]             = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showColors, setShowColors] = useState(false)
  const bottomRef                   = useRef<HTMLDivElement>(null)
  const hexSaveTimer                = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isPro = profile?.tier === 'pro'
  const myColor = profile?.comment_color ?? '#ffffff'

  // Load comments for this circuit
  useEffect(() => {
    setComments([])
    supabase
      .from('comments')
      .select('*')
      .eq('circuit_id', circuitId)
      .order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setComments(data as Comment[]) })
  }, [circuitId])

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`comments:${circuitId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `circuit_id=eq.${circuitId}` },
        payload => setComments(prev =>
          prev.some(c => c.id === (payload.new as Comment).id)
            ? prev
            : [...prev, payload.new as Comment]
        ),
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'comments', filter: `circuit_id=eq.${circuitId}` },
        payload => setComments(prev => prev.filter(c => c.id !== payload.old.id)),
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [circuitId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments.length])

  function handleHexChange(color: string) {
    if (!user) return
    if (hexSaveTimer.current) clearTimeout(hexSaveTimer.current)
    hexSaveTimer.current = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .update({ comment_color: color })
        .eq('id', user.id)
        .select()
        .single()
      if (data) onProfileUpdate(data as Profile)
    }, 500)
  }

  async function handleColorSelect(color: string) {
    if (!user) return
    const { data } = await supabase
      .from('profiles')
      .update({ comment_color: color })
      .eq('id', user.id)
      .select()
      .single()
    if (data) onProfileUpdate(data as Profile)
    setShowColors(false)
  }

  async function handleSubmit() {
    if (!text.trim() || !user || submitting) return
    setSubmitting(true)
    const username = user.user_metadata?.full_name
      ?? user.user_metadata?.user_name
      ?? user.email?.split('@')[0]
      ?? 'Anonymous'
    const { data, error } = await supabase.from('comments').insert({
      user_id:       user.id,
      circuit_id:    circuitId,
      text:          text.trim(),
      username,
      comment_color: isPro ? myColor : null,
    }).select().single()
    if (error) {
      console.error('Comment insert failed:', error)
      setSubmitting(false)
      return
    }
    setComments(prev => [...prev, data as Comment])
    setText('')
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    await supabase.from('comments').delete().eq('id', id)
  }

  function formatTime(iso: string) {
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="comments-panel">
      <div className="comments-header">
        <span className="comments-title">Comments</span>
        <span className="comments-live-dot" title="Live" />
        {isPro && (
          <button
            className="comments-color-trigger"
            style={{ background: myColor }}
            onClick={() => setShowColors(v => !v)}
            title="Change comment color"
          />
        )}
      </div>

      {showColors && (
        <div className="comments-color-picker">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              className={`color-swatch ${myColor === c ? 'active' : ''}`}
              style={{ background: c }}
              onClick={() => handleColorSelect(c)}
            />
          ))}
          <input
            type="color"
            className="color-picker-hex"
            defaultValue={myColor}
            onChange={e => handleHexChange(e.target.value)}
            title="Custom color"
          />
        </div>
      )}

      <div className="comments-list">
        {comments.length === 0 && (
          <div className="comments-empty">No comments yet. Be the first!</div>
        )}
        {comments.map(c => (
          <div key={c.id} className={`comment ${c.user_id === user?.id ? 'comment-mine' : ''}`}>
            <div className="comment-meta">
              <span className="comment-username">{c.username}</span>
              <span className="comment-time">{formatTime(c.created_at)}</span>
              {c.user_id === user?.id && (
                <button className="comment-delete" onClick={() => handleDelete(c.id)} title="Delete">✕</button>
              )}
            </div>
            <div
              className="comment-text"
              style={c.comment_color ? { color: c.comment_color } : undefined}
            >
              {c.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="comments-input-area">
        {user ? (
          <>
            <textarea
              className="comments-textarea"
              placeholder="Add a comment…"
              value={text}
              onChange={e => setText(e.target.value)}
              rows={2}
              maxLength={500}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit() }}
            />
            <div className="comments-input-footer">
              <span className="comments-hint">⌘↵ to post</span>
              <button
                className="comments-submit"
                onClick={handleSubmit}
                disabled={!text.trim() || submitting}
              >
                Post
              </button>
            </div>
            {!isPro && (
              <button className="comments-go-pro" onClick={onUpgradeClick}>
                ✦ Go Pro — custom color & more
              </button>
            )}
          </>
        ) : (
          <button className="comments-signin-btn" onClick={onSignInClick}>
            Sign in to comment
          </button>
        )}
      </div>
    </div>
  )
}
