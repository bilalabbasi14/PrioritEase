import { useEffect, useState, useMemo } from 'react'
import axios from '../api/axios'
import TaskDetailPanel from '../components/TaskDetailPanel'

const PRIORITY_COLOR = {
  high:   { bg: 'rgba(220,38,38,0.18)',  text: '#f87171', border: 'rgba(220,38,38,0.3)' },
  medium: { bg: 'rgba(234,179,8,0.18)',  text: '#facc15', border: 'rgba(234,179,8,0.3)' },
  low:    { bg: 'rgba(40, 172, 157, 0.55)', text: '#9fe8dd', border: 'rgba(236,72,153,0.3)' },
}

const OVERDUE_COLOR = {
  bg: 'rgba(55,65,81,0.3)',
  text: '#d1d5db',
  border: 'rgba(107,114,128,0.45)',
}

const COMPLETED_COLOR = {
  bg: 'rgba(34,197,94,0.2)',
  text: '#168a40',
  border: 'rgba(34,197,94,0.35)',
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

const parsePKT = (value) => {
  if (!value) return null
  const s = value.replace('T', ' ').slice(0, 19)
  const [datePart, timePart] = s.split(' ')
  const [y, mo, d] = datePart.split('-').map(Number)
  const [h, mi] = (timePart || '00:00').split(':').map(Number)
  return new Date(y, mo - 1, d, h, mi)
}

const todayInPKT = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date())
  return {
    year:  Number(parts.find(p => p.type === 'year')?.value),
    month: Number(parts.find(p => p.type === 'month')?.value) - 1,
    day:   Number(parts.find(p => p.type === 'day')?.value),
  }
}

