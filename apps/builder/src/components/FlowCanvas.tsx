'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { StepNode } from './StepNode';
import { StepDetailPanel } from './StepDetailPanel';
import type {
  FlowDefinition,
  FlowStep,
  StepType,
  TransitionValue,
  TransitionHandler,
  ConditionalTransition,
} from '@wms/types';

const nodeTypes = { step: StepNode };

interface FlowCanvasProps {
  flow: FlowDefinition;
  flowId: string;
  onSave: (definition: FlowDefinition) => Promise<void>;
}

/** Extract all step ID references from a transition value */
function getTransitionTargets(value: TransitionValue | undefined): string[] {
  if (!value) return [];
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return (value as ConditionalTransition[]).map((c) => c.next_step);
  const handler = value as TransitionHandler;
  const targets = handler.next_step ? [handler.next_step] : [];
  if (handler.on_api_failure && typeof handler.on_api_failure === 'string') {
    targets.push(handler.on_api_failure);
  }
  return targets;
}

/** Build edges from a step's transitions */
function buildEdgesForStep(step: FlowStep): Array<{ target: string; label: string }> {
  const edges: Array<{ target: string; label: string }> = [];
  const transitions: Array<[string, TransitionValue | undefined]> = [
    ['success', step.on_success],
    ['failure', step.on_failure],
    ['confirm', step.on_confirm],
    ['back', step.on_back],
    ['dismiss', step.on_dismiss],
    ['skip', step.on_skip],
    ['exception', step.on_exception],
    ['short_pick', step.on_short_pick],
  ];

  for (const [label, value] of transitions) {
    for (const target of getTransitionTargets(value)) {
      if (target !== '__exit__' && target !== '__abandon__' && !target.startsWith('{{')) {
        edges.push({ target, label });
      }
    }
  }

  // Menu options
  if (step.options) {
    for (const opt of step.options) {
      if (
        opt.next_step !== '__exit__' &&
        opt.next_step !== '__abandon__' &&
        !opt.next_step.startsWith('{{')
      ) {
        edges.push({ target: opt.next_step, label: opt.label });
      }
    }
  }

  return edges;
}

function flowToNodesAndEdges(flow: FlowDefinition): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = flow.steps.map((step, i) => ({
    id: step.id,
    type: 'step',
    position: { x: 300 * (i % 4), y: 200 * Math.floor(i / 4) },
    data: { label: step.prompt, stepType: step.type, stepId: step.id },
  }));

  const edges: Edge[] = [];
  const stepIds = new Set(flow.steps.map((s) => s.id));

  for (const step of flow.steps) {
    for (const { target, label } of buildEdgesForStep(step)) {
      if (stepIds.has(target)) {
        edges.push({
          id: `${step.id}-${target}-${label}`,
          source: step.id,
          target,
          label,
          style: { stroke: '#94a3b8' },
          labelStyle: { fontSize: 10, fill: '#64748b' },
        });
      }
    }
  }

  return { nodes, edges };
}

