import * as Phaser from 'phaser';

/**
 * 精灵图集管理器
 * 负责动态分割和管理大型图集中的精灵
 */
export class SpriteAtlasManager {
    private scene: Phaser.Scene;
    private atlasKey: string;
    private frameWidth: number;
    private frameHeight: number;
    private atlasWidth: number = 0;
    private atlasHeight: number = 0;

    /**
     * 构造函数
     * @param scene 游戏场景
     * @param atlasKey 图集键名
     * @param frameWidth 单个精灵宽度
     * @param frameHeight 单个精灵高度
     */
    constructor(scene: Phaser.Scene, atlasKey: string, frameWidth: number = 32, frameHeight: number = 32) {
        this.scene = scene;
        this.atlasKey = atlasKey;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;

        // 获取图集尺寸
        const texture = this.scene.textures.get(atlasKey);
        if (texture) {
            const source = texture.getSourceImage() as HTMLImageElement;
            this.atlasWidth = source.width;
            this.atlasHeight = source.height;
        }
    }

    /**
 * 从图集中提取指定区域的精灵
 * @param key 精灵键名
 * @param x 图集中的X坐标
 * @param y 图集中的Y坐标
 * @param width 精灵宽度
 * @param height 精灵高度
 * @returns 是否成功创建精灵
 */
    public extractSprite(key: string, x: number, y: number, width: number = this.frameWidth, height: number = this.frameHeight): boolean {
        try {
            // 检查图集是否已加载
            if (!this.scene.textures.exists(this.atlasKey)) {
                console.warn(`Atlas ${this.atlasKey} not found`);
                return false;
            }

            // 从图集中提取指定区域
            const texture = this.scene.textures.get(this.atlasKey);
            const source = texture.getSourceImage() as HTMLImageElement;

            // 创建canvas来提取指定区域
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return false;

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(source, x, y, width, height, 0, 0, width, height);

            // 将canvas转换为纹理
            this.scene.textures.addCanvas(key, canvas);
            console.log(`Extracted sprite: ${key} from ${this.atlasKey} at (${x}, ${y})`);
            return true;
        } catch (error) {
            console.error(`Failed to extract sprite ${key}:`, error);
            return false;
        }
    }

    /**
     * 批量提取精灵
     * @param sprites 精灵定义数组
     */
    public extractSprites(sprites: Array<{ key: string, x: number, y: number, width?: number, height?: number }>): void {
        sprites.forEach(sprite => {
            this.extractSprite(sprite.key, sprite.x, sprite.y, sprite.width, sprite.height);
        });
    }

    /**
     * 从Overworld.png图集中提取农场相关精灵
     * 根据图集内容定义具体的精灵位置
     */
    public extractFarmSprites(): void {
        // 定义Overworld.png中的精灵位置
        // 这些坐标需要根据实际的Overworld.png图集进行调整
        const farmSprites = [
            // 房屋相关
            { key: 'farm_house_main', x: 0, y: 0, width: 64, height: 48 },      // 主房屋
            { key: 'farm_house_small', x: 64, y: 0, width: 48, height: 32 },    // 小房屋
            { key: 'farm_barn', x: 112, y: 0, width: 56, height: 40 },          // 谷仓
            { key: 'farm_well', x: 168, y: 0, width: 24, height: 32 },          // 水井

            // 地形相关
            { key: 'grass_tile', x: 0, y: 48, width: 32, height: 32 },          // 草地
            { key: 'dirt_tile', x: 32, y: 48, width: 32, height: 32 },          // 泥土
            { key: 'stone_tile', x: 64, y: 48, width: 32, height: 32 },         // 石头
            { key: 'water_tile', x: 96, y: 48, width: 32, height: 32 },         // 水

            // 道路相关
            { key: 'road_horizontal', x: 128, y: 48, width: 32, height: 32 },   // 水平道路
            { key: 'road_vertical', x: 160, y: 48, width: 32, height: 32 },     // 垂直道路
            { key: 'road_cross', x: 192, y: 48, width: 32, height: 32 },        // 十字路口

            // 装饰物
            { key: 'tree_small', x: 0, y: 80, width: 24, height: 32 },          // 小树
            { key: 'tree_large', x: 24, y: 80, width: 32, height: 48 },         // 大树
            { key: 'bush', x: 56, y: 80, width: 16, height: 16 },               // 灌木
            { key: 'flower_red', x: 72, y: 80, width: 8, height: 8 },           // 红花
            { key: 'flower_white', x: 80, y: 80, width: 8, height: 8 },         // 白花

            // 围栏
            { key: 'fence_horizontal', x: 88, y: 80, width: 32, height: 16 },   // 水平围栏
            { key: 'fence_vertical', x: 120, y: 80, width: 16, height: 32 },    // 垂直围栏
            { key: 'fence_corner', x: 136, y: 80, width: 16, height: 16 },      // 围栏转角

            // 石头和岩石
            { key: 'rock_small', x: 152, y: 80, width: 16, height: 16 },        // 小石头
            { key: 'rock_large', x: 168, y: 80, width: 24, height: 20 },        // 大石头

            // 其他装饰
            { key: 'signpost', x: 192, y: 80, width: 16, height: 24 },          // 路标
            { key: 'lantern', x: 208, y: 80, width: 12, height: 16 },           // 灯笼
            { key: 'bench', x: 220, y: 80, width: 32, height: 16 },             // 长凳
        ];

        this.extractSprites(farmSprites);
    }

