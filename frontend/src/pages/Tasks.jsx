import { useEffect, useState, useCallback } from 'react'
import axios from '../api/axios'
import { getPakistanCalendarDayDiff, parsePakistanDatetime } from '../utils/time'
import TaskDetailPanel from '../components/TaskDetailPanel'

const PRIORITY_COLOR = {
  high:   { bg:'rgba(220,38,38,0.12)',  text:'#f87171', border:'rgba(220,38,38,0.25)'  },
  medium: { bg:'rgba(234,179,8,0.12)',  text:'#facc15', border:'rgba(234,179,8,0.25)'  },
  low:    { bg:'rgba(34,197,94,0.12)',  text:'#4ade80', border:'rgba(34,197,94,0.25)'  },
}
const STATUS_COLOR = {
  pending:   { bg:'rgba(234,179,8,0.12)',  text:'#facc15', border:'rgba(234,179,8,0.25)'  },
  completed: { bg:'rgba(34,197,94,0.12)',  text:'#4ade80', border:'rgba(34,197,94,0.25)'  },
  overdue:   { bg:'rgba(220,38,38,0.12)',  text:'#f87171', border:'rgba(220,38,38,0.25)'  },
}

const Badge = ({ label, colors }) => (
  <span style={{ fontSize:'10px', fontWeight:500, letterSpacing:'0.06em', padding:'2px 7px',
    borderRadius:'20px', background:colors.bg, color:colors.text, border:`1px solid ${colors.border}`,
    whiteSpace:'nowrap' }}>
    {label}
  </span>
)

// Replace FilterChip with SegmentedControl
const SegmentedControl = ({ label, options, value, onChange }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
    <span style={{
      fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase',
      color: 'rgba(167,139,250,0.35)', fontFamily: 'DM Sans,sans-serif', paddingLeft: '2px'
    }}>
      {label}
    </span>
    <div style={{
      display: 'flex', background: 'rgba(15,10,30,0.7)', borderRadius: '10px',
      border: '1px solid rgba(139,92,246,0.15)', padding: '3px', gap: '2px',
    }}>
      {options.map(opt => {
        const active = value === opt.value
        return (
          <button key={opt.value} onClick={() => onChange(opt.value)} style={{
            padding: '5px 11px', borderRadius: '7px', fontSize: '12px', cursor: 'pointer',
            fontFamily: 'DM Sans,sans-serif', border: 'none', whiteSpace: 'nowrap',
            transition: 'all 0.15s cubic-bezier(0.16,1,0.3,1)',
            background: active ? 'rgba(139,92,246,0.25)' : 'transparent',
            color: active ? '#e9d5ff' : 'rgba(167,139,250,0.4)',
            boxShadow: active ? '0 1px 4px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(139,92,246,0.35)' : 'none',
            fontWeight: active ? 500 : 400,
          }}>
            {opt.label}
          </button>
        )
      })}
    </div>
  </div>
)

