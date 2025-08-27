'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as Phaser from 'phaser';
import { TileMapManager, TileType } from './entities/TileMapManager';

/**
 * 瓦片编辑器配置
 */
export interface TileEditorConfig {
  mapWidth: number;      // 地图宽度（瓦片数量）
  mapHeight: number;     // 地图高度（瓦片数量）
  tileSize: number;      // 瓦片大小（像素）
  canvasWidth: number;   // 画布宽度
  canvasHeight: number;  // 画布高度
}

/**
 * 瓦片数据结构
 */
export interface TileData {
  id: number;
  type: TileType;
  textureKey: string;
  name: string;
  description: string;
  walkable: boolean;
  farmable: boolean;
  waterSource: boolean;
}

/**
 * 地图数据结构
 */
export interface MapData {
  width: number;
  height: number;
  tiles: number[][];  // 二维数组存储瓦片ID
  metadata: {
    name: string;
    description: string;
    createdAt: string;
    modifiedAt: string;
  };
}

/**
 * 预定义瓦片类型
 */
export const TILE_DEFINITIONS: TileData[] = [
  {
    id: 0,
    type: TileType.GRASS,
    textureKey: 'grass_v2_1',
    name: '草地',
    description: '基础草地地形，可行走',
    walkable: true,
    farmable: true,
    waterSource: false
  },
  {
    id: 1,
    type: TileType.WATER,
    textureKey: 'water_tiles',
    name: '水',
    description: '水域，不可行走，提供水源',
    walkable: false,
    farmable: false,
    waterSource: true
  },
  {
    id: 2,
    type: TileType.PATH,
    textureKey: 'path_tiles',
    name: '道路',
    description: '石头路径，可快速行走',
    walkable: true,
    farmable: false,
    waterSource: false
  },
  {
    id: 3,
    type: TileType.STONE,
    textureKey: 'stone_tiles',
    name: '栅栏',
    description: '石头栅栏，阻挡通行',
    walkable: false,
    farmable: false,
    waterSource: false
  },
  {
    id: 4,
    type: TileType.SOIL,
    textureKey: 'soil_tiles',
    name: '土壤',
    description: '肥沃土壤，适合种植',
    walkable: true,
    farmable: true,
    waterSource: false
  },
  {
    id: 5,
    type: TileType.SAND,
    textureKey: 'sand_tiles',
    name: '沙地',
    description: '沙质地面，可行走',
    walkable: true,
    farmable: false,
    waterSource: false
  }
];

/**
 * 瓦片编辑器组件
 */
interface TileEditorProps {
  config: TileEditorConfig;
  onMapChange?: (mapData: MapData) => void;
  initialMapData?: MapData;
}

