import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { createServer, Server } from 'http';

import fs from 'fs';
import path from 'path';

export function createProxyServer(port: number) {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });
  
  const pendingRequests = new Map<string, (data: any) => void>();
  let activeUserscript: WebSocket | null = null;

  const SNAPSHOT_DIR = path.join(process.cwd(), 'snapshots');
  if (!fs.existsSync(SNAPSHOT_DIR)) {
    fs.mkdirSync(SNAPSHOT_DIR);
  }

  wss.on('connection', (ws) => {
    activeUserscript = ws;
    console.log('Userscript connected');
    
    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        
        if (msg.type === 'INTERCEPTED_DATA') {
          const filename = `${msg.site}_${new Date().toISOString().replace(/:/g, '-')}.json`;
          const filePath = path.join(SNAPSHOT_DIR, filename);
          fs.writeFileSync(filePath, JSON.stringify(msg.data, null, 2));
          console.log(`Saved snapshot: ${filename}`);
          return;
        }

        if (msg.id && pendingRequests.has(msg.id)) {
          const resolve = pendingRequests.get(msg.id)!;
          resolve(msg.data);
          pendingRequests.delete(msg.id);
        }
      } catch (e) {
        console.error('Failed to parse message from userscript', e);
      }
    });

    ws.on('close', () => {
      activeUserscript = null;
      console.log('Userscript disconnected');
    });
  });

  app.get('/query', async (req, res) => {
    if (!activeUserscript) {
      return res.status(503).json({ error: 'No userscript connected' });
    }

    const id = uuidv4();
    const query = req.query;

    const promise = new Promise((resolve) => {
      pendingRequests.set(id, resolve);
    });

    activeUserscript.send(JSON.stringify({
      id,
      action: 'query',
      query
    }));

    const timeout = setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        res.status(504).json({ error: 'Timeout waiting for userscript' });
      }
    }, 30000);

    const data = await promise;
    clearTimeout(timeout);
    res.json(data);
  });

  return { app, server, wss };
}
