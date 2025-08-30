import * as Phaser from 'phaser';

// 资源加载状态枚举
export enum LoadStatus {
  PENDING = 'pending',
  LOADING = 'loading',
  SUCCESS = 'success',
  FAILED = 'failed',
  RETRYING = 'retrying'
}

// 资源类型枚举
export enum ResourceType {
  IMAGE = 'image',
  AUDIO = 'audio',
  SPRITESHEET = 'spritesheet',
  TILESET = 'tileset',
  ATLAS = 'atlas',
  JSON = 'json',
  XML = 'xml',
  TEXT = 'text'
}

// 资源项接口
export interface ResourceItem {
  key: string;
  type: ResourceType;
  url: string;
  config?: any;
  priority: number;
  retryCount: number;
  maxRetries: number;
  status: LoadStatus;
  error?: string;
  size?: number;
  loadedSize?: number;
}

// 加载进度接口
export interface LoadProgress {
  total: number;
  loaded: number;
  failed: number;
  retrying: number;
  percentage: number;
  currentItem?: ResourceItem;
  estimatedTime?: number;
}

// 资源加载事件
export interface ResourceLoadEvent {
  type: 'progress' | 'complete' | 'error' | 'retry';
  progress?: LoadProgress;
  item?: ResourceItem;
  error?: string;
}

// 资源加载器配置
export interface ResourceLoaderConfig {
  maxConcurrent: number;
  retryDelay: number;
  timeout: number;
  enableCache: boolean;
  enableCompression: boolean;
  cdnUrl?: string;
}

export class ResourceLoader {
  private static instance: ResourceLoader;
  private game: Phaser.Game | null = null;
  private scene: Phaser.Scene | null = null;
  private resources: Map<string, ResourceItem> = new Map();
  private loadQueue: ResourceItem[] = [];
  private loadingItems: Set<string> = new Set();
  private config: ResourceLoaderConfig;
  private eventListeners: Map<string, ((event: ResourceLoadEvent) => void)[]> = new Map();
  private startTime: number = 0;
  private cache: Map<string, any> = new Map();

  constructor(config: Partial<ResourceLoaderConfig> = {}) {
    this.config = {
      maxConcurrent: 3,
      retryDelay: 2000,
      timeout: 30000,
      enableCache: true,
      enableCompression: true,
      ...config
    };
  }

  // 单例模式
  public static getInstance(config?: Partial<ResourceLoaderConfig>): ResourceLoader {
    if (!ResourceLoader.instance) {
      ResourceLoader.instance = new ResourceLoader(config);
    }
    return ResourceLoader.instance;
  }

  // 设置游戏实例
  public setGame(game: Phaser.Game): void {
    this.game = game;
  }

  // 设置场景实例
  public setScene(scene: Phaser.Scene): void {
    this.scene = scene;
  }

  // 添加资源
  public addResource(
    key: string,
    type: ResourceType,
    url: string,
    priority: number = 0,
    config?: any
  ): void {
    const resource: ResourceItem = {
      key,
      type,
      url: this.config.cdnUrl ? `${this.config.cdnUrl}${url}` : url,
      config,
      priority,
      retryCount: 0,
      maxRetries: 3,
      status: LoadStatus.PENDING
    };

    this.resources.set(key, resource);
    this.loadQueue.push(resource);
    
    // 按优先级排序
    this.loadQueue.sort((a, b) => b.priority - a.priority);
  }

  // 批量添加资源
  public addResources(resources: Array<{
    key: string;
    type: ResourceType;
    url: string;
    priority?: number;
    config?: any;
  }>): void {
    resources.forEach(resource => {
      this.addResource(
        resource.key,
        resource.type,
        resource.url,
        resource.priority,
        resource.config
      );
    });
  }

  // 开始加载
  public async startLoading(): Promise<void> {
    if (!this.game) {
      throw new Error('Game instance not set');
    }

    console.log('🎮 ResourceLoader: 开始加载资源');
    console.log('📊 总资源数量:', this.resources.size);
    console.log('📋 资源列表:', Array.from(this.resources.keys()));

    this.startTime = Date.now();
    this.emitEvent('progress', { progress: this.getProgress() });

    // 检查缓存
    if (this.config.enableCache) {
      this.loadFromCache();
    }

    // 开始加载队列
    await this.processQueue();
  }

