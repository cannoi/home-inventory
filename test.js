const http = require('http');
const app = require('./server');

const PORT = process.env.PORT || 8080;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  http.get(`http://127.0.0.1:${PORT}/health`, (res) => {
    console.log(`Health check status: ${res.statusCode}`);
    server.close(() => {
      console.log('Test server closed successfully.');
      process.exit(res.statusCode === 200 ? 0 : 1);
    });
  }).on('error', (err) => {
    console.error('Health check failed:', err.message);
    server.close(() => {
      process.exit(1);
    });
  });
});
