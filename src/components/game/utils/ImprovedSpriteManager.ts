import * as Phaser from 'phaser';

/**
 * 改进的精灵管理器
 * 支持分割后的精灵文件和动态加载
 */
export class ImprovedSpriteManager {
    private scene: Phaser.Scene;
    private spriteCatalog: SpriteCatalog | null = null;
    private loadedSprites: Set<string> = new Set();
    private baseAssetPath: string = '/assets/sprites/';

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    /**
     * 加载精灵目录
     */
    async loadSpriteCatalog(): Promise<void> {
        try {
            const response = await fetch('/asset-catalog.json');
            const data = await response.json();
            this.spriteCatalog = data.sprites;
            console.log('✅ 精灵目录加载完成，包含', Object.keys(this.spriteCatalog).length, '个精灵');
        } catch (error) {
            console.error('❌ 加载精灵目录失败:', error);
            // 使用fallback目录
            this.spriteCatalog = this.getFallbackCatalog();
        }
    }

    /**
     * 加载单个精灵
     */
    async loadSprite(spriteName: string): Promise<boolean> {
        if (this.loadedSprites.has(spriteName)) {
            return true;
        }

        if (!this.spriteCatalog || !this.spriteCatalog[spriteName]) {
            console.warn(`精灵 ${spriteName} 不存在于目录中`);
            return false;
        }

        try {
            const spriteInfo = this.spriteCatalog[spriteName];
            const spritePath = this.baseAssetPath + spriteInfo.file.replace('sprites/', '');
            
            // 使用Phaser加载精灵
            this.scene.load.image(spriteName, spritePath);
            
            // 如果场景正在运行，立即开始加载
            if (this.scene.scene.isActive()) {
                this.scene.load.start();
                
                return new Promise((resolve) => {
                    this.scene.load.once('complete', () => {
                        this.loadedSprites.add(spriteName);
                        console.log(`✅ 精灵加载完成: ${spriteName}`);
                        resolve(true);
                    });
                    
                    this.scene.load.once('loaderror', () => {
                        console.error(`❌ 精灵加载失败: ${spriteName}`);
                        resolve(false);
                    });
                });
            } else {
                this.loadedSprites.add(spriteName);
                return true;
            }
        } catch (error) {
            console.error(`❌ 加载精灵失败 ${spriteName}:`, error);
            return false;
        }
    }

    /**
     * 批量加载精灵
     */
    async loadSprites(spriteNames: string[]): Promise<string[]> {
        const loadPromises = spriteNames.map(name => this.loadSprite(name));
        const results = await Promise.all(loadPromises);
        
        return spriteNames.filter((_, index) => results[index]);
    }

    /**
     * 按分类加载精灵
     */
    async loadSpritesByCategory(category: SpriteCategory): Promise<string[]> {
        if (!this.spriteCatalog) {
            await this.loadSpriteCatalog();
        }

        const categorySprites = Object.entries(this.spriteCatalog || {})
            .filter(([_, info]) => info.category === category)
            .map(([name, _]) => name);

        return this.loadSprites(categorySprites);
    }

    /**
     * 创建精灵游戏对象
     */
    createSprite(x: number, y: number, spriteName: string): Phaser.GameObjects.Sprite | null {
        if (!this.loadedSprites.has(spriteName)) {
            console.warn(`精灵 ${spriteName} 尚未加载`);
            return null;
        }

        return this.scene.add.sprite(x, y, spriteName);
    }

    /**
     * 创建精灵图像游戏对象
     */
    createImage(x: number, y: number, spriteName: string): Phaser.GameObjects.Image | null {
        if (!this.loadedSprites.has(spriteName)) {
            console.warn(`精灵 ${spriteName} 尚未加载`);
            return null;
        }

        return this.scene.add.image(x, y, spriteName);
    }

    /**
     * 创建动画序列
     */
    createAnimation(key: string, spriteNames: string[], frameRate: number = 8, repeat: number = -1): void {
        // 确保所有帧都已加载
        const unloadedFrames = spriteNames.filter(name => !this.loadedSprites.has(name));
        if (unloadedFrames.length > 0) {
            console.warn(`动画 ${key} 的某些帧尚未加载:`, unloadedFrames);
            return;
        }

        // 创建动画
        this.scene.anims.create({
            key: key,
            frames: spriteNames.map(name => ({ key: name })),
            frameRate: frameRate,
            repeat: repeat
        });

        console.log(`✅ 动画创建完成: ${key} (${spriteNames.length} 帧)`);
    }

