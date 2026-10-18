import Link from 'next/link'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { courses, lessons } from '@/lib/db/schema'

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>
}) {
  const { id, lessonId } = await params
  const courseId = Number(id)
  const lessonNumber = Number(lessonId)

  if (!Number.isInteger(courseId) || courseId < 1 || !Number.isInteger(lessonNumber) || lessonNumber < 1) {
    redirect('/courses')
  }

  const courseRows = await db.select().from(courses).where(eq(courses.id, courseId))
  const course = courseRows[0]
  if (!course) {
    redirect('/courses')
  }

  const courseLessons = await db
    .select()
    .from(lessons)
    .where(eq(lessons.courseId, courseId))
    .orderBy(lessons.order)

  const index = courseLessons.findIndex((l) => l.id === lessonNumber)
  if (index === -1) {
    redirect(`/courses/${courseId}`)
  }

  const lesson = courseLessons[index]
  const prev = courseLessons[index - 1]
  const next = courseLessons[index + 1]

  return (
    <main style={{ background: '#0f0f0f', minHeight: '100vh', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>
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

      <div style={{ padding: '16px 24px', borderBottom: '0.5px solid #1a1a1a' }}>
        <Link href={`/courses/${course.id}`} style={{ fontSize: 13, color: '#555', textDecoration: 'none' }}>← {course.title}</Link>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px', width: '100%', flex: 1 }}>
        <div style={{ fontSize: 13, color: '#4ade80', marginBottom: 8 }}>
          Урок {index + 1} из {courseLessons.length}
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 500, color: '#f0f0f0', marginBottom: 24, lineHeight: 1.3 }}>{lesson.title}</h1>
        <div style={{ fontSize: 16, color: '#c8c8c8', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
          {lesson.content ?? 'Материал урока скоро появится'}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 48, gap: 12 }}>
          {prev ? (
            <Link href={`/courses/${course.id}/lessons/${prev.id}`} style={{ fontSize: 14, color: '#888', textDecoration: 'none' }}>← {prev.title}</Link>
          ) : <span />}
          {next ? (
            <Link href={`/courses/${course.id}/lessons/${next.id}`} style={{ fontSize: 14, color: '#4ade80', textDecoration: 'none' }}>{next.title} →</Link>
          ) : <span />}
        </div>
      </div>

      <footer style={{ padding: '16px 24px', display: 'flex', justifyContent: 'center', borderTop: '0.5px solid #1a1a1a' }}>
        <span style={{ fontSize: 14, color: '#444' }}>PolitaevJS © 2026</span>
      </footer>
    </main>
  )
}