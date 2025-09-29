// 内存缓存管理器
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // 生存时间（毫秒）
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // 清理过期缓存
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.cache.forEach((item, key) => {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
    });
  }
}

export const memoryCache = new MemoryCache();

// In-flight promise registry to dedupe concurrent requests for the same key
const inFlightPromises = new Map<string, Promise<any>>();

// 定期清理过期缓存
if (typeof window !== 'undefined') {
  setInterval(() => {
    memoryCache.cleanup();
  }, 10 * 60 * 1000); // 每10分钟清理一次
}

// 缓存键生成器
export const getCacheKey = (...parts: (string | number)[]): string => {
  return parts.join(':');
};

// 带缓存的异步函数包装器
export const withCache = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000
): Promise<T> => {
  // 先尝试从缓存获取
  const cached = memoryCache.get<T>(key);
  if (cached !== null) {
    return cached;
  }
  // 如果有正在进行的相同键请求，复用该 Promise
  const existingInFlight = inFlightPromises.get(key) as Promise<T> | undefined;
  if (existingInFlight) {
    return existingInFlight;
  }
  // 缓存未命中，执行获取函数，并登记 in-flight
  const inFlight = (async () => {
    try {
      const data = await fetcher();
      // 存入缓存
      memoryCache.set(key, data, ttl);
      return data;
    } finally {
      // 无论成功或失败都移除登记，避免泄漏
      inFlightPromises.delete(key);
    }
  })();
  inFlightPromises.set(key, inFlight);
  return inFlight;
};