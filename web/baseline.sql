-- CreateEnum
CREATE TYPE "QuizStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ScoringType" AS ENUM ('AUTO', 'MANUAL');

-- CreateEnum
CREATE TYPE "SharingMode" AS ENUM ('URL', 'PASSWORD');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('TRUE_FALSE', 'MULTIPLE_CHOICE', 'CHECKBOX', 'SHORT_ANSWER', 'SORTING', 'FILL_IN_BLANK', 'DIAGRAM', 'MATCHING', 'NUMERIC');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('FREE', 'PRO', 'PREMIUM');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'INCOMPLETE', 'INCOMPLETE_EXPIRED', 'TRIALING', 'UNPAID');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('QUIZ', 'RESPONSE', 'STORAGE', 'MEMBER');

-- CreateEnum
CREATE TYPE "FeatureCategory" AS ENUM ('BASIC', 'PRO', 'PREMIUM');

-- CreateEnum
CREATE TYPE "FeatureType" AS ENUM ('TRUE_FALSE_QUESTION', 'SINGLE_CHOICE_QUESTION', 'MULTIPLE_CHOICE_QUESTION', 'FREE_TEXT_QUESTION', 'ADVANCED_QUESTION_TYPES', 'AUTO_GRADING', 'MANUAL_GRADING', 'PASSWORD_PROTECTION', 'PERMISSIONS_MANAGEMENT', 'AUDIT_LOG', 'SUBDOMAIN', 'CUSTOM_DESIGN', 'CUSTOM_DEVELOPMENT', 'MEDIA_UPLOAD', 'QUESTION_BANK', 'SECTIONS', 'ANALYTICS', 'EXCEL_EXPORT', 'CERTIFICATES', 'AI_QUIZ_GENERATION', 'TEAM_MANAGEMENT', 'PRIORITY_SUPPORT', 'SLA_GUARANTEE', 'ON_PREMISE');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO');

-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');

-- CreateEnum
CREATE TYPE "TeamInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "QuestionDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'EXPERT');

