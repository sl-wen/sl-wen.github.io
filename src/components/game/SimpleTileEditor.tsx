'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as Phaser from 'phaser';

interface SimpleTileEditorProps {
  width?: number;
  height?: number;
}

/**
 * 简化的瓦片编辑器 - 用于测试和调试
 */
export const SimpleTileEditor: React.FC<SimpleTileEditorProps> = ({
  width = 800,
  height = 600
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [selectedTile, setSelectedTile] = useState(0);

  // 瓦片定义
  const tileTypes = [
    { id: 0, name: '草地', color: 0x90EE90 },
    { id: 1, name: '水域', color: 0x4169E1 },
    { id: 2, name: '道路', color: 0xD2B48C },
    { id: 3, name: '石头', color: 0x696969 },
    { id: 4, name: '土壤', color: 0x8B4513 }
  ];

  // 地图数据
  const [mapData, setMapData] = useState<number[][]>(() => {
    const gridWidth = 25;
    const gridHeight = 20;
    return Array(gridHeight).fill(null).map(() => Array(gridWidth).fill(0));
  });

  useEffect(() => {
    if (!canvasRef.current) return;

    class SimpleTileScene extends Phaser.Scene {
      private tileSize = 24;
      private sprites: Phaser.GameObjects.Rectangle[][] = [];

      constructor() {
        super({ key: 'SimpleTileScene' });
      }

      create() {
        console.log('Simple tile editor scene created');
        
        // 初始化精灵网格
        this.sprites = mapData.map((row, y) => 
          row.map((tileId, x) => {
            const sprite = this.add.rectangle(
              x * this.tileSize + this.tileSize / 2,
              y * this.tileSize + this.tileSize / 2,
              this.tileSize,
              this.tileSize,
              tileTypes[tileId]?.color || 0xFFFFFF
            );
            sprite.setStrokeStyle(1, 0x000000, 0.2);
            sprite.setInteractive();
            
            // 点击事件
            sprite.on('pointerdown', () => {
              this.updateTile(x, y, selectedTile);
            });

            return sprite;
          })
        );

        // 设置相机边界
        this.cameras.main.setBounds(0, 0, mapData[0].length * this.tileSize, mapData.length * this.tileSize);
      }

      updateTile(x: number, y: number, tileId: number) {
        if (this.sprites[y] && this.sprites[y][x]) {
          const newColor = tileTypes[tileId]?.color || 0xFFFFFF;
          this.sprites[y][x].setFillStyle(newColor);
          
          // 更新地图数据
          const newMapData = mapData.map(row => [...row]);
          newMapData[y][x] = tileId;
          setMapData(newMapData);
        }
      }
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width,
      height,
      canvas: canvasRef.current,
      scene: SimpleTileScene,
      backgroundColor: '#f0f0f0'
    };

    try {
      gameRef.current = new Phaser.Game(config);
    } catch (error) {
      console.error('Error creating simple tile editor:', error);
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [width, height, selectedTile]);

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center space-x-4 p-4 bg-gray-100 rounded-lg">
        <span className="font-medium">选择瓦片:</span>
        {tileTypes.map(tile => (
          <button
            key={tile.id}
            onClick={() => setSelectedTile(tile.id)}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedTile === tile.id 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            style={{
              backgroundColor: selectedTile === tile.id ? undefined : `#${tile.color.toString(16).padStart(6, '0')}40`
            }}
          >
            {tile.name}
          </button>
        ))}
      </div>
      
      <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          className="block"
          style={{ width: '100%', height: 'auto', maxWidth: width }}
        />
      </div>

      <div className="text-sm text-gray-600">
        点击网格来放置选中的瓦片类型。当前选择: <strong>{tileTypes[selectedTile]?.name}</strong>
      </div>
    </div>
  );
};

export default SimpleTileEditor;