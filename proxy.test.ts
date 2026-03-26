import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebSocket } from 'ws';
import { createProxyServer } from './proxy-core.js';
import request from 'supertest';
import { Server } from 'http';
import { AddressInfo } from 'net';
import fs from 'fs';
import path from 'path';

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
    const wsClient = new WebSocket(`ws://localhost:${port}`);
    await new Promise<void>((resolve) => wsClient.on('open', resolve));

    wsClient.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.action === 'query') {
        wsClient.send(JSON.stringify({
          id: msg.id,
          data: { part: 'Water Pump', price: '$55.00' }
        }));
      }
    });

    const response = await request(server)
      .get('/query?part=22R+water+pump');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ part: 'Water Pump', price: '$55.00' });
    
    wsClient.close();
  });

  it('should save intercepted data to snapshots directory', async () => {
    const wsClient = new WebSocket(`ws://localhost:${port}`);
    await new Promise<void>((resolve) => wsClient.on('open', resolve));

    const testData = { item: 'Test Item', price: 10 };
    wsClient.send(JSON.stringify({
      type: 'INTERCEPTED_DATA',
      site: 'testsite',
      data: testData
    }));

    // Wait a bit for file IO
    await new Promise(r => setTimeout(r, 200));

    const snapshotDir = path.join(process.cwd(), 'snapshots');
    const files = fs.readdirSync(snapshotDir);
    const testSnapshot = files.find(f => f.startsWith('testsite_'));
    
    expect(testSnapshot).toBeDefined();
    const filePath = path.join(snapshotDir, testSnapshot!);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    expect(content).toEqual(testData);

    wsClient.close();
    // Cleanup
    fs.unlinkSync(filePath);
  });
});
