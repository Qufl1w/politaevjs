# PolitaevJS — образовательная платформа с RAG-чатботом

Учебный fullstack-проект платформы для продажи онлайн-курсов с AI-ассистентом, который отвечает на вопросы студентов строго по материалам курса, используя Retrieval-Augmented Generation (RAG).

## Стек технологий

- **Framework:** Next.js 16 (App Router, Server Components)
- **Language:** TypeScript
- **Database:** PostgreSQL + pgvector (векторный поиск)
- **ORM:** Drizzle ORM
- **Authentication:** Auth.js (NextAuth v5, Credentials Provider)
- **AI/LLM:** Ollama (локальная генерация эмбеддингов + ответов), RAG-пайплайн с косинусным сходством
- **Styling:** инлайн-стили (CSS-in-JS)
- **Environment:** Docker Compose (локальное развертывание БД)

## Как работает чат-ассистент

1. Вопрос студента превращается в вектор (эмбеддинг)
2. По косинусному сходству находятся релевантные фрагменты материалов курса
3. Найденный контекст передаётся LLM, которая отвечает **строго** на основе материалов курса, без использования общих знаний
4. Ответ стримится в интерфейс по мере генерации

## Архитектура проекта

- `/app` - маршрутизация, страницы и API-эндпоинты (Next.js App Router)
- `/components` - переиспользуемые UI-компоненты
- `/lib` - утилиты, конфигурация базы данных и Ollama
- `/scripts` - скрипты для наполнения базы, эмбеддингов и проверки качества (eval)"

## Качество ответов

## Качество ответов

тест: `npm run eval:chat` - 32 вопроса по трём курсам через `/api/chat`:
17 с ответом (по урокам или по описанию курса) и 15 без ответа в уроках,
в том числе «соседних» по теме

- вопросы с ответом: бот отвечает на 17 из 17
- вопросы без ответа в уроках: бот отказывает в 14 из 15

известное ограничение: если в уроке есть похожий пример (например, `app.get`),
бот может достроить ответ по аналогии (`app.post`), хотя в материалах этого нет,
результаты слегка плавают между запусками

## Локальное развертывание

### 1. Клонирование репозитория
\`\`\`bash
git clone https://github.com/Qufl1w/politaevjs.git
cd politaevjs
\`\`\`

### 2. Установка зависимостей
\`\`\`bash
npm install
\`\`\`

### 3. Настройка переменных окружения
Создайте в корне два файла.

`.env` (docker-compose, значения можно придумать свои):
POSTGRES_USER=admin
POSTGRES_PASSWORD=change_me
POSTGRES_DB=politaevjs

`.env.local` (приложение, логин, пароль и имя базы должны совпадать с `.env`):
DATABASE_URL=postgresql://admin:change_me@localhost:5432/politaevjs
AUTH_SECRET=случайная-строка
OLLAMA_URL=http://localhost:11434

### 4. Запуск базы данных
\`\`\`bash
docker-compose up -d
\`\`\`

### 5. Таблицы и данные
Нужны запущенные база и Ollama. Подставьте POSTGRES_USER и POSTGRES_DB из вашего .env:
если указали в .env другие значения, подставьте свои
`seed` запускайте один раз, иначе курсы продублируются

docker exec -it politaevjs_db psql -U admin -d politaevjs -c "CREATE EXTENSION IF NOT EXISTS vector;"
npx drizzle-kit push
npx tsx lib/db/seed.ts
npm run fill-content
npm run embed

### 6. Запуск сервера для разработки
\`\`\`bash
npm run dev
\`\`\`
Приложение будет доступно по адресу `http://localhost:3000`

### Требования
Установите [Ollama] (https://ollama.com) и скачайте модели:
ollama pull qwen2.5:14b
ollama pull nomic-embed-text
