import 'dotenv/config';
import { buildApp } from './app.js';

const port = Number(process.env.RUNTIME_API_PORT ?? process.env.PORT ?? 4000);

const app = await buildApp();
app.listen({ port, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
