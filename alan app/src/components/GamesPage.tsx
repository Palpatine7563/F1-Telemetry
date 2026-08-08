import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { CIRCUIT_DATA } from '../lib/circuitData'
import DailyChallenge from './DailyChallenge'

interface Props {
  authUser: User | null
  onSignIn?: () => void
}

type GameTab = 'circuit' | 'whoami' | 'trivia' | 'challenge'

// ── Helpers ──────────────────────────────────────────────────────────────────

const CIRCUIT_KEYS = Object.keys(CIRCUIT_DATA)

function pickOptions(correct: string, all: string[], n = 4): string[] {
  const pool = all.filter(k => k !== correct)
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return [correct, ...shuffled.slice(0, n - 1)].sort(() => Math.random() - 0.5)
}

function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function makeCircuitRound() {
  const key = CIRCUIT_KEYS[Math.floor(Math.random() * CIRCUIT_KEYS.length)]
  return { key, options: pickOptions(key, CIRCUIT_KEYS) }
}

// ── Driver puzzles ────────────────────────────────────────────────────────────

interface DriverPuzzle {
  answer: string
  clues: string[]
}

const DRIVER_PUZZLES: DriverPuzzle[] = [
  {
    answer: 'Lando Norris',
    clues: [
      'I drive for a team whose livery is papaya orange and carbon black.',
      'I was born in Bristol, England in 1999.',
      'I took my first Formula 1 win at the 2024 Miami Grand Prix.',
      'Fans call me "Last Lap Lando" — a nickname I have been trying to leave behind.',
    ],
  },
  {
    answer: 'Kimi Antonelli',
    clues: [
      'I was signed to a prestigious driver academy before my fifteenth birthday.',
      'I am Italian and made my Formula 1 debut in 2025 with a team based in Brackley.',
      'I replaced a seven-time world champion in my debut season.',
      'My first name is Andrea and my surname matches a famous Italian operatic tenor.',
    ],
  },
  {
    answer: 'Lewis Hamilton',
    clues: [
      'I hold the record for the most pole positions in Formula 1 history.',
      'I was the first Black driver to compete in Formula 1.',
      'I signed a headline-making move to a Maranello-based team for the 2025 season.',
      'I grew up in Stevenage, England and was karting before the age of eight.',
    ],
  },
  {
    answer: 'George Russell',
    clues: [
      'I became Formula 2 champion in my debut season in 2018.',
      'I am British and drive for a Silver Arrows team.',
      'I scored a famous maiden Grand Prix victory in Brazil in 2022.',
      'I am known for exceptional single-lap performance, particularly in wet conditions.',
    ],
  },
  {
    answer: 'Charles Leclerc',
    clues: [
      'I drive for a team whose home is in northern Italy and whose emblem is a prancing horse.',
      'I was born in Monte Carlo and have won the Monaco Grand Prix.',
      'I became the youngest driver to take pole position at Bahrain, and won there too.',
      'I was teammates with Kimi Räikkönen before Sebastian Vettel joined my team.',
    ],
  },
  {
    answer: 'Max Verstappen',
    clues: [
      'I am the youngest driver ever to start a Formula 1 race, at just 17 years old.',
      'I am Dutch and race for a Milton Keynes-based team whose title sponsor is an energy drink brand.',
      'I took my first Grand Prix win on debut for my new team at the 2016 Spanish Grand Prix.',
      'I won four consecutive Formula 1 World Championships from 2021 to 2024.',
    ],
  },
  {
    answer: 'Oscar Piastri',
    clues: [
      'I am Australian and won the Formula 2 championship in 2021.',
      'I drive for a team in papaya and black alongside a British driver.',
      'I famously rejected a public announcement that I would drive for a French team in 2023.',
      'I am known for being ice-cool under pressure and producing rapid out-laps on fresh tyres.',
    ],
  },
  {
    answer: 'Fernando Alonso',
    clues: [
      'I am a two-time Formula 1 World Champion, winning back-to-back in 2005 and 2006.',
      'I am Spanish, from Oviedo in Asturias, and am known for my relentless racecraft.',
      'I have competed in the Indianapolis 500 and the 24 Hours of Le Mans in pursuit of the Triple Crown.',
      'I currently drive for a team named after a Canadian province and continue racing into my forties.',
    ],
  },
]

function makeDriverPuzzle() {
  const idx = Math.floor(Math.random() * DRIVER_PUZZLES.length)
  return { puzzle: DRIVER_PUZZLES[idx], cluesShown: 1 }
}

// ── Trivia questions ──────────────────────────────────────────────────────────

