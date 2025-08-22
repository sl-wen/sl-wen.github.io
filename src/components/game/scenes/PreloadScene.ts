import * as Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    // Create loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: '正在加载小猫农场...',
      style: {
        font: '20px monospace',
        color: '#ffffff'
      }
    });
    loadingText.setOrigin(0.5, 0.5);

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
    });

    // Load sprite assets
    this.loadSpriteAssets();

    // Create farm tilemap data
    this.createFarmTilemapData();
  }

  private loadSpriteAssets() {
    // Load cat character sprites
    this.load.image('cat', '/assets/characters/cat.png');
    
    // Load animated cat sprite sheets
    this.load.spritesheet('cat_walk', '/assets/animations/cat_walk.png', {
      frameWidth: 32,
      frameHeight: 32
    });
    
    this.load.spritesheet('cat_actions', '/assets/animations/cat_actions.png', {
      frameWidth: 32,
      frameHeight: 32
    });

    // Load farm tile sprites
    this.load.image('farm_grass', '/assets/tiles/farm_grass.png');
    this.load.image('farm_dirt', '/assets/tiles/farm_dirt.png');
    this.load.image('farm_stone_path', '/assets/tiles/farm_stone_path.png');
    this.load.image('farm_fence', '/assets/tiles/farm_fence.png');
    this.load.image('farm_water', '/assets/tiles/farm_water.png');

    // Load farm plot sprites
    this.load.image('farm_plot_empty', '/assets/tiles/farm_plot_empty.png');
    this.load.image('farm_plot_plowed', '/assets/tiles/farm_plot_plowed.png');
    this.load.image('farm_plot_planted', '/assets/tiles/farm_plot_planted.png');

    // Load crop sprites for all growth stages
    const crops = ['carrot', 'tomato', 'wheat', 'corn', 'strawberry', 'lettuce', 'potato', 'pumpkin'];
    const stages = ['seed', 'sprout', 'growing', 'mature', 'withered'];
    
    crops.forEach(crop => {
      stages.forEach(stage => {
        this.load.image(`${crop}_${stage}`, `/assets/crops/${crop}_${stage}.png`);
      });
      // Also load harvested version
      this.load.image(`${crop}_harvested`, `/assets/crops/${crop}_harvested.png`);
      // And seeds
      this.load.image(`${crop}_seeds`, `/assets/items/${crop}_seeds.png`);
    });

    // Load farming tool sprites
    this.load.image('watering_can', '/assets/tools/watering_can.png');
    this.load.image('hoe', '/assets/tools/hoe.png');
    this.load.image('fertilizer_bag', '/assets/tools/fertilizer_bag.png');
    this.load.image('seeds_pouch', '/assets/tools/seeds_pouch.png');

    // Load cooking station sprites
    this.load.image('cooking_station', '/assets/buildings/cooking_station.png');
    this.load.image('cooking_station_active', '/assets/buildings/cooking_station_active.png');

    // Load food sprites
    const foods = [
      'carrot_soup', 'tomato_salad', 'wheat_bread', 'corn_soup', 
      'strawberry_cake', 'potato_stew', 'pumpkin_pie', 'mixed_salad'
    ];
    foods.forEach(food => {
      this.load.image(food, `/assets/food/${food}.png`);
    });

    // Load UI sprites
    this.load.image('ui_panel', '/assets/ui/panel.png');
    this.load.image('ui_button', '/assets/ui/button.png');
    this.load.image('ui_slot', '/assets/ui/inventory_slot.png');
    this.load.image('ui_heart', '/assets/ui/heart.png');
    this.load.image('ui_energy', '/assets/ui/energy.png');
    this.load.image('ui_happiness', '/assets/ui/happiness.png');

    // Load particle sprites
    this.load.image('sparkle', '/assets/particles/sparkle.png');
    this.load.image('water_drop', '/assets/particles/water_drop.png');
    this.load.image('dirt_particle', '/assets/particles/dirt_particle.png');
    this.load.image('steam', '/assets/particles/steam.png');

    // Load ingredient sprites
    this.load.image('water_bottle', '/assets/items/water_bottle.png');

    // Load farm decoration sprites
    this.load.image('farm_tree', '/assets/decorations/farm_tree.png');
    this.load.image('farm_flower', '/assets/decorations/farm_flower.png');
    this.load.image('farm_rock', '/assets/decorations/farm_rock.png');
    this.load.image('farm_well', '/assets/buildings/farm_well.png');
    this.load.image('farm_barn', '/assets/buildings/farm_barn.png');
    this.load.image('farm_house', '/assets/buildings/farm_house.png');

    // Load animated decorations
    this.load.spritesheet('farm_windmill', '/assets/animations/farm_windmill.png', {
      frameWidth: 64,
      frameHeight: 64
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