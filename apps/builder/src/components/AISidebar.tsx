'use client';

import { useState } from 'react';

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_API_URL ?? 'http://localhost:4002';

interface AISidebarProps {
  flowJson?: string;
  onFlowGenerated?: (flow: unknown) => void;
}

export function AISidebar({ flowJson, onFlowGenerated }: AISidebarProps) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function callAI(endpoint: string, body: Record<string, unknown>) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${AI_SERVICE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `Error ${res.status}`);
      } else {
        setResult(JSON.stringify(data, null, 2));
        if (onFlowGenerated && data.flow) {
          onFlowGenerated(data.flow);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateFlow() {
    await callAI('/generate/flow', { description: prompt });
  }

  async function handleGenerateStep() {
    await callAI('/generate/step', { description: prompt, existing_step_ids: [] });
  }

  async function handleLint() {
    if (!flowJson) {
      setError('No flow definition to lint');
      return;
    }
    try {
      const flow = JSON.parse(flowJson);
      await callAI('/lint/flow', { flow });
    } catch {
      setError('Invalid flow JSON');
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed right-4 top-20 bg-purple-600 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-purple-700 z-50"
      >
        AI Assistant
      </button>
    );
  }

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl border-l z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b bg-purple-50">
        <h3 className="font-bold text-purple-800">AI Assistant</h3>
        <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-700">
          Close
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Describe what you want</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Create a receiving flow with dock scan, PO lookup, item scan, quantity entry, and putaway location"
            className="w-full border rounded p-2 h-28 text-sm resize-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleGenerateFlow}
            disabled={loading || !prompt}
            className="flex-1 bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700 disabled:opacity-50"
          >
            Generate Flow
          </button>
          <button
            onClick={handleGenerateStep}
            disabled={loading || !prompt}
            className="flex-1 bg-purple-500 text-white px-3 py-2 rounded text-sm hover:bg-purple-600 disabled:opacity-50"
          >
            Gen Step
          </button>
          <button
            onClick={handleLint}
            disabled={loading}
            className="bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 disabled:opacity-50"
          >
            Lint
          </button>
        </div>

        {loading && <div className="text-center text-gray-500 text-sm">Generating...</div>}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {result && (
          <div>
            <label className="block text-sm font-medium mb-1">Result</label>
            <pre className="bg-gray-900 text-green-400 rounded p-3 text-xs overflow-auto max-h-96">
              {result}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
