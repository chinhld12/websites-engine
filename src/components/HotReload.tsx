'use client';

import { useEffect } from 'react';

export default function HotReload() {
  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    let ws: WebSocket | null = null;
    let currentPort = 55980;
    const maxPort = 55999;
    let connected = false;

    const tryConnect = (port: number) => {
      ws = new WebSocket(`ws://localhost:${port}`);

      ws.onopen = () => {
        connected = true;
        currentPort = port;
        console.log(`🔗 Connected to hot-reload server on port ${port}`);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'reload') {
            console.log('🔄 Content changed, reloading page...', data.file);
            window.location.reload();
          }
        } catch (error) {
          console.error('Hot-reload message error:', error);
        }
      };

      ws.onclose = () => {
        if (connected) {
          console.log(`📱 Disconnected from hot-reload server on port ${currentPort}, attempting reconnect...`);
        }
        connected = false;
        // Try next port up to maxPort, then wrap around
        const nextPort = currentPort < maxPort ? currentPort + 1 : 3001;
        setTimeout(() => tryConnect(nextPort), 1000);
      };

      ws.onerror = (error) => {
        // Only log error if not connected
        if (!connected) {
          console.error('Hot-reload WebSocket error:', error);
        }
      };
    };

    tryConnect(currentPort);

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  return null; // This component doesn't render anything
}
