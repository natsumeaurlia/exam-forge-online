# TypeScript 'any' Type Usage Report

## Summary

- **Total TypeScript files**: 277
- **Files with 'any' usage**: 29
- **Total 'any' occurrences**: ~75

## Critical Areas Requiring Immediate Attention

### 1. Authentication & Security

- `/src/lib/auth.ts:109` - User ID assignment in session
- `/src/lib/security.ts:57` - Function signature for maskSensitiveData
- `/src/lib/actions/auth-action.ts:10,14` - User ID type casting

### 2. Quiz Response & Answer Handling

- `/src/app/api/quiz/response/route.ts:38,75` - Answer checking logic
- `/src/lib/actions/quiz-response.ts:176,188,193,194,252` - Answer validation
- `/src/components/quiz-taking/QuizTakingClient.tsx:41,151` - Answer state management
- `/src/hooks/use-quiz-taking.ts:45` - Answer setter callback

### 3. Stripe Integration

- `/src/lib/stripe/webhook-handlers.ts` - Multiple instances (lines 127-371)
- Heavy use of type casting for Stripe objects

## Categorized Findings

### Components (11 occurrences)

#### Quiz Taking Components

```typescript
// src/components/quiz-taking/QuestionDisplay.tsx
line 18:  answer: any;
line 19:  onAnswer: (answer: any) => void;
line 196: {pairs.map((pair: any, index: number) => (
line 204: {pairs.map((pair: any, index: number) => (
line 216: {pairs.map((p: any, i: number) => (

// src/components/quiz-taking/QuizTakingClient.tsx
line 41:  answer: any;
line 151: const handleAnswer = (answer: any) => {
```

#### Quiz Editor Components

```typescript
// src/components/quiz-editor/QuestionFormRenderer.tsx
line 14:  question: any;

// src/components/quiz-editor/QuestionList.tsx
line 50:  question: any;
```

#### Other Components

```typescript
// src/components/quiz-preview/QuestionContentRenderer.tsx
line 13:  currentAnswer: any;
line 14:  onAnswerChange: (value: any) => void;

// src/components/analytics/AnalyticsHeader.tsx
line 81:  <Select value={range} onValueChange={val => setRange(val as any)}>

// src/components/dashboard/RecentQuizCard.tsx
line 53:  {t(`status.${status}` as any)}

// src/components/dashboard/StatsCard.tsx
line 113: {t(stat.key as any)}

// src/components/template/TemplateListContent.tsx
line 32:  const sortBy = (searchParams.sort as any) || 'updatedAt';
```

### Server Actions (19 occurrences)

#### Template Actions

```typescript
// src/lib/actions/template.ts
line 129: const updateData: any = {};
line 230: const where: any = {
line 447: ...(template.settings as any),
line 454: const templateQuestions = template.questions as any[];
line 477: data: templateQuestion.options.map((option: any) => ({
```

#### Analytics & Export

```typescript
// src/lib/actions/analytics.ts
line 98: const where: any = { quizId };

// src/lib/actions/export.ts
line 44: let whereClause: any = { quizId };
```

#### Media & Team Management

```typescript
// src/lib/actions/media.ts
line 383: const media: any = await prisma.questionMedia.create({

// src/lib/actions/team-member.ts
line 340: const updateData: any = {};
```

#### Respondents

```typescript
// src/lib/actions/respondents.ts
line 98: user: any;
line 99: responses: any[];
```

### Stripe Webhook Handlers (32 occurrences)

The most concentrated use of 'any' is in the Stripe webhook handlers, primarily for type casting Stripe objects:

- Lines 127, 139-145, 148, 150, 153, 158-163, 166, 168, 171, 178, 180, 215, 218, 235, 237, 310, 371

### Types & Interfaces (2 occurrences)

```typescript
// src/types/template.ts
line 70: correctAnswer?: any;

// src/data/help.ts
line 24: icon?: any;
```

### Hooks (1 occurrence)

```typescript
// src/hooks/use-quiz-taking.ts
line 45: const setAnswer = useCallback((questionId: string, answer: any) => {
```

### Test Files (4 occurrences)

```typescript
// src/lib/actions/__tests__/analytics.test.ts
lines 26, 81, 113, 144: } as any);
```

## Recommendations

### High Priority (Security & Core Functionality)

1. **Authentication**: Define proper user types for session objects
2. **Quiz Responses**: Create proper types for different answer formats based on question types
3. **Stripe Integration**: Create type definitions for Stripe webhook payloads

### Medium Priority (User Experience)

1. **Component Props**: Define proper interfaces for question and answer data
2. **Template System**: Create comprehensive template types
3. **Analytics**: Define proper filter and query types

### Low Priority (Non-critical)

1. **Translation Keys**: Consider using template literal types for translation keys
2. **Icon Types**: Define or import proper icon type definitions
3. **Test Mocks**: While less critical, proper test mocks improve maintainability

## Type Definition Suggestions

### For Quiz Answers

```typescript
type QuizAnswer =
  | { type: 'MULTIPLE_CHOICE'; value: string }
  | { type: 'MULTIPLE_SELECT'; value: string[] }
  | { type: 'TRUE_FALSE'; value: boolean }
  | { type: 'SHORT_ANSWER'; value: string }
  | { type: 'LONG_ANSWER'; value: string }
  | { type: 'NUMERIC'; value: number }
  | { type: 'DATE'; value: Date }
  | { type: 'MATCHING'; value: Record<string, string> }
  | { type: 'ORDERING'; value: string[] }
  | { type: 'FILL_IN_THE_BLANK'; value: string[] }
  | { type: 'DIAGRAM'; value: { points: Array<{ x: number; y: number }> } };
```

### For Update Operations

```typescript
interface UpdateData<T> {
  [K in keyof T]?: T[K];
}
```

### For Stripe Objects

Consider using the official Stripe types from `@stripe/stripe-js` or creating custom interfaces for the specific webhook payloads you handle.
