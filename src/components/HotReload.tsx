'use client';

import { useEffect } from 'react';

export default function HotReload() {
  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    let ws: WebSocket;

    const connect = () => {
      ws = new WebSocket('ws://localhost:3001');

      ws.onopen = () => {
        console.log('🔗 Connected to hot-reload server');
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
        console.log('📱 Disconnected from hot-reload server, attempting reconnect...');
        // Attempt to reconnect after 1 second
        setTimeout(connect, 1000);
      };

      ws.onerror = (error) => {
        console.error('Hot-reload WebSocket error:', error);
      };
    };

    connect();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  return null; // This component doesn't render anything
}