-- CreateEnum
CREATE TYPE "CertificateStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ENROLLED', 'IN_PROGRESS', 'COMPLETED', 'DROPPED');

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    "password" VARCHAR(255),
    "stripe_customer_id" TEXT,
    "stripe_payment_method_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "creator_id" TEXT NOT NULL,
    "lms_configuration" JSONB,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "role" "TeamRole" NOT NULL DEFAULT 'MEMBER',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "team_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_invitations" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "TeamInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "role" "TeamRole" NOT NULL DEFAULT 'MEMBER',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "team_id" TEXT NOT NULL,
    "invited_by_id" TEXT NOT NULL,

    CONSTRAINT "team_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_settings" (
    "id" TEXT NOT NULL,
    "max_members" INTEGER NOT NULL DEFAULT 5,
    "allow_member_invite" BOOLEAN NOT NULL DEFAULT false,
    "require_approval" BOOLEAN NOT NULL DEFAULT true,
    "default_quiz_visibility" "SharingMode" NOT NULL DEFAULT 'URL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "team_id" TEXT NOT NULL,

    CONSTRAINT "team_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quizzes" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "status" "QuizStatus" NOT NULL DEFAULT 'DRAFT',
    "scoring_type" "ScoringType" NOT NULL DEFAULT 'AUTO',
    "sharing_mode" "SharingMode" NOT NULL DEFAULT 'URL',
    "password" VARCHAR(100),
    "passing_score" SMALLINT NOT NULL DEFAULT 70,
    "cover_image" TEXT,
    "subdomain" VARCHAR(30),
    "time_limit" SMALLINT,
    "shuffle_questions" BOOLEAN NOT NULL DEFAULT false,
    "shuffle_options" BOOLEAN NOT NULL DEFAULT false,
    "max_attempts" SMALLINT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "team_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "ai_metadata" JSONB,
    "difficulty_level" "QuestionDifficulty",
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "collect_participant_info" BOOLEAN NOT NULL DEFAULT false,
    "instructions" TEXT,
    "total_responses" INTEGER NOT NULL DEFAULT 0,
    "average_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "show_answers_after_submit" BOOLEAN NOT NULL DEFAULT false,
    "allow_multiple_attempts" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "order" SMALLINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "quiz_id" TEXT NOT NULL,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "text" TEXT NOT NULL,
    "points" SMALLINT NOT NULL DEFAULT 1,
    "order" SMALLINT NOT NULL,
    "hint" TEXT,
    "explanation" TEXT,
    "correct_answer" JSONB,
    "grading_criteria" TEXT,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "difficulty_level" "QuestionDifficulty",
    "section_time_limit" SMALLINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "section_id" TEXT,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_options" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "order" SMALLINT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "question_id" TEXT NOT NULL,

    CONSTRAINT "question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "team_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_tags" (
    "id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "quiz_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_responses" (
    "id" TEXT NOT NULL,
    "score" SMALLINT,
    "total_points" SMALLINT NOT NULL,
    "is_passed" BOOLEAN,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "user_id" TEXT,
    "participant_name" VARCHAR(255),
    "participant_email" VARCHAR(255),
    "time_taken" INTEGER,

    CONSTRAINT "quiz_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_responses" (
    "id" TEXT NOT NULL,
    "answer" JSONB NOT NULL,
    "score" SMALLINT,
    "is_correct" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "quiz_response_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,

    CONSTRAINT "question_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "type" "PlanType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "monthly_price" INTEGER NOT NULL,
    "yearly_price" INTEGER NOT NULL,
    "stripe_monthly_product_id" TEXT,
    "stripe_yearly_product_id" TEXT,
    "max_quizzes" INTEGER,
    "max_members" INTEGER,
    "max_questions_per_quiz" INTEGER,
    "max_responses_per_month" INTEGER,
    "max_storage_mb" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "monthly_price_per_member" INTEGER NOT NULL DEFAULT 0,
    "yearly_price_per_member" INTEGER NOT NULL DEFAULT 0,
    "included_members" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "stripe_subscription_id" TEXT NOT NULL,
    "stripe_customer_id" TEXT NOT NULL,
    "stripe_price_id" TEXT NOT NULL,
    "stripe_product_id" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "billing_cycle" "BillingCycle" NOT NULL,
    "trial_start" TIMESTAMP(3),
    "trial_end" TIMESTAMP(3),
    "current_period_start" TIMESTAMP(3) NOT NULL,
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "canceled_at" TIMESTAMP(3),
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "plan_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "member_count" INTEGER NOT NULL DEFAULT 1,
    "price_per_member" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stripe_events" (
    "id" TEXT NOT NULL,
    "stripe_event_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processed_at" TIMESTAMP(3),
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stripe_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "stripe_invoice_id" TEXT NOT NULL,
    "stripe_customer_id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "tax" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "amount_paid" INTEGER NOT NULL DEFAULT 0,
    "amount_due" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'jpy',
    "due_date" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "invoice_pdf" TEXT,
    "hosted_invoice_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "team_id" TEXT NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_records" (
    "id" TEXT NOT NULL,
    "resource_type" "ResourceType" NOT NULL,
    "count" INTEGER NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "team_id" TEXT NOT NULL,

    CONSTRAINT "usage_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "features" (
    "id" TEXT NOT NULL,
    "type" "FeatureType" NOT NULL,
    "name" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "description" TEXT,
    "description_en" TEXT,
    "category" "FeatureCategory" NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_features" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "feature_id" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "limit" INTEGER,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_media" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "order" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "question_id" TEXT NOT NULL,

    CONSTRAINT "question_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_storage" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "used_bytes" BIGINT NOT NULL DEFAULT 0,
    "max_bytes" BIGINT NOT NULL DEFAULT 10737418240,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_storage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "team_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_questions" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "text" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 1,
    "hint" TEXT,
    "explanation" TEXT,
    "difficulty" "QuestionDifficulty" NOT NULL DEFAULT 'MEDIUM',
    "ai_generated" BOOLEAN NOT NULL DEFAULT false,
    "ai_metadata" JSONB,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_question_options" (
    "id" TEXT NOT NULL,
    "bank_question_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_question_media" (
    "id" TEXT NOT NULL,
    "bank_question_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_question_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_question_tags" (
    "id" TEXT NOT NULL,
    "bank_question_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_question_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_question_categories" (
    "id" TEXT NOT NULL,
    "bank_question_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_question_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_bank_questions" (
    "id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "bank_question_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_bank_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificate_templates" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "design" JSONB NOT NULL,
    "background_image" TEXT,
    "logo_image" TEXT,
    "signature_image" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificate_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "quiz_response_id" TEXT NOT NULL,
    "recipient_name" TEXT NOT NULL,
    "recipient_email" TEXT NOT NULL,
    "issue_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiry_date" TIMESTAMP(3),
    "validation_code" TEXT NOT NULL,
    "qr_code" TEXT,
    "pdf_url" TEXT,
    "status" "CertificateStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertificateVerification" (
    "id" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "CertificateVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_certificate_templates" (
    "id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "min_score_percent" INTEGER NOT NULL,
    "validity_days" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_certificate_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_templates" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "category" VARCHAR(100),
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "questions" JSONB NOT NULL,
    "settings" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "team_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,

    CONSTRAINT "quiz_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_tags" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "template_tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_stripe_customer_id_key" ON "users"("stripe_customer_id");

-- CreateIndex
CREATE INDEX "users_stripe_customer_id_idx" ON "users"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "teams_slug_key" ON "teams"("slug");

-- CreateIndex
CREATE INDEX "teams_creator_id_idx" ON "teams"("creator_id");

-- CreateIndex
CREATE INDEX "team_members_user_id_idx" ON "team_members"("user_id");

-- CreateIndex
CREATE INDEX "team_members_team_id_idx" ON "team_members"("team_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_team_id_user_id_key" ON "team_members"("team_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_invitations_token_key" ON "team_invitations"("token");

-- CreateIndex
CREATE INDEX "team_invitations_team_id_idx" ON "team_invitations"("team_id");

-- CreateIndex
CREATE INDEX "team_invitations_email_idx" ON "team_invitations"("email");

-- CreateIndex
CREATE INDEX "team_invitations_token_idx" ON "team_invitations"("token");

-- CreateIndex
CREATE INDEX "team_invitations_status_idx" ON "team_invitations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "team_settings_team_id_key" ON "team_settings"("team_id");

-- CreateIndex
CREATE UNIQUE INDEX "quizzes_subdomain_key" ON "quizzes"("subdomain");

-- CreateIndex
CREATE INDEX "quizzes_team_id_idx" ON "quizzes"("team_id");

-- CreateIndex
CREATE INDEX "quizzes_created_by_id_idx" ON "quizzes"("created_by_id");

-- CreateIndex
CREATE INDEX "quizzes_status_idx" ON "quizzes"("status");

-- CreateIndex
CREATE INDEX "quizzes_published_at_idx" ON "quizzes"("published_at");

-- CreateIndex
CREATE INDEX "quizzes_subdomain_idx" ON "quizzes"("subdomain");

-- CreateIndex
CREATE INDEX "quizzes_team_id_status_idx" ON "quizzes"("team_id", "status");

-- CreateIndex
CREATE INDEX "quizzes_is_public_idx" ON "quizzes"("is_public");

-- CreateIndex
CREATE INDEX "sections_quiz_id_idx" ON "sections"("quiz_id");

-- CreateIndex
CREATE INDEX "sections_quiz_id_order_idx" ON "sections"("quiz_id", "order");

-- CreateIndex
CREATE INDEX "questions_quiz_id_idx" ON "questions"("quiz_id");

-- CreateIndex
CREATE INDEX "questions_section_id_idx" ON "questions"("section_id");

-- CreateIndex
CREATE INDEX "questions_quiz_id_order_idx" ON "questions"("quiz_id", "order");

-- CreateIndex
CREATE INDEX "questions_type_idx" ON "questions"("type");

-- CreateIndex
CREATE INDEX "question_options_question_id_idx" ON "question_options"("question_id");

-- CreateIndex
CREATE INDEX "question_options_question_id_order_idx" ON "question_options"("question_id", "order");

-- CreateIndex
CREATE INDEX "tags_team_id_idx" ON "tags"("team_id");

-- CreateIndex
CREATE UNIQUE INDEX "tags_team_id_name_key" ON "tags"("team_id", "name");

-- CreateIndex
CREATE INDEX "quiz_tags_quiz_id_idx" ON "quiz_tags"("quiz_id");

-- CreateIndex
CREATE INDEX "quiz_tags_tag_id_idx" ON "quiz_tags"("tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_tags_quiz_id_tag_id_key" ON "quiz_tags"("quiz_id", "tag_id");

-- CreateIndex
CREATE INDEX "quiz_responses_quiz_id_idx" ON "quiz_responses"("quiz_id");

-- CreateIndex
CREATE INDEX "quiz_responses_user_id_idx" ON "quiz_responses"("user_id");

-- CreateIndex
CREATE INDEX "quiz_responses_completed_at_idx" ON "quiz_responses"("completed_at");

-- CreateIndex
CREATE INDEX "quiz_responses_quiz_id_completed_at_idx" ON "quiz_responses"("quiz_id", "completed_at");

-- CreateIndex
CREATE INDEX "quiz_responses_quiz_id_is_passed_idx" ON "quiz_responses"("quiz_id", "is_passed");

-- CreateIndex
CREATE INDEX "quiz_responses_participant_email_idx" ON "quiz_responses"("participant_email");

-- CreateIndex
CREATE INDEX "question_responses_quiz_response_id_idx" ON "question_responses"("quiz_response_id");

-- CreateIndex
CREATE INDEX "question_responses_question_id_idx" ON "question_responses"("question_id");

-- CreateIndex
CREATE INDEX "question_responses_is_correct_idx" ON "question_responses"("is_correct");

-- CreateIndex
CREATE UNIQUE INDEX "question_responses_quiz_response_id_question_id_key" ON "question_responses"("quiz_response_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "plans_type_key" ON "plans"("type");

-- CreateIndex
CREATE UNIQUE INDEX "plans_stripe_monthly_product_id_key" ON "plans"("stripe_monthly_product_id");

-- CreateIndex
CREATE UNIQUE INDEX "plans_stripe_yearly_product_id_key" ON "plans"("stripe_yearly_product_id");

-- CreateIndex
CREATE INDEX "plans_type_idx" ON "plans"("type");

-- CreateIndex
CREATE INDEX "plans_is_active_idx" ON "plans"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripe_subscription_id_key" ON "subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_team_id_key" ON "subscriptions"("team_id");

-- CreateIndex
CREATE INDEX "subscriptions_plan_id_idx" ON "subscriptions"("plan_id");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscriptions_stripe_subscription_id_idx" ON "subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "subscriptions_team_id_idx" ON "subscriptions"("team_id");

-- CreateIndex
CREATE UNIQUE INDEX "stripe_events_stripe_event_id_key" ON "stripe_events"("stripe_event_id");

-- CreateIndex
CREATE INDEX "stripe_events_stripe_event_id_idx" ON "stripe_events"("stripe_event_id");

-- CreateIndex
CREATE INDEX "stripe_events_type_idx" ON "stripe_events"("type");

-- CreateIndex
CREATE INDEX "stripe_events_processed_idx" ON "stripe_events"("processed");

-- CreateIndex
CREATE INDEX "stripe_events_created_at_idx" ON "stripe_events"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_stripe_invoice_id_key" ON "invoices"("stripe_invoice_id");

-- CreateIndex
CREATE INDEX "invoices_stripe_invoice_id_idx" ON "invoices"("stripe_invoice_id");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_created_at_idx" ON "invoices"("created_at");

-- CreateIndex
CREATE INDEX "invoices_team_id_idx" ON "invoices"("team_id");

-- CreateIndex
CREATE INDEX "usage_records_resource_type_idx" ON "usage_records"("resource_type");

-- CreateIndex
CREATE INDEX "usage_records_period_start_period_end_idx" ON "usage_records"("period_start", "period_end");

-- CreateIndex
CREATE INDEX "usage_records_team_id_idx" ON "usage_records"("team_id");

-- CreateIndex
CREATE INDEX "usage_records_team_id_resource_type_period_start_idx" ON "usage_records"("team_id", "resource_type", "period_start");

-- CreateIndex
CREATE UNIQUE INDEX "features_type_key" ON "features"("type");

-- CreateIndex
CREATE INDEX "features_category_idx" ON "features"("category");

-- CreateIndex
CREATE INDEX "features_is_active_idx" ON "features"("is_active");

-- CreateIndex
CREATE INDEX "plan_features_plan_id_idx" ON "plan_features"("plan_id");

-- CreateIndex
CREATE INDEX "plan_features_feature_id_idx" ON "plan_features"("feature_id");

-- CreateIndex
CREATE UNIQUE INDEX "plan_features_plan_id_feature_id_key" ON "plan_features"("plan_id", "feature_id");

-- CreateIndex
CREATE INDEX "question_media_question_id_idx" ON "question_media"("question_id");

-- CreateIndex
CREATE INDEX "question_media_question_id_order_idx" ON "question_media"("question_id", "order");

-- CreateIndex
CREATE UNIQUE INDEX "user_storage_user_id_key" ON "user_storage"("user_id");

-- CreateIndex
CREATE INDEX "user_storage_user_id_idx" ON "user_storage"("user_id");

-- CreateIndex
CREATE INDEX "categories_team_id_idx" ON "categories"("team_id");

-- CreateIndex
CREATE INDEX "categories_parent_id_idx" ON "categories"("parent_id");

-- CreateIndex
CREATE INDEX "bank_questions_team_id_idx" ON "bank_questions"("team_id");

-- CreateIndex
CREATE INDEX "bank_questions_type_idx" ON "bank_questions"("type");

-- CreateIndex
CREATE INDEX "bank_questions_difficulty_idx" ON "bank_questions"("difficulty");

-- CreateIndex
CREATE INDEX "bank_questions_created_by_id_idx" ON "bank_questions"("created_by_id");

-- CreateIndex
CREATE INDEX "bank_question_options_bank_question_id_idx" ON "bank_question_options"("bank_question_id");

-- CreateIndex
CREATE INDEX "bank_question_media_bank_question_id_idx" ON "bank_question_media"("bank_question_id");

-- CreateIndex
CREATE INDEX "bank_question_tags_bank_question_id_idx" ON "bank_question_tags"("bank_question_id");

-- CreateIndex
CREATE INDEX "bank_question_tags_tag_id_idx" ON "bank_question_tags"("tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "bank_question_tags_bank_question_id_tag_id_key" ON "bank_question_tags"("bank_question_id", "tag_id");

-- CreateIndex
CREATE INDEX "bank_question_categories_bank_question_id_idx" ON "bank_question_categories"("bank_question_id");

-- CreateIndex
CREATE INDEX "bank_question_categories_category_id_idx" ON "bank_question_categories"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "bank_question_categories_bank_question_id_category_id_key" ON "bank_question_categories"("bank_question_id", "category_id");

-- CreateIndex
CREATE INDEX "quiz_bank_questions_quiz_id_idx" ON "quiz_bank_questions"("quiz_id");

-- CreateIndex
CREATE INDEX "quiz_bank_questions_bank_question_id_idx" ON "quiz_bank_questions"("bank_question_id");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_bank_questions_question_id_key" ON "quiz_bank_questions"("question_id");

-- CreateIndex
CREATE INDEX "certificate_templates_team_id_idx" ON "certificate_templates"("team_id");

-- CreateIndex
CREATE INDEX "certificate_templates_created_by_id_idx" ON "certificate_templates"("created_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_validation_code_key" ON "certificates"("validation_code");

-- CreateIndex
CREATE INDEX "certificates_template_id_idx" ON "certificates"("template_id");

-- CreateIndex
CREATE INDEX "certificates_quiz_response_id_idx" ON "certificates"("quiz_response_id");

-- CreateIndex
CREATE INDEX "certificates_validation_code_idx" ON "certificates"("validation_code");

-- CreateIndex
CREATE INDEX "certificates_recipient_email_idx" ON "certificates"("recipient_email");

-- CreateIndex
CREATE INDEX "CertificateVerification_certificateId_idx" ON "CertificateVerification"("certificateId");

-- CreateIndex
CREATE INDEX "quiz_certificate_templates_quiz_id_idx" ON "quiz_certificate_templates"("quiz_id");

-- CreateIndex
CREATE INDEX "quiz_certificate_templates_template_id_idx" ON "quiz_certificate_templates"("template_id");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_certificate_templates_quiz_id_template_id_key" ON "quiz_certificate_templates"("quiz_id", "template_id");

-- CreateIndex
CREATE INDEX "quiz_templates_team_id_idx" ON "quiz_templates"("team_id");

-- CreateIndex
CREATE INDEX "quiz_templates_created_by_id_idx" ON "quiz_templates"("created_by_id");

-- CreateIndex
CREATE INDEX "quiz_templates_is_public_idx" ON "quiz_templates"("is_public");

-- CreateIndex
CREATE INDEX "quiz_templates_category_idx" ON "quiz_templates"("category");

-- CreateIndex
CREATE INDEX "quiz_templates_team_id_category_idx" ON "quiz_templates"("team_id", "category");

-- CreateIndex
CREATE INDEX "quiz_templates_team_id_is_public_idx" ON "quiz_templates"("team_id", "is_public");

-- CreateIndex
CREATE INDEX "template_tags_template_id_idx" ON "template_tags"("template_id");

-- CreateIndex
CREATE INDEX "template_tags_tag_id_idx" ON "template_tags"("tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "template_tags_template_id_tag_id_key" ON "template_tags"("template_id", "tag_id");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_settings" ADD CONSTRAINT "team_settings_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_tags" ADD CONSTRAINT "quiz_tags_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_tags" ADD CONSTRAINT "quiz_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_responses" ADD CONSTRAINT "quiz_responses_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_responses" ADD CONSTRAINT "quiz_responses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_responses" ADD CONSTRAINT "question_responses_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_responses" ADD CONSTRAINT "question_responses_quiz_response_id_fkey" FOREIGN KEY ("quiz_response_id") REFERENCES "quiz_responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_features" ADD CONSTRAINT "plan_features_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_features" ADD CONSTRAINT "plan_features_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_media" ADD CONSTRAINT "question_media_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_storage" ADD CONSTRAINT "user_storage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_questions" ADD CONSTRAINT "bank_questions_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_questions" ADD CONSTRAINT "bank_questions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_question_options" ADD CONSTRAINT "bank_question_options_bank_question_id_fkey" FOREIGN KEY ("bank_question_id") REFERENCES "bank_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_question_media" ADD CONSTRAINT "bank_question_media_bank_question_id_fkey" FOREIGN KEY ("bank_question_id") REFERENCES "bank_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_question_tags" ADD CONSTRAINT "bank_question_tags_bank_question_id_fkey" FOREIGN KEY ("bank_question_id") REFERENCES "bank_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_question_tags" ADD CONSTRAINT "bank_question_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_question_categories" ADD CONSTRAINT "bank_question_categories_bank_question_id_fkey" FOREIGN KEY ("bank_question_id") REFERENCES "bank_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_question_categories" ADD CONSTRAINT "bank_question_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_bank_questions" ADD CONSTRAINT "quiz_bank_questions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_bank_questions" ADD CONSTRAINT "quiz_bank_questions_bank_question_id_fkey" FOREIGN KEY ("bank_question_id") REFERENCES "bank_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_bank_questions" ADD CONSTRAINT "quiz_bank_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_templates" ADD CONSTRAINT "certificate_templates_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_templates" ADD CONSTRAINT "certificate_templates_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "certificate_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_quiz_response_id_fkey" FOREIGN KEY ("quiz_response_id") REFERENCES "quiz_responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateVerification" ADD CONSTRAINT "CertificateVerification_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "certificates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_certificate_templates" ADD CONSTRAINT "quiz_certificate_templates_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_certificate_templates" ADD CONSTRAINT "quiz_certificate_templates_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "certificate_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_templates" ADD CONSTRAINT "quiz_templates_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_templates" ADD CONSTRAINT "quiz_templates_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_tags" ADD CONSTRAINT "template_tags_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "quiz_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_tags" ADD CONSTRAINT "template_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

