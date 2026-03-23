import type { BuilderRole } from '@wms/types';

const CREATE_FLOW_ROLES: Set<BuilderRole> = new Set(['admin', 'flow-author']);
const EDIT_FLOW_ROLES: Set<BuilderRole> = new Set(['admin', 'flow-author']);
const DELETE_FLOW_ROLES: Set<BuilderRole> = new Set(['admin']);
const REVIEW_FLOW_ROLES: Set<BuilderRole> = new Set(['admin', 'reviewer']);
const PUBLISH_FLOW_ROLES: Set<BuilderRole> = new Set(['admin']);
const MANAGE_USERS_ROLES: Set<BuilderRole> = new Set(['admin']);

export function canCreateFlow(role: BuilderRole): boolean {
  return CREATE_FLOW_ROLES.has(role);
}

export function canEditFlow(role: BuilderRole): boolean {
  return EDIT_FLOW_ROLES.has(role);
}

export function canDeleteFlow(role: BuilderRole): boolean {
  return DELETE_FLOW_ROLES.has(role);
}

export function canReviewFlow(role: BuilderRole): boolean {
  return REVIEW_FLOW_ROLES.has(role);
}

export function canPublishFlow(role: BuilderRole): boolean {
  return PUBLISH_FLOW_ROLES.has(role);
}

export function canManageUsers(role: BuilderRole): boolean {
  return MANAGE_USERS_ROLES.has(role);
}

export function canManageTenants(
  role: BuilderRole,
  isSuper: boolean
): boolean {
  return role === 'admin' && isSuper;
}
