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

export default function App() {
  const [todos, setTodos] = useState(loadTodos)
  const [text, setText] = useState('')
  const [filter, setFilter] = useState('all')

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
    setTodos([{ id: crypto.randomUUID(), text: value, done: false }, ...todos])
    setText('')
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

  return (
    <main className="app">
      <header className="header">
        <div>
          <h1>Bin laden</h1>
          <p className="subtitle">Simple, responsive, and installable.</p>
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
        <button type="submit">Add</button>
      </form>

      <section className="toolbar" aria-label="Filters">
        <div className="filters">
          {['all', 'active', 'completed'].map((f) => (
            <button
              key={f}
              type="button"
              className={filter === f ? 'chip active' : 'chip'}
              onClick={() => setFilter(f)}
            >
              {f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button type="button" className="clear" onClick={clearCompleted} disabled={!todos.some(t => t.done)}>
          Clear completed
        </button>
      </section>

      {visible.length === 0 ? (
        <p className="empty">No tasks here.</p>
      ) : (
        <ul className="list">
          {visible.map((todo) => (
            <li key={todo.id} className={todo.done ? 'item done' : 'item'}>
              <label className="item-label">
                <input
                  type="checkbox"
                  checked={todo.done}
                  onChange={() => toggleTodo(todo.id)}
                />
                <span>{todo.text}</span>
              </label>
              <button className="delete" onClick={() => removeTodo(todo.id)} aria-label={`Delete ${todo.text}`}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <footer className="footer">Data is saved locally in your browser.</footer>
    </main>
  )
}