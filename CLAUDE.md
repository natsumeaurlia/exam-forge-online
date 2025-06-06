# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ExamForge is a multi-language online quiz and exam creation platform built with Next.js 15, TypeScript, and Prisma. It supports Japanese and English with comprehensive quiz management, authentication, and analytics.

## Essential Commands

### Development
- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Production build
- `pnpm start` - Start production server

### Database (Prisma)
- `pnpm db:migrate` - Run database migrations
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:studio` - Open Prisma Studio GUI
- `pnpm db:reset` - Reset database with seed data

### Testing
- `pnpm test` - Run all Playwright E2E tests
- `pnpm test:fast` - Run tests in parallel (faster)
- `pnpm test:ui` - Interactive test runner
- `pnpm test:headed` - Run tests with browser UI

### Code Quality
- `pnpm lint` - ESLint check
- `pnpm format` - Prettier formatting
- `pnpm type-check` - TypeScript validation

## Architecture Overview

### Tech Stack
- **Next.js 15** with App Router and Server Components
- **TypeScript** in strict mode
- **Prisma ORM** with PostgreSQL
- **NextAuth.js** for authentication (Google, GitHub, Credentials)
- **next-intl** for i18n (Japanese/English)
- **Tailwind CSS** + **shadcn/ui** for styling
- **Playwright** for E2E testing

### Key Patterns

#### Internationalization
- Route structure: `/[lng]/path` where lng is `ja` or `en`
- All pages under `src/app/[lng]/` directory
- Translation files in `src/i18n/locales/`
- Default language is Japanese (`ja`)

#### Authentication Flow
- NextAuth.js with JWT strategy
- Protected routes use middleware.ts
- Automatic redirect to `/[lng]/dashboard` after login
- User menu in `src/components/layout/UserMenu.tsx`

#### Database Architecture
Core models: User, Quiz, Question, QuestionOption, QuizResponse, Tag, Section
- Quizzes support multiple question types, time limits, password protection
- Rich analytics with QuizResponse tracking
- Tag-based categorization system

#### Component Structure
- Base UI components in `src/components/ui/` (shadcn/ui)
- Feature components organized by domain (quiz/, dashboard/, landing/)
- Server Components for data fetching, Client Components for interactivity
- Compound component patterns for complex UI

#### Server Actions
- Located in `src/lib/actions/`
- Type-safe with Zod validation
- Use `next-safe-action` for enhanced validation and error handling

### Testing Strategy
- Playwright E2E tests with comprehensive page coverage
- Visual regression testing with screenshots
- Test files mirror the `src/app/` structure in `tests/`
- Multi-browser support (Chrome, Firefox, Safari)

### State Management
- Zustand stores in `src/lib/stores/` and `src/stores/`
- React Server Components for server state
- Custom hooks in `src/hooks/` for client-side logic

## Development Guidelines

### File Organization
- Components: Group by feature/domain, not by type
- Server Actions: One file per domain (quiz.ts, tag.ts)
- Types: Domain-specific types in `src/types/`
- Constants: Shared constants in `src/constants/`

### Styling Conventions
- Use Tailwind CSS utility classes
- Custom colors defined in tailwind.config.ts
- CSS variables for theming in src/index.css
- shadcn/ui components for consistent design system

### Internationalization
- All user-facing text must be internationalized
- Use `useTranslations()` hook in Client Components
- Use `getTranslations()` in Server Components
- Translation keys follow nested structure matching UI hierarchy

### Database Changes
- Always create migrations: `pnpm db:migrate`
- Update seed.ts for development data
- Regenerate client after schema changes: `pnpm db:generate`

## Common Patterns

### Creating New Pages
1. Add route in `src/app/[lng]/path/page.tsx`
2. Add translations in both `en.json` and `ja.json`
3. Create corresponding Playwright test in `tests/path/page.spec.ts`

### Adding New Components
1. Check if shadcn/ui component exists first
2. Create in appropriate domain folder under `src/components/`
3. Export from index file if creating component library

### Server Actions
- Always validate input with Zod schemas
- Return type-safe responses with success/error states
- Handle errors gracefully with proper user feedback
- Use `revalidatePath()` for cache invalidation

### Authentication
- Use `auth()` from `src/lib/auth.ts` to get session
- Protect pages with middleware or component-level checks
- Redirect unauthenticated users to `/[lng]/auth/signin`