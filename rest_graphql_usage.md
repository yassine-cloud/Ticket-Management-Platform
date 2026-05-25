# REST vs GraphQL — API guidance

## Philosophy

- Use REST for simple, standardized, and side-effectful operations (auth, uploads, webhooks, health checks).
- Use GraphQL for flexible, nested queries, analytics, and real-time subscriptions (kanban boards, dashboards, complex joins).
- Hybrid approach: keep auth and large-file uploads on REST; use GraphQL for UI-driven queries and subscriptions.

## Use REST for

- Authentication endpoints: `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`.
- File uploads / presigned URL generation: `POST /files/presign`.
- Webhooks endpoints and external integrations.
- Status management endpoints (admin-only): `GET /projects/:projectId/statuses`, `POST /projects/:projectId/statuses`, `PUT /projects/:projectId/statuses/:statusId`, `DELETE /projects/:projectId/statuses/:statusId`.
- Health checks and simple operational endpoints: `GET /health`.

Example: `POST /auth/login`

```
POST /auth/login
Content-Type: application/json

{ "email": "user@example.com", "password": "..." }
```

Response contains `accessToken` (JWT) and `refreshToken`.

## Use GraphQL for

- Kanban board data and nested ticket queries (assignee, comments, attachments) to avoid overfetching.
- Analytics endpoints where clients request specific metrics/fields.
- Real-time subscriptions for ticket updates and typing/presence events.

Note: Expose ticket statuses via GraphQL queries for UI consumption, but prefer REST admin endpoints for creating/updating/deleting statuses (admin-only).

Example GraphQL query (tickets for project):

```
query GetProjectTickets($projectId: ID!, $filter: TicketFilter) {
  project(id: $projectId) {
    id
    name
    tickets(filter: $filter) {
      id
      title
      status
      assignee { id name }
      labels { id name }
    }
  }
}
```

Example GraphQL subscription (ticket updates):

```
subscription TicketUpdated($projectId: ID!) {
  ticketUpdated(projectId: $projectId) {
    id
    title
    status
    changes { field before after }
  }
}
```

## Auth & security

- Enforce JWT on GraphQL and REST endpoints. Pass token in `Authorization: Bearer <token>` header.
- Validate refresh tokens via REST.
- Apply field- and resolver-level permission checks in GraphQL (RBAC guard).

## File uploads

- Prefer REST presigned upload URLs for large files. Upload directly to S3/MinIO/R2; send metadata to API.
- For small attachments, GraphQL file upload scalar is possible but keep REST presign for simplicity and reliability.

## Practical tips

- Keep mutation boundaries clear: use GraphQL mutations for in-app state changes; use REST for external webhooks and uploads.
- Use pagination and cursor-based paging in GraphQL lists.
- Rate-limit sensitive REST endpoints (auth, webhooks).
