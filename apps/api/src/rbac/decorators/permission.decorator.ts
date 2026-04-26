import { SetMetadata } from '@nestjs/common';
import { PermissionResource, PermissionAction } from '@prisma/client';

export const PERMISSION_KEY = 'permission';

export const Permission = (
  resource: PermissionResource,
  action: PermissionAction,
) => SetMetadata(PERMISSION_KEY, { resource, action });
