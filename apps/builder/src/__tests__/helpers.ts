import { prisma } from '@wms/db';
import { hashPassword, signToken } from '../lib/auth';
import type { BuilderJwtPayload } from '@wms/types';

export const TEST_TENANT_SLUG = 'korber-internal';
export const TEST_PASSWORD = 'test-password-123';

export async function seedTestBuilderUser(overrides: {
  email?: string;
  role?: string;
  is_super?: boolean;
} = {}) {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: TEST_TENANT_SLUG },
  });
  if (!tenant) throw new Error('Seed data missing: run pnpm db:seed first');

  const email = overrides.email ?? 'test-admin@korber.com';
  const hash = await hashPassword(TEST_PASSWORD);

  const user = await prisma.builderUser.upsert({
    where: { tenant_id_email: { tenant_id: tenant.id, email } },
    update: { password_hash: hash, role: overrides.role ?? 'admin', is_super: overrides.is_super ?? true },
    create: {
      tenant_id: tenant.id,
      email,
      name: 'Test Admin',
      password_hash: hash,
      role: overrides.role ?? 'admin',
      is_super: overrides.is_super ?? true,
    },
  });

  return { user, tenant };
}

export async function makeToken(payload: Partial<BuilderJwtPayload> & { sub: string; tenant_id: string }) {
  return signToken({
    sub: payload.sub,
    tenant_id: payload.tenant_id,
    email: payload.email ?? 'test@korber.com',
    name: payload.name ?? 'Test User',
    role: payload.role ?? 'admin',
  } as BuilderJwtPayload);
}

export async function cleanupTestBuilderUsers() {
  await prisma.builderUser.deleteMany({
    where: { email: { startsWith: 'test-' } },
  });
}

export { prisma };
