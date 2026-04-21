import { useGoogleLogin } from '@react-oauth/google'
import useAuth from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'

const Login = () => {
  const { loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animFrame

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.5 + 0.3,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.5 + 0.1,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p) => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(167, 139, 250, ${p.opacity})`
        ctx.fill()
        p.x += p.dx
        p.y += p.dy
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1
      })

      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach((b) => {
          const dist = Math.hypot(a.x - b.x, a.y - b.y)
          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.08 * (1 - dist / 120)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        })
      })

      animFrame = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animFrame)
      window.removeEventListener('resize', resize)
    }
  }, [])

  const login = useGoogleLogin({
    flow: 'auth-code',
    prompt: 'consent',
    access_type: 'offline',
    scope: [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/classroom.courses.readonly',
      'https://www.googleapis.com/auth/classroom.coursework.me',
      'https://www.googleapis.com/auth/classroom.student-submissions.me.readonly',
    ].join(' '),
    onSuccess: async ({ code }) => {
      try {
        await loginWithGoogle(code)
        navigate('/dashboard')
      } catch (err) {
        console.error('Login failed', err)
      }
    },
    onError: () => console.error('Google Login Failed'),
  })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=DM+Sans:wght@300;400&display=swap');

        .login-root {
          min-height: 100vh;
          background: #0a0a0f;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          font-family: 'DM Sans', sans-serif;
        }
        .login-canvas {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          animation: drift 12s ease-in-out infinite alternate;
        }
        .blob-1 {
          width: 420px; height: 420px;
          background: rgba(109, 40, 217, 0.18);
          top: -100px; left: -80px;
          animation-delay: 0s;
        }
        .blob-2 {
          width: 300px; height: 300px;
          background: rgba(76, 29, 149, 0.2);
          bottom: -60px; right: -60px;
          animation-delay: -4s;
        }
        .blob-3 {
          width: 200px; height: 200px;
          background: rgba(139, 92, 246, 0.1);
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: -8s;
        }
        @keyframes drift {
          0%   { transform: translate(0, 0) scale(1); }
          100% { transform: translate(30px, 20px) scale(1.08); }
        }
        .login-card {
          position: relative;
          z-index: 10;
          background: rgba(15, 10, 30, 0.75);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 24px;
          padding: 52px 48px;
          width: 100%;
          max-width: 420px;
          backdrop-filter: blur(24px);
          animation: fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
          box-shadow: 0 0 0 1px rgba(139,92,246,0.05), 0 32px 64px rgba(0,0,0,0.5);
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .app-name {
          font-family: 'Poppins', sans-serif;
          font-size: 48px;
          font-weight: 400;
          color: #e9d5ff;
          letter-spacing: -1px;
          line-height: 1;
          margin: 0 0 6px;
          text-align: center;
          animation: fadeUp 0.7s 0.1s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .app-name span {
          font-weight: 700;
          background: linear-gradient(135deg, #c084fc, #7c3aed);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .tagline {
          display: flex;
          gap: 8px;
          margin: 20px 0 30px;
          justify-content: center;
          animation: fadeUp 0.7s 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
          flex-wrap: wrap;
        }
        .tag-word {
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(167, 139, 250, 0.6);
          padding: 4px 10px;
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 20px;
        }
        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent);
          margin: 0 0 32px;
          animation: fadeUp 0.7s 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .signin-label {
          font-size: 11px;
          color: rgba(167, 139, 250, 0.4);
          letter-spacing: 0.1em;
          margin: 0 0 14px;
          text-align: center;
          animation: fadeUp 0.7s 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .google-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 14px 24px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(139, 92, 246, 0.25);
          border-radius: 14px;
          color: #e9d5ff;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 400;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s, transform 0.15s, box-shadow 0.2s;
          animation: fadeUp 0.7s 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
          position: relative;
          overflow: hidden;
        }
        .google-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(139,92,246,0.08), transparent);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .google-btn:hover {
          background: rgba(139, 92, 246, 0.1);
          border-color: rgba(139, 92, 246, 0.5);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(109, 40, 217, 0.2);
        }
        .google-btn:hover::before { opacity: 1; }
        .google-btn:active {
          transform: translateY(0px);
          box-shadow: none;
        }
        .google-icon { width: 18px; height: 18px; flex-shrink: 0; }
        .footer-text {
          margin-top: 28px;
          font-size: 12px;
          color: rgba(139, 92, 246, 0.3);
          text-align: center;
          animation: fadeUp 0.7s 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>

      <div className="login-root">
        <canvas ref={canvasRef} className="login-canvas" />
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />

        <div className="login-card">
          <h1 className="app-name">Priorit<span>Ease</span></h1>

          <div className="tagline">
            <span className="tag-word">Organize</span>
            <span className="tag-word">Prioritize</span>
            <span className="tag-word">Achieve</span>
          </div>

          <div className="divider" />
          <p className="signin-label">CONTINUE WITH</p>

          <button className="google-btn" onClick={login}>
            <svg className="google-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>

          <p className="footer-text">By signing in you agree to sync your Google Classroom data</p>
        </div>
      </div>
    </>
  )
}

export default Login