'use client';

import { useState } from 'react';
import type { FlowStep, StepType } from '@wms/types';

interface StepDetailPanelProps {
  step: FlowStep;
  onUpdate: (updated: FlowStep) => void;
  onDelete: () => void;
  onClose: () => void;
}

const STEP_TYPES: StepType[] = [
  'navigate',
  'scan',
  'number_input',
  'confirm',
  'menu_select',
  'message',
  'camera_input',
  'api_call',
  'print',
];

export function StepDetailPanel({ step, onUpdate, onDelete, onClose }: StepDetailPanelProps) {
  const [editing, setEditing] = useState<FlowStep>({ ...step });

  function handleChange(field: string, value: unknown) {
    setEditing((prev) => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    onUpdate(editing);
  }

  return (
    <div className="w-96 bg-white border-l shadow-xl overflow-y-auto h-full">
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-10">
        <h3 className="font-bold text-sm">Step Details</h3>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            Apply
          </button>
          <button onClick={onClose} className="text-xs text-gray-500 hover:text-gray-700">
            Close
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 text-sm">
        {/* ID */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Step ID</label>
          <input
            value={editing.id}
            onChange={(e) => handleChange('id', e.target.value)}
            className="w-full border rounded px-2 py-1 text-sm font-mono"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
          <select
            value={editing.type}
            onChange={(e) => handleChange('type', e.target.value)}
            className="w-full border rounded px-2 py-1 text-sm"
          >
            {STEP_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Prompt */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Prompt</label>
          <input
            value={editing.prompt}
            onChange={(e) => handleChange('prompt', e.target.value)}
            className="w-full border rounded px-2 py-1 text-sm"
          />
        </div>

        {/* Message-specific fields */}
        {editing.type === 'message' && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Body</label>
              <textarea
                value={editing.body ?? ''}
                onChange={(e) => handleChange('body', e.target.value)}
                className="w-full border rounded px-2 py-1 text-sm h-20 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Severity</label>
              <select
                value={editing.severity ?? 'info'}
                onChange={(e) => handleChange('severity', e.target.value)}
                className="w-full border rounded px-2 py-1 text-sm"
              >
                <option value="info">info</option>
                <option value="error">error</option>
                <option value="success">success</option>
              </select>
            </div>
          </>
        )}

        {/* Scan-specific fields */}
        {editing.type === 'scan' && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Expected Value</label>
              <input
                value={editing.expected_value ?? ''}
                onChange={(e) => handleChange('expected_value', e.target.value)}
                className="w-full border rounded px-2 py-1 text-sm font-mono"
                placeholder="{{context.task_line.location.barcode}}"
              />
            </div>
            {editing.validation && (
              <div className="bg-gray-50 rounded p-3 space-y-2">
                <div className="text-xs font-medium text-gray-500">Validation</div>
                <div className="text-xs">
                  <span className="text-gray-400">Type:</span> {editing.validation.type}
                </div>
                {editing.validation.endpoint && (
                  <div className="text-xs">
                    <span className="text-gray-400">Endpoint:</span>{' '}
                    <span className="font-mono">{editing.validation.endpoint}</span>
                  </div>
                )}
                {editing.validation.error_message && (
                  <div className="text-xs">
                    <span className="text-gray-400">Error:</span> {editing.validation.error_message}
                  </div>
                )}
                {editing.validation.payload && (
                  <div className="text-xs">
                    <span className="text-gray-400">Payload:</span>
                    <pre className="mt-1 font-mono text-xs">
                      {JSON.stringify(editing.validation.payload, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Number input-specific fields */}
        {editing.type === 'number_input' && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">UOM</label>
              <input
                value={editing.uom ?? ''}
                onChange={(e) => handleChange('uom', e.target.value)}
                className="w-full border rounded px-2 py-1 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Target</label>
              <input
                value={editing.target ?? ''}
                onChange={(e) => handleChange('target', e.target.value)}
                className="w-full border rounded px-2 py-1 text-sm font-mono"
              />
            </div>
            {editing.validation && (
              <div className="bg-gray-50 rounded p-3 space-y-1">
                <div className="text-xs font-medium text-gray-500">Validation</div>
                {editing.validation.min !== undefined && (
                  <div className="text-xs">
                    <span className="text-gray-400">Min:</span> {String(editing.validation.min)}
                  </div>
                )}
                {editing.validation.max !== undefined && (
                  <div className="text-xs">
                    <span className="text-gray-400">Max:</span> {String(editing.validation.max)}
                  </div>
                )}
                {editing.validation.short_pick_threshold !== undefined && (
                  <div className="text-xs">
                    <span className="text-gray-400">Short pick threshold:</span>{' '}
                    {editing.validation.short_pick_threshold}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Navigate display fields */}
        {editing.type === 'navigate' && editing.display && (
          <div className="bg-gray-50 rounded p-3 space-y-1">
            <div className="text-xs font-medium text-gray-500">Display Fields</div>
            {Object.entries(editing.display).map(([k, v]) => (
              <div key={k} className="text-xs">
                <span className="text-gray-400">{k}:</span>{' '}
                <span className="font-mono">{v}</span>
              </div>
            ))}
          </div>
        )}

        {/* Confirm summary fields */}
        {editing.type === 'confirm' && editing.summary_fields && (
          <div className="bg-gray-50 rounded p-3">
            <div className="text-xs font-medium text-gray-500 mb-1">Summary Fields</div>
            <div className="text-xs font-mono">{editing.summary_fields.join(', ')}</div>
          </div>
        )}

        {/* Menu select options */}
        {editing.type === 'menu_select' && editing.options && (
          <div className="bg-gray-50 rounded p-3 space-y-1">
            <div className="text-xs font-medium text-gray-500">Options</div>
            {editing.options.map((opt, i) => (
              <div key={i} className="text-xs flex justify-between">
                <span>{opt.label}</span>
                <span className="font-mono text-gray-400">{opt.next_step}</span>
              </div>
            ))}
          </div>
        )}

        {/* API call fields */}
        {editing.type === 'api_call' && (
          <div className="bg-gray-50 rounded p-3 space-y-1">
            <div className="text-xs font-medium text-gray-500">API Call</div>
            <div className="text-xs">
              <span className="text-gray-400">Method:</span> {editing.method}
            </div>
            <div className="text-xs">
              <span className="text-gray-400">Endpoint:</span>{' '}
              <span className="font-mono">{editing.endpoint}</span>
            </div>
            {editing.payload && (
              <div className="text-xs">
                <span className="text-gray-400">Payload:</span>
                <pre className="mt-1 font-mono text-xs">
                  {JSON.stringify(editing.payload, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Transitions section */}
        <div className="border-t pt-4">
          <div className="text-xs font-medium text-gray-500 mb-2">Transitions</div>
          {(
            [
              'on_success',
              'on_failure',
              'on_confirm',
              'on_back',
              'on_dismiss',
              'on_skip',
              'on_exception',
              'on_short_pick',
              'on_api_failure',
            ] as const
          ).map((key) => {
            const val = editing[key];
            if (!val) return null;
            return (
              <div key={key} className="mb-2">
                <div className="text-xs text-gray-400">{key}</div>
                <pre className="text-xs font-mono bg-gray-50 rounded p-2 mt-1 overflow-x-auto">
                  {typeof val === 'string' ? val : JSON.stringify(val, null, 2)}
                </pre>
              </div>
            );
          })}
        </div>

        {/* Raw JSON */}
        <div className="border-t pt-4">
          <details>
            <summary className="text-xs font-medium text-gray-500 cursor-pointer">
              Raw JSON
            </summary>
            <pre className="text-xs font-mono bg-gray-900 text-green-400 rounded p-3 mt-2 overflow-x-auto max-h-64">
              {JSON.stringify(editing, null, 2)}
            </pre>
          </details>
        </div>

        {/* Delete */}
        <div className="border-t pt-4">
          <button
            onClick={onDelete}
            className="w-full text-red-600 border border-red-200 rounded py-2 text-sm hover:bg-red-50"
          >
            Delete Step
          </button>
        </div>
      </div>
    </div>
  );
}
