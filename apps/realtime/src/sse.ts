import type { ServerResponse } from 'node:http';

const HEARTBEAT_INTERVAL = 30_000;

export class SseConnection {
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private closed = false;

  constructor(
    public readonly id: string,
    public readonly res: ServerResponse,
    public readonly channels: string[],
    private readonly onClose: (conn: SseConnection) => void
  ) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    this.heartbeatTimer = setInterval(() => {
      if (!this.closed) {
        this.res.write(':heartbeat\n\n');
      }
    }, HEARTBEAT_INTERVAL);

    res.on('close', () => this.close());
  }

  send(eventType: string, data: string): void {
    if (this.closed) return;
    this.res.write(`event: ${eventType}\n`);
    this.res.write(`data: ${data}\n\n`);
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.onClose(this);
    if (!this.res.writableEnded) {
      this.res.end();
    }
  }
}
