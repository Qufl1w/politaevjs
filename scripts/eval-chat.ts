import { cases } from './eval-cases'

const URL = 'http://localhost:3000/api/chat'

// бот отказал, если в ответе одна из двух фраз-отказов
// (первая от модели, вторая от порога в route.ts)
function isRefusal(text: string): boolean {
  return text.includes('нет прямого ответа') || text.includes('нет информации')
}

async function main() {
  let correct = 0
  let wrongRefusals = 0 // ответ в уроках был, а бот отказал
  let wrongAnswers = 0  // ответа в уроках нет, а бот ответил
  let tails = 0

  for (const c of cases) {
    const res = await fetch(URL, {
      method: 'POST',
      body: JSON.stringify({ question: c.q, courseId: c.course }),
    })
    if (!res.ok) {
      throw new Error(`Сервер ответил ${res.status} на вопрос: ${c.q}`)
    }
    const text = await res.text()
    const refused = isRefusal(text)

       let verdict = 'OK'
    if (c.expect === 'refuse' && !refused) {
      verdict = 'ВЫДУМАЛ'
      wrongAnswers++
    } else if (c.expect === 'answer' && refused) {
      verdict = 'ЗРЯ ОТКАЗАЛ'
      wrongRefusals++
    } else if (c.expect === 'refuse' && text.length > 150) {
      verdict = 'ОТКАЗ С ХВОСТОМ'
      tails++
    } else {
      correct++
    }

    console.log(verdict, '|', c.q, '|', text.replace(/\s+/g, ' ').slice(0, 100))
  }

  console.log(`\nВерных: ${correct} из ${cases.length}`)
  console.log(`Зря отказал на нормальные вопросы: ${wrongRefusals}`)
  console.log(`Ответил, хотя в уроках ответа нет: ${wrongAnswers}`)
    console.log(`Отказал, но дописал лишнее: ${tails}`)
}

main()