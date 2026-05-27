# Ticket Management & Collaboration Platform

A real-time ticketing and collaboration platform built with NestJS (backend) and Next.js (frontend), using Prisma + PostgreSQL.

## Repo structure

- `back/` - NestJS API + Prisma
- `front/` - Next.js app

## Prerequisites

- Node.js (LTS recommended)
- PostgreSQL database (local or hosted, e.g. Neon)

## Backend (NestJS + Prisma)

### 1) Install dependencies

```bash
cd back
npm install
```

### 2) Create env file

Create `back/.env` with:

```bash
# Required
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/ticket_system?schema=public"

# Optional (defaults to 3000)
PORT=3000
```

### 3) Generate Prisma client

```bash
npx prisma generate
```

This generates the Prisma client into `back/generated/prisma` (see `prisma/schema.prisma`).

### 4) Run the API

```bash
npm run start:dev
```

The API listens on `http://localhost:${PORT}`.

## Frontend (Next.js)

### 1) Install dependencies

```bash
cd front
npm install
```

### 2) Run the web app

```bash
npm run dev
```

By default the app runs on `http://localhost:3000`.

If you want to run the API and web app together, set a different API port in `back/.env` (for example `PORT=3001`) or start Next.js on another port:

```bash
npm run dev -- -p 3001
```

## Useful commands

### Backend

```bash
npm run start:dev   # dev server
npm run build       # production build
npm run start:prod  # run production build
npm run lint        # lint
npm run test        # unit tests
```

### Frontend

```bash
npm run dev     # dev server
npm run build   # production build
npm run start   # run production build
npm run lint    # lint
```

## Docs

- `project_overview.md` - feature overview
- `project_description.md` - extended description
- `models_and_fields.md` - data models
- `rest_graphql_usage.md` - API guidance
- `MESSAGING_INTEGRATION.md` - messaging module setup and usage guide
- `JWT_INTEGRATION.md` - JWT authentication integration for the messaging module
