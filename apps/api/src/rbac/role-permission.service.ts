import { Injectable, BadRequestException, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  Role,
  Permission,
  UserRoleAssignment,
  PermissionAction,
  PermissionResource,
} from '@prisma/client';

export interface CreateRoleDto {
  name: string;
  description?: string;
  isSystem?: boolean;
  permissionIds: string[];
}

export interface CreatePermissionDto {
  resource: PermissionResource;
  action: PermissionAction;
  description?: string;
}

@Injectable()
export class RolePermissionService implements OnModuleInit {
  private readonly logger = new Logger(RolePermissionService.name);
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await this.initializeDefaultRoles();
      this.logger.log('RBAC default roles and permissions initialized');
    } catch (err) {
      this.logger.warn(`RBAC init skipped: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // ==================== PERMISSION METHODS ====================

  /**
   * Create a new permission
   */
  async createPermission(dto: CreatePermissionDto): Promise<Permission> {
    // Generate key from resource + action
    const key = `${dto.resource}:${dto.action}`.toLowerCase();

    // Check for duplicate
    const existing = await this.prisma.permission.findUnique({
      where: { key },
    });

    if (existing) {
      throw new BadRequestException(`Permission "${key}" already exists`);
    }

    return this.prisma.permission.create({
      data: {
        resource: dto.resource,
        action: dto.action,
        description: dto.description,
        key,
      },
    });
  }

  /**
   * List all permissions with optional filtering
   */
  async listPermissions(filters?: {
    resource?: PermissionResource;
    action?: PermissionAction;
  }): Promise<Permission[]> {
    const where: any = {};

    if (filters?.resource) {
      where.resource = filters.resource;
    }

    if (filters?.action) {
      where.action = filters.action;
    }

    return this.prisma.permission.findMany({
      where,
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });
  }

  /**
   * Get a specific permission
   */
  async getPermission(id: string): Promise<Permission> {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(`Permission not found: ${id}`);
    }

    return permission;
  }

  // ==================== ROLE METHODS ====================

  /**
   * Create a new role with permissions
   */
  async createRole(dto: CreateRoleDto): Promise<Role & { permissions: Permission[] }> {
    // Check for duplicate role name
    const existing = await this.prisma.role.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new BadRequestException(`Role "${dto.name}" already exists`);
    }

    // Verify all permissions exist
    const permissions = await this.prisma.permission.findMany({
      where: {
        id: {
          in: dto.permissionIds,
        },
      },
    });

    if (permissions.length !== dto.permissionIds.length) {
      throw new BadRequestException('One or more permissions do not exist');
    }

    // Create role with permissions
    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        description: dto.description,
        isSystem: dto.isSystem || false,
      },
    });

    // Assign permissions
    await this.prisma.rolePermission.createMany({
      data: dto.permissionIds.map(permissionId => ({
        roleId: role.id,
        permissionId,
      })),
    });

    return this.getRoleWithPermissions(role.id);
  }

  /**
   * Get role with all permissions
   */
  async getRoleWithPermissions(roleId: string): Promise<Role & { permissions: Permission[] }> {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role not found: ${roleId}`);
    }

    return {
      ...role,
      permissions: role.permissions.map(rp => rp.permission),
    };
  }

  /**
   * Update role permissions
   */
  async updateRolePermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<Role & { permissions: Permission[] }> {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException(`Role not found: ${roleId}`);
    }

    // Verify all permissions exist
    const permissions = await this.prisma.permission.findMany({
      where: {
        id: {
          in: permissionIds,
        },
      },
    });

    if (permissions.length !== permissionIds.length) {
      throw new BadRequestException('One or more permissions do not exist');
    }

    // Remove old permissions
    await this.prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    // Add new permissions
    await this.prisma.rolePermission.createMany({
      data: permissionIds.map(permissionId => ({
        roleId,
        permissionId,
      })),
    });

    return this.getRoleWithPermissions(roleId);
  }

  /**
   * List all roles
   */
  async listRoles(): Promise<Array<Role & { permissions: Permission[]; userCount: number }>> {
    const roles = await this.prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        userRoles: true,
      },
      orderBy: { name: 'asc' },
    });

    return roles.map(role => ({
      ...role,
      permissions: role.permissions.map(rp => rp.permission),
      userCount: role.userRoles.length,
    }));
  }

  /**
   * Delete role (only if not system role and no users assigned)
   */
  async deleteRole(roleId: string): Promise<void> {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        userRoles: true,
      },
    });

    if (!role) {
      throw new NotFoundException(`Role not found: ${roleId}`);
    }

    if (role.isSystem) {
      throw new BadRequestException('Cannot delete system roles');
    }

    if (role.userRoles.length > 0) {
      throw new BadRequestException(
        `Cannot delete role with ${role.userRoles.length} assigned users`,
      );
    }

    await this.prisma.role.delete({
      where: { id: roleId },
    });
  }

  // ==================== USER ROLE ASSIGNMENT ====================

  /**
   * Assign role to user
   */
  async assignRoleToUser(
    userId: string,
    roleId: string,
    expiresAt?: Date,
  ): Promise<UserRoleAssignment> {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User not found: ${userId}`);
    }

    // Verify role exists
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException(`Role not found: ${roleId}`);
    }

    // Check if already assigned
    const existing = await this.prisma.userRoleAssignment.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    if (existing) {
      // Update expiration if provided
      if (expiresAt) {
        return this.prisma.userRoleAssignment.update({
          where: { id: existing.id },
          data: { expiresAt },
        });
      }
      return existing;
    }

    return this.prisma.userRoleAssignment.create({
      data: {
        userId,
        roleId,
        expiresAt,
      },
    });
  }

  /**
   * Remove role from user
   */
  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    const assignment = await this.prisma.userRoleAssignment.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException(
        `User role assignment not found for user ${userId} and role ${roleId}`,
      );
    }

    await this.prisma.userRoleAssignment.delete({
      where: { id: assignment.id },
    });
  }

  /**
   * Get user's active roles
   */
  async getUserRoles(userId: string): Promise<Array<Role & { permissions: Permission[] }>> {
    const now = new Date();

    const assignments = await this.prisma.userRoleAssignment.findMany({
      where: {
        userId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    return assignments.map(a => ({
      ...a.role,
      permissions: a.role.permissions.map(rp => rp.permission),
    }));
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(
    userId: string,
    resource: PermissionResource,
    action: PermissionAction,
  ): Promise<boolean> {
    const roles = await this.getUserRoles(userId);

    // If user has no roles, they only have USER role permissions
    if (roles.length === 0) {
      return this.isUserPermission(resource, action);
    }

    // Check if any role has the required permission
    return roles.some(role =>
      role.permissions.some(
        p => p.resource === resource && p.action === action,
      ),
    );
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    const roles = await this.getUserRoles(userId);

    const permissionMap = new Map<string, Permission>();

    // Add default USER permissions
    const userPermissions = await this.getUserPermissions_DefaultUser();
    userPermissions.forEach(p => permissionMap.set(p.key, p));

    // Add role-based permissions
    roles.forEach(role => {
      role.permissions.forEach(p => {
        permissionMap.set(p.key, p);
      });
    });

    return Array.from(permissionMap.values());
  }

  /**
   * List users with a specific role
   */
  async getUsersWithRole(roleId: string): Promise<Array<{
    id: string;
    email: string;
    fullName: string;
    grantedAt: Date;
    expiresAt: Date | null;
  }>> {
    const now = new Date();

    const assignments = await this.prisma.userRoleAssignment.findMany({
      where: {
        roleId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
      orderBy: { grantedAt: 'desc' },
    });

    return assignments.map(a => ({
      id: a.user.id,
      email: a.user.email || 'N/A',
      fullName: a.user.fullName,
      grantedAt: a.grantedAt,
      expiresAt: a.expiresAt,
    }));
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Default permissions for USER role
   */
  private isUserPermission(
    resource: PermissionResource,
    action: PermissionAction,
  ): boolean {
    // Users can only read and create petitions, not approve/manage
    const userPermissions: Array<[PermissionResource, PermissionAction]> = [
      [PermissionResource.PETITION, PermissionAction.CREATE],
      [PermissionResource.PETITION, PermissionAction.READ],
      [PermissionResource.CONTENT, PermissionAction.READ],
    ];

    return userPermissions.some(
      ([res, act]) => res === resource && act === action,
    );
  }

  /**
   * Get default user permissions
   */
  private async getUserPermissions_DefaultUser(): Promise<Permission[]> {
    return this.prisma.permission.findMany({
      where: {
        OR: [
          { key: 'petition:read' },
          { key: 'petition:create' },
          { key: 'content:read' },
        ],
      },
    });
  }

  /**
   * Initialize default roles and permissions
   */
  async initializeDefaultRoles(): Promise<void> {
    // Define default permissions
    const defaultPermissions = [
      // Petition permissions
      { resource: PermissionResource.PETITION, action: PermissionAction.CREATE },
      { resource: PermissionResource.PETITION, action: PermissionAction.READ },
      { resource: PermissionResource.PETITION, action: PermissionAction.UPDATE },
      { resource: PermissionResource.PETITION, action: PermissionAction.DELETE },
      { resource: PermissionResource.PETITION, action: PermissionAction.APPROVE },
      { resource: PermissionResource.PETITION, action: PermissionAction.REJECT },

      // Directory permissions
      { resource: PermissionResource.DIRECTORY, action: PermissionAction.READ },
      { resource: PermissionResource.DIRECTORY, action: PermissionAction.CREATE },
      { resource: PermissionResource.DIRECTORY, action: PermissionAction.UPDATE },
      { resource: PermissionResource.DIRECTORY, action: PermissionAction.DELETE },

      // Institution permissions
      { resource: PermissionResource.INSTITUTION, action: PermissionAction.CREATE },
      { resource: PermissionResource.INSTITUTION, action: PermissionAction.READ },
      { resource: PermissionResource.INSTITUTION, action: PermissionAction.UPDATE },
      { resource: PermissionResource.INSTITUTION, action: PermissionAction.DELETE },

      // User management
      { resource: PermissionResource.USER, action: PermissionAction.READ },
      { resource: PermissionResource.USER, action: PermissionAction.UPDATE },

      // Routing
      { resource: PermissionResource.ROUTING, action: PermissionAction.READ },
      { resource: PermissionResource.ROUTING, action: PermissionAction.OVERRIDE },

      // Analytics
      { resource: PermissionResource.ANALYTICS, action: PermissionAction.READ },

      // Content
      { resource: PermissionResource.CONTENT, action: PermissionAction.READ },
      { resource: PermissionResource.CONTENT, action: PermissionAction.CREATE },
      { resource: PermissionResource.CONTENT, action: PermissionAction.UPDATE },
      { resource: PermissionResource.CONTENT, action: PermissionAction.DELETE },

      // Role management
      { resource: PermissionResource.ROLE, action: PermissionAction.CREATE },
      { resource: PermissionResource.ROLE, action: PermissionAction.READ },
      { resource: PermissionResource.ROLE, action: PermissionAction.UPDATE },
      { resource: PermissionResource.ROLE, action: PermissionAction.DELETE },
    ];

    // Create permissions
    for (const perm of defaultPermissions) {
      const key = `${perm.resource}:${perm.action}`.toLowerCase();

      const existing = await this.prisma.permission.findUnique({
        where: { key },
      });

      if (!existing) {
        await this.prisma.permission.create({
          data: {
            resource: perm.resource,
            action: perm.action,
            key,
          },
        });
      }
    }

    // Create default roles
    const roleDefinitions = [
      {
        name: 'SUPER_ADMIN',
        description: 'Full system access',
        permissions: defaultPermissions, // All permissions
      },
      {
        name: 'ADMIN',
        description: 'Administrative access',
        permissions: defaultPermissions.filter(
          p => p.resource !== PermissionResource.ROLE,
        ), // Everything except role management
      },
      {
        name: 'MODERATOR',
        description: 'Limited moderation access',
        permissions: [
          { resource: PermissionResource.PETITION, action: PermissionAction.APPROVE },
          { resource: PermissionResource.PETITION, action: PermissionAction.REJECT },
          { resource: PermissionResource.PETITION, action: PermissionAction.READ },
          { resource: PermissionResource.DIRECTORY, action: PermissionAction.READ },
          { resource: PermissionResource.CONTENT, action: PermissionAction.READ },
        ],
      },
      {
        name: 'USER',
        description: 'Regular user access',
        permissions: [
          { resource: PermissionResource.PETITION, action: PermissionAction.CREATE },
          { resource: PermissionResource.PETITION, action: PermissionAction.READ },
          { resource: PermissionResource.CONTENT, action: PermissionAction.READ },
        ],
      },
    ];

    for (const roleDef of roleDefinitions) {
      const existing = await this.prisma.role.findUnique({
        where: { name: roleDef.name },
      });

      if (!existing) {
        const permissionIds = await Promise.all(
          roleDef.permissions.map(async p => {
            const perm = await this.prisma.permission.findUnique({
              where: {
                key: `${p.resource}:${p.action}`.toLowerCase(),
              },
            });
            return perm?.id;
          }),
        );

        await this.prisma.role.create({
          data: {
            name: roleDef.name,
            description: roleDef.description,
            isSystem: true,
            permissions: {
              createMany: {
                data: permissionIds
                  .filter((id): id is string => id !== undefined)
                  .map(permissionId => ({ permissionId })),
              },
            },
          },
        });
      }
    }
  }
}
