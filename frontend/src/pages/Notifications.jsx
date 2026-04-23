import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import axios from '../api/axios'

const TYPE_ICON = {
  overdue: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  escalation: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#facc15" strokeWidth="2" strokeLinecap="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  general: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2" strokeLinecap="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 01-3.46 0"/>
    </svg>
  ),
}

const TYPE_BG = {
  overdue:    'rgba(220,38,38,0.08)',
  escalation: 'rgba(234,179,8,0.08)',
  general:    'rgba(139,92,246,0.08)',
}
const TYPE_BORDER = {
  overdue:    'rgba(220,38,38,0.18)',
  escalation: 'rgba(234,179,8,0.18)',
  general:    'rgba(139,92,246,0.18)',
}

const formatRelative = (ts) => {
  const diff = Date.now() - new Date(ts).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  <  1) return 'just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days  <  7) return `${days}d ago`
  return new Date(ts).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading,       setLoading]       = useState(true)
  const [filter,        setFilter]        = useState('all')  // 'all' | 'unread'
  const [confirmClear,  setConfirmClear]  = useState(false)
  const [deleting,      setDeleting]      = useState(null)

  const fetchNotifications = () => {
    setLoading(true)
    axios.get('/notifications')
      .then(res => setNotifications(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchNotifications() }, [])

  const markRead = async (id) => {
    await axios.put(`/notifications/${id}/read`)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const markAllRead = async () => {
    await axios.put('/notifications/mark-all-read')
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const deleteOne = async (id) => {
    setDeleting(id)
    try {
      await axios.delete(`/notifications/${id}`)
      setNotifications(prev => prev.filter(n => n.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  const deleteAll = async () => {
    await axios.delete('/notifications/all')
    setNotifications([])
    setConfirmClear(false)
  }

  const openClearConfirm = () => setConfirmClear(true)

  const displayed = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications

  const unreadCount = notifications.filter(n => !n.is_read).length

  const styles = {
    page: {
      fontFamily: 'DM Sans, sans-serif',
      color: '#e9d5ff',
      maxWidth: '680px',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '24px',
      flexWrap: 'wrap',
      gap: '12px',
    },
    titleRow: { display: 'flex', alignItems: 'center', gap: '12px' },
    title: {
      fontFamily: 'Poppins, sans-serif',
      fontSize: '22px',
      fontWeight: 600,
      color: '#e9d5ff',
    },
    badge: {
      background: 'rgba(124,58,237,0.55)',
      color: '#f3e8ff',
      fontSize: '11px',
      fontWeight: 600,
      padding: '2px 8px',
      borderRadius: '20px',
      border: '1px solid rgba(192,132,252,0.3)',
    },
    actions: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' },
    filterToggle: {
      display: 'flex',
      background: 'rgba(139,92,246,0.07)',
      border: '1px solid rgba(139,92,246,0.18)',
      borderRadius: '10px',
      overflow: 'hidden',
    },
    filterBtn: (active) => ({
      padding: '6px 14px',
      background: active ? 'rgba(139,92,246,0.22)' : 'none',
      border: 'none',
      color: active ? '#e9d5ff' : 'rgba(167,139,250,0.5)',
      cursor: 'pointer',
      fontFamily: 'DM Sans, sans-serif',
      fontSize: '13px',
      transition: 'background 0.15s, color 0.15s',
    }),
    ghostBtn: (danger) => ({
      padding: '6px 14px',
      background: 'none',
      border: `1px solid ${danger ? 'rgba(220,38,38,0.25)' : 'rgba(139,92,246,0.2)'}`,
      borderRadius: '8px',
      color: danger ? 'rgba(248,113,113,0.7)' : 'rgba(167,139,250,0.6)',
      cursor: 'pointer',
      fontFamily: 'DM Sans, sans-serif',
      fontSize: '13px',
      transition: 'background 0.15s, color 0.15s',
    }),
    card: (unread, type) => ({
      background: unread ? (TYPE_BG[type] || TYPE_BG.general) : 'rgba(15,10,30,0.6)',
      border: `1px solid ${unread ? (TYPE_BORDER[type] || TYPE_BORDER.general) : 'rgba(139,92,246,0.1)'}`,
      borderRadius: '12px',
      padding: '14px 16px',
      marginBottom: '10px',
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-start',
      transition: 'opacity 0.15s',
      cursor: 'default',
    }),
    iconWrap: {
      width: '32px',
      height: '32px',
      borderRadius: '8px',
      background: 'rgba(139,92,246,0.1)',
      border: '1px solid rgba(139,92,246,0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      marginTop: '1px',
    },
    notifTitle: (unread) => ({
      fontSize: '14px',
      fontWeight: unread ? 500 : 400,
      color: unread ? '#e9d5ff' : 'rgba(233,213,255,0.6)',
      lineHeight: 1.4,
      marginBottom: '3px',
    }),
    notifMsg: {
      fontSize: '12px',
      color: 'rgba(167,139,250,0.5)',
      lineHeight: 1.5,
    },
    metaRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginTop: '6px',
    },
    time: { fontSize: '11px', color: 'rgba(167,139,250,0.35)' },
    unreadDot: {
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      background: '#7c3aed',
      flexShrink: 0,
      marginTop: '7px',
    },
  }

  const ActionBar = ({ n }) => (
    <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto', flexShrink: 0, alignItems: 'flex-start' }}>
      {!n.is_read && (
        <button
          onClick={() => markRead(n.id)}
          title="Mark as read"
          style={{
            background: 'rgba(139,92,246,0.1)',
            border: '1px solid rgba(139,92,246,0.2)',
            borderRadius: '6px',
            color: '#c084fc',
            cursor: 'pointer',
            padding: '4px 6px',
            display: 'flex',
            alignItems: 'center',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(139,92,246,0.1)'}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </button>
      )}
      <button
        onClick={() => deleteOne(n.id)}
        disabled={deleting === n.id}
        title="Delete"
        style={{
          background: 'none',
          border: '1px solid rgba(220,38,38,0.15)',
          borderRadius: '6px',
          color: 'rgba(248,113,113,0.5)',
          cursor: 'pointer',
          padding: '4px 6px',
          display: 'flex',
          alignItems: 'center',
          opacity: deleting === n.id ? 0.4 : 1,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.1)'; e.currentTarget.style.color = '#f87171' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(248,113,113,0.5)' }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
        </svg>
      </button>
    </div>
  )

  return (
    <div style={styles.page}>
      {/* ── Header ── */}
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <h1 style={styles.title}>Notifications</h1>
          {unreadCount > 0 && <span style={styles.badge}>{unreadCount} unread</span>}
        </div>

        <div style={styles.actions}>
          <div style={styles.filterToggle}>
            <button style={styles.filterBtn(filter === 'all')}    onClick={() => setFilter('all')}>All</button>
            <button style={styles.filterBtn(filter === 'unread')} onClick={() => setFilter('unread')}>Unread</button>
          </div>

          {unreadCount > 0 && (
            <button
              style={styles.ghostBtn(false)}
              onClick={markAllRead}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              Mark all read
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              style={styles.ghostBtn(true)}
              onClick={openClearConfirm}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* ── List ── */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
          <div style={{ width: 26, height: 26, border: '2px solid rgba(139,92,246,0.2)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : displayed.length === 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '260px',
          gap: '12px',
          color: 'rgba(167,139,250,0.3)',
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
          <p style={{ fontSize: '14px' }}>
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </p>
        </div>
      ) : (
        <div>
          {displayed.map(n => (
            <div key={n.id} style={styles.card(!n.is_read, n.type)}>
              {/* unread dot */}
              {!n.is_read && <div style={styles.unreadDot} />}

              {/* icon */}
              <div style={styles.iconWrap}>
                {TYPE_ICON[n.type] || TYPE_ICON.general}
              </div>

              {/* content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={styles.notifTitle(!n.is_read)}>{n.title || 'Notification'}</p>
                <p style={styles.notifMsg}>{n.message}</p>
                <div style={styles.metaRow}>
                  <span style={styles.time}>{formatRelative(n.sent_at)}</span>
                  {n.task_title && (
                    <>
                      <span style={{ fontSize: '11px', color: 'rgba(139,92,246,0.3)' }}>·</span>
                      <span style={{ fontSize: '11px', color: 'rgba(167,139,250,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                        {n.task_title}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <ActionBar n={n} />
            </div>
          ))}
        </div>
      )}

      {/* ── Confirm clear all ── */}
      {confirmClear && createPortal(
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.65)',
            zIndex: 400,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)',
          }}
          onClick={e => e.target === e.currentTarget && setConfirmClear(false)}
        >
          <div style={{
            background: '#0f0a1e',
            border: '1px solid rgba(139,92,246,0.25)',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '300px',
            width: '100%',
            animation: 'slideIn 0.3s cubic-bezier(0.16,1,0.3,1) both',
          }}>
            <p style={{ fontSize: '15px', color: '#e9d5ff', marginBottom: '8px', fontWeight: 500 }}>
              Clear all notifications?
            </p>
            <p style={{ fontSize: '13px', color: 'rgba(167,139,250,0.5)', marginBottom: '20px' }}>
              This will permanently delete all {notifications.length} notification{notifications.length !== 1 ? 's' : ''}.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setConfirmClear(false)}
                style={{
                  flex: 1, padding: '9px',
                  background: 'rgba(139,92,246,0.08)',
                  border: '1px solid rgba(139,92,246,0.2)',
                  borderRadius: '9px',
                  color: 'rgba(167,139,250,0.6)',
                  cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif', fontSize: '13px',
                }}
              >
                Cancel
              </button>
              <button
                onClick={deleteAll}
                style={{
                  flex: 1, padding: '9px',
                  background: 'rgba(220,38,38,0.15)',
                  border: '1px solid rgba(220,38,38,0.35)',
                  borderRadius: '9px',
                  color: '#f87171',
                  cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif', fontSize: '13px',
                }}
              >
                Clear all
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}