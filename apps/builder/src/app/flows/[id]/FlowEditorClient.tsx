'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useUndoHistory } from '@/lib/use-undo-history';
import { ToastProvider, useToast } from '@/components/Toast';
import { TopBar, type ViewTab } from '@/components/TopBar';
import { LeftSidebar } from '@/components/LeftSidebar';
import { FlowCanvas, rewriteTransitionRefs } from '@/components/FlowCanvas';
import { RightPanel, type RightPanelHandle } from '@/components/RightPanel';
import { StepDetailPanel } from '@/components/StepDetailPanel';
import { AIPanel } from '@/components/AISidebar';
import { TabShellDesigner } from '@/components/TabShellDesigner';
import { TabShellEnvHub } from '@/components/TabShellEnvHub';
import { TabShellPromotion } from '@/components/TabShellPromotion';
import { SearchBar } from '@/components/SearchBar';
import { searchFlow } from '@/lib/search-utils';
import { STEP_META } from '@/lib/step-meta';
import { analyzeFlowGroups } from '@/lib/flow-groups';
import type { FlowGroup } from '@/lib/flow-groups';
import type { FlowDefinition, FlowStep, StepType } from '@wms/types';

interface FlowEditorClientProps {
  flowId: string;
  flowName: string;
  flowVersion: string;
  displayName: string;
  environment: string;
  initialFlow: FlowDefinition;
  onSave: (definition: FlowDefinition) => Promise<void>;
}

