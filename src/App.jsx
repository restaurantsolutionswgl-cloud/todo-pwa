import { useEffect, useMemo, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'todo-pwa-items'

function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function pad(n) { return String(n).padStart(2, '0') }
function toDateStr(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }

export default function App() {
  const [todos, setTodos] = useState(loadTodos)
  const [text, setText] = useState('')
  const [due, setDue] = useState('')
  const [filter, setFilter] = useState('all')
  const [view, setView] = useState('list')
  const [month, setMonth] = useState(() => {
    const d = new Date(); d.setDate(1); return d
  })
  const [selected, setSelected] = useState(() => toDateStr(new Date()))

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
  }, [todos])

  const remaining = todos.filter((t) => !t.done).length

  const visible = useMemo(() => {
    if (filter === 'active') return todos.filter((t) => !t.done)
    if (filter === 'completed') return todos.filter((t) => t.done)
    return todos
  }, [todos, filter])

  function addTodo(e) {
    e.preventDefault()
    const value = text.trim()
    if (!value) return
    setTodos([{ id: crypto.randomUUID(), text: value, done: false, due: due || null }, ...todos])
    setText('')
    setDue('')
  }

  function toggleTodo(id) {
    setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  }

  function removeTodo(id) {
    setTodos(todos.filter((t) => t.id !== id))
  }

  function clearCompleted() {
    setTodos(todos.filter((t) => !t.done))
  }

  const year = month.getFullYear()
  const m = month.getMonth()
  const firstDay = new Date(year, m, 1).getDay()
  const daysInMonth = new Date(year, m + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const remindersByDate = useMemo(() => {
    const map = {}
    todos.forEach((t) => { if (t.due) { (map[t.due] ||= []).push(t) } })
    return map
  }, [todos])

  const selectedTodos = remindersByDate[selected] || []
  const monthLabel = month.toLocaleString(undefined, { month: 'long', year: 'numeric' })

  return (
    <main className="app">
      <header className="header">
        <div>
          <h1>Bin laden</h1>
          <p className="subtitle">Tasks with reminders and calendar.</p>
        </div>
        <span className="badge" aria-live="polite">{remaining} left</span>
      </header>

      <form className="add-form" onSubmit={addTodo}>
        <label className="sr-only" htmlFor="new-todo">Add a task</label>
        <input
          id="new-todo"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What needs to be done?"
          maxLength={120}
          autoComplete="off"
        />
        <input
          type="date"
          className="date-input"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          aria-label="Reminder date"
        />
        <button type="submit">Add</button>
      </form>

      <section className="toolbar" aria-label="Views and filters">
        <div className="filters">
          {['list', 'calendar'].map((v) => (
            <button key={v} type="button" className={view === v ? 'chip active' : 'chip'} onClick={() => setView(v)}>
              {v[0].toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
        {view === 'list' && (
          <div className="filters">
            {['all', 'active', 'completed'].map((f) => (
              <button key={f} type="button" className={filter === f ? 'chip active' : 'chip'} onClick={() => setFilter(f)}>
                {f[0].toUpperCase() + f.slice(1)}
              </button>
            ))}
            <button type="button" className="clear" onClick={clearCompleted} disabled={!todos.some(t => t.done)}>
              Clear completed
            </button>
          </div>
        )}
      </section>

      {view === 'list' ? (
        visible.length === 0 ? (
          <p className="empty">No tasks here.</p>
        ) : (
          <ul className="list">
            {visible.map((todo) => (
              <li key={todo.id} className={todo.done ? 'item done' : 'item'}>
                <label className="item-label">
                  <input type="checkbox" checked={todo.done} onChange={() => toggleTodo(todo.id)} />
                  <span>
                    {todo.text}
                    {todo.due && <small className="due">Due: {todo.due}</small>}
                  </span>
                </label>
                <button className="delete" onClick={() => removeTodo(todo.id)} aria-label={`Delete ${todo.text}`}>×</button>
              </li>
            ))}
          </ul>
        )
      ) : (
        <section className="calendar" aria-label="Reminder calendar">
          <div className="cal-header">
            <button type="button" className="chip" onClick={() => setMonth(new Date(year, m - 1, 1))}>‹</button>
            <strong>{monthLabel}</strong>
            <button type="button" className="chip" onClick={() => setMonth(new Date(year, m + 1, 1))}>›</button>
          </div>
          <div className="cal-grid cal-weekdays">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="cal-wd">{d}</div>)}
          </div>
          <div className="cal-grid">
            {cells.map((d, i) => {
              if (!d) return <div key={`e-${i}`} className="cal-cell empty-cell" />
              const ds = `${year}-${pad(m + 1)}-${pad(d)}`
              const has = remindersByDate[ds]
              return (
                <button
                  key={ds}
                  type="button"
                  className={`cal-cell ${selected === ds ? 'selected' : ''} ${has ? 'has-reminder' : ''}`}
                  onClick={() => setSelected(ds)}
                >
                  <span>{d}</span>
                  {has && <span className="dot" aria-hidden="true" />}
                </button>
              )
            })}
          </div>
          <div className="cal-detail">
            <h2>Reminders for {selected}</h2>
            {selectedTodos.length === 0 ? (
              <p className="empty">No reminders for this day.</p>
            ) : (
              <ul className="list">
                {selectedTodos.map((todo) => (
                  <li key={todo.id} className={todo.done ? 'item done' : 'item'}>
                    <label className="item-label">
                      <input type="checkbox" checked={todo.done} onChange={() => toggleTodo(todo.id)} />
                      <span>{todo.text}</span>
                    </label>
                    <button className="delete" onClick={() => removeTodo(todo.id)} aria-label={`Delete ${todo.text}`}>×</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      <footer className="footer">Data is saved locally in your browser.</footer>
    </main>
  )
}