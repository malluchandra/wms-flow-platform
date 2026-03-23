import { listWorkers, createWorker, deactivateWorker } from '@/lib/worker-actions';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

const ROLE_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  picker: { label: 'Picker', bg: 'var(--accent-lt)', color: 'var(--accent)' },
  supervisor: { label: 'Supervisor', bg: 'var(--warn-lt)', color: 'var(--warn)' },
  admin: { label: 'Admin', bg: 'var(--err-lt)', color: 'var(--err)' },
};

export default async function WorkersPage() {
  let workers: Awaited<ReturnType<typeof listWorkers>> = [];
  let error = '';
  try { workers = await listWorkers(); } catch (e: any) { error = e.message || 'Failed to load workers'; }

  async function handleCreate(formData: FormData) {
    'use server';
    const name = formData.get('name') as string;
    const badge_id = formData.get('badge_id') as string;
    const role = formData.get('role') as string;
    if (!name || !badge_id || !role) return;
    await createWorker({ name, badge_id, role });
    revalidatePath('/admin/workers');
  }

  async function handleDeactivate(formData: FormData) {
    'use server';
    const workerId = formData.get('workerId') as string;
    if (!workerId) return;
    await deactivateWorker(workerId);
    revalidatePath('/admin/workers');
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1000px' }}>
      <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand)', marginBottom: '4px' }}>Worker Management</h1>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '24px' }}>Provision warehouse workers for your tenant. Workers log in via badge scan.</p>

      {error && <div style={{ padding: '12px 14px', marginBottom: '16px', background: 'var(--err-lt)', border: '1px solid var(--err)', borderRadius: '4px', color: 'var(--err)', fontSize: '12px' }}>{error}</div>}

      <div style={{ padding: '20px', marginBottom: '24px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-subtle)' }}>
        <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>Add New Worker</h2>
        <form action={handleCreate} className="flex items-end gap-3" style={{ flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Worker Name</label>
            <input name="name" required placeholder="John Smith" style={{ padding: '6px 8px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '4px', width: '180px', background: 'var(--bg)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Badge ID</label>
            <input name="badge_id" required placeholder="PICK-005" style={{ padding: '6px 8px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '4px', width: '140px', background: 'var(--bg)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Role</label>
            <select name="role" required style={{ padding: '6px 8px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg)' }}>
              <option value="picker">Picker</option>
              <option value="supervisor">Supervisor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" className="btn-primary" style={{ padding: '6px 16px', fontSize: '12px' }}>Add Worker</button>
        </form>
      </div>

      {workers.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No workers found.</p>
      ) : (
        <div style={{ border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)' }}>
                {['Name', 'Badge ID', 'Role', 'Status', 'Created', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Actions' ? 'right' : 'left', borderBottom: '1px solid var(--border)', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {workers.map((w) => {
                const badge = ROLE_BADGE[w.role] ?? ROLE_BADGE.picker;
                return (
                  <tr key={w.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 500 }}>{w.name}</td>
                    <td className="mono" style={{ padding: '10px 14px', color: 'var(--brand)', fontWeight: 600, fontSize: '11px' }}>{w.badge_id}</td>
                    <td style={{ padding: '10px 14px' }}><span style={{ padding: '2px 8px', borderRadius: '3px', fontSize: '10px', fontWeight: 600, background: badge.bg, color: badge.color }}>{badge.label}</span></td>
                    <td style={{ padding: '10px 14px' }}><span style={{ padding: '2px 8px', borderRadius: '3px', fontSize: '10px', fontWeight: 600, background: w.is_active ? 'var(--success-lt)' : 'var(--bg-muted)', color: w.is_active ? 'var(--success)' : 'var(--text-muted)' }}>{w.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: '11px' }}>{new Date(w.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      {w.is_active && (
                        <form action={handleDeactivate} style={{ display: 'inline' }}>
                          <input type="hidden" name="workerId" value={w.id} />
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
