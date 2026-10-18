import { NextRequest } from 'next/server'
import { lessonChunks, lessons, courses } from '@/lib/db/schema'
import { cosineDistance, sql, gt, desc, and, eq } from 'drizzle-orm/sql'
import { getEmbedding } from '@/lib/ollama'

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'

function buildLessonPrompt(context: string): string {
  return `ты - дружелюбный ассистент образовательной платформы PolitaevJS. Объясняешь материал простым языком, как хороший преподаватель
СТРОГИЕ ПРАВИЛА:
1. отвечай ИСКЛЮЧИТЕЛЬНО используя факты из контекста ниже. всё, чего в контексте нет, для тебя не существует, даже если ты это знаешь
2. сначала проверь: есть ли в контексте объяснение именно того, о чём спрашивают? Соседняя тема не считается: если в контексте говорится о чём-то похожем, но не об этом, ответа нет
3. если ответ в контексте есть - дай понятный ответ в 2-4 предложениях: объясни своими словами и приведи пример из контекста, если он там есть
4. если ответа нет - не пытайся угадать, не используй общие знания и не давай советов. ТОЛЬКО В ЭТОМ СЛУЧАЕ ответь одной этой фразой и больше ничего не добавляй: "К сожалению, в материалах этого курса нет прямого ответа на ваш вопрос"
5. никогда не переключайся на китайский, английский или другой язык.

Контекст из уроков:
${context}

Напоминание: если в контексте выше нет объяснения именно того, о чём спросили, ответь только фразой-отказом`
}

function buildCoursePrompt(courseInfo: string): string {
  return `Ты - дружелюбный ассистент образовательной платформы PolitaevJS. Ты помогаешь человеку понять, о чём этот курс и подойдёт ли он ему
ПРАВИЛА:
1. используй ТОЛЬКО информацию о курсе ниже. Ничего не выдумывай: не называй уроки, темы, сроки или уровень сложности, которых там нет
2. если в информации нет того, о чём спросили, так и скажи одной фразой и предложи спросить о темах курса
3. отвечай коротко, 2-4 предложения, простым языком
4. никогда не переключайся на китайский, английский или другой язык

Информация о курсе:
${courseInfo}`
}

async function* streamChatAnswer(question: string, systemPrompt: string) {

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

if (!res.ok) {
  throw new Error(`Ollama chat error: ${res.status} ${await res.text()}`)
}

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
const sortedGreetings = [...greetings].sort((a, b) => b.length - a.length)

function isPureGreeting(question: string): boolean {
  let cleaned = question.toLowerCase().trim()
  for (const g of sortedGreetings) {
    cleaned = cleaned.replaceAll(g, '')
  }
  // убираем знаки препинания и пробелы, что осталось
  cleaned = cleaned.replace(/[,.!?\s]/g, '')
  // если после удаления приветствий почти ничего не осталось - это чистое приветствие
  return cleaned.length === 0
}



const courseForms = ['курс', 'курса', 'курсе', 'курсу', 'курсом', 'курсы', 'курсов', 'курсам', 'курсах']
const courseWords = ['подойд', 'подходит', 'новичк', 'с чего начать', 'для кого', 'чему научу', 'чему научит', 'что я узнаю']

function isAboutCourse(question: string): boolean {
  const q = question.toLowerCase()
  const words = q.split(/[^а-яёa-z]+/)

  for(const form of courseForms) {
    if (words.includes(form)) return true
  }
  for (const w of courseWords) {
    if (q.includes(w)) return true
  }
  return false
}

function streamResponse(question: string, systemPrompt: string): Response {
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      for await (const token of streamChatAnswer(question, systemPrompt)) {
        controller.enqueue(encoder.encode(token))
      }
      controller.close()
    },
  })
  return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}

export async function POST(req: NextRequest) {
  const { question, courseId } = await req.json()

  if (isPureGreeting(question)) {
    return new Response('Привет! Я помогу разобраться с материалами этого курса. Спрашивай что угодно по темам уроков', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  const { db } = await import('@/lib/db') // <--- не забываем, что он находится здесь и зачем он здесь.

  // вопрос про сам курс: отвечаем по названию, описанию и программе
  if (isAboutCourse(question)) {
    const courseRows = await db.select().from(courses).where(eq(courses.id, Number(courseId)))
    const course = courseRows[0]
    if (!course) {
      return new Response('Курс не найден', { status: 404 })
    }

    const lessonRows = await db
      .select({ title: lessons.title })
      .from(lessons)
      .where(eq(lessons.courseId, Number(courseId)))
      .orderBy(lessons.order)

    const program = lessonRows.map((l, i) => `${i + 1}. ${l.title}`).join('\n')
    const courseInfo = `Название: ${course.title}\nОписание: ${course.description}\nПрограмма:\n${program}`

    return streamResponse(question, buildCoursePrompt(courseInfo))
  }

  // вопрос по содержанию уроков: ищем подходящие куски
  const normalizedQuestion = normalizeQuestion(question)
  const questionEmbedding = await getEmbedding('search_query: ' + normalizedQuestion)

  const similarity = sql<number>`1 - (${cosineDistance(lessonChunks.embedding, questionEmbedding)})`

  const relevantChunks = await db
    .select({ content: lessonChunks.content, similarity })
    .from(lessonChunks)
    .innerJoin(lessons, eq(lessonChunks.lessonId, lessons.id))
    .where(and(
      gt(similarity, 0),
      eq(lessons.courseId, Number(courseId))
    ))
    .orderBy((t) => desc(t.similarity))
    .limit(5)

  const context = relevantChunks.length > 0
    ? relevantChunks.map((c) => c.content).join('\n\n---\n\n')
    : '(материалов уроков пока нет)'

  return streamResponse(question, buildLessonPrompt(context))
}