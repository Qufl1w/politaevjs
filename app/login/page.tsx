'use client'
import { useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async () => {
  setError('')
  setLoading(true)

  const result = await signIn('credentials', {
    redirect: false,
    email,
    password,
  })

  setLoading(false)

  if (result?.error) {
    setError('Неверный email или пароль')
    return
  }

  window.location.href = '/dashboard'
  router.push('/dashboard')
}

  return (
    <main style={{ background: '#0f0f0f', minHeight: '100vh', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ background: '#141414', borderBottom: '0.5px solid #1e1e1e', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 9, height: 9, background: '#4ade80' }} />
          <Link href="/" style={{ fontSize: 16, fontWeight: 500, color: '#4ade80', textDecoration: 'none' }}>PolitaevJS</Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link href="/courses" style={{ fontSize: 16, color: '#888', textDecoration: 'none' }}>Курсы</Link>
          <Link href="/register" style={{ fontSize: 16, color: '#0f0f0f', background: '#4ade80', padding: '6px 14px', borderRadius: 6, fontWeight: 500, textDecoration: 'none' }}>Начать</Link>
        </div>
      </nav>

      <section style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ background: '#141414', border: '0.5px solid #1e1e1e', borderRadius: 16, padding: '40px 36px', width: '100%', maxWidth: 420 }}>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 24, fontWeight: 500, color: '#f0f0f0', marginBottom: 8 }}>Добро пожаловать</h1>
            <p style={{ fontSize: 14, color: '#555' }}>Нет аккаунта? <Link href="/register" style={{ color: '#4ade80', textDecoration: 'none' }}>Зарегистрироваться</Link></p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, color: '#888', display: 'block', marginBottom: 6 }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ivan@example.com"
                style={{ width: '100%', background: '#0f0f0f', border: '0.5px solid #2a2a2a', borderRadius: 8, padding: '10px 14px', fontSize: 15, color: '#f0f0f0', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, color: '#888', display: 'block', marginBottom: 6 }}>Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введи пароль"
                style={{ width: '100%', background: '#0f0f0f', border: '0.5px solid #2a2a2a', borderRadius: 8, padding: '10px 14px', fontSize: 15, color: '#f0f0f0', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {error && (
            <div style={{ marginTop: 16, padding: '10px 14px', background: '#2a1a1a', border: '0.5px solid #4a2a2a', borderRadius: 8, fontSize: 13, color: '#f87171' }}>
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ width: '100%', background: loading ? '#2d4a2d' : '#4ade80', color: '#0f0f0f', fontSize: 15, fontWeight: 500, padding: '11px', borderRadius: 8, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', marginTop: 24 }}
          >
            {loading ? 'Загрузка...' : 'Войти'}
          </button>
        </div>
      </section>

      <footer style={{ padding: '16px 24px', display: 'flex', justifyContent: 'center', borderTop: '0.5px solid #1a1a1a' }}>
        <span style={{ fontSize: 14, color: '#444' }}>PolitaevJS © 2025</span>
      </footer>
    </main>
  )
}