function FlowEditorInner({
  flowId,
  flowName,
  flowVersion,
  displayName,
  environment,
  initialFlow,
  onSave,
}: FlowEditorClientProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<ViewTab>('logic');
  const {
    state: currentFlow,
    setState: setCurrentFlow,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoHistory<FlowDefinition>(structuredClone(initialFlow));
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const rightPanelRef = useRef<RightPanelHandle>(null);

  const selectedStep = selectedStepId
    ? currentFlow.steps.find((s) => s.id === selectedStepId) ?? null
    : null;

  // ─── Save handler ─────────────────────────────────────────

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onSave(currentFlow);
      showToast('Draft saved');
    } catch (err) {
      showToast('Save failed');
    } finally {
      setSaving(false);
    }
  }, [currentFlow, onSave, showToast]);

  const handlePublish = useCallback(() => {
    showToast('Publishing to QA...');
  }, [showToast]);

  // ─── Step operations ──────────────────────────────────────

  const handleAddStep = useCallback(
    (type: string) => {
      const meta = STEP_META[type];
      const newId = `new-${type}-${Date.now()}`;
      const newStep: FlowStep = {
        id: newId,
        type: type as StepType,
        prompt: meta?.label ?? 'New Step',
      };
      setCurrentFlow((prev) => ({
        ...prev,
        steps: [...prev.steps, newStep],
      }));
      setSelectedStepId(newId);
      rightPanelRef.current?.switchTo('props');
      showToast(`Added ${meta?.label ?? type} step`);
    },
    [showToast]
  );

  const handleSelectStep = useCallback((stepId: string | null) => {
    setSelectedStepId(stepId);
    if (stepId) {
      rightPanelRef.current?.switchTo('props');
    }
  }, []);

  const handleUpdateStep = useCallback(
    (updated: FlowStep) => {
      setCurrentFlow((prev) => {
        const oldStep = prev.steps.find((s) => s.id === selectedStepId);
        const idChanged = oldStep && oldStep.id !== updated.id;
        const next: FlowDefinition = {
          ...prev,
          steps: prev.steps.map((s) => (s.id === selectedStepId ? updated : s)),
        };
        if (idChanged && selectedStepId) {
          if (next.entry_step === selectedStepId) {
            next.entry_step = updated.id;
          }
          next.steps = next.steps.map((s) => rewriteTransitionRefs(s, selectedStepId, updated.id));
        }
        return next;
      });
      setSelectedStepId(updated.id);
      showToast('Step saved');
    },
    [selectedStepId, showToast]
  );

  const handleDeleteStep = useCallback(() => {
    if (!selectedStepId) return;
    const step = currentFlow.steps.find((s) => s.id === selectedStepId);
    if (step?._source === 'base') {
      showToast('Cannot delete inherited base step');
      return;
    }
    setCurrentFlow((prev) => ({
      ...prev,
      steps: prev.steps.filter((s) => s.id !== selectedStepId),
    }));
    setSelectedStepId(null);
    showToast('Step deleted');
  }, [selectedStepId, currentFlow.steps, showToast]);

  const handleDuplicateStep = useCallback(() => {
    if (!selectedStep) return;
    const newId = `${selectedStep.id}-copy-${Date.now()}`;
    const dup: FlowStep = { ...structuredClone(selectedStep), id: newId };
    setCurrentFlow((prev) => ({
      ...prev,
      steps: [...prev.steps, dup],
    }));
    setSelectedStepId(newId);
    showToast('Step duplicated');
  }, [selectedStep, showToast]);

  const handleFlowChange = useCallback((updatedFlow: FlowDefinition) => {
    setCurrentFlow(updatedFlow);
  }, []);

  const handleFocusAI = useCallback(() => {
    rightPanelRef.current?.switchTo('ai');
  }, []);

  // ─── Linter status ────────────────────────────────────────

  const linterPass = currentFlow.steps.some((s) => s.id === 'exception-handler') &&
    currentFlow.steps.some((s) => JSON.stringify(s).includes('__exit__'));

  const searchResults = searchQuery ? searchFlow(currentFlow, searchQuery) : [];
  const highlightedStepIds = searchQuery
    ? new Set(searchResults.map((r) => r.stepId))
    : undefined;

  const flowGroups = useMemo(() => analyzeFlowGroups(currentFlow), [currentFlow]);

  // ─── Keyboard shortcuts ───────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if (mod && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
        return;
      }
      if (mod && e.key === 's') {
        e.preventDefault();
        handleSave();
        return;
      }
      if (mod && e.key === 'f') {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedStepId) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
          e.preventDefault();
          handleDeleteStep();
        }
        return;
      }
      if (e.key === 'Escape') {
        setSelectedStepId(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, handleSave, handleDeleteStep, selectedStepId]);

  // ─── Render ───────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen">
      <TopBar
        flowName={flowName}
        flowVersion={flowVersion}
        displayName={displayName}
        environment={environment}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSave={handleSave}
        onPublish={handlePublish}
        saving={saving}
        linterPass={linterPass}
        extensionMode={currentFlow.extension_mode}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      <div className="flex flex-1 overflow-hidden" style={{ paddingTop: 'var(--topbar-h)' }}>
        {/* Logic View */}
        {activeTab === 'logic' && (
          <>
            <LeftSidebar
              flow={currentFlow}
              onAddStep={handleAddStep}
              onFocusAI={handleFocusAI}
            />
            <div className="flex-1 relative h-full flex flex-col">
              {searchOpen && (
                <SearchBar
                  results={searchResults}
                  query={searchQuery}
                  onQueryChange={setSearchQuery}
                  onSelectResult={(stepId) => {
                    handleSelectStep(stepId);
                    setSearchQuery('');
                  }}
                  onClose={() => {
                    setSearchOpen(false);
                    setSearchQuery('');
                  }}
                />
              )}
              <FlowCanvas
                flow={currentFlow}
                selectedStepId={selectedStepId}
                onSelectStep={handleSelectStep}
                onFlowChange={handleFlowChange}
                highlightedStepIds={highlightedStepIds}
                groups={flowGroups}
              />
            </div>
            <RightPanel
              ref={rightPanelRef}
              aiContent={
                <AIPanel
                  flowName={flowName}
                  flowJson={JSON.stringify(currentFlow)}
                  onFlowGenerated={(f) => handleFlowChange(f as FlowDefinition)}
                />
              }
              propsContent={
                selectedStep ? (
                  <StepDetailPanel
                    key={selectedStep.id}
                    step={selectedStep}
                    onUpdate={handleUpdateStep}
                    onDelete={handleDeleteStep}
                    onDuplicate={handleDuplicateStep}
                  />
                ) : (
                  <div
                    className="flex-1 flex items-center justify-center"
                    style={{ padding: '32px 14px', color: 'var(--text-xmuted)', fontSize: '12px', textAlign: 'center' }}
                  >
                    Click any node on the canvas to inspect its properties
                  </div>
                )
              }
            />
          </>
        )}

        {/* UI Designer */}
        {activeTab === 'designer' && (
          <TabShellDesigner
            flow={currentFlow}
            selectedStepId={selectedStepId}
            onSelectStep={handleSelectStep}
          />
        )}

        {/* Environment Hub */}
        {activeTab === 'envhub' && <TabShellEnvHub />}

        {/* Flow Promotion */}
        {activeTab === 'promote' && <TabShellPromotion />}
      </div>
    </div>
  );
}

export function FlowEditorClient(props: FlowEditorClientProps) {
  return (
    <ToastProvider>
      <FlowEditorInner {...props} />
    </ToastProvider>
  );
}
