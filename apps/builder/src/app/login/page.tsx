'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error || 'Login failed');
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-subtle)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          padding: '40px 32px',
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '8px',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 20 20" fill="none">
              <rect width="20" height="20" rx="3" fill="#324155" />
              <path
                d="M5 6h10M5 10h6M5 14h8"
                stroke="#fff"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            <span
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--brand)',
                letterSpacing: '-0.01em',
              }}
            >
              Infios
            </span>
          </div>
          <h1
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--text)',
              margin: 0,
            }}
          >
            Sign in to Flow Designer
          </h1>
          <p
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              marginTop: '4px',
            }}
          >
            Build and manage warehouse workflow definitions
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 12px',
              marginBottom: '16px',
              background: 'var(--err-lt)',
              border: '1px solid var(--err)',
              borderRadius: '4px',
              color: 'var(--err)',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '6px',
              }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              autoFocus
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: '13px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                outline: 'none',
                background: 'var(--bg)',
                color: 'var(--text)',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '6px',
              }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: '13px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                outline: 'none',
                background: 'var(--bg)',
                color: 'var(--text)',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#fff',
              background: loading ? 'var(--brand-lt)' : 'var(--brand)',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p
          style={{
            textAlign: 'center',
            fontSize: '11px',
            color: 'var(--text-xmuted)',
            marginTop: '24px',
          }}
        >
          Körber Supply Chain — Flow Designer
        </p>
      </div>
    </div>
  );
}
