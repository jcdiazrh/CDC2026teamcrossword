import { useEffect, useState } from 'react'

const LINES = [
  'Flipping through your top 50 artists…',
  'Sorting micro-genres into 16 buckets…',
  'Finding survey listeners who sound like you…',
  'Workshopping your title…',
]

export default function Loading({ message }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % LINES.length), 900)
    return () => clearInterval(t)
  }, [])
  return (
    <main className="loading" aria-live="polite">
      <div className="record record-spin">
        <div className="record-label"><span>♪</span></div>
      </div>
      <p key={message || i} className="loading-line">{message || LINES[i]}</p>
    </main>
  )
}