export function FlowCanvas({ flow, flowId, onSave }: FlowCanvasProps) {
  // Mutable copy of the full flow definition
  const [currentFlow, setCurrentFlow] = useState<FlowDefinition>(() => structuredClone(flow));
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => flowToNodesAndEdges(currentFlow),
    // Only compute on mount — we manage nodes/edges manually after that
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [saving, setSaving] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  const selectedStep = useMemo(
    () => (selectedStepId ? currentFlow.steps.find((s) => s.id === selectedStepId) ?? null : null),
    [selectedStepId, currentFlow]
  );

  /** Rebuild nodes and edges from the current flow state */
  const rebuildGraph = useCallback((flowDef: FlowDefinition) => {
    const { nodes: newNodes, edges: newEdges } = flowToNodesAndEdges(flowDef);
    setNodes(newNodes);
    setEdges(newEdges);
  }, []);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedStepId(node.id);
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedStepId(null);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onSave(currentFlow);
    } finally {
      setSaving(false);
    }
  }, [currentFlow, onSave]);

  /** Update a step in the flow definition */
  const handleUpdateStep = useCallback(
    (updated: FlowStep) => {
      setCurrentFlow((prev) => {
        const oldStep = prev.steps.find((s) => s.id === selectedStepId);
        const idChanged = oldStep && oldStep.id !== updated.id;
        const next: FlowDefinition = {
          ...prev,
          steps: prev.steps.map((s) => (s.id === selectedStepId ? updated : s)),
        };
        // If the step ID changed, update the entry_step reference and all transition references
        if (idChanged && selectedStepId) {
          if (next.entry_step === selectedStepId) {
            next.entry_step = updated.id;
          }
          next.steps = next.steps.map((s) => rewriteTransitionRefs(s, selectedStepId, updated.id));
        }
        rebuildGraph(next);
        return next;
      });
      setSelectedStepId(updated.id);
    },
    [selectedStepId, rebuildGraph]
  );

  /** Delete a step from the flow */
  const handleDeleteStep = useCallback(() => {
    if (!selectedStepId) return;
    setCurrentFlow((prev) => {
      const next: FlowDefinition = {
        ...prev,
        steps: prev.steps.filter((s) => s.id !== selectedStepId),
      };
      rebuildGraph(next);
      return next;
    });
    setSelectedStepId(null);
  }, [selectedStepId, rebuildGraph]);

  /** Add a new blank step */
  const handleAddStep = useCallback(() => {
    const newId = `new_step_${Date.now()}`;
    const newStep: FlowStep = {
      id: newId,
      type: 'message' as StepType,
      prompt: 'New Step',
    };
    setCurrentFlow((prev) => {
      const next: FlowDefinition = {
        ...prev,
        steps: [...prev.steps, newStep],
      };
      rebuildGraph(next);
      return next;
    });
    setSelectedStepId(newId);
  }, [rebuildGraph]);

  const handleClosePanel = useCallback(() => {
    setSelectedStepId(null);
  }, []);

  return (
    <div className="h-full w-full flex">
      <div className={`flex-1 ${selectedStep ? '' : 'w-full'}`}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gray-50"
        >
          <Background />
          <Controls />
          <MiniMap />
          <Panel position="top-right">
            <div className="flex gap-2">
              <button
                onClick={handleAddStep}
                className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700"
              >
                + Add Step
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Flow'}
              </button>
            </div>
          </Panel>
        </ReactFlow>
      </div>
      {selectedStep && (
        <StepDetailPanel
          key={selectedStep.id}
          step={selectedStep}
          onUpdate={handleUpdateStep}
          onDelete={handleDeleteStep}
          onClose={handleClosePanel}
        />
      )}
    </div>
  );
}

/** Rewrite all transition references from oldId to newId within a step */
function rewriteTransitionRefs(step: FlowStep, oldId: string, newId: string): FlowStep {
  const clone = { ...step };
  const transitionKeys = [
    'on_success',
    'on_failure',
    'on_confirm',
    'on_back',
    'on_dismiss',
    'on_skip',
    'on_exception',
    'on_short_pick',
    'on_api_failure',
  ] as const;

  for (const key of transitionKeys) {
    const val = clone[key];
    if (!val) continue;
    if (typeof val === 'string') {
      if (val === oldId) {
        (clone as Record<string, unknown>)[key] = newId;
      }
    } else if (Array.isArray(val)) {
      (clone as Record<string, unknown>)[key] = (val as ConditionalTransition[]).map((c) => ({
        ...c,
        next_step: c.next_step === oldId ? newId : c.next_step,
      }));
    } else {
      const handler = val as TransitionHandler;
      if (handler.next_step === oldId) {
        (clone as Record<string, unknown>)[key] = { ...handler, next_step: newId };
      }
    }
  }

  if (clone.options) {
    clone.options = clone.options.map((opt) => ({
      ...opt,
      next_step: opt.next_step === oldId ? newId : opt.next_step,
    }));
  }

  return clone;
}
