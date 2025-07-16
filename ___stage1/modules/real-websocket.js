/**
 * Real WebSocket implementation using ws package
 * Provides actual WebSocket functionality for HTA Bridge Communication
 */

import { WebSocket } from 'ws';

// Create a wrapper class that provides fallback if ws is not available
class RealWebSocket extends WebSocket {
  constructor(url, options = {}) {
    try {
      super(url, options);
      
      // Set up event handlers
      this.on('open', () => {
        console.log(`[WebSocket] Connection opened to: ${url}`);
      });
      
      this.on('error', (error) => {
        console.error(`[WebSocket] Error: ${error.message}`);
      });
      
      this.on('close', (code, reason) => {
        console.log(`[WebSocket] Connection closed. Code: ${code}, Reason: ${reason}`);
      });
      
      this.on('message', (data) => {
        console.log('[WebSocket] Message received:', data.toString().substring(0, 100));
      });
    } catch (error) {
      console.error('[WebSocket] Failed to create WebSocket:', error);
      throw error;
    }
  }
  
  // Override send to add logging
  send(data, callback) {
    if (this.readyState === WebSocket.OPEN) {
      super.send(data, callback);
      console.log('[WebSocket] Data sent:', typeof data === 'string' ? data.substring(0, 100) : 'binary data');
    } else {
      console.warn('[WebSocket] Cannot send data - connection not open. State:', this.readyState);
      if (callback) {
        callback(new Error('WebSocket is not open'));
      }
    }
  }
}

// Fallback to EventEmitter-based implementation if ws is not available
let WebSocketImplementation;

try {
  // Try to use the real WebSocket
  WebSocketImplementation = RealWebSocket;
} catch (error) {
  console.warn('[WebSocket] ws package not available, using EventEmitter fallback');
  
  // Fallback implementation using EventEmitter
  const { EventEmitter } = await import('events');
  
  class FallbackWebSocket extends EventEmitter {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;

    constructor(url) {
      super();
      this.url = url;
      this.readyState = FallbackWebSocket.CONNECTING;
      
      // Simulate connection attempt
      setTimeout(() => {
        this.readyState = FallbackWebSocket.CLOSED;
        this.emit('error', new Error('WebSocket: ws package not installed'));
        this.emit('close');
      }, 100);
    }

    send(data, callback) {
      console.warn('[FallbackWebSocket] Cannot send data - ws package not installed');
      if (callback) {
        callback(new Error('ws package not installed'));
      }
    }

    close() {
      this.readyState = FallbackWebSocket.CLOSED;
      this.emit('close');
    }

    terminate() {
      this.close();
    }
  }
  
  WebSocketImplementation = FallbackWebSocket;
}

export default WebSocketImplementation;
