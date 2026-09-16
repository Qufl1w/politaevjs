import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import LogoutButton from './logout-button'

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const user = session.user as { id: string, name: string, email: string }

  const enrolledCourses = [
    { id: 1, title: 'JavaScript основы', tag: 'JS', progress: 60, lessons: 6, completed: 4 },
    { id: 2, title: 'Node.js и Express', tag: 'Node', progress: 30, lessons: 6, completed: 2 },
  ]
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

        {/* Статистика */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 40 }}>
          {[
            { label: 'Курсов записано', value: '2' },
            { label: 'Уроков пройдено', value: '6' },
            { label: 'Часов обучения', value: '3.5' },
          ].map((stat) => (
            <div key={stat.label} style={{ background: '#141414', border: '0.5px solid #1e1e1e', borderRadius: 12, padding: '20px 24px' }}>
              <div style={{ fontSize: 28, fontWeight: 500, color: '#f0f0f0', marginBottom: 4 }}>{stat.value}</div>
              <div style={{ fontSize: 13, color: '#555' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Мои курсы */}
        <h2 style={{ fontSize: 18, fontWeight: 500, color: '#f0f0f0', marginBottom: 16 }}>Мои курсы</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {enrolledCourses.map((course) => (
            <Link href={`/courses/${course.id}`} key={course.id} style={{ background: '#141414', border: '0.5px solid #1e1e1e', borderRadius: 12, padding: '20px 24px', textDecoration: 'none', display: 'block' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ background: '#1a2e1a', color: '#4ade80', fontSize: 12, padding: '3px 10px', borderRadius: 4 }}>{course.tag}</span>
                  <span style={{ fontSize: 15, fontWeight: 500, color: '#e0e0e0' }}>{course.title}</span>
                </div>
                <span style={{ fontSize: 13, color: '#555' }}>{course.completed}/{course.lessons} уроков</span>
              </div>
              {/* Прогресс бар */}
              <div style={{ background: '#1a1a1a', borderRadius: 4, height: 4 }}>
                <div style={{ background: '#4ade80', borderRadius: 4, height: 4, width: `${course.progress}%` }} />
              </div>
              <div style={{ fontSize: 12, color: '#555', marginTop: 6 }}>{course.progress}% завершено</div>
            </Link>
          ))}
        </div>

        {/* Кнопка найти курсы */}
        <Link href="/courses" style={{ display: 'inline-block', marginTop: 24, background: 'transparent', color: '#4ade80', fontSize: 14, padding: '10px 20px', borderRadius: 8, border: '0.5px solid #2d4a2d', textDecoration: 'none' }}>
          Найти ещё курсы →
        </Link>

      </div>

      {/* Футер */}
      <footer style={{ padding: '16px 24px', display: 'flex', justifyContent: 'center', borderTop: '0.5px solid #1a1a1a' }}>
        <span style={{ fontSize: 14, color: '#444' }}>PolitaevJS © 2025</span>
      </footer>
    </main>
  )
}