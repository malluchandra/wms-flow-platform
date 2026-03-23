import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Load .env from monorepo root (2 levels up from apps/runtime-api/)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { buildApp } from './app.js';

const port = Number(process.env.RUNTIME_API_PORT ?? process.env.PORT ?? 4000);

const app = await buildApp();
app.listen({ port, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
