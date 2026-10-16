import dotenv from 'dotenv'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { courses, lessons } from './schema'

dotenv.config({path: 'env.local' })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const db = drizzle(pool)

async function seed() {
  console.log('Заполняем базу данных...')

  const insertedCourses = await db.insert(courses).values([
    { title: 'JavaScript основы', description: 'Переменные, функции, массивы, объекты и основы ES6+' },
    { title: 'Node.js и Express', description: 'Создание REST API, маршруты, middleware, работа с сервером' },
    { title: 'PostgreSQL и ORM', description: 'Базы данных, SQL запросы, Drizzle ORM, миграции' },
    { title: 'TypeScript', description: 'Типизация, интерфейсы, дженерики и работа с TS в проекте' },
    { title: 'React основы', description: 'Компоненты, хуки, состояние и работа с данными' },
    { title: 'Docker для разработчика', description: 'Контейнеры, docker-compose, деплой приложений' },
  ]).returning()

  await db.insert(lessons).values([
    { courseId: insertedCourses[0].id, title: 'Введение в JavaScript', content: 'Первый урок', order: 1 },
    { courseId: insertedCourses[0].id, title: 'Переменные и типы данных', content: 'Второй урок', order: 2 },
    { courseId: insertedCourses[0].id, title: 'Условия и циклы', content: 'Третий урок', order: 3 },
    { courseId: insertedCourses[1].id, title: 'Что такое Node.js', content: 'Первый урок', order: 1 },
    { courseId: insertedCourses[1].id, title: 'Первый Express сервер', content: 'Второй урок', order: 2 },
    { courseId: insertedCourses[2].id, title: 'Введение в PostgreSQL', content: 'Первый урок', order: 1 },
  ])

  console.log('Готово!')
  process.exit(0)
}

seed()