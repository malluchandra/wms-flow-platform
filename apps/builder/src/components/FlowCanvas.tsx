'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  type OnNodesChange,
  type OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { StepNode } from './StepNode';
import { STEP_META } from '@/lib/step-meta';
import type { FlowGroup } from '@/lib/flow-groups';
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
  selectedStepId: string | null;
  onSelectStep: (stepId: string | null) => void;
  onFlowChange: (flow: FlowDefinition) => void;
  highlightedStepIds?: Set<string>;
  groups?: FlowGroup[];
}

// ─── Transition helpers ─────────────────────────────────────

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

type TransitionInfo = { target: string; key: string; label: string };

function buildEdgesForStep(step: FlowStep): TransitionInfo[] {
  const edges: TransitionInfo[] = [];
  const transitions: Array<[string, TransitionValue | undefined]> = [
    ['on_success', step.on_success],
    ['on_failure', step.on_failure],
    ['on_confirm', step.on_confirm],
    ['on_back', step.on_back],
    ['on_dismiss', step.on_dismiss],
    ['on_skip', step.on_skip],
    ['on_exception', step.on_exception],
    ['on_short_pick', step.on_short_pick],
  ];

  for (const [key, value] of transitions) {
    for (const target of getTransitionTargets(value)) {
      if (target !== '__exit__' && target !== '__abandon__' && !target.startsWith('{{')) {
        edges.push({ target, key, label: key.replace('on_', '') });
      }
    }
  }

  if (step.options) {
    for (const opt of step.options) {
      if (opt.next_step !== '__exit__' && opt.next_step !== '__abandon__' && !opt.next_step.startsWith('{{')) {
        edges.push({ target: opt.next_step, key: 'option', label: opt.label });
      }
    }
  }

  return edges;
}

/** Get edge style based on transition key */
function getEdgeStyle(key: string): { stroke: string; strokeDasharray?: string } {
  if (key.includes('failure') || key.includes('exception')) {
    return { stroke: '#fca5a5', strokeDasharray: '5 3' };
  }
  if (key.includes('short_pick') || key.includes('warn')) {
    return { stroke: '#fcd34d', strokeDasharray: '5 3' };
  }
  if (key.includes('back') || key.includes('dismiss')) {
    return { stroke: '#cbd5e1', strokeDasharray: '4 3' };
  }
  return { stroke: '#94a3b8' };
}

/** Build transition display tags for StepNode data */
function buildTransitionTags(step: FlowStep): Array<{ key: string; display: string }> {
  const tags: Array<{ key: string; display: string }> = [];
  const transitions: Array<[string, TransitionValue | undefined]> = [
    ['on_success', step.on_success],
    ['on_failure', step.on_failure],
    ['on_confirm', step.on_confirm],
    ['on_back', step.on_back],
    ['on_dismiss', step.on_dismiss],
    ['on_skip', step.on_skip],
    ['on_exception', step.on_exception],
    ['on_short_pick', step.on_short_pick],
  ];

  for (const [key, value] of transitions) {
    if (value) {
      const shortKey = key.replace('on_', '');
      if (typeof value === 'string') {
        if (value === '__exit__' || value === '__abandon__') {
          tags.push({ key, display: `\u2192 ${value}` });
        } else {
          tags.push({ key, display: `${shortKey} \u2192` });
        }
      } else if (Array.isArray(value)) {
        for (const cond of value as ConditionalTransition[]) {
          const condLabel = cond.condition.replace(/\{\{response\./, '').replace(/\}\}.*/, '');
          tags.push({ key, display: `${condLabel} \u2192 ${cond.next_step}` });
        }
      } else {
        tags.push({ key, display: `${shortKey} \u2192` });
      }
    }
  }

  if (step.options) {
    tags.push({ key: 'options', display: `${step.options.length} options` });
  }

  return tags;
}

/** Default transition key for each step type when drag-connecting */
function getDefaultTransitionKey(type: string): string {
  switch (type) {
    case 'scan': case 'number_input': case 'api_call': case 'camera_input':
      return 'on_success';
    case 'confirm':
      return 'on_confirm';
    case 'navigate':
      return 'on_confirm';
    case 'message':
      return 'on_dismiss';
    case 'menu_select':
      return 'on_success'; // menu uses options, but fallback to on_success
    default:
      return 'on_success';
  }
}

