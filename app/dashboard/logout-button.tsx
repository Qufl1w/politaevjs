'use client'
import { signOut } from 'next-auth/react'

export default function LogoutButton() {
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <button
      onClick={handleLogout}
      style={{ fontSize: 16, color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}
    >
      Выйти
    </button>
  )
}