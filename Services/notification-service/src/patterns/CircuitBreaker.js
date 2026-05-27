/**
 * Circuit Breaker Pattern
 * Prevents cascade failures when downstream services (e.g. email) fail.
 *
 * States:
 *  CLOSED   → requests flow normally
 *  OPEN     → requests fail immediately (no attempt)
 *  HALF_OPEN → one test request allowed to check if service recovered
 */
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold  = options.failureThreshold  || 5;
    this.successThreshold  = options.successThreshold  || 2;
    this.timeout           = options.timeout           || 60000; // 60s
    this.state             = 'CLOSED';
    this.failureCount      = 0;
    this.successCount      = 0;
    this.lastFailureTime   = null;
    this.name              = options.name || 'CircuitBreaker';
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      // Check if timeout has passed — try half-open
      if (Date.now() - this.lastFailureTime >= this.timeout) {
        this.state = 'HALF_OPEN';
        console.log(`[${this.name}] State: OPEN → HALF_OPEN`);
      } else {
        throw new Error(`[${this.name}] Circuit is OPEN — request blocked`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state        = 'CLOSED';
        this.successCount = 0;
        console.log(`[${this.name}] State: HALF_OPEN → CLOSED`);
      }
    }
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold || this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      console.log(`[${this.name}] State → OPEN after ${this.failureCount} failures`);
    }
  }

  getStatus() {
    return {
      name:         this.name,
      state:        this.state,
      failureCount: this.failureCount,
      lastFailure:  this.lastFailureTime
    };
  }
}

module.exports = CircuitBreaker;