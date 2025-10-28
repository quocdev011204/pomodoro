import { usePomodoro } from './components/Pomodoro'
import './App.css'

export default function App() {
  const {
    sessionType,
    isRunning,
    formatted,
    start,
    pause,
    reset,
    switchType,
    sessions,
    clearHistory,
  } = usePomodoro()

  return (
    <div className="container">
      <h1>Pomodoro</h1>
      <div className="mode">
        Chế độ: <strong>{sessionType === 'work' ? 'Làm việc (25)' : 'Nghỉ (5)'}</strong>
      </div>

      <div className={`timer ${sessionType}`}>
        {formatted}
      </div>

      <div className="controls">
        {!isRunning ? (
          <button className="primary" onClick={start}>Bắt đầu</button>
        ) : (
          <button onClick={pause}>Tạm dừng</button>
        )}
        <button onClick={reset}>Đặt lại</button>
        <button onClick={switchType}>Chuyển phiên</button>
      </div>

      <h2>Lịch sử</h2>
      <div className="history-actions">
        <button onClick={clearHistory}>Xoá lịch sử</button>
      </div>
      <ul className="history">
        {sessions.map(s => (
          <li key={s.id}>
            <span className={`chip ${s.type}`}>
              {s.type === 'work' ? 'Work' : 'Break'}
            </span>
            <span>
              {new Date(s.startedAt).toLocaleTimeString()} - {new Date(s.endedAt).toLocaleTimeString()}
              {' '}({Math.round(s.durationSec/60)}m)
            </span>
          </li>
        ))}
        {sessions.length === 0 && <li>Chưa có phiên nào</li>}
      </ul>
    </div>
  )
}