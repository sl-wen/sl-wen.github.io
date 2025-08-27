'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { TileEditor, TILE_DEFINITIONS } from './TileEditor';
import { FlexibleTileManager, FlexibleMapData, FLEXIBLE_TILE_DEFINITIONS } from './FlexibleTileManager';

/**
 * 地图布局设计器组件
 * 提供完整的地图设计界面和功能
 */

interface MapLayoutDesignerProps {
  onMapSave?: (mapData: FlexibleMapData) => void;
  onMapLoad?: () => void;
  initialMapData?: FlexibleMapData;
  className?: string;
}

/**
 * 预设地图模板
 */
const MAP_TEMPLATES = {
  'empty': {
    name: '空白地图',
    description: '全草地的空白地图',
    generator: (width: number, height: number) => {
      const tiles = Array(height).fill(null).map(() => Array(width).fill(0));
      return tiles;
    }
  },
  'farm': {
    name: '农场布局',
    description: '传统农场布局，包含房屋区、农田区、水源',
    generator: (width: number, height: number) => {
      const tiles = Array(height).fill(null).map(() => Array(width).fill(0));
      
      // 添加边界栅栏
      for (let x = 0; x < width; x++) {
        tiles[0][x] = 3; // 上边界
        tiles[height - 1][x] = 3; // 下边界
      }
      for (let y = 0; y < height; y++) {
        tiles[y][0] = 3; // 左边界
        tiles[y][width - 1] = 3; // 右边界
      }
      
      // 添加中央道路
      const roadY = Math.floor(height / 2);
      for (let x = 1; x < width - 1; x++) {
        tiles[roadY][x] = 2;
      }
      
      // 添加水源
      const waterCenterX = Math.floor(width * 0.75);
      const waterCenterY = Math.floor(height * 0.25);
      const waterRadius = 3;
      for (let y = Math.max(1, waterCenterY - waterRadius); y <= Math.min(height - 2, waterCenterY + waterRadius); y++) {
        for (let x = Math.max(1, waterCenterX - waterRadius); x <= Math.min(width - 2, waterCenterX + waterRadius); x++) {
          const distance = Math.sqrt((x - waterCenterX) ** 2 + (y - waterCenterY) ** 2);
          if (distance <= waterRadius) {
            tiles[y][x] = 1; // 水域
          }
        }
      }
      
      // 添加农田区域
      for (let y = Math.floor(height * 0.6); y < height - 1; y++) {
        for (let x = Math.floor(width * 0.1); x < Math.floor(width * 0.6); x++) {
          if (tiles[y][x] === 0) {
            tiles[y][x] = 4; // 肥沃土壤
          }
        }
      }
      
      return tiles;
    }
  },
  'village': {
    name: '村庄布局',
    description: '村庄风格布局，包含道路网络和建筑区域',
    generator: (width: number, height: number) => {
      const tiles = Array(height).fill(null).map(() => Array(width).fill(0));
      
      // 创建道路网格
      const roadSpacing = 8;
      for (let x = roadSpacing; x < width; x += roadSpacing) {
        for (let y = 1; y < height - 1; y++) {
          tiles[y][x] = 2; // 垂直道路
        }
      }
      for (let y = roadSpacing; y < height; y += roadSpacing) {
        for (let x = 1; x < width - 1; x++) {
          tiles[y][x] = 2; // 水平道路
        }
      }
      
      // 添加一些装饰性灌木
      for (let i = 0; i < Math.floor(width * height * 0.05); i++) {
        const x = Math.floor(Math.random() * width);
        const y = Math.floor(Math.random() * height);
        if (tiles[y][x] === 0) {
          tiles[y][x] = 7; // 灌木
        }
      }
      
      return tiles;
    }
  },
  'maze': {
    name: '迷宫布局',
    description: '迷宫风格布局，适合探索游戏',
    generator: (width: number, height: number) => {
      const tiles = Array(height).fill(null).map(() => Array(width).fill(3)); // 全部填充栅栏
      
      // 简单迷宫生成算法
      const visited = Array(height).fill(null).map(() => Array(width).fill(false));
      
      function carvePath(x: number, y: number) {
        visited[y][x] = true;
        tiles[y][x] = 0; // 草地路径
        
        const directions = [
          [0, -2], [2, 0], [0, 2], [-2, 0]
        ].sort(() => Math.random() - 0.5);
        
        for (const [dx, dy] of directions) {
          const nx = x + dx;
          const ny = y + dy;
          
          if (nx >= 0 && nx < width && ny >= 0 && ny < height && !visited[ny][nx]) {
            tiles[y + dy / 2][x + dx / 2] = 0; // 连接路径
            carvePath(nx, ny);
          }
        }
      }
      
      // 从左上角开始生成迷宫
      carvePath(1, 1);
      
      // 确保有出入口
      tiles[1][0] = 0; // 入口
      tiles[height - 2][width - 1] = 0; // 出口
      
      return tiles;
    }
  }
};

