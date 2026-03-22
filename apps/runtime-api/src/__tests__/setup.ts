import dotenv from 'dotenv';
import path from 'path';

// Load .env from monorepo root before any test modules are evaluated.
// cwd when running vitest from apps/runtime-api is apps/runtime-api.
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
