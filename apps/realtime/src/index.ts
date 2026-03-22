import http from 'node:http';

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'realtime',
      timestamp: new Date().toISOString(),
    }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

const port = Number(process.env.PORT ?? 4001);
server.listen(port, '0.0.0.0', () => {
  console.log(`realtime listening on :${port}`);
});
