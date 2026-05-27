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
import { RoleScope } from '../../generated/prisma/enums';
import { DatabaseService } from '../database/database.service';
import { Project, TicketStatus } from '../../generated/prisma/client';

const permissions = [
  { key: 'assign_ticket', description: 'Assign tickets to users' },
  { key: 'manage_roles', description: 'Manage roles and permissions' },
  { key: 'view_audit_logs', description: 'View audit logs' },
];

const globalRoles = [
  { name: 'Super Admin', description: 'Full access', scope: RoleScope.GLOBAL },
  {
    name: 'Platform Admin',
    description: 'Platform administration',
    scope: RoleScope.GLOBAL,
  },
  { name: 'Support', description: 'Support staff', scope: RoleScope.GLOBAL },
];

const projectRoles = [
  { name: 'Owner', description: 'Project owner', scope: RoleScope.PROJECT },
  { name: 'Admin', description: 'Project admin', scope: RoleScope.PROJECT },
  { name: 'Manager', description: 'Project manager', scope: RoleScope.PROJECT },
  {
    name: 'Developer',
    description: 'Project developer',
    scope: RoleScope.PROJECT,
  },
  { name: 'QA', description: 'QA tester', scope: RoleScope.PROJECT },
  { name: 'Viewer', description: 'Read-only access', scope: RoleScope.PROJECT },
  { name: 'Client', description: 'External client', scope: RoleScope.PROJECT },
];

const rolePermissionMap: Record<string, string[]> = {
  'Super Admin': ['assign_ticket', 'manage_roles', 'view_audit_logs'],
  'Platform Admin': ['assign_ticket', 'manage_roles', 'view_audit_logs'],
  Support: ['view_audit_logs'],
};

@Injectable()
export class TicketSeederService {
  private readonly logger = new Logger(TicketSeederService.name);

