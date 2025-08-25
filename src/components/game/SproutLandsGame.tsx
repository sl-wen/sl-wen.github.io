'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SproutLandsPlayer } from './entities/SproutLandsPlayer';
import { SproutLandsCrop } from './entities/SproutLandsCrop';
import { SproutLandsInventory } from './entities/SproutLandsInventory';

// Sprout Lands Game Types
export interface GameTile {
  x: number;
  y: number;
  type: 'grass' | 'tilled' | 'watered' | 'planted';
  crop?: SproutLandsCrop;
}

export interface GameState {
  player: {
    x: number;
    y: number;
    direction: 'up' | 'down' | 'left' | 'right';
    currentTool: 'hoe' | 'wateringCan' | 'seeds' | 'hand';
    energy: number;
    maxEnergy: number;
  };
  tiles: GameTile[][];
  inventory: SproutLandsInventory;
  gameTime: number;
}

interface SproutLandsGameProps {
  width?: number;
  height?: number;
  onStateChange?: (state: GameState) => void;
}

const TILE_SIZE = 32;
const GRID_WIDTH = 20;
const GRID_HEIGHT = 15;

export const SproutLandsGame: React.FC<SproutLandsGameProps> = ({
  width = 640,
  height = 480,
  onStateChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [gameState, setGameState] = useState<GameState>(() => initializeGameState());
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);
  const [sprites, setSprites] = useState<{ [key: string]: HTMLImageElement }>({});

  // Initialize game state
  function initializeGameState(): GameState {
    const tiles: GameTile[][] = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
      tiles[y] = [];
      for (let x = 0; x < GRID_WIDTH; x++) {
        tiles[y][x] = {
          x,
          y,
          type: 'grass'
        };
      }
    }

    return {
      player: {
        x: GRID_WIDTH / 2,
        y: GRID_HEIGHT / 2,
        direction: 'down',
        currentTool: 'hoe',
        energy: 100,
        maxEnergy: 100
      },
      tiles,
      inventory: new SproutLandsInventory(),
      gameTime: 0
    };
  }

  // Load sprites
  const loadSprites = useCallback(async () => {
    const spriteUrls = {
      character: '/assets/farm-assets/Sprout Lands - Sprites - premium pack/Characters/Premium Charakter Spritesheet.png',
      tools: '/assets/farm-assets/Sprout Lands - Sprites - premium pack/Characters/Tools.png',
      farmingPlants: '/assets/farm-assets/Sprout Lands - Sprites - premium pack/Objects/Farming Plants.png',
      tileGrass: '/assets/farm-assets/Sprout Lands - Sprites - premium pack/Tilesets/ground tiles/grass.png',
      waterEffect: '/assets/farm-assets/Sprout Lands - Sprites - premium pack/Characters/water from wateringcan frames.png'
    };

    const loadedSprites: { [key: string]: HTMLImageElement } = {};
    
    for (const [key, url] of Object.entries(spriteUrls)) {
      try {
        const img = new Image();
        img.src = url;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        loadedSprites[key] = img;
      } catch (error) {
        console.warn(`Failed to load sprite: ${url}`, error);
      }
    }

    setSprites(loadedSprites);
    setIsLoaded(true);
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => new Set(prev).add(e.code));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys(prev => {
        const newKeys = new Set(prev);
        newKeys.delete(e.code);
        return newKeys;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Update game state
  const updateGame = useCallback(() => {
    setGameState(prevState => {
      const newState = { ...prevState };
      let playerMoved = false;

      // Handle player movement
      if (keys.has('ArrowUp') || keys.has('KeyW')) {
        if (newState.player.y > 0) {
          newState.player.y -= 1;
          newState.player.direction = 'up';
          playerMoved = true;
        }
      }
      if (keys.has('ArrowDown') || keys.has('KeyS')) {
        if (newState.player.y < GRID_HEIGHT - 1) {
          newState.player.y += 1;
          newState.player.direction = 'down';
          playerMoved = true;
        }
      }
      if (keys.has('ArrowLeft') || keys.has('KeyA')) {
        if (newState.player.x > 0) {
          newState.player.x -= 1;
          newState.player.direction = 'left';
          playerMoved = true;
        }
      }
      if (keys.has('ArrowRight') || keys.has('KeyD')) {
        if (newState.player.x < GRID_WIDTH - 1) {
          newState.player.x += 1;
          newState.player.direction = 'right';
          playerMoved = true;
        }
      }

      // Handle tool selection
      if (keys.has('Digit1')) newState.player.currentTool = 'hoe';
      if (keys.has('Digit2')) newState.player.currentTool = 'wateringCan';
      if (keys.has('Digit3')) newState.player.currentTool = 'seeds';
      if (keys.has('Digit4')) newState.player.currentTool = 'hand';

      // Handle tool usage
      if (keys.has('Space')) {
        const currentTile = newState.tiles[newState.player.y][newState.player.x];
        
        switch (newState.player.currentTool) {
          case 'hoe':
            if (currentTile.type === 'grass') {
              currentTile.type = 'tilled';
            }
            break;
          case 'wateringCan':
            if (currentTile.type === 'tilled' || currentTile.type === 'planted') {
              currentTile.type = currentTile.crop ? 'planted' : 'watered';
            }
            break;
          case 'seeds':
            if (currentTile.type === 'tilled' || currentTile.type === 'watered') {
              if (!currentTile.crop) {
                currentTile.crop = new SproutLandsCrop('carrot', Date.now());
                currentTile.type = 'planted';
              }
            }
            break;
          case 'hand':
            if (currentTile.crop && currentTile.crop.isReady()) {
              newState.inventory.addItem(currentTile.crop.getHarvestItem());
              currentTile.crop = undefined;
              currentTile.type = 'tilled';
            }
            break;
        }
      }

      // Update crops
      newState.tiles.forEach(row => {
        row.forEach(tile => {
          if (tile.crop) {
            tile.crop.update(Date.now());
          }
        });
      });

      // Update game time
      newState.gameTime += 16; // ~60fps

      return newState;
    });
  }, [keys]);

  // Render game
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#4a7c59'; // Grass green background
    ctx.fillRect(0, 0, width, height);

    // Draw tiles
    gameState.tiles.forEach((row, y) => {
      row.forEach((tile, x) => {
        const tileX = x * TILE_SIZE;
        const tileY = y * TILE_SIZE;

        // Draw base tile
        ctx.fillStyle = getTileColor(tile.type);
        ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);

        // Draw tile border
        ctx.strokeStyle = '#2d5a3d';
        ctx.lineWidth = 1;
        ctx.strokeRect(tileX, tileY, TILE_SIZE, TILE_SIZE);

        // Draw crop if present
        if (tile.crop) {
          const cropSprite = getCropSprite(tile.crop);
          if (cropSprite) {
            ctx.drawImage(cropSprite, tileX + 4, tileY + 4, TILE_SIZE - 8, TILE_SIZE - 8);
          } else {
            // Fallback crop representation
            ctx.fillStyle = tile.crop.isReady() ? '#ff6b6b' : '#51cf66';
            ctx.fillRect(tileX + 8, tileY + 8, TILE_SIZE - 16, TILE_SIZE - 16);
          }
        }
      });
    });

    // Draw player
    const playerX = gameState.player.x * TILE_SIZE;
    const playerY = gameState.player.y * TILE_SIZE;
    
    if (sprites.character) {
      // Use sprite sheet for character
      const spriteX = getPlayerSpriteX(gameState.player.direction);
      const spriteY = 0;
      ctx.drawImage(
        sprites.character,
        spriteX, spriteY, 16, 16, // source
        playerX + 8, playerY + 8, 16, 16 // destination
      );
    } else {
      // Fallback player representation
      ctx.fillStyle = '#ff9f43';
      ctx.fillRect(playerX + 8, playerY + 8, 16, 16);
      
      // Direction indicator
      ctx.fillStyle = '#2d3436';
      const dirOffset = getDirectionOffset(gameState.player.direction);
      ctx.fillRect(
        playerX + 14 + dirOffset.x * 4,
        playerY + 14 + dirOffset.y * 4,
        4, 4
      );
    }

    // Draw current tool indicator
    drawToolIndicator(ctx, gameState.player.currentTool, width - 60, 20);

    // Draw UI
    drawUI(ctx);

  }, [gameState, sprites, isLoaded, width, height]);

  // Helper functions
  const getTileColor = (type: GameTile['type']): string => {
    switch (type) {
      case 'grass': return '#4a7c59';
      case 'tilled': return '#8b4513';
      case 'watered': return '#654321';
      case 'planted': return '#5d4037';
      default: return '#4a7c59';
    }
  };

  const getCropSprite = (crop: SproutLandsCrop): HTMLImageElement | null => {
    // This would return the appropriate sprite based on crop type and growth stage
    return sprites.farmingPlants || null;
  };

  const getPlayerSpriteX = (direction: string): number => {
    switch (direction) {
      case 'down': return 0;
      case 'left': return 16;
      case 'right': return 32;
      case 'up': return 48;
      default: return 0;
    }
  };

  const getDirectionOffset = (direction: string) => {
    switch (direction) {
      case 'up': return { x: 0, y: -1 };
      case 'down': return { x: 0, y: 1 };
      case 'left': return { x: -1, y: 0 };
      case 'right': return { x: 1, y: 0 };
      default: return { x: 0, y: 0 };
    }
  };

  const drawToolIndicator = (ctx: CanvasRenderingContext2D, tool: string, x: number, y: number) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x - 20, y - 10, 80, 30);
    
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.fillText(`Tool: ${tool}`, x - 15, y + 5);
  };

  const drawUI = (ctx: CanvasRenderingContext2D) => {
    // Energy bar
    const energyBarWidth = 100;
    const energyBarHeight = 10;
    const energyPercent = gameState.player.energy / gameState.player.maxEnergy;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, energyBarWidth + 4, energyBarHeight + 4);
    
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(12, 12, energyBarWidth, energyBarHeight);
    
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(12, 12, energyBarWidth * energyPercent, energyBarHeight);

    // Instructions
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, height - 80, 300, 70);
    
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.fillText('WASD/Arrows: Move', 15, height - 60);
    ctx.fillText('Space: Use Tool', 15, height - 45);
    ctx.fillText('1-4: Select Tool', 15, height - 30);
    ctx.fillText(`Current: ${gameState.player.currentTool}`, 15, height - 15);
  };

  // Game loop
  useEffect(() => {
    if (!isLoaded) return;

    const gameLoop = () => {
      updateGame();
      render();
      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isLoaded, updateGame, render]);

  // Load sprites on mount
  useEffect(() => {
    loadSprites();
  }, [loadSprites]);

  // Notify parent of state changes
  useEffect(() => {
    if (onStateChange) {
      onStateChange(gameState);
    }
  }, [gameState, onStateChange]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-green-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-green-800">Loading Sprout Lands...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-green-600 rounded-lg shadow-lg"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
};

export default SproutLandsGame;