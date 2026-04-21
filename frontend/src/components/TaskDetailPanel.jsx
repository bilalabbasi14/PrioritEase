import { useEffect, useState } from 'react'
import axios from '../api/axios'
import { formatDateInPakistan, parsePakistanDatetime } from '../utils/time'

const PRIORITY_COLOR = {
  high: { bg: 'rgba(220,38,38,0.12)', text: '#f87171', border: 'rgba(220,38,38,0.25)' },
  medium: { bg: 'rgba(234,179,8,0.12)', text: '#facc15', border: 'rgba(234,179,8,0.25)' },
  low: { bg: 'rgba(34,197,94,0.12)', text: '#4ade80', border: 'rgba(34,197,94,0.25)' },
}

const STATUS_COLOR = {
  pending: { bg: 'rgba(234,179,8,0.12)', text: '#facc15', border: 'rgba(234,179,8,0.25)' },
  completed: { bg: 'rgba(34,197,94,0.12)', text: '#4ade80', border: 'rgba(34,197,94,0.25)' },
  overdue: { bg: 'rgba(220,38,38,0.12)', text: '#f87171', border: 'rgba(220,38,38,0.25)' },
}

const Badge = ({ label, colors }) => (
  <span style={{
    fontSize: '10px',
    fontWeight: 500,
    letterSpacing: '0.06em',
    padding: '2px 7px',
    borderRadius: '20px',
    background: colors.bg,
    color: colors.text,
    border: `1px solid ${colors.border}`,
    whiteSpace: 'nowrap',
  }}>
    {label}
  </span>
)

const toPakistanDatetimeLocalValue = (value) => {
  const parsed = parsePakistanDatetime(value)
  if (!parsed) return ''

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(parsed)

  const year = parts.find((p) => p.type === 'year')?.value
  const month = parts.find((p) => p.type === 'month')?.value
  const day = parts.find((p) => p.type === 'day')?.value
  const hour = parts.find((p) => p.type === 'hour')?.value
  const minute = parts.find((p) => p.type === 'minute')?.value

  if (!year || !month || !day || !hour || !minute) return ''
  return `${year}-${month}-${day}T${hour}:${minute}`
}

