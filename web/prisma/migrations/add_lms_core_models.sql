-- Migration: Add LMS Core Models
-- This migration adds the core models needed for LMS mode functionality

-- LMS Sites table for multi-tenant LMS instances
CREATE TABLE "lms_sites" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "custom_domain" TEXT,
    "subdomain" TEXT,
    "logo_url" TEXT,
    "theme_config" JSONB DEFAULT '{}',
    "settings" JSONB DEFAULT '{}',
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lms_sites_pkey" PRIMARY KEY ("id")
);

-- LMS Courses table for course management
CREATE TABLE "lms_courses" (
    "id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "content" JSONB DEFAULT '{}',
    "price" INTEGER DEFAULT 0,
    "currency" TEXT DEFAULT 'JPY',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "estimated_duration" INTEGER, -- in minutes
    "instructor_id" TEXT,
    "category_id" TEXT,
    "tags" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lms_courses_pkey" PRIMARY KEY ("id")
);

-- LMS Lessons table for course content
CREATE TABLE "lms_lessons" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" JSONB DEFAULT '{}', -- Craft.js content
    "video_url" TEXT,
    "duration" INTEGER, -- in minutes
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_preview" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lms_lessons_pkey" PRIMARY KEY ("id")
);

-- LMS Users table for site-specific users
CREATE TABLE "lms_users" (
    "id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "user_id" TEXT, -- Reference to main users table (optional for guest users)
    "email" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "avatar_url" TEXT,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lms_users_pkey" PRIMARY KEY ("id")
);

-- Course Enrollments table
CREATE TABLE "course_enrollments" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "lms_user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ENROLLED',
    "progress" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "last_accessed_lesson_id" TEXT,
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "certificate_issued_at" TIMESTAMP(3),
    "metadata" JSONB DEFAULT '{}',

    CONSTRAINT "course_enrollments_pkey" PRIMARY KEY ("id")
);

-- Lesson Progress table
CREATE TABLE "lesson_progress" (
    "id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "progress" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "time_spent" INTEGER DEFAULT 0, -- in seconds
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id")
);

-- LMS Pages table for custom pages built with page builder
CREATE TABLE "lms_pages" (
    "id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" JSONB DEFAULT '{}', -- Craft.js content
    "meta_title" TEXT,
    "meta_description" TEXT,
    "is_homepage" BOOLEAN NOT NULL DEFAULT false,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "template" TEXT DEFAULT 'default',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lms_pages_pkey" PRIMARY KEY ("id")
);

-- Create indexes for performance
CREATE UNIQUE INDEX "lms_sites_team_id_slug_key" ON "lms_sites"("team_id", "slug");
CREATE UNIQUE INDEX "lms_sites_custom_domain_key" ON "lms_sites"("custom_domain");
CREATE UNIQUE INDEX "lms_sites_subdomain_key" ON "lms_sites"("subdomain");
CREATE INDEX "lms_sites_team_id_idx" ON "lms_sites"("team_id");

CREATE UNIQUE INDEX "lms_courses_site_id_slug_key" ON "lms_courses"("site_id", "slug");
CREATE INDEX "lms_courses_site_id_idx" ON "lms_courses"("site_id");
CREATE INDEX "lms_courses_status_idx" ON "lms_courses"("status");
CREATE INDEX "lms_courses_instructor_id_idx" ON "lms_courses"("instructor_id");

CREATE INDEX "lms_lessons_course_id_idx" ON "lms_lessons"("course_id");
CREATE INDEX "lms_lessons_order_idx" ON "lms_lessons"("course_id", "order");

CREATE UNIQUE INDEX "lms_users_site_id_email_key" ON "lms_users"("site_id", "email");
CREATE INDEX "lms_users_site_id_idx" ON "lms_users"("site_id");
CREATE INDEX "lms_users_user_id_idx" ON "lms_users"("user_id");

CREATE UNIQUE INDEX "course_enrollments_course_id_lms_user_id_key" ON "course_enrollments"("course_id", "lms_user_id");
CREATE INDEX "course_enrollments_course_id_idx" ON "course_enrollments"("course_id");
CREATE INDEX "course_enrollments_lms_user_id_idx" ON "course_enrollments"("lms_user_id");

CREATE UNIQUE INDEX "lesson_progress_enrollment_id_lesson_id_key" ON "lesson_progress"("enrollment_id", "lesson_id");
CREATE INDEX "lesson_progress_enrollment_id_idx" ON "lesson_progress"("enrollment_id");
CREATE INDEX "lesson_progress_lesson_id_idx" ON "lesson_progress"("lesson_id");

CREATE UNIQUE INDEX "lms_pages_site_id_slug_key" ON "lms_pages"("site_id", "slug");
CREATE INDEX "lms_pages_site_id_idx" ON "lms_pages"("site_id");
CREATE INDEX "lms_pages_is_published_idx" ON "lms_pages"("is_published");

-- Add foreign key constraints
ALTER TABLE "lms_sites" ADD CONSTRAINT "lms_sites_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lms_courses" ADD CONSTRAINT "lms_courses_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "lms_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lms_courses" ADD CONSTRAINT "lms_courses_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "lms_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "lms_courses" ADD CONSTRAINT "lms_courses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "lms_lessons" ADD CONSTRAINT "lms_lessons_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "lms_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lms_users" ADD CONSTRAINT "lms_users_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "lms_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lms_users" ADD CONSTRAINT "lms_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "lms_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_lms_user_id_fkey" FOREIGN KEY ("lms_user_id") REFERENCES "lms_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_last_accessed_lesson_id_fkey" FOREIGN KEY ("last_accessed_lesson_id") REFERENCES "lms_lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "course_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lms_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lms_pages" ADD CONSTRAINT "lms_pages_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "lms_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;