# Tasks / GitHub issues

This file contains actionable issues and task suggestions to populate the repository's issue tracker. Group tasks by priority and area so they can be triaged into sprints.

## Setup

- [ ] Initialize API repository: NestJS (Fastify), Prisma, `package.json`, `tsconfig` and CI.
- [ ] Initialize Web repository: Next.js (TypeScript), TailwindCSS, `package.json`, `tsconfig` and CI.
- [ ] Add linting/formatting: ESLint, Prettier, Husky + lint-staged.
- [ ] Add Docker Compose for local dev: Postgres, Redis, local API, web.
- [ ] Create CI pipeline: lint, test, build, and docker image publish.

## Backend (API)

- [ ] Scaffold NestJS API with Fastify adapter and Prisma setup.
- [ ] Implement auth: `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, JWT + refresh tokens.
- [ ] Add OAuth2 provider integrations: GitHub, Google, Discord, Microsoft (configurable).
- [ ] Implement role-based access control (RBAC) guard and permissions decorator.
- [ ] Implement user session management & device history endpoints.
- [ ] Implement project CRUD and basic project membership endpoints.
- [ ] Implement ticket CRUD with core fields (title, description, assignee, status, priority).
- [ ] Implement ticket CRUD with core fields (title, description, assignee, statusId, priority).
- [ ] Implement status management endpoints (CRUD) for `TicketStatus` and admin controls.
- [ ] Add attachments handling: presigned upload URLs and metadata store.
- [ ] Add audit logging for critical actions (role changes, ticket edits, deletes).

## Frontend (Web)

- [ ] Scaffold Next.js app with TypeScript and TailwindCSS.
- [ ] Implement authentication flows and session handling.
- [ ] Implement project list and ticket list pages (kanban placeholder).
- [ ] Implement ticket create/edit drawer and comment thread UI.
- [ ] Implement real-time updates for ticket list (Socket.IO client integration).
 - [ ] Add Admin UI to manage ticket statuses (create/edit/order/delete).

## Real-time & Sync

- [ ] Add Socket.IO Gateway in NestJS with Redis adapter for horizontal scaling.
- [ ] Implement ticket events: created, updated, moved, assigned, comment added.
- [ ] Implement presence system and typing indicators for tickets.

## Messaging & Chat

- [ ] Implement project channel concept and ticket discussion rooms.
- [ ] Add threaded replies, mentions, and reactions.

## Integrations

- [ ] Discord webhook integration with configurable templates per project/event.
- [ ] Git integration: link commits to tickets, auto-close by commit message (#TICK-123).

## Automation & Rules

- [ ] Implement a basic automation engine: trigger->condition->action for simple flows.

## Search & Analytics

- [ ] Add full-text search (Postgres FTS or Elasticsearch) and index core fields.
- [ ] Create basic analytics endpoints: ticket counts, SLA breaches, average response time.

## Infrastructure & DevOps

- [ ] Create production-ready Dockerfiles for API and web, and compose/helm charts for deployment.
- [ ] Add monitoring: Prometheus metrics endpoint and Grafana dashboards.

## Security & Compliance

- [ ] Add rate-limiting, helmet, CSRF protection on web where applicable.
- [ ] Implement webhook signature verification and retry queue.

## Testing & Docs

- [ ] Add backend unit and integration tests (Jest + Supertest).
- [ ] Add frontend e2e tests (Playwright).
- [ ] Create README and contributor guide with setup steps.
