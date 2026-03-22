import Fastify from 'fastify';

const app = Fastify({ logger: true });

app.get('/health', async () => ({
  status: 'ok',
  service: 'ai-service',
  timestamp: new Date().toISOString(),
}));

const port = Number(process.env.PORT ?? 4002);
app.listen({ port, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