  // 处理加载队列
  private async processQueue(): Promise<void> {
    console.log('🔄 ResourceLoader: 开始处理加载队列');
    console.log('📊 队列长度:', this.loadQueue.length);

    while (this.loadQueue.length > 0 || this.loadingItems.size > 0) {
      // 启动新的加载任务
      while (this.loadingItems.size < this.config.maxConcurrent && this.loadQueue.length > 0) {
        const item = this.loadQueue.shift()!;
        console.log('📥 开始加载资源:', item.key, item.url);
        this.loadResource(item);
      }

      // 等待一段时间再检查
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('✅ ResourceLoader: 队列处理完成');

    // 检查是否所有资源都加载成功
    const failedItems = Array.from(this.resources.values()).filter(
      item => item.status === LoadStatus.FAILED
    );

    if (failedItems.length > 0) {
      console.error('❌ ResourceLoader: 加载失败的资源:', failedItems.map(item => item.key));
      this.emitEvent('error', {
        error: `${failedItems.length} resources failed to load`,
        item: failedItems[0]
      });
    } else {
      console.log('🎉 ResourceLoader: 所有资源加载成功');
      this.emitEvent('complete', { progress: this.getProgress() });
    }
  }

  // 加载单个资源
  private async loadResource(item: ResourceItem): Promise<void> {
    if (!this.game) return;

    this.loadingItems.add(item.key);
    item.status = LoadStatus.LOADING;

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Load timeout')), this.config.timeout);
      });

      const loadPromise = this.loadResourceByType(item);
      
      await Promise.race([loadPromise, timeoutPromise]);

      item.status = LoadStatus.SUCCESS;
      this.loadingItems.delete(item.key);

      // 缓存资源
      if (this.config.enableCache) {
        this.cacheResource(item);
      }

