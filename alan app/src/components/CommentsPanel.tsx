import { useState, useEffect, useRef } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Comment } from '../lib/supabase'

interface Props {
  circuitId: string
  user: User | null
  onSignInClick: () => void
}

export default function CommentsPanel({ circuitId, user, onSignInClick }: Props) {
  const [comments, setComments]   = useState<Comment[]>([])
  const [text, setText]           = useState('')
  const [submitting, setSubmitting] = useState(false)
  const bottomRef                 = useRef<HTMLDivElement>(null)

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

  // Scroll to bottom when new comments arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments.length])

  async function handleSubmit() {
    if (!text.trim() || !user || submitting) return
    setSubmitting(true)
    const username = user.user_metadata?.full_name
      ?? user.user_metadata?.user_name
      ?? user.email?.split('@')[0]
      ?? 'Anonymous'
    const { data, error } = await supabase.from('comments').insert({
      user_id:    user.id,
      circuit_id: circuitId,
      text:       text.trim(),
      username,
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
      </div>

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
            <div className="comment-text">{c.text}</div>
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
