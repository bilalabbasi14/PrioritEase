import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from '../api/axios'
import useAuth from '../hooks/useAuth'

const PRIORITY_COLOR = {
  high:   { bg: 'rgba(220,38,38,0.12)',   text: '#f87171', border: 'rgba(220,38,38,0.25)' },
  medium: { bg: 'rgba(234,179,8,0.12)',   text: '#facc15', border: 'rgba(234,179,8,0.25)' },
  low:    { bg: 'rgba(34,197,94,0.12)',   text: '#4ade80', border: 'rgba(34,197,94,0.25)' },
}

const Badge = ({ label, level }) => {
  const c = PRIORITY_COLOR[level] || PRIORITY_COLOR.low
  return (
    <span style={{
      fontSize: '10px', fontWeight: 500, letterSpacing: '0.06em',
      padding: '2px 7px', borderRadius: '20px',
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
    }}>
      {label}
    </span>
  )
}

const StatChip = ({ label, value, accent }) => (
  <div style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '7px 11px',
    borderRadius: '999px',
    border: `1px solid ${accent}3a`,
    background: `${accent}12`,
    lineHeight: 1,
  }}>
    <span style={{ width: 6, height: 6, borderRadius: '999px', background: accent, flexShrink: 0 }} />
    <span style={{ fontSize: '11px', color: 'rgba(233,213,255,0.72)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
      {label}
    </span>
    <span style={{ fontSize: '14px', fontWeight: 600, color: accent }}>
      {value ?? '—'}
    </span>
  </div>
)

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [summary, setSummary]     = useState(null)
  const [tasks, setTasks]         = useState([])
  const [showAll, setShowAll]     = useState(false)
  const [syncing, setSyncing]     = useState(false)
  const [syncMsg, setSyncMsg]     = useState('')
  const [loading, setLoading]     = useState(true)

  const fetchData = async () => {
    try {
      const [sumRes, taskRes] = await Promise.all([
        axios.get('/analytics/summary'),
        axios.get('/tasks'),
      ])
      setSummary(sumRes.data)

      // Sort by combined priority score: deadline_priority + user_priority
      const SCORE = { high: 3, medium: 2, low: 1 }
      const pending = taskRes.data
        .filter(t => t.status === 'pending')
        .sort((a, b) => {
          const scoreB = SCORE[b.deadline_priority] + SCORE[b.user_priority]
          const scoreA = SCORE[a.deadline_priority] + SCORE[a.user_priority]
          return scoreB - scoreA
        })
      setTasks(pending)
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSync = async () => {
    setSyncing(true)
    setSyncMsg('')
    try {
      const res = await axios.post('/classroom/sync')
      const { courses, assignments } = res.data
      setSyncMsg(`Synced ${courses.created + courses.updated} courses · ${assignments.created} new tasks`)
      fetchData()
    } catch {
      setSyncMsg('Sync failed. Please try again.')
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncMsg(''), 4000)
    }
  }

  const formatDeadline = (dl) => {
    if (!dl) return null
    const d = new Date(dl)
    const now = new Date()
    const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24))
    if (diff < 0)  return { text: 'Overdue',       color: '#f87171' }
    if (diff === 0) return { text: 'Due today',     color: '#fb923c' }
    if (diff === 1) return { text: 'Due tomorrow',  color: '#facc15' }
    return { text: `Due in ${diff}d`, color: 'rgba(167,139,250,0.5)' }
  }

  const visibleTasks = showAll ? tasks : tasks.slice(0, 5)
  const firstName = user?.name?.split(' ')[0] || 'there'

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ width: 32, height: 32, border: '2px solid rgba(139,92,246,0.2)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&family=DM+Sans:wght@300;400&display=swap');
        .dash-root { font-family: 'DM Sans', sans-serif; color: #e9d5ff; }
        .dash-shell { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 26px; align-items: start; }
        .dash-main { min-width: 0; max-width: 860px; }
        .desk-quote {
          position: sticky;
          top: 32px;
          min-height: calc(100vh - 64px);
          padding: 12px 4px 12px 22px;
          border-left: 2px solid rgba(139,92,246,0.28);
          display: flex;
          align-items: center;
        }
        .desk-quote-inner {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          max-width: 290px;
        }
        .desk-quote p {
          font-family: 'Poppins', sans-serif;
          font-size: 32px;
          font-weight: 700;
          line-height: 1.24;
          color: rgba(245,235,255,0.9);
          letter-spacing: -0.01em;
          margin: 0;
        }
        .desk-quote .q-mark {
          font-family: 'Poppins', sans-serif;
          font-size: 56px;
          font-weight: 800;
          line-height: 0.7;
          color: rgba(192,132,252,0.5);
          display: block;
          margin: 0;
        }
        .desk-quote .q-mark.open {
          align-self: flex-start;
          margin-bottom: 4px;
        }
        .desk-quote .q-mark.close {
          align-self: flex-end;
          margin-top: 4px;
        }
        .task-row { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 12px; background: rgba(15,10,30,0.6); border: 1px solid rgba(139,92,246,0.1); margin-bottom: 8px; cursor: pointer; transition: background 0.18s, border-color 0.18s, transform 0.15s; }
        .task-row:hover { background: rgba(139,92,246,0.08); border-color: rgba(139,92,246,0.25); transform: translateX(3px); }
        .sync-btn { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.25); border-radius: 10px; color: #c084fc; font-family: 'DM Sans',sans-serif; font-size: 13px; cursor: pointer; transition: background 0.18s, border-color 0.18s, transform 0.15s; }
        .sync-btn:hover:not(:disabled) { background: rgba(139,92,246,0.18); border-color: rgba(139,92,246,0.45); transform: translateY(-1px); }
        .sync-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .show-more { width: 100%; padding: 10px; background: none; border: 1px dashed rgba(139,92,246,0.2); border-radius: 10px; color: rgba(167,139,250,0.5); font-family: 'DM Sans',sans-serif; font-size: 13px; cursor: pointer; transition: border-color 0.18s, color 0.18s; margin-top: 4px; }
        .show-more:hover { border-color: rgba(139,92,246,0.4); color: #c084fc; }
        .section-title { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(167,139,250,0.4); margin-bottom: 14px; }
        .course-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) both; }

        @media (max-width: 1100px) {
          .dash-shell { grid-template-columns: 1fr; }
          .dash-main { max-width: none; }
          .desk-quote { display: none; }
        }
      `}</style>

      <div className="dash-root">
        <div className="dash-shell">
          <div className="dash-main">

        {/* Header */}
        <div className="fade-up" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontFamily: 'Poppins,sans-serif', fontSize: '26px', fontWeight: 600, color: '#e9d5ff', marginBottom: '4px' }}>
              Hey, {firstName} 
            </h1>
            <p style={{ fontSize: '14px', color: 'rgba(167,139,250,0.5)' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <button className="sync-btn" onClick={handleSync} disabled={syncing}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: syncing ? 'spin 0.8s linear infinite' : 'none' }}>
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
              {syncing ? 'Syncing…' : 'Sync Classroom'}
            </button>
            {syncMsg && (
              <p style={{ fontSize: '12px', color: syncMsg.includes('failed') ? '#f87171' : '#4ade80' }}>
                {syncMsg}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="fade-up" style={{ marginBottom: '28px', animationDelay: '0.05s' }}>
          <p className="section-title" style={{ marginBottom: '10px' }}>At a glance</p>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
          }}>
            <StatChip label="Total" value={summary?.total} accent="#a78bfa" />
            <StatChip label="Completed" value={summary?.completed} accent="#4ade80" />
            <StatChip label="Pending" value={summary?.pending} accent="#facc15" />
            <StatChip label="Overdue" value={summary?.overdue} accent="#f87171" />
            <StatChip
              label="Completion"
              value={summary?.completion_rate != null ? `${summary.completion_rate}%` : '—'}
              accent="#c084fc"
            />
          </div>
        </div>

        {/* Priority Tasks */}
        <div className="fade-up" style={{ animationDelay: '0.1s' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <p className="section-title" style={{ margin: 0 }}>Priority Tasks</p>
            <button onClick={() => navigate('/tasks')} style={{ background: 'none', border: 'none', color: 'rgba(167,139,250,0.5)', fontSize: '12px', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', transition: 'color 0.15s' }}
              onMouseEnter={e => e.target.style.color = '#c084fc'}
              onMouseLeave={e => e.target.style.color = 'rgba(167,139,250,0.5)'}
            >
              View all →
            </button>
          </div>

          {tasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(15,10,30,0.5)', borderRadius: '14px', border: '1px dashed rgba(139,92,246,0.15)' }}>
              <p style={{ color: 'rgba(167,139,250,0.4)', fontSize: '14px' }}>No pending tasks — you're all caught up!</p>
            </div>
          ) : (
            <>
              {visibleTasks.map((task, i) => {
                const dl = formatDeadline(task.deadline)
                return (
                  <div key={task.id} className="task-row" onClick={() => navigate(`/task/${task.id}`)}
                    style={{ animationDelay: `${0.1 + i * 0.04}s` }}>
                    {/* Course color dot */}
                    <div className="course-dot" style={{ background: task.color || '#6366f1' }} />

                    {/* Title + course */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '14px', color: '#e9d5ff', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {task.title}
                      </p>
                      {task.course_name && (
                        <p style={{ fontSize: '12px', color: 'rgba(167,139,250,0.4)' }}>{task.course_name}</p>
                      )}
                    </div>

                    {/* Badges + deadline */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <Badge label={`DL: ${task.deadline_priority}`} level={task.deadline_priority} />
                      <Badge label={`My: ${task.user_priority}`}     level={task.user_priority} />
                      {dl && (
                        <span style={{ fontSize: '11px', color: dl.color, whiteSpace: 'nowrap' }}>{dl.text}</span>
                      )}
                    </div>

                    {/* Chevron */}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                )
              })}

              {tasks.length > 5 && (
                <button className="show-more" onClick={() => setShowAll(v => !v)}>
                  {showAll ? 'Show less ↑' : `Show ${tasks.length - 5} more ↓`}
                </button>
              )}
            </>
          )}
        </div>

          </div>

          <aside className="desk-quote fade-up" style={{ animationDelay: '0.08s' }}>
            <div className="desk-quote-inner">
              <span className="q-mark open">"</span>
              <p>
                Procastinator? No! I just wait until the last second to do my work because I WILL BE OLDER THEREFORE WISER
              </p>
              <span className="q-mark close">"</span>
            </div>
          </aside>
        </div>

      </div>
    </>
  )
}

export default Dashboard