      this.emitEvent('progress', { progress: this.getProgress() });

    } catch (error) {
      item.status = LoadStatus.FAILED;
      item.error = error instanceof Error ? error.message : 'Unknown error';
      this.loadingItems.delete(item.key);

      // 重试机制
      if (item.retryCount < item.maxRetries) {
        item.retryCount++;
        item.status = LoadStatus.RETRYING;
        
        this.emitEvent('retry', { item, error: item.error });

        setTimeout(() => {
          item.status = LoadStatus.PENDING;
          this.loadQueue.unshift(item);
        }, this.config.retryDelay * item.retryCount);
      } else {
        this.emitEvent('error', { item, error: item.error });
      }

      this.emitEvent('progress', { progress: this.getProgress() });
    }
  }

  // 根据类型加载资源
  private async loadResourceByType(item: ResourceItem): Promise<void> {
    if (!this.scene) return;

    switch (item.type) {
      case ResourceType.IMAGE:
        this.scene.load.image(item.key, item.url);
        break;
      case ResourceType.AUDIO:
        this.scene.load.audio(item.key, item.url);
        break;
      case ResourceType.SPRITESHEET:
        const { frameWidth, frameHeight, spacing, margin } = item.config || {};
        this.scene.load.spritesheet(item.key, item.url, {
          frameWidth,
          frameHeight,
          spacing,
          margin
        });
        break;
      case ResourceType.TILESET:
        this.scene.load.image(item.key, item.url);
        break;
      case ResourceType.ATLAS:
        const { atlasURL, format } = item.config || {};
        if (format === 'XML') {
          this.scene.load.atlasXML(item.key, item.url, atlasURL);
        } else {
          this.scene.load.atlas(item.key, item.url, atlasURL);
        }
        break;
      case ResourceType.JSON:
        this.scene.load.json(item.key, item.url);
        break;
      case ResourceType.XML:
        this.scene.load.xml(item.key, item.url);
        break;
      case ResourceType.TEXT:
        this.scene.load.text(item.key, item.url);
        break;
      default:
        throw new Error(`Unsupported resource type: ${item.type}`);
    }

    // 等待加载完成
    return new Promise((resolve, reject) => {
      const onComplete = () => {
        this.scene!.load.off('complete', onComplete);
        this.scene!.load.off('loaderror', onError);
        resolve();
      };

      const onError = (file: any) => {
        this.scene!.load.off('complete', onComplete);
        this.scene!.load.off('loaderror', onError);
        reject(new Error(`Failed to load ${file.key}`));
      };

      this.scene!.load.once('complete', onComplete);
      this.scene!.load.once('loaderror', onError);
      this.scene!.load.start();
    });
  }

  // 从缓存加载
  private loadFromCache(): void {
    try {
      const cached = localStorage.getItem('game_resources_cache');
      if (cached) {
        const cacheData = JSON.parse(cached);
        Object.keys(cacheData).forEach(key => {
          if (this.resources.has(key)) {
            const resource = this.resources.get(key)!;
            if (cacheData[key].version === this.getResourceVersion(resource)) {
              resource.status = LoadStatus.SUCCESS;
              this.loadQueue = this.loadQueue.filter(item => item.key !== key);
            }
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load from cache:', error);
    }
  }

  // 缓存资源
  private cacheResource(item: ResourceItem): void {
    try {
      const cached = localStorage.getItem('game_resources_cache') || '{}';
      const cacheData = JSON.parse(cached);
      
      cacheData[item.key] = {
        version: this.getResourceVersion(item),
        timestamp: Date.now(),
        size: item.size
      };

      localStorage.setItem('game_resources_cache', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache resource:', error);
    }
  }

  // 获取资源版本
  private getResourceVersion(item: ResourceItem): string {
    return `${item.url}_${item.type}_${JSON.stringify(item.config || {})}`;
  }

  // 获取加载进度
  public getProgress(): LoadProgress {
    const total = this.resources.size;
    const loaded = Array.from(this.resources.values()).filter(
      item => item.status === LoadStatus.SUCCESS
    ).length;
    const failed = Array.from(this.resources.values()).filter(
      item => item.status === LoadStatus.FAILED
    ).length;
    const retrying = Array.from(this.resources.values()).filter(
      item => item.status === LoadStatus.RETRYING
    ).length;

    const percentage = total > 0 ? Math.round((loaded / total) * 100) : 0;
    
    const currentItem = this.loadQueue[0] || 
      Array.from(this.resources.values()).find(item => item.status === LoadStatus.LOADING);

    let estimatedTime: number | undefined;
    if (loaded > 0 && this.startTime > 0) {
      const elapsed = Date.now() - this.startTime;
      const rate = loaded / elapsed;
      const remaining = total - loaded;
      estimatedTime = Math.round(remaining / rate);
    }

    return {
      total,
      loaded,
      failed,
      retrying,
      percentage,
      currentItem,
      estimatedTime
    };
  }

  // 获取资源状态
  public getResourceStatus(key: string): LoadStatus | undefined {
    return this.resources.get(key)?.status;
  }

  // 获取所有资源状态
  public getAllResourceStatus(): Map<string, LoadStatus> {
    const statusMap = new Map<string, LoadStatus>();
    this.resources.forEach((item, key) => {
      statusMap.set(key, item.status);
    });
    return statusMap;
  }

  // 清除缓存
  public clearCache(): void {
    try {
      localStorage.removeItem('game_resources_cache');
      this.cache.clear();
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  // 事件监听
  public on(event: string, callback: (event: ResourceLoadEvent) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  public off(event: string, callback: (event: ResourceLoadEvent) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // 发送事件
  private emitEvent(type: string, data: Partial<ResourceLoadEvent>): void {
    const event: ResourceLoadEvent = {
      type: type as any,
      ...data
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  // 销毁
  public destroy(): void {
    this.resources.clear();
    this.loadQueue = [];
    this.loadingItems.clear();
    this.eventListeners.clear();
    this.cache.clear();
    this.game = null;
  }
}

// 预定义的资源加载顺序 - 使用实际存在的资源路径
export const RESOURCE_LOAD_ORDER = {
  // 1. 地图资源 (优先级: 80)
  MAPS: [
    { key: 'home_page_city', type: ResourceType.JSON, url: '/assets/topdown/sprites/maps/cities/home_page_city.json', priority: 80 },
    { key: 'home_page_city_house_01', type: ResourceType.JSON, url: '/assets/topdown/sprites/maps/houses/home_page_city_house_01.json', priority: 80 },
    { key: 'home_page_city_house_02', type: ResourceType.JSON, url: '/assets/topdown/sprites/maps/houses/home_page_city_house_02.json', priority: 80 },
    { key: 'home_page_city_house_03', type: ResourceType.JSON, url: '/assets/topdown/sprites/maps/houses/home_page_city_house_03.json', priority: 80 },
    { key: 'tileset', type: ResourceType.IMAGE, url: '/assets/topdown/sprites/maps/tilesets/tileset.png', priority: 80 }
  ],

  // 2. 角色资源 (优先级: 70)
  CHARACTERS: [
    { key: 'hero', type: ResourceType.ATLAS, url: '/assets/topdown/sprites/atlas/hero.png', priority: 70, config: { atlasURL: '/assets/topdown/sprites/atlas/hero.json' } },
    { key: 'slime', type: ResourceType.ATLAS, url: '/assets/topdown/sprites/atlas/slime.png', priority: 70, config: { atlasURL: '/assets/topdown/sprites/atlas/slime.json' } },
    { key: 'npc_01', type: ResourceType.ATLAS, url: '/assets/topdown/sprites/atlas/npc_01.png', priority: 70, config: { atlasURL: '/assets/topdown/sprites/atlas/npc_01.json' } },
    { key: 'npc_02', type: ResourceType.ATLAS, url: '/assets/topdown/sprites/atlas/npc_02.png', priority: 70, config: { atlasURL: '/assets/topdown/sprites/atlas/npc_02.json' } },
    { key: 'npc_03', type: ResourceType.ATLAS, url: '/assets/topdown/sprites/atlas/npc_03.png', priority: 70, config: { atlasURL: '/assets/topdown/sprites/atlas/npc_03.json' } },
    { key: 'npc_04', type: ResourceType.ATLAS, url: '/assets/topdown/sprites/atlas/npc_04.png', priority: 70, config: { atlasURL: '/assets/topdown/sprites/atlas/npc_04.json' } }
  ],

  // 3. 物品资源 (优先级: 60)
  ITEMS: [
    { key: 'heart', type: ResourceType.ATLAS, url: '/assets/topdown/sprites/atlas/heart.png', priority: 60, config: { atlasURL: '/assets/topdown/sprites/atlas/heart.json' } },
    { key: 'coin', type: ResourceType.ATLAS, url: '/assets/topdown/sprites/atlas/coin.png', priority: 60, config: { atlasURL: '/assets/topdown/sprites/atlas/coin.json' } }
  ],

  // 4. UI资源 (优先级: 90)
  UI: [
    { key: 'main_menu_background', type: ResourceType.IMAGE, url: '/assets/topdown/images/main_menu_background.png', priority: 90 },
    { key: 'game_over_background', type: ResourceType.IMAGE, url: '/assets/topdown/images/game_over_background.png', priority: 90 },
    { key: 'game_logo', type: ResourceType.IMAGE, url: '/assets/topdown/images/game_logo.png', priority: 90 },
    { key: 'dialog_borderbox', type: ResourceType.IMAGE, url: '/assets/topdown/images/dialog_borderbox.png', priority: 90 }
  ],

  // 3. 物品资源 (优先级: 60)
  ITEMS: [
    { key: 'heart', type: ResourceType.ATLAS, url: '/assets/topdown/sprites/atlas/heart.png', priority: 60, config: { atlasURL: '/assets/topdown/sprites/atlas/heart.json' } },
    { key: 'coin', type: ResourceType.ATLAS, url: '/assets/topdown/sprites/atlas/coin.png', priority: 60, config: { atlasURL: '/assets/topdown/sprites/atlas/coin.json' } },
    { key: 'heart_container', type: ResourceType.IMAGE, url: '/assets/topdown/images/heart_container.png', priority: 60 },
    { key: 'sword', type: ResourceType.IMAGE, url: '/assets/topdown/images/sword.png', priority: 60 },
    { key: 'push', type: ResourceType.IMAGE, url: '/assets/topdown/images/push.png', priority: 60 }
  ]
};

// 工具函数：创建资源加载器并添加所有资源
export function createResourceLoader(game: Phaser.Game, config?: Partial<ResourceLoaderConfig>): ResourceLoader {
  const loader = ResourceLoader.getInstance(config);
  loader.setGame(game);

  // 添加所有预定义资源
  Object.values(RESOURCE_LOAD_ORDER).forEach(resourceGroup => {
    loader.addResources(resourceGroup);
  });

  return loader;
}