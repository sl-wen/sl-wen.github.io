import { Scene, Loader } from 'phaser';

/**
 * 游戏启动场景
 * 负责加载所有游戏资源并显示加载进度
 */
export default class BootScene extends Scene {
    constructor() {
        super('BootScene');
    }

    /**
     * 预加载阶段 - 加载所有游戏资源
     */
    preload(): void {
        const fontSize = 16;

        // 设置加载进度条
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        const { width: gameWidth, height: gameHeight } = this.cameras.main;

        // 计算进度条位置
        const barPositionX = Math.ceil((gameWidth - (gameWidth * 0.7)) / 2);
        
        // 绘制进度条背景
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(
            barPositionX,
            Math.ceil(gameHeight / 6),
            Math.ceil(gameWidth * 0.7),
            Math.ceil(gameHeight / 10)
        );

        // 创建加载文本
        const loadingText = this.add.text(
            gameWidth / 2,
            Math.ceil(gameHeight / 10),
            'loading...',
            {
                fontFamily: '"Press Start 2P"',
                fontSize: `${fontSize}px`,
                color: '#ffffff',
            }
        );

        loadingText.setOrigin(0.5);
        loadingText.setResolution(30);

        // 创建百分比文本
        const percentText = this.add.text(
            gameWidth / 2,
            Math.ceil((gameHeight / 6) + (fontSize / 2) + (gameHeight / 60)),
            '0%',
            {
                fontFamily: '"Press Start 2P"',
                fontSize: `${fontSize}px`,
                color: '#ffffff',
            }
        );

        percentText.setOrigin(0.5);
        percentText.setResolution(30);

        // 创建资源加载文本
        const assetText = this.add.text(
            gameWidth / 2,
            Math.ceil(gameHeight / 3),
            '',
            {
                fontFamily: '"Press Start 2P"',
                fontSize: `${fontSize / 2}px`,
                color: '#ffffff',
            }
        );

        assetText.setOrigin(0.5);
        assetText.setResolution(30);

        // 监听加载进度事件
        this.load.on('progress', (value: number) => {
            progressBar.clear();
            progressBar.fillStyle(0xFFFFFF, 1);
            progressBar.fillRect(
                barPositionX,
                Math.ceil(gameHeight / 6),
                Math.ceil(gameWidth * 0.7) * value,
                Math.ceil(gameHeight / 10)
            );
            percentText.setText(`${Number.parseInt((value * 100).toString(), 10)}%`);
        });

        // 监听文件加载事件
        this.load.on('fileprogress', (file: Loader.File) => {
            assetText.setText(`loading: ${file.key}`);
        });

        // 监听加载完成事件
        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            percentText.destroy();
            assetText.destroy();
        });

        // 加载地图文件（从 Next.js public 文件夹提供）
        this.load.tilemapTiledJSON('home_page_city', '/assets/topdown/sprites/maps/cities/home_page_city.json');
        this.load.tilemapTiledJSON('home_page_city_house_01', '/assets/topdown/sprites/maps/houses/home_page_city_house_01.json');
        this.load.tilemapTiledJSON('home_page_city_house_02', '/assets/topdown/sprites/maps/houses/home_page_city_house_02.json');
        this.load.tilemapTiledJSON('home_page_city_house_03', '/assets/topdown/sprites/maps/houses/home_page_city_house_03.json');

        // 加载角色图集
        this.load.atlas('hero', '/assets/topdown/sprites/atlas/hero.png', '/assets/topdown/sprites/atlas/hero.json');
        this.load.atlas('slime', '/assets/topdown/sprites/atlas/slime.png', '/assets/topdown/sprites/atlas/slime.json');
        this.load.atlas('heart', '/assets/topdown/sprites/atlas/heart.png', '/assets/topdown/sprites/atlas/heart.json');
        this.load.atlas('coin', '/assets/topdown/sprites/atlas/coin.png', '/assets/topdown/sprites/atlas/coin.json');

        // 加载 NPC 图集
        this.load.atlas('npc_01', '/assets/topdown/sprites/atlas/npc_01.png', '/assets/topdown/sprites/atlas/npc_01.json');
        this.load.atlas('npc_02', '/assets/topdown/sprites/atlas/npc_02.png', '/assets/topdown/sprites/atlas/npc_02.json');
        this.load.atlas('npc_03', '/assets/topdown/sprites/atlas/npc_03.png', '/assets/topdown/sprites/atlas/npc_03.json');
        this.load.atlas('npc_04', '/assets/topdown/sprites/atlas/npc_04.png', '/assets/topdown/sprites/atlas/npc_04.json');

        // 加载瓦片集
        this.load.image('tileset', '/assets/topdown/sprites/maps/tilesets/tileset.png');

        // 加载 UI 图片
        this.load.image('main_menu_background', '/assets/topdown/images/main_menu_background.png');
        this.load.image('game_over_background', '/assets/topdown/images/game_over_background.png');
        this.load.image('game_logo', '/assets/topdown/images/game_logo.png');
        this.load.image('heart_container', '/assets/topdown/images/heart_container.png');
        this.load.image('sword', '/assets/topdown/images/sword.png');
        this.load.image('push', '/assets/topdown/images/push.png');
    }

    /**
     * 创建阶段 - 启动主菜单场景
     */
    create(): void {
        this.scene.start('MainMenuScene');
    }
}