import { eq } from 'drizzle-orm'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { lessons, lessonChunks } from '../lib/db/schema'
import { getEmbedding } from '../lib/ollama'

function chunkText(text: string, maxLen = 500): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/)
  const chunks: string[] = []
  let current = ''
  for (const s of sentences) {
    if ((current + s).length > maxLen && current) {
      chunks.push(current.trim())
      current = ''
    }
    current += s + ' '
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks
}

async function main() {
  const { db } = await import('../lib/db')

  const allLessons = await db.select().from(lessons)
  console.log(`Найдено уроков: ${allLessons.length}`)

  for (const lesson of allLessons) {
    if (!lesson.content) continue
    const chunks = chunkText(lesson.content)
    console.log(`Урок "${lesson.title}": ${chunks.length} чанков`)

await db.delete(lessonChunks).where(eq(lessonChunks.lessonId, lesson.id))

    for (const chunk of chunks) {
      const embedding = await getEmbedding('search_document' + chunk)
      await db.insert(lessonChunks).values({
        lessonId: lesson.id,
        content: chunk,
        embedding,
      })
    }
  }
  console.log('Готово!')
  process.exit(0)
}

main()