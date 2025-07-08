import chokidar from 'chokidar';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';

const contentPath = path.join(process.cwd(), 'content');
const WS_PORT = 3001;

// Create WebSocket server
const wss = new WebSocketServer({ port: WS_PORT });

console.log(`🚀 WebSocket server running on ws://localhost:${WS_PORT}`);
console.log(`📁 Watching content directory: ${contentPath}`);

// Track connected clients
const clients = new Set<WebSocket>();

wss.on('connection', (ws: WebSocket) => {
  console.log('📱 Browser connected for hot-reload');
  clients.add(ws);
  
  ws.on('close', () => {
    console.log('📱 Browser disconnected');
    clients.delete(ws);
  });
});

// Watch for content changes
chokidar.watch(contentPath, {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true,
  ignoreInitial: true, // Don't trigger on startup
}).on('all', (event: string, filePath: string) => {
  console.log(`📝 Content file changed: ${filePath} (${event})`);
  
  // Send reload signal to all connected browsers
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'reload', file: filePath }));
      console.log('🔄 Sent reload signal to browser');
    }
  });
});

console.log('✅ Hot-reload system ready!');
