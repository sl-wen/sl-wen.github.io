import * as Phaser from 'phaser';

export class WorldMap {
  private scene: Phaser.Scene;
  private tilemap!: Phaser.Tilemaps.Tilemap;
  private tileset!: Phaser.Tilemaps.Tileset;
  private groundLayer!: Phaser.Tilemaps.TilemapLayer;
  private collisionLayer!: Phaser.Tilemaps.TilemapLayer;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public create(): void {
    // 创建瓦片地图
    this.createTilemap();
    
    // 创建图层
    this.createLayers();
    
    // 设置碰撞
    this.setupCollisions();
  }

  private createTilemap(): void {
    // 创建一个简单的瓦片地图数据
    const mapData = this.generateMapData();
    
    // 创建瓦片地图
    this.tilemap = this.scene.make.tilemap({
      data: mapData,
      tileWidth: 32,
      tileHeight: 32
    });

    // 创建占位符瓦片集
    this.createPlaceholderTileset();
  }

  private createPlaceholderTileset(): void {
    // 创建不同颜色的瓦片作为占位符
    const colors = [0x90EE90, 0x8B4513, 0x696969, 0x4169E1]; // 草地、棕色、灰色、蓝色
    
    colors.forEach((color, index) => {
      const graphics = this.scene.add.graphics();
      graphics.fillStyle(color);
      graphics.fillRect(0, 0, 32, 32);
      graphics.generateTexture(`tile_${index}`, 32, 32);
      graphics.destroy();
    });

    // 添加瓦片集
    this.tileset = this.tilemap.addTilesetImage('tile_0');
  }

  private generateMapData(): number[][] {
    // 生成50x40的地图数据
    const width = 50;
    const height = 40;
    const mapData: number[][] = [];

    for (let y = 0; y < height; y++) {
      const row: number[] = [];
      for (let x = 0; x < width; x++) {
        // 生成简单的地形
        if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
          // 边界墙
          row.push(1);
        } else if (x > 10 && x < 15 && y > 10 && y < 15) {
          // 一个小房子区域
          row.push(2);
        } else if (x > 30 && x < 35 && y > 20 && y < 25) {
          // 另一个建筑区域
          row.push(3);
        } else {
          // 草地
          row.push(0);
        }
      }
      mapData.push(row);
    }

    return mapData;
  }

  private createLayers(): void {
    // 创建地面图层
    this.groundLayer = this.tilemap.createLayer(0, this.tileset, 0, 0);
    
    // 创建碰撞图层（与地面图层相同，但用于碰撞检测）
    this.collisionLayer = this.tilemap.createLayer(0, this.tileset, 0, 0);
    
    // 设置边界瓦片为碰撞体
    this.collisionLayer.setCollisionBetween(1, 1); // 墙
    this.collisionLayer.setCollisionBetween(2, 3); // 建筑
  }

  private setupCollisions(): void {
    // 设置世界边界
    this.scene.physics.world.setBounds(0, 0, this.tilemap.widthInPixels, this.tilemap.heightInPixels);
  }

  public getCollisionLayer(): Phaser.Tilemaps.TilemapLayer {
    return this.collisionLayer;
  }

  public getGroundLayer(): Phaser.Tilemaps.TilemapLayer {
    return this.groundLayer;
  }

  public getTilemap(): Phaser.Tilemaps.Tilemap {
    return this.tilemap;
  }

  public getWorldBounds(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(0, 0, this.tilemap.widthInPixels, this.tilemap.heightInPixels);
  }

  public getTileAtWorldXY(x: number, y: number): Phaser.Tilemaps.Tile | null {
    return this.tilemap.getTileAtWorldXY(x, y);
  }

  public isWalkable(x: number, y: number): boolean {
    const tile = this.getTileAtWorldXY(x, y);
    if (!tile) return false;
    
    // 检查瓦片是否可通行
    return tile.index === 0; // 只有草地可通行
  }
}
