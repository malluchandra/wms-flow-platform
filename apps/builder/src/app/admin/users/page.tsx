import { listBuilderUsers, createBuilderUser, deactivateBuilderUser } from '@/lib/admin-actions';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const ROLE_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  admin: { label: 'Admin', bg: 'var(--err-lt)', color: 'var(--err)' },
  'flow-author': { label: 'Author', bg: 'var(--accent-lt)', color: 'var(--accent)' },
  reviewer: { label: 'Reviewer', bg: 'var(--warn-lt)', color: 'var(--warn)' },
};

export default async function AdminUsersPage() {
  let users: Awaited<ReturnType<typeof listBuilderUsers>> = [];
  let error = '';
  try {
    users = await listBuilderUsers();
  } catch (e: any) {
    error = e.message || 'Failed to load users';
  }

  async function handleCreateUser(formData: FormData) {
    'use server';
    const email = formData.get('email') as string;
    const name = formData.get('name') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as string;
    if (!email || !name || !password || !role) return;
    await createBuilderUser({ email, name, password, role: role as any });
    revalidatePath('/admin/users');
  }

  async function handleDeactivate(formData: FormData) {
    'use server';
    const userId = formData.get('userId') as string;
    if (!userId) return;
    await deactivateBuilderUser(userId);
    revalidatePath('/admin/users');
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/" style={{ fontSize: '11px', color: 'var(--accent)', textDecoration: 'none' }}>
              ← Back to Flows
            </Link>
          </div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand)' }}>User Management</h1>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Manage builder users for your tenant</p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 14px', marginBottom: '16px', background: 'var(--err-lt)', border: '1px solid var(--err)', borderRadius: '4px', color: 'var(--err)', fontSize: '12px' }}>
          {error}
        </div>
      )}

      <div style={{ padding: '20px', marginBottom: '24px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-subtle)' }}>
        <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>Add New User</h2>
        <form action={handleCreateUser} className="flex items-end gap-3" style={{ flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Email</label>
            <input name="email" type="email" required placeholder="user@company.com" style={{ padding: '6px 8px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '4px', width: '200px', background: 'var(--bg)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Name</label>
            <input name="name" required placeholder="Full Name" style={{ padding: '6px 8px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '4px', width: '160px', background: 'var(--bg)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Password</label>
            <input name="password" type="password" required placeholder="••••••" style={{ padding: '6px 8px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '4px', width: '140px', background: 'var(--bg)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Role</label>
            <select name="role" required style={{ padding: '6px 8px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg)' }}>
              <option value="flow-author">Flow Author</option>
              <option value="reviewer">Reviewer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" className="btn-primary" style={{ padding: '6px 16px', fontSize: '12px' }}>Add User</button>
        </form>
      </div>

      {users.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No users found.</p>
      ) : (
        <div style={{ border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)' }}>
                {['Name', 'Email', 'Role', 'Status', 'Created', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Actions' ? 'right' : 'left', borderBottom: '1px solid var(--border)', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const badge = ROLE_BADGE[u.role] ?? ROLE_BADGE['flow-author'];
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 500 }}>
                      {u.name}
                      {u.is_super && (
                        <span style={{ marginLeft: '6px', fontSize: '9px', padding: '1px 5px', borderRadius: '3px', background: 'var(--brand)', color: '#fff', fontWeight: 600, textTransform: 'uppercase' }}>Super</span>
                      )}
                    </td>
                    <td className="mono" style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: '11px' }}>{u.email}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '3px', fontSize: '10px', fontWeight: 600, background: badge.bg, color: badge.color }}>{badge.label}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '3px', fontSize: '10px', fontWeight: 600, background: u.is_active ? 'var(--success-lt)' : 'var(--bg-muted)', color: u.is_active ? 'var(--success)' : 'var(--text-muted)' }}>{u.is_active ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: '11px' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      {u.is_active && (
                        <form action={handleDeactivate} style={{ display: 'inline' }}>
                          <input type="hidden" name="userId" value={u.id} />
                          <button type="submit" className="btn-danger btn-sm" style={{ fontSize: '11px' }}>Deactivate</button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
