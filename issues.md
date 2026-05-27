# GitHub Issues (Ready to create)

Instructions: copy each section title as the issue **title** and the body as the issue **description** when creating GitHub issues. Suggested labels, repo (`api` or `web`) and estimates are included. Use the checklists to break the work into tasks.

---

## Sprint 1 — High Priority

### [API] Initialize NestJS + Prisma (Fastify)

Repo: api

Labels: backend, setup, priority:high

Estimate: 3d

Description:

Scaffold a new NestJS project using Prisma for database access. Provide a working development environment and minimal CI.

Checklist:
- [ ] `npm init` + install NestJS + Fastify
- [ ] Configure Prisma and PostgreSQL connection
- [ ] Add basic `.env` example and README setup steps
- [ ] Add `docker-compose.yml` with Postgres and Redis (dev)
- [ ] Add simple GitHub Actions workflow (lint & tests)

Acceptance criteria:
- `npm run start:dev` boots the API and connects to Postgres
- Prisma `migrate dev` runs successfully

---

### [API] Convert models to Prisma schema & run initial migrations

Repo: api

Labels: backend, database, priority:high

Estimate: 1d

Description:

Translate `models_and_fields.md` into a `schema.prisma` file (include `User`, `Project`, `ProjectMember`, `Ticket`, `TicketStatus`, `Attachment`, `Label`, `AuditLog`, `Session`). Run an initial migration.

Checklist:
- [ ] Create `schema.prisma` with core models
- [ ] Add relations and indexes per document
- [ ] Run `prisma migrate dev --name init`

Acceptance criteria:
- Database schema matches models doc and migrations are committed

---

### [API] Implement authentication (JWT + refresh tokens)

Repo: api

Labels: backend, auth, priority:high

Estimate: 3d

Description:

Implement REST endpoints for `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`. Store refresh tokens (or IDs) and support rotation + revoke. Secure endpoints and add simple unit tests.

Checklist:
- [ ] Implement login flow and password verification
- [ ] Issue JWT access tokens and persistent refresh tokens
- [ ] Add refresh endpoint and revoke logic
- [ ] Add tests for token flows

Acceptance criteria:
- Users can authenticate and refresh tokens; revoked refresh tokens are denied

---

### [API] Implement RBAC guards and permissions system

Repo: api

Labels: backend, auth, medium

Estimate: 2d

Description:

Define `Role` and `Permission` models; implement a `@Permissions()` decorator and NestJS guard that checks resolver/controller access. Seed basic global roles (Super Admin, Platform Admin, Support) and project roles.

Checklist:
- [ ] Add Role/Permission models in Prisma
- [ ] Implement permission decorator and guard
- [ ] Seed default roles and a sample admin user

Acceptance criteria:
- Protected endpoints reject unauthorized requests; `@Permissions('assign_ticket')` works

---

### [API] TicketStatus model + admin REST endpoints

Repo: api

Labels: backend, feature, priority:high

Estimate: 1-2d

Description:

Create a `TicketStatus` model (global or per-project). Implement admin-only endpoints: `GET /projects/:projectId/statuses`, `POST`, `PUT`, `DELETE`. Support ordering and `isDefault` flag.

Checklist:
- [ ] Prisma model and migration for `TicketStatus`
- [ ] CRUD REST endpoints with RBAC checks
- [ ] Admin UI stub (frontend issue)

Acceptance criteria:
- Admins can add/edit/remove/reorder statuses; default status is applied on ticket creation

---

### [API] Ticket model & CRUD (use `statusId`)

Repo: api

Labels: backend, feature, priority:high

Estimate: 3d

Description:

Implement the `Ticket` model and REST/GraphQL CRUD endpoints. Tickets should reference `TicketStatus` via `statusId`. Include basic fields (title, description, reporterId, assigneeId, priority, parentId, labels relation, attachments relation).

Checklist:
- [ ] Prisma model and migration for `Ticket`
- [ ] CRUD endpoints and input validation
- [ ] Emit ticket events on create/update (socket events)

Acceptance criteria:
- Tickets can be created/updated/read/deleted and include status linkage

---

### [API] Presigned uploads for attachments

Repo: api

Labels: backend, infra, medium

Estimate: 1d

Description:

Implement `POST /files/presign` (or equivalent) to return presigned upload URLs to S3/MinIO/R2 and store metadata on success.

Checklist:
- [ ] Presign endpoint
- [ ] Minimal file metadata model & storage

Acceptance criteria:
- Client can obtain presigned URL and upload files directly

---

### [API] Socket.IO Gateway + Redis adapter (ticket events)

Repo: api

Labels: backend, realtime, priority:high

Estimate: 2d

Description:

Add a Socket.IO gateway that publishes ticket events (created, updated, moved, commentAdded). Use Redis adapter for scaling.

Checklist:
- [ ] Integrate Socket.IO gateway in NestJS
- [ ] Configure Redis adapter
- [ ] Emit and document events for frontend consumption

Acceptance criteria:
- Frontend clients receive ticket update events in real-time when server emits

---

### [Web] Initialize Next.js app (TypeScript + Tailwind)

Repo: web

Labels: frontend, setup, priority:high

Estimate: 1d

