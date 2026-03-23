'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: string;
}

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  'flow-author': 'Author',
  reviewer: 'Reviewer',
};

export function UserNav() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 8px',
          borderRadius: '4px',
          border: 'none',
          background: open ? 'rgba(255,255,255,0.15)' : 'transparent',
          cursor: 'pointer',
          color: '#fff',
          fontSize: '12px',
        }}
      >
        <div
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 700,
          }}
        >
          {initials}
        </div>
        <span style={{ fontWeight: 500 }}>{user.name}</span>
        <span
          style={{
            padding: '1px 6px',
            borderRadius: '3px',
            fontSize: '9px',
            fontWeight: 600,
            background: 'rgba(255,255,255,0.15)',
            textTransform: 'uppercase',
          }}
        >
          {ROLE_LABEL[user.role] ?? user.role}
        </span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            marginTop: '4px',
            width: '180px',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 100,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '10px 12px',
              borderBottom: '1px solid var(--border)',
              fontSize: '11px',
              color: 'var(--text-muted)',
            }}
          >
            {user.email}
          </div>
          {user.role === 'admin' && (
            <button
              onClick={() => {
                setOpen(false);
                router.push('/admin/users');
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                textAlign: 'left',
                border: 'none',
                background: 'transparent',
                fontSize: '12px',
                color: 'var(--text)',
                cursor: 'pointer',
              }}
            >
              <span className="ms" style={{ fontSize: '14px', marginRight: '6px', verticalAlign: 'middle' }}>
                manage_accounts
              </span>
              Manage Users
            </button>
          )}
          <button
            onClick={handleLogout}
            style={{
              display: 'block',
              width: '100%',
              padding: '8px 12px',
              textAlign: 'left',
              border: 'none',
              background: 'transparent',
              fontSize: '12px',
              color: 'var(--err)',
              cursor: 'pointer',
              borderTop: '1px solid var(--border)',
            }}
          >
            <span className="ms" style={{ fontSize: '14px', marginRight: '6px', verticalAlign: 'middle' }}>
              logout
            </span>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
