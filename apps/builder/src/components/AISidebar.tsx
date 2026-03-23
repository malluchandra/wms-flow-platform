'use client';

import { useState, useRef, useEffect } from 'react';

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_API_URL ?? 'http://localhost:4002';

interface AIPanelProps {
  flowName?: string;
  flowJson?: string;
  onFlowGenerated?: (flow: unknown) => void;
}

interface ChatMessage {
  role: 'system' | 'user';
  content: string;
  generatedJson?: string;
}

export function AIPanel({ flowName, flowJson, onFlowGenerated }: AIPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'system',
      content: flowName
        ? `I'm ready to help with <strong>${flowName}</strong>. Ask me to generate steps, lint the flow, or describe changes in plain English.`
        : 'Select or create a flow to get started. I can generate complete flows from descriptions or individual steps.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function callAI(endpoint: string, body: Record<string, unknown>) {
    setLoading(true);
    try {
      const res = await fetch(`${AI_SERVICE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((prev) => [...prev, { role: 'system', content: `Error: ${data.error ?? res.status}` }]);
      } else {
        const json = JSON.stringify(data, null, 2);
        setMessages((prev) => [...prev, { role: 'system', content: 'Generated:', generatedJson: json }]);
        if (onFlowGenerated && data.flow) {
          onFlowGenerated(data.flow);
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'system', content: `Network error: ${err instanceof Error ? err.message : 'unknown'}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSend() {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: msg }]);

    // Default to generate step
    callAI('/generate/step', { description: msg, existing_step_ids: [] });
  }

  function handleGenerateFlow() {
    if (!input.trim()) return;
    const msg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: `Generate flow: ${msg}` }]);
    callAI('/generate/flow', { description: msg });
  }

  function handleLint() {
    if (!flowJson) return;
    setMessages((prev) => [...prev, { role: 'user', content: 'Lint current flow' }]);
    try {
      const flow = JSON.parse(flowJson);
      callAI('/lint/flow', { flow });
    } catch {
      setMessages((prev) => [...prev, { role: 'system', content: 'Invalid flow JSON' }]);
    }
  }

  return (
    <>
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-2.5">
        {/* Header */}
        <div className="flex items-center gap-1.5 pb-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="ms-fill" style={{ fontSize: '16px', color: 'var(--accent)' }}>bolt</span>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand)' }}>AI Flow Assistant</span>
          <span
            className="ml-auto"
            style={{
              fontSize: '9px',
              background: 'var(--success-lt)',
              color: 'var(--success)',
              padding: '2px 6px',
              borderRadius: '10px',
              fontWeight: 600,
            }}
          >
            Active
          </span>
        </div>

        {/* Chat messages */}
        {messages.map((msg, i) => (
          <div key={i} className={`ai-msg ${msg.role}`}>
            <span dangerouslySetInnerHTML={{ __html: msg.content }} />
            {msg.generatedJson && (
              <pre
                className="mono"
                style={{
                  fontSize: '9px',
                  background: 'var(--bg-muted)',
                  padding: '10px',
                  borderRadius: '3px',
                  marginTop: '8px',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.7,
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}
              >
                {msg.generatedJson}
              </pre>
            )}
          </div>
        ))}

        {loading && (
          <div className="ai-msg system">
            Generating... <span style={{ animation: 'pulse-green 1s infinite' }}>...</span>
          </div>
        )}

        {/* Quick action buttons */}
        <div className="flex gap-1.5 mt-1">
          <button
            className="btn-ghost btn-sm"
            style={{ fontSize: '9px', flex: 1 }}
            onClick={handleGenerateFlow}
            disabled={loading || !input.trim()}
          >
            Gen Flow
          </button>
          <button
            className="btn-ghost btn-sm"
            style={{ fontSize: '9px', flex: 1 }}
            onClick={handleSend}
            disabled={loading || !input.trim()}
          >
            Gen Step
          </button>
          <button
            className="btn-ghost btn-sm"
            style={{ fontSize: '9px', flex: 1 }}
            onClick={handleLint}
            disabled={loading}
          >
            Lint
          </button>
        </div>
      </div>

      {/* Input bar */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Describe a step or ask a question..."
            className="prop-input"
            style={{ paddingRight: '34px', fontFamily: "'Inter', sans-serif" }}
          />
          <span
            className="ms"
            onClick={handleSend}
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--accent)',
              cursor: 'pointer',
              fontSize: '18px',
            }}
          >
            send
          </span>
        </div>
      </div>
    </>
  );
}
