import * as Phaser from 'phaser';

/**
 * 农场区域接口
 * 定义农场中各个区域的位置和类型
 */
export interface FarmArea {
    x: number;      // 区域X坐标
    y: number;      // 区域Y坐标
    width: number;  // 区域宽度
    height: number; // 区域高度
    type: 'house' | 'pond' | 'farm' | 'road' | 'forest';  // 区域类型
}

/**
 * 农场资源接口
 * 定义农场中各种资源的位置和属性
 */
export interface FarmAsset {
    key: string;    // 资源键名
    x: number;      // X坐标
    y: number;      // Y坐标
    scale?: number; // 缩放比例
    depth?: number; // 渲染深度
    rotation?: number; // 旋转角度
}

/**
 * 农场布局管理器
 * 负责管理农场的整体布局，包括区域划分和资源放置
 */
export class FarmLayoutManager {
    private scene: Phaser.Scene;        // 游戏场景引用
    private screenWidth: number;        // 屏幕宽度
    private screenHeight: number;       // 屏幕高度
    private areas: FarmArea[] = [];     // 农场区域数组
    private assets: FarmAsset[] = [];   // 农场资源数组

    /**
     * 构造函数
     * @param scene 游戏场景
     */
    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.screenWidth = scene.cameras.main.width;
        this.screenHeight = scene.cameras.main.height;
        this.calculateAreas();  // 计算农场区域
    }

    /**
     * 计算农场区域布局
     * 重新设计布局以避免重叠和遮挡问题
     * 布局：左侧40%为房子区域，中间20%为道路，右侧40%为池塘和农场
     * 在开发环境中自动调整以避免开发者工具遮挡
     */
    private calculateAreas() {
        const margin = 50;  // 边距

        // 检测是否在开发环境中（可能打开开发者工具）
        const isDevelopment = typeof window !== 'undefined' && (
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.port !== ''
        );

        // 在开发环境中，预留更多空间给开发者工具
        const rightMargin = isDevelopment ? 450 : margin;
        const usableWidth = this.screenWidth - (margin + rightMargin);   // 可用宽度
        const usableHeight = this.screenHeight - (margin * 2); // 可用高度

        // 房子区域 - 左侧 40% 宽度，上半部分
        this.areas.push({
            x: margin,
            y: margin,
            width: usableWidth * 0.4,
            height: usableHeight * 0.5,
            type: 'house'
        });

        // 道路区域 - 中间 20% 宽度，垂直贯穿
        this.areas.push({
            x: margin + usableWidth * 0.4,
            y: margin,
            width: usableWidth * 0.2,
            height: usableHeight,
            type: 'road'
        });

        // 池塘区域 - 右侧 40% 宽度，上半部分
        this.areas.push({
            x: margin + usableWidth * 0.6,
            y: margin,
            width: usableWidth * 0.4,
            height: usableHeight * 0.4,
            type: 'pond'
        });

        // 土地区域 - 右侧 40% 宽度，下半部分
        this.areas.push({
            x: margin + usableWidth * 0.6,
            y: margin + usableHeight * 0.5,
            width: usableWidth * 0.4,
            height: usableHeight * 0.5,
            type: 'farm'
        });
    }

    /**
     * 创建农场布局
     * 根据计算好的区域创建完整的农场布局
     * @returns 包含所有农场元素的组对象
     */
    public createFarmLayout(): Phaser.GameObjects.Group {
        const farmGroup = this.scene.add.group();  // 创建农场组

        // 创建各个区域
        this.areas.forEach(area => {
            switch (area.type) {
                case 'house':
                    this.createHouseArea(area, farmGroup);  // 创建房子区域
                    break;
                case 'pond':
                    this.createPondArea(area, farmGroup);   // 创建池塘区域
                    break;
                case 'farm':
                    this.createFarmArea(area, farmGroup);   // 创建农场区域
                    break;
                case 'road':
                    this.createRoadArea(area, farmGroup);   // 创建道路区域
                    break;
            }
        });

        return farmGroup;  // 返回农场组
    }

    /**
     * 创建房子区域
     * 在指定区域创建房子、花园和仓库
     * @param area 房子区域信息
     * @param group 要添加到的组对象
     */
    private createHouseArea(area: FarmArea, group: Phaser.GameObjects.Group) {
        // 使用从Overworld.png分割出的房子素材
        const house = this.scene.add.sprite(
            area.x + area.width * 0.5,  // 房子X坐标（区域中心）
            area.y + area.height * 0.7, // 房子Y坐标（区域70%位置）
            'farm_house_main'           // 主房屋纹理（从图集分割）
        );
        house.setOrigin(0.5, 1);        // 设置原点为底部中心
        house.setScale(1.5);            // 设置缩放比例
        house.setDepth(10);             // 设置渲染深度
        group.add(house);               // 添加到组

        // 添加花园装饰（使用分割出的花朵精灵）
        const gardenPositions = [
            { x: area.x + area.width * 0.3, y: area.y + area.height * 0.8 },  // 左侧花朵
            { x: area.x + area.width * 0.7, y: area.y + area.height * 0.8 },  // 右侧花朵
            { x: area.x + area.width * 0.5, y: area.y + area.height * 0.9 }   // 中间花朵
        ];

        const flowerTypes = ['flower_red', 'flower_white', 'flower_red']; // 花朵类型
        gardenPositions.forEach((pos, index) => {
            const flower = this.scene.add.sprite(pos.x, pos.y, flowerTypes[index]);  // 创建花朵精灵
            flower.setOrigin(0.5, 1);  // 设置原点为底部中心
            flower.setDepth(5);        // 设置渲染深度
            group.add(flower);         // 添加到组
        });

        // 添加小仓库（使用分割出的谷仓精灵）
        const barn = this.scene.add.sprite(
            area.x + area.width * 0.8,  // 仓库X坐标（区域80%位置）
            area.y + area.height * 0.6, // 仓库Y坐标（区域60%位置）
            'farm_barn'                  // 谷仓纹理（从图集分割）
        );
        barn.setOrigin(0.5, 1);        // 设置原点为底部中心
        barn.setScale(1.2);            // 设置缩放比例
        barn.setDepth(10);             // 设置渲染深度
        group.add(barn);               // 添加到组
    }

    private createPondArea(area: FarmArea, group: Phaser.GameObjects.Group) {
        // 创建主池塘 - 使用从图集分割的水面图块
        const pondTiles = [];
        const tileSize = 32;
        const pondRadius = Math.min(area.width, area.height) * 0.3;
        const centerX = area.x + area.width * 0.5;
        const centerY = area.y + area.height * 0.5;

        // 创建水面图块网格
        for (let x = centerX - pondRadius; x < centerX + pondRadius; x += tileSize) {
            for (let y = centerY - pondRadius; y < centerY + pondRadius; y += tileSize) {
                const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                if (distance <= pondRadius) {
                    const waterTile = this.scene.add.sprite(x, y, 'water_tile');
                    waterTile.setDepth(5);
                    group.add(waterTile);
                    pondTiles.push(waterTile);
                }
            }
        }

        // 添加水波纹动画
        this.createWaterRipples(centerX, centerY, group);

        // 添加池塘边的石头（使用分割出的石头精灵）
        const stonePositions = [
            { x: area.x + area.width * 0.3, y: area.y + area.height * 0.4 },
            { x: area.x + area.width * 0.7, y: area.y + area.height * 0.6 },
            { x: area.x + area.width * 0.2, y: area.y + area.height * 0.7 }
        ];

        const stoneTypes = ['rock_small', 'rock_large', 'rock_small'];
        stonePositions.forEach((pos, index) => {
            const stone = this.scene.add.sprite(pos.x, pos.y, stoneTypes[index]);
            stone.setDepth(6);
            group.add(stone);
        });

        // 添加水井（使用分割出的水井精灵）
        const well = this.scene.add.sprite(
            area.x + area.width * 0.8,
            area.y + area.height * 0.7,
            'farm_well'
        );
        well.setOrigin(0.5, 1);
        well.setDepth(6);
        group.add(well);
    }

    private createWaterRipples(centerX: number, centerY: number, group: Phaser.GameObjects.Group) {
        this.scene.time.addEvent({
            delay: 2000,
            callback: () => {
                const ripple = this.scene.add.circle(centerX, centerY, 8, 0x74b9ff, 0.4);
                ripple.setDepth(4);
                group.add(ripple);

                const tweenConfig: Phaser.Types.Tweens.TweenBuilderConfig = {
                    targets: ripple,
                    scaleX: 4,
                    scaleY: 4,
                    alpha: 0,
                    duration: 2000,
                    ease: 'Power2',
                    onComplete: () => {
                        ripple.destroy();
                    }
                } as Phaser.Types.Tweens.TweenBuilderConfig;
                this.scene.tweens.add(tweenConfig);
            },
            loop: true
        });
    }

    private createFarmArea(area: FarmArea, group: Phaser.GameObjects.Group) {
        // 使用从图集分割的草地图块作为基础地形
        const grassTile = this.scene.add.tileSprite(
            area.x + area.width * 0.5,
            area.y + area.height * 0.5,
            area.width,
            area.height,
            'grass_tile'
        );
        grassTile.setDepth(1);
        group.add(grassTile);

        // 添加农场边界围栏（使用分割出的围栏精灵）
        this.createFarmFence(area, group);

        // 添加装饰性树木
        const treePositions = [
            { x: area.x + area.width * 0.1, y: area.y + area.height * 0.1 },
            { x: area.x + area.width * 0.9, y: area.y + area.height * 0.1 },
            { x: area.x + area.width * 0.1, y: area.y + area.height * 0.9 },
            { x: area.x + area.width * 0.9, y: area.y + area.height * 0.9 }
        ];

        const treeTypes = ['tree_small', 'tree_large', 'tree_small', 'tree_large'];
        treePositions.forEach((pos, index) => {
            const tree = this.scene.add.sprite(pos.x, pos.y, treeTypes[index]);
            tree.setOrigin(0.5, 1);
            tree.setDepth(8);
            group.add(tree);
        });

        // 添加风车（使用现有的动画精灵）
        const windmill = this.scene.add.sprite(
            area.x + area.width * 0.8,
            area.y + area.height * 0.2,
            'farm_windmill'
        );
        windmill.setOrigin(0.5, 1);
        windmill.setDepth(12);
        group.add(windmill);

        // 创建风车动画（资源存在时）
        if (this.scene.textures.exists('farm_windmill')) {
            if (!this.scene.anims.exists('windmill_spin')) {
                this.scene.anims.create({
                    key: 'windmill_spin',
                    frames: this.scene.anims.generateFrameNumbers('farm_windmill', { start: 0, end: 7 }),
                    frameRate: 3,
                    repeat: -1
                });
            }
            if (windmill.anims) {
                windmill.play('windmill_spin');
            }
        }
    }

    private createFarmFence(area: FarmArea, group: Phaser.GameObjects.Group) {
        // 使用从图集分割的围栏精灵
        const fencePositions = [
            // 上边界 - 水平围栏
            { x: area.x + area.width * 0.2, y: area.y + area.height * 0.05, type: 'fence_horizontal' },
            { x: area.x + area.width * 0.5, y: area.y + area.height * 0.05, type: 'fence_horizontal' },
            { x: area.x + area.width * 0.8, y: area.y + area.height * 0.05, type: 'fence_horizontal' },
            // 下边界 - 水平围栏
            { x: area.x + area.width * 0.2, y: area.y + area.height * 0.95, type: 'fence_horizontal' },
            { x: area.x + area.width * 0.5, y: area.y + area.height * 0.95, type: 'fence_horizontal' },
            { x: area.x + area.width * 0.8, y: area.y + area.height * 0.95, type: 'fence_horizontal' },
            // 左边界 - 垂直围栏
            { x: area.x + area.width * 0.05, y: area.y + area.height * 0.2, type: 'fence_vertical' },
            { x: area.x + area.width * 0.05, y: area.y + area.height * 0.5, type: 'fence_vertical' },
            { x: area.x + area.width * 0.05, y: area.y + area.height * 0.8, type: 'fence_vertical' },
            // 右边界 - 垂直围栏
            { x: area.x + area.width * 0.95, y: area.y + area.height * 0.2, type: 'fence_vertical' },
            { x: area.x + area.width * 0.95, y: area.y + area.height * 0.5, type: 'fence_vertical' },
            { x: area.x + area.width * 0.95, y: area.y + area.height * 0.8, type: 'fence_vertical' },
            // 四个角落 - 围栏转角
            { x: area.x + area.width * 0.05, y: area.y + area.height * 0.05, type: 'fence_corner' },
            { x: area.x + area.width * 0.95, y: area.y + area.height * 0.05, type: 'fence_corner' },
            { x: area.x + area.width * 0.05, y: area.y + area.height * 0.95, type: 'fence_corner' },
            { x: area.x + area.width * 0.95, y: area.y + area.height * 0.95, type: 'fence_corner' }
        ];

        fencePositions.forEach(pos => {
            const fence = this.scene.add.sprite(pos.x, pos.y, pos.type);
            fence.setDepth(4);
            group.add(fence);
        });
    }

    private createRoadArea(area: FarmArea, group: Phaser.GameObjects.Group) {
        // 使用从图集分割的道路图块创建道路
        const tileSize = 32;
        const startX = area.x;
        const startY = area.y;
        const endX = area.x + area.width;
        const endY = area.y + area.height;

        // 创建道路图块网格
        for (let x = startX; x < endX; x += tileSize) {
            for (let y = startY; y < endY; y += tileSize) {
                let roadType = 'road_horizontal'; // 默认水平道路

                // 根据位置选择道路类型
                if (x === startX || x >= endX - tileSize) {
                    roadType = 'road_vertical'; // 边缘使用垂直道路
                } else if (y === startY || y >= endY - tileSize) {
                    roadType = 'road_horizontal'; // 上下边缘使用水平道路
                } else {
                    roadType = 'road_cross'; // 中间使用十字路口
                }

                const roadTile = this.scene.add.sprite(x + tileSize / 2, y + tileSize / 2, roadType);
                roadTile.setDepth(2);
                group.add(roadTile);
            }
        }

        // 添加道路装饰（路标）
        const signPositions = [
            { x: area.x + area.width * 0.2, y: area.y + area.height * 0.3 },
            { x: area.x + area.width * 0.8, y: area.y + area.height * 0.7 }
        ];

        signPositions.forEach(pos => {
            const sign = this.scene.add.sprite(pos.x, pos.y, 'signpost');
            sign.setOrigin(0.5, 1);
            sign.setDepth(3);
            group.add(sign);
        });
    }

    public getFarmPlotPositions(): { x: number; y: number }[] {
        const farmArea = this.areas.find(area => area.type === 'farm');
        if (!farmArea) return [];

        const positions: { x: number; y: number }[] = [];
        const plotSpacing = 60;
        const margin = 80;

        const startX = farmArea.x + margin;
        const startY = farmArea.y + margin;
        const endX = farmArea.x + farmArea.width - margin;
        const endY = farmArea.y + farmArea.height - margin;

        const cols = Math.floor((endX - startX) / plotSpacing);
        const rows = Math.floor((endY - startY) / plotSpacing);

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = startX + (col * plotSpacing);
                const y = startY + (row * plotSpacing);

                if (x >= startX && x <= endX && y >= startY && y <= endY) {
                    positions.push({ x, y });
                }
            }
        }

        return positions;
    }

    public getCookingStationPositions(): { x: number; y: number }[] {
        const houseArea = this.areas.find(area => area.type === 'house');
        const roadArea = this.areas.find(area => area.type === 'road');

        const positions: { x: number; y: number }[] = [];

        if (houseArea) {
            positions.push({
                x: houseArea.x + houseArea.width * 0.3,
                y: houseArea.y + houseArea.height * 0.6
            });
        }

        if (roadArea) {
            positions.push({
                x: roadArea.x + roadArea.width * 0.5,
                y: roadArea.y + roadArea.height * 0.3
            });
        }

        return positions;
    }

    public getAreas(): FarmArea[] {
        return this.areas;
    }
}
