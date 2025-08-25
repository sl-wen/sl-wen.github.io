export interface ResourceItem {
  key: string;
  url: string;
  type: 'image' | 'audio' | 'json' | 'spritesheet';
  priority: 'high' | 'medium' | 'low';
  preload?: boolean;
  frameConfig?: {
    frameWidth: number;
    frameHeight: number;
    startFrame?: number;
    endFrame?: number;
  };
}

export interface LoadingProgress {
  loaded: number;
  total: number;
  percentage: number;
  currentResource: string;
  isComplete: boolean;
}

export class ResourceLoader {
  private static instance: ResourceLoader;
  private resources: Map<string, any> = new Map();
  private loadingQueue: ResourceItem[] = [];
  private isLoading: boolean = false;
  private progressCallback?: (progress: LoadingProgress) => void;
  private cache: Map<string, any> = new Map();

  private constructor() {}

  public static getInstance(): ResourceLoader {
    if (!ResourceLoader.instance) {
      ResourceLoader.instance = new ResourceLoader();
    }
    return ResourceLoader.instance;
  }

  // 添加资源到加载队列
  public addResource(resource: ResourceItem): void {
    this.loadingQueue.push(resource);
  }

  // 批量添加资源
  public addResources(resources: ResourceItem[]): void {
    this.loadingQueue.push(...resources);
  }

  // 设置进度回调
  public setProgressCallback(callback: (progress: LoadingProgress) => void): void {
    this.progressCallback = callback;
  }

  // 开始加载资源
  public async loadResources(): Promise<void> {
    if (this.isLoading) return;
    
    this.isLoading = true;
    const totalResources = this.loadingQueue.length;
    let loadedResources = 0;

    // 按优先级排序
    this.loadingQueue.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // 分批加载，高优先级先加载
    const highPriorityResources = this.loadingQueue.filter(r => r.priority === 'high');
    const mediumPriorityResources = this.loadingQueue.filter(r => r.priority === 'medium');
    const lowPriorityResources = this.loadingQueue.filter(r => r.priority === 'low');

    const updateProgress = (currentResource: string) => {
      const progress: LoadingProgress = {
        loaded: loadedResources,
        total: totalResources,
        percentage: Math.round((loadedResources / totalResources) * 100),
        currentResource,
        isComplete: loadedResources === totalResources
      };
      
      if (this.progressCallback) {
        this.progressCallback(progress);
      }
    };

    // 加载高优先级资源
    for (const resource of highPriorityResources) {
      try {
        updateProgress(resource.key);
        await this.loadSingleResource(resource);
        loadedResources++;
      } catch (error) {
        console.warn(`Failed to load high priority resource: ${resource.key}`, error);
        loadedResources++;
      }
    }

    // 并行加载中等优先级资源
    const mediumPromises = mediumPriorityResources.map(async (resource) => {
      try {
        updateProgress(resource.key);
        await this.loadSingleResource(resource);
        loadedResources++;
      } catch (error) {
        console.warn(`Failed to load medium priority resource: ${resource.key}`, error);
        loadedResources++;
      }
    });

    await Promise.all(mediumPromises);

    // 低优先级资源可以在后台加载
    const lowPromises = lowPriorityResources.map(async (resource) => {
      try {
        updateProgress(resource.key);
        await this.loadSingleResource(resource);
        loadedResources++;
      } catch (error) {
        console.warn(`Failed to load low priority resource: ${resource.key}`, error);
        loadedResources++;
      }
    });

    await Promise.all(lowPromises);

    // 最终进度更新
    updateProgress('完成');
    this.isLoading = false;
    this.loadingQueue = [];
  }

  // 加载单个资源
  private async loadSingleResource(resource: ResourceItem): Promise<void> {
    // 检查缓存
    if (this.cache.has(resource.url)) {
      this.resources.set(resource.key, this.cache.get(resource.url));
      return;
    }

    switch (resource.type) {
      case 'image':
        await this.loadImage(resource);
        break;
      case 'spritesheet':
        await this.loadSpritesheet(resource);
        break;
      case 'audio':
        await this.loadAudio(resource);
        break;
      case 'json':
        await this.loadJSON(resource);
        break;
      default:
        throw new Error(`Unknown resource type: ${resource.type}`);
    }
  }