    /**
     * 从Plants.png图集中提取作物相关精灵
     * 基于用户提供的实际坐标
     */
    public extractPlantSprites(): void {
        // Plants.png 精灵定义 - 基于用户提供的实际坐标
        const plantSprites = [
            // 花朵精灵（8x8像素）- 用户提供的实际坐标
            { key: 'hua_248_128', x: 248, y: 128, width: 8, height: 8 },
            { key: 'hua_256_128', x: 256, y: 128, width: 8, height: 8 },
            { key: 'hua_256_136', x: 256, y: 136, width: 8, height: 8 },
            { key: 'hua_248_136', x: 248, y: 136, width: 8, height: 8 },
            { key: 'hua_248_144', x: 248, y: 144, width: 8, height: 8 },
            { key: 'hua_256_144', x: 256, y: 144, width: 8, height: 8 },
            { key: 'hua_248_152', x: 248, y: 152, width: 8, height: 8 },
            { key: 'hua_256_152', x: 256, y: 152, width: 8, height: 8 }
        ];
        this.extractSprites(plantSprites);
    }

    /**
     * 从Objects.png图集中提取物品相关精灵
     */
    public extractObjectSprites(): void {
        const objectSprites = [
            // 工具和物品
            { key: 'watering_can', x: 0, y: 0, width: 16, height: 16 },         // 浇水壶
            { key: 'hoe', x: 16, y: 0, width: 16, height: 16 },                 // 锄头
            { key: 'axe', x: 32, y: 0, width: 16, height: 16 },                 // 斧头
            { key: 'pickaxe', x: 48, y: 0, width: 16, height: 16 },             // 镐子
            { key: 'scythe', x: 64, y: 0, width: 16, height: 16 },              // 镰刀
            { key: 'fertilizer', x: 80, y: 0, width: 16, height: 16 },          // 肥料

            // 容器和存储
            { key: 'chest_wooden', x: 0, y: 16, width: 16, height: 16 },        // 木箱
            { key: 'chest_metal', x: 16, y: 16, width: 16, height: 16 },        // 金属箱
            { key: 'barrel', x: 32, y: 16, width: 16, height: 16 },             // 木桶
            { key: 'crate', x: 48, y: 16, width: 16, height: 16 },              // 板条箱

            // 建筑和结构
            { key: 'silo', x: 0, y: 32, width: 32, height: 32 },                // 筒仓
            { key: 'greenhouse', x: 32, y: 32, width: 32, height: 32 },         // 温室
            { key: 'shed', x: 64, y: 32, width: 32, height: 32 },               // 棚屋
            { key: 'coop', x: 96, y: 32, width: 32, height: 32 },               // 鸡舍

            // 装饰物品
            { key: 'scarecrow', x: 0, y: 64, width: 16, height: 32 },           // 稻草人
            { key: 'mailbox', x: 16, y: 64, width: 16, height: 16 },            // 邮箱
            { key: 'lamp_post', x: 32, y: 64, width: 16, height: 32 },          // 路灯
            { key: 'fountain', x: 48, y: 64, width: 32, height: 32 },           // 喷泉
        ];

        this.extractSprites(objectSprites);
    }

