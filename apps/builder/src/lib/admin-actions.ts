'use server';

import { prisma } from './db';
import { revalidatePath } from 'next/cache';
import { requireRole } from './auth-guard';
import { hashPassword } from './auth';
import type { BuilderRole, CreateBuilderUserRequest } from '@wms/types';

export async function listBuilderUsers() {
  const user = await requireRole('admin');
  const users = await prisma.builderUser.findMany({
    where: { tenant_id: user.tenant_id },
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      tenant_id: true,
      email: true,
      name: true,
      role: true,
      is_super: true,
      is_active: true,
      created_at: true,
      updated_at: true,
    },
  });
  return users;
}

export async function createBuilderUser(data: CreateBuilderUserRequest) {
  const user = await requireRole('admin');
  const hash = await hashPassword(data.password);

  const newUser = await prisma.builderUser.create({
    data: {
      tenant_id: user.tenant_id,
      email: data.email,
      name: data.name,
      password_hash: hash,
      role: data.role,
    },
    select: {
      id: true,
      tenant_id: true,
      email: true,
      name: true,
      role: true,
      is_super: true,
      is_active: true,
      created_at: true,
      updated_at: true,
    },
  });

  revalidatePath('/admin/users');
  return newUser;
}

export async function updateBuilderUser(
  userId: string,
  data: { name?: string; role?: BuilderRole }
) {
  const user = await requireRole('admin');

  const target = await prisma.builderUser.findFirst({
    where: { id: userId, tenant_id: user.tenant_id },
  });
  if (!target) throw new Error('User not found');

  const updated = await prisma.builderUser.update({
    where: { id: userId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.role !== undefined && { role: data.role }),
    },
    select: {
      id: true,
      tenant_id: true,
      email: true,
      name: true,
      role: true,
      is_super: true,
      is_active: true,
      created_at: true,
      updated_at: true,
    },
  });

  revalidatePath('/admin/users');
  return updated;
}

export async function deactivateBuilderUser(userId: string) {
  const user = await requireRole('admin');

  const target = await prisma.builderUser.findFirst({
    where: { id: userId, tenant_id: user.tenant_id },
  });
  if (!target) throw new Error('User not found');

  if (target.id === user.sub) {
    throw new Error('Cannot deactivate yourself');
  }

  const deactivated = await prisma.builderUser.update({
    where: { id: userId },
    data: { is_active: false },
    select: {
      id: true,
      tenant_id: true,
      email: true,
      name: true,
      role: true,
      is_super: true,
      is_active: true,
      created_at: true,
      updated_at: true,
    },
  });

  revalidatePath('/admin/users');
  return deactivated;
}
