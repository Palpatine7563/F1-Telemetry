import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

interface Props {
  user: User
  onClose: () => void
}

export default function ProModal({ user, onClose }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(
      'https://btdwvnanskfdgiaiadwc.supabase.co/functions/v1/create-checkout',
      {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ origin: window.location.origin }),
      },
    )
    const { url, error } = await res.json()
    if (error) { setLoading(false); return }
    window.location.href = url
  }

  return (
    <div className="auth-backdrop" onClick={onClose}>
      <div className="auth-modal pro-modal" onClick={e => e.stopPropagation()}>
        <button className="auth-close" onClick={onClose}>✕</button>
        <div className="pro-badge-hero">PRO</div>
        <div className="auth-title">Upgrade to F1vis Pro</div>
        <div className="auth-sub">$3 / month · cancel anytime</div>

        <ul className="pro-perks">
          <li>🎨 Custom comment color</li>
          <li>⭐ Pro badge on comments</li>
          <li>🔓 More perks coming soon</li>
        </ul>

        <button className="pro-upgrade-btn" onClick={handleUpgrade} disabled={loading}>
          {loading ? 'Redirecting…' : 'Upgrade now →'}
        </button>
      </div>
    </div>
  )
}
