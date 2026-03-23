import { describe, it, expect } from 'vitest';
import {
  canCreateFlow,
  canEditFlow,
  canDeleteFlow,
  canReviewFlow,
  canPublishFlow,
  canManageUsers,
  canManageTenants,
} from '../lib/rbac';
import type { BuilderRole } from '@wms/types';

describe('RBAC permission checks', () => {
  describe('admin', () => {
    const role: BuilderRole = 'admin';
    it('can create flows', () => expect(canCreateFlow(role)).toBe(true));
    it('can edit flows', () => expect(canEditFlow(role)).toBe(true));
    it('can delete flows', () => expect(canDeleteFlow(role)).toBe(true));
    it('can review flows', () => expect(canReviewFlow(role)).toBe(true));
    it('can publish flows', () => expect(canPublishFlow(role)).toBe(true));
    it('can manage users', () => expect(canManageUsers(role)).toBe(true));
  });

  describe('flow-author', () => {
    const role: BuilderRole = 'flow-author';
    it('can create flows', () => expect(canCreateFlow(role)).toBe(true));
    it('can edit flows', () => expect(canEditFlow(role)).toBe(true));
    it('cannot delete flows', () => expect(canDeleteFlow(role)).toBe(false));
    it('cannot review flows', () => expect(canReviewFlow(role)).toBe(false));
    it('cannot publish flows', () => expect(canPublishFlow(role)).toBe(false));
    it('cannot manage users', () => expect(canManageUsers(role)).toBe(false));
  });

  describe('reviewer', () => {
    const role: BuilderRole = 'reviewer';
    it('cannot create flows', () => expect(canCreateFlow(role)).toBe(false));
    it('cannot edit flows', () => expect(canEditFlow(role)).toBe(false));
    it('cannot delete flows', () => expect(canDeleteFlow(role)).toBe(false));
    it('can review flows', () => expect(canReviewFlow(role)).toBe(true));
    it('cannot publish flows', () => expect(canPublishFlow(role)).toBe(false));
    it('cannot manage users', () => expect(canManageUsers(role)).toBe(false));
  });

  describe('canManageTenants', () => {
    it('returns true for admin + is_super', () => {
      expect(canManageTenants('admin', true)).toBe(true);
    });
    it('returns false for admin without is_super', () => {
      expect(canManageTenants('admin', false)).toBe(false);
    });
    it('returns false for non-admin even with is_super', () => {
      expect(canManageTenants('flow-author', true)).toBe(false);
    });
  });
});
