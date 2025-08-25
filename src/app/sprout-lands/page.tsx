'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import NextDynamic from 'next/dynamic';
import { SproutLandsEngine } from '../../components/game/SproutLandsEngine';
import { SproutLandsInventory } from '../../components/game/entities/SproutLandsInventory';
import { ResourceLoader, LoadingProgress } from '../../components/game/utils/ResourceLoader';
import { GameAudioTriggers } from '../../components/game/utils/AudioManager';
import LoadingScreen from '../../components/game/ui/LoadingScreen';
import MobileControls from '../../components/game/ui/MobileControls';

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

// Dynamically import UI components to avoid SSR issues
const EnhancedChineseUI = NextDynamic(() => import('../../components/game/ui/EnhancedChineseUI'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 rounded">Loading UI...</div>
});

const ChineseSproutLandsShop = NextDynamic(() => import('../../components/game/ui/ChineseSproutLandsShop'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 rounded">Loading Shop...</div>
});

interface GameStats {
  totalPlayTime: number;
  cropsHarvested: number;
  goldEarned: number;
  toolsUsed: number;
}

const SproutLandsPage: React.FC = () => {
  const [isClient, setIsClient] = useState(false);
  const [, setGameState] = useState<any>(null);
  const [isUIVisible, setIsUIVisible] = useState(false);
  const [isShopVisible, setIsShopVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState<LoadingProgress>({
    loaded: 0,
    total: 0,
    percentage: 0,
    currentResource: '',
    isComplete: false
  });
  const [currentTool, setCurrentTool] = useState<string>('hoe');
  const [gameStats, setGameStats] = useState<GameStats>({
    totalPlayTime: 0,
    cropsHarvested: 0,
    goldEarned: 0,
    toolsUsed: 0
  });
  const [isMobile, setIsMobile] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  
  const inventoryRef = useRef<SproutLandsInventory>(new SproutLandsInventory());
  const gameStartTimeRef = useRef<number>(Date.now());
  const resourceLoaderRef = useRef<ResourceLoader>(ResourceLoader.getInstance());
  const audioRef = useRef<GameAudioTriggers>(new GameAudioTriggers());

  // 移动端检测
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 资源加载
  useEffect(() => {
    const initializeGame = async () => {
      try {
        const resourceLoader = resourceLoaderRef.current;
        
        // 设置进度回调
        resourceLoader.setProgressCallback(setLoadingProgress);
        
        // 预加载游戏资源
        resourceLoader.preloadGameResources();
        
        // 开始加载
        await resourceLoader.loadResources();
        
        // 预加载音效
        await audioRef.current.audioManager?.preloadGameSounds();
        
        setIsLoading(false);
        setGameStarted(true);
      } catch (error) {
        console.error('Failed to initialize game:', error);
        setIsLoading(false);
      }
    };

    if (isClient) {
      initializeGame();
    }
  }, [isClient]);

  // Client-side initialization
  useEffect(() => {
    setIsClient(true);
    
    // Load saved game data if available
    const savedData = localStorage.getItem('sproutLandsGameData');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        if (data.inventory) {
          inventoryRef.current.load(data.inventory);
        }
        if (data.stats) {
          setGameStats(data.stats);
        }
      } catch (error) {
        console.warn('Failed to load saved game data:', error);
      }
    }

    // Auto-save every 30 seconds
    const saveInterval = setInterval(() => {
      saveGameData();
    }, 30000);

    return () => clearInterval(saveInterval);
  }, []);

  // Save game data
  const saveGameData = useCallback(() => {
    const saveData = {
      inventory: inventoryRef.current.save(),
      stats: gameStats,
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem('sproutLandsGameData', JSON.stringify(saveData));
    } catch (error) {
      console.warn('Failed to save game data:', error);
    }
  }, [gameStats]);

  // Handle game state changes
  const handleGameStateChange = useCallback((newState: any) => {
    setGameState(newState);
  }, []);

  // Handle tool selection
  const handleToolSelect = useCallback((toolType: string) => {
    setCurrentTool(toolType);
    // You could emit this to the game component if needed
  }, []);

  // Handle shop purchases
  const handleShopPurchase = useCallback((item: any, quantity: number) => {
    const totalCost = item.price * quantity;
    
    if (inventoryRef.current.getGold() < totalCost) {
      return false;
    }

    // Create inventory item based on shop item
    let inventoryItem;
    if (item.type === 'seed') {
      inventoryItem = {
        id: item.id,
        name: item.name,
        type: 'seed' as const,
        quantity,
        value: item.price,
        description: item.description,
        stackable: true,
        maxStack: 99
      };
    } else if (item.type === 'tool') {
      inventoryItem = {
        id: item.id,
        name: item.name,
        type: 'tool' as const,
        quantity: 1,
        value: item.price,
        description: item.description,
        stackable: false,
        maxStack: 1
      };
    } else if (item.type === 'upgrade') {
      // Handle upgrades differently
      if (item.id === 'upgrade_backpack') {
        return inventoryRef.current.expandInventory(12, totalCost);
      } else if (item.id === 'upgrade_energy_drink') {
        // This would need to be handled in the game state
        return inventoryRef.current.spendGold(totalCost);
      }
      return false;
    }

    if (inventoryItem && inventoryRef.current.addItem(inventoryItem)) {
      inventoryRef.current.spendGold(totalCost);
      setGameStats(prev => ({
        ...prev,
        goldEarned: prev.goldEarned - totalCost
      }));
      return true;
    }

    return false;
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'i':
          setIsUIVisible(prev => !prev);
          break;
        case 'p':
          setIsShopVisible(prev => !prev);
          break;
        case 'escape':
          setIsUIVisible(false);
          setIsShopVisible(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Update play time
  useEffect(() => {
    const updatePlayTime = () => {
      const currentTime = Date.now();
      const sessionTime = currentTime - gameStartTimeRef.current;
      setGameStats(prev => ({
        ...prev,
        totalPlayTime: prev.totalPlayTime + sessionTime
      }));
      gameStartTimeRef.current = currentTime;
    };

    const interval = setInterval(updatePlayTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const formatPlayTime = (milliseconds: number): string => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-100 to-green-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-green-800 text-lg">Loading Sprout Lands...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-100 to-green-200">
      {/* Header */}
      <header className="bg-white shadow-md border-b-4 border-green-500">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-green-800 mr-6">
                🌱 Sprout Lands
              </h1>
              <div className="hidden md:flex items-center space-x-4 text-sm">
                <div className="bg-yellow-100 border border-yellow-300 rounded-lg px-3 py-1">
                  <span className="text-yellow-800">💰 {inventoryRef.current.getGold()}g</span>
                </div>
                <div className="bg-blue-100 border border-blue-300 rounded-lg px-3 py-1">
                  <span className="text-blue-800">⏱️ {formatPlayTime(gameStats.totalPlayTime)}</span>
                </div>
                <div className="bg-green-100 border border-green-300 rounded-lg px-3 py-1">
                  <span className="text-green-800">🥕 {gameStats.cropsHarvested} harvested</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsUIVisible(true)}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                📦 Inventory (I)
              </button>
              <button
                onClick={() => setIsShopVisible(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                🏪 Shop (P)
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Game Canvas */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">Your Farm</h2>
                <div className="text-sm text-gray-600">
                  Current Tool: <span className="font-bold text-green-600">{currentTool}</span>
                </div>
              </div>
              
              <div className="flex justify-center">
                          <SproutLandsEngine
            width={800}
            height={600}
            onStateChange={handleGameStateChange}
          />
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="lg:w-80">
            <div className="space-y-4">
              {/* Quick Stats */}
              <div className="bg-white rounded-xl shadow-lg p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-3">Quick Stats</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gold:</span>
                    <span className="font-bold text-yellow-600">{inventoryRef.current.getGold()}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Crops Harvested:</span>
                    <span className="font-bold text-green-600">{gameStats.cropsHarvested}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tools Used:</span>
                    <span className="font-bold text-blue-600">{gameStats.toolsUsed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Play Time:</span>
                    <span className="font-bold text-purple-600">{formatPlayTime(gameStats.totalPlayTime)}</span>
                  </div>
                </div>
              </div>

              {/* Controls Guide */}
              <div className="bg-white rounded-xl shadow-lg p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-3">Controls</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Move:</span>
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">WASD / Arrows</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Use Tool:</span>
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">Space</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Select Tool:</span>
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">1-4</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Inventory:</span>
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">I</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shop:</span>
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">P</span>
                  </div>
                </div>
              </div>

              {/* Current Season/Weather */}
              <div className="bg-white rounded-xl shadow-lg p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-3">Farm Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Season:</span>
                    <span className="font-bold text-green-600">🌸 Spring</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Weather:</span>
                    <span className="font-bold text-blue-600">☀️ Sunny</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Day:</span>
                    <span className="font-bold text-purple-600">Day 1</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* UI Modals */}
      {isUIVisible && (
        <SproutLandsUI
          isVisible={isUIVisible}
          onClose={() => setIsUIVisible(false)}
          inventory={inventoryRef.current}
          onToolSelect={handleToolSelect}
          currentTool={currentTool}
        />
      )}

      {isShopVisible && (
        <SproutLandsShop
          isVisible={isShopVisible}
          onClose={() => setIsShopVisible(false)}
          playerGold={inventoryRef.current.getGold()}
          onPurchase={handleShopPurchase}
        />
      )}

      {/* Footer */}
      <footer className="bg-green-800 text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-lg mb-2">🌱 Welcome to Sprout Lands! 🌱</p>
          <p className="text-green-200">
            A peaceful farming game where you can grow crops, care for your land, and build your dream farm.
          </p>
          <div className="mt-4 text-sm text-green-300">
            <p>Press <kbd className="bg-green-700 px-2 py-1 rounded">I</kbd> for inventory • <kbd className="bg-green-700 px-2 py-1 rounded">P</kbd> for shop • <kbd className="bg-green-700 px-2 py-1 rounded">ESC</kbd> to close menus</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SproutLandsPage;