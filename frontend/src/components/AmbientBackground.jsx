import { useEffect, useRef } from 'react'

const AmbientBackground = () => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId
    const particles = []

    const createParticles = (count, width, height) => {
      particles.length = 0
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 1.4 + 0.35,
          dx: (Math.random() - 0.5) * 0.22,
          dy: (Math.random() - 0.5) * 0.22,
          opacity: Math.random() * 0.38 + 0.08,
        })
      }
    }

    const resize = () => {
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2))
      const width = window.innerWidth
      const height = window.innerHeight

      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      createParticles(54, width, height)
    }

    const draw = () => {
      const width = window.innerWidth
      const height = window.innerHeight

      ctx.clearRect(0, 0, width, height)

      for (const p of particles) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(167, 139, 250, ${p.opacity})`
        ctx.fill()

        p.x += p.dx
        p.y += p.dy

        if (p.x <= 0 || p.x >= width) p.dx *= -1
        if (p.y <= 0 || p.y >= height) p.dy *= -1
      }

      for (let i = 0; i < particles.length; i++) {
        const a = particles[i]
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j]
          const dist = Math.hypot(a.x - b.x, a.y - b.y)
          if (dist < 115) {
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.07 * (1 - dist / 115)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      animationId = requestAnimationFrame(draw)
    }

    const motionReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    resize()
    if (!motionReduced) {
      draw()
    } else {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className="ambient-bg-layer" aria-hidden="true">
      <canvas ref={canvasRef} className="ambient-canvas" />
      <div className="ambient-blob ambient-blob-1" />
      <div className="ambient-blob ambient-blob-2" />
      <div className="ambient-blob ambient-blob-3" />
    </div>
  )
}

export default AmbientBackground
