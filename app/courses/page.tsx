import Link from 'next/link'
import { getCoursesWithLessonCount } from '@/lib/courses'

export default async function CoursesPage() {
  const allCourses = await getCoursesWithLessonCount()

  const tags: Record<number, string> = { 1: 'JS', 2: 'Node', 3: 'SQL', 4: 'TS', 5: 'React', 6: 'Docker' }

  return (
    <main style={{ background: '#0f0f0f', minHeight: '100vh', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>
      {/* Навбар */}
      <nav style={{ background: '#141414', borderBottom: '0.5px solid #1e1e1e', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 9, height: 9, background: '#4ade80', borderRadius: '0%' }} />
          <Link href="/" style={{ fontSize: 16, fontWeight: 500, color: '#4ade80', textDecoration: 'none' }}>PolitaevJS</Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link href="/courses" style={{ fontSize: 16, color: '#4ade80', textDecoration: 'none' }}>Курсы</Link>
          <Link href="/login" style={{ fontSize: 16, color: '#888', textDecoration: 'none' }}>Войти</Link>
          <Link href="/register" style={{ fontSize: 16, color: '#0f0f0f', background: '#4ade80', padding: '6px 14px', borderRadius: 6, fontWeight: 500, textDecoration: 'none' }}>Начать</Link>
        </div>
      </nav>

      {/* Заголовок */}
      <section style={{ padding: '48px 24px 32px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 36, fontWeight: 500, color: '#f0f0f0', marginBottom: 12 }}>
          Все <span style={{ color: '#4ade80' }}>курсы</span>
        </h1>
        <p style={{ fontSize: 15, color: '#666', maxWidth: 400, margin: '0 auto' }}>
          Выбери курс и начни учиться прямо сейчас
        </p>
      </section>

      {/* Сетка курсов */}
      <section style={{ padding: '0 24px 48px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {allCourses.map((course) => (
            <Link href={`/courses/${course.id}`} key={course.id} style={{ background: '#141414', border: '0.5px solid #1e1e1e', borderRadius: 12, padding: 24, textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ background: '#1a2e1a', color: '#4ade80', fontSize: 12, padding: '3px 10px', borderRadius: 4 }}>{tags[course.id as number]}</span>
                <span style={{ fontSize: 12, color: '#555' }}>Уроков: {course.lessonCount}</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 500, color: '#e0e0e0' }}>{course.title}</div>
              <div style={{ fontSize: 13, color: '#555', lineHeight: 1.6, flex: 1 }}>{course.description}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                <span style={{ fontSize: 13, color: '#4ade80' }}>Перейти →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Футер */}
      <footer style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', borderTop: '0.5px solid #1a1a1a', marginTop: 'auto' }}>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <span style={{ fontSize: 14, color: '#444' }}>PolitaevJS © 2026</span>
        </div>
        <Link href="/" style={{ fontSize: 16, color: '#4ade80', textDecoration: 'none' }}>На главную →</Link>
      </footer>
    </main>
  )
}