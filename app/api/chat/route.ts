import { NextRequest } from "next/server";
import {
  lessonChunks,
  lessons,
  courses,
  users,
  chatUsage,
} from "@/lib/db/schema";
import { cosineDistance, sql, gt, desc, and, eq } from "drizzle-orm/sql";
import { getEmbedding } from "@/lib/embeddings";
import { auth } from "@/auth";
import { count, gte } from "drizzle-orm";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const MIN_SIMILARITY = 0.6;
const MAX_QUESTION_LENGTH = 300;
const USER_LIMIT_PER_HOUR = 10;
const GLOBAL_LIMIT_PER_DAY = 50;

function buildLessonPrompt(context: string): string {
  return `ты - дружелюбный ассистент образовательной платформы PolitaevJS. Объясняешь материал простым языком, как хороший преподаватель
СТРОГИЕ ПРАВИЛА:
1. отвечай ИСКЛЮЧИТЕЛЬНО используя факты из контекста ниже. всё, чего в контексте нет, для тебя не существует, даже если ты это знаешь
2. сначала проверь: есть ли в контексте объяснение именно того, о чём спрашивают? Ответ есть, если то самое понятие названо в контексте и описано словами или показано в примере кода, пусть даже коротко. Ответа нет, если в контексте только соседнее понятие: например, спросили про функцию map, а в контексте описан только filter
3. если ответ в контексте есть - дай понятный ответ в 2-4 предложениях: объясни своими словами и приведи пример из контекста, если он там есть
4. если ответа нет - не пытайся угадать, не используй общие знания и не давай советов. ТОЛЬКО В ЭТОМ СЛУЧАЕ ответь одной этой фразой и больше ничего не добавляй: "К сожалению, в материалах этого курса нет прямого ответа на ваш вопрос."
5. никогда не переключайся на китайский, английский или другой язык.

Контекст из уроков:
${context}

Напоминание: сначала найди в контексте выше то, о чём спросили. Если нашёл, отвечай по нему. Фразу-отказ используй, только если этого в контексте нет совсем`;
}

function buildCoursePrompt(courseInfo: string): string {
  return `Ты - дружелюбный ассистент образовательной платформы PolitaevJS. Ты помогаешь человеку понять, о чём этот курс и подойдёт ли он ему
ПРАВИЛА:
1. используй ТОЛЬКО информацию о курсе ниже. Ничего не выдумывай: не называй уроки, темы, сроки или уровень сложности, которых там нет
2. если в информации нет того, о чём спросили, так и скажи одной фразой и предложи спросить о темах курса
3. отвечай коротко, 2-4 предложения, простым языком
4. никогда не переключайся на китайский, английский или другой язык

Информация о курсе:
${courseInfo}`;
}

async function* streamOllama(question: string, systemPrompt: string) {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    body: JSON.stringify({
      model: "qwen2.5:14b",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      stream: true,
      options: {
        temperature: 0.2,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama chat error: ${res.status} ${await res.text()}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.trim()) continue;
      const json = JSON.parse(line);
      if (json.message?.content) yield json.message.content;
    }
  }
}

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const model = process.env.GROQ_MODEL || "qwen/qwen3.8-27b";
async function fetchGroq(body: string): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body,
    });
    if (res.status === 503 && attempt < 2) {
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
      continue;
    }
    return res;
  }
}

