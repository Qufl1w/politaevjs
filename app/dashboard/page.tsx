import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import LogoutButton from './logout-button'
import { getCoursesWithLessonCount } from '@/lib/courses'

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const user = session.user as { id: string, name: string, email: string }

 const allCourses = await getCoursesWithLessonCount()
  return (
    <main style={{ background: '#0f0f0f', minHeight: '100vh', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>

      
      {/* Навбар */}
      <nav style={{ background: '#141414', borderBottom: '0.5px solid #1e1e1e', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 9, height: 9, background: '#4ade80' }} />
          <Link href="/" style={{ fontSize: 16, fontWeight: 500, color: '#4ade80', textDecoration: 'none' }}>PolitaevJS</Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link href="/courses" style={{ fontSize: 16, color: '#888', textDecoration: 'none' }}>Курсы</Link>
          <LogoutButton />
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px', width: '100%', flex: 1 }}>

        {/* Приветствие */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 28, fontWeight: 500, color: '#f0f0f0', marginBottom: 6 }}>
            Привет, <span style={{ color: '#4ade80' }}>{user.name}</span>
          </h1>
          <p style={{ fontSize: 14, color: '#555' }}>{user.email}</p>
        </div>

       <h2 style={{ fontSize: 18, fontWeight: 500, color: '#f0f0f0', marginBottom: 16 }}>Курсы</h2>
<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
  {allCourses.map((course) => (
    <Link href={`/courses/${course.id}`} key={course.id} style={{ background: '#141414', border: '0.5px solid #1e1e1e', borderRadius: 12, padding: '20px 24px', textDecoration: 'none', display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 15, fontWeight: 500, color: '#e0e0e0' }}>{course.title}</span>
      <span style={{ fontSize: 13, color: '#555' }}>Уроков: {course.lessonCount}</span>
    </Link>
  ))}
</div>

      </div>

      {/* Футер */}
      <footer style={{ padding: '16px 24px', display: 'flex', justifyContent: 'center', borderTop: '0.5px solid #1a1a1a' }}>
        <span style={{ fontSize: 14, color: '#444' }}>PolitaevJS © 2026</span>
      </footer>
    </main>
  )
}