  // 加载图片
  private async loadImage(resource: ResourceItem): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.resources.set(resource.key, img);
        this.cache.set(resource.url, img);
        resolve();
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${resource.url}`));
      };
      
      // 设置跨域属性
      img.crossOrigin = 'anonymous';
      img.src = resource.url;
    });
  }

  // 加载精灵图集
  private async loadSpritesheet(resource: ResourceItem): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        const spritesheetData = {
          image: img,
          frameConfig: resource.frameConfig
        };
        this.resources.set(resource.key, spritesheetData);
        this.cache.set(resource.url, spritesheetData);
        resolve();
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to load spritesheet: ${resource.url}`));
      };
      
      // 设置跨域属性
      img.crossOrigin = 'anonymous';
      img.src = resource.url;
    });
  }

  // 加载音频
  private async loadAudio(resource: ResourceItem): Promise<void> {
    try {
      const response = await fetch(resource.url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      this.resources.set(resource.key, arrayBuffer);
      this.cache.set(resource.url, arrayBuffer);
    } catch (error) {
      throw new Error(`Failed to load audio: ${resource.url}`);
    }
  }

  // 加载JSON
  private async loadJSON(resource: ResourceItem): Promise<void> {
    try {
      const response = await fetch(resource.url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      this.resources.set(resource.key, data);
      this.cache.set(resource.url, data);
    } catch (error) {
      throw new Error(`Failed to load JSON: ${resource.url}`);
    }
  }

  // 获取资源
  public getResource<T = any>(key: string): T | null {
    return this.resources.get(key) || null;
  }

  // 检查资源是否存在
  public hasResource(key: string): boolean {
    return this.resources.has(key);
  }

  // 获取所有资源键
  public getResourceKeys(): string[] {
    return Array.from(this.resources.keys());
  }

  // 清理缓存
  public clearCache(): void {
    this.cache.clear();
  }

  // 清理所有资源
  public clearResources(): void {
    this.resources.clear();
    this.cache.clear();
  }

  // 预加载游戏资源
  public preloadGameResources(): void {
    const gameResources: ResourceItem[] = [
      // 高优先级资源（核心游戏资源）
      {
        key: 'character_spritesheet',
        url: '/assets/farm-assets/Sprout Lands - Sprites - premium pack/Characters/Premium Charakter Spritesheet.png',
        type: 'image',
        priority: 'high',
        preload: true
      },
      {
        key: 'farming_plants',
        url: '/assets/farm-assets/Sprout Lands - Sprites - premium pack/Objects/Farming Plants.png',
        type: 'image',
        priority: 'high',
        preload: true
      },
      {
        key: 'all_items',
        url: '/assets/farm-assets/Sprout Lands - Sprites - premium pack/Objects/Items/All items.png',
        type: 'image',
        priority: 'high',
        preload: true
      },
      {
        key: 'tools_spritesheet',
        url: '/assets/farm-assets/Sprout Lands - Sprites - premium pack/Characters/Tools.png',
        type: 'image',
        priority: 'high',
        preload: true
      },

      // 中等优先级资源（UI和环境）
      {
        key: 'trees_and_bushes',
        url: '/assets/farm-assets/Sprout Lands - Sprites - premium pack/Objects/Trees, stumps and bushes.png',
        type: 'image',
        priority: 'medium'
      },
      {
        key: 'mushrooms_flowers_stones',
        url: '/assets/farm-assets/Sprout Lands - Sprites - premium pack/Objects/Mushrooms, Flowers, Stones.png',
        type: 'image',
        priority: 'medium'
      },
      {
        key: 'water_objects',
        url: '/assets/farm-assets/Sprout Lands - Sprites - premium pack/Objects/Water Objects.png',
        type: 'image',
        priority: 'medium'
      },
      {
        key: 'water_well',
        url: '/assets/farm-assets/Sprout Lands - Sprites - premium pack/Objects/Water well.png',
        type: 'image',
        priority: 'medium'
      },

      // 低优先级资源（装饰和额外内容）
      {
        key: 'boats',
        url: '/assets/farm-assets/Sprout Lands - Sprites - premium pack/Objects/Boats.png',
        type: 'image',
        priority: 'low'
      },
      {
        key: 'signs',
        url: '/assets/farm-assets/Sprout Lands - Sprites - premium pack/Objects/signs.png',
        type: 'image',
        priority: 'low'
      },
      {
        key: 'work_station',
        url: '/assets/farm-assets/Sprout Lands - Sprites - premium pack/Objects/work station.png',
        type: 'image',
        priority: 'low'
      },

      // 动物精灵（如果存在）
      {
        key: 'animals',
        url: '/assets/farm-assets/Sprout Lands - Sprites - premium pack/Animals/Animals.png',
        type: 'image',
        priority: 'low'
      }
    ];

    this.addResources(gameResources);
  }

  // 创建精灵表管理器
  public createSpriteSheet(imageKey: string, tileWidth: number, tileHeight: number) {
    const image = this.getResource<HTMLImageElement>(imageKey);
    if (!image) {
      throw new Error(`Image resource not found: ${imageKey}`);
    }

    return {
      image,
      tileWidth,
      tileHeight,
      getSprite: (x: number, y: number) => ({
        image,
        sx: x * tileWidth,
        sy: y * tileHeight,
        sw: tileWidth,
        sh: tileHeight
      }),
      drawSprite: (
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        dx: number,
        dy: number,
        dw?: number,
        dh?: number
      ) => {
        ctx.drawImage(
          image,
          x * tileWidth,
          y * tileHeight,
          tileWidth,
          tileHeight,
          dx,
          dy,
          dw || tileWidth,
          dh || tileHeight
        );
      }
    };
  }
}

// 资源加载状态管理
export class LoadingStateManager {
  private static instance: LoadingStateManager;
  private listeners: Array<(progress: LoadingProgress) => void> = [];
  private currentProgress: LoadingProgress = {
    loaded: 0,
    total: 0,
    percentage: 0,
    currentResource: '',
    isComplete: false
  };

  private constructor() {}

  public static getInstance(): LoadingStateManager {
    if (!LoadingStateManager.instance) {
      LoadingStateManager.instance = new LoadingStateManager();
    }
    return LoadingStateManager.instance;
  }

  public addListener(listener: (progress: LoadingProgress) => void): void {
    this.listeners.push(listener);
  }

  public removeListener(listener: (progress: LoadingProgress) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  public updateProgress(progress: LoadingProgress): void {
    this.currentProgress = progress;
    this.listeners.forEach(listener => listener(progress));
  }

  public getCurrentProgress(): LoadingProgress {
    return { ...this.currentProgress };
  }
}