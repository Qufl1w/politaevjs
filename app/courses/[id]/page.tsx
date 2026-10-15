import Link from 'next/link'
import { db } from '@/lib/db'
import { courses, lessons } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const courseId = Number(id)

if (!Number.isInteger(courseId) || courseId < 1) {
  redirect('/courses')
}

  const courseResult = await db.select().from(courses).where(eq(courses.id, Number(id)))
  const course = courseResult[0]

  if (!course) {
    redirect('/courses')
  }

  const courseLessons = await db.select().from(lessons).where(eq(lessons.courseId, courseId))

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
          <Link href="/login" style={{ fontSize: 16, color: '#888', textDecoration: 'none' }}>Войти</Link>
          <Link href="/register" style={{ fontSize: 16, color: '#0f0f0f', background: '#4ade80', padding: '6px 14px', borderRadius: 6, fontWeight: 500, textDecoration: 'none' }}>Начать</Link>
        </div>
      </nav>

      {/* Хлебные крошки */}
      <div style={{ padding: '16px 24px', borderBottom: '0.5px solid #1a1a1a' }}>
        <Link href="/courses" style={{ fontSize: 13, color: '#555', textDecoration: 'none' }}>← Все курсы</Link>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px', width: '100%', flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'start' }}>

          {/* Левая часть */}
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 500, color: '#f0f0f0', marginBottom: 16, lineHeight: 1.3 }}>{course.title}</h1>
            <p style={{ fontSize: 15, color: '#666', lineHeight: 1.7, marginBottom: 32 }}>{course.description}</p>

            {/* Список уроков */}
            <h2 style={{ fontSize: 18, fontWeight: 500, color: '#f0f0f0', marginBottom: 16 }}>Программа курса</h2>
            {courseLessons.length === 0 ? (
              <p style={{ fontSize: 14, color: '#555' }}>Уроки скоро появятся</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {courseLessons.map((lesson, index) => (
                  <div key={lesson.id} style={{ background: '#141414', border: '0.5px solid #1e1e1e', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{ fontSize: 13, color: '#333', minWidth: 20 }}>{index + 1}</span>
                      <span style={{ fontSize: 15, color: '#e0e0e0' }}>{lesson.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Правая часть */}
          <div style={{ background: '#141414', border: '0.5px solid #1e1e1e', borderRadius: 16, padding: 24, position: 'sticky', top: 24 }}>
            <div style={{ fontSize: 28, fontWeight: 500, color: '#4ade80', marginBottom: 4 }}>Бесплатно</div>
            <div style={{ fontSize: 13, color: '#555', marginBottom: 24 }}>Полный доступ к курсу</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#555' }}>Уроков</span>
                <span style={{ color: '#e0e0e0' }}>{courseLessons.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#555' }}>Доступ</span>
                <span style={{ color: '#e0e0e0' }}>Навсегда</span>
              </div>
            </div>

            <Link href="/register" style={{ display: 'block', background: '#4ade80', color: '#0f0f0f', fontSize: 15, fontWeight: 500, padding: '12px', borderRadius: 8, textDecoration: 'none', textAlign: 'center' }}>
              Записаться на курс
            </Link>
            <Link href="/login" style={{ display: 'block', color: '#555', fontSize: 13, textAlign: 'center', marginTop: 12, textDecoration: 'none' }}>
              Уже записан? Войти
            </Link>
          </div>

        </div>
      </div>

      {/* Футер */}
      <footer style={{ padding: '16px 24px', display: 'flex', justifyContent: 'center', borderTop: '0.5px solid #1a1a1a' }}>
        <span style={{ fontSize: 14, color: '#444' }}>PolitaevJS © 2026</span>
      </footer>
    </main>
  )
}