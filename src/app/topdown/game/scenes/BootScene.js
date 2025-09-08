/**
 * 游戏启动场景
 * 
 * 这是游戏的第一个场景，负责：
 * - 显示加载进度条
 * - 预加载所有游戏资源（图片、音频、地图等）
 * - 设置游戏字体
 * - 资源加载完成后自动跳转到主菜单场景
 * 
 * 使用方法：
 * 1. 场景会自动启动，无需手动调用
 * 2. 资源加载完成后会自动切换到下一个场景
 * 3. 可以通过修改 preload() 方法添加新的游戏资源
 * 
 * 资源加载顺序：
 * 1. 游戏地图文件（Tiled 格式）
 * 2. 角色精灵图片
 * 3. 物品和 UI 图片
 * 4. 音频文件
 * 5. 字体文件
 */

import { Scene } from 'phaser';

// JSON 文件 - 现在从 public/game/assets/ 提供
// 包括地图数据、动画配置等

// 图片文件 - 现在从 public/game/assets/ 提供
// 包括角色精灵、物品图片、UI 元素等

/**
 * 启动场景类
 * 继承自 Phaser.Scene
 */
export default class BootScene extends Scene {
    /**
     * 构造函数
     * 设置场景名称
     */
    constructor() {
        super('BootScene');
    }

    /**
     * 预加载方法
     * 在场景启动时自动调用，负责加载所有游戏资源
     */
    preload() {
        const fontSize = 16;

        // 设置加载进度条
        this.setupLoadingBar(fontSize);

        // 加载游戏地图文件
        this.loadMaps();

        // 加载角色精灵图片
        this.loadCharacterSprites();

        // 加载物品和 UI 图片
        this.loadItemsAndUI();

        // 加载音频文件
        //this.loadAudio();

        // 加载字体文件
        this.loadFonts();
    }

    /**
     * 设置加载进度条
     * 显示资源加载的进度和状态
     * 
     * @param {number} fontSize - 字体大小
     */
    setupLoadingBar(fontSize) {
        const progressBar = this.add.graphics();      // 进度条图形
        const progressBox = this.add.graphics();      // 进度条背景框
        const { width: gameWidth, height: gameHeight } = this.cameras.main;

        // 计算进度条位置和尺寸
        const barPositionX = Math.ceil((gameWidth - (gameWidth * 0.7)) / 2);
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(
            barPositionX,
            Math.ceil(gameHeight / 6),
            Math.ceil(gameWidth * 0.7),
            Math.ceil(gameHeight / 10)
        );

        // 加载文本
        const loadingText = this.add.text(
            gameWidth / 2,
            Math.ceil(gameHeight / 10),
            'loading...',
            {
                fontFamily: '"Press Start 2P"',  // 使用像素风格字体
                fontSize: `${fontSize}px`,
                size: `${fontSize}px`,
                fill: '#ffffff',
                color: '#ffffff',
            }
        );

        loadingText.setOrigin(0.5);
        loadingText.setResolution(30);

        // 百分比文本
        const percentText = this.add.text(
            gameWidth / 2,
            Math.ceil((gameHeight / 6) + (fontSize / 2) + (gameHeight / 60)),
            '0%',
            {
                fontFamily: '"Press Start 2P"',
                fontSize: `${fontSize}px`,
                size: `${fontSize}px`,
                fill: '#ffffff',
                color: '#ffffff',
            }
        );

        percentText.setOrigin(0.5);
        percentText.setResolution(30);

        // 当前加载的资源文本
        const assetText = this.add.text(
            gameWidth / 2,
            Math.ceil(gameHeight / 3),
            '',
            {
                fontFamily: '"Press Start 2P"',
                fontSize: `${fontSize / 2}px`,
                size: `${fontSize / 2}px`,
                fill: '#ffffff',
                color: '#ffffff',
            }
        );

        assetText.setOrigin(0.5);
        assetText.setResolution(30);

        // 监听加载进度事件
        this.load.on('progress', (value) => {
            // 更新进度条
            progressBar.clear();
            progressBar.fillStyle(0xFFFFFF, 1);
            progressBar.fillRect(
                barPositionX,
                Math.ceil(gameHeight / 6),
                Math.ceil(gameWidth * 0.7) * value,
                Math.ceil(gameHeight / 10)
            );
            // 更新百分比文本
            percentText.setText(`${Number.parseInt(value * 100, 10)}%`);
        });

        // 监听文件加载事件
        this.load.on('fileprogress', (file) => {
            // 显示当前正在加载的资源名称
            assetText.setText(`loading: ${file.key}`);
        });

        // 监听加载完成事件
        this.load.on('complete', () => {
            // 清理加载界面元素
            progressBar.destroy();
            progressBox.destroy();
            percentText.destroy();
            assetText.destroy();
        });
    }

