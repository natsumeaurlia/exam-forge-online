-- Add missing fields to Quiz model
ALTER TABLE "Quiz" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Quiz" ADD COLUMN "collectParticipantInfo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Quiz" ADD COLUMN "instructions" TEXT;
ALTER TABLE "Quiz" ADD COLUMN "totalResponses" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Quiz" ADD COLUMN "averageScore" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "Quiz" ADD COLUMN "showAnswersAfterSubmit" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Quiz" ADD COLUMN "allowMultipleAttempts" BOOLEAN NOT NULL DEFAULT true;

-- Add participant info fields to QuizResponse
ALTER TABLE "QuizResponse" ADD COLUMN "participantName" VARCHAR(255);
ALTER TABLE "QuizResponse" ADD COLUMN "participantEmail" VARCHAR(255);
ALTER TABLE "QuizResponse" ADD COLUMN "timeTaken" INTEGER;

-- Add missing fields to Question model
ALTER TABLE "Question" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Add indexes for performance
CREATE INDEX "Quiz_isPublic_idx" ON "Quiz"("isPublic");
CREATE INDEX "QuizResponse_participantEmail_idx" ON "QuizResponse"("participantEmail");

-- Update existing published quizzes to be public
UPDATE "Quiz" SET "isPublic" = true WHERE "status" = 'PUBLISHED';