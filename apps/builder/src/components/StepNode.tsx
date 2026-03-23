'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';

const TYPE_COLORS: Record<string, string> = {
  navigate: 'border-blue-400 bg-blue-50',
  scan: 'border-green-400 bg-green-50',
  number_input: 'border-yellow-400 bg-yellow-50',
  confirm: 'border-purple-400 bg-purple-50',
  menu_select: 'border-orange-400 bg-orange-50',
  message: 'border-gray-400 bg-gray-50',
  api_call: 'border-red-400 bg-red-50',
};

export function StepNode({ data }: NodeProps) {
  const colorClass = TYPE_COLORS[data.stepType as string] ?? 'border-gray-300 bg-white';

  return (
    <div className={`border-2 rounded-lg px-4 py-3 min-w-[180px] shadow-sm ${colorClass}`}>
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">{data.stepType as string}</div>
      <div className="font-medium text-sm">{data.label as string}</div>
      <div className="text-xs text-gray-400 mt-1">{data.stepId as string}</div>
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
    </div>
  );
}