const TaskModal = ({ onClose, onSave, courses }) => {
  const [form, setForm] = useState({ title:'', description:'', deadline:'', course_id:'', user_priority:'medium' })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      await onSave({
        title: form.title.trim(),
        description: form.description.trim(),
        deadline: form.deadline || null,
        course_id: form.course_id || null,
        user_priority: form.user_priority,
      })
    } finally { setSaving(false) }
  }

  const inputStyle = { width:'100%', background:'rgba(139,92,246,0.06)', border:'1px solid rgba(139,92,246,0.2)',
    borderRadius:'10px', padding:'10px 12px', color:'#e9d5ff', fontSize:'14px',
    fontFamily:'DM Sans,sans-serif', outline:'none', boxSizing:'border-box' }
  const labelStyle = { fontSize:'12px', color:'rgba(167,139,250,0.5)', letterSpacing:'0.08em',
    textTransform:'uppercase', display:'block', marginBottom:'6px' }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:100,
      display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'#0f0a1e', border:'1px solid rgba(139,92,246,0.25)', borderRadius:'18px',
        padding:'28px', width:'100%', maxWidth:'420px', animation:'fadeUp 0.3s cubic-bezier(0.16,1,0.3,1) both' }}>
        <h2 style={{ fontFamily:'Poppins,sans-serif', fontSize:'18px', fontWeight:600,
          color:'#e9d5ff', marginBottom:'20px' }}>New Task</h2>

        <div style={{ marginBottom:'14px' }}>
          <label style={labelStyle}>Title</label>
          <input value={form.title} onChange={e => set('title', e.target.value)}
            placeholder="Task title" style={inputStyle} />
        </div>

        <div style={{ marginBottom:'14px' }}>
          <label style={labelStyle}>Description (optional)</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="Details..." rows={3}
            style={{ ...inputStyle, resize:'vertical' }} />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'14px' }}>
          <div>
            <label style={labelStyle}>Deadline</label>
            <input type="datetime-local" value={form.deadline} onChange={e => set('deadline', e.target.value)}
              style={{ ...inputStyle, colorScheme:'dark' }} />
          </div>
          <div>
            <label style={labelStyle}>Priority</label>
            <select value={form.user_priority} onChange={e => set('user_priority', e.target.value)}
              style={{ ...inputStyle }}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom:'24px' }}>
          <label style={labelStyle}>Course (optional)</label>
          <select value={form.course_id} onChange={e => set('course_id', e.target.value)}
            style={{ ...inputStyle }}>
            <option value="">No course</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div style={{ display:'flex', gap:'10px' }}>
          <button onClick={onClose}
            style={{ flex:1, padding:'10px', background:'rgba(139,92,246,0.08)',
              border:'1px solid rgba(139,92,246,0.2)', borderRadius:'10px',
              color:'rgba(167,139,250,0.6)', fontSize:'14px', cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={!form.title.trim() || saving}
            style={{ flex:1, padding:'10px', background:'rgba(139,92,246,0.2)',
              border:'1px solid rgba(139,92,246,0.4)', borderRadius:'10px', color:'#e9d5ff',
              fontSize:'14px', cursor:'pointer', fontFamily:'DM Sans,sans-serif',
              opacity: !form.title.trim() ? 0.5 : 1 }}>
            {saving ? 'Saving…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

const Tasks = () => {
  const [tasks, setTasks]       = useState([])
  const [courses, setCourses]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  // Filters
  const [statusFilter, setStatusFilter]   = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [courseFilter, setCourseFilter]   = useState('all')
  const [search, setSearch]               = useState('')

  const fetchAll = useCallback(async () => {
    try {
      const [tRes, cRes] = await Promise.all([
        axios.get('/tasks'),
        axios.get('/courses'),
      ])
      setTasks(tRes.data)
      setCourses(cRes.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleCreate = async (data) => {
    await axios.post('/tasks', data)
    setShowModal(false)
    fetchAll()
  }

  // Filter + search
  const SCORE = { high:3, medium:2, low:1 }
  const filtered = tasks
    .filter(t => statusFilter === 'all'   || t.status === statusFilter)
    .filter(t => priorityFilter === 'all' || t.user_priority === priorityFilter || t.deadline_priority === priorityFilter)
    .filter(t => courseFilter === 'all'   || String(t.course_id) === courseFilter)
    .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) =>
      (SCORE[b.deadline_priority] + SCORE[b.user_priority]) -
      (SCORE[a.deadline_priority] + SCORE[a.user_priority])
    )

  const formatDeadline = (dl) => {
    if (!dl) return null
    const d = parsePakistanDatetime(dl)
    if (!d) return null
    const now = new Date()

    if (d < now) return { text:'Overdue', color:'#f87171' }

    const dayDiff = getPakistanCalendarDayDiff(d, now)
    if (dayDiff == null) return null
    if (dayDiff === 0) return { text:'Due today', color:'#fb923c' }
    if (dayDiff === 1) return { text:'Due tomorrow', color:'#facc15' }
    return { text:`Due in ${dayDiff}d`, color:'rgba(167,139,250,0.45)' }
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
      <div style={{ width:32, height:32, border:'2px solid rgba(139,92,246,0.2)',
        borderTopColor:'#7c3aed', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=DM+Sans:wght@300;400&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}
        .task-row { display:flex; align-items:center; gap:12px; padding:14px 16px; border-radius:12px;
          background:rgba(15,10,30,0.6); border:1px solid rgba(139,92,246,0.1); margin-bottom:8px;
          cursor:pointer; transition:background 0.18s,border-color 0.18s,transform 0.15s; }
        .task-row:hover { background:rgba(139,92,246,0.08); border-color:rgba(139,92,246,0.25); transform:translateX(3px); }
        .task-row.selected { border-color:rgba(139,92,246,0.4); background:rgba(139,92,246,0.1); }
        .add-btn { display:flex; align-items:center; gap:8px; padding:'10px 18px';
          background:rgba(139,92,246,0.15); border:1px solid rgba(139,92,246,0.3); border-radius:10px;
          color:#c084fc; font-family:'DM Sans',sans-serif; font-size:14px; cursor:pointer;
          transition:background 0.18s,transform 0.15s; padding:10px 18px; }
        .add-btn:hover { background:rgba(139,92,246,0.25); transform:translateY(-1px); }
        .search-input { background:rgba(139,92,246,0.06); border:1px solid rgba(139,92,246,0.18);
          borderRadius:10px; padding:9px 14px; color:#e9d5ff; font-family:'DM Sans',sans-serif;
          font-size:14px; outline:none; width:220px; border-radius:10px; }
        .search-input::placeholder { color:rgba(167,139,250,0.3); }
      `}</style>

      <div style={{ fontFamily:'DM Sans,sans-serif', color:'#e9d5ff', display:'flex', gap:'24px', maxWidth:'1100px' }}>

        {/* ── Left: task list ── */}
        <div style={{ flex:1, minWidth:0, animation:'fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) both' }}>

          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'12px' }}>
            <h1 style={{ fontFamily:'Poppins,sans-serif', fontSize:'22px', fontWeight:600, color:'#e9d5ff' }}>Tasks</h1>
            <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
              <input className="search-input" placeholder="Search tasks…" value={search}
                onChange={e => setSearch(e.target.value)} />
              <button className="add-btn" onClick={() => setShowModal(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                New Task
              </button>
            </div>
          </div>

{/* Filters */}
<div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>

  {/* Row 1: Status + Priority — wraps to two rows on mobile naturally */}
  <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
    <SegmentedControl
      label="Status"
      value={statusFilter}
      onChange={setStatusFilter}
      options={[
        { value: 'all',       label: 'All' },
        { value: 'pending',   label: 'Pending' },
        { value: 'completed', label: 'Completed' },
        { value: 'overdue',   label: 'Overdue' },
      ]}
    />
    <SegmentedControl
      label="Priority"
      value={priorityFilter}
      onChange={setPriorityFilter}
      options={[
        { value: 'all',    label: 'All' },
        { value: 'high',   label: 'High' },
        { value: 'medium', label: 'Medium' },
        { value: 'low',    label: 'Low' },
      ]}
    />
  </div>

  {/* Row 2: Courses — wraps onto new lines, full width, mobile safe */}
  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: 0 }}>
    <span style={{
      fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase',
      color: 'rgba(167,139,250,0.35)', fontFamily: 'DM Sans,sans-serif', paddingLeft: '2px'
    }}>
      Course
    </span>
    <div style={{
      display: 'flex', flexWrap: 'wrap',          // wraps — NO overflowX
      background: 'rgba(15,10,30,0.7)', borderRadius: '10px',
      border: '1px solid rgba(139,92,246,0.15)',
      padding: '3px', gap: '2px',
      width: '100%', boxSizing: 'border-box',     // never exceeds parent width
    }}>
      {[{ value: 'all', label: 'All' }, ...courses.map(c => ({ value: String(c.id), label: c.name }))].map(opt => {
        const active = courseFilter === opt.value
        return (
          <button key={opt.value} onClick={() => setCourseFilter(opt.value)} style={{
            padding: '5px 11px', borderRadius: '7px', fontSize: '12px', cursor: 'pointer',
            fontFamily: 'DM Sans,sans-serif', border: 'none', whiteSpace: 'nowrap',
            transition: 'all 0.15s cubic-bezier(0.16,1,0.3,1)',
            background: active ? 'rgba(139,92,246,0.25)' : 'transparent',
            color: active ? '#e9d5ff' : 'rgba(167,139,250,0.4)',
            boxShadow: active ? '0 1px 4px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(139,92,246,0.35)' : 'none',
            fontWeight: active ? 500 : 400,
          }}>
            {opt.label}
          </button>
        )
      })}
    </div>
  </div>

</div>

          {/* Count */}
          <p style={{ fontSize:'12px', color:'rgba(167,139,250,0.35)', marginBottom:'14px', letterSpacing:'0.06em' }}>
            {filtered.length} task{filtered.length !== 1 ? 's' : ''}
          </p>

          {/* List */}
          {filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:'48px 20px', background:'rgba(15,10,30,0.5)',
              borderRadius:'14px', border:'1px dashed rgba(139,92,246,0.15)' }}>
              <p style={{ color:'rgba(167,139,250,0.4)', fontSize:'14px' }}>No tasks match your filters.</p>
            </div>
          ) : (
            filtered.map((t, i) => {
              const dl = formatDeadline(t.deadline)
              return (
                <div key={t.id} className={`task-row${selectedId === t.id ? ' selected' : ''}`}
                  style={{ animationDelay:`${i*0.03}s` }}
                  onClick={() => setSelectedId(selectedId === t.id ? null : t.id)}>
                  {/* Course dot */}
                  <div style={{ width:8, height:8, borderRadius:'50%', background:t.color || '#6366f1', flexShrink:0 }} />

                  {/* Title + course */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:'14px', color:'#e9d5ff', marginBottom:'3px',
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                      textDecoration: t.status==='completed' ? 'line-through' : 'none',
                      opacity: t.status==='completed' ? 0.5 : 1 }}>
                      {t.title}
                    </p>
                    {t.course_name && (
                      <p style={{ fontSize:'12px', color:'rgba(167,139,250,0.4)' }}>{t.course_name}</p>
                    )}
                  </div>

                  {/* Badges */}
                  <div style={{ display:'flex', gap:'5px', alignItems:'center', flexShrink:0 }}>
                    <Badge label={t.status} colors={STATUS_COLOR[t.status] || STATUS_COLOR.pending} />
                    <Badge label={`DL:${t.deadline_priority}`} colors={PRIORITY_COLOR[t.deadline_priority]} />
                    <Badge label={`My:${t.user_priority}`} colors={PRIORITY_COLOR[t.user_priority]} />
                    {dl && <span style={{ fontSize:'11px', color:dl.color }}>{dl.text}</span>}
                    {t.source === 'google' && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="rgba(167,139,250,0.4)" title="From Classroom">
                        <path d="M12 0C5.372 0 0 5.373 0 12s5.372 12 12 12 12-5.373 12-12S18.628 0 12 0zm-1.25 17.292l-4.5-4.364 1.857-1.857 2.643 2.506 5.643-5.643 1.857 1.857-7.5 7.501z"/>
                      </svg>
                    )}
                  </div>

                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.3)" strokeWidth="2" strokeLinecap="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              )
            })
          )}
        </div>

        {/* ── Right: task detail slide-in ── */}
        {selectedId && (
          <TaskDetailPanel
            taskId={selectedId}
            courses={courses}
            onClose={() => setSelectedId(null)}
            onUpdate={fetchAll}
          />
        )}
      </div>

      {showModal && (
        <TaskModal onClose={() => setShowModal(false)} onSave={handleCreate} courses={courses} />
      )}
    </>
  )
}

export default Tasks