async function* streamGroq(question: string, systemPrompt: string) {
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
  const res = await fetchGroq(
    JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      stream: true,
      temperature: 0.2,
      max_tokens: model.startsWith('openai/gpt-oss') ? 1000 : 400,
    ...(model.startsWith('qwen/') ? { reasoning_effort: 'none' } : {}),
    ...(model.startsWith('openai/gpt-oss') ? { reasoning_effort: 'low', include_reasoning: false } : {}),
    }),
  );

  if (!res.ok) {
    throw new Error(`Groq chat error: ${res.status} ${await res.text()}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") return;
      const token = JSON.parse(data).choices?.[0]?.delta?.content;
      if (token) yield token;
    }
  }
}

// переключатель: смотрит в .env.local
function streamChatAnswer(question: string, systemPrompt: string) {
  return process.env.LLM_PROVIDER === "groq"
    ? streamGroq(question, systemPrompt)
    : streamOllama(question, systemPrompt);
}

const termMap: Record<string, string> = {
  джаваскрипт: "javascript",
  джс: "js",
  реакт: "react",
  нод: "node",
  ноджс: "node.js",
  экспресс: "express",
  докер: "docker",
  постгрес: "postgresql",
  постгре: "postgresql",
  типскрипт: "typescript",
  тайпскрипт: "typescript",
};

// сделал сортировку по убыванию длины ключа для слов выше
function normalizeQuestion(question: string): string {
  let result = question.toLowerCase();

  const sortedEntries = Object.entries(termMap).sort(
    ([a], [b]) => b.length - a.length,
  );

  for (const [ru, en] of sortedEntries) {
    result = result.replaceAll(ru, en);
  }
  return result;
}

const greetings = [
  "привет",
  "здравствуй",
  "здравствуйте",
  "хай",
  "йо",
  "добрый день",
  "добрый вечер",
  "как дела",
];
const sortedGreetings = [...greetings].sort((a, b) => b.length - a.length);

function isPureGreeting(question: string): boolean {
  let cleaned = question.toLowerCase().trim();
  for (const g of sortedGreetings) {
    cleaned = cleaned.replaceAll(g, "");
  }
  // убираем знаки препинания и пробелы, что осталось
  cleaned = cleaned.replace(/[,.!?\s]/g, "");
  // если после удаления приветствий почти ничего не осталось - это чистое приветствие
  return cleaned.length === 0;
}

const courseForms = [
  "курс",
  "курса",
  "курсе",
  "курсу",
  "курсом",
  "курсы",
  "курсов",
  "курсам",
  "курсах",
];
const courseWords = [
  "подойд",
  "подходит",
  "новичк",
  "с чего начать",
  "для кого",
  "чему научу",
  "чему научит",
  "что я узнаю",
];

function isAboutCourse(question: string): boolean {
  const q = question.toLowerCase();
  const words = q.split(/[^а-яёa-z]+/);

  for (const form of courseForms) {
    if (words.includes(form)) return true;
  }
  for (const w of courseWords) {
    if (q.includes(w)) return true;
  }
  return false;
}

function streamResponse(question: string, systemPrompt: string): Response {
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const token of streamChatAnswer(question, systemPrompt)) {
          controller.enqueue(encoder.encode(token));
        }
      } catch (e) {
        console.error(e);
        const msg =
          String(e).includes(" 429 ") || String(e).includes(" 503 ")
            ? "Ассистент сейчас перегружен, попробуйте через минуту."
            : "Ассистент сейчас недоступен, попробуйте позже.";
        controller.enqueue(encoder.encode(msg));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

function textResponse(text: string, status: number): Response {
  return new Response(text, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function POST(req: NextRequest) {
  const { question, courseId } = await req.json();
  if (
    typeof question !== "string" ||
    question.trim().length === 0 ||
    question.length > MAX_QUESTION_LENGTH
  ) {
    return textResponse(
      `Вопрос должен быть от 1 до ${MAX_QUESTION_LENGTH} символов`,
      400,
    );
  }

  if (isPureGreeting(question)) {
    return new Response(
      "Привет! Я помогу разобраться с материалами этого курса. Спрашивай что угодно по темам уроков",
      {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      },
    );
  }

  const { db } = await import("@/lib/db");
  if (process.env.LIMITS_ENABLED === "true") {
    const session = await auth();
    const email = session?.user?.email;
    if (!email) {
      return textResponse(
        "Войдите в аккаунт, чтобы пользоваться ассистентом",
        401,
      );
    }

    const [dbUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email));
    if (!dbUser) {
      return textResponse(
        "Войдите в аккаунт, чтобы пользоваться ассистентом",
        401,
      );
    }

    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [userStat] = await db
      .select({ n: count() })
      .from(chatUsage)
      .where(
        and(eq(chatUsage.userId, dbUser.id), gte(chatUsage.createdAt, hourAgo)),
      );
    if (userStat.n >= USER_LIMIT_PER_HOUR) {
      return textResponse(
        "Вы задали слишком много вопросов за час. Попробуйте чуть позже",
        429,
      );
    }

    const [globalStat] = await db
      .select({ n: count() })
      .from(chatUsage)
      .where(gte(chatUsage.createdAt, dayAgo));
    if (globalStat.n >= GLOBAL_LIMIT_PER_DAY) {
      return textResponse(
        "На сегодня лимит ассистента исчерпан. Загляните завтра",
        429,
      );
    }

    await db.insert(chatUsage).values({ userId: dbUser.id });
  }

  // вопрос про сам курс: отвечаем по названию, описанию и программе
  if (isAboutCourse(question)) {
    const courseRows = await db
      .select()
      .from(courses)
      .where(eq(courses.id, Number(courseId)));
    const course = courseRows[0];
    if (!course) {
      return new Response("Курс не найден", { status: 404 });
    }

    const lessonRows = await db
      .select({ title: lessons.title })
      .from(lessons)
      .where(eq(lessons.courseId, Number(courseId)))
      .orderBy(lessons.order);

    const program = lessonRows.map((l, i) => `${i + 1}. ${l.title}`).join("\n");
    const courseInfo = `Название: ${course.title}\nОписание: ${course.description}\nПрограмма:\n${program}`;

    return streamResponse(question, buildCoursePrompt(courseInfo));
  }

  // вопрос по содержанию уроков: ищем подходящие куски
  const normalizedQuestion = normalizeQuestion(question);
  const questionEmbedding = await getEmbedding(normalizedQuestion, "query");

  const similarity = sql<number>`1 - (${cosineDistance(lessonChunks.embedding, questionEmbedding)})`;

  const relevantChunks = await db
    .select({ content: lessonChunks.content, similarity })
    .from(lessonChunks)
    .innerJoin(lessons, eq(lessonChunks.lessonId, lessons.id))
    .where(
      and(
        gt(similarity, MIN_SIMILARITY),
        eq(lessons.courseId, Number(courseId)),
      ),
    )
    .orderBy((t) => desc(t.similarity))
    .limit(5);

  if (relevantChunks.length === 0) {
    return new Response(
      "К сожалению, в материалах этого курса нет прямого ответа на ваш вопрос.",
      {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      },
    );
  }

  const context = relevantChunks.map((c) => c.content).join("\n\n---\n\n");

  return streamResponse(question, buildLessonPrompt(context));
}
