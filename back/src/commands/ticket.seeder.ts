import { Injectable, Logger } from '@nestjs/common';
// import {
//   randEmail,
//   randFilePath,
//   randFullName,
//   randJobTitle,
//   randNumber,
//   randPassword,
//   randUserName,
// } from '@ngneat/falso';
import { randomBytes, scryptSync } from 'crypto';

import { RoleScope } from '../../generated/prisma/client';
import { DatabaseService } from '../database/database.service';

const permissions = [
  { key: 'assign_ticket', description: 'Assign tickets to users' },
  { key: 'manage_roles', description: 'Manage roles and permissions' },
  { key: 'view_audit_logs', description: 'View audit logs' }
];

const globalRoles = [
  { name: 'Super Admin', description: 'Full access', scope: RoleScope.GLOBAL },
  { name: 'Platform Admin', description: 'Platform administration', scope: RoleScope.GLOBAL },
  { name: 'Support', description: 'Support staff', scope: RoleScope.GLOBAL }
];

const projectRoles = [
  { name: 'Owner', description: 'Project owner', scope: RoleScope.PROJECT },
  { name: 'Admin', description: 'Project admin', scope: RoleScope.PROJECT },
  { name: 'Manager', description: 'Project manager', scope: RoleScope.PROJECT },
  { name: 'Developer', description: 'Project developer', scope: RoleScope.PROJECT },
  { name: 'QA', description: 'QA tester', scope: RoleScope.PROJECT },
  { name: 'Viewer', description: 'Read-only access', scope: RoleScope.PROJECT },
  { name: 'Client', description: 'External client', scope: RoleScope.PROJECT }
];

const rolePermissionMap: Record<string, string[]> = {
  'Super Admin': ['assign_ticket', 'manage_roles', 'view_audit_logs'],
  'Platform Admin': ['assign_ticket', 'manage_roles', 'view_audit_logs'],
  Support: ['view_audit_logs']
};

@Injectable()
export class TicketSeederService {
  private readonly logger = new Logger(TicketSeederService.name);

  constructor(private readonly databaseService: DatabaseService) { }

  hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const derived = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${derived}`;
  }

  async seed(): Promise<void> {
    const permissionMap = new Map<string, string>();
    for (const permission of permissions) {
      const record = await this.databaseService.permission.upsert({
        where: { key: permission.key },
        update: { description: permission.description },
        create: permission
      });
      permissionMap.set(record.key, record.id);
    }

    const roleMap = new Map<string, { id: string; scope: RoleScope }>();
    for (const role of [...globalRoles, ...projectRoles]) {
      const record = await this.databaseService.role.upsert({
        where: { name_scope: { name: role.name, scope: role.scope } },
        update: { description: role.description },
        create: role
      });
      roleMap.set(`${record.name}:${record.scope}`, { id: record.id, scope: record.scope });
    }

    for (const [roleName, permissionKeys] of Object.entries(rolePermissionMap)) {
      const roleKey = `${roleName}:${RoleScope.GLOBAL}`;
      const role = roleMap.get(roleKey);
      if (!role) {
        continue;
      }

      for (const permissionKey of permissionKeys) {
        const permissionId = permissionMap.get(permissionKey);
        if (!permissionId) {
          continue;
        }

        await this.databaseService.rolePermission.upsert({
          where: {
            roleId_permissionId: { roleId: role.id, permissionId }
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId
          }
        });
      }
    }

    const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@example.com';
    const adminUsername = process.env.ADMIN_USERNAME ?? 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin123!';
    const passwordHash = this.hashPassword(adminPassword);

    const userByEmail = await this.databaseService.user.findUnique({
      where: { email: adminEmail }
    });
    const userByUsername = await this.databaseService.user.findUnique({
      where: { username: adminUsername }
    });

    const baseData = {
      displayName: 'Admin',
      passwordHash,
      isActive: true,
      isEmailVerified: true
    };

    let adminUser;
    if (userByEmail && userByUsername && userByEmail.id !== userByUsername.id) {
      this.logger.warn(
        `Admin seed conflict: email and username belong to different users. Using email=${adminEmail} and keeping username=${userByEmail.username}.`
      );
      adminUser = await this.databaseService.user.update({
        where: { id: userByEmail.id },
        data: {
          ...baseData
        }
      });
    } else if (userByEmail != null || userByUsername != null) {
      const target = userByEmail ?? userByUsername;
      adminUser = await this.databaseService.user.update({
        where: { id: target!.id },
        data: {
          ...baseData,
          email: adminEmail,
          username: adminUsername
        }
      });
    } else {
      adminUser = await this.databaseService.user.create({
        data: {
          ...baseData,
          email: adminEmail,
          username: adminUsername
        }
      });
    }

    const superAdminRole = roleMap.get(`Super Admin:${RoleScope.GLOBAL}`);
    if (superAdminRole) {
      const existingAssignment = await this.databaseService.roleAssignment.findFirst({
        where: {
          userId: adminUser.id,
          roleId: superAdminRole.id,
          projectId: null
        }
      });

      if (!existingAssignment) {
        await this.databaseService.roleAssignment.create({
          data: {
            userId: adminUser.id,
            roleId: superAdminRole.id
          }
        });
      }
    }

    this.logger.log(
      `Seed completed: permissions=${permissionMap.size}, roles=${roleMap.size}, admin=${adminUser.email}`
    );
  }
}
