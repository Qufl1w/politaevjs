import { db } from '@/lib/db'
import { courses, lessons } from '@/lib/db/schema'

export async function getCoursesWithLessonCount() {
    const allCourses = await db.select().from(courses).orderBy(courses.id)
    const allLessons = await db.select({ courseId: lessons.courseId}).from(lessons)

    return allCourses.map((course) => ({
        ...course,
    lessonCount: allLessons.filter((l) => l.courseId === course.id).length,
  }))
}