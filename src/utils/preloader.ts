import { getArticles, getArticlesCount } from './articleService';
import { getVisitCount } from './stats';

class DataPreloader {
  private preloadPromises = new Map<string, Promise<any>>();

  // 预加载首页关键数据
  async preloadHomeData(): Promise<void> {
    const promises = [
      this.preload('articles-page-1', () => getArticles(1, 10)),
      this.preload('articles-count', () => getArticlesCount()),
      this.preload('visit-count', () => getVisitCount())
    ];

    // 并行预加载，不等待完成
    Promise.allSettled(promises).catch(() => {
      // 静默处理预加载失败
    });
  }

  // 预加载下一页文章
  async preloadNextArticles(currentPage: number): Promise<void> {
    const nextPage = currentPage + 1;
    this.preload(`articles-page-${nextPage}`, () => getArticles(nextPage, 10));
  }

  private preload<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    if (this.preloadPromises.has(key)) {
      return this.preloadPromises.get(key)!;
    }

    const promise = fetcher().catch((error) => {
      // 预加载失败时从缓存中移除
      this.preloadPromises.delete(key);
      throw error;
    });

    this.preloadPromises.set(key, promise);
    return promise;
  }

  // 清理预加载缓存
  clear(): void {
    this.preloadPromises.clear();
  }
}

export const dataPreloader = new DataPreloader();

// 在浏览器环境中自动预加载首页数据
if (typeof window !== 'undefined') {
  // 页面加载完成后预加载数据
  if (document.readyState === 'complete') {
    dataPreloader.preloadHomeData();
  } else {
    window.addEventListener('load', () => {
      dataPreloader.preloadHomeData();
    });
  }
}