  constructor(private readonly databaseService: DatabaseService) {}

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
        create: permission,
      });
      permissionMap.set(record.key, record.id);
    }

    const roleMap = new Map<string, { id: string; scope: RoleScope }>();
    for (const role of [...globalRoles, ...projectRoles]) {
      const record = await this.databaseService.role.upsert({
        where: { name_scope: { name: role.name, scope: role.scope } },
        update: { description: role.description },
        create: role,
      });
      roleMap.set(`${record.name}:${record.scope}`, {
        id: record.id,
        scope: record.scope,
      });
    }

    for (const [roleName, permissionKeys] of Object.entries(
      rolePermissionMap,
    )) {
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
            roleId_permissionId: { roleId: role.id, permissionId },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId,
          },
        });
      }
    }

    const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@example.com';
    const adminUsername = process.env.ADMIN_USERNAME ?? 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin123!';
    const passwordHash = this.hashPassword(adminPassword);

    const userByEmail = await this.databaseService.user.findUnique({
      where: { email: adminEmail },
    });
    const userByUsername = await this.databaseService.user.findUnique({
      where: { username: adminUsername },
    });

    const baseData = {
      displayName: 'Admin',
      passwordHash,
      isActive: true,
      isEmailVerified: true,
    };

    let adminUser;
    if (userByEmail && userByUsername && userByEmail.id !== userByUsername.id) {
      this.logger.warn(
        `Admin seed conflict: email and username belong to different users. Using email=${adminEmail} and keeping username=${userByEmail.username}.`,
      );
      adminUser = await this.databaseService.user.update({
        where: { id: userByEmail.id },
        data: {
          ...baseData,
        },
      });
    } else if (userByEmail != null || userByUsername != null) {
      const target = userByEmail ?? userByUsername;
      adminUser = await this.databaseService.user.update({
        where: { id: target!.id },
        data: {
          ...baseData,
          email: adminEmail,
          username: adminUsername,
        },
      });
    } else {
      adminUser = await this.databaseService.user.create({
        data: {
          ...baseData,
          email: adminEmail,
          username: adminUsername,
        },
      });
    }

    const superAdminRole = roleMap.get(`Super Admin:${RoleScope.GLOBAL}`);
    if (superAdminRole) {
      const existingAssignment =
        await this.databaseService.roleAssignment.findFirst({
          where: {
            userId: adminUser.id,
            roleId: superAdminRole.id,
            projectId: null,
          },
        });

      if (!existingAssignment) {
        await this.databaseService.roleAssignment.create({
          data: {
            userId: adminUser.id,
            roleId: superAdminRole.id,
          },
        });
      }
    }

    this.logger.log(
      `Seed completed: permissions=${permissionMap.size}, roles=${roleMap.size}, admin=${adminUser.email}`,
    );

    // Seed projects
    const projectData = [
      {
        name: 'Web Portal',
        slug: 'web-portal',
        description: 'Main web portal application',
      },
      {
        name: 'Mobile App',
        slug: 'mobile-app',
        description: 'iOS and Android mobile application',
      },
      {
        name: 'Backend API',
        slug: 'backend-api',
        description: 'Core REST API service',
      },
    ];

    const projects: Project[] = [];
    for (const proj of projectData) {
      const project = await this.databaseService.project.upsert({
        where: { slug: proj.slug },
        update: proj,
        create: { ...proj, isPublic: true, isArchived: false },
      });
      projects.push(project);
    }

    // Seed additional users
    const users = [adminUser];
    const userEmails = [
      'dev1@example.com',
      'dev2@example.com',
      'qa1@example.com',
      'manager@example.com',
    ];
    const usernames = [
      'developer1',
      'developer2',
      'qa_tester',
      'project_manager',
    ];
    const displayNames = [
      'John Developer',
      'Jane Developer',
      'QA Tester',
      'Project Manager',
    ];
    // passwordHash is the same as the admin

    for (let i = 0; i < userEmails.length; i++) {
      const user = await this.databaseService.user.upsert({
        where: { email: userEmails[i] },
        update: {
          displayName: displayNames[i],
          passwordHash: passwordHash,
          isActive: true,
          isEmailVerified: true,
        },
        create: {
          email: userEmails[i],
          username: usernames[i],
          displayName: displayNames[i],
          passwordHash: passwordHash,
          isActive: true,
          isEmailVerified: true,
        },
      });
      users.push(user);
    }

    // Assign project roles to users
    const developerRole = roleMap.get(`Developer:${RoleScope.PROJECT}`);
    const qaRole = roleMap.get(`QA:${RoleScope.PROJECT}`);
    const managerRole = roleMap.get(`Manager:${RoleScope.PROJECT}`);

    if (developerRole && projects[0]) {
      for (const user of users.slice(1, 3)) {
        await this.databaseService.roleAssignment.upsert({
          where: {
            userId_roleId_projectId: {
              userId: user.id,
              roleId: developerRole.id,
              projectId: projects[0].id,
            },
          },
          update: {},
          create: {
            userId: user.id,
            roleId: developerRole.id,
            projectId: projects[0].id,
          },
        });
      }
    }

    if (qaRole && projects[0]) {
      await this.databaseService.roleAssignment.upsert({
        where: {
          userId_roleId_projectId: {
            userId: users[3].id,
            roleId: qaRole.id,
            projectId: projects[0].id,
          },
        },
        update: {},
        create: {
          userId: users[3].id,
          roleId: qaRole.id,
          projectId: projects[0].id,
        },
      });
    }

    // Seed ticket statuses
    const statusData = [
      {
        name: 'To Do',
        slug: 'to-do',
        color: '#808080',
        order: 0,
        isDefault: true,
      },
      { name: 'In Progress', slug: 'in-progress', color: '#0066cc', order: 1 },
      { name: 'In Review', slug: 'in-review', color: '#ff9900', order: 2 },
      { name: 'Done', slug: 'done', color: '#00cc00', order: 3 },
    ];

    const statuses: TicketStatus[] = [];
    for (const project of projects) {
      for (const status of statusData) {
        const ticketStatus = await this.databaseService.ticketStatus.upsert({
          where: {
            projectId_name: {
              projectId: project.id,
              name: status.name,
            },
          },
          update: status,
          create: { ...status, projectId: project.id },
        });
        statuses.push(ticketStatus);
      }
    }

    // Seed tickets
    if (projects[0] && statuses.length > 0) {
      const ticketData = [
        {
          title: 'Setup authentication',
          description: 'Implement JWT-based authentication system',
          type: 'TASK' as const,
          priority: 'HIGH' as const,
          estimateMinutes: 480,
          storyPoints: 5,
        },
        {
          title: 'Fix login bug on mobile',
          description: 'Users unable to login on mobile devices',
          type: 'BUG' as const,
          priority: 'CRITICAL' as const,
          estimateMinutes: 240,
          storyPoints: 3,
        },
        {
          title: 'Add dark mode support',
          description: 'Implement dark theme for better UX',
          type: 'FEATURE' as const,
          priority: 'MEDIUM' as const,
          estimateMinutes: 720,
          storyPoints: 8,
        },
      ];

      const defaultStatus = statuses.find((s) => s.isDefault);
      if (defaultStatus) {
        for (let i = 0; i < ticketData.length; i++) {
          const ticketDto = ticketData[i];
          const ticket = await this.databaseService.ticket.create({
            data: {
              ...ticketDto,
              projectId: projects[0].id,
              statusId: defaultStatus.id,
              reporterId: adminUser.id,
              assigneeId: users[1]?.id || adminUser.id,
            },
          });
          this.logger.debug(`Created ticket: ${ticket.title}`);
        }
      }
    }

    this.logger.log(
      `Seed completed: projects=${projects.length}, users=${users.length}, tickets created`,
    );
  }
}
