import { Scene } from 'phaser';

// JSON files - now served from public/game/assets/

// Images - now served from public/game/assets/

export default class BootScene extends Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        const fontSize = 16;

        // setup loading bar
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        const { width: gameWidth, height: gameHeight } = this.cameras.main;

        const barPositionX = Math.ceil((gameWidth - (gameWidth * 0.7)) / 2);
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(
            barPositionX,
            Math.ceil(gameHeight / 6),
            Math.ceil(gameWidth * 0.7),
            Math.ceil(gameHeight / 10)
        );

        const loadingText = this.add.text(
            gameWidth / 2,
            Math.ceil(gameHeight / 10),
            'loading...',
            {
                fontFamily: '"Press Start 2P"',
                fontSize: `${fontSize}px`,
                size: `${fontSize}px`,
                fill: '#ffffff',
                color: '#ffffff',
            }
        );

        loadingText.setOrigin(0.5);
        loadingText.setResolution(30);

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

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0xFFFFFF, 1);
            progressBar.fillRect(
                barPositionX,
                Math.ceil(gameHeight / 6),
                Math.ceil(gameWidth * 0.7) * value,
                Math.ceil(gameHeight / 10)
            );
            percentText.setText(`${Number.parseInt(value * 100, 10)}%`);
        });

        this.load.on('fileprogress', (file) => {
            assetText.setText(`loading: ${file.key}`);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            percentText.destroy();
            assetText.destroy();
        });

        // Maps
        this.load.tilemapTiledJSON('home_page_city', '/game/assets/sprites/maps/cities/home_page_city.json');
        this.load.tilemapTiledJSON('home_page_city_house_01', '/game/assets/sprites/maps/houses/home_page_city_house_01.json');
        this.load.tilemapTiledJSON('home_page_city_house_02', '/game/assets/sprites/maps/houses/home_page_city_house_02.json');
        this.load.tilemapTiledJSON('home_page_city_house_03', '/game/assets/sprites/maps/houses/home_page_city_house_03.json');

        // Atlas
        this.load.atlas('hero', '/game/assets/sprites/atlas/hero.png', '/game/assets/sprites/atlas/hero.json');
        this.load.atlas('slime', '/game/assets/sprites/atlas/slime.png', '/game/assets/sprites/atlas/slime.json');
        this.load.atlas('heart', '/game/assets/sprites/atlas/heart.png', '/game/assets/sprites/atlas/heart.json');
        this.load.atlas('coin', '/game/assets/sprites/atlas/coin.png', '/game/assets/sprites/atlas/coin.json');

        // NPCs
        this.load.atlas('npc_01', '/game/assets/sprites/atlas/npc_01.png', '/game/assets/sprites/atlas/npc_01.json');
        this.load.atlas('npc_02', '/game/assets/sprites/atlas/npc_02.png', '/game/assets/sprites/atlas/npc_02.json');
        this.load.atlas('npc_03', '/game/assets/sprites/atlas/npc_03.png', '/game/assets/sprites/atlas/npc_03.json');
        this.load.atlas('npc_04', '/game/assets/sprites/atlas/npc_04.png', '/game/assets/sprites/atlas/npc_04.json');

        // Tilesets
        this.load.image('tileset', '/game/assets/sprites/maps/tilesets/tileset.png');

        // Images
        this.load.image('main_menu_background', '/game/assets/images/main_menu_background.png');
        this.load.image('game_over_background', '/game/assets/images/game_over_background.png');
        this.load.image('game_logo', '/game/assets/images/game_logo.png');
        this.load.image('heart_container', '/game/assets/images/heart_container.png');
        this.load.image('sword', '/game/assets/images/sword.png');
        this.load.image('push', '/game/assets/images/push.png');
    }

    create() {
        this.scene.start('MainMenuScene');
    }
}
