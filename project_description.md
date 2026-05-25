# Ticket Management & Collaboration Platform

This document has been split into focused files. Canonical sources (in this folder):

- [project_overview.md](project_overview.md) — high-level project description & features
- [tasks_for_github_issues.md](tasks_for_github_issues.md) — actionable GitHub issues/tasks
- [rest_graphql_usage.md](rest_graphql_usage.md) — REST vs GraphQL guidance and examples
- [models_and_fields.md](models_and_fields.md) — data models & fields (schema)

Updates: Frontend and backend will be developed as independent repositories (not a monorepo). Ticket statuses are dynamic: the system provides default statuses and administrators can add, edit, reorder or remove statuses via admin endpoints/UI (see `models_and_fields.md` and `tasks_for_github_issues.md`).

The remainder of the original document is retained below as backup.

A modern real-time enterprise ticketing platform built with NestJS + Next.js focused on:

* Project-based ticket management
* Real-time collaboration
* DevOps integrations
* Team communication
* Auditability & scalability
* Hybrid REST + GraphQL architecture

---

## Core Vision

The platform is not just a “ticket system”.

It becomes:

* a lightweight Jira alternative,
* a collaborative workspace,
* a developer-oriented operations platform,
* and a real-time monitoring environment.

Think of:

* Kanban + Slack + Discord + GitHub Issues + internal monitoring.

---

## Main Modules

---

## 1. Authentication & Authorization

### Features

* JWT authentication
* Refresh tokens
* OAuth2 login

  * GitHub
  * Google
  * Discord
  * Microsoft
* 2FA (TOTP)
* Session management
* Device history
* Active session revoke
* Email verification
* Password reset

---

### RBAC (Role-Based Access Control)

#### Global Roles

* Super Admin
* Platform Admin
* Support

#### Project Roles

* Owner
* Admin
* Manager
* Developer
* QA
* Viewer
* Client

---

### Permission System

Granular permissions:

* create_ticket
* delete_ticket
* assign_ticket
* manage_webhooks
* manage_roles
* export_data
* view_audit_logs

Use:

```ts
@Permissions('assign_ticket')
```

---

## 2. Organization / Workspace System

Like:

* Jira Workspaces
* GitHub Organizations

### Features

* Multiple organizations
* Invite members
* Team grouping
* Department grouping
* Billing plans
* Workspace settings

---

## 3. Project Management

### Project Features

* Multiple projects
* Public/private projects
* Archived projects
* Templates
* Tags
* Milestones
* Sprint support

---

## 4. Ticket System

---

### Ticket Features

#### Ticket Types

* Bug
* Feature
* Task
* Epic
* Incident
* Security issue

---

### Ticket Properties

#### Basic

* title
* description
* status
* priority
* labels
* due date
* estimated time

#### Advanced

* story points
* linked tickets
* dependency graph
* blockers
* attachments
* watchers
* activity timeline

---

### Ticket Relationships

* blocked by
* duplicates
* parent-child
* related tickets

---

## 5. Kanban Dashboard

### Views

* Kanban
* List
* Calendar
* Timeline
* Sprint board

---

### Kanban Features

#### Drag & Drop

Real-time synchronized using WebSocket.

#### WIP Limits

Limit tickets per column.

#### Swimlanes

Group by:

* assignee
* priority
* sprint
* tag

#### Filters

* assignee
* priority
* labels
* date
* status

---

## 6. Real-Time System

---

### WebSocket Gateway

Using:

```txt
Socket.IO + Redis Adapter
```

---

#### Real-Time Features

##### Ticket Events

* ticket created
* ticket updated
* ticket moved
* ticket assigned
* comment added

---

#### Presence System

Online/offline tracking.

##### User Status

* online
* idle
* busy
* offline

---

#### Typing Indicators

Like Discord/Slack:

* “Yassine is typing…”

---

#### Live Cursor (Optional)

Collaborative editing.

---

#### Real-Time Notifications

* in-app
* push
* websocket
* email
* Discord webhook

---

## 7. Messaging / Chat Module

---

### Channels

#### Types

* Project channels
* Team channels
* Direct messages
* Ticket discussion rooms

---

#### Features

* threaded replies
* mentions
* reactions
* attachments
* markdown support
* message editing
* message deletion
* pinned messages

---

#### Smart Ticket Linking

Typing:

```txt
#TICK-123
```

Automatically creates clickable reference.

---

## 8. Discord Webhook Integration

Admin dynamically configures webhook URL.

### Events

* Ticket created
* Ticket closed
* High priority alerts
* Deployment notifications
* SLA violations

---

### Advanced Features

* Custom webhook templates
* Per-project webhooks
* Per-event subscriptions
* Rich embeds
* Retry queue if Discord fails

---

## 9. Audit Logs / Historique

Critical for enterprise systems.

---

### Logged Events

* login attempts
* role changes
* ticket edits
* webhook updates
* permission changes
* deleted messages

---

### Features

* immutable logs
* actor tracking
* before/after snapshots
* IP/device metadata
* searchable logs

---

## 10. Notification System

---

### Multi-Channel Notifications

* in-app
* email
* Discord
* push notifications

---

### Notification Preferences

Per user:

* mute projects
* mute ticket types
* digest frequency

---

## 11. Search System

Using:

```txt
PostgreSQL Full Text Search
or
Elasticsearch
```

---

### Search Features

* fuzzy search
* advanced filters
* saved searches
* recent searches

---

## 12. Analytics & Reporting

---

### Dashboard Widgets

