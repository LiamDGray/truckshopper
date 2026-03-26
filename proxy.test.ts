import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebSocket } from 'ws';
import { createProxyServer } from './proxy-core.js';
import request from 'supertest';
import { Server } from 'http';
import { AddressInfo } from 'net';

describe('Proxy Server Relay', () => {
  let server: Server;
  let port: number;

  beforeEach(async () => {
    const core = createProxyServer(0);
    server = core.server;
    await new Promise<void>((resolve) => server.listen(0, resolve));
    port = (server.address() as AddressInfo).port;
  });

  afterEach(() => {
    server.close();
  });

  it('should relay a query to the websocket and return the response', async () => {
    // 1. Simulate a userscript connecting
    const wsClient = new WebSocket(`ws://localhost:${port}`);
    
    // Wait for the connection to be established
    await new Promise<void>((resolve) => wsClient.on('open', resolve));

    // 2. Mock the userscript's response
    wsClient.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.action === 'query') {
        wsClient.send(JSON.stringify({
          id: msg.id,
          data: { part: 'Water Pump', price: '$55.00' }
        }));
      }
    });

    // 3. Send HTTP request to proxy
    const response = await request(server)
      .get('/query?part=22R+water+pump');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ part: 'Water Pump', price: '$55.00' });
    
    wsClient.close();
  });
});
