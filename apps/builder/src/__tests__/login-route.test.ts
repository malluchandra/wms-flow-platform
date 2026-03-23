import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as loginHandler } from '../app/api/auth/login/route';
import { POST as logoutHandler } from '../app/api/auth/logout/route';
import { GET as meHandler } from '../app/api/auth/me/route';
import {
  seedTestBuilderUser,
  cleanupTestBuilderUsers,
  TEST_PASSWORD,
} from './helpers';
import { COOKIE_NAME } from '../lib/auth';

describe('POST /api/auth/login', () => {
  beforeAll(async () => {
    await seedTestBuilderUser();
  });

  afterAll(async () => {
    await cleanupTestBuilderUsers();
  });

  it('returns 200 and sets cookie for valid credentials', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test-admin@korber.com',
        password: TEST_PASSWORD,
      }),
    });
    const res = await loginHandler(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.user.email).toBe('test-admin@korber.com');
    expect(body.user.role).toBe('admin');

    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toContain(COOKIE_NAME);
    expect(setCookie).toContain('HttpOnly');
  });

  it('returns 401 for wrong email', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nonexistent@korber.com',
        password: TEST_PASSWORD,
      }),
    });
    const res = await loginHandler(req);
    expect(res.status).toBe(401);
  });

  it('returns 401 for wrong password', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test-admin@korber.com',
        password: 'wrong-password',
      }),
    });
    const res = await loginHandler(req);
    expect(res.status).toBe(401);
  });

  it('returns 401 for inactive user', async () => {
    await seedTestBuilderUser({ email: 'test-inactive@korber.com' });
    const { prisma } = await import('./helpers');
    await prisma.builderUser.updateMany({
      where: { email: 'test-inactive@korber.com' },
      data: { is_active: false },
    });

    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test-inactive@korber.com',
        password: TEST_PASSWORD,
      }),
    });
    const res = await loginHandler(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 for missing fields', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test-admin@korber.com' }),
    });
    const res = await loginHandler(req);
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the auth cookie', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    });
    const res = await logoutHandler(req);
    expect(res.status).toBe(200);

    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toContain(COOKIE_NAME);
    expect(setCookie).toContain('Max-Age=0');
  });
});

describe('GET /api/auth/me', () => {
  let validCookie: string;

  beforeAll(async () => {
    await seedTestBuilderUser();
    const loginReq = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test-admin@korber.com',
        password: TEST_PASSWORD,
      }),
    });
    const loginRes = await loginHandler(loginReq);
    const setCookie = loginRes.headers.get('set-cookie') ?? '';
    const match = setCookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
    validCookie = match ? match[1] : '';
  });

  afterAll(async () => {
    await cleanupTestBuilderUsers();
  });

  it('returns user info for valid cookie', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/me', {
      headers: { Cookie: `${COOKIE_NAME}=${validCookie}` },
    });
    const res = await meHandler(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.user.email).toBe('test-admin@korber.com');
    expect(body.user.role).toBe('admin');
  });

  it('returns 401 without cookie', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/me');
    const res = await meHandler(req);
    expect(res.status).toBe(401);
  });
});
