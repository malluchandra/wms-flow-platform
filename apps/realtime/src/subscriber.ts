import { Redis } from 'ioredis';
import type { SseConnection } from './sse.js';

export class RedisSubscriber {
  private subscriber: Redis;
  private connections = new Map<string, SseConnection>();

  constructor(redisUrl: string) {
    this.subscriber = new Redis(redisUrl, { lazyConnect: true });

    this.subscriber.on('message', (channel: string, message: string) => {
      this.routeMessage(channel, message);
    });

    // Suppress connection-closed errors during shutdown
    this.subscriber.on('error', (err: Error) => {
      if (err.message === 'Connection is closed.') return;
      console.error('Redis subscriber error:', err);
    });
  }

  async connect(): Promise<void> {
    await this.subscriber.connect();
  }

  async addConnection(conn: SseConnection): Promise<void> {
    this.connections.set(conn.id, conn);
    for (const channel of conn.channels) {
      await this.subscriber.subscribe(channel);
    }
  }

  async removeConnection(conn: SseConnection): Promise<void> {
    this.connections.delete(conn.id);

    const activeChannels = new Set<string>();
    for (const c of this.connections.values()) {
      for (const ch of c.channels) {
        activeChannels.add(ch);
      }
    }

    for (const channel of conn.channels) {
      if (!activeChannels.has(channel)) {
        await this.subscriber.unsubscribe(channel);
      }
    }
  }

  private routeMessage(channel: string, message: string): void {
    let eventType = 'message';
    try {
      const parsed = JSON.parse(message);
      if (parsed.type) eventType = parsed.type;
    } catch { /* use default */ }

    for (const conn of this.connections.values()) {
      if (conn.channels.includes(channel)) {
        conn.send(eventType, message);
      }
    }
  }

  async close(): Promise<void> {
    this.connections.clear();
    try {
      await this.subscriber.unsubscribe();
      await this.subscriber.quit();
    } catch {
      this.subscriber.disconnect();
    }
  }
}
