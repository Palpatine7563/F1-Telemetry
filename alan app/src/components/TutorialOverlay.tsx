import { useEffect, useLayoutEffect, useRef, useState } from 'react'

export interface TutorialStep {
  selector?: string
  title: string
  body: string
  // preferred card placement relative to the spotlight; auto-detected if omitted
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

interface Rect { top: number; left: number; width: number; height: number }

interface Props {
  steps: TutorialStep[]
  onClose: () => void
}

const PAD = 12          // padding around spotlight
const CARD_W = 320      // info card width px
const CARD_MARGIN = 18  // gap between spotlight and card

export default function TutorialOverlay({ steps, onClose }: Props) {
  const [idx, setIdx] = useState(0)
  const [spotRect, setSpotRect] = useState<Rect | null>(null)
  const [cardPos, setCardPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const overlayRef = useRef<HTMLDivElement>(null)

  const step = steps[idx]
  const isLast = idx === steps.length - 1

  // Measure target element and compute spotlight + card positions
  useLayoutEffect(() => {
    if (!step.selector) {
      setSpotRect(null)
      return
    }
    const el = document.querySelector(step.selector) as HTMLElement | null
    if (!el) { setSpotRect(null); return }
    const r = el.getBoundingClientRect()
    const rect: Rect = {
      top:    r.top    - PAD,
      left:   r.left   - PAD,
      width:  r.width  + PAD * 2,
      height: r.height + PAD * 2,
    }
    setSpotRect(rect)
  }, [idx, step.selector])

  // Position the info card after spotlight rect is known
  useLayoutEffect(() => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    if (!spotRect) {
      // Centered card
      setCardPos({
        top:  Math.round(vh / 2 - 120),
        left: Math.round(vw / 2 - CARD_W / 2),
      })
      return
    }
    // Auto-detect placement using actual available space
    const spaceBelow = vh - (spotRect.top + spotRect.height)
    const spaceAbove = spotRect.top
    const spaceRight = vw - (spotRect.left + spotRect.width)
    const spaceLeft  = spotRect.left

    const placement = step.placement ?? (() => {
      if (spaceBelow >= 180) return 'bottom'
      if (spaceAbove >= 180) return 'top'
      if (spaceRight >= CARD_W + CARD_MARGIN) return 'right'
      if (spaceLeft  >= CARD_W + CARD_MARGIN) return 'left'
      return 'bottom'
    })()

    // If the explicit placement has no room, flip to the side with most space
    const resolvedPlacement = (() => {
      if (placement === 'right' && spaceRight < CARD_W + CARD_MARGIN) {
        if (spaceLeft >= CARD_W + CARD_MARGIN) return 'left'
        if (spaceBelow >= 180) return 'bottom'
        return 'top'
      }
      if (placement === 'left' && spaceLeft < CARD_W + CARD_MARGIN) {
        if (spaceRight >= CARD_W + CARD_MARGIN) return 'right'
        if (spaceBelow >= 180) return 'bottom'
        return 'top'
      }
      return placement
    })()

    let top = 0, left = 0
    const centerX = spotRect.left + spotRect.width  / 2
    const centerY = spotRect.top  + spotRect.height / 2

    if (resolvedPlacement === 'bottom') {
      top  = spotRect.top + spotRect.height + CARD_MARGIN
      left = centerX - CARD_W / 2
    } else if (resolvedPlacement === 'top') {
      top  = spotRect.top - CARD_MARGIN - 160
      left = centerX - CARD_W / 2
    } else if (resolvedPlacement === 'right') {
      top  = centerY - 80
      left = spotRect.left + spotRect.width + CARD_MARGIN
    } else if (resolvedPlacement === 'left') {
      top  = centerY - 80
      left = spotRect.left - CARD_MARGIN - CARD_W
    } else {
      top  = Math.round(vh / 2 - 120)
      left = Math.round(vw / 2 - CARD_W / 2)
    }

    // Hard clamp — card must never leave the viewport
    top  = Math.max(8, Math.min(vh - 240, top))
    left = Math.max(8, Math.min(vw - CARD_W - 8, left))

    setCardPos({ top, left })
  }, [spotRect, step.placement])

  // Scroll target into view
  useEffect(() => {
    if (!step.selector) return
    const el = document.querySelector(step.selector) as HTMLElement | null
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [idx, step.selector])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (isLast) onClose(); else setIdx(i => i + 1)
      }
      if (e.key === 'ArrowLeft') setIdx(i => Math.max(0, i - 1))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isLast, onClose])

  return (
    <div className="tutorial-root" ref={overlayRef}>
      {/* Dark backdrop — spotlight punches through via box-shadow */}
      {spotRect ? (
        <div
          className="tutorial-spotlight"
          style={{
            top:    spotRect.top,
            left:   spotRect.left,
            width:  spotRect.width,
            height: spotRect.height,
          }}
        />
      ) : (
        <div className="tutorial-backdrop" />
      )}

      {/* Info card */}
      <div
        className="tutorial-card"
        style={{ top: cardPos.top, left: cardPos.left, width: CARD_W }}
      >
        <div className="tutorial-step-counter">{idx + 1} / {steps.length}</div>
        <div className="tutorial-title">{step.title}</div>
        <div className="tutorial-body">{step.body}</div>
        <div className="tutorial-actions">
          <button className="tutorial-skip" onClick={onClose}>Skip tour</button>
          <div className="tutorial-nav">
            {idx > 0 && (
              <button className="tutorial-btn tutorial-btn-prev" onClick={() => setIdx(i => i - 1)}>←</button>
            )}
            <button
              className="tutorial-btn tutorial-btn-next"
              onClick={() => { if (isLast) onClose(); else setIdx(i => i + 1) }}
            >
              {isLast ? 'Done' : 'Next →'}
            </button>
          </div>
        </div>
        {/* Progress dots */}
        <div className="tutorial-dots">
          {steps.map((_, i) => (
            <button
              key={i}
              className={`tutorial-dot ${i === idx ? 'active' : ''}`}
              onClick={() => setIdx(i)}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