Description:

Scaffold a Next.js application with TypeScript, TailwindCSS, Emotion or similar. Add README and basic layout.

Checklist:
- [ ] `create-next-app --ts`
- [ ] Install and configure TailwindCSS
- [ ] Add base layout, header and auth wrapper

Acceptance criteria:
- `npm run dev` starts the web app and shows layout page

---

### [Web] Implement Auth flows & session handling

Repo: web

Labels: frontend, auth, priority:high

Estimate: 2d

Description:

Implement login page, token storage (http-only cookies or secure storage), and session refresh handling. Protect routes and redirect unauthenticated users.

Checklist:
- [ ] Login page and form
- [ ] Store tokens securely (recommend http-only cookies via API)
- [ ] Implement global session provider

Acceptance criteria:
- Users can log in and access protected pages; token refresh occurs transparently

---

### [Web] Kanban ticket board (list + drag/drop)

Repo: web

Labels: frontend, feature, priority:high

Estimate: 3d

Description:

Implement a Kanban board component showing tickets by status columns, with drag & drop to change status. Consume ticket list from GraphQL or REST and integrate with socket events to update live.

Checklist:
- [ ] Kanban UI with columns based on `TicketStatus`
- [ ] Drag & drop to change ticket status (send update to API)
- [ ] Subscribe to real-time events and update UI

Acceptance criteria:
- Users can move tickets between columns and see updates in real-time

---

### [Web] Ticket detail view with comments and attachments

Repo: web

Labels: frontend, feature, medium

Estimate: 2d

Description:

Create ticket detail page showing full description, activity timeline, comments, and attachments. Allow adding comments and upload attachments via presigned URLs.

Checklist:
- [ ] Ticket detail UI
- [ ] Comment form and list
- [ ] Attachments upload & preview

Acceptance criteria:
- Users can view ticket details, post comments, and upload attachments

---

### [Web/Admin] Admin UI: Manage Ticket Statuses

Repo: web

Labels: frontend, admin, medium

Estimate: 1d

Description:

Admin interface to create/edit/delete/reorder ticket statuses for a project. Use the admin REST endpoints.

Checklist:
- [ ] Admin statuses page
- [ ] Create/edit/delete actions wired to API
- [ ] Drag reorder and save order

Acceptance criteria:
- Admins can manage statuses; UI updates ordering and shows default status flag

---

### [Infra] Docker Compose for local development

Repo: api (repo contains compose that references web image)

Labels: infra, devops, medium

Estimate: 1d

Description:

Create a `docker-compose.yml` for local dev with Postgres, Redis, API and web (or web as optional). Provide scripts to seed the DB.

Checklist:
- [ ] Compose file with Postgres and Redis
- [ ] Entrypoints to run migrations and seeders

Acceptance criteria:
- Developers can start a local environment with one command

---

### [CI] GitHub Actions: lint, test, build for API and Web

Repo: api, web

Labels: ci, devops, medium

Estimate: 1d

Description:

Add GitHub Actions workflows that run ESLint, typecheck, tests, and build for each repo on PRs.

Checklist:
- [ ] Workflow for API
- [ ] Workflow for Web

Acceptance criteria:
- PRs run CI checks and block merges on failures

---

### [Tests] Backend unit & integration tests skeleton

Repo: api

Labels: tests, backend, low

Estimate: 1d

Description:

Add Jest + Supertest skeleton and one example unit and integration test for auth and ticket endpoints.

Checklist:
- [ ] Configure Jest and testing database
- [ ] Add sample tests for auth and tickets

Acceptance criteria:
- Tests run in CI and pass locally

---

### [Docs] README and contributor guide

Repo: api, web

Labels: docs, low

Estimate: 0.5d

Description:

Create clear setup instructions for devs, commands, environment variables, and local dev workflow. Include how to run Docker Compose and where to find DB migrations.

Checklist:
- [ ] README with setup steps
- [ ] Contributing.md with code style and PR process

Acceptance criteria:
- New dev can follow README to get a running dev environment

---

## Backlog (Sprint 2+)

### Messaging: Channels & Messages (ticket chat)

Repo: api, web

Labels: feature, backlog

Estimate: 3d

Description:

Implement basic chat system: channels per project/ticket, messages, attachments, threading. Expose message events via socket.

---

### Integrations: Discord webhook for high-priority events

Repo: api

Labels: integration, backlog

Estimate: 2d

Description:

Add configurable per-project Discord webhook integration to post ticket events with retry logic.

---

### Analytics: Basic metrics endpoints & dashboard

Repo: api, web

Labels: analytics, backlog

Estimate: 3d

Description:

Implement endpoints for ticket counts, SLA breaches, average response times, and a minimal dashboard widget in web.

---

### Automation engine skeleton (trigger → action)

Repo: api

Labels: feature, backlog

Estimate: 3d

Description:

Create a minimal automation engine capable of storing rules and executing simple actions (assign, notify) on ticket events.

---

## How to use

- Copy each issue title and body into GitHub issues in the corresponding repository (`api` or `web`).
- Apply suggested labels and estimates. Adjust assignees as needed.
- If you want, I can open these issues automatically in a target GitHub repository (requires repo and token).
