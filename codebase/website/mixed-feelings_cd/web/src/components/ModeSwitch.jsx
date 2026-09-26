// The slide switch between the two directions of the app.
//   music:    Spotify → your genres → mental-health results (light)
//   feelings: your four scores → the music people like you listen to (dark)
export default function ModeSwitch({ mode, onChange }) {
  const feelings = mode === 'feelings'
  return (
    <div className="mode-bar">
      <button
        className={`mode-switch ${feelings ? 'is-feelings' : ''}`}
        role="switch"
        aria-checked={feelings}
        aria-label="Switch between Music to Feelings and Feelings to Music"
        onClick={() => onChange(feelings ? 'music' : 'feelings')}
      >
        <span className="mode-track" aria-hidden="true">
          <span className="mode-knob">{feelings ? '☾' : '♫'}</span>
        </span>
        <span className="mode-label">
          {feelings ? <>Switch to <b>Music → Feelings</b></> : <>Switch to <b>Feelings → Music</b></>}
        </span>
      </button>
    </div>
  )
}
