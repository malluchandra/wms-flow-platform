import { listTenants, createTenant, deactivateTenant } from '@/lib/tenant-actions';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export default async function TenantsPage() {
  let tenants: Awaited<ReturnType<typeof listTenants>> = [];
  let error = '';
  try { tenants = await listTenants(); } catch (e: any) { error = e.message || 'Failed to load tenants'; }

  async function handleCreate(formData: FormData) {
    'use server';
    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    if (!name || !slug) return;
    await createTenant({ name, slug });
    revalidatePath('/admin/tenants');
  }

  async function handleDeactivate(formData: FormData) {
    'use server';
    const tenantId = formData.get('tenantId') as string;
    if (!tenantId) return;
    await deactivateTenant(tenantId);
    revalidatePath('/admin/tenants');
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1000px' }}>
      <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand)', marginBottom: '4px' }}>Tenant Management</h1>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '24px' }}>Create and manage partner organizations. Super admin only.</p>

      {error && <div style={{ padding: '12px 14px', marginBottom: '16px', background: 'var(--err-lt)', border: '1px solid var(--err)', borderRadius: '4px', color: 'var(--err)', fontSize: '12px' }}>{error}</div>}

      <div style={{ padding: '20px', marginBottom: '24px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-subtle)' }}>
        <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>Create New Tenant</h2>
        <form action={handleCreate} className="flex items-end gap-3" style={{ flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Organization Name</label>
            <input name="name" required placeholder="Acme Warehouse Inc." style={{ padding: '6px 8px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '4px', width: '240px', background: 'var(--bg)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Slug (URL-safe)</label>
            <input name="slug" required placeholder="acme-warehouse" pattern="[a-z0-9-]+" title="Lowercase letters, numbers, and hyphens only" style={{ padding: '6px 8px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '4px', width: '200px', background: 'var(--bg)' }} />
          </div>
          <button type="submit" className="btn-primary" style={{ padding: '6px 16px', fontSize: '12px' }}>Create Tenant</button>
        </form>
      </div>

      {tenants.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No tenants found.</p>
      ) : (
        <div style={{ border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)' }}>
                {['Organization', 'Slug', 'Workers', 'Users', 'Flows', 'Status', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Actions' ? 'right' : 'left', borderBottom: '1px solid var(--border)', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 500 }}>{t.name}</td>
                  <td className="mono" style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: '11px' }}>{t.slug}</td>
                  <td className="mono" style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{t._count.workers}</td>
                  <td className="mono" style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{t._count.builder_users}</td>
                  <td className="mono" style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{t._count.flow_definitions}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '3px', fontSize: '10px', fontWeight: 600, background: t.is_active ? 'var(--success-lt)' : 'var(--bg-muted)', color: t.is_active ? 'var(--success)' : 'var(--text-muted)' }}>{t.is_active ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                    {t.is_active && t.slug !== 'korber-internal' && (
                      <form action={handleDeactivate} style={{ display: 'inline' }}>
                        <input type="hidden" name="tenantId" value={t.id} />
                        <button type="submit" className="btn-danger btn-sm" style={{ fontSize: '11px' }}>Deactivate</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