export default function Calendar() {
  const today = todayInPKT()
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768)

  const [view,         setView]         = useState('month')
  const [curYear,      setCurYear]      = useState(today.year)
  const [curMonth,     setCurMonth]     = useState(today.month)
  const [weekStart,    setWeekStart]    = useState(() => {
    const d = new Date(today.year, today.month, today.day)
    d.setDate(d.getDate() - d.getDay())
    return d
  })
  // mobile week: which 3-day window (0 = Sun/Mon/Tue, 1 = Wed/Thu/Fri, 2 = Sat)
  const [mobileWeekSlice, setMobileWeekSlice] = useState(() => {
    const dow = new Date(today.year, today.month, today.day).getDay()
    if (dow <= 2) return 0
    if (dow <= 5) return 1
    return 2
  })

  const [tasks,        setTasks]        = useState([])
  const [courses,      setCourses]      = useState([])
  const [selectedTask, setSelectedTask] = useState(null)
  const [loading,      setLoading]      = useState(true)

  const fetchData = () => {
    setLoading(true)
    Promise.all([
      axios.get('/tasks'),
      axios.get('/courses'),
    ]).then(([tRes, cRes]) => {
      setTasks(tRes.data || [])
      setCourses(cRes.data || [])
    }).catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const tasksByDate = useMemo(() => {
    const map = {}
    tasks.forEach(t => {
      if (!t.deadline) return
      const d = parsePKT(t.deadline)
      if (!d) return
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      if (!map[key]) map[key] = []
      map[key].push(t)
    })
    return map
  }, [tasks])

  const monthDays = useMemo(() => {
    const first = new Date(curYear, curMonth, 1).getDay()
    const total = new Date(curYear, curMonth + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < first; i++) cells.push(null)
    for (let d = 1; d <= total; d++) cells.push(d)
    return cells
  }, [curYear, curMonth])

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [weekStart])

  // 3-day slices for mobile week view
  const mobileWeekDays = useMemo(() => {
    const slices = [
      [0, 1, 2],
      [3, 4, 5],
      [6],
    ]
    return (slices[mobileWeekSlice] || slices[0]).map(i => {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [weekStart, mobileWeekSlice])

  const prevMonth = () => {
    if (curMonth === 0) { setCurYear(y => y - 1); setCurMonth(11) }
    else setCurMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (curMonth === 11) { setCurYear(y => y + 1); setCurMonth(0) }
    else setCurMonth(m => m + 1)
  }
  const prevWeek = () => {
    setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })
    setMobileWeekSlice(0)
  }
  const nextWeek = () => {
    setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })
    setMobileWeekSlice(0)
  }
  const prevMobileSlice = () => {
    if (mobileWeekSlice === 0) {
      setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })
      setMobileWeekSlice(2)
    } else {
      setMobileWeekSlice(s => s - 1)
    }
  }
  const nextMobileSlice = () => {
    if (mobileWeekSlice === 2) {
      setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })
      setMobileWeekSlice(0)
    } else {
      setMobileWeekSlice(s => s + 1)
    }
  }

  const isTaskOverdue = (task) => {
    if (!task?.deadline || task.status === 'completed') return false
    if (task.status === 'overdue') return true
    const d = parsePKT(task.deadline)
    if (!d) return false
    return d < new Date()
  }

  const getTaskColor = (task) => {
    if (task?.status === 'completed') return COMPLETED_COLOR
    if (isTaskOverdue(task)) return OVERDUE_COLOR
    return PRIORITY_COLOR[task.user_priority] || {
      bg: 'rgba(139,92,246,0.12)',
      text: '#c084fc',
      border: 'rgba(139,92,246,0.2)',
    }
  }

  const isToday  = (y, m, d) => y === today.year && m === today.month && d === today.day
  const dateKey  = (y, m, d) => `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`

  // Get dominant color for a day (for mobile dot display)
  const getDayDotColor = (dayTasks) => {
    if (!dayTasks.length) return null
    const hasOverdue   = dayTasks.some(t => isTaskOverdue(t))
    const hasHigh      = dayTasks.some(t => t.user_priority === 'high' && !isTaskOverdue(t) && t.status !== 'completed')
    const hasMedium    = dayTasks.some(t => t.user_priority === 'medium' && !isTaskOverdue(t) && t.status !== 'completed')
    const hasCompleted = dayTasks.every(t => t.status === 'completed')
    if (hasOverdue) return OVERDUE_COLOR.text
    if (hasHigh)    return PRIORITY_COLOR.high.text
    if (hasMedium)  return PRIORITY_COLOR.medium.text
    if (hasCompleted) return COMPLETED_COLOR.text
    return PRIORITY_COLOR.low.text
  }

  // mobile week range label
  const mobileWeekRangeLabel = () => {
    const days = mobileWeekDays
    const first = days[0]
    const last  = days[days.length - 1]
    const mo    = MONTHS[first.getMonth()].slice(0, 3)
    if (first.getMonth() === last.getMonth())
      return `${mo} ${first.getDate()}–${last.getDate()}`
    return `${mo} ${first.getDate()} – ${MONTHS[last.getMonth()].slice(0,3)} ${last.getDate()}`
  }

  const weekRangeLabel = () => {
    const end = new Date(weekStart)
    end.setDate(end.getDate() + 6)
    const a = weekStart
    if (a.getMonth() === end.getMonth())
      return `${MONTHS[a.getMonth()]} ${a.getDate()}–${end.getDate()}, ${a.getFullYear()}`
    return `${MONTHS[a.getMonth()]} ${a.getDate()} – ${MONTHS[end.getMonth()]} ${end.getDate()}, ${a.getFullYear()}`
  }

  const navBtn = {
    background: 'rgba(139,92,246,0.1)',
    border: '1px solid rgba(139,92,246,0.22)',
    color: '#c084fc',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s',
    flexShrink: 0,
  }

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', color: '#e9d5ff', width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: isMobile ? '18px' : '22px', fontWeight: 600, color: '#e9d5ff', margin: 0 }}>Calendar</h1>
          {!isMobile && <span style={{ fontSize: '12px', color: 'rgba(167,139,250,0.4)' }}>Based on user priority</span>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* View toggle */}
          <div style={{ display: 'flex', background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: '10px', overflow: 'hidden' }}>
            {['month','week'].map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: isMobile ? '5px 12px' : '6px 16px',
                background: view === v ? 'rgba(139,92,246,0.22)' : 'none',
                border: 'none',
                color: view === v ? '#e9d5ff' : 'rgba(167,139,250,0.5)',
                cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '13px',
                fontWeight: view === v ? 500 : 400,
              }}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

          {/* Nav arrows + label */}
          <button style={navBtn}
            onClick={view === 'month' ? prevMonth : (isMobile ? prevMobileSlice : prevWeek)}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(139,92,246,0.1)'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>

          <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: isMobile ? '12px' : '15px', fontWeight: 600, color: '#e9d5ff', whiteSpace: 'nowrap', minWidth: isMobile ? '80px' : '160px', textAlign: 'center' }}>
            {view === 'month'
              ? (isMobile ? `${MONTHS[curMonth].slice(0,3)} ${curYear}` : `${MONTHS[curMonth]} ${curYear}`)
              : (isMobile ? mobileWeekRangeLabel() : weekRangeLabel())}
          </span>

          <button style={navBtn}
            onClick={view === 'month' ? nextMonth : (isMobile ? nextMobileSlice : nextWeek)}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(139,92,246,0.1)'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>

          {/* Today button */}
          <button
            onClick={() => {
              setCurYear(today.year); setCurMonth(today.month)
              const d = new Date(today.year, today.month, today.day)
              d.setDate(d.getDate() - d.getDay())
              setWeekStart(d)
              const dow = new Date(today.year, today.month, today.day).getDay()
              setMobileWeekSlice(dow <= 2 ? 0 : dow <= 5 ? 1 : 2)
            }}
            style={{ padding: isMobile ? '5px 10px' : '6px 14px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '8px', color: '#c084fc', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '13px', whiteSpace: 'nowrap' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(139,92,246,0.1)'}
          >
            Today
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
          <div style={{ width: 28, height: 28, border: '2px solid rgba(139,92,246,0.2)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : view === 'month' ? (

        /* ── Month view ── */
        <div style={{ width: '100%', boxSizing: 'border-box' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
            gap: '1px',
            background: 'rgba(139,92,246,0.08)',
            border: '1px solid rgba(139,92,246,0.12)',
            borderRadius: '14px',
            overflow: 'hidden',
            width: '100%',
            boxSizing: 'border-box',
          }}>
            {/* Day headers */}
            {DAYS.map(d => (
              <div key={d} style={{ background: 'rgba(15,10,30,0.9)', padding: isMobile ? '8px 0' : '10px 0', textAlign: 'center', fontSize: isMobile ? '10px' : '11px', color: 'rgba(167,139,250,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {isMobile ? d.slice(0,1) : d}
              </div>
            ))}

            {/* Day cells */}
            {monthDays.map((day, idx) => {
              if (!day) return (
                <div key={`empty-${idx}`} style={{ background: 'rgba(10,8,20,0.6)', minHeight: isMobile ? '52px' : '90px' }} />
              )
              const key      = dateKey(curYear, curMonth, day)
              const dayTasks = tasksByDate[key] || []
              const isTod    = isToday(curYear, curMonth, day)
              const dotColor = getDayDotColor(dayTasks)

              return (
                <div key={key} style={{ background: 'rgba(15,10,30,0.85)', minHeight: isMobile ? '52px' : '90px', padding: isMobile ? '6px 4px' : '8px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'center' : 'flex-start' }}>
                  {/* Date number */}
                  <div style={{ width: isMobile ? '22px' : '24px', height: isMobile ? '22px' : '24px', borderRadius: '50%', background: isTod ? 'rgba(124,58,237,0.7)' : 'none', border: isTod ? '1px solid rgba(192,132,252,0.5)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? '11px' : '12px', fontWeight: isTod ? 600 : 400, color: isTod ? '#f3e8ff' : 'rgba(233,213,255,0.5)', marginBottom: isMobile ? '4px' : '4px', flexShrink: 0 }}>
                    {day}
                  </div>

                  {/* Mobile: dots | Desktop: chips */}
                  {isMobile ? (
                    <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', justifyContent: 'center' }}>
                      {dayTasks.length > 0 && (
                        <>
                          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: dotColor }} />
                          {dayTasks.length > 1 && <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: dotColor, opacity: 0.6 }} />}
                          {dayTasks.length > 2 && <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: dotColor, opacity: 0.3 }} />}
                        </>
                      )}
                    </div>
                  ) : (
                    <>
                      {dayTasks.slice(0, 3).map(t => {
                        const color = getTaskColor(t)
                        return (
                          <span key={t.id} onClick={() => setSelectedTask(t.id)} title={t.title} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '6px', background: color.bg, color: color.text, border: `1px solid ${color.border}`, cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', marginBottom: '2px', display: 'block', lineHeight: '16px', boxSizing: 'border-box' }}>
                            {t.title}
                          </span>
                        )
                      })}
                      {dayTasks.length > 3 && (
                        <span style={{ fontSize: '10px', color: 'rgba(167,139,250,0.4)', display: 'block', marginTop: '2px' }}>+{dayTasks.length - 3} more</span>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>

          {/* Mobile: tap day to see tasks — show selected day tasks below */}
          {isMobile && (
            <p style={{ fontSize: '11px', color: 'rgba(167,139,250,0.3)', textAlign: 'center', marginTop: '10px' }}>
              Switch to week view to see task details
            </p>
          )}
        </div>

      ) : (

        /* ── Week view ── */
        <div style={{ width: '100%', boxSizing: 'border-box' }}>
          <div style={{ border: '1px solid rgba(139,92,246,0.12)', borderRadius: '14px', overflow: 'hidden', background: 'rgba(139,92,246,0.04)', width: '100%', boxSizing: 'border-box' }}>

            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? mobileWeekDays.length : 7}, minmax(0, 1fr))`, borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
              {(isMobile ? mobileWeekDays : weekDays).map((d, i) => {
                const isTod = isToday(d.getFullYear(), d.getMonth(), d.getDate())
                return (
                  <div key={i} style={{ background: isTod ? 'rgba(124,58,237,0.15)' : 'rgba(15,10,30,0.9)', padding: isMobile ? '10px 4px' : '12px 8px', textAlign: 'center', borderRight: i < (isMobile ? mobileWeekDays.length - 1 : 6) ? '1px solid rgba(139,92,246,0.08)' : 'none' }}>
                    <div style={{ fontSize: '11px', color: 'rgba(167,139,250,0.45)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '4px' }}>
                      {DAYS[d.getDay()]}
                    </div>
                    <span style={{ display: 'inline-flex', width: '28px', height: '28px', borderRadius: '50%', background: isTod ? 'rgba(124,58,237,0.7)' : 'none', border: isTod ? '1px solid rgba(192,132,252,0.5)' : 'none', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: isTod ? 700 : 400, color: isTod ? '#f3e8ff' : 'rgba(233,213,255,0.6)' }}>
                      {d.getDate()}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Task rows */}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? mobileWeekDays.length : 7}, minmax(0, 1fr))`, minHeight: '200px' }}>
              {(isMobile ? mobileWeekDays : weekDays).map((d, i) => {
                const key      = dateKey(d.getFullYear(), d.getMonth(), d.getDate())
                const dayTasks = tasksByDate[key] || []
                const isTod    = isToday(d.getFullYear(), d.getMonth(), d.getDate())
                return (
                  <div key={i} style={{ padding: isMobile ? '8px 6px' : '10px 8px', borderRight: i < (isMobile ? mobileWeekDays.length - 1 : 6) ? '1px solid rgba(139,92,246,0.07)' : 'none', background: isTod ? 'rgba(124,58,237,0.05)' : 'rgba(15,10,30,0.7)', minHeight: isMobile ? '160px' : '200px', boxSizing: 'border-box' }}>
                    {dayTasks.length === 0 ? (
                      <div style={{ fontSize: '11px', color: 'rgba(139,92,246,0.2)', textAlign: 'center', marginTop: '18px' }}>—</div>
                    ) : (
                      dayTasks.map(t => {
                        const dl       = parsePKT(t.deadline)
                        const timeStr  = dl ? dl.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true }) : ''
                        const taskColor = getTaskColor(t)
                        return (
                          <div key={t.id} onClick={() => setSelectedTask(t.id)} style={{ background: taskColor.bg, border: `1px solid ${taskColor.border}`, borderRadius: '8px', padding: isMobile ? '5px 6px' : '6px 8px', marginBottom: '6px', cursor: 'pointer', transition: 'opacity 0.15s', boxSizing: 'border-box' }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                          >
                            <div style={{ fontSize: isMobile ? '10px' : '11px', fontWeight: 500, color: '#e9d5ff', lineHeight: 1.3, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {t.title}
                            </div>
                            {timeStr && (
                              <div style={{ fontSize: '10px', color: 'rgba(167,139,250,0.5)' }}>{timeStr}</div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Legend ── */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
        {Object.entries(PRIORITY_COLOR).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'rgba(167,139,250,0.5)' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: v.text, display: 'inline-block', flexShrink: 0 }} />
            {k.charAt(0).toUpperCase() + k.slice(1)}
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'rgba(167,139,250,0.5)' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: OVERDUE_COLOR.text, display: 'inline-block', flexShrink: 0 }} />
          Overdue
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'rgba(167,139,250,0.5)' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: COMPLETED_COLOR.text, display: 'inline-block', flexShrink: 0 }} />
          Completed
        </div>
      </div>

      {/* ── Task detail panel ── */}
      {selectedTask && (
        <TaskDetailPanel
          taskId={selectedTask}
          courses={courses}
          onClose={() => setSelectedTask(null)}
          onUpdate={() => { setSelectedTask(null); fetchData() }}
        />
      )}

      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(18px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}