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
import type { FlowDefinition, FlowStep, TransitionValue, TransitionHandler, ConditionalTransition } from '@wms/types';

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
  if (Array.isArray(value)) return (value as ConditionalTransition[]).map(c => c.next_step);
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
      if (opt.next_step !== '__exit__' && opt.next_step !== '__abandon__' && !opt.next_step.startsWith('{{')) {
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
  const stepIds = new Set(flow.steps.map(s => s.id));

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
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => flowToNodesAndEdges(flow), [flow]);
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [saving, setSaving] = useState(false);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onSave(flow);
    } finally {
      setSaving(false);
    }
  }, [flow, onSave]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-50"
      >
        <Background />
        <Controls />
        <MiniMap />
        <Panel position="top-right">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Flow'}
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
}
