import { ResourceItem } from './ResourceLoader';

/**
 * 瓦片资源配置
 * 定义所有需要加载的瓦片资源
 */
export class TileResourceConfig {
    /**
     * 获取所有瓦片资源配置
     */
    public static getTileResources(): ResourceItem[] {
        const basePath = '/assets/farm-assets/Sprout Lands - Sprites - premium pack/Tilesets/ground tiles/';
        const newTilesPath = basePath + 'New tiles/';
        const oldTilesPath = basePath + 'Old tiles/';
        const buildingPartsPath = '/assets/farm-assets/Sprout Lands - Sprites - premium pack/Tilesets/Building parts/';

        return [
            // 新瓦片资源
            {
                key: 'grass_tiles',
                url: newTilesPath + 'Grass_tiles_v2.png',
                type: 'spritesheet',
                priority: 'high',
                preload: true,
                frameConfig: {
                    frameWidth: 32,
                    frameHeight: 32
                }
            },
            {
                key: 'darker_grass_tiles',
                url: newTilesPath + 'Darker_Grass_Tiles_v2.png',
                type: 'spritesheet',
                priority: 'high',
                preload: true,
                frameConfig: {
                    frameWidth: 32,
                    frameHeight: 32
                }
            },
            {
                key: 'soil_tiles',
                url: newTilesPath + 'Darker_Soil_Ground_Tiles.png',
                type: 'spritesheet',
                priority: 'high',
                preload: true,
                frameConfig: {
                    frameWidth: 32,
                    frameHeight: 32
                }
            },
            {
                key: 'stone_tiles',
                url: newTilesPath + 'Stone_Ground_Tiles.png',
                type: 'spritesheet',
                priority: 'high',
                preload: true,
                frameConfig: {
                    frameWidth: 32,
                    frameHeight: 32
                }
            },
            {
                key: 'bush_tiles',
                url: newTilesPath + 'Bush_Tiles.png',
                type: 'spritesheet',
                priority: 'medium',
                preload: true,
                frameConfig: {
                    frameWidth: 32,
                    frameHeight: 32
                }
            },
            {
                key: 'grass_hill_tiles',
                url: newTilesPath + 'Grass_Hill_Tiles_v2.png',
                type: 'spritesheet',
                priority: 'medium',
                preload: true,
                frameConfig: {
                    frameWidth: 32,
                    frameHeight: 32
                }
            },
            {
                key: 'darker_grass_hill_tiles',
                url: newTilesPath + 'Darker_Grass_Hills_Tiles_v2.png',
                type: 'spritesheet',
                priority: 'medium',
                preload: true,
                frameConfig: {
                    frameWidth: 32,
                    frameHeight: 32
                }
            },
            {
                key: 'grass_tile_layers',
                url: newTilesPath + 'Grass_Tile_Layers.png',
                type: 'spritesheet',
                priority: 'medium',
                preload: true,
                frameConfig: {
                    frameWidth: 32,
                    frameHeight: 32
                }
            },
            {
                key: 'darker_grass_tile_layers',
                url: newTilesPath + 'Darker_Grass_Tile_Layers.png',
                type: 'spritesheet',
                priority: 'medium',
                preload: true,
                frameConfig: {
                    frameWidth: 32,
                    frameHeight: 32
                }
            },
            
            // 旧瓦片资源
            {
                key: 'tilled_dirt_tiles',
                url: oldTilesPath + 'Tilled Dirt.png',
                type: 'spritesheet',
                priority: 'high',
                preload: true,
                frameConfig: {
                    frameWidth: 32,
                    frameHeight: 32
                }
            },
            {
                key: 'old_grass_tiles',
                url: oldTilesPath + 'Grass.png',
                type: 'spritesheet',
                priority: 'medium',
                preload: true,
                frameConfig: {
                    frameWidth: 32,
                    frameHeight: 32
                }
            },
            {
                key: 'hill_tiles',
                url: oldTilesPath + 'Hills.png',
                type: 'spritesheet',
                priority: 'low',
                preload: true,
                frameConfig: {
                    frameWidth: 32,
                    frameHeight: 32
                }
            },

            // 水瓦片（动画）
            {
                key: 'water_tiles',
                url: basePath + 'Water.png',
                type: 'spritesheet',
                priority: 'high',
                preload: true,
                frameConfig: {
                    frameWidth: 32,
                    frameHeight: 32
                }
            },

            // 建筑部件瓦片
            {
                key: 'path_tiles',
                url: buildingPartsPath + 'Paths.png',
                type: 'spritesheet',
                priority: 'high',
                preload: true,
                frameConfig: {
                    frameWidth: 32,
                    frameHeight: 32
                }
            },
            {
                key: 'stone_path_tiles',
                url: buildingPartsPath + 'STONE PATH.png',
                type: 'spritesheet',
                priority: 'medium',
                preload: true,
                frameConfig: {
                    frameWidth: 32,
                    frameHeight: 32
                }
            },
            {
                key: 'fence_tiles',
                url: buildingPartsPath + 'Fences.png',
                type: 'spritesheet',
                priority: 'medium',
                preload: true,
                frameConfig: {
                    frameWidth: 32,
                    frameHeight: 32
                }
            },
            {
                key: 'wood_bridge_tiles',
                url: buildingPartsPath + 'Wood Bridge.png',
                type: 'spritesheet',
                priority: 'low',
                preload: true,
                frameConfig: {
                    frameWidth: 32,
                    frameHeight: 32
                }
            },

            // 预览和参考图片（非游戏内使用）
            {
                key: 'tiles_preview',
                url: newTilesPath + 'TILES PREVIEW v.2.png',
                type: 'image',
                priority: 'low',
                preload: false
            },
            {
                key: 'tile_layer_example',
                url: newTilesPath + 'TILE LAYER EXAMPLE.png',
                type: 'image',
                priority: 'low',
                preload: false
            }
        ];
    }

    /**
     * 获取高优先级瓦片资源（游戏必需）
     */
    public static getHighPriorityTileResources(): ResourceItem[] {
        return this.getTileResources().filter(resource => resource.priority === 'high');
    }

    /**
     * 获取中优先级瓦片资源（增强体验）
     */
    public static getMediumPriorityTileResources(): ResourceItem[] {
        return this.getTileResources().filter(resource => resource.priority === 'medium');
    }

    /**
     * 获取低优先级瓦片资源（装饰性）
     */
    public static getLowPriorityTileResources(): ResourceItem[] {
        return this.getTileResources().filter(resource => resource.priority === 'low');
    }

    /**
     * 获取预加载瓦片资源
     */
    public static getPreloadTileResources(): ResourceItem[] {
        return this.getTileResources().filter(resource => resource.preload === true);
    }
}