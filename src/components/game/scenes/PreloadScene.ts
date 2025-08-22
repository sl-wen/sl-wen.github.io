import * as Phaser from 'phaser';

// 预加载场景类 - 负责加载游戏所需的所有资源文件
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' }); // 场景标识符
  }

  // 预加载阶段 - 加载所有游戏资源并显示加载进度
  preload() {
    // 创建加载进度条界面
    const width = this.cameras.main.width; // 获取摄像机宽度
    const height = this.cameras.main.height; // 获取摄像机高度

    // 创建进度条图形对象
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8); // 深灰色背景，80%透明度
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50); // 居中的矩形框

    // 创建加载文本提示
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: '正在加载小猫农场...',
      style: {
        font: '20px monospace', // 等宽字体
        color: '#ffffff' // 白色文字
      }
    });
    loadingText.setOrigin(0.5, 0.5); // 设置文本居中对齐

    const percentText = this.make.text({
      x: width / 2,
      y: height / 2 - 5,
      text: '0%',
      style: {
        font: '18px monospace',
        color: '#ffffff'
      }
    });
    percentText.setOrigin(0.5, 0.5);

    // Load progress events
    this.load.on('progress', (value: number) => {
      percentText.setText(Math.floor(value * 100) + '%');
      progressBar.clear();
      progressBar.fillStyle(0x4ecdc4, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
      console.log('Assets loaded successfully!');
    });

    this.load.on('loaderror', (file: any) => {
      console.warn('Failed to load asset:', file.src);
    });

    // Load sprite assets
    this.loadSpriteAssets();

    // Create farm tilemap data
    this.createFarmTilemapData();
  }

  private loadSpriteAssets() {
    // Load cat character sprites (using player as fallback)
    this.load.image('cat', '/assets/characters/player.png');
    
    // Load animated cat sprite sheets (using player animations as fallback)
    this.load.spritesheet('cat_walk', '/assets/animations/player_walk.png', {
      frameWidth: 16,
      frameHeight: 16
    });
    
    this.load.spritesheet('cat_actions', '/assets/animations/player_walk.png', {
      frameWidth: 16,
      frameHeight: 16
    });

    // Load farm tile sprites (using existing tiles as fallback)
    this.load.image('farm_grass', '/assets/tiles/grass.png');
    this.load.image('farm_dirt', '/assets/tiles/stone.png');
    this.load.image('farm_stone_path', '/assets/tiles/stone.png');
    this.load.image('farm_fence', '/assets/tiles/stone.png');
    this.load.image('farm_water', '/assets/tiles/water.png');

    // Load farm plot sprites (using existing tiles as fallback)
    this.load.image('farm_plot_empty', '/assets/tiles/grass.png');
    this.load.image('farm_plot_plowed', '/assets/tiles/stone.png');
    this.load.image('farm_plot_planted', '/assets/tiles/grass.png');

    // Load crop sprites for all growth stages (using existing assets as fallback)
    const crops = ['carrot', 'tomato', 'wheat', 'corn', 'strawberry', 'lettuce', 'potato', 'pumpkin'];
    const stages = ['seed', 'sprout', 'growing', 'mature', 'withered'];
    
    crops.forEach(crop => {
      stages.forEach(stage => {
        this.load.image(`${crop}_${stage}`, `/assets/items/potion.png`);
      });
      // Also load harvested version
      this.load.image(`${crop}_harvested`, `/assets/items/potion.png`);
      // And seeds
      this.load.image(`${crop}_seeds`, `/assets/items/potion.png`);
    });

    // Load farming tool sprites (using existing items as fallback)
    this.load.image('watering_can', '/assets/items/potion.png');
    this.load.image('hoe', '/assets/items/sword.png');
    this.load.image('fertilizer_bag', '/assets/items/potion.png');
    this.load.image('seeds_pouch', '/assets/items/potion.png');

    // Load cooking station sprites (using existing items as fallback)
    this.load.image('cooking_station', '/assets/items/chest.png');
    this.load.image('cooking_station_active', '/assets/items/chest.png');

    // Load food sprites (using existing items as fallback)
    const foods = [
      'carrot_soup', 'tomato_salad', 'wheat_bread', 'corn_soup', 
      'strawberry_cake', 'potato_stew', 'pumpkin_pie', 'mixed_salad'
    ];
    foods.forEach(food => {
      this.load.image(food, `/assets/items/potion.png`);
    });

    // Load UI sprites (using existing UI assets)
    this.load.image('ui_panel', '/assets/ui/panel.png');
    this.load.image('ui_button', '/assets/ui/button.png');
    this.load.image('ui_slot', '/assets/ui/button.png');
    this.load.image('ui_heart', '/assets/ui/button.png');
    this.load.image('ui_energy', '/assets/ui/button.png');
    this.load.image('ui_happiness', '/assets/ui/button.png');

    // Load particle sprites (using existing assets as fallback)
    this.load.image('sparkle', '/assets/items/potion.png');
    this.load.image('water_drop', '/assets/items/potion.png');
    this.load.image('dirt_particle', '/assets/items/potion.png');
    this.load.image('steam', '/assets/items/potion.png');

    // Load ingredient sprites (using existing items as fallback)
    this.load.image('water_bottle', '/assets/items/potion.png');

    // Load farm decoration sprites (using existing assets as fallback)
    this.load.image('farm_tree', '/assets/tiles/tree.png');
    this.load.image('farm_flower', '/assets/tiles/grass.png');
    this.load.image('farm_rock', '/assets/tiles/stone.png');
    this.load.image('farm_well', '/assets/items/chest.png');
    this.load.image('farm_barn', '/assets/items/chest.png');
    this.load.image('farm_house', '/assets/items/chest.png');

    // Load animated decorations (using existing animations as fallback)
    this.load.spritesheet('farm_windmill', '/assets/animations/water_flow.png', {
      frameWidth: 16,
      frameHeight: 16
    });
  }

  private createFarmTilemapData() {
    // Create a cozy farm environment tilemap
    // 0 = grass, 1 = dirt, 2 = stone path, 3 = water, 4 = fence, 5 = farm plot area
    const mapData = [
      [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 2, 0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 2, 0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 2, 0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 0, 2, 0, 0, 3, 3, 3, 3, 0, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 2, 0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 0, 2, 0, 0, 3, 3, 3, 3, 0, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 2, 0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 0, 2, 0, 0, 3, 3, 3, 3, 0, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 3, 3, 3, 3, 0, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 4],
      [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]
    ];

    // Store map data in registry for use in GameScene
    this.registry.set('mapData', mapData);
  }

  create() {
    // Start the main game scene
    this.scene.start('GameScene');
    this.scene.start('UIScene');
  }
}