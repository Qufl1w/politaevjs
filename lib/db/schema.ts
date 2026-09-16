import { pgTable, serial, text, timestamp, integer, boolean, vector, index } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

export const courses = pgTable('courses', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const lessons = pgTable('lessons', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id').references(() => courses.id),
  title: text('title').notNull(),
  content: text('content'),
  order: integer('order').notNull(),
})

export const enrollments = pgTable('enrollments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  courseId: integer('course_id').references(() => courses.id),
  createdAt: timestamp('created_at').defaultNow(),
})



export const lessonChunks = pgTable('lesson_chunks', {
  id: serial('id').primaryKey(),
  lessonId: integer('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  embedding: vector('embedding', { dimensions: 768 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  index('embedding_hnsw_idx').using('hnsw', t.embedding.op('vector_cosine_ops')),
])
