import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { lessons, lessonChunks } from '../lib/db/schema'
import { getEmbedding } from '../lib/ollama'
import { cosineDistance, sql, desc, eq } from 'drizzle-orm/sql'
import { cases } from './eval-cases'

async function main() {
  const { db } = await import('../lib/db')
  const results: { expect: string; score: number }[] = []

  for (const c of cases) {
    const questionEmbedding = await getEmbedding('search_query: ' + c.q.toLowerCase())
    const similarity = sql<number>`1 - (${cosineDistance(lessonChunks.embedding, questionEmbedding)})`

    const rows = await db
      .select({ similarity })
      .from(lessonChunks)
      .innerJoin(lessons, eq(lessonChunks.lessonId, lessons.id))
      .where(eq(lessons.courseId, c.course))
      .orderBy((t) => desc(t.similarity))
      .limit(1)

    let score = 0
    if (rows.length > 0) {
      score = Number(rows[0].similarity)
    }

    results.push({ expect: c.expect, score })
    console.log(score.toFixed(3), c.expect, c.q)
  }

  let answerTotal = 0
  let refuseTotal = 0
  for (const r of results) {
    if (r.expect === 'answer') answerTotal++
    else refuseTotal++
  }

  console.log(`\nВсего: нормальных вопросов ${answerTotal}, без ответа в уроках ${refuseTotal}`)
  console.log('порог | зря откажет нормальным | вопросов без ответа дойдёт до модели')

  for (let p = 50; p <= 85; p += 5) {
    const threshold = p / 100
    let missed = 0
    let leaked = 0
    for (const r of results) {
      if (r.expect === 'answer' && r.score < threshold) missed++
      if (r.expect === 'refuse' && r.score >= threshold) leaked++
    }
    console.log(threshold.toFixed(2), '|', missed, '|', leaked)
  }

  process.exit(0)
}

main()