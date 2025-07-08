import chokidar from 'chokidar';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs-extra'; // Using fs-extra for recursive copy

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

// Function to copy content file to public directory
async function copyContent(filePath: string) {
  const relativePath = path.relative(contentPath, filePath);
  const destinationPath = path.join(process.cwd(), 'public/content', relativePath);

  try {
    // Ensure the destination directory exists
    await fs.promises.mkdir(path.dirname(destinationPath), { recursive: true });
    
    // Copy the file
    await fs.promises.copyFile(filePath, destinationPath);
    console.log(`✅ Copied ${filePath} to ${destinationPath}`);
  } catch (error) {
    console.error(`❌ Error copying file ${filePath}:`, error);
  }
}

// Watch for content changes
chokidar.watch(contentPath, {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true,
  ignoreInitial: true, // Don't trigger on startup
}).on('change', async (filePath: string) => {
  console.log(`📝 Content file changed: ${filePath}`);

  // Doing sync file changes
  await copyContent(filePath);

  // Send reload signal to all connected browsers
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'reload', file: filePath }));
      console.log('🔄 Sent reload signal to browser');
    }
  });
});

console.log('✅ Hot-reload system ready!');
