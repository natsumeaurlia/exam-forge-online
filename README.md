# ExamForge

A multi-language online quiz and exam creation platform built with Next.js 15, TypeScript, and Prisma.

## Project Structure

```
exam-forge/
├── web/                    # Next.js application
│   ├── src/               # Source code
│   ├── prisma/            # Database schema and migrations
│   ├── public/            # Static assets
│   └── tests/             # E2E tests
├── infra/                 # Infrastructure configuration
│   └── terraform/         # Terraform modules
│       └── stripe/        # Stripe billing setup
├── docs/                  # Project documentation
└── .env                   # Environment variables (root level)
```

## Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/exam-forge.git
   cd exam-forge
   ```

2. **Copy environment variables**
   ```bash
   cp .env.example .env
   ```

3. **Install dependencies**
   ```bash
   cd web
   pnpm install
   ```

4. **Set up the database**
   ```bash
   # From the web directory
   pnpm db:migrate
   pnpm db:seed:master
   ```

5. **Set up Stripe (optional)**
   ```bash
   cd ../infra/terraform/stripe
   terraform init
   terraform apply
   ```

6. **Start the development server**
   ```bash
   cd ../../../web
   pnpm dev
   ```

## Development

### Web Application

All application code is in the `web/` directory:

```bash
cd web

# Development
pnpm dev              # Start dev server
pnpm db:studio        # Open Prisma Studio
pnpm test            # Run E2E tests

# Database
pnpm db:migrate      # Run migrations
pnpm db:generate     # Generate Prisma client
pnpm db:seed         # Seed database

# Code quality
pnpm lint            # ESLint
pnpm type-check      # TypeScript check
pnpm format          # Prettier
```

### Infrastructure

Infrastructure configuration is in the `infra/` directory:

```bash
cd infra/terraform/stripe
terraform plan
terraform apply
```

## Environment Variables

Environment variables are stored in `.env` at the root level. The web application automatically reads from the parent directory.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - NextAuth.js secret
- `STRIPE_SECRET_KEY` - Stripe API key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

## Features

- 🌐 Multi-language support (Japanese/English)
- 👥 Team-based management with role-based access
- 💳 Stripe integration for subscription billing
- 📊 Comprehensive quiz analytics
- 🔒 Secure authentication with NextAuth.js
- 📱 Responsive design with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Payments**: Stripe
- **Testing**: Playwright
- **Infrastructure**: Terraform

## License

Private - All rights reserved