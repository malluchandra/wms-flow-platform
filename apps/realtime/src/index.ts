import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';
import { RedisSubscriber } from './subscriber.js';
import { createRouter } from './router.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const PORT = Number(process.env.REALTIME_PORT ?? process.env.PORT ?? 4001);
const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';

export async function startServer(portOverride?: number): Promise<http.Server & { subscriber: RedisSubscriber }> {
  const port = portOverride ?? PORT;
  const subscriber = new RedisSubscriber(REDIS_URL);
  await subscriber.connect();

  const router = createRouter(subscriber, JWT_SECRET);
  const server = http.createServer(router) as http.Server & { subscriber: RedisSubscriber };
  server.subscriber = subscriber;

  return new Promise((resolve) => {
    server.listen(port, '0.0.0.0', () => {
      console.log(`realtime listening on :${port}`);
      resolve(server);
    });
  });
}

// Auto-start when run as main module
const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMainModule) {
  startServer();
}
