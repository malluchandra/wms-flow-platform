'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/admin/tenants', label: 'Tenants', icon: 'domain' },
  { href: '/admin/users', label: 'Users', icon: 'manage_accounts' },
  { href: '/admin/workers', label: 'Workers', icon: 'badge' },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav style={{ width: '180px', flexShrink: 0, background: 'var(--bg-subtle)', borderRight: '1px solid var(--border)', padding: '16px 0' }}>
      <div style={{ padding: '0 16px 12px', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Administration</div>
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '12px',
            fontWeight: active ? 600 : 400, color: active ? 'var(--accent)' : 'var(--text)',
            background: active ? 'var(--accent-lt)' : 'transparent', textDecoration: 'none',
            borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
          }}>
            <span className="ms" style={{ fontSize: '16px' }}>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
      <div style={{ padding: '16px 16px 0', borderTop: '1px solid var(--border)', marginTop: '12px' }}>
        <Link href="/" style={{ fontSize: '11px', color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span className="ms" style={{ fontSize: '14px' }}>arrow_back</span>Back to Flows
        </Link>
      </div>
    </nav>
  );
}