// ─── Layout: position nodes in columns ──────────────────────

function layoutNodes(flow: FlowDefinition, highlightedStepIds?: Set<string>): Node[] {
  const mainChain: string[] = [];
  const sideNodes: string[] = [];
  const stepById = new Map(flow.steps.map((s) => [s.id, s]));

  // Walk the main chain from entry_step following on_success/on_confirm
  let current = flow.entry_step;
  const visited = new Set<string>();
  while (current && stepById.has(current) && !visited.has(current)) {
    visited.add(current);
    mainChain.push(current);
    const step = stepById.get(current)!;
    const nextTarget =
      getTransitionTargets(step.on_success)[0] ??
      getTransitionTargets(step.on_confirm)[0] ??
      getTransitionTargets(step.on_dismiss)[0];
    current = nextTarget && nextTarget !== '__exit__' && nextTarget !== '__abandon__' ? nextTarget : '';
  }

  // Everything else is a side node
  for (const step of flow.steps) {
    if (!visited.has(step.id)) {
      sideNodes.push(step.id);
    }
  }

  const nodes: Node[] = [];

  // Main column: x=70, spacing y=140
  for (let i = 0; i < mainChain.length; i++) {
    const step = stepById.get(mainChain[i])!;
    nodes.push({
      id: step.id,
      type: 'step',
      position: { x: 70, y: 50 + i * 140 },
      data: {
        label: step.prompt,
        stepType: step.type,
        stepId: step.id,
        isEntry: step.id === flow.entry_step,
        severity: step.severity,
        transitions: buildTransitionTags(step),
        stepSource: step._source,
        extensionPoint: step.extension_point,
        dimmed: highlightedStepIds ? !highlightedStepIds.has(step.id) : false,
      },
    });
  }

  // Side column: x=370, spaced according to which main node references them
  for (let i = 0; i < sideNodes.length; i++) {
    const step = stepById.get(sideNodes[i])!;
    // Try to align vertically with the main node that references this side node
    let yPos = 50 + i * 140;
    for (let j = 0; j < mainChain.length; j++) {
      const mainStep = stepById.get(mainChain[j])!;
      const refs = buildEdgesForStep(mainStep);
      if (refs.some((r) => r.target === step.id)) {
        yPos = 50 + j * 140;
        break;
      }
    }

    // Determine x column based on how many side nodes are at this y position
    const xBase = 370;
    const existingAtY = nodes.filter((n) => Math.abs(n.position.y - yPos) < 20 && n.position.x >= xBase);
    const xOffset = existingAtY.length * 290;

    nodes.push({
      id: step.id,
      type: 'step',
      position: { x: xBase + xOffset, y: yPos },
      data: {
        label: step.prompt,
        stepType: step.type,
        stepId: step.id,
        isEntry: false,
        severity: step.severity,
        transitions: buildTransitionTags(step),
        stepSource: step._source,
        extensionPoint: step.extension_point,
        dimmed: highlightedStepIds ? !highlightedStepIds.has(step.id) : false,
      },
    });
  }

  return nodes;
}

function buildEdges(flow: FlowDefinition): Edge[] {
  const edges: Edge[] = [];
  const stepIds = new Set(flow.steps.map((s) => s.id));

  for (const step of flow.steps) {
    for (const { target, key, label } of buildEdgesForStep(step)) {
      if (stepIds.has(target)) {
        const style = getEdgeStyle(key);
        edges.push({
          id: `${step.id}-${target}-${key}-${label}`,
          source: step.id,
          target,
          label,
          style: { stroke: style.stroke, strokeDasharray: style.strokeDasharray, strokeWidth: 1.5 },
          labelStyle: { fontSize: 9, fill: '#64748b', fontWeight: 500 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 12,
            height: 12,
            color: style.stroke,
          },
        });
      }
    }
  }

  return edges;
}

// ─── Component ──────────────────────────────────────────────