const TaskDetailPanel = ({ taskId, courses = [], onClose, onUpdate }) => {
  const [task, setTask] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(null)

  useEffect(() => {
    if (!taskId) return

    axios.get(`/tasks/${taskId}`)
      .then((res) => {
        setTask(res.data)
        setForm(res.data)
      })
      .catch(console.error)
  }, [taskId])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await axios.put(`/tasks/${taskId}`, {
        title: form.title,
        description: form.description,
        deadline: form.deadline,
        course_id: form.course_id,
        user_priority: form.user_priority,
        status: form.status,
      })
      setTask(form)
      setEditing(false)
      onUpdate?.()
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async () => {
    await axios.patch(`/tasks/${taskId}/archive`)
    onClose?.()
    onUpdate?.()
  }

  const handleDelete = async () => {
    await axios.delete(`/tasks/${taskId}`)
    onClose?.()
    onUpdate?.()
  }

  const handleComplete = async () => {
    await axios.put(`/tasks/${taskId}`, { ...task, status: 'completed' })
    setTask((t) => ({ ...t, status: 'completed' }))
    onUpdate?.()
  }

  const inputStyle = {
    width: '100%',
    background: 'rgba(139,92,246,0.06)',
    border: '1px solid rgba(139,92,246,0.2)',
    borderRadius: '9px',
    padding: '9px 12px',
    color: '#e9d5ff',
    fontSize: '13px',
    fontFamily: 'DM Sans,sans-serif',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const selectStyle = {
    ...inputStyle,
    background: 'rgba(35, 22, 66, 0.95)',
    color: '#f5e8ff',
    WebkitTextFillColor: '#f5e8ff',
  }

  const optionStyle = {
    backgroundColor: '#1b1233',
    color: '#f5e8ff',
  }

  const labelStyle = {
    fontSize: '11px',
    color: 'rgba(167,139,250,0.4)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: '5px',
  }

  return (
    <div style={{
      position: 'fixed',
      top: 20,
      right: 20,
      width: 340,
      maxHeight: '90vh',
      overflowY: 'auto',
      zIndex: 150,
      background: 'rgba(15,10,30,0.95)',
      border: '1px solid rgba(139,92,246,0.2)',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 18px 45px rgba(0,0,0,0.45)',
      animation: 'slideIn 0.35s cubic-bezier(0.16,1,0.3,1) both',
    }}>
      {!task ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 130 }}>
          <div style={{
            width: 24,
            height: 24,
            border: '2px solid rgba(139,92,246,0.2)',
            borderTopColor: '#7c3aed',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <p style={{ fontSize: '11px', color: 'rgba(167,139,250,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {task.source === 'google' ? 'From Classroom' : 'Manual Task'}
            </p>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(167,139,250,0.4)',
                padding: '4px',
                borderRadius: '6px',
                transition: 'color 0.15s',
                display: 'flex',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#c084fc' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(167,139,250,0.4)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {editing ? (
            <div>
              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Title</label>
                <input value={form.title || ''} onChange={(e) => set('title', e.target.value)} style={inputStyle} disabled={task.source === 'google'} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Description</label>
                <textarea value={form.description || ''} onChange={(e) => set('description', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={labelStyle}>Deadline</label>
                  <input
                    type="datetime-local"
                    value={toPakistanDatetimeLocalValue(form.deadline)}
                    onChange={(e) => set('deadline', e.target.value)}
                    style={{ ...inputStyle, colorScheme: 'dark' }}
                    disabled={task.source === 'google'}
                  />
                </div>
                <div>
                  <label style={labelStyle}>My Priority</label>
                  <select value={form.user_priority || 'medium'} onChange={(e) => set('user_priority', e.target.value)} style={selectStyle}>
                    <option value="high" style={optionStyle}>High</option>
                    <option value="medium" style={optionStyle}>Medium</option>
                    <option value="low" style={optionStyle}>Low</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Status</label>
                <select value={form.status || 'pending'} onChange={(e) => set('status', e.target.value)} style={selectStyle}>
                  <option value="pending" style={optionStyle}>Pending</option>
                  <option value="completed" style={optionStyle}>Completed</option>
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Course</label>
                <select
                  value={form.course_id || ''}
                  onChange={(e) => set('course_id', e.target.value || null)}
                  style={selectStyle}
                  disabled={task.source === 'google'}
                >
                  <option value="" style={optionStyle}>No course</option>
                  {courses.map((c) => <option key={c.id} value={c.id} style={optionStyle}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setEditing(false)}
                  style={{
                    flex: 1,
                    padding: '9px',
                    background: 'rgba(139,92,246,0.08)',
                    border: '1px solid rgba(139,92,246,0.2)',
                    borderRadius: '9px',
                    color: 'rgba(167,139,250,0.6)',
                    cursor: 'pointer',
                    fontFamily: 'DM Sans,sans-serif',
                    fontSize: '13px',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: '9px',
                    background: 'rgba(139,92,246,0.2)',
                    border: '1px solid rgba(139,92,246,0.4)',
                    borderRadius: '9px',
                    color: '#e9d5ff',
                    cursor: 'pointer',
                    fontFamily: 'DM Sans,sans-serif',
                    fontSize: '13px',
                  }}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h3 style={{
                fontFamily: 'Poppins,sans-serif',
                fontSize: '17px',
                fontWeight: 600,
                color: task.status === 'completed' ? 'rgba(233,213,255,0.45)' : '#e9d5ff',
                textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                marginBottom: '12px',
                lineHeight: 1.4,
              }}>
                {task.title}
              </h3>

              {task.description && (
                <p style={{ fontSize: '13px', color: 'rgba(167,139,250,0.5)', marginBottom: '16px', lineHeight: 1.6 }}>
                  {task.description}
                </p>
              )}

              {[
                { label: 'Status', value: <Badge label={task.status} colors={STATUS_COLOR[task.status] || STATUS_COLOR.pending} /> },
                { label: 'DL Priority', value: <Badge label={task.deadline_priority} colors={PRIORITY_COLOR[task.deadline_priority]} /> },
                { label: 'My Priority', value: <Badge label={task.user_priority} colors={PRIORITY_COLOR[task.user_priority]} /> },
                { label: 'Course', value: task.course_name || '-' },
                {
                  label: 'Deadline',
                  value: task.deadline
                    ? formatDateInPakistan(task.deadline, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '-',
                },
              ].map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: '1px solid rgba(139,92,246,0.08)',
                  }}
                >
                  <span style={{ fontSize: '12px', color: 'rgba(167,139,250,0.4)' }}>{row.label}</span>
                  <span style={{ fontSize: '13px', color: 'rgba(233,213,255,0.7)', textAlign: 'right' }}>{row.value}</span>
                </div>
              ))}

              {task.classroom_link && (
                <a
                  href={task.classroom_link}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '14px',
                    fontSize: '13px',
                    color: '#c084fc',
                    textDecoration: 'none',
                    padding: '8px 12px',
                    background: 'rgba(139,92,246,0.08)',
                    border: '1px solid rgba(139,92,246,0.2)',
                    borderRadius: '9px',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(139,92,246,0.15)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(139,92,246,0.08)' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                  Open in Classroom
                </a>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                {task.status !== 'completed' && (
                  <button
                    onClick={handleComplete}
                    style={{
                      flex: 1,
                      padding: '9px',
                      background: 'rgba(34,197,94,0.1)',
                      border: '1px solid rgba(34,197,94,0.25)',
                      borderRadius: '9px',
                      color: '#4ade80',
                      cursor: 'pointer',
                      fontFamily: 'DM Sans,sans-serif',
                      fontSize: '13px',
                    }}
                  >
                    Complete
                  </button>
                )}
                <button
                  onClick={() => setEditing(true)}
                  style={{
                    flex: 1,
                    padding: '9px',
                    background: 'rgba(139,92,246,0.1)',
                    border: '1px solid rgba(139,92,246,0.25)',
                    borderRadius: '9px',
                    color: '#c084fc',
                    cursor: 'pointer',
                    fontFamily: 'DM Sans,sans-serif',
                    fontSize: '13px',
                  }}
                >
                  Edit
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  onClick={() => setConfirming('archive')}
                  style={{
                    flex: 1,
                    padding: '9px',
                    background: 'none',
                    border: '1px solid rgba(139,92,246,0.15)',
                    borderRadius: '9px',
                    color: 'rgba(167,139,250,0.5)',
                    cursor: 'pointer',
                    fontFamily: 'DM Sans,sans-serif',
                    fontSize: '12px',
                  }}
                >
                  Archive
                </button>
                {task.source !== 'google' && (
                  <button
                    onClick={() => setConfirming('delete')}
                    style={{
                      flex: 1,
                      padding: '9px',
                      background: 'none',
                      border: '1px solid rgba(220,38,38,0.2)',
                      borderRadius: '9px',
                      color: 'rgba(248,113,113,0.6)',
                      cursor: 'pointer',
                      fontFamily: 'DM Sans,sans-serif',
                      fontSize: '12px',
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {confirming && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)',
          }}
          onClick={(e) => e.target === e.currentTarget && setConfirming(null)}
        >
          <div style={{ background: '#0f0a1e', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '16px', padding: '24px', maxWidth: '300px', width: '100%' }}>
            <p style={{ fontSize: '15px', color: '#e9d5ff', marginBottom: '8px', fontWeight: 500 }}>
              {confirming === 'delete' ? 'Delete task?' : 'Archive task?'}
            </p>
            <p style={{ fontSize: '13px', color: 'rgba(167,139,250,0.5)', marginBottom: '20px' }}>
              {confirming === 'delete' ? 'This cannot be undone.' : "Task will be hidden and won't come back on sync."}
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setConfirming(null)}
                style={{
                  flex: 1,
                  padding: '9px',
                  background: 'rgba(139,92,246,0.08)',
                  border: '1px solid rgba(139,92,246,0.2)',
                  borderRadius: '9px',
                  color: 'rgba(167,139,250,0.6)',
                  cursor: 'pointer',
                  fontFamily: 'DM Sans,sans-serif',
                  fontSize: '13px',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirming === 'delete' ? handleDelete : handleArchive}
                style={{
                  flex: 1,
                  padding: '9px',
                  background: confirming === 'delete' ? 'rgba(220,38,38,0.15)' : 'rgba(139,92,246,0.15)',
                  border: `1px solid ${confirming === 'delete' ? 'rgba(220,38,38,0.35)' : 'rgba(139,92,246,0.35)'}`,
                  borderRadius: '9px',
                  color: confirming === 'delete' ? '#f87171' : '#c084fc',
                  cursor: 'pointer',
                  fontFamily: 'DM Sans,sans-serif',
                  fontSize: '13px',
                }}
              >
                {confirming === 'delete' ? 'Delete' : 'Archive'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskDetailPanel
