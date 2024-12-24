const path = require('path');
const fs = require('fs');
const http = require('http');
const { keepAlive } = require('../../../src/keepalive'); // Adjust as per project structure

describe('Lazy Compilation KeepAlive Tests', () => {
  const testDirectory = path.resolve(__dirname, 'lazy-compilation-test'); // Temporary test directory
  let server;

  beforeAll((done) => {
    // Mock a simple HTTP server
    server = http.createServer((req, res) => {
      if (req.url === '/lazy-update' && req.headers.accept === 'text/event-stream') {
        // Simulate a valid HMR server response
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({ type: 'update', message: 'Lazy Compilation Update Received' }));
        res.end();
      } else {
        // Invalid endpoints
        res.writeHead(404);
        res.end();
      }
    });
    server.listen(8080, done); // Start server on port 8080
  });

  afterAll(() => {
    // Cleanup: Stop server and remove temp files
    server.close();
    if (fs.existsSync(testDirectory)) {
      fs.rmSync(testDirectory, { recursive: true, force: true });
    }
  });

  it('should handle HMR updates for lazy compilation on valid connection', (done) => {
    const options = {
      data: '/lazy-update',
      onError: (err) => {
        throw err; // Fail if any error occurs
      },
      active: true,
      module: { hot: true },
    };

    // Mock the global __resourceQuery to a valid endpoint
    global.__resourceQuery = encodeURIComponent('http://localhost:8080/lazy-update');
    const cleanup = keepAlive(options);

    // Mock console.log to capture output for validation
    console.log = jest.fn();

    setTimeout(() => {
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Lazy Compilation Update Received'));
      cleanup(); // Clean up connection
      done();
    }, 1000);
  });

  it('should gracefully handle connection errors for lazy compilation', (done) => {
    const options = {
      data: '/invalid-endpoint',
      onError: (err) => {
        expect(err).toBeDefined();
        expect(err.message).toContain('Problem communicating active modules to the server');
        done(); // Ensure test completes successfully on error
      },
      active: true,
      module: { hot: true },
    };

    // Simulate invalid server URL
    global.__resourceQuery = encodeURIComponent('http://localhost:8080/invalid-endpoint');
    const cleanup = keepAlive(options);

    setTimeout(() => {
      cleanup(); // Cleanup connection on error
    }, 1000);
  });
});
