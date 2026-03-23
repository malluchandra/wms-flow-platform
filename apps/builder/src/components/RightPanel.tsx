'use client';

import { useState, forwardRef, useImperativeHandle } from 'react';

export type PanelTab = 'ai' | 'props';

export interface RightPanelHandle {
  switchTo: (tab: PanelTab) => void;
}

interface RightPanelProps {
  aiContent: React.ReactNode;
  propsContent: React.ReactNode;
  defaultTab?: PanelTab;
}

export const RightPanel = forwardRef<RightPanelHandle, RightPanelProps>(
  function RightPanel({ aiContent, propsContent, defaultTab = 'ai' }, ref) {
    const [activeTab, setActiveTab] = useState<PanelTab>(defaultTab);

    useImperativeHandle(ref, () => ({
      switchTo: (tab: PanelTab) => setActiveTab(tab),
    }));

    return (
      <div
        className="flex flex-col flex-shrink-0"
        style={{
          width: 'var(--right-panel-w)',
          background: 'var(--bg)',
          borderLeft: '1px solid var(--border)',
        }}
      >
        {/* Tab bar */}
        <div className="flex" style={{ borderBottom: '1px solid var(--border)' }}>
          <button
            className={`panel-tab ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            AI Assist
          </button>
          <button
            className={`panel-tab ${activeTab === 'props' ? 'active' : ''}`}
            onClick={() => setActiveTab('props')}
          >
            Properties
          </button>
        </div>

        {/* Panel content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className={`flex-1 flex flex-col overflow-hidden ${activeTab === 'ai' ? '' : 'hidden'}`}>
            {aiContent}
          </div>
          <div className={`flex-1 flex flex-col overflow-y-auto ${activeTab === 'props' ? '' : 'hidden'}`}>
            {propsContent}
          </div>
        </div>
      </div>
    );
  }
);