* ticket completion rate
* average response time
* SLA metrics
* workload distribution
* sprint velocity

---

### Charts

* burndown chart
* cumulative flow diagram
* team productivity

---

## 13. SLA System

Very beneficial for enterprise use.

### Features

* response deadlines
* escalation rules
* overdue alerts
* auto assignment

---

## 14. Automation Engine

Huge feature.

Like:

* GitHub Actions
* Jira automation

---

## Example Rules

### Trigger

```txt
When ticket priority = critical
```

### Action

```txt
Send Discord alert
Assign DevOps team
Create incident room
```

---

## 15. File Management

Use:

* S3
* MinIO
* Cloudflare R2

---

### Features

* attachment previews
* virus scanning
* file versioning
* signed URLs

---

## 16. Activity Timeline

Every ticket contains:

* edits
* status changes
* comments
* assignments
* automation events

---

## 17. AI Features (Very Valuable)

---

### AI Ticket Summarization

Summarize long discussions.

---

### AI Auto Tagging

Predict:

* labels
* priority
* department

---

### AI Suggested Assignee

Based on:

* expertise
* workload
* history

---

## Architecture

---

### Backend Stack

#### Main

* NestJS
* Fastify adapter
* TypeScript
* Prisma ORM

---

#### Database

* PostgreSQL

Why PostgreSQL:

* JSONB
* full text search
* relational consistency
* strong indexing

---

#### Cache

* Redis

Used for:

* websocket scaling
* queues
* caching
* presence system

---

#### Queue System

Use:

```txt
BullMQ
```

For:

* notifications
* emails
* webhook retries
* heavy jobs

---

### Frontend Stack

#### Main

* Next.js
* TypeScript
* TailwindCSS
* Zustand or Redux
* TanStack Query

---

#### Real-Time

* Socket.IO client

---

## REST vs GraphQL Decision

Hybrid architecture is the best choice.

---

### Use GraphQL For

#### 1. Kanban Dashboard

Reason:

* complex nested data
* avoid overfetching
* live UI needs flexible queries

Example:

```graphql
project {
  tickets {
    assignee
    comments
    labels
  }
}
```

---

#### 2. Analytics

Frontend can request only needed metrics.

---

#### 3. Real-Time Subscriptions

Perfect for:

* ticket updates
* comments
* notifications

---

### Use REST For

---

#### 1. Authentication

Reason:

* simple
* standardized
* secure
* easier token handling

Endpoints:

```txt
POST /auth/login
POST /auth/refresh
POST /auth/logout
```

---

#### 2. File Uploads

Multipart uploads are simpler in REST.

---

#### 3. Webhooks

REST is standard.

---

#### 4. External Integrations

GitHub/Discord/CI systems work naturally with REST.

---

#### 5. Health Checks

```txt
GET /health
```

---

## Repository Pattern

---

### Generic Repository

Good for:

* base CRUD
* pagination
* filters

Avoid over-abstracting.

---

### Better Approach

Use:

* BaseRepository
* Feature-specific repositories

Example:

```ts
TicketRepository
UserRepository
WebhookRepository
```

---

## CQRS Pattern (Highly Recommended)

Very beneficial here.

### Why?

You have:

- realtime
- analytics
- events
- notifications

CQRS simplifies scaling.

---

### Example

#### Commands

- CreateTicketCommand
- AssignTicketCommand

#### Queries

- GetKanbanBoardQuery
- GetUserTicketsQuery

---

## Event-Driven Architecture

Use internal events.

Example:

```txt
TicketCreatedEvent
```

Then:

- notify websocket
- send Discord webhook
- create audit log
- trigger automation

All independently.

---

## Suggested Advanced Features

---

### 1. Git Integration

Connect repositories.

#### Features

- link commits
- auto close tickets
- deployment tracking

Example:

```txt
Fix login bug (#TICK-22)
```

---

### 2. CI/CD Integration

- GitHub Actions
- GitLab CI
- Jenkins

Show deployment status inside tickets.

---

### 3. Incident Management

Very strong feature.

#### Include

- severity levels
- incident timeline
- postmortem system

---

### 4. Time Tracking

- manual timers
- worklogs
- productivity reports

---

### 5. Custom Fields

Admins create fields dynamically.

Example:

- customer ID
- environment
- device type

---

### 6. Dynamic Workflows

Admins create statuses:

```txt
Backlog -> In Progress -> QA -> Done
```

---

### 7. Saved Views

Users save personalized filters.

---

### 8. Multi-Tenant Architecture

Critical if SaaS.

---

## Recommended Folder Structure

```txt
apps/
 ├── api/
 └── web/

libs/
 ├── auth/
 ├── database/
 ├── websocket/
 ├── tickets/
 ├── notifications/
 ├── audit/
 ├── automation/
 └── shared/
```

---

## Security Features

- rate limiting
- CSRF protection
- helmet
- websocket auth
- webhook signature verification
- encrypted secrets
- RBAC guards
- audit logging

---

## DevOps Recommendations

---

### Docker Architecture

- api container
- web container
- postgres
- redis
- nginx

---

### CI/CD

- lint
- tests
- build
- docker publish
- deploy

---

### Monitoring

Use:

- Prometheus
- Grafana
- Sentry
- OpenTelemetry

---

## Testing Strategy

### Backend

- unit tests
- integration tests
- e2e tests

Using:

- Jest
- Supertest

---

### Frontend

- Playwright
- React Testing Library

---

## Future Scalability

Possible microservices:

- notification service
- websocket service
- automation engine
- analytics engine

Start modular monolith first.
