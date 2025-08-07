# Eleve Monorepo

This is a Turborepo monorepo containing the Eleve skating coach app with both mobile (React Native) and web (Next.js) applications.

## Project Structure

```
eleve-app/
├── apps/
│   ├── mobile/          # React Native app with Expo
│   └── web/             # Next.js web application
├── packages/
│   └── shared/          # Shared utilities, types, and Supabase client
├── docs/                # Documentation files
├── database/            # Database migrations and setup
└── turbo.json           # Turborepo configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI (for mobile development)

### Installation

1. Install dependencies for all packages:
```bash
npm install
```

2. Set up environment variables:
   - Copy `.env.example` to `.env` in `apps/mobile/`
   - Copy `.env.example` to `.env.local` in `apps/web/`
   - Update with your Supabase credentials

### Development

#### Run both apps in development:
```bash
npm run dev
```

#### Run specific apps:
```bash
# Web app only
npm run dev:web

# Mobile app only  
npm run dev:mobile
```

#### Build all apps:
```bash
npm run build
```

## Apps

### Mobile App (`apps/mobile`)
- React Native with Expo
- Skateboard coaching mobile application
- Shared Supabase client via `@shared/supabaseClient`
- Shared types via `@shared/types`

### Web App (`apps/web`)
- Next.js 15 with TypeScript
- Tailwind CSS for styling
- Shared Supabase client via `@shared/supabaseClient`
- Shared types via `@shared/types`

## Shared Package (`packages/shared`)

Contains shared code between mobile and web:

- `supabaseClient.ts` - Configured Supabase client
- `types.ts` - TypeScript interfaces and types
- `utils.ts` - Shared utility functions

### Using Shared Code

Both apps can import from the shared package using the `@shared/*` alias:

```typescript
// Import Supabase client
import { supabase } from '@shared/supabaseClient';

// Import types
import { User, Student, Coach } from '@shared/types';

// Import utilities
import { someUtility } from '@shared/utils';
```

## Environment Variables

### Mobile App (EXPO_PUBLIC_*)
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Web App (NEXT_PUBLIC_*)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

The shared Supabase client automatically uses the appropriate environment variables based on the platform.

## Scripts

- `npm run dev` - Start all apps in development mode
- `npm run dev:web` - Start only the web app
- `npm run dev:mobile` - Start only the mobile app  
- `npm run build` - Build all apps
- `npm run lint` - Lint all apps
- `npm run test` - Run tests for all apps

## Database

Database migrations and setup files are in the `database/` directory. See the existing documentation in `docs/` for database setup instructions.

## Documentation

Additional documentation is available in the `docs/` directory:

- Database setup and migrations
- Deployment guides
- Testing instructions
- And more... 