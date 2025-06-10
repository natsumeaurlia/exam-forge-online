# Knowledge Base Database Schema

## Overview

This document defines the complete database schema for the Knowledge Base system, including all tables, relationships, and indexes required for AI-powered question generation.

## Schema Additions for schema.prisma

Add the following models to your existing `schema.prisma` file:

```prisma
// ==========================================
// Knowledge Base Models
// ==========================================

model KnowledgeDomain {
  id              String            @id @default(cuid())
  name            String
  description     String?
  parentId        String?
  parent          KnowledgeDomain?  @relation("SubDomains", fields: [parentId], references: [id])
  subDomains      KnowledgeDomain[] @relation("SubDomains")
  
  // Relations
  teamId          String
  team            Team              @relation(fields: [teamId], references: [id], onDelete: Cascade)
  entries         KnowledgeEntry[]
  templates       QuestionTemplate[]
  
  // Timestamps
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  @@index([teamId])
  @@index([parentId])
}

model KnowledgeEntry {
  id              String            @id @default(cuid())
  title           String
  content         String            @db.Text
  contentType     ContentType       @default(TEXT)
  summary         String?           @db.Text
  
  // Domain relationship
  domainId        String
  domain          KnowledgeDomain   @relation(fields: [domainId], references: [id], onDelete: Cascade)
  
  // Metadata and search
  metadata        Json?             @db.Json
  tags            String[]
  keywords        String[]
  
  // Embedding for semantic search (optional - requires pgvector extension)
  // embedding     Float[]          @db.Vector(1536) // For OpenAI embeddings
  
  // Ownership
  teamId          String
  team            Team              @relation(fields: [teamId], references: [id], onDelete: Cascade)
  createdById     String
  createdBy       User              @relation(fields: [createdById], references: [id])
  
  // Version control
  version         Int               @default(1)
  status          KnowledgeStatus   @default(DRAFT)
  publishedAt     DateTime?
  
  // Relations
  sources         KnowledgeSource[]
  usedInQuestions GeneratedQuestionKnowledge[]
  
  // Timestamps
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  @@index([teamId])
  @@index([domainId])
  @@index([status])
  @@index([createdById])
  @@fulltext([title, content])
}

model KnowledgeSource {
  id              String            @id @default(cuid())
  name            String
  type            SourceType
  url             String?
  fileKey         String?           // S3/MinIO key for uploaded files
  fileName        String?
  fileSize        Int?              // In bytes
  mimeType        String?
  
  // Parent entry
  entryId         String
  entry           KnowledgeEntry    @relation(fields: [entryId], references: [id], onDelete: Cascade)
  
  // Metadata
  metadata        Json?             @db.Json
  
  // Timestamps
  createdAt       DateTime          @default(now())
  
  @@index([entryId])
}

model QuestionTemplate {
  id              String            @id @default(cuid())
  name            String
  description     String?
  
  // Question configuration
  questionType    QuestionType
  prompt          String            @db.Text // The prompt template
  systemPrompt    String?           @db.Text // System instructions for AI
  
  // Domain specificity (optional)
  domainId        String?
  domain          KnowledgeDomain?  @relation(fields: [domainId], references: [id], onDelete: SetNull)
  
  // Configuration
  difficulty      DifficultyLevel
  maxTokens       Int               @default(500)
  temperature     Float             @default(0.7)
  
  // Settings
  isActive        Boolean           @default(true)
  requiresReview  Boolean           @default(true)
  
  // Ownership
  teamId          String
  team            Team              @relation(fields: [teamId], references: [id], onDelete: Cascade)
  
  // Usage tracking
  usageCount      Int               @default(0)
  successRate     Float?            // Percentage of approved questions
  
  // Relations
  generatedQuestions GeneratedQuestion[]
  
  // Timestamps
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  @@index([teamId])
  @@index([domainId])
  @@index([isActive])
}

model GeneratedQuestion {
  id              String            @id @default(cuid())
  
  // Link to actual question
  questionId      String            @unique
  question        Question          @relation(fields: [questionId], references: [id], onDelete: Cascade)
  
  // Generation details
  templateId      String
  template        QuestionTemplate  @relation(fields: [templateId], references: [id])
  prompt          String            @db.Text // Actual prompt used
  response        String            @db.Text // Full AI response
  
  // AI details
  model           String            // e.g., "gpt-4", "claude-3"
  modelVersion    String?
  confidence      Float?            // AI confidence score (0-1)
  tokensUsed      Int?
  
  // Knowledge sources
  knowledgeSources GeneratedQuestionKnowledge[]
  
  // Review workflow
  status          GenerationStatus  @default(PENDING_REVIEW)
  reviewedById    String?
  reviewedBy      User?             @relation(fields: [reviewedById], references: [id])
  reviewedAt      DateTime?
  reviewNotes     String?           @db.Text
  
  // Quality metrics
  editCount       Int               @default(0) // Number of edits made
  originalText    String?           @db.Text // Store original if edited
  
  // Timestamps
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  @@index([templateId])
  @@index([status])
  @@index([reviewedById])
  @@index([createdAt])
}

// Junction table for many-to-many relationship
model GeneratedQuestionKnowledge {
  id              String            @id @default(cuid())
  
  generatedQuestionId String
  generatedQuestion   GeneratedQuestion @relation(fields: [generatedQuestionId], references: [id], onDelete: Cascade)
  
  knowledgeEntryId    String
  knowledgeEntry      KnowledgeEntry    @relation(fields: [knowledgeEntryId], references: [id], onDelete: Cascade)
  
  relevanceScore  Float?            // How relevant this knowledge was (0-1)
  
  @@unique([generatedQuestionId, knowledgeEntryId])
  @@index([generatedQuestionId])
  @@index([knowledgeEntryId])
}

// ==========================================
// Enums
// ==========================================

enum ContentType {
  TEXT
  MARKDOWN
  HTML
  PDF
  IMAGE
  VIDEO
  FORMULA
  DIAGRAM
  CODE
}

enum SourceType {
  UPLOAD
  WEB_SCRAPE
  MANUAL_ENTRY
  API_IMPORT
  YOUTUBE
  WIKIPEDIA
}

enum KnowledgeStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
  PROCESSING
  ERROR
}

enum DifficultyLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  EXPERT
}

enum GenerationStatus {
  PENDING_REVIEW
  APPROVED
  REJECTED
  EDITED
  AUTO_APPROVED
}
```

## Migration Steps

1. **Add the schema to your `schema.prisma` file**
2. **Generate migration**:
   ```bash
   cd web
   pnpm db:migrate
   ```

3. **Update Prisma client**:
   ```bash
   pnpm db:generate
   ```

## Indexes and Performance

### Recommended Additional Indexes

```sql
-- For fast knowledge search
CREATE INDEX idx_knowledge_entry_search ON "KnowledgeEntry" USING GIN (to_tsvector('english', title || ' ' || content));

-- For tag-based filtering
CREATE INDEX idx_knowledge_entry_tags ON "KnowledgeEntry" USING GIN (tags);

-- For keyword search
CREATE INDEX idx_knowledge_entry_keywords ON "KnowledgeEntry" USING GIN (keywords);

-- For performance tracking
CREATE INDEX idx_generated_question_created ON "GeneratedQuestion" (created_at DESC);
CREATE INDEX idx_generated_question_template_status ON "GeneratedQuestion" (template_id, status);
```

### Optional: Vector Search with pgvector

If you want to enable semantic search:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column
ALTER TABLE "KnowledgeEntry" ADD COLUMN embedding vector(1536);

-- Create index for similarity search
CREATE INDEX idx_knowledge_entry_embedding ON "KnowledgeEntry" 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

## Sample Data Structure

### Knowledge Domain Hierarchy Example
```
Mathematics
├── Algebra
│   ├── Linear Equations
│   ├── Quadratic Equations
│   └── Polynomials
├── Geometry
│   ├── Triangles
│   ├── Circles
│   └── 3D Shapes
└── Calculus
    ├── Derivatives
    ├── Integrals
    └── Limits
```

### Knowledge Entry Example
```json
{
  "title": "Pythagorean Theorem",
  "content": "In a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides: a² + b² = c²",
  "contentType": "TEXT",
  "metadata": {
    "grade_level": "8-10",
    "difficulty": "intermediate",
    "prerequisites": ["basic algebra", "square roots"],
    "related_concepts": ["trigonometry", "distance formula"]
  },
  "tags": ["geometry", "triangles", "theorem"],
  "keywords": ["pythagorean", "hypotenuse", "right triangle"]
}
```

### Question Template Example
```json
{
  "name": "Multiple Choice from Definition",
  "questionType": "MULTIPLE_CHOICE",
  "prompt": "Based on the following content: {{content}}\n\nGenerate a multiple choice question that tests understanding of the key concept. Include 4 options where only one is correct. Make the distractors plausible but clearly incorrect.",
  "systemPrompt": "You are an expert educator creating assessment questions. Ensure questions are clear, unambiguous, and test conceptual understanding rather than memorization.",
  "difficulty": "INTERMEDIATE",
  "maxTokens": 500,
  "temperature": 0.7
}
```

## Data Retention and Cleanup

### Archival Strategy
- Archive `GeneratedQuestion` records older than 6 months
- Keep aggregated statistics for templates
- Soft delete for `KnowledgeEntry` to maintain question integrity

### Cleanup Queries
```sql
-- Archive old generated questions
UPDATE "GeneratedQuestion" 
SET status = 'ARCHIVED' 
WHERE created_at < NOW() - INTERVAL '6 months' 
AND status IN ('REJECTED', 'PENDING_REVIEW');

-- Clean up orphaned knowledge sources
DELETE FROM "KnowledgeSource" 
WHERE entry_id NOT IN (SELECT id FROM "KnowledgeEntry");
```