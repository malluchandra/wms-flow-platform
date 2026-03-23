'use client';

import { useState, useRef, useEffect } from 'react';
import type { SearchResult } from '@/lib/search-utils';

interface SearchBarProps {
  results: SearchResult[];
  query: string;
  onQueryChange: (query: string) => void;
  onSelectResult: (stepId: string) => void;
  onClose: () => void;
}

export function SearchBar({ results, query, onQueryChange, onSelectResult, onClose }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        top: '8px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        width: '320px',
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 10px', borderBottom: query ? '1px solid var(--border)' : 'none' }}>
        <span className="ms" style={{ fontSize: '16px', color: 'var(--text-muted)' }}>search</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'Enter' && results.length > 0) {
              onSelectResult(results[0].stepId);
              onClose();
            }
          }}
          placeholder="Search steps by ID, prompt, or type..."
          style={{
            flex: 1,
            padding: '10px 8px',
            border: 'none',
            outline: 'none',
            fontSize: '13px',
            background: 'transparent',
            color: 'var(--text)',
          }}
        />
        <button
          onClick={onClose}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
        >
          <span className="ms" style={{ fontSize: '16px' }}>close</span>
        </button>
      </div>

      {query && results.length > 0 && (
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {results.slice(0, 10).map((r) => (
            <button
              key={r.stepId}
              onClick={() => {
                onSelectResult(r.stepId);
                onClose();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '12px',
                color: 'var(--text)',
                borderBottom: '1px solid var(--bg-muted)',
              }}
            >
              <span className="mono" style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600 }}>
                {r.stepId}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                ({r.matchType})
              </span>
            </button>
          ))}
        </div>
      )}

      {query && results.length === 0 && (
        <div style={{ padding: '12px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
          No matching steps
        </div>
      )}
    </div>
  );
}
