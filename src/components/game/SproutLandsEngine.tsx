'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

// 游戏常量
const TILE_SIZE = 16;
const SCALE = 2;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const WORLD_WIDTH = 50;
const WORLD_HEIGHT = 50;

// 游戏状态接口
interface Position {
  x: number;
  y: number;
}

interface Player {
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right';
  isMoving: boolean;
  animationFrame: number;
  speed: number;
}

interface GameTile {
  x: number;
  y: number;
  type: 'grass' | 'dirt' | 'tilled' | 'watered' | 'planted';
  crop?: Crop;
  item?: Item;
}

interface Crop {
  type: string;
  stage: number;
  maxStage: number;
  plantedTime: number;
  lastWateredTime: number;
  growthTime: number;
  name: string;
}

interface Item {
  id: string;
  name: string;
  type: 'seed' | 'crop' | 'tool' | 'material';
  quantity: number;
  spriteX: number;
  spriteY: number;
}

interface Inventory {
  items: Item[];
  selectedSlot: number;
  maxSlots: number;
}

interface GameState {
  player: Player;
  world: GameTile[][];
  inventory: Inventory;
  camera: Position;
  gameTime: number;
  season: 'spring' | 'summer' | 'fall' | 'winter';
  gold: number;
  currentTool: string;
}

// 作物数据
const CROP_DATA = {
  carrot: { name: '胡萝卜', growthTime: 45000, stages: 4, sellPrice: 35 },
  tomato: { name: '番茄', growthTime: 60000, stages: 4, sellPrice: 60 },
  wheat: { name: '小麦', growthTime: 30000, stages: 4, sellPrice: 25 },
  corn: { name: '玉米', growthTime: 90000, stages: 5, sellPrice: 100 },
  potato: { name: '土豆', growthTime: 50000, stages: 4, sellPrice: 40 },
  lettuce: { name: '生菜', growthTime: 25000, stages: 3, sellPrice: 20 },
};

interface SproutLandsEngineProps {
  width?: number;
  height?: number;
  onStateChange?: (state: GameState) => void;
}

