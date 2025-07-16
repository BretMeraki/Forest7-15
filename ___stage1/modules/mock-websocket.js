/**
 * Mock WebSocket implementation for environments without ws package
 * Provides fallback functionality for HTA Bridge Communication
 */

export default class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  constructor(url) {
    this.url = url;
    this.readyState = MockWebSocket.CONNECTING;
    this.listeners = {};
    
    // Simulate connection failure after a short delay
    setTimeout(() => {
      this.readyState = MockWebSocket.CLOSED;
      this.emit('error', new Error('Mock WebSocket: External HTA server not available'));
    }, 100);
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  send(data) {
    // Mock send - does nothing since no real connection
    console.warn('[MockWebSocket] Cannot send data - no real connection available');
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.emit('close');
  }

  terminate() {
    this.close();
  }
}

// Static properties
MockWebSocket.CONNECTING = 0;
MockWebSocket.OPEN = 1;
MockWebSocket.CLOSING = 2;
MockWebSocket.CLOSED = 3;