export function FlowCanvas({ flow, selectedStepId, onSelectStep, onFlowChange, highlightedStepIds, groups }: FlowCanvasProps) {
  const initialNodes = useMemo(() => layoutNodes(flow, highlightedStepIds), [flow, highlightedStepIds]);
  const initialEdges = useMemo(() => buildEdges(flow), [flow]);
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const nodesWithGroups = useMemo(() => {
    if (!groups || groups.length === 0) return nodes;
    const groupNodes: Node[] = [];
    for (const group of groups) {
      const memberNodes = nodes.filter((n) => group.stepIds.includes(n.id));
      if (memberNodes.length === 0) continue;
      const minX = Math.min(...memberNodes.map((n) => n.position.x)) - 20;
      const minY = Math.min(...memberNodes.map((n) => n.position.y)) - 30;
      const maxX = Math.max(...memberNodes.map((n) => n.position.x)) + 260;
      const maxY = Math.max(...memberNodes.map((n) => n.position.y)) + 120;
      groupNodes.push({
        id: `group-${group.id}`,
        type: 'default',
        position: { x: minX, y: minY },
        data: { label: group.label },
        style: {
          width: maxX - minX,
          height: maxY - minY,
          background: group.bgColor,
          border: `1px dashed ${group.color}`,
          borderRadius: '8px',
          fontSize: '9px',
          fontWeight: 600,
          color: group.color,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.04em',
          zIndex: -1,
          pointerEvents: 'none' as const,
        },
        selectable: false,
        draggable: false,
      });
    }
    return [...groupNodes, ...nodes];
  }, [groups, nodes]);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onSelectStep(node.id);
    },
    [onSelectStep]
  );

  const handlePaneClick = useCallback(() => {
    onSelectStep(null);
  }, [onSelectStep]);

  /** Handle edge connection: drag from source handle to target handle */
  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      // Update the flow definition: set on_success on the source step → target step
      const updatedFlow: FlowDefinition = {
        ...flow,
        steps: flow.steps.map((step) => {
          if (step.id !== connection.source) return step;
          // Pick the right transition key based on step type
          const key = getDefaultTransitionKey(step.type);
          return { ...step, [key]: connection.target };
        }),
      };
      onFlowChange(updatedFlow);

      // Also add the visual edge immediately
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            style: { stroke: '#94a3b8', strokeWidth: 1.5 },
            markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12, color: '#94a3b8' },
          },
          eds
        )
      );
    },
    [flow, onFlowChange]
  );

  /** Handle drop from left sidebar */
  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const stepType = event.dataTransfer.getData('application/step-type');
      if (!stepType) return;

      const newId = `new-${stepType}-${Date.now()}`;
      const meta = STEP_META[stepType];
      const newStep: FlowStep = {
        id: newId,
        type: stepType as StepType,
        prompt: meta?.label ?? 'New Step',
      };

      const updatedFlow: FlowDefinition = {
        ...flow,
        steps: [...flow.steps, newStep],
      };
      onFlowChange(updatedFlow);

      // Add node at drop position
      const reactFlowBounds = (event.target as HTMLElement).closest('.react-flow')?.getBoundingClientRect();
      const x = reactFlowBounds ? event.clientX - reactFlowBounds.left : 400;
      const y = reactFlowBounds ? event.clientY - reactFlowBounds.top : 200;

      setNodes((prev) => [
        ...prev,
        {
          id: newId,
          type: 'step',
          position: { x, y },
          data: {
            label: meta?.label ?? 'New Step',
            stepType,
            stepId: newId,
            isEntry: false,
            transitions: [],
          },
        },
      ]);

      onSelectStep(newId);
    },
    [flow, onFlowChange, onSelectStep]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  return (
    <div
      className="flex-1 h-full"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <ReactFlow
        nodes={nodesWithGroups}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        connectOnClick={false}
        style={{ background: 'var(--bg-subtle)' }}
      >
        <Background variant={BackgroundVariant.Lines} gap={24} size={1} color="var(--border)" />
        <Controls
          showInteractive={false}
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '4px' }}
        />
      </ReactFlow>
    </div>
  );
}

// ─── Transition rewrite helper (keep from original) ─────────

export function rewriteTransitionRefs(step: FlowStep, oldId: string, newId: string): FlowStep {
  const clone = { ...step };
  const transitionKeys = [
    'on_success', 'on_failure', 'on_confirm', 'on_back',
    'on_dismiss', 'on_skip', 'on_exception', 'on_short_pick', 'on_api_failure',
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
