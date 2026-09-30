import { WebSocketServer } from 'ws';

// Real WebSocket hub for live attendance updates.
// Channels: /ws/attendance?session=<id>  (plus a global 'live' channel).
const channels = new Map(); // key -> Set<ws>

export function initWs(server) {
  const wss = new WebSocketServer({ server, path: '/ws/attendance' });
  wss.on('connection', (socket, req) => {
    const url = new URL(req.url, 'http://localhost');
    const key = url.searchParams.get('session') || 'live';
    if (!channels.has(key)) channels.set(key, new Set());
    channels.get(key).add(socket);
    socket.send(JSON.stringify({ type: 'connected', channel: key }));
    socket.on('close', () => channels.get(key)?.delete(socket));
    socket.on('error', () => channels.get(key)?.delete(socket));
  });
  console.log('WebSocket hub ready at ws://localhost:<port>/ws/attendance');
}

// Broadcast to a session channel + the global live channel.
export function broadcast(sessionId, data) {
  const msg = JSON.stringify({ ...data, at: Date.now() });
  for (const key of [String(sessionId), 'live']) {
    channels.get(key)?.forEach((ws) => { try { ws.send(msg); } catch { /* drop */ } });
  }
}
