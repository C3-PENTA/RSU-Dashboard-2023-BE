import { SetMetadata } from '@nestjs/common';

export enum USER_ROLE {
  OPERATOR = 'OPERATOR',
  MANAGER = 'MANAGER',
  USER = 'NORMAL',
}

export const ROLES = 'roles';
export const Roles = (...roles: USER_ROLE[]) => SetMetadata(ROLES, roles);