interface TriviaQ {
  q: string
  options: string[]
  answer: string
  fact: string
}

const TRIVIA_BANK: TriviaQ[] = [
  {
    q: 'Which driver holds the record for the most Formula 1 World Championship titles?',
    options: ['Ayrton Senna', 'Michael Schumacher', 'Lewis Hamilton', 'Sebastian Vettel'],
    answer: 'Lewis Hamilton',
    fact: 'Lewis Hamilton and Michael Schumacher share the record with 7 championships each.',
  },
  {
    q: 'What is the name of the famous flat-out high-speed corner at Suzuka?',
    options: ['Maggotts', 'Eau Rouge', '130R', 'Pouhon'],
    answer: '130R',
    fact: '130R is named after its 130-metre radius. Taking it flat requires extraordinary aerodynamic trust.',
  },
  {
    q: 'Which country hosted the first ever Formula 1 World Championship race in 1950?',
    options: ['Italy', 'France', 'Germany', 'Great Britain'],
    answer: 'Great Britain',
    fact: 'The 1950 British Grand Prix at Silverstone was Round 1 of the first FIA World Championship.',
  },
  {
    q: 'What does DRS stand for in Formula 1?',
    options: ['Dynamic Racing System', 'Drag Reduction System', 'Drive Regulation Switch', 'Downforce Removal Segment'],
    answer: 'Drag Reduction System',
    fact: 'DRS opens a flap in the rear wing to cut drag. It was introduced in 2011 to aid overtaking.',
  },
  {
    q: 'At which circuit is the famous "Wall of Champions" located?',
    options: ['Monaco', 'Spa-Francorchamps', 'Monza', 'Circuit Gilles Villeneuve'],
    answer: 'Circuit Gilles Villeneuve',
    fact: 'The concrete barrier at the final chicane in Montreal has caught Schumacher, Hill, Villeneuve, and many other champions.',
  },
  {
    q: 'Which team has won the most F1 Constructors\' Championships in history?',
    options: ['McLaren', 'Ferrari', 'Mercedes', 'Red Bull'],
    answer: 'Ferrari',
    fact: 'Ferrari has won 16 Constructors\' Championships — more than any other team in Formula 1 history.',
  },
  {
    q: 'In which year did the V6 turbo-hybrid power unit era begin in Formula 1?',
    options: ['2010', '2012', '2014', '2016'],
    answer: '2014',
    fact: 'The 1.6L V6 turbo-hybrid era started in 2014. Mercedes dominated the opening years of the new regulations.',
  },
  {
    q: 'Which circuit has the lowest average race speed on the Formula 1 calendar?',
    options: ['Singapore', 'Monaco', 'Baku', 'Budapest'],
    answer: 'Monaco',
    fact: 'Monaco averages under 160 km/h — the slowest permanent venue — due to its narrow, winding street layout.',
  },
  {
    q: 'Who was the youngest Formula 1 World Champion at the time of their first title?',
    options: ['Fernando Alonso', 'Kimi Räikkönen', 'Sebastian Vettel', 'Max Verstappen'],
    answer: 'Sebastian Vettel',
    fact: 'Vettel won his first title in 2010 aged 23. He went on to win three more in a row.',
  },
  {
    q: 'Which team set the record for the fastest officially-timed F1 pitstop?',
    options: ['McLaren', 'Mercedes', 'Red Bull Racing', 'Ferrari'],
    answer: 'Red Bull Racing',
    fact: 'Red Bull Racing set a 1.82-second pitstop at the 2023 Bahrain Grand Prix — the fastest ever recorded.',
  },
  {
    q: 'Which circuit is nicknamed "The Temple of Speed"?',
    options: ['Spa-Francorchamps', 'Monza', 'Silverstone', 'Interlagos'],
    answer: 'Monza',
    fact: 'Monza\'s long straights and banked history allow top speeds approaching 380 km/h with low-downforce setups.',
  },
  {
    q: 'What colour flag signals the end of a Formula 1 race?',
    options: ['Red flag', 'Yellow flag', 'Blue flag', 'Chequered flag'],
    answer: 'Chequered flag',
    fact: 'The chequered flag has ended races since the earliest days of motor sport in the early 1900s.',
  },
  {
    q: 'Which Silverstone complex is one of the most demanding sequences of corners in Formula 1?',
    options: ['The Esses', 'Maggotts-Becketts-Chapel', 'Village-Loop-Aintree', 'Stowe-Vale-Club'],
    answer: 'Maggotts-Becketts-Chapel',
    fact: 'Drivers sustain over 4G laterally through Maggotts-Becketts-Chapel for more than three consecutive seconds.',
  },
  {
    q: 'How many points does a Formula 1 race winner receive under current regulations?',
    options: ['10', '20', '25', '30'],
    answer: '25',
    fact: 'The current 25-point system for a win was introduced in 2010, replacing the previous maximum of 10.',
  },
  {
    q: 'What does "pole position" mean in Formula 1?',
    options: ['First pit lane exit', 'Fastest lap in qualifying', 'Front row inside line', 'P1 on the starting grid'],
    answer: 'P1 on the starting grid',
    fact: 'The name "pole position" originates from the pole marking the first position at early American oval circuits.',
  },
]

