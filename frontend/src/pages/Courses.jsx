import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from '../api/axios'

const COLORS = [
  '#7c3aed','#2563eb','#059669','#d97706',
  '#dc2626','#db2777','#0891b2','#65a30d',
  '#9333ea','#ea580c','#0284c7','#16a34a',
]

const Pill = ({ children, color = 'purple' }) => {
  const map = {
    purple: { bg: 'rgba(139,92,246,0.12)', text: '#c084fc', border: 'rgba(139,92,246,0.25)' },
    green:  { bg: 'rgba(34,197,94,0.12)',  text: '#4ade80', border: 'rgba(34,197,94,0.25)'  },
    red:    { bg: 'rgba(220,38,38,0.12)',  text: '#f87171', border: 'rgba(220,38,38,0.25)'  },
    yellow: { bg: 'rgba(234,179,8,0.12)',  text: '#facc15', border: 'rgba(234,179,8,0.25)'  },
  }
  const c = map[color]
  return (
    <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'20px',
      background:c.bg, color:c.text, border:`1px solid ${c.border}`, fontWeight:500 }}>
      {children}
    </span>
  )
}

const Modal = ({ onClose, onSave, initial }) => {
  const [name, setName]   = useState(initial?.name || '')
  const [desc, setDesc]   = useState(initial?.description || '')
  const [color, setColor] = useState(initial?.color || COLORS[0])
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try { await onSave({ name: name.trim(), description: desc.trim(), color }) }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:100,
      display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'#0f0a1e', border:'1px solid rgba(139,92,246,0.25)',
        borderRadius:'18px', padding:'28px', width:'100%', maxWidth:'400px',
        animation:'fadeUp 0.3s cubic-bezier(0.16,1,0.3,1) both' }}>
        <h2 style={{ fontFamily:'Poppins,sans-serif', fontSize:'18px', fontWeight:600,
          color:'#e9d5ff', marginBottom:'20px' }}>
          {initial ? 'Edit Course' : 'New Course'}
        </h2>

        <div style={{ marginBottom:'14px' }}>
          <label style={{ fontSize:'12px', color:'rgba(167,139,250,0.5)', letterSpacing:'0.08em',
            textTransform:'uppercase', display:'block', marginBottom:'6px' }}>Name</label>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Computer Networks"
            style={{ width:'100%', background:'rgba(139,92,246,0.06)', border:'1px solid rgba(139,92,246,0.2)',
              borderRadius:'10px', padding:'10px 12px', color:'#e9d5ff', fontSize:'14px',
              fontFamily:'DM Sans,sans-serif', outline:'none' }} />
        </div>

        <div style={{ marginBottom:'14px' }}>
          <label style={{ fontSize:'12px', color:'rgba(167,139,250,0.5)', letterSpacing:'0.08em',
            textTransform:'uppercase', display:'block', marginBottom:'6px' }}>Description (optional)</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="What is this course about?"
            rows={3}
            style={{ width:'100%', background:'rgba(139,92,246,0.06)', border:'1px solid rgba(139,92,246,0.2)',
              borderRadius:'10px', padding:'10px 12px', color:'#e9d5ff', fontSize:'14px',
              fontFamily:'DM Sans,sans-serif', outline:'none', resize:'vertical' }} />
        </div>

        <div style={{ marginBottom:'24px' }}>
          <label style={{ fontSize:'12px', color:'rgba(167,139,250,0.5)', letterSpacing:'0.08em',
            textTransform:'uppercase', display:'block', marginBottom:'10px' }}>Color</label>
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
            {COLORS.map(c => (
              <div key={c} onClick={() => setColor(c)}
                style={{ width:24, height:24, borderRadius:'50%', background:c, cursor:'pointer',
                  border: color === c ? `2px solid #fff` : '2px solid transparent',
                  boxShadow: color === c ? `0 0 0 2px ${c}` : 'none',
                  transition:'transform 0.15s', transform: color === c ? 'scale(1.2)' : 'scale(1)' }} />
            ))}
          </div>
        </div>

        <div style={{ display:'flex', gap:'10px' }}>
          <button onClick={onClose}
            style={{ flex:1, padding:'10px', background:'rgba(139,92,246,0.08)',
              border:'1px solid rgba(139,92,246,0.2)', borderRadius:'10px',
              color:'rgba(167,139,250,0.6)', fontSize:'14px', cursor:'pointer',
              fontFamily:'DM Sans,sans-serif' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={!name.trim() || saving}
            style={{ flex:1, padding:'10px', background:'rgba(139,92,246,0.2)',
              border:'1px solid rgba(139,92,246,0.4)', borderRadius:'10px',
              color:'#e9d5ff', fontSize:'14px', cursor:'pointer',
              fontFamily:'DM Sans,sans-serif', opacity: !name.trim() ? 0.5 : 1 }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

const Courses = () => {
  const navigate = useNavigate()
  const [courses, setCourses]           = useState([])
  const [selected, setSelected]         = useState(null)
  const [tasks, setTasks]               = useState([])
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [loading, setLoading]           = useState(true)
  const [modal, setModal]               = useState(null) // null | 'add' | course obj
  const [confirmId, setConfirmId]       = useState(null)

  const fetchCourses = async () => {
    try {
      const res = await axios.get('/courses')
      setCourses(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCourses() }, [])

  const openCourse = async (course) => {
    setSelected(course)
    setLoadingTasks(true)
    try {
      const res = await axios.get(`/tasks?course_id=${course.id}`)
      setTasks(res.data)
    } catch { setTasks([]) }
    finally { setLoadingTasks(false) }
  }

  const handleSave = async (data) => {
    if (modal === 'add') {
      await axios.post('/courses', data)
    } else {
      await axios.put(`/courses/${modal.id}`, data)
      if (selected?.id === modal.id) setSelected(prev => ({ ...prev, ...data }))
    }
    setModal(null)
    fetchCourses()
  }

  const handleArchive = async (id) => {
    await axios.patch(`/courses/${id}/archive`)
    setConfirmId(null)
    if (selected?.id === id) setSelected(null)
    fetchCourses()
  }

  const handleDelete = async (id) => {
    await axios.delete(`/courses/${id}`)
    setConfirmId(null)
    if (selected?.id === id) setSelected(null)
    fetchCourses()
  }

  const SCORE = { high:3, medium:2, low:1 }
  const sortedTasks = [...tasks].sort((a,b) =>
    (SCORE[b.deadline_priority] + SCORE[b.user_priority]) -
    (SCORE[a.deadline_priority] + SCORE[a.user_priority])
  )

  const statusColor = { pending:'yellow', completed:'green', overdue:'red' }

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
        @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        .course-card { background:rgba(15,10,30,0.7); border-radius:14px; padding:18px;
          cursor:pointer; transition:background 0.18s,border-color 0.18s,transform 0.15s;
          border:1px solid rgba(139,92,246,0.1); }
        .course-card:hover { background:rgba(139,92,246,0.08); border-color:rgba(139,92,246,0.25); transform:translateY(-2px); }
        .course-card.active { border-color:rgba(139,92,246,0.4); background:rgba(139,92,246,0.1); }
        .icon-btn { background:none; border:none; cursor:pointer; padding:6px; border-radius:8px;
          color:rgba(167,139,250,0.4); transition:color 0.15s,background 0.15s; display:flex; align-items:center; }
        .icon-btn:hover { color:#c084fc; background:rgba(139,92,246,0.12); }
        .icon-btn.danger:hover { color:#f87171; background:rgba(220,38,38,0.1); }
        .task-item { padding:12px 14px; border-radius:10px; background:rgba(139,92,246,0.05);
          border:1px solid rgba(139,92,246,0.08); margin-bottom:8px; cursor:pointer;
          transition:background 0.15s,border-color 0.15s; }
        .task-item:hover { background:rgba(139,92,246,0.1); border-color:rgba(139,92,246,0.2); }
        .add-btn { display:flex; align-items:center; gap:8px; padding:10px 18px;
          background:rgba(139,92,246,0.15); border:1px solid rgba(139,92,246,0.3);
          border-radius:10px; color:#c084fc; font-family:'DM Sans',sans-serif; font-size:14px;
          cursor:pointer; transition:background 0.18s,transform 0.15s; }
        .add-btn:hover { background:rgba(139,92,246,0.25); transform:translateY(-1px); }
        .confirm-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:100;
          display:flex; align-items:center; justifyContent:center; backdropFilter:'blur(4px)' }
      `}</style>

      <div style={{ fontFamily:'DM Sans,sans-serif', color:'#e9d5ff', display:'flex', gap:'24px', maxWidth:'1000px' }}>

        {/* ── Left: course list ── */}
        <div style={{ flex: selected ? '0 0 320px' : '1', minWidth:0, animation:'fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) both' }}>

          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' }}>
            <h1 style={{ fontFamily:'Poppins,sans-serif', fontSize:'22px', fontWeight:600, color:'#e9d5ff' }}>Courses</h1>
            <button className="add-btn" onClick={() => setModal('add')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Course
            </button>
          </div>

          {/* Course grid */}
          {courses.length === 0 ? (
            <div style={{ textAlign:'center', padding:'48px 20px', background:'rgba(15,10,30,0.5)',
              borderRadius:'14px', border:'1px dashed rgba(139,92,246,0.15)' }}>
              <p style={{ color:'rgba(167,139,250,0.4)', fontSize:'14px' }}>No courses yet. Add one or sync Classroom.</p>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns: selected ? '1fr' : 'repeat(auto-fill,minmax(220px,1fr))', gap:'12px' }}>
              {courses.map((c, i) => (
                <div key={c.id} className={`course-card${selected?.id === c.id ? ' active' : ''}`}
                  onClick={() => selected?.id === c.id ? setSelected(null) : openCourse(c)}
                  style={{ animationDelay:`${i*0.04}s` }}>

                  {/* Color bar + name */}
                  <div style={{ display:'flex', alignItems:'flex-start', gap:'12px' }}>
                    <div style={{ width:4, height:40, borderRadius:4, background:c.color, flexShrink:0, marginTop:2 }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:'14px', fontWeight:500, color:'#e9d5ff', marginBottom:'4px',
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</p>
                      {c.description && (
                        <p style={{ fontSize:'12px', color:'rgba(167,139,250,0.4)', overflow:'hidden',
                          textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'12px' }}>
                    <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
                      {c.google_course_id && (
                        <Pill color="purple">
                          <span style={{ display:'flex', alignItems:'center', gap:'3px' }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.372 0 0 5.373 0 12s5.372 12 12 12 12-5.373 12-12S18.628 0 12 0zm-1.25 17.292l-4.5-4.364 1.857-1.857 2.643 2.506 5.643-5.643 1.857 1.857-7.5 7.501z"/></svg>
                            Classroom
                          </span>
                        </Pill>
                      )}
                    </div>

                    <div style={{ display:'flex', gap:'2px' }} onClick={e => e.stopPropagation()}>
                      {/* Edit — always available */}
                      <button className="icon-btn" onClick={() => setModal(c)} title="Edit">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      {/* Archive — synced courses */}
                      {c.google_course_id && (
                        <button className="icon-btn" onClick={() => setConfirmId({ id:c.id, type:'archive' })} title="Archive">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
                          </svg>
                        </button>
                      )}
                      {/* Delete — manual courses only */}
                      {!c.google_course_id && (
                        <button className="icon-btn danger" onClick={() => setConfirmId({ id:c.id, type:'delete' })} title="Delete">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: course detail ── */}
        {selected && (
          <div style={{ flex:1, minWidth:0, animation:'slideIn 0.35s cubic-bezier(0.16,1,0.3,1) both' }}>
            {/* Detail header */}
            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'20px' }}>
              <div style={{ width:6, height:32, borderRadius:4, background:selected.color }} />
              <div style={{ flex:1 }}>
                <h2 style={{ fontFamily:'Poppins,sans-serif', fontSize:'18px', fontWeight:600, color:'#e9d5ff' }}>{selected.name}</h2>
                {selected.description && <p style={{ fontSize:'13px', color:'rgba(167,139,250,0.45)' }}>{selected.description}</p>}
              </div>
              <button className="icon-btn" onClick={() => setSelected(null)} title="Close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Tasks list */}
            {loadingTasks ? (
              <div style={{ display:'flex', justifyContent:'center', padding:'32px' }}>
                <div style={{ width:24, height:24, border:'2px solid rgba(139,92,246,0.2)', borderTopColor:'#7c3aed', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
              </div>
            ) : sortedTasks.length === 0 ? (
              <div style={{ textAlign:'center', padding:'32px', background:'rgba(15,10,30,0.4)',
                borderRadius:'12px', border:'1px dashed rgba(139,92,246,0.12)' }}>
                <p style={{ color:'rgba(167,139,250,0.4)', fontSize:'14px' }}>No tasks in this course.</p>
              </div>
            ) : (
              <>
                <p style={{ fontSize:'11px', letterSpacing:'0.1em', textTransform:'uppercase',
                  color:'rgba(167,139,250,0.4)', marginBottom:'12px' }}>
                  {sortedTasks.length} task{sortedTasks.length !== 1 ? 's' : ''}
                </p>
                {sortedTasks.map(t => (
                  <div key={t.id} className="task-item" onClick={() => navigate(`/task/${t.id}`)}>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:'14px', color:'#e9d5ff', marginBottom:'4px',
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                          textDecoration: t.status === 'completed' ? 'line-through' : 'none',
                          opacity: t.status === 'completed' ? 0.5 : 1 }}>{t.title}</p>
                        <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
                          <Pill color={statusColor[t.status] || 'purple'}>{t.status}</Pill>
                          <span style={{ fontSize:'11px', color:'rgba(167,139,250,0.4)' }}>DL: {t.deadline_priority}</span>
                          <span style={{ fontSize:'11px', color:'rgba(167,139,250,0.4)' }}>My: {t.user_priority}</span>
                        </div>
                      </div>
                      {t.deadline && (
                        <span style={{ fontSize:'12px', color:'rgba(167,139,250,0.4)', whiteSpace:'nowrap', flexShrink:0 }}>
                          {new Date(t.deadline).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
                        </span>
                      )}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.3)" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      {modal && (
        <Modal
          onClose={() => setModal(null)}
          onSave={handleSave}
          initial={modal === 'add' ? null : modal}
        />
      )}

      {/* ── Confirm archive / delete ── */}
      {confirmId && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:100,
          display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)' }}
          onClick={e => e.target === e.currentTarget && setConfirmId(null)}>
          <div style={{ background:'#0f0a1e', border:'1px solid rgba(139,92,246,0.25)',
            borderRadius:'16px', padding:'24px', maxWidth:'320px', width:'100%' }}>
            <p style={{ fontSize:'15px', color:'#e9d5ff', marginBottom:'8px', fontWeight:500 }}>
              {confirmId.type === 'delete' ? 'Delete course?' : 'Archive course?'}
            </p>
            <p style={{ fontSize:'13px', color:'rgba(167,139,250,0.5)', marginBottom:'20px' }}>
              {confirmId.type === 'delete'
                ? 'This will permanently delete the course and all its tasks.'
                : 'This course will be hidden. It won\'t come back on sync.'}
            </p>
            <div style={{ display:'flex', gap:'10px' }}>
              <button onClick={() => setConfirmId(null)}
                style={{ flex:1, padding:'9px', background:'rgba(139,92,246,0.08)',
                  border:'1px solid rgba(139,92,246,0.2)', borderRadius:'9px',
                  color:'rgba(167,139,250,0.6)', cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontSize:'13px' }}>
                Cancel
              </button>
              <button onClick={() => confirmId.type === 'delete' ? handleDelete(confirmId.id) : handleArchive(confirmId.id)}
                style={{ flex:1, padding:'9px',
                  background: confirmId.type === 'delete' ? 'rgba(220,38,38,0.15)' : 'rgba(139,92,246,0.15)',
                  border: `1px solid ${confirmId.type === 'delete' ? 'rgba(220,38,38,0.35)' : 'rgba(139,92,246,0.35)'}`,
                  borderRadius:'9px', color: confirmId.type === 'delete' ? '#f87171' : '#c084fc',
                  cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontSize:'13px' }}>
                {confirmId.type === 'delete' ? 'Delete' : 'Archive'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Courses