    /**
     * 加载游戏地图文件
     * 包括主地图和各个区域的地图数据
     */
    loadMaps() {
        // 加载图块集
        this.load.image('ui_elements', '/game/assets/sprites/maps/tilesets/ui_elements.png');
        // 预加载与 TMX 中 tileset 名称一致的图像（用于 map 动态匹配）
        this.load.image('Grass', '/game/assets/graphics/environment/Grass.png');
        this.load.image('Hills', '/game/assets/graphics/environment/Hills.png');
        this.load.image('Fences', '/game/assets/graphics/environment/Fences.png');
        this.load.image('Plant Decoration', '/game/assets/graphics/environment/Plant Decoration.png');
        // 加载 Objects 图块集
        this.load.image('Objects', '/game/assets/graphics/objects/objects.png');
        this.load.image('Collision', '/game/assets/graphics/environment/Collision.png');
        this.load.image('Paths', '/game/assets/graphics/environment/Paths.png');
        this.load.image('interaction', '/game/assets/graphics/environment/interaction.png');
        this.load.image('Water', '/game/assets/graphics/environment/Water.png');
        this.load.image('House', '/game/assets/graphics/environment/House.png');
        this.load.image('House Decoration', '/game/assets/graphics/environment/House Decoration.png');

        // 水动画帧（0-3）
        for (let i = 0; i <= 3; i += 1) {
            this.load.image(`water_${i}`, `/game/assets/graphics/water/${i}.png`);
        }

        // 新地图（Tiled JSON，建议从 topdown/game/map.tmx 导出为 map.json 放置于 /public/topdown/game/）
        this.load.tilemapTiledJSON('map', '/topdown/game/map.json');

        this.load.tilemapTiledJSON('ui_elements', '/game/assets/sprites/maps/tilesets/ui_elements.json');
    }

    /**
     * 加载角色精灵图片
     * 包括主角、NPC、敌人等角色的精灵表
     */
    loadCharacterSprites() {
        // 主角（使用 directional 单帧素材）
        const directions = ['down', 'right', 'up', 'left'];
        directions.forEach((dir) => {
            // 行走序列帧 0-3
            for (let i = 0; i <= 3; i += 1) {
                this.load.image(`cat_${dir}_${i}`, `/game/assets/graphics/character/${dir}/${i}.png`);
            }
            // 待机帧（取 idle 目录下的 0.png）
            this.load.image(`cat_idle_${dir}`, `/game/assets/graphics/character/${dir}_idle/0.png`);
            // 待机帧补充：idle 目录下的 1.png（用于循环动画）
            this.load.image(`cat_idle_${dir}_1`, `/game/assets/graphics/character/${dir}_idle/1.png`);
        });
    }

    /**
     * 加载物品和 UI 图片
     * 包括游戏中的各种物品、UI 元素等
     */
    loadItemsAndUI() {
        // 物品图集
        this.load.atlas('coin', '/game/assets/sprites/atlas/coin.png', '/game/assets/sprites/atlas/coin.json');
        // 农场作物图集（0-种子，1-4生长，5-果实）
        this.load.atlas('farmplants', '/game/assets/sprites/atlas/farmplants.png', '/game/assets/sprites/atlas/farmplants.json');


        // UI 元素
        this.load.image('dialog_borderbox', '/game/assets/images/dialog_borderbox.png');
        this.load.image('main_menu_background', '/game/assets/images/main_menu_background.png');
        this.load.image('game_over_background', '/game/assets/images/game_over_background.png');
        this.load.image('game_logo', '/game/assets/images/game_logo.png');
    }

    /**
     * 加载音频文件
     * 包括背景音乐、音效等
     */
    loadAudio() {
        // 背景音乐
        this.load.audio('bgm', '/game/assets/audio/background_music.mp3');

        // 音效
        this.load.audio('coin_sound', '/game/assets/audio/coin.mp3');
        this.load.audio('walk_sound', '/game/assets/audio/walk.mp3');
    }

    /**
     * 加载字体文件
     * 确保游戏文本正确显示
     */
    loadFonts() {
        // 加载像素风格字体
        // this.load.webfont('Press Start 2P', '/game/assets/fonts/PressStart2P-Regular.ttf');
    }

    /**
     * 创建方法
     * 在资源加载完成后自动调用
     */
    create() {
        // 创建角色动画
        this.createAnimations();

        // 启动主菜单场景
        this.scene.start('MainMenuScene');
    }

    /**
     * 创建角色动画
     * 为角色精灵设置各种动画状态
     */
    createAnimations() {
        // 基于 directional 图像创建主角行走与待机动画
        const createWalk = (dir) => ({
            key: `cat_walk_${dir}`,
            frames: [0, 1, 2, 3].map((i) => ({ key: `cat_${dir}_${i}` })),
            frameRate: 8,
            repeat: -1,
            yoyo: true,
        });

        this.anims.create(createWalk('down'));
        this.anims.create(createWalk('up'));
        this.anims.create(createWalk('left'));
        this.anims.create(createWalk('right'));

        // idle 动画使用 0/1 双帧循环（避免与静态纹理 key 冲突，统一使用 cat_idle_anim_* 作为动画 key）
        const createIdle = (dir) => ({
            key: `cat_idle_anim_${dir}`,
            frames: [
                { key: `cat_idle_${dir}` },
                { key: `cat_idle_${dir}_1` },
            ],
            frameRate: 2,
            repeat: -1,
            yoyo: true,
        });

        this.anims.create(createIdle('down'));
        this.anims.create(createIdle('up'));
        this.anims.create(createIdle('left'));
        this.anims.create(createIdle('right'));

        // 水面动画
        this.anims.create({
            key: 'water_anim',
            frames: [0, 1, 2, 3].map((i) => ({ key: `water_${i}` })),
            frameRate: 6,
            repeat: -1,
            yoyo: false,
        });
    }
}
