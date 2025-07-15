/**
 * Event Bus Implementation
 * Provides a simple event system for inter-module communication
 */
class EventBus {
  constructor() {
    this.events = new Map();
    this.maxListeners = 100;
  }

  /**
   * Register an event listener
   * @param {string} event - Event name
   * @param {Function} listener - Callback function
   * @param {string} [context] - Optional context identifier
   */
  on(event, listener, context = 'default') {
    if (typeof listener !== 'function') {
      throw new Error('EventBus: listener must be a function');
    }

    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    const listeners = this.events.get(event);
    if (listeners.length >= this.maxListeners) {
      console.warn(`[EventBus] Max listeners (${this.maxListeners}) reached for event: ${event}`);
      return;
    }

    listeners.push({ listener, context, timestamp: Date.now() });
  }

  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Function} listener - Callback function to remove
   * @param {string} [context] - Optional context identifier
   */
  off(event, listener, context = 'default') {
    if (!this.events.has(event)) return;

    const listeners = this.events.get(event);
    const index = listeners.findIndex(l => l.listener === listener && l.context === context);
    
    if (index > -1) {
      listeners.splice(index, 1);
      if (listeners.length === 0) {
        this.events.delete(event);
      }
    }
  }

  /**
   * Emit an event to all listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (!this.events.has(event)) return;

    const listeners = this.events.get(event);
    const errors = [];

    for (const { listener, context } of listeners) {
      try {
        listener(data, { event, context, timestamp: Date.now() });
      } catch (error) {
        errors.push({ error, context, event });
        console.error(`[EventBus] Error in listener for event '${event}' (context: ${context}):`, error);
      }
    }

    if (errors.length > 0) {
      console.warn(`[EventBus] ${errors.length} errors occurred while emitting event '${event}'`);
    }
  }

  /**
   * Register a one-time event listener
   * @param {string} event - Event name
   * @param {Function} listener - Callback function
   * @param {string} [context] - Optional context identifier
   */
  once(event, listener, context = 'default') {
    const onceListener = (data, meta) => {
      this.off(event, onceListener, context);
      listener(data, meta);
    };
    this.on(event, onceListener, context);
  }

  /**
   * Remove all listeners for an event or all events
   * @param {string} [event] - Optional event name. If not provided, removes all listeners
   */
  removeAllListeners(event) {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  /**
   * Get event statistics
   * @returns {Object} Event statistics
   */
  getStats() {
    const stats = {
      totalEvents: this.events.size,
      totalListeners: 0,
      events: {}
    };

    for (const [event, listeners] of this.events.entries()) {
      stats.totalListeners += listeners.length;
      stats.events[event] = {
        listenerCount: listeners.length,
        contexts: [...new Set(listeners.map(l => l.context))]
      };
    }

    return stats;
  }

  /**
   * Check if there are listeners for an event
   * @param {string} event - Event name
   * @returns {boolean} True if there are listeners
   */
  hasListeners(event) {
    return this.events.has(event) && this.events.get(event).length > 0;
  }
}

// Export singleton instance
export const bus = new EventBus();
export default bus;
