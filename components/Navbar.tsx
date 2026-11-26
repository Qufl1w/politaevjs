import Link from 'next/link'
import { auth } from '@/auth'
import LogoutButton from '@/app/dashboard/logout-button'

export default async function Navbar() {
  const session = await auth()
  const loggedIn = Boolean(session?.user)

  return (
    <nav style={{ background: '#141414', borderBottom: '0.5px solid #1e1e1e', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 9, height: 9, background: '#4ade80' }} />
        <Link href="/" style={{ fontSize: 16, fontWeight: 500, color: '#4ade80', textDecoration: 'none' }}>PolitaevJS</Link>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <Link href="/courses" style={{ fontSize: 16, color: '#888', textDecoration: 'none' }}>Курсы</Link>
        {loggedIn ? (
          <>
            <Link href="/dashboard" style={{ fontSize: 16, color: '#888', textDecoration: 'none' }}>Кабинет</Link>
            <LogoutButton />
          </>
        ) : (
          <>
            <Link href="/login" style={{ fontSize: 16, color: '#888', textDecoration: 'none' }}>Войти</Link>
            <Link href="/register" style={{ fontSize: 16, color: '#0f0f0f', background: '#4ade80', padding: '6px 14px', borderRadius: 6, fontWeight: 500, textDecoration: 'none' }}>Начать</Link>
          </>
        )}
      </div>
    </nav>
  )
}