# Data Models & Fields

This document lists the primary data models and suggested fields. Types are PostgreSQL/Prisma-style suggestions (UUID, string/text, enum, integer, boolean, timestamp, jsonb).

## User

- `id`: UUID (PK)
- `email`: string (unique, indexed)
- `username`: string (unique)
- `displayName`: string
- `passwordHash`: string (nullable if OAuth only)
- `isActive`: boolean
- `isEmailVerified`: boolean
- `twoFactorSecret`: string (nullable)
- `createdAt`: timestamp
- `updatedAt`: timestamp

Relations: projects (via ProjectMember), organizations (via Membership), roles.

## Organization

- `id`: UUID
- `name`: string
- `slug`: string (unique)
- `billingPlan`: enum
- `settings`: jsonb
- `createdAt`, `updatedAt`

## Team

- `id`, `name`, `organizationId`, `description`, `createdAt`, `updatedAt`

## Project

- `id`: UUID
- `organizationId`: UUID (nullable for personal projects)
- `name`: string
- `slug`: string
- `description`: text
- `isPublic`: boolean
- `isArchived`: boolean
- `settings`: jsonb
- `createdAt`, `updatedAt`

## ProjectMember

- `id`, `projectId`, `userId`, `role` (enum: owner, admin, manager, developer, qa, viewer, client), `joinedAt`

## Role / Permission

- `Role`: `id`, `name`, `scope` (global|project), `description`
- `Permission`: pre-defined strings (create_ticket, delete_ticket, assign_ticket, manage_webhooks, manage_roles, export_data, view_audit_logs, ...)
- `RolePermission`: mapping table

## Ticket

- `id`: UUID (e.g., TICK-123)
- `projectId`: UUID
- `type`: enum (bug, feature, task, epic, incident, security)
- `title`: string
- `description`: text
- `statusId`: UUID (references `TicketStatus` — statuses are dynamic and managed by admins)
- `priority`: enum (low, medium, high, critical)
- `reporterId`: UUID
- `assigneeId`: UUID (nullable)
- `estimateMinutes`: integer (nullable)
- `storyPoints`: integer (nullable)
- `dueDate`: timestamp (nullable)
- `labels`: jsonb or many-to-many Label table
- `attachments`: relation to Attachment
- `parentId`: UUID (nullable) for parent-child relationships
- `blockedByIds`: array/relations
- `createdAt`, `updatedAt`, `closedAt`

## TicketStatus

- `id`: UUID
- `projectId`: UUID (nullable — null means global status available to all projects)
- `name`: string
- `slug`: string (optional)
- `color`: string (nullable)
- `order`: integer (for custom sorting in UI)
- `isDefault`: boolean
- `createdAt`, `updatedAt`

## TicketComment

- `id`, `ticketId`, `authorId`, `content` (markdown/text), `editedAt`, `createdAt`, `isDeleted` flag

## Attachment / File

- `id`, `ticketId` (nullable), `uploaderId`, `storagePath`, `filename`, `mimeType`, `size`, `checksum`, `createdAt`

## Label

- `id`, `projectId`, `name`, `color`, `createdAt`

## Milestone

- `id`, `projectId`, `title`, `description`, `startDate`, `dueDate`, `state`, `createdAt`

## Sprint

- `id`, `projectId`, `name`, `startDate`, `endDate`, `goals`, `createdAt`

## Notification

- `id`, `userId`, `channel` (in-app|email|discord|push), `payload` (jsonb), `isRead`, `createdAt`

## AuditLog

- `id`, `actorId`, `action` (string), `resourceType`, `resourceId`, `before` (jsonb), `after` (jsonb), `ip`, `device`, `createdAt`

## WebhookConfig

- `id`, `projectId`, `url`, `events` (array), `secret`, `isActive`, `retryPolicy`, `createdAt`

## Channel & Message (chat)

- `Channel`: `id`, `projectId`, `name`, `type` (project|team|dm|ticket), `createdAt`
- `Message`: `id`, `channelId`, `authorId`, `content`, `attachments`, `editedAt`, `createdAt`, `isDeleted`

## Presence / Session

- `Presence`: `userId`, `status` (online|idle|busy|offline), `lastSeen`
- `Session`: `id`, `userId`, `deviceInfo`, `ip`, `refreshTokenId`, `createdAt`, `revokedAt`

## AutomationRule

- `id`, `projectId`, `name`, `trigger` (json), `conditions` (json), `actions` (json), `isActive`, `createdAt`

## SLA

- `id`, `projectId`, `name`, `conditions` (json), `responseTimeMinutes`, `escalationPolicy` (json), `createdAt`

---

Notes:

- Prefer normalized relations for core entities; use `jsonb` for flexible metadata and extensibility (custom fields).
- Use UUIDs for primary keys and indexed natural keys (slugs) for human-friendly links.