export const TileEditor: React.FC<TileEditorProps> = ({
  config,
  onMapChange,
  initialMapData
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<Phaser.Scene | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const tileMapManagerRef = useRef<TileMapManager | null>(null);
  
  const [selectedTileId, setSelectedTileId] = useState(0);
  const [mapData, setMapData] = useState<MapData>(() => {
    if (initialMapData) return initialMapData;
    
    // 创建默认地图（全草地）
    const defaultTiles = Array(config.mapHeight).fill(null).map(() => 
      Array(config.mapWidth).fill(0)
    );
    
    return {
      width: config.mapWidth,
      height: config.mapHeight,
      tiles: defaultTiles,
      metadata: {
        name: '新地图',
        description: '使用瓦片编辑器创建的地图',
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString()
      }
    };
  });
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'draw' | 'erase' | 'fill'>('draw');

  /**
   * 初始化Phaser游戏实例
   */
  useEffect(() => {
    // 确保在浏览器环境中运行
    if (typeof window === 'undefined' || !canvasRef.current) return;

    try {
      // Phaser场景配置
      class TileEditorScene extends Phaser.Scene {
        constructor() {
          super({ key: 'TileEditorScene' });
        }

        preload() {
          // 这里应该预加载所有瓦片纹理
          // 实际项目中需要根据资源路径调整
          console.log('Preloading tile textures...');
        }

        create() {
          try {
            // 创建瓦片地图管理器
            tileMapManagerRef.current = new TileMapManager(this);
            
            // 设置相机
            this.cameras.main.setBounds(0, 0, config.mapWidth * config.tileSize, config.mapHeight * config.tileSize);
            this.cameras.main.setZoom(2); // 放大显示
            
            // 渲染初始地图
            renderMap();
            
            // 设置鼠标事件
            this.input.on('pointerdown', handlePointerDown);
            this.input.on('pointerup', handlePointerUp);
            this.input.on('pointermove', handlePointerMove);
          } catch (error) {
            console.error('Error creating Phaser scene:', error);
          }
        }
      }

      // Phaser游戏配置
      const gameConfig: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: config.canvasWidth,
        height: config.canvasHeight,
        canvas: canvasRef.current,
        scene: TileEditorScene,
        physics: {
          default: 'arcade'
        },
        backgroundColor: '#87CEEB'
      };

      gameRef.current = new Phaser.Game(gameConfig);
      sceneRef.current = gameRef.current.scene.scenes[0];
    } catch (error) {
      console.error('Error initializing Phaser game:', error);
    }

    return () => {
      try {
        if (gameRef.current) {
          gameRef.current.destroy(true);
          gameRef.current = null;
          sceneRef.current = null;
          tileMapManagerRef.current = null;
        }
      } catch (error) {
        console.error('Error destroying Phaser game:', error);
      }
    };
  }, [config]);

  /**
   * 设置触摸事件监听器
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 添加触摸事件监听器
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    // 防止右键菜单和长按选择
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('selectstart', (e) => e.preventDefault());

    return () => {
      if (canvas) {
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
        canvas.removeEventListener('contextmenu', (e) => e.preventDefault());
        canvas.removeEventListener('selectstart', (e) => e.preventDefault());
      }
    };
  }, [isDrawing]);

  /**
   * 渲染地图
   */
  const renderMap = () => {
    try {
      if (!sceneRef.current || !tileMapManagerRef.current) return;

      // 清除现有显示对象
      sceneRef.current.children.removeAll();

      // 渲染每个瓦片
      for (let y = 0; y < mapData.height; y++) {
        for (let x = 0; x < mapData.width; x++) {
          const tileId = mapData.tiles[y][x];
          const tileData = TILE_DEFINITIONS.find(t => t.id === tileId);
          
          if (tileData) {
            const sprite = sceneRef.current.add.rectangle(
              x * config.tileSize + config.tileSize / 2,
              y * config.tileSize + config.tileSize / 2,
              config.tileSize,
              config.tileSize,
              getTileColor(tileData.type)
            );
            sprite.setStrokeStyle(1, 0x000000, 0.3);
          }
        }
      }
    } catch (error) {
      console.error('Error rendering map:', error);
    }
  };

  /**
   * 获取瓦片颜色（用于预览）
   */
  const getTileColor = (tileType: TileType): number => {
    switch (tileType) {
      case TileType.GRASS: return 0x90EE90;
      case TileType.WATER: return 0x4169E1;
      case TileType.PATH: return 0xD2B48C;
      case TileType.STONE: return 0x696969;
      case TileType.SOIL: return 0x8B4513;
      case TileType.SAND: return 0xF4A460;
      default: return 0xFFFFFF;
    }
  };

  /**
   * 处理鼠标按下事件
   */
  const handlePointerDown = (pointer: Phaser.Input.Pointer) => {
    setIsDrawing(true);
    handleTileEdit(pointer.worldX, pointer.worldY);
  };

  /**
   * 处理鼠标抬起事件
   */
  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  /**
   * 处理鼠标移动事件
   */
  const handlePointerMove = (pointer: Phaser.Input.Pointer) => {
    if (isDrawing) {
      // 防止触摸时的页面滚动
      if (pointer.event && 'preventDefault' in pointer.event) {
        pointer.event.preventDefault();
      }
      handleTileEdit(pointer.worldX, pointer.worldY);
    }
  };

  /**
   * 处理触摸开始事件
   */
  const handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (touch.clientX - rect.left) * scaleX;
        const y = (touch.clientY - rect.top) * scaleY;
        setIsDrawing(true);
        handleTileEdit(x, y);
      }
    }
  };

  /**
   * 处理触摸移动事件
   */
  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && isDrawing) {
      const touch = e.touches[0];
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (touch.clientX - rect.left) * scaleX;
        const y = (touch.clientY - rect.top) * scaleY;
        handleTileEdit(x, y);
      }
    }
  };

  /**
   * 处理触摸结束事件
   */
  const handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault();
    setIsDrawing(false);
  };

  /**
   * 处理瓦片编辑
   */
  const handleTileEdit = (worldX: number, worldY: number) => {
    const tileX = Math.floor(worldX / config.tileSize);
    const tileY = Math.floor(worldY / config.tileSize);

    if (tileX < 0 || tileX >= config.mapWidth || tileY < 0 || tileY >= config.mapHeight) {
      return;
    }

    const newMapData = { ...mapData };
    
    switch (tool) {
      case 'draw':
        newMapData.tiles[tileY][tileX] = selectedTileId;
        break;
      case 'erase':
        newMapData.tiles[tileY][tileX] = 0; // 默认为草地
        break;
      case 'fill':
        floodFill(newMapData.tiles, tileX, tileY, newMapData.tiles[tileY][tileX], selectedTileId);
        break;
    }

    newMapData.metadata.modifiedAt = new Date().toISOString();
    setMapData(newMapData);
    onMapChange?.(newMapData);
  };

  /**
   * 洪水填充算法
   */
  const floodFill = (tiles: number[][], x: number, y: number, targetId: number, replacementId: number) => {
    if (targetId === replacementId) return;
    if (x < 0 || x >= mapData.width || y < 0 || y >= mapData.height) return;
    if (tiles[y][x] !== targetId) return;

    tiles[y][x] = replacementId;

    // 递归填充四个方向
    floodFill(tiles, x + 1, y, targetId, replacementId);
    floodFill(tiles, x - 1, y, targetId, replacementId);
    floodFill(tiles, x, y + 1, targetId, replacementId);
    floodFill(tiles, x, y - 1, targetId, replacementId);
  };

  /**
   * 重新渲染地图
   */
  useEffect(() => {
    renderMap();
  }, [mapData]);

  /**
   * 保存地图
   */
  const saveMap = () => {
    const dataStr = JSON.stringify(mapData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `map_${mapData.metadata.name}_${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  /**
   * 加载地图
   */
  const loadMap = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const loadedData = JSON.parse(e.target?.result as string) as MapData;
        setMapData(loadedData);
      } catch (error) {
        alert('地图文件格式错误');
      }
    };
    reader.readAsText(file);
  };

  /**
   * 清空地图
   */
  const clearMap = () => {
    const clearedTiles = Array(config.mapHeight).fill(null).map(() => 
      Array(config.mapWidth).fill(0)
    );
    
    const newMapData = {
      ...mapData,
      tiles: clearedTiles,
      metadata: {
        ...mapData.metadata,
        modifiedAt: new Date().toISOString()
      }
    };
    
    setMapData(newMapData);
    onMapChange?.(newMapData);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-100">
      {/* 移动端工具栏 - 仅在小屏幕显示 */}
      <div className="lg:hidden bg-white shadow-sm border-b mobile-toolbar">
        {/* 工具选择 - 水平布局 */}
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex space-x-2">
            {[
              { key: 'draw', label: '绘制', icon: '🖌️' },
              { key: 'erase', label: '擦除', icon: '🧽' },
              { key: 'fill', label: '填充', icon: '🪣' }
            ].map((toolOption) => (
              <button
                key={toolOption.key}
                className={`px-4 py-2 text-sm rounded-full font-medium ${
                  tool === toolOption.key 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setTool(toolOption.key as typeof tool)}
              >
                <span className="mr-1">{toolOption.icon}</span>
                <span className="hidden sm:inline">{toolOption.label}</span>
              </button>
            ))}
          </div>
          
          {/* 移动端操作按钮 */}
          <div className="flex space-x-2">
            <button
              className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 shadow-md"
              onClick={saveMap}
              title="保存地图"
            >
              💾
            </button>
            
            <label className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 cursor-pointer shadow-md" title="加载地图">
              📁
              <input
                type="file"
                accept=".json"
                onChange={loadMap}
                className="hidden"
              />
            </label>
            
            <button
              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md"
              onClick={clearMap}
              title="清空地图"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* 瓦片类型选择 - 水平滚动 */}
        <div className="p-3">
          <div className="flex space-x-2 overflow-x-auto pb-2 mobile-tile-selector">
            {TILE_DEFINITIONS.map((tile) => (
              <button
                key={tile.id}
                className={`flex-shrink-0 w-20 h-16 rounded-lg border-2 text-center flex flex-col items-center justify-center ${
                  selectedTileId === tile.id ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-300 bg-white'
                }`}
                onClick={() => setSelectedTileId(tile.id)}
                style={{ backgroundColor: selectedTileId === tile.id ? `#${getTileColor(tile.type).toString(16).padStart(6, '0')}20` : `#${getTileColor(tile.type).toString(16).padStart(6, '0')}10` }}
              >
                <div className="text-xs font-bold mb-1">{tile.name}</div>
                <div className="text-xs text-gray-600 leading-tight">{tile.description.split('，')[0]}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 桌面端侧边栏 - 仅在大屏幕显示 */}
      <div className="hidden lg:block w-64 bg-white shadow-lg p-4 overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">瓦片调色板</h3>
        
        {/* 工具选择 */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">工具</h4>
          <div className="space-y-2">
            {[
              { key: 'draw', label: '绘制', icon: '🖌️' },
              { key: 'erase', label: '擦除', icon: '🧽' },
              { key: 'fill', label: '填充', icon: '🪣' }
            ].map((toolOption) => (
              <button
                key={toolOption.key}
                className={`w-full p-3 text-left rounded-lg font-medium transition-colors ${
                  tool === toolOption.key ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200'
                }`}
                onClick={() => setTool(toolOption.key as typeof tool)}
              >
                {toolOption.icon} {toolOption.label}
              </button>
            ))}
          </div>
        </div>

        {/* 瓦片选择 */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">瓦片类型</h4>
          <div className="grid grid-cols-2 gap-2">
            {TILE_DEFINITIONS.map((tile) => (
              <button
                key={tile.id}
                className={`p-3 rounded-lg border-2 text-center transition-all ${
                  selectedTileId === tile.id ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => setSelectedTileId(tile.id)}
                style={{ backgroundColor: `#${getTileColor(tile.type).toString(16).padStart(6, '0')}40` }}
              >
                <div className="text-xs font-medium">{tile.name}</div>
                <div className="text-xs text-gray-600 mt-1">{tile.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 地图操作 */}
        <div className="space-y-2">
          <button
            className="w-full p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium shadow-md transition-colors"
            onClick={saveMap}
          >
            💾 保存地图
          </button>
          
          <label className="block">
            <input
              type="file"
              accept=".json"
              onChange={loadMap}
              className="hidden"
            />
            <span className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer block text-center font-medium shadow-md transition-colors">
              📁 加载地图
            </span>
          </label>
          
          <button
            className="w-full p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium shadow-md transition-colors"
            onClick={clearMap}
          >
            🗑️ 清空地图
          </button>
        </div>

        {/* 地图信息 */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium mb-2">地图信息</h4>
          <div className="text-xs space-y-1">
            <div>尺寸: {mapData.width} × {mapData.height}</div>
            <div>名称: {mapData.metadata.name}</div>
            <div>修改: {new Date(mapData.metadata.modifiedAt).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* 地图编辑区域 */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="hidden lg:block bg-white shadow-sm p-4 border-b">
          <h2 className="text-xl font-semibold">地图编辑器</h2>
          <p className="text-gray-600 text-sm">
            选择瓦片类型，然后在地图上点击或拖拽来编辑地形
          </p>
        </div>
        
        <div className="flex-1 overflow-auto bg-gray-200 p-2 lg:p-4 touch-none">
          <div className="inline-block bg-white shadow-lg rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              className="border-0 touch-none map-editor-canvas"
              style={{ 
                imageRendering: 'pixelated',
                maxWidth: '100%',
                height: 'auto'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TileEditor;