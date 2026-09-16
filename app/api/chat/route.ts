import { NextRequest } from 'next/server'
import { lessonChunks, lessons } from '@/lib/db/schema'
import { cosineDistance, sql, gt, desc, and, eq } from 'drizzle-orm/sql'
import { getEmbedding } from '@/lib/ollama'

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'

async function* streamChatAnswer(question: string, context: string) {
  const systemPrompt = `Ты — ассистент образовательной платформы PolitaevJS. 
СТРОГИЕ ПРАВИЛА:
1. Отвечай ИСКЛЮЧИТЕЛЬНО используя факты из контекста ниже.
2. Если контекст не отвечает напрямую на заданный вопрос — не пытайся угадать или использовать общие знания. Ответь: "К сожалению, в материалах этого курса нет прямого ответа на ваш вопрос."
3. Никогда не переключайся на китайский, английский или другой язык.

Контекст из уроков:
${context}`

  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    body: JSON.stringify({
      model: 'qwen2.5:14b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
      stream: true,
      options: {
      temperature: 0.2,
      },
    }),
  })

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const line of lines) {
      if (!line.trim()) continue
      const json = JSON.parse(line)
      if (json.message?.content) yield json.message.content
    }
  }
}

const termMap: Record<string, string> = {
  'джаваскрипт': 'javascript',
  'джс': 'js',
  'реакт': 'react',
  'нод': 'node',
  'ноджс': 'node.js',
  'экспресс': 'express',
  'докер': 'docker',
  'постгрес': 'postgresql',
  'постгре': 'postgresql',
  'типскрипт': 'typescript',
  'тайпскрипт': 'typescript',
}

// сделал сортировку по убыванию длины ключа для слов выше
function normalizeQuestion(question: string): string {
  let result = question.toLowerCase()

  const sortedEntries = Object.entries(termMap).sort(
    ([a], [b]) => b.length - a.length
  )

  for (const [ru, en] of sortedEntries) {
    result = result.replaceAll(ru, en)
  }
  return result
}

const greetings = ['привет', 'здравствуй', 'здравствуйте', 'хай', 'йо', 'добрый день', 'добрый вечер', 'как дела']

function isPureGreeting(question: string): boolean {
  let cleaned = question.toLowerCase().trim()
  for (const g of greetings) {
    cleaned = cleaned.replaceAll(g, '')
  }
  // убираем знаки препинания и пробелы, что осталось
  cleaned = cleaned.replace(/[,.!?\s]/g, '')
  // если после удаления приветствий почти ничего не осталось — это чистое приветствие
  return cleaned.length < 3
}

export async function POST(req: NextRequest) {
  const { question, courseId } = await req.json()
 if (isPureGreeting(question)) {
  return new Response('Привет! Я помогу разобраться с материалами этого курса. Спрашивай что угодно по темам уроков', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

  const normalizedQuestion = normalizeQuestion(question)

  
  const { db } = await import('@/lib/db') // <--- стоп, фиксируем грязюку. не забываем, что он находится здесь и зачем он здесь.
 
  const questionEmbedding = await getEmbedding(normalizedQuestion)

  const similarity = sql<number>`1 - (${cosineDistance(lessonChunks.embedding, questionEmbedding)})`

  const relevantChunks = await db
    .select({ content: lessonChunks.content, similarity })
    .from(lessonChunks)
    .innerJoin(lessons, eq(lessonChunks.lessonId, lessons.id))
    .where(and(
      gt(similarity, 0.8),
      eq(lessons.courseId, Number(courseId))
))
    .orderBy((t) => desc(t.similarity))
    .limit(5)

if (relevantChunks.length === 0) {
  return new Response('В материалах уроков нет информации по этому вопросу. Попробуйте посмотреть другой курс или переформулировать вопрос.', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

  const context = relevantChunks.map((c) => c.content).join('\n\n---\n\n')

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      for await (const token of streamChatAnswer(question, context)) {
        controller.enqueue(encoder.encode(token))
      }
      controller.close()
    },
  })

  return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
