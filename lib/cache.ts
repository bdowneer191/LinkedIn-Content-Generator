
export interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // in milliseconds
  hits: number;
}

export interface CacheStats {
  totalEntries: number;
  hitRate: number;
  storageUsed: number; // in bytes (approximate)
}

const CACHE_PREFIX = 'gen-cache:';

export class ContentCache {
  private static totalRequests = 0;
  private static totalHits = 0;

  /**
   * Generates a stable cache key based on endpoint and payload.
   */
  static generateKey(endpoint: string, payload: any): string {
    const sortedPayload = this.sortObjectKeys(payload);
    const payloadStr = JSON.stringify(sortedPayload);
    // Simple hash-like string
    let hash = 0;
    for (let i = 0; i < payloadStr.length; i++) {
      const char = payloadStr.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `${CACHE_PREFIX}${endpoint}:${hash}`;
  }

  private static sortObjectKeys(obj: any): any {
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
      return obj;
    }
    const sorted: any = {};
    Object.keys(obj)
      .sort()
      .forEach((key) => {
        sorted[key] = this.sortObjectKeys(obj[key]);
      });
    return sorted;
  }

  /**
   * Stores data in the cache with a specific TTL.
   */
  static set(key: string, data: any, ttlMinutes = 60): void {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000,
      hits: 0,
    };

    try {
      localStorage.setItem(key, JSON.stringify(entry));
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        this.evictLRU();
        try {
          localStorage.setItem(key, JSON.stringify(entry));
        } catch (retryError) {
          console.error('Cache set failed even after eviction:', retryError);
        }
      }
    }
  }

  /**
   * Retrieves data from the cache, checking for expiration.
   */
  static get(key: string): any | null {
    this.totalRequests++;
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    try {
      const entry: CacheEntry = JSON.parse(raw);
      const isExpired = Date.now() > entry.timestamp + entry.ttl;

      if (isExpired) {
        localStorage.removeItem(key);
        return null;
      }

      // Update hits
      entry.hits++;
      localStorage.setItem(key, JSON.stringify(entry));
      
      this.totalHits++;
      return entry.data;
    } catch (e) {
      localStorage.removeItem(key);
      return null;
    }
  }

  static delete(key: string): void {
    localStorage.removeItem(key);
  }

  /**
   * Clears all cache entries with the specific prefix.
   */
  static clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Implements Least Recently Used eviction policy.
   */
  private static evictLRU(): void {
    const entries: { key: string; timestamp: number; hits: number }[] = [];
    const keys = Object.keys(localStorage);

    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          entries.push({ key, timestamp: parsed.timestamp, hits: parsed.hits });
        }
      }
    });

    // Sort by timestamp (oldest first) and hits (least hits first)
    entries.sort((a, b) => a.timestamp - b.timestamp || a.hits - b.hits);

    // Remove top 20% of entries
    const toRemove = Math.ceil(entries.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      localStorage.removeItem(entries[i].key);
    }
  }

  static getStats(): CacheStats {
    let totalSize = 0;
    let entries = 0;
    const keys = Object.keys(localStorage);

    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        entries++;
        totalSize += (localStorage.getItem(key) || '').length * 2; // Approx bytes
      }
    });

    return {
      totalEntries: entries,
      hitRate: this.totalRequests === 0 ? 0 : this.totalHits / this.totalRequests,
      storageUsed: totalSize,
    };
  }
}
