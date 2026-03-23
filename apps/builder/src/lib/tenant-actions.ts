'use server';

import { prisma } from './db';
import { revalidatePath } from 'next/cache';
import { requireRole } from './auth-guard';

async function requireSuperAdmin() {
  const user = await requireRole('admin');
  const dbUser = await prisma.builderUser.findUnique({
    where: { id: user.sub },
    select: { is_super: true },
  });
  if (!dbUser?.is_super) throw new Error('Super admin required');
  return user;
}

export async function listTenants() {
  await requireSuperAdmin();
  return prisma.tenant.findMany({
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      is_active: true,
      created_at: true,
      _count: {
        select: {
          workers: true,
          builder_users: true,
          flow_definitions: true,
        },
      },
    },
  });
}

export async function createTenant(data: { name: string; slug: string }) {
  await requireSuperAdmin();
  const tenant = await prisma.tenant.create({
    data: { name: data.name, slug: data.slug, is_active: true },
  });
  revalidatePath('/admin/tenants');
  return tenant;
}

export async function updateTenant(tenantId: string, data: { name?: string }) {
  await requireSuperAdmin();
  const updated = await prisma.tenant.update({
    where: { id: tenantId },
    data: { ...(data.name !== undefined && { name: data.name }) },
  });
  revalidatePath('/admin/tenants');
  return updated;
}

export async function deactivateTenant(tenantId: string) {
  await requireSuperAdmin();
  const target = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!target) throw new Error('Tenant not found');
  if (target.slug === 'korber-internal') {
    throw new Error('Cannot deactivate the Körber internal tenant');
  }
  const deactivated = await prisma.tenant.update({
    where: { id: tenantId },
    data: { is_active: false },
  });
  revalidatePath('/admin/tenants');
  return deactivated;
}
