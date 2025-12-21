
/**
 * RateLimiter ensures we stay within the Gemini Free Tier limit (15 Requests Per Minute).
 */
class RateLimiter {
  private queue: Array<{ 
    fn: () => Promise<any>; 
    resolve: (val: any) => void; 
    reject: (err: any) => void 
  }> = [];
  
  private requestCount = 0;
  private windowStart = Date.now();
  private isProcessing = false;
  
  private readonly LIMIT = 15;
  private readonly WINDOW_MS = 60000;

  /**
   * Adds an async function to the execution queue.
   */
  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.process();
    });
  }

  private async process() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      
      // Reset window if needed
      if (now - this.windowStart >= this.WINDOW_MS) {
        this.windowStart = now;
        this.requestCount = 0;
      }

      // If at limit, wait until reset
      if (this.requestCount >= this.LIMIT) {
        const waitTime = this.WINDOW_MS - (now - this.windowStart) + 100;
        await new Promise(r => setTimeout(r, Math.max(0, waitTime)));
        continue;
      }

      const nextItem = this.queue.shift();
      if (nextItem) {
        this.requestCount++;
        const { fn, resolve, reject } = nextItem;
        
        // Execute without blocking the queue processing of next items 
        // unless they also hit the rate limit.
        fn()
          .then(resolve)
          .catch(reject);
          
        // Small delay between starting requests to avoid bursts
        await new Promise(r => setTimeout(r, 100));
      }
    }

    this.isProcessing = false;
  }

  getRemainingRequests(): number {
    const now = Date.now();
    if (now - this.windowStart >= this.WINDOW_MS) return this.LIMIT;
    return Math.max(0, this.LIMIT - this.requestCount);
  }

  getTimeUntilReset(): number {
    const now = Date.now();
    return Math.max(0, this.WINDOW_MS - (now - this.windowStart));
  }
}

export const rateLimiter = new RateLimiter();
