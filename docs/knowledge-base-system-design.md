# Knowledge Base System Design

## Overview

The Knowledge Base system is designed to support AI-powered automatic question generation for ExamForge. It serves as a centralized repository of educational content that can be used to generate contextually relevant questions across various subjects and difficulty levels.

## System Architecture

### Core Components

1. **Knowledge Base Storage**
   - Structured content repository
   - Support for multiple content types (text, images, diagrams, formulas)
   - Version control for content updates
   - Metadata tagging for efficient retrieval

2. **Content Processing Pipeline**
   - Document ingestion (PDF, DOCX, TXT, MD)
   - Content parsing and structuring
   - Entity extraction and relationship mapping
   - Semantic indexing for AI retrieval

3. **AI Question Generation Engine**
   - Context-aware question generation
   - Multiple question type support
   - Difficulty level calibration
   - Answer validation system

4. **Quality Assurance System**
   - Generated question review workflow
   - Human-in-the-loop validation
   - Performance metrics tracking
   - Continuous improvement feedback loop

## Database Schema

### Knowledge Base Tables

```sql
-- Knowledge domains (subjects/topics)
KnowledgeDomain {
  id            String   @id @default(cuid())
  name          String
  description   String?
  parentId      String?
  parent        KnowledgeDomain? @relation("SubDomains", fields: [parentId], references: [id])
  subDomains    KnowledgeDomain[] @relation("SubDomains")
  teamId        String
  team          Team     @relation(fields: [teamId], references: [id])
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

-- Knowledge entries (actual content)
KnowledgeEntry {
  id            String   @id @default(cuid())
  title         String
  content       String   @db.Text
  contentType   ContentType
  domainId      String
  domain        KnowledgeDomain @relation(fields: [domainId], references: [id])
  metadata      Json?    // Additional structured data
  embedding     Vector?  // For semantic search (if using pgvector)
  teamId        String
  team          Team     @relation(fields: [teamId], references: [id])
  createdById   String
  createdBy     User     @relation(fields: [createdById], references: [id])
  version       Int      @default(1)
  status        KnowledgeStatus @default(DRAFT)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

-- Knowledge sources (where content came from)
KnowledgeSource {
  id            String   @id @default(cuid())
  name          String
  type          SourceType
  url           String?
  fileKey       String?  // For uploaded files
  entryId       String
  entry         KnowledgeEntry @relation(fields: [entryId], references: [id])
  createdAt     DateTime @default(now())
}

-- AI generation templates
QuestionTemplate {
  id            String   @id @default(cuid())
  name          String
  description   String?
  questionType  QuestionType
  prompt        String   @db.Text
  domainId      String?
  domain        KnowledgeDomain? @relation(fields: [domainId], references: [id])
  difficulty    DifficultyLevel
  isActive      Boolean  @default(true)
  teamId        String
  team          Team     @relation(fields: [teamId], references: [id])
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

-- AI generated questions tracking
GeneratedQuestion {
  id            String   @id @default(cuid())
  questionId    String   @unique
  question      Question @relation(fields: [questionId], references: [id])
  knowledgeIds  String[] // Array of KnowledgeEntry IDs used
  templateId    String
  template      QuestionTemplate @relation(fields: [templateId], references: [id])
  prompt        String   @db.Text
  model         String   // AI model used
  confidence    Float    // AI confidence score
  status        GenerationStatus @default(PENDING_REVIEW)
  reviewedById  String?
  reviewedBy    User?    @relation(fields: [reviewedById], references: [id])
  reviewedAt    DateTime?
  feedback      String?  @db.Text
  createdAt     DateTime @default(now())
}

-- Enums
enum ContentType {
  TEXT
  MARKDOWN
  HTML
  PDF
  IMAGE
  VIDEO
  FORMULA
  DIAGRAM
}

enum SourceType {
  UPLOAD
  WEB_SCRAPE
  MANUAL_ENTRY
  API_IMPORT
}

enum KnowledgeStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
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
}
```

## Data Flow

### Content Ingestion Flow

1. **Upload/Import**: User uploads documents or provides URLs
2. **Processing**: System extracts and structures content
3. **Enrichment**: Add metadata, tags, and relationships
4. **Storage**: Save to knowledge base with appropriate indexing
5. **Validation**: Review and approve content for use

### Question Generation Flow

1. **Context Selection**: User selects knowledge domain and parameters
2. **Content Retrieval**: System fetches relevant knowledge entries
3. **AI Generation**: Generate questions using templates and AI models
4. **Validation**: Check question quality and answer accuracy
5. **Review**: Human review for final approval
6. **Integration**: Add approved questions to quiz

## API Design

### Knowledge Base Endpoints

```typescript
// Knowledge management
POST   /api/knowledge/domains
GET    /api/knowledge/domains
PUT    /api/knowledge/domains/:id
DELETE /api/knowledge/domains/:id

// Content management
POST   /api/knowledge/entries
GET    /api/knowledge/entries
PUT    /api/knowledge/entries/:id
DELETE /api/knowledge/entries/:id
POST   /api/knowledge/entries/:id/upload

// Search and retrieval
POST   /api/knowledge/search
GET    /api/knowledge/entries/by-domain/:domainId
GET    /api/knowledge/entries/:id/related

// AI generation
POST   /api/ai/generate-questions
GET    /api/ai/templates
POST   /api/ai/templates
PUT    /api/ai/templates/:id

// Review workflow
GET    /api/ai/generated-questions
PUT    /api/ai/generated-questions/:id/review
POST   /api/ai/generated-questions/:id/approve
POST   /api/ai/generated-questions/:id/reject
```

## Security Considerations

### Access Control
- Team-based content isolation
- Role-based permissions for content management
- Separate permissions for AI generation features

### Data Protection
- Encryption for sensitive educational content
- Audit logging for all content modifications
- Version control for content changes

### AI Safety
- Content filtering for inappropriate material
- Bias detection in generated questions
- Quality thresholds for auto-approval

## Integration Points

### External Services
- **OpenAI API**: For GPT-based question generation
- **Claude API**: For advanced reasoning questions
- **Google Cloud Vision**: For image-based content analysis
- **AWS Textract**: For PDF content extraction

### Internal Systems
- **Quiz Management**: Direct integration for adding questions
- **Analytics**: Track question performance and difficulty
- **User Management**: Permission-based access control
- **Billing**: Feature gating based on subscription tier

## Performance Optimization

### Caching Strategy
- Redis for frequently accessed knowledge entries
- Edge caching for static content
- Embedding cache for semantic search

### Search Optimization
- Full-text search with PostgreSQL
- Vector similarity search for semantic queries
- Elasticsearch for complex queries (optional)

## Monitoring and Analytics

### Key Metrics
- Content coverage by domain
- Question generation success rate
- Average review time
- Question performance in quizzes
- User satisfaction scores

### Logging
- All AI generation requests
- Content modifications
- Access patterns
- Error rates and types

## Future Enhancements

1. **Multi-language Support**
   - Content translation
   - Localized question generation

2. **Advanced AI Features**
   - Adaptive difficulty adjustment
   - Personalized question generation
   - Learning path optimization

3. **Collaboration Features**
   - Shared knowledge bases between teams
   - Community-contributed content
   - Peer review system

4. **Analytics Dashboard**
   - Content effectiveness metrics
   - Question difficulty calibration
   - Student performance correlation