    /**
     * 从Character.png图集中提取角色相关精灵
     */
    public extractCharacterSprites(): void {
        const characterSprites = [
            // 玩家角色动画帧
            { key: 'player_idle', x: 0, y: 0, width: 16, height: 16 },          // 待机
            { key: 'player_walk_1', x: 16, y: 0, width: 16, height: 16 },       // 行走1
            { key: 'player_walk_2', x: 32, y: 0, width: 16, height: 16 },       // 行走2
            { key: 'player_walk_3', x: 48, y: 0, width: 16, height: 16 },       // 行走3
            { key: 'player_walk_4', x: 64, y: 0, width: 16, height: 16 },       // 行走4

            // 动作动画
            { key: 'player_action_1', x: 0, y: 16, width: 16, height: 16 },     // 动作1
            { key: 'player_action_2', x: 16, y: 16, width: 16, height: 16 },    // 动作2
            { key: 'player_action_3', x: 32, y: 16, width: 16, height: 16 },    // 动作3

            // NPC角色
            { key: 'npc_farmer', x: 0, y: 32, width: 16, height: 16 },          // 农民NPC
            { key: 'npc_merchant', x: 16, y: 32, width: 16, height: 16 },       // 商人NPC
            { key: 'npc_villager', x: 32, y: 32, width: 16, height: 16 },       // 村民NPC
        ];

        this.extractSprites(characterSprites);
    }

    /**
     * 创建动画精灵表
     * @param key 动画键名
     * @param startX 起始X坐标
     * @param startY 起始Y坐标
     * @param frameCount 帧数
     * @param frameWidth 帧宽度
     * @param frameHeight 帧高度
     * @param spacing 帧间距
     */
    public createAnimationSpritesheet(key: string, startX: number, startY: number, frameCount: number, frameWidth: number = this.frameWidth, frameHeight: number = this.frameHeight, spacing: number = 0): void {
        try {
            // 创建动画精灵表
            const frames = [];
            for (let i = 0; i < frameCount; i++) {
                const x = startX + (i * (frameWidth + spacing));
                const y = startY;

                // 为每一帧创建单独的精灵
                const frameKey = `${key}_frame_${i}`;
                if (this.extractSprite(frameKey, x, y, frameWidth, frameHeight)) {
                    frames.push(frameKey);
                }
            }

            // 创建动画
            if (frames.length > 0) {
                this.scene.anims.create({
                    key: key,
                    frames: frames.map(frameKey => ({ key: frameKey })),
                    frameRate: 8,
                    repeat: -1
                });
                console.log(`Created animation: ${key} with ${frames.length} frames`);
            }
        } catch (error) {
            console.error(`Failed to create animation spritesheet ${key}:`, error);
        }
    }

    /**
     * 获取图集信息
     * @returns 图集尺寸信息
     */
    public getAtlasInfo(): { width: number, height: number, frameWidth: number, frameHeight: number } {
        return {
            width: this.atlasWidth,
            height: this.atlasHeight,
            frameWidth: this.frameWidth,
            frameHeight: this.frameHeight
        };
    }

    /**
     * 清理提取的精灵
     * @param keys 要清理的精灵键名数组
     */
    public cleanupSprites(keys: string[]): void {
        keys.forEach(key => {
            if (this.scene.textures.exists(key)) {
                this.scene.textures.remove(key);
                console.log(`Cleaned up sprite: ${key}`);
            }
        });
    }
}
