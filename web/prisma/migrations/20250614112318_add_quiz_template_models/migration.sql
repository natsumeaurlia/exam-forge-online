-- CreateTable
CREATE TABLE "QuizTemplate" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "category" VARCHAR(100),
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "questions" JSONB NOT NULL,
    "settings" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "QuizTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateTag" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "TemplateTag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuizTemplate_teamId_idx" ON "QuizTemplate"("teamId");

-- CreateIndex
CREATE INDEX "QuizTemplate_createdById_idx" ON "QuizTemplate"("createdById");

-- CreateIndex
CREATE INDEX "QuizTemplate_isPublic_idx" ON "QuizTemplate"("isPublic");

-- CreateIndex
CREATE INDEX "QuizTemplate_category_idx" ON "QuizTemplate"("category");

-- CreateIndex
CREATE INDEX "QuizTemplate_teamId_category_idx" ON "QuizTemplate"("teamId", "category");

-- CreateIndex
CREATE INDEX "QuizTemplate_teamId_isPublic_idx" ON "QuizTemplate"("teamId", "isPublic");

-- CreateIndex
CREATE INDEX "TemplateTag_templateId_idx" ON "TemplateTag"("templateId");

-- CreateIndex
CREATE INDEX "TemplateTag_tagId_idx" ON "TemplateTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateTag_templateId_tagId_key" ON "TemplateTag"("templateId", "tagId");

-- AddForeignKey
ALTER TABLE "QuizTemplate" ADD CONSTRAINT "QuizTemplate_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizTemplate" ADD CONSTRAINT "QuizTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateTag" ADD CONSTRAINT "TemplateTag_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "QuizTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateTag" ADD CONSTRAINT "TemplateTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
