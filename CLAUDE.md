# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ExamForge is a multi-language online quiz and exam creation platform built with Next.js 15, TypeScript, and Prisma. It supports Japanese and English with comprehensive quiz management, authentication, and analytics.

## Project Structure Update

The project has been reorganized with the following structure:
```
exam-forge/
├── web/          # Next.js application (all previous code moved here)
├── infra/        # Infrastructure configuration
│   └── terraform/
│       └── stripe/  # Stripe billing setup
├── docs/         # Documentation
└── .env          # Environment variables (root level, NOT in web/)
```

**Important**: 
- All application code is now in the `web/` directory
- The `.env` file is at the ROOT level (exam-forge/.env), not in the web directory
- The web application reads environment variables from the parent directory
- All Prisma commands use `dotenv-cli` to load the parent .env file
- When running commands, ensure you're in the correct directory:
  - For application commands (pnpm dev, db:migrate, etc.): `cd web`
  - For infrastructure: `cd infra/terraform/stripe`

## Essential Commands

### Development (run from web/ directory)

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Production build
- `pnpm start` - Start production server

### Database (Prisma) (run from web/ directory)

- `pnpm db:migrate` - Run database migrations
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:studio` - Open Prisma Studio GUI
- `pnpm db:reset` - Reset database with seed data

### Testing (run from web/ directory)

- `pnpm test` - Run all Playwright E2E tests
- `pnpm test:fast` - Run tests in parallel (faster)
- `pnpm test:ui` - Interactive test runner
- `pnpm test:headed` - Run tests with browser UI

### Code Quality (run from web/ directory)

- `pnpm lint` - ESLint check
- `pnpm format` - Prettier formatting
- `pnpm type-check` - TypeScript validation

### Infrastructure (run from infra/terraform/stripe/)

- `terraform init` - Initialize Terraform
- `terraform plan` - Preview changes
- `terraform apply` - Apply infrastructure changes

## Architecture Overview

### Tech Stack

- **Next.js 15** with App Router and Server Components
- **TypeScript** in strict mode
- **Prisma ORM** with PostgreSQL
- **NextAuth.js** for authentication (Google, GitHub, Credentials)
- **Stripe** for billing and payments
- **next-intl** for i18n (Japanese/English)
- **Tailwind CSS** + **shadcn/ui** for styling
- **Playwright** for E2E testing
- **Terraform** for infrastructure as code

### Key Patterns

#### Team-Based Architecture

- All resources (quizzes, subscriptions) belong to teams
- Users can be members of multiple teams
- Pricing is per team member (Pro plan: ¥2,980/user/month)
- Free plan limited to 1 member (individual use)

#### Billing System

- Stripe integration for subscription management
- Webhook handlers in `/api/stripe/webhook`
- Customer portal for self-service subscription management
- Support for monthly and yearly billing cycles

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

Core models: User, Team, TeamMember, Quiz, Question, QuestionOption, QuizResponse, Subscription, Plan

- Team-based multi-tenancy
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

### Stripe Integration

- Webhook endpoint: `/api/stripe/webhook`
- Checkout session: `/api/stripe/checkout`
- Customer portal: `/api/stripe/portal`
- Environment variables required:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - Price IDs from Terraform output

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

### Team Context

- Always check team membership and permissions
- Use `teamId` from user's active team context
- Verify user role (OWNER, ADMIN, MEMBER, VIEWER) for actions

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.