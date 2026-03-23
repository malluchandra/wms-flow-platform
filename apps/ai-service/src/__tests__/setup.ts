import dotenv from 'dotenv';
import path from 'path';

// Load .env from monorepo root before any test modules are evaluated.
// cwd when running vitest from apps/ai-service is apps/ai-service.
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
