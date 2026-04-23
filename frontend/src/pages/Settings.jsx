import { useState, useEffect } from 'react'
import axios from '../api/axios'
import useAuth from '../hooks/useAuth'

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export default function Settings() {
  const { user, logout } = useAuth()

  const [pushEnabled,  setPushEnabled]  = useState(false)
  const [pushLoading,  setPushLoading]  = useState(true)
  const [pushStatus,   setPushStatus]   = useState(null)   // { type: 'success'|'error', msg }

  const [syncLoading,  setSyncLoading]  = useState(false)
  const [syncStatus,   setSyncStatus]   = useState(null)

  const [confirmLogout, setConfirmLogout] = useState(false)

  // ── Detect current push state on mount ──
  useEffect(() => {
    const check = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setPushLoading(false)
        return
      }
      try {
        const reg  = await navigator.serviceWorker.ready
        const sub  = await reg.pushManager.getSubscription()
        setPushEnabled(!!sub)
      } catch { /* ignore */ }
      finally { setPushLoading(false) }
    }
    check()
  }, [])

  // ── Toggle push ──
  const togglePush = async () => {
    setPushLoading(true)
    setPushStatus(null)
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setPushStatus({ type: 'error', msg: 'Push notifications are not supported in this browser.' })
        return
      }

      const reg = await navigator.serviceWorker.ready

      if (pushEnabled) {
        // Unsubscribe
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          await axios.delete('/push/subscribe', { data: { endpoint: sub.endpoint } })
          await sub.unsubscribe()
        }
        setPushEnabled(false)
        setPushStatus({ type: 'success', msg: 'Push notifications disabled.' })
      } else {
        // Request permission
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          setPushStatus({ type: 'error', msg: 'Notification permission denied. Enable it in your browser settings.' })
          return
        }

        // Get VAPID key and subscribe
        const { data } = await axios.get('/push/vapid-public-key')
        const applicationServerKey = urlBase64ToUint8Array(data.publicKey)

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        })

        await axios.post('/push/subscribe', sub)
        setPushEnabled(true)
        setPushStatus({ type: 'success', msg: 'Push notifications enabled on this device.' })
      }
    } catch (err) {
      setPushStatus({ type: 'error', msg: err?.response?.data?.error || err.message || 'Something went wrong.' })
    } finally {
      setPushLoading(false)
    }
  }

  // ── Manual sync ──
  const handleSync = async () => {
    setSyncLoading(true)
    setSyncStatus(null)
    try {
      await axios.post('/classroom/sync')
      setSyncStatus({ type: 'success', msg: 'Classroom synced successfully.' })
    } catch (err) {
      setSyncStatus({ type: 'error', msg: err?.response?.data?.message || 'Sync failed. Check your Classroom access.' })
    } finally {
      setSyncLoading(false)
    }
  }

  const supportsPush = 'serviceWorker' in navigator && 'PushManager' in window

  const styles = {
    page: {
      fontFamily: 'DM Sans, sans-serif',
      color: '#e9d5ff',
      maxWidth: '560px',
    },
    title: {
      fontFamily: 'Poppins, sans-serif',
      fontSize: '22px',
      fontWeight: 600,
      color: '#e9d5ff',
      marginBottom: '28px',
    },
    section: {
      background: 'rgba(15,10,30,0.7)',
      border: '1px solid rgba(139,92,246,0.14)',
      borderRadius: '14px',
      padding: '20px 22px',
      marginBottom: '16px',
    },
    sectionTitle: {
      fontFamily: 'Poppins, sans-serif',
      fontSize: '13px',
      fontWeight: 600,
      color: 'rgba(167,139,250,0.5)',
      letterSpacing: '0.09em',
      textTransform: 'uppercase',
      marginBottom: '16px',
    },
    row: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
    },
    rowLabel: {
      fontSize: '14px',
      color: '#e9d5ff',
      fontWeight: 400,
    },
    rowSub: {
      fontSize: '12px',
      color: 'rgba(167,139,250,0.45)',
      marginTop: '2px',
    },
    toggle: (on, disabled) => ({
      width: '42px',
      height: '24px',
      borderRadius: '12px',
      background: on ? 'rgba(124,58,237,0.7)' : 'rgba(139,92,246,0.15)',
      border: `1px solid ${on ? 'rgba(192,132,252,0.5)' : 'rgba(139,92,246,0.25)'}`,
      cursor: disabled ? 'not-allowed' : 'pointer',
      position: 'relative',
      transition: 'background 0.2s, border-color 0.2s',
      flexShrink: 0,
      opacity: disabled ? 0.5 : 1,
    }),
    toggleThumb: (on) => ({
      width: '16px',
      height: '16px',
      borderRadius: '50%',
      background: on ? '#f3e8ff' : 'rgba(167,139,250,0.5)',
      position: 'absolute',
      top: '3px',
      left: on ? '21px' : '3px',
      transition: 'left 0.18s cubic-bezier(0.16,1,0.3,1), background 0.2s',
    }),
    actionBtn: (variant) => ({
      padding: '9px 20px',
      background: variant === 'primary'
        ? 'rgba(139,92,246,0.18)'
        : variant === 'danger'
        ? 'rgba(220,38,38,0.1)'
        : 'rgba(139,92,246,0.08)',
      border: `1px solid ${
        variant === 'primary' ? 'rgba(139,92,246,0.35)' :
        variant === 'danger'  ? 'rgba(220,38,38,0.25)' :
        'rgba(139,92,246,0.2)'}`,
      borderRadius: '9px',
      color: variant === 'danger' ? '#f87171' : '#c084fc',
      cursor: 'pointer',
      fontFamily: 'DM Sans, sans-serif',
      fontSize: '13px',
      transition: 'background 0.15s',
      display: 'flex',
      alignItems: 'center',
      gap: '7px',
    }),
    infoRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
    },
    avatar: {
      width: '44px',
      height: '44px',
      borderRadius: '50%',
      background: 'rgba(139,92,246,0.2)',
      border: '1px solid rgba(139,92,246,0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '18px',
      fontWeight: 700,
      color: '#c084fc',
      flexShrink: 0,
    },
    statusBanner: (type) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '9px 14px',
      borderRadius: '9px',
      marginTop: '12px',
      fontSize: '13px',
      background: type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(220,38,38,0.1)',
      border: `1px solid ${type === 'success' ? 'rgba(34,197,94,0.25)' : 'rgba(220,38,38,0.25)'}`,
      color: type === 'success' ? '#4ade80' : '#f87171',
    }),
  }

  const Divider = () => (
    <div style={{ height: '1px', background: 'rgba(139,92,246,0.08)', margin: '16px 0' }} />
  )

  const StatusBanner = ({ status, onDismiss }) => status ? (
    <div style={styles.statusBanner(status.type)}>
      {status.type === 'success'
        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      }
      <span style={{ flex: 1 }}>{status.msg}</span>
      <button
        onClick={onDismiss}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.6, padding: 0, display: 'flex' }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  ) : null

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Settings</h1>

      {/* ── Account ── */}
      <div style={styles.section}>
        <p style={styles.sectionTitle}>Account</p>
        <div style={styles.infoRow}>
          <div style={styles.avatar}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '15px', fontWeight: 500, color: '#e9d5ff', marginBottom: '2px' }}>{user?.name || '—'}</p>
            <p style={{ fontSize: '13px', color: 'rgba(167,139,250,0.45)' }}>{user?.email || '—'}</p>
          </div>
          <button
            style={styles.actionBtn('danger')}
            onClick={() => setConfirmLogout(true)}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,0.18)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(220,38,38,0.1)'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      </div>

      {/* ── Push Notifications ── */}
      <div style={styles.section}>
        <p style={styles.sectionTitle}>Push Notifications</p>

        <div style={styles.row}>
          <div>
            <p style={styles.rowLabel}>Enable push notifications</p>
            <p style={styles.rowSub}>
              {!supportsPush
                ? 'Not supported in this browser'
                : pushEnabled
                ? 'Notifications are active on this device'
                : 'Get deadline reminders and priority alerts'}
            </p>
          </div>
          <div
            style={styles.toggle(pushEnabled, pushLoading || !supportsPush)}
            onClick={(!pushLoading && supportsPush) ? togglePush : undefined}
            role="switch"
            aria-checked={pushEnabled}
          >
            {pushLoading
              ? <div style={{ position: 'absolute', top: '5px', left: '5px', width: '12px', height: '12px', border: '1.5px solid rgba(255,255,255,0.3)', borderTopColor: '#f3e8ff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              : <div style={styles.toggleThumb(pushEnabled)} />
            }
          </div>
        </div>

        <StatusBanner status={pushStatus} onDismiss={() => setPushStatus(null)} />
      </div>

      {/* ── Google Classroom ── */}
      <div style={styles.section}>
        <p style={styles.sectionTitle}>Google Classroom</p>

        <div style={styles.row}>
          <div>
            <p style={styles.rowLabel}>Sync Classroom data</p>
            <p style={styles.rowSub}>Fetch latest courses and assignments</p>
          </div>
          <button
            style={styles.actionBtn('primary')}
            onClick={handleSync}
            disabled={syncLoading}
            onMouseEnter={e => !syncLoading && (e.currentTarget.style.background = 'rgba(139,92,246,0.28)')}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(139,92,246,0.18)'}
          >
            {syncLoading ? (
              <>
                <div style={{ width: '13px', height: '13px', border: '1.5px solid rgba(192,132,252,0.3)', borderTopColor: '#c084fc', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                Syncing…
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="23 4 23 10 17 10"/>
                  <polyline points="1 20 1 14 7 14"/>
                  <path d="M3.51 9a9 9 0 0114.13-3.36L23 10M1 14l5.36 4.36A9 9 0 0020.49 15"/>
                </svg>
                Sync now
              </>
            )}
          </button>
        </div>

        <StatusBanner status={syncStatus} onDismiss={() => setSyncStatus(null)} />
      </div>

      {/* ── About ── */}
      <div style={styles.section}>
        <p style={styles.sectionTitle}>About</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { label: 'App',     value: 'PrioritEase' },
            { label: 'Version', value: '1.0.0' },
            { label: 'Creator', value: 'bilalabbasi1404@gmail.com' },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'rgba(167,139,250,0.45)' }}>{r.label}</span>
              <span style={{ color: 'rgba(233,213,255,0.65)' }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Confirm logout ── */}
      {confirmLogout && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.65)',
            zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)',
          }}
          onClick={e => e.target === e.currentTarget && setConfirmLogout(false)}
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
            <p style={{ fontSize: '15px', color: '#e9d5ff', marginBottom: '8px', fontWeight: 500 }}>Sign out?</p>
            <p style={{ fontSize: '13px', color: 'rgba(167,139,250,0.5)', marginBottom: '20px' }}>
              You'll need to sign in with Google again to access PrioritEase.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setConfirmLogout(false)}
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
                onClick={logout}
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
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}