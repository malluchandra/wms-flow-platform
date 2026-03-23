'use client';

import { useState } from 'react';
import { useToast } from './Toast';
import { UserNav } from './UserNav';

export type ViewTab = 'logic' | 'designer' | 'envhub' | 'promote';

interface TopBarProps {
  flowName: string;
  flowVersion: string;
  displayName: string;
  environment: string;
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  onSave: () => void;
  onPublish: () => void;
  saving?: boolean;
  linterPass?: boolean;
}

const TABS: { id: ViewTab; label: string }[] = [
  { id: 'logic', label: 'Logic View' },
  { id: 'designer', label: 'UI Designer' },
  { id: 'envhub', label: 'Environment Hub' },
  { id: 'promote', label: 'Flow Promotion' },
];

const ENV_CYCLE: { label: string; cls: string }[] = [
  { label: 'DEV', cls: 'env-dev' },
  { label: 'QA', cls: 'env-qa' },
  { label: 'PROD', cls: 'env-prod' },
];

export function TopBar({
  flowName,
  flowVersion,
  displayName,
  environment,
  activeTab,
  onTabChange,
  onSave,
  onPublish,
  saving = false,
  linterPass = true,
}: TopBarProps) {
  const { showToast } = useToast();
  const envIdx = ENV_CYCLE.findIndex((e) => e.label.toLowerCase() === environment.toLowerCase());
  const [currentEnvIdx, setCurrentEnvIdx] = useState(envIdx >= 0 ? envIdx : 0);

  const cycleEnv = () => {
    const next = (currentEnvIdx + 1) % 3;
    setCurrentEnvIdx(next);
    showToast(`Environment: ${ENV_CYCLE[next].label}`);
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center gap-5 px-5"
      style={{
        height: 'var(--topbar-h)',
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect width="20" height="20" rx="3" fill="#324155" />
          <path d="M5 6h10M5 10h6M5 14h8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <span className="text-sm font-bold" style={{ color: 'var(--brand)', letterSpacing: '-0.01em' }}>
          Infios
        </span>
        <span style={{ color: 'var(--border-dk)', fontSize: '14px' }}>|</span>
        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          Flow Designer
        </span>
      </div>

      {/* Flow selector */}
      <div
        className="flex items-center gap-1.5 rounded cursor-pointer"
        style={{
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border)',
          padding: '5px 10px',
        }}
      >
        <span className="ms" style={{ fontSize: '14px', color: 'var(--text-xmuted)' }}>
          account_tree
        </span>
        <span className="mono" style={{ fontSize: '11px', color: 'var(--text)' }}>
          {flowName}
        </span>
        <span
          className="font-semibold"
          style={{
            fontSize: '9px',
            background: 'var(--bg-muted)',
            color: 'var(--text-muted)',
            padding: '1px 5px',
            borderRadius: '2px',
          }}
        >
          {flowVersion}
        </span>
        <span className="ms" style={{ fontSize: '14px', color: 'var(--text-xmuted)' }}>
          expand_more
        </span>
      </div>

      {/* Tabs */}
      <nav className="flex gap-5 items-end h-full ml-2">
        {TABS.map((t) => (
          <span
            key={t.id}
            className={`tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => onTabChange(t.id)}
          >
            {t.label}
          </span>
        ))}
      </nav>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-2.5 flex-shrink-0">
        {/* Linter status */}
        <div className="flex items-center gap-1" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
          <span
            className={`ms-fill ${linterPass ? 'linter-ok' : ''}`}
            style={{ fontSize: '14px', color: linterPass ? undefined : 'var(--err)' }}
          >
            {linterPass ? 'check_circle' : 'error'}
          </span>
          <span
            className={linterPass ? 'linter-ok' : ''}
            style={{ fontWeight: 600, color: linterPass ? undefined : 'var(--err)' }}
          >
            {linterPass ? 'Linter Pass' : 'Linter Fail'}
          </span>
        </div>

        {/* Env badge */}
        <span
          className={`env-badge ${ENV_CYCLE[currentEnvIdx].cls}`}
          onClick={cycleEnv}
        >
          {ENV_CYCLE[currentEnvIdx].label}
        </span>

        {/* Save / Publish */}
        <button className="btn-ghost btn-sm" onClick={onSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Draft'}
        </button>
        <button className="btn-primary btn-sm" onClick={onPublish}>
          Publish &rarr;
        </button>

        {/* Notifications */}
        <button
          className="ms"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '20px',
            padding: '3px',
          }}
          title="Notifications"
        >
          notifications
        </button>

        {/* User nav */}
        <UserNav />
      </div>
    </div>
  );
}