export const MapLayoutDesigner: React.FC<MapLayoutDesignerProps> = ({
  onMapSave,
  onMapLoad,
  initialMapData,
  className = ''
}) => {
  const [mapWidth, setMapWidth] = useState(32);
  const [mapHeight, setMapHeight] = useState(24);
  const [currentMapData, setCurrentMapData] = useState<FlexibleMapData | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('empty');
  const [showEditor, setShowEditor] = useState(false);
  const [savedMaps, setSavedMaps] = useState<FlexibleMapData[]>([]);

  // 加载保存的地图列表
  useEffect(() => {
    const saved = localStorage.getItem('savedMaps');
    if (saved) {
      try {
        setSavedMaps(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved maps:', e);
      }
    }
  }, []);

  /**
   * 创建新地图
   */
  const createNewMap = useCallback(() => {
    try {
      const template = MAP_TEMPLATES[selectedTemplate as keyof typeof MAP_TEMPLATES];
      if (!template) {
        console.error('Invalid template selected:', selectedTemplate);
        return;
      }

      const tiles = template.generator(mapWidth, mapHeight);

      const mapData: FlexibleMapData = {
        config: {
          width: mapWidth,
          height: mapHeight,
          tileWidth: 16,
          tileHeight: 16,
          layers: [
            {
              name: 'terrain',
              tiles: tiles,
              depth: 1,
              visible: true,
              opacity: 1.0
            }
          ]
        },
        metadata: {
          name: `${template.name} (${mapWidth}x${mapHeight})`,
          description: template.description,
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString()
        }
      };

      setCurrentMapData(mapData);
      setShowEditor(true);
    } catch (error) {
      console.error('Error creating new map:', error);
    }
  }, [mapWidth, mapHeight, selectedTemplate]);

  /**
   * 保存地图
   */
  const saveMap = useCallback((mapData: FlexibleMapData) => {
    const updatedMaps = [...savedMaps];
    const existingIndex = updatedMaps.findIndex(m => m.metadata.name === mapData.metadata.name);
    
    if (existingIndex >= 0) {
      updatedMaps[existingIndex] = { ...mapData, metadata: { ...mapData.metadata, modifiedAt: new Date().toISOString() } };
    } else {
      updatedMaps.push(mapData);
    }
    
    setSavedMaps(updatedMaps);
    localStorage.setItem('savedMaps', JSON.stringify(updatedMaps));
    setCurrentMapData(mapData);
    
    onMapSave?.(mapData);
  }, [savedMaps, onMapSave]);

  /**
   * 加载地图
   */
  const loadMap = useCallback((mapData: FlexibleMapData) => {
    setCurrentMapData(mapData);
    setMapWidth(mapData.config.width);
    setMapHeight(mapData.config.height);
    setShowEditor(true);
    onMapLoad?.();
  }, [onMapLoad]);

  /**
   * 删除地图
   */
  const deleteMap = useCallback((mapName: string) => {
    const updatedMaps = savedMaps.filter(m => m.metadata.name !== mapName);
    setSavedMaps(updatedMaps);
    localStorage.setItem('savedMaps', JSON.stringify(updatedMaps));
  }, [savedMaps]);

  /**
   * 导出地图
   */
  const exportMap = useCallback((mapData: FlexibleMapData) => {
    const dataStr = JSON.stringify(mapData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `map_${mapData.metadata.name.replace(/\s+/g, '_')}_${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, []);

  /**
   * 导入地图
   */
  const importMap = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const mapData = JSON.parse(e.target?.result as string) as FlexibleMapData;
        saveMap(mapData);
        alert('地图导入成功！');
      } catch (error) {
        alert('地图文件格式错误');
      }
    };
    reader.readAsText(file);
  }, [saveMap]);

  if (showEditor && currentMapData) {
    try {
      // 转换数据格式给TileEditor使用
      const editorMapData = {
        width: currentMapData.config.width,
        height: currentMapData.config.height,
        tiles: currentMapData.config.layers[0]?.tiles || [],
        metadata: currentMapData.metadata
      };

      // 验证数据有效性
      if (!editorMapData.tiles || editorMapData.tiles.length === 0) {
        console.error('Invalid map data: no tiles found');
        return (
          <div className={`h-screen flex items-center justify-center ${className}`}>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-red-600 mb-2">地图数据错误</h3>
              <p className="text-gray-600 mb-4">无法加载地图数据，请重新创建或选择其他地图。</p>
              <button 
                onClick={() => setShowEditor(false)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                返回
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className={`h-screen ${className}`}>
          <TileEditor
            config={{
              mapWidth: currentMapData.config.width,
              mapHeight: currentMapData.config.height,
              tileSize: 24, // 适中的瓦片大小
              canvasWidth: Math.min(1200, typeof window !== 'undefined' ? window.innerWidth - 100 : 1200),
              canvasHeight: Math.min(800, typeof window !== 'undefined' ? window.innerHeight - 200 : 800)
            }}
            initialMapData={editorMapData}
          onMapChange={(mapData) => {
            // 转换回FlexibleMapData格式
            const flexibleMapData: FlexibleMapData = {
              config: {
                width: mapData.width,
                height: mapData.height,
                tileWidth: 16,
                tileHeight: 16,
                layers: [
                  {
                    name: 'terrain',
                    tiles: mapData.tiles,
                    depth: 1,
                    visible: true,
                    opacity: 1.0
                  }
                ]
              },
              metadata: {
                ...mapData.metadata,
                version: '1.0.0'
              }
            };
            setCurrentMapData(flexibleMapData);
          }}
        />
        <button
          className="fixed top-4 right-4 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          onClick={() => setShowEditor(false)}
        >
          返回设计器
        </button>
        <button
          className="fixed top-4 right-24 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          onClick={() => currentMapData && saveMap(currentMapData)}
        >
          保存地图
        </button>
      </div>
    );
    } catch (error) {
      console.error('Error rendering map editor:', error);
      return (
        <div className={`h-screen flex items-center justify-center ${className}`}>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-600 mb-2">加载错误</h3>
            <p className="text-gray-600 mb-4">地图编辑器加载失败，请刷新页面重试。</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }
  }

  return (
    <div className={`p-3 lg:p-6 bg-gray-50 min-h-screen ${className}`}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-4 lg:mb-8">地图布局设计器</h1>
        
        {/* 创建新地图区域 */}
        <div className="bg-white rounded-lg shadow-md p-4 lg:p-6 mb-4 lg:mb-8">
          <h2 className="text-lg lg:text-xl font-semibold mb-4">创建新地图</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* 地图尺寸设置 */}
            <div>
              <h3 className="text-base lg:text-lg font-medium mb-3">地图尺寸</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    宽度 (瓦片数量)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={mapWidth}
                    onChange={(e) => setMapWidth(parseInt(e.target.value) || 32)}
                    className="w-full px-3 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    高度 (瓦片数量)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={mapHeight}
                    onChange={(e) => setMapHeight(parseInt(e.target.value) || 24)}
                    className="w-full px-3 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="text-sm text-gray-600">
                  实际尺寸: {mapWidth * 16} × {mapHeight * 16} 像素
                </div>
              </div>
            </div>

            {/* 模板选择 */}
            <div>
              <h3 className="text-base lg:text-lg font-medium mb-3">地图模板</h3>
              <div className="space-y-3">
                {Object.entries(MAP_TEMPLATES).map(([key, template]) => (
                  <label key={key} className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="template"
                      value={key}
                      checked={selectedTemplate === key}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      className="text-blue-600 mt-1 w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-base">{template.name}</div>
                      <div className="text-sm text-gray-600 leading-relaxed">{template.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 瓦片预览 */}
            <div>
              <h3 className="text-base lg:text-lg font-medium mb-3">可用瓦片类型</h3>
              <div className="grid grid-cols-2 gap-2">
                {FLEXIBLE_TILE_DEFINITIONS.slice(0, 8).map((tile) => (
                  <div
                    key={tile.id}
                    className="p-3 border rounded-lg text-center text-xs"
                    style={{ 
                      backgroundColor: `#${getTileColor(tile.type as string).toString(16).padStart(6, '0')}40` 
                    }}
                  >
                    <div className="font-medium mb-1">{tile.name}</div>
                    <div className="text-gray-600 leading-tight">{tile.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={createNewMap}
            className="mt-6 w-full lg:w-auto bg-blue-600 text-white px-6 py-4 lg:py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-base"
          >
            🎨 创建并编辑地图
          </button>
        </div>

        {/* 已保存的地图 */}
        <div className="bg-white rounded-lg shadow-md p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
            <h2 className="text-lg lg:text-xl font-semibold">已保存的地图</h2>
            <label className="bg-green-600 text-white px-4 py-3 lg:py-2 rounded-lg hover:bg-green-700 cursor-pointer text-center font-medium">
              📁 导入地图
              <input
                type="file"
                accept=".json"
                onChange={importMap}
                className="hidden"
              />
            </label>
          </div>

          {savedMaps.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">🗺️</div>
              <div className="text-lg mb-1">还没有保存的地图</div>
              <div className="text-sm">创建您的第一个地图开始吧！</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedMaps.map((mapData, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-base lg:text-lg mb-2">{mapData.metadata.name}</h3>
                  <p className="text-gray-600 text-sm mb-3 leading-relaxed">{mapData.metadata.description}</p>
                  
                  <div className="text-xs text-gray-500 mb-3 space-y-1">
                    <div>尺寸: {mapData.config.width} × {mapData.config.height}</div>
                    <div>修改: {new Date(mapData.metadata.modifiedAt).toLocaleString()}</div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => loadMap(mapData)}
                      className="flex-1 bg-blue-500 text-white px-3 py-3 lg:py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                    >
                      ✏️ 编辑
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => exportMap(mapData)}
                        className="bg-green-500 text-white px-4 py-3 lg:py-2 rounded-lg text-sm hover:bg-green-600 transition-colors"
                        title="导出地图"
                      >
                        💾
                      </button>
                      <button
                        onClick={() => deleteMap(mapData.metadata.name)}
                        className="bg-red-500 text-white px-4 py-3 lg:py-2 rounded-lg text-sm hover:bg-red-600 transition-colors"
                        title="删除地图"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * 获取瓦片颜色（用于预览）
 */
function getTileColor(tileType: string): number {
  switch (tileType) {
    case 'grass': return 0x90EE90;
    case 'water': return 0x4169E1;
    case 'path': return 0xD2B48C;
    case 'stone': return 0x696969;
    case 'soil': return 0x8B4513;
    case 'tilled_dirt': return 0x654321;
    case 'sand': return 0xF4A460;
    case 'bush': return 0x228B22;
    default: return 0xFFFFFF;
  }
}

export default MapLayoutDesigner;