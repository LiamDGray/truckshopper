import { createProxyServer } from './proxy-core.js';

const port = 3000;
const { server } = createProxyServer(port);

server.listen(port, () => {
  console.log(`Relay Proxy Server listening at http://localhost:${port}`);
  console.log(`WebSocket Server ready on the same port.`);
});