// ── Circuit ID game ───────────────────────────────────────────────────────────

function CircuitGame() {
  const [round, setRound] = useState<{ key: string; options: string[] }>(makeCircuitRound)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)

  const data = CIRCUIT_DATA[round.key]

  function guess(key: string) {
    if (selected !== null) return
    setSelected(key)
    setTotal(t => t + 1)
    if (key === round.key) setScore(s => s + 1)
  }

  function next() {
    setRound(makeCircuitRound())
    setSelected(null)
  }

  return (
    <div className="game-area">
      <div className="game-score">{score} / {total} correct</div>
      <div className="game-card">
        <div className="circuit-clue-box">
          <p className="circuit-clue-char">"{data.character}"</p>
          <div className="circuit-clue-stats">
            <span>🔄 {data.direction}</span>
            <span>↩ {data.corners} corners</span>
            <span>📏 {data.length}</span>
            <span>🚀 {data.drsZones} DRS zones</span>
            <span>🏟 {data.circuitType}</span>
          </div>
        </div>
        <p className="game-prompt">Which circuit is this?</p>
        <div className="game-options">
          {round.options.map(key => {
            let cls = 'game-opt'
            if (selected !== null) {
              if (key === round.key) cls += ' correct'
              else if (key === selected) cls += ' wrong'
              else cls += ' dim'
            }
            return (
              <button key={key} className={cls} onClick={() => guess(key)}>
                {CIRCUIT_DATA[key].fullName}
              </button>
            )
          })}
        </div>
        {selected !== null && (
          <div className="game-result">
            {selected === round.key
              ? <span className="game-correct-msg">✓ Correct!</span>
              : <span className="game-wrong-msg">✗ {CIRCUIT_DATA[round.key].fullName}</span>
            }
            <button className="game-next-btn" onClick={next}>Next →</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Who Am I? game ────────────────────────────────────────────────────────────

const MAX_CLUES = 4
const PTS_BY_CLUES = [4, 3, 2, 1]

function WhoAmIGame() {
  const [state, setState] = useState<{ puzzle: DriverPuzzle; cluesShown: number }>(makeDriverPuzzle)
  const [input, setInput] = useState('')
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null)
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)

  const { puzzle, cluesShown } = state
  const pts = PTS_BY_CLUES[cluesShown - 1] ?? 1
  const done = result !== null

  function submit() {
    if (done || !input.trim()) return
    const isCorrect = input.trim().toLowerCase() === puzzle.answer.toLowerCase()
    setResult(isCorrect ? 'correct' : 'wrong')
    setTotal(t => t + 1)
    if (isCorrect) setScore(s => s + pts)
  }

  function showNextClue() {
    if (cluesShown >= MAX_CLUES || done) return
    setState(s => ({ ...s, cluesShown: s.cluesShown + 1 }))
  }

  function giveUp() {
    if (done) return
    setResult('wrong')
    setTotal(t => t + 1)
  }

  function next() {
    setState(makeDriverPuzzle())
    setInput('')
    setResult(null)
  }

  return (
    <div className="game-area">
      <div className="game-score">{score} pts · {total} played</div>
      <div className="game-card">
        <div className="whoami-pts-hint">
          Guess with {cluesShown} clue{cluesShown > 1 ? 's' : ''} → <strong>{pts} pt{pts > 1 ? 's' : ''}</strong>
        </div>
        <div className="whoami-clues">
          {puzzle.clues.slice(0, cluesShown).map((clue, i) => (
            <div key={i} className="whoami-clue">
              <span className="whoami-clue-num">{i + 1}</span>
              <span>{clue}</span>
            </div>
          ))}
        </div>
        {!done ? (
          <>
            <div className="whoami-input">
              <input
                type="text"
                placeholder="Driver name…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()}
              />
              <button className="game-clue-btn" onClick={submit} disabled={!input.trim()}>Guess</button>
            </div>
            <div className="whoami-controls">
              {cluesShown < MAX_CLUES && (
                <button className="game-clue-btn" onClick={showNextClue}>
                  Show clue {cluesShown + 1}
                </button>
              )}
              <button className="game-giveup-btn" onClick={giveUp}>Give up</button>
            </div>
          </>
        ) : (
          <div className="game-result">
            {result === 'correct'
              ? <span className="game-correct-msg">✓ Correct! +{pts} pts</span>
              : <span className="game-wrong-msg">✗ It was {puzzle.answer}</span>
            }
            <button className="game-next-btn" onClick={next}>Next →</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── F1 Trivia game ────────────────────────────────────────────────────────────

function TriviaGame() {
  const [questions] = useState<TriviaQ[]>(() => shuffleArr(TRIVIA_BANK))
  const [qIdx, setQIdx] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  const q = questions[qIdx]
  const isLast = qIdx + 1 >= questions.length

  function pick(opt: string) {
    if (selected !== null) return
    setSelected(opt)
    if (opt === q.answer) setScore(s => s + 1)
  }

  function next() {
    if (isLast) {
      setFinished(true)
    } else {
      setQIdx(i => i + 1)
      setSelected(null)
    }
  }

  function restart() {
    setQIdx(0)
    setSelected(null)
    setScore(0)
    setFinished(false)
  }

  if (finished) {
    const pct = score / questions.length
    return (
      <div className="game-area">
        <div className="game-card game-finished">
          <p className="game-finish-headline">Quiz complete!</p>
          <p className="game-finish-score">{score} / {questions.length}</p>
          <p className="game-finish-msg">
            {pct === 1 ? 'Perfect score — you really know your F1!' :
             pct >= 0.8 ? 'Excellent — you\'re a serious fan.' :
             pct >= 0.5 ? 'Solid effort. Keep watching!' :
             'Keep watching the races — you\'ll get there!'}
          </p>
          <button className="game-next-btn" onClick={restart}>Play again</button>
        </div>
      </div>
    )
  }

  return (
    <div className="game-area">
      <div className="game-q-num">Q {qIdx + 1} / {questions.length} · {score} pts</div>
      <div className="game-card">
        <p className="game-prompt">{q.q}</p>
        <div className="game-options">
          {q.options.map(opt => {
            let cls = 'game-opt'
            if (selected !== null) {
              if (opt === q.answer) cls += ' correct'
              else if (opt === selected) cls += ' wrong'
              else cls += ' dim'
            }
            return (
              <button key={opt} className={cls} onClick={() => pick(opt)}>{opt}</button>
            )
          })}
        </div>
        {selected !== null && (
          <div className="game-result">
            {selected === q.answer
              ? <span className="game-correct-msg">✓ Correct!</span>
              : <span className="game-wrong-msg">✗ {q.answer}</span>
            }
            <p className="game-fact">{q.fact}</p>
            <button className="game-next-btn" onClick={next}>
              {isLast ? 'See results' : 'Next →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function GamesPage({ authUser, onSignIn }: Props) {
  const [tab, setTab] = useState<GameTab>('circuit')

  return (
    <div className="games-page">
      <div className="games-header">
        <h1 className="games-title">F1 Games</h1>
        <p className="games-sub">Test your Formula 1 knowledge with three mini-games</p>
      </div>

      <div className="games-tab-bar">
        <button
          className={`games-tab ${tab === 'circuit' ? 'active' : ''}`}
          onClick={() => setTab('circuit')}
        >
          🗺 Circuit ID
        </button>
        <button
          className={`games-tab ${tab === 'whoami' ? 'active' : ''}`}
          onClick={() => setTab('whoami')}
        >
          👤 Who Am I?
        </button>
        <button
          className={`games-tab ${tab === 'trivia' ? 'active' : ''}`}
          onClick={() => setTab('trivia')}
        >
          🎯 F1 Trivia
        </button>
        <button
          className={`games-tab ${tab === 'challenge' ? 'active' : ''}`}
          onClick={() => setTab('challenge')}
        >
          📅 Daily Challenge
        </button>
      </div>

      <div className="games-content">
        {tab === 'circuit' && <CircuitGame />}
        {tab === 'whoami' && <WhoAmIGame />}
        {tab === 'trivia' && <TriviaGame />}
        {tab === 'challenge' && <DailyChallenge />}
      </div>

      {!authUser && (
        <div className="games-save-bar">
          <span>🔒 <strong>Login to save your progress</strong> and track high scores</span>
          {onSignIn && (
            <button className="games-save-signin" onClick={onSignIn}>Sign in</button>
          )}
        </div>
      )}
    </div>
  )
}