    /**
     * 创建角色行走动画
     */
    createWalkingAnimations(characterName: string = 'player'): void {
        const directions = ['down', 'up', 'left', 'right'];
        
        directions.forEach(direction => {
            const frames = [
                `${characterName}_${direction}_idle`,
                `${characterName}_${direction}_walk1`,
                `${characterName}_${direction}_walk2`,
                `${characterName}_${direction}_walk3`
            ];
            
            this.createAnimation(`${characterName}_walk_${direction}`, frames, 8, -1);
        });
    }

    /**
     * 创建作物生长动画
     */
    createCropGrowthAnimations(): void {
        const crops = ['wheat', 'carrot', 'potato'];
        
        crops.forEach(crop => {
            const stages = [
                `${crop}_stage_1`,
                `${crop}_stage_2`,
                `${crop}_stage_3`,
                `${crop}_stage_4`,
                `${crop}_harvest`
            ];
            
            this.createAnimation(`${crop}_growth`, stages, 2, 0); // 慢速播放，不重复
        });
    }

    /**
     * 获取精灵信息
     */
    getSpriteInfo(spriteName: string): SpriteInfo | null {
        return this.spriteCatalog?.[spriteName] || null;
    }

    /**
     * 获取分类中的所有精灵名称
     */
    getSpritesByCategory(category: SpriteCategory): string[] {
        if (!this.spriteCatalog) return [];
        
        return Object.entries(this.spriteCatalog)
            .filter(([_, info]) => info.category === category)
            .map(([name, _]) => name);
    }

    /**
     * 检查精灵是否已加载
     */
    isSpriteLoaded(spriteName: string): boolean {
        return this.loadedSprites.has(spriteName);
    }

    /**
     * 获取已加载的精灵列表
     */
    getLoadedSprites(): string[] {
        return Array.from(this.loadedSprites);
    }

    /**
     * 预加载游戏必需的精灵
     */
    async preloadEssentialSprites(): Promise<void> {
        const essentialSprites = [
            // 玩家角色
            'player_down_idle', 'player_up_idle', 'player_left_idle', 'player_right_idle',
            'player_down_walk1', 'player_down_walk2', 'player_down_walk3',
            'player_up_walk1', 'player_up_walk2', 'player_up_walk3',
            'player_left_walk1', 'player_left_walk2', 'player_left_walk3',
            'player_right_walk1', 'player_right_walk2', 'player_right_walk3',
            
            // 基础地形
            'grass_basic', 'dirt_basic', 'dirt_tilled',
            
            // 基础工具
            'hoe', 'watering_can', 'seeds_wheat',
            
            // 基础作物
            'wheat_stage_1', 'wheat_stage_2', 'wheat_stage_3', 'wheat_stage_4', 'wheat_harvest'
        ];

        console.log('🚀 开始预加载必需精灵...');
        const loaded = await this.loadSprites(essentialSprites);
        console.log(`✅ 预加载完成: ${loaded.length}/${essentialSprites.length} 个精灵`);
        
        // 创建基础动画
        this.createWalkingAnimations();
        this.createCropGrowthAnimations();
    }

    /**
     * 获取fallback精灵目录（当无法加载外部目录时使用）
     */
    private getFallbackCatalog(): SpriteCatalog {
        return {
            // 基础精灵定义，作为fallback
            'grass_basic': {
                file: 'overworld/grass_basic.png',
                atlas: 'Overworld.png',
                x: 0, y: 0, width: 32, height: 32,
                category: 'terrain'
            },
            'player_down_idle': {
                file: 'characters/player_down_idle.png',
                atlas: 'character.png',
                x: 0, y: 0, width: 16, height: 16,
                category: 'player'
            },
            'hoe': {
                file: 'objects/hoe.png',
                atlas: 'objects.png',
                x: 0, y: 0, width: 16, height: 16,
                category: 'tools'
            }
        };
    }

    /**
     * 清理资源
     */
    cleanup(): void {
        this.loadedSprites.clear();
        this.spriteCatalog = null;
        console.log('🧹 精灵管理器已清理');
    }
}

// 类型定义
export type SpriteCategory = 
    | 'terrain' 
    | 'buildings' 
    | 'decorations' 
    | 'fences' 
    | 'roads' 
    | 'crops' 
    | 'flowers' 
    | 'trees' 
    | 'wild' 
    | 'tools' 
    | 'seeds' 
    | 'storage' 
    | 'food' 
    | 'player' 
    | 'actions' 
    | 'tileset' 
    | 'animals' 
    | 'ui' 
    | 'misc';

export interface SpriteInfo {
    file: string;
    atlas: string;
    x: number;
    y: number;
    width: number;
    height: number;
    category: SpriteCategory;
}

export type SpriteCatalog = Record<string, SpriteInfo>;

/**
 * 精灵管理器工厂函数
 */
export function createSpriteManager(scene: Phaser.Scene): ImprovedSpriteManager {
    return new ImprovedSpriteManager(scene);
}