import * as Phaser from 'phaser';
import { SpriteAtlasManager } from '../utils/SpriteAtlasManager';

/**
 * 预加载场景类
 * 负责加载游戏所需的所有资源文件，包括图片、音频、动画等
 * 显示加载进度条，确保所有资源加载完成后才进入游戏
 */
export class PreloadScene extends Phaser.Scene {
  /**
   * 构造函数
   */
  constructor() {
    super({ key: 'PreloadScene' }); // 场景标识符
  }

  /**
   * 预加载阶段
   * 加载所有游戏资源并显示加载进度
   */
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
      console.log(`Loading progress: ${Math.floor(value * 100)}%`);
    });

    this.load.on('complete', () => {
      console.log('All assets loaded successfully');
      percentText.setText('100%');

      // Clean up loading UI
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });

    this.load.on('loaderror', (file: any) => {
      console.error('Failed to load asset:', file.src || file.key);
      // Continue loading other assets even if one fails
    });

    this.load.on('fileprogress', (file: any) => {
      console.log(`Loading file: ${file.key} - ${file.src}`);
    });

    // Load sprite assets
    this.loadSpriteAssets();


  }

  /**
   * 加载精灵资源
   * 加载游戏所需的所有图片和动画资源
   */
  private loadSpriteAssets() {
    console.log('Loading sprite assets...');

    // 加载小猫角色精灵和动画
    this.loadCatAssets();

    // 加载作物资源
    this.loadCropAssets();

    // 加载工具资源
    // this.loadToolAssets();

    // 加载UI资源
    this.loadUIAssets();

    // 加载农场建筑和装饰
    this.loadFarmAssets();

    // 加载动物资源
    this.loadAnimalAssets();

    console.log('All sprite assets loaded successfully');
  }

  /**
   * 加载小猫角色资源
   */
  private loadCatAssets() {
    // 基础小猫精灵
    this.load.image('cat_idle', '/assets/farm-assets/cat/cat_idle_down.png');

    // 小猫各方向静止状态
    this.load.image('cat_idle_down', '/assets/farm-assets/cat/cat_idle_down.png');
    this.load.image('cat_idle_up', '/assets/farm-assets/cat/cat_idle_up.png');
    this.load.image('cat_idle_left', '/assets/farm-assets/cat/cat_idle_left.png');
    this.load.image('cat_idle_right', '/assets/farm-assets/cat/cat_idle_right.png');

    // 小猫行走动画
    this.load.image('cat_walk_down_1', '/assets/farm-assets/cat/cat_walk_down_1.png');
    this.load.image('cat_walk_down_2', '/assets/farm-assets/cat/cat_walk_down_2.png');
    this.load.image('cat_walk_up_1', '/assets/farm-assets/cat/cat_walk_up_1.png');
    this.load.image('cat_walk_up_2', '/assets/farm-assets/cat/cat_walk_up_2.png');
    this.load.image('cat_walk_left_1', '/assets/farm-assets/cat/cat_walk_left_1.png');
    this.load.image('cat_walk_left_2', '/assets/farm-assets/cat/cat_walk_left_2.png');
    this.load.image('cat_walk_right_1', '/assets/farm-assets/cat/cat_walk_right_1.png');
    this.load.image('cat_walk_right_2', '/assets/farm-assets/cat/cat_walk_right_2.png');

    // 小猫工作动画
    this.load.image('cat_work_hoe', '/assets/farm-assets/cat/cat_work_hoe.png');
    this.load.image('cat_work_water', '/assets/farm-assets/cat/cat_work_water.png');
    this.load.image('cat_work_harvest', '/assets/farm-assets/cat/cat_work_harvest.png');

    // 小猫表情状态
    this.load.image('cat_happy', '/assets/farm-assets/cat/cat_happy.png');
    this.load.image('cat_tired', '/assets/farm-assets/cat/cat_tired.png');
    this.load.image('cat_eating', '/assets/farm-assets/cat/cat_eating.png');
  }

  /**
   * 加载作物资源
   */
  private loadCropAssets() {
    // 使用现有的植物资源，为缺失的作物创建占位符

    // 胡萝卜生长阶段 - 使用通用植物图片作为占位符
    this.load.image('carrot_seed', '/assets/farm-assets/plants/plants-47.png');
    this.load.image('carrot_sprout', '/assets/farm-assets/plants/plants-48.png');
    this.load.image('carrot_mature', '/assets/farm-assets/plants/plants-49.png');
    this.load.image('carrot_ready', '/assets/farm-assets/plants/plants-50.png');

    // 番茄生长阶段 - 使用现有的番茄资源
    this.load.image('tomato_seed', '/assets/farm-assets/plants/tomato_seed.png');
    this.load.image('tomato_sprout', '/assets/farm-assets/plants/tomato_sprout.png');
    this.load.image('tomato_mature', '/assets/farm-assets/plants/tomato_mature.png');
    this.load.image('tomato_ready', '/assets/farm-assets/plants/tomato_ready.png');

    // 小麦生长阶段 - 使用现有的小麦资源
    this.load.image('wheat_seed', '/assets/farm-assets/plants/wheat_seed.png');
    this.load.image('wheat_sprout', '/assets/farm-assets/plants/wheat_sprout.png');
    this.load.image('wheat_mature', '/assets/farm-assets/plants/wheat_mature.png');
    this.load.image('wheat_ready', '/assets/farm-assets/plants/wheat_ready.png');

    // 玉米生长阶段 - 使用通用植物图片作为占位符
    this.load.image('corn_seed', '/assets/farm-assets/plants/plants-51.png');
    this.load.image('corn_sprout', '/assets/farm-assets/plants/plants-52.png');
    this.load.image('corn_mature', '/assets/farm-assets/plants/plants-53.png');
    this.load.image('corn_ready', '/assets/farm-assets/plants/plants-54.png');

    // 草莓生长阶段 - 使用现有的草莓资源
    this.load.image('strawberry_seed', '/assets/farm-assets/plants/strawberry_seed.png');
    this.load.image('strawberry_sprout', '/assets/farm-assets/plants/strawberry_sprout.png');
    this.load.image('strawberry_mature', '/assets/farm-assets/plants/strawberry_mature.png');
    this.load.image('strawberry_ready', '/assets/farm-assets/plants/strawberry_ready.png');

    // 生菜生长阶段 - 使用通用植物图片作为占位符
    this.load.image('lettuce_seed', '/assets/farm-assets/plants/plants-55.png');
    this.load.image('lettuce_sprout', '/assets/farm-assets/plants/plants-56.png');
    this.load.image('lettuce_mature', '/assets/farm-assets/plants/plants-57.png');
    this.load.image('lettuce_ready', '/assets/farm-assets/plants/plants-58.png');

    // 土豆生长阶段 - 使用现有的土豆资源
    this.load.image('potato_seed', '/assets/farm-assets/plants/potato_seed.png');
    this.load.image('potato_sprout', '/assets/farm-assets/plants/potato_sprout.png');
    this.load.image('potato_mature', '/assets/farm-assets/plants/potato_mature.png');
    this.load.image('potato_ready', '/assets/farm-assets/plants/potato_ready.png');

    // 南瓜生长阶段 - 使用现有的南瓜资源
    this.load.image('pumpkin_seed', '/assets/farm-assets/plants/pumpkin_seed.png');
    this.load.image('pumpkin_sprout', '/assets/farm-assets/plants/pumpkin_sprout.png');
    this.load.image('pumpkin_mature', '/assets/farm-assets/plants/pumpkin_mature.png');
    this.load.image('pumpkin_ready', '/assets/farm-assets/plants/pumpkin_ready.png');

    // 枯萎植物 - 使用通用植物图片作为占位符
    this.load.image('plant_withered_1', '/assets/farm-assets/plants/plants-59.png');
    this.load.image('plant_withered_2', '/assets/farm-assets/plants/plants-60.png');
    this.load.image('plant_withered_3', '/assets/farm-assets/plants/plants-61.png');
    this.load.image('plant_withered_4', '/assets/farm-assets/plants/plants-62.png');
  }

  /**
   * 加载工具资源
   */
  private loadToolAssets() {
    this.load.image('hoe', '/assets/farm-assets/tools/hoe.png');
    this.load.image('watering_can', '/assets/farm-assets/tools/watering_can.png');
    this.load.image('fertilizer_bag', '/assets/farm-assets/tools/fertilizer_bag.png');
    this.load.image('seed_packet', '/assets/farm-assets/tools/seed_packet.png');
    this.load.image('shovel', '/assets/farm-assets/tools/shovel.png');
    this.load.image('rake', '/assets/farm-assets/tools/rake.png');
    this.load.image('scissors', '/assets/farm-assets/tools/scissors.png');
    this.load.image('basket', '/assets/farm-assets/tools/basket.png');
    this.load.image('bucket', '/assets/farm-assets/tools/bucket.png');
    this.load.image('hammer', '/assets/farm-assets/tools/hammer.png');
    this.load.image('axe', '/assets/farm-assets/tools/axe.png');
    this.load.image('pickaxe', '/assets/farm-assets/tools/pickaxe.png');
    this.load.image('fishing_rod', '/assets/farm-assets/tools/fishing_rod.png');
    this.load.image('net', '/assets/farm-assets/tools/net.png');
    this.load.image('rope', '/assets/farm-assets/tools/rope.png');
    this.load.image('knife', '/assets/farm-assets/tools/knife.png');
  }

  /**
   * 加载UI资源
   */
  private loadUIAssets() {
    // 按钮 - 使用现有的UI资源
    this.load.image('button_stone_normal', '/assets/farm-assets/UI/UI-890.png');
    this.load.image('button_stone_hover', '/assets/farm-assets/UI/UI-891.png');
    this.load.image('button_stone_pressed', '/assets/farm-assets/UI/UI-892.png');

    // 面板 - 使用现有的UI资源
    this.load.image('panel_wood_small', '/assets/farm-assets/UI/UI-950.png');
    this.load.image('panel_wood_medium', '/assets/farm-assets/UI/UI-951.png');
    this.load.image('panel_wood_large', '/assets/farm-assets/UI/UI-952.png');

    // Maple leaf textures
    this.load.image('leaf0', '/assets/farm-assets/UI/Leaf/Leaf-0.png');
    this.load.image('leaf1', '/assets/farm-assets/UI/Leaf/Leaf-1.png');
    this.load.image('leaf2', '/assets/farm-assets/UI/Leaf/Leaf-2.png');
    this.load.image('leaf3', '/assets/farm-assets/UI/Leaf/Leaf-3.png');
    this.load.image('leaf4', '/assets/farm-assets/UI/Leaf/Leaf-4.png');
    this.load.image('leaf5', '/assets/farm-assets/UI/Leaf/Leaf-5.png');
  }

  /**
   * 加载农场建筑资源
   */
  private loadFarmAssets() {
    // 农田地块
    this.load.image('farm_plot_empty', '/assets/farm-assets/farmplants/framplant-0.png');
    this.load.image('farm_plot_plowed', '/assets/farm-assets/farmplants/framplant-1.png');
    this.load.image('farm_plot_planted', '/assets/farm-assets/farmplants/framplant-2.png');

    // 围栏 - 使用现有的围栏资源
    this.load.image('fence', '/assets/farm-assets/fence/Fences-0.png');
    this.load.image('fence_alt', '/assets/farm-assets/fence/Fences-1.png');

    // 额外的农场装饰
    this.load.image('farm_decoration_1', '/assets/farm-assets/farmplants/framplant-3.png');
    this.load.image('farm_decoration_2', '/assets/farm-assets/farmplants/framplant-4.png');
    this.load.image('farm_decoration_3', '/assets/farm-assets/farmplants/framplant-5.png');

    // 地板草地图集（自定义导入）
    this.load.image('farm_grass_tiles_v2', '/assets/farm-assets/Grass_tiles_v2.png');
  }

  /**
   * 加载动物资源
   */
  private loadAnimalAssets() {
    // 鸡的动画 - 使用现有的鸡资源
    this.load.image('chicken_idle_1', '/assets/farm-assets/chicken/chicken_idle_1.png');
    this.load.image('chicken_idle_2', '/assets/farm-assets/chicken/chicken_idle_2.png');
    this.load.image('chicken_walk_1', '/assets/farm-assets/chicken/chicken_walk_1.png');
    this.load.image('chicken_walk_2', '/assets/farm-assets/chicken/chicken_walk_2.png');
    this.load.image('chicken_peck_1', '/assets/farm-assets/chicken/chicken_peck_1.png');
    this.load.image('chicken_peck_2', '/assets/farm-assets/chicken/chicken_peck_2.png');
    this.load.image('chicken_flap_1', '/assets/farm-assets/chicken/chicken_flap_1.png');
    this.load.image('chicken_flap_2', '/assets/farm-assets/chicken/chicken_flap_2.png');
  }

  /**
   * 场景创建方法 - 资源加载完成后的处理
   * 启动主游戏场景和UI场景
   */
  create() {
    console.log('PreloadScene create() called - All assets loaded successfully');

    // 创建小猫的行走动画
    this.createCatAnimations();

    // 启动主游戏场景
    console.log('Starting GameScene...');
    this.scene.start('GameScene');

    // 启动UI场景
    console.log('Launching UIScene...');
    this.scene.launch('UIScene');

    console.log('Scene transitions completed');

    // 将 Grass_tiles_v2.png 按提供的坐标提取为可用纹理
    const grassAtlas = new SpriteAtlasManager(this, 'farm_grass_tiles_v2', 16, 16);
    grassAtlas.extractSprites([
      { key: 'grass_v2_1', x: 0, y: 80, width: 16, height: 16 },
      { key: 'grass_v2_2', x: 24, y: 80, width: 16, height: 16 },
      { key: 'grass_v2_3', x: 48, y: 80, width: 16, height: 16 },
      { key: 'grass_v2_4', x: 64, y: 80, width: 16, height: 16 },
      { key: 'grass_v2_5', x: 0, y: 96, width: 16, height: 16 },
      { key: 'grass_v2_6', x: 48, y: 96, width: 16, height: 16 },
      { key: 'grass_v2_7', x: 80, y: 96, width: 16, height: 16 },
      { key: 'grass_v2_8', x: 80, y: 80, width: 16, height: 16 },
      { key: 'grass_v2_9', x: 64, y: 96, width: 16, height: 16 },
      { key: 'grass_v2_10', x: 32, y: 96, width: 16, height: 16 },
      { key: 'grass_v2_11', x: 16, y: 96, width: 16, height: 16 }
    ]);
  }

  /**
   * 创建小猫的动画
   */
  private createCatAnimations() {
    // 向下行走动画
    this.anims.create({
      key: 'cat_walk_down',
      frames: [
        { key: 'cat_walk_down_1' },
        { key: 'cat_walk_down_2' }
      ],
      frameRate: 8,
      repeat: -1
    });

    // 向上行走动画
    this.anims.create({
      key: 'cat_walk_up',
      frames: [
        { key: 'cat_walk_up_1' },
        { key: 'cat_walk_up_2' }
      ],
      frameRate: 8,
      repeat: -1
    });

    // 向左行走动画
    this.anims.create({
      key: 'cat_walk_left',
      frames: [
        { key: 'cat_walk_left_1' },
        { key: 'cat_walk_left_2' }
      ],
      frameRate: 8,
      repeat: -1
    });

    // 向右行走动画
    this.anims.create({
      key: 'cat_walk_right',
      frames: [
        { key: 'cat_walk_right_1' },
        { key: 'cat_walk_right_2' }
      ],
      frameRate: 8,
      repeat: -1
    });

    // 小猫静止动画（各方向）
    this.anims.create({
      key: 'cat_idle_down',
      frames: [{ key: 'cat_idle_down' }],
      frameRate: 1
    });

    this.anims.create({
      key: 'cat_idle_up',
      frames: [{ key: 'cat_idle_up' }],
      frameRate: 1
    });

    this.anims.create({
      key: 'cat_idle_left',
      frames: [{ key: 'cat_idle_left' }],
      frameRate: 1
    });

    this.anims.create({
      key: 'cat_idle_right',
      frames: [{ key: 'cat_idle_right' }],
      frameRate: 1
    });

    console.log('Cat animations created successfully');
  }

}