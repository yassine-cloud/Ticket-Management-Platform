/**
 * Utility functions for ticket status management
 */

import { DatabaseService } from '../database/database.service';

/**
 * Get or create default status for a project
 * Used when creating new tickets without explicit status
 */
export async function getOrCreateDefaultStatus(db: DatabaseService, projectId: string) {
  // Try to find the explicitly marked default status
  let defaultStatus = await db.ticketStatus.findFirst({
    where: { projectId, isDefault: true },
  });

  // If no default, use the first status by order
  if (!defaultStatus) {
    defaultStatus = await db.ticketStatus.findFirst({
      where: { projectId },
      orderBy: { order: 'asc' },
    });
  }

  // If still no status exists, this is an error condition
  if (!defaultStatus) {
    throw new Error(
      `No ticket status found for project ${projectId}. Create at least one status first.`
    );
  }

  return defaultStatus;
}

/**
 * Validate that a ticket status belongs to the given project
 */
export async function validateTicketStatusBelongsToProject(
  db: DatabaseService,
  statusId: string,
  projectId: string
) {
  const status = await db.ticketStatus.findFirst({
    where: { id: statusId, projectId },
  });

  if (!status) {
    throw new Error(`Status ${statusId} does not belong to project ${projectId}`);
  }

  return status;
}
