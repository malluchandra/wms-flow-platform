'use client';

import { useState } from 'react';
import { CreateFromBaseDialog } from './CreateFromBaseDialog';

export function FlowListActions() {
  const [showDialog, setShowDialog] = useState(false);
  return (
    <>
      <button onClick={() => setShowDialog(true)} className="btn-ghost" style={{ fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <span className="ms" style={{ fontSize: '14px' }}>account_tree</span>
        Create from Base
      </button>
      <CreateFromBaseDialog open={showDialog} onClose={() => setShowDialog(false)} />
    </>
  );
}