export const SproutLandsEngine: React.FC<SproutLandsEngineProps> = ({
  width = CANVAS_WIDTH,
  height = CANVAS_HEIGHT,
  onStateChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const keysRef = useRef<Set<string>>(new Set());
  const lastTimeRef = useRef<number>(0);
  const spritesRef = useRef<Map<string, HTMLImageElement>>(new Map());

  const [gameState, setGameState] = useState<GameState>(() => ({
    player: {
      x: 25 * TILE_SIZE,
      y: 25 * TILE_SIZE,
      direction: 'down',
      isMoving: false,
      animationFrame: 0,
      speed: 2
    },
    world: initializeWorld(),
    inventory: {
      items: [
        { id: 'hoe', name: '锄头', type: 'tool', quantity: 1, spriteX: 0, spriteY: 0 },
        { id: 'watering_can', name: '洒水壶', type: 'tool', quantity: 1, spriteX: 16, spriteY: 0 },
        { id: 'carrot_seeds', name: '胡萝卜种子', type: 'seed', quantity: 10, spriteX: 0, spriteY: 16 },
        { id: 'tomato_seeds', name: '番茄种子', type: 'seed', quantity: 5, spriteX: 16, spriteY: 16 },
      ],
      selectedSlot: 0,
      maxSlots: 20
    },
    camera: { x: 0, y: 0 },
    gameTime: 0,
    season: 'spring',
    gold: 100,
    currentTool: 'hoe'
  }));

  // 初始化世界
  function initializeWorld(): GameTile[][] {
    const world: GameTile[][] = [];
    for (let y = 0; y < WORLD_HEIGHT; y++) {
      world[y] = [];
      for (let x = 0; x < WORLD_WIDTH; x++) {
        world[y][x] = {
          x: x * TILE_SIZE,
          y: y * TILE_SIZE,
          type: 'grass'
        };
      }
    }
    return world;
  }

  // 加载精灵图
  const loadSprites = useCallback(async () => {
    const spritePromises = [
      { key: 'character', src: '/assets/farm-assets/Sprout Lands - Sprites - premium pack/Characters/Premium Charakter Spritesheet.png' },
      { key: 'farming_plants', src: '/assets/farm-assets/Sprout Lands - Sprites - premium pack/Objects/Farming Plants.png' },
      { key: 'items', src: '/assets/farm-assets/Sprout Lands - Sprites - premium pack/Objects/Items/All items.png' },
      { key: 'tools', src: '/assets/farm-assets/Sprout Lands - Sprites - premium pack/Characters/Tools.png' },
      { key: 'ground', src: '/assets/farm-assets/Sprout Lands - Sprites - premium pack/Tilesets/ground tiles/Grass.png' }
    ];

    const sprites = spritesRef.current;
    
    await Promise.all(spritePromises.map(({ key, src }) => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          sprites.set(key, img);
          resolve();
        };
        img.onerror = reject;
        img.src = src;
      });
    }));
  }, []);

  // 键盘事件处理
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keysRef.current.add(e.key.toLowerCase());
    
    // 快捷键
    if (e.key >= '1' && e.key <= '9') {
      const slot = parseInt(e.key) - 1;
      if (slot < gameState.inventory.items.length) {
        setGameState(prev => ({
          ...prev,
          inventory: { ...prev.inventory, selectedSlot: slot },
          currentTool: prev.inventory.items[slot].id
        }));
      }
    }
  }, [gameState.inventory.items]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysRef.current.delete(e.key.toLowerCase());
  }, []);

  // 鼠标点击事件
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / SCALE + gameState.camera.x;
    const y = (e.clientY - rect.top) / SCALE + gameState.camera.y;
    
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);

    useTool(tileX, tileY);
  }, [gameState.camera, gameState.currentTool]);

  // 使用工具
  const useTool = useCallback((tileX: number, tileY: number) => {
    if (tileX < 0 || tileX >= WORLD_WIDTH || tileY < 0 || tileY >= WORLD_HEIGHT) return;

    setGameState(prev => {
      const newWorld = [...prev.world.map(row => [...row])];
      const tile = newWorld[tileY][tileX];
      const selectedItem = prev.inventory.items[prev.inventory.selectedSlot];

      switch (selectedItem?.id) {
        case 'hoe':
          if (tile.type === 'grass') {
            tile.type = 'tilled';
          }
          break;

        case 'watering_can':
          if (tile.type === 'tilled' || tile.type === 'planted') {
            tile.type = tile.type === 'tilled' ? 'watered' : 'planted';
            if (tile.crop) {
              tile.crop.lastWateredTime = Date.now();
            }
          }
          break;

        default:
          // 种植种子
          if (selectedItem?.type === 'seed' && (tile.type === 'tilled' || tile.type === 'watered')) {
            const cropType = selectedItem.id.replace('_seeds', '');
            const cropInfo = CROP_DATA[cropType as keyof typeof CROP_DATA];
            
            if (cropInfo) {
              tile.type = 'planted';
              tile.crop = {
                type: cropType,
                stage: 0,
                maxStage: cropInfo.stages,
                plantedTime: Date.now(),
                lastWateredTime: Date.now(),
                growthTime: cropInfo.growthTime,
                name: cropInfo.name
              };

              // 减少种子数量
              const newItems = [...prev.inventory.items];
              const seedItem = newItems[prev.inventory.selectedSlot];
              if (seedItem.quantity > 1) {
                seedItem.quantity--;
              } else {
                newItems.splice(prev.inventory.selectedSlot, 1);
              }

              return {
                ...prev,
                world: newWorld,
                inventory: { ...prev.inventory, items: newItems }
              };
            }
          }
          
          // 收获作物
          if (tile.crop && tile.crop.stage >= tile.crop.maxStage - 1) {
            const cropInfo = CROP_DATA[tile.crop.type as keyof typeof CROP_DATA];
            const harvestedItem: Item = {
              id: tile.crop.type,
              name: tile.crop.name,
              type: 'crop',
              quantity: Math.floor(Math.random() * 3) + 1,
              spriteX: 0,
              spriteY: 32
            };

            // 添加到背包
            const newItems = [...prev.inventory.items];
            const existingIndex = newItems.findIndex(item => item.id === harvestedItem.id);
            
            if (existingIndex >= 0) {
              newItems[existingIndex].quantity += harvestedItem.quantity;
            } else {
              newItems.push(harvestedItem);
            }

            // 清除作物
            tile.crop = undefined;
            tile.type = 'tilled';

            return {
              ...prev,
              world: newWorld,
              inventory: { ...prev.inventory, items: newItems },
              gold: prev.gold + cropInfo.sellPrice * harvestedItem.quantity
            };
          }
          break;
      }

      return { ...prev, world: newWorld };
    });
  }, []);

  // 更新游戏逻辑
  const updateGame = useCallback((deltaTime: number) => {
    setGameState(prev => {
      const newState = { ...prev };
      
      // 更新玩家移动
      const keys = keysRef.current;
      let newX = newState.player.x;
      let newY = newState.player.y;
      let isMoving = false;
      let direction = newState.player.direction;

      if (keys.has('w') || keys.has('arrowup')) {
        newY -= newState.player.speed;
        direction = 'up';
        isMoving = true;
      }
      if (keys.has('s') || keys.has('arrowdown')) {
        newY += newState.player.speed;
        direction = 'down';
        isMoving = true;
      }
      if (keys.has('a') || keys.has('arrowleft')) {
        newX -= newState.player.speed;
        direction = 'left';
        isMoving = true;
      }
      if (keys.has('d') || keys.has('arrowright')) {
        newX += newState.player.speed;
        direction = 'right';
        isMoving = true;
      }

      // 边界检查
      newX = Math.max(0, Math.min(newX, WORLD_WIDTH * TILE_SIZE - TILE_SIZE));
      newY = Math.max(0, Math.min(newY, WORLD_HEIGHT * TILE_SIZE - TILE_SIZE));

      newState.player.x = newX;
      newState.player.y = newY;
      newState.player.direction = direction;
      newState.player.isMoving = isMoving;

      // 更新动画帧
      if (isMoving) {
        newState.player.animationFrame += deltaTime * 0.01;
        if (newState.player.animationFrame >= 4) {
          newState.player.animationFrame = 0;
        }
      }

      // 更新摄像机
      newState.camera.x = newState.player.x - width / 2 / SCALE;
      newState.camera.y = newState.player.y - height / 2 / SCALE;
      newState.camera.x = Math.max(0, Math.min(newState.camera.x, WORLD_WIDTH * TILE_SIZE - width / SCALE));
      newState.camera.y = Math.max(0, Math.min(newState.camera.y, WORLD_HEIGHT * TILE_SIZE - height / SCALE));

      // 更新作物生长
      const currentTime = Date.now();
      newState.world.forEach(row => {
        row.forEach(tile => {
          if (tile.crop) {
            const timeSincePlanted = currentTime - tile.crop.plantedTime;
            const growthProgress = timeSincePlanted / tile.crop.growthTime;
            tile.crop.stage = Math.min(Math.floor(growthProgress * tile.crop.maxStage), tile.crop.maxStage - 1);
          }
        });
      });

      // 更新游戏时间
      newState.gameTime += deltaTime;

      return newState;
    });
  }, [width, height]);

  // 渲染游戏
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.scale(SCALE, SCALE);
    ctx.translate(-gameState.camera.x, -gameState.camera.y);

    const sprites = spritesRef.current;

    // 渲染地面
    const startX = Math.floor(gameState.camera.x / TILE_SIZE);
    const endX = Math.min(startX + Math.ceil(width / SCALE / TILE_SIZE) + 1, WORLD_WIDTH);
    const startY = Math.floor(gameState.camera.y / TILE_SIZE);
    const endY = Math.min(startY + Math.ceil(height / SCALE / TILE_SIZE) + 1, WORLD_HEIGHT);

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const tile = gameState.world[y][x];
        
        // 渲染草地
        ctx.fillStyle = '#4a7c59';
        ctx.fillRect(tile.x, tile.y, TILE_SIZE, TILE_SIZE);

        // 渲染耕地
        if (tile.type === 'tilled' || tile.type === 'watered' || tile.type === 'planted') {
          ctx.fillStyle = tile.type === 'watered' ? '#654321' : '#8b4513';
          ctx.fillRect(tile.x, tile.y, TILE_SIZE, TILE_SIZE);
        }

        // 渲染作物
        if (tile.crop && sprites.has('farming_plants')) {
          const plantSprite = sprites.get('farming_plants')!;
          const spriteX = tile.crop.stage * 16;
          const spriteY = 0; // 简化处理，实际应该根据作物类型选择
          
          ctx.drawImage(
            plantSprite,
            spriteX, spriteY, 16, 16,
            tile.x, tile.y, TILE_SIZE, TILE_SIZE
          );
        }
      }
    }

    // 渲染玩家
    if (sprites.has('character')) {
      const characterSprite = sprites.get('character')!;
      const directionMap = { down: 0, left: 1, right: 2, up: 3 };
      const spriteY = directionMap[gameState.player.direction] * 16;
      const spriteX = Math.floor(gameState.player.animationFrame) * 16;
      
      ctx.drawImage(
        characterSprite,
        spriteX, spriteY, 16, 16,
        gameState.player.x, gameState.player.y, TILE_SIZE, TILE_SIZE
      );
    }

    ctx.restore();

    // 渲染UI
    renderUI(ctx);
  }, [gameState, width, height]);

  // 渲染UI
  const renderUI = useCallback((ctx: CanvasRenderingContext2D) => {
    // 渲染背包栏
    const inventoryY = height - 60;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, inventoryY, 400, 50);

    // 渲染背包格子
    gameState.inventory.items.slice(0, 8).forEach((item, index) => {
      const x = 15 + index * 45;
      const y = inventoryY + 5;
      
      // 选中状态
      if (index === gameState.inventory.selectedSlot) {
        ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
        ctx.fillRect(x, y, 40, 40);
      }
      
      // 物品框
      ctx.strokeStyle = '#fff';
      ctx.strokeRect(x, y, 40, 40);
      
      // 物品图标（简化显示）
      ctx.fillStyle = '#fff';
      ctx.font = '12px Arial';
      ctx.fillText(item.name.charAt(0), x + 15, y + 25);
      
      // 数量
      if (item.quantity > 1) {
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.fillText(item.quantity.toString(), x + 30, y + 35);
      }
    });

    // 渲染金币
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.fillText(`金币: ${gameState.gold}`, width - 120, 30);
    
    // 渲染当前工具
    ctx.fillText(`工具: ${gameState.inventory.items[gameState.inventory.selectedSlot]?.name || '无'}`, 10, 30);
  }, [gameState, width, height]);

  // 游戏循环
  const gameLoop = useCallback((currentTime: number) => {
    const deltaTime = currentTime - lastTimeRef.current;
    lastTimeRef.current = currentTime;

    updateGame(deltaTime);
    render();

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [updateGame, render]);

  // 初始化
  useEffect(() => {
    loadSprites().then(() => {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    });

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [loadSprites, gameLoop, handleKeyDown, handleKeyUp]);

  // 状态变化回调
  useEffect(() => {
    if (onStateChange) {
      onStateChange(gameState);
    }
  }, [gameState, onStateChange]);

  // 更新TODO状态
  useEffect(() => {
    // 标记分析原项目为完成
    // 这里可以添加状态更新逻辑
  }, []);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleCanvasClick}
        className="border border-gray-300 bg-green-100 cursor-crosshair"
        style={{ imageRendering: 'pixelated' }}
      />
      
      {/* 移动端控制按钮 */}
      <div className="absolute bottom-2 left-2 md:hidden">
        <div className="grid grid-cols-3 gap-1 w-32 h-32">
          <div></div>
          <button className="bg-gray-700 text-white rounded p-2 opacity-70">↑</button>
          <div></div>
          <button className="bg-gray-700 text-white rounded p-2 opacity-70">←</button>
          <button className="bg-gray-700 text-white rounded p-2 opacity-70">⚡</button>
          <button className="bg-gray-700 text-white rounded p-2 opacity-70">→</button>
          <div></div>
          <button className="bg-gray-700 text-white rounded p-2 opacity-70">↓</button>
          <div></div>
        </div>
      </div>

      {/* 游戏信息面板 */}
      <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white p-2 rounded text-sm">
        <div>季节: {gameState.season === 'spring' ? '春季' : gameState.season === 'summer' ? '夏季' : gameState.season === 'fall' ? '秋季' : '冬季'}</div>
        <div>时间: {Math.floor(gameState.gameTime / 1000)}s</div>
        <div>位置: ({Math.floor(gameState.player.x / TILE_SIZE)}, {Math.floor(gameState.player.y / TILE_SIZE)})</div>
      </div>
    </div>
  );
};

export default SproutLandsEngine;