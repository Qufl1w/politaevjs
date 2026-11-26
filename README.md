# PolitaevJS — образовательная платформа с RAG-чатботом

Учебный fullstack-проект платформы для продажи онлайн-курсов с AI-ассистентом, который отвечает на вопросы студентов строго по материалам курса, используя Retrieval-Augmented Generation (RAG).

**Демо:** https://politaevjs.vercel.app/  
регистрация без подтверждения почты, занимает около 30 секунд

## Стек технологий

- **Framework:** Next.js 16 (App Router, Server Components)
- **Language:** TypeScript
- **Database:** PostgreSQL + pgvector (векторный поиск)
- **ORM:** Drizzle ORM
- **Authentication:** Auth.js (NextAuth v5, Credentials Provider)
- **AI/LLM:** RAG-пайплайн с косинусным сходством. эмбеддинги: Gemini API (`gemini-embedding-001`, 768). ответы: локальная Ollama или Groq (`openai/gpt-oss-120b`), переключается переменной `LLM_PROVIDER`
- **Styling:** инлайн-стили (CSS-in-JS)
- **Environment:** Docker Compose (локальное развертывание БД)
- **Hosting:** Vercel (приложение) + Neon (облачный PostgreSQL с pgvector)

## Как работает чат-ассистент

1. вопрос студента превращается в вектор (эмбеддинг) через Gemini API
2. по косинусному сходству находятся релевантные фрагменты материалов курса. если ни один не набрал порог 0.6, бот сразу отвечает отказом, не обращаясь к модели
3. найденный контекст передаётся LLM (Ollama или Groq), которая отвечает **строго** на основе материалов курса, без использования общих знаний
4. ответ стримится в интерфейс по мере генерации

защита лимитов (включается `LIMITS_ENABLED=true`): чат доступен только залогиненным, лимит вопросов в час на пользователя, общий дневной лимит, вопрос не длиннее 300 символов. счетчик хранится в таблице `chat_usage`.

## Архитектура проекта

- `/app` - маршрутизация, страницы и API-эндпоинты (Next.js App Router)
- `/components` - переиспользуемые UI-компоненты
- `/lib` - утилиты, конфигурация базы данных, вызовы Gemini API для эмбеддингов
- `/scripts` - скрипты для наполнения базы, эмбеддингов и проверки качества (eval)

## Качество ответов

тест: `npm run eval:chat` - 32 вопроса по трём курсам через `/api/chat`: 17 с ответом (по урокам или по описанию курса) и 15 без ответа в уроках, в том числе «соседних» по теме

результат на Groq (`openai/gpt-oss-120b`, `LIMITS_ENABLED=false`): 31 из 32. Вопросы без ответа: отказ в 15 из 15, включая «соседние». Вопросы с ответом: бот отвечает на 16 из 17

известное ограничение: на вопрос «Как работает цикл while?» бот отвечает нестабильно. при ручной проверке из 6 попыток ответил 1 раз, хотя нужный фрагмент урока находится (сходство 0.73): модель считает объяснение слишком коротким и отказывает. правки промпта и температуры это не исправили

для сравнения, на локальной Ollama (`qwen2.5:14b`) с прежним промптом: 17 из 17 и 14 из 15 (единственный промах: достраивал `app.post` по аналогии с `app.get`). с текущим промптом на Ollama замер не повторялся. результаты слегка плавают между запусками

## Деплой

приложение развёрнуто на Vercel, база на Neon. в настройках Vercel заданы те же переменные, что в `.env.local`, кроме `OLLAMA_URL` и `HTTPS_PROXY`; для продакшена `LLM_PROVIDER=groq` и `LIMITS_ENABLED=true`. в облачной базе нужно включить расширение `vector` и выполнить шаг 5 из инструкции ниже (таблицы, данные, `npm run embed`)

Не реализовано: запись на курсы (таблица `enrollments` пока не используется, в кабинете отображаются все курсы)

## Локальное развертывание

### 1. Клонирование репозитория

```bash
git clone https://github.com/Qufl1w/politaevjs.git
cd politaevjs
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Настройка переменных окружения

Создайте в корне два файла.

`.env` (для docker-compose, значения можно придумать свои):

```env
POSTGRES_USER=admin
POSTGRES_PASSWORD=change_me
POSTGRES_DB=politaevjs
```

`.env.local` (для приложения):

```env
DATABASE_URL=postgresql://admin:change_me@localhost:5432/politaevjs
AUTH_SECRET=случайная-строка
GEMINI_API_KEY=ключ из aistudio.google.com
LLM_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
LIMITS_ENABLED=false
```

Чтобы отвечать через Groq вместо Ollama: `LLM_PROVIDER=groq`, `GROQ_API_KEY=ваш_ключ`, `GROQ_MODEL=openai/gpt-oss-120b`. Для продакшена включите `LIMITS_ENABLED=true`. `HTTPS_PROXY` необязателен: если задан, запросы к внешним API идут через него.

### 4. Запуск базы данных

```bash
docker-compose up -d
```

### 5. Таблицы и данные

Нужны запущенная база данных и `GEMINI_API_KEY` в `.env.local` (он используется при запуске `npm run embed`).

- если указали в `.env` другие значения `POSTGRES_USER` и `POSTGRES_DB`, подставьте их в первую команду вместо `admin` и `politaevjs`
- команду `seed` запускайте только один раз, иначе курсы в базе продублируются

```bash
docker exec -it politaevjs_db psql -U admin -d politaevjs -c "CREATE EXTENSION IF NOT EXISTS vector;"
npx drizzle-kit push
npx tsx lib/db/seed.ts
npm run fill-content
npm run embed
```

### 6. Запуск сервера для разработки

```bash
npm run dev
```

Приложение будет доступно по адресу `http://localhost:3000`

### Требования
Для режима `LLM_PROVIDER=ollama` установите [Ollama](https://ollama.com) и скачайте модель:

```bash
ollama pull qwen2.5:14b
```

Модель `nomic-embed-text` больше не нужна: эмбеддинги считает Gemini API.
