'use client';

import React, { useState, useEffect } from 'react';
import { SoundManager } from '../systems/SoundManager';
import { MapManager } from '../systems/MapManager';
import { CraftingSystem } from '../systems/CraftingSystem';
import { ShopSystem } from '../systems/ShopSystem';

interface EnhancedGameUIProps {
  playerStats: {
    health: number;
    maxHealth: number;
    level: number;
    experience: number;
    gold: number;
  };
  inventory: any[];
  quests: any[];
  currentMap: string;
  onInventoryChange?: (inventory: any[]) => void;
  onStatsChange?: (stats: any) => void;
}

export const EnhancedGameUI: React.FC<EnhancedGameUIProps> = ({
  playerStats,
  inventory,
  quests,
  currentMap,
  onInventoryChange,
  onStatsChange
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'inventory' | 'quests' | 'crafting' | 'shop' | 'map' | 'settings'>('status');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [craftingProgress, setCraftingProgress] = useState<any[]>([]);
  const [soundSettings, setSoundSettings] = useState({
    isMuted: false,
    musicVolume: 0.5,
    sfxVolume: 0.7
  });

  // 系统实例
  const soundManager = SoundManager.getInstance();
  const mapManager = MapManager.getInstance();
  const craftingSystem = CraftingSystem.getInstance();
  const shopSystem = ShopSystem.getInstance();

  useEffect(() => {
    // 加载音效设置
    // const settings = soundManager.getSettings();
    // setSoundSettings(settings);

    // 设置制作完成回调
    craftingSystem.onCraftingComplete((recipeId, success) => {
      console.log(`Crafting ${success ? 'completed' : 'failed'}: ${recipeId}`);
      // 这里可以添加成功/失败的UI反馈
    });

    // 设置商店交易回调
    shopSystem.onTransaction((transaction) => {
      console.log('Shop transaction:', transaction);
      // 这里可以添加交易成功的UI反馈
    });

    // 更新制作进度
    const updateCraftingProgress = () => {
      const activeCrafting = craftingSystem.getActiveCrafting();
      const progress = activeCrafting.map(crafting => {
        const progressData = craftingSystem.getCraftingProgress(crafting.recipeId);
        return {
          ...crafting,
          ...progressData
        };
      });
      setCraftingProgress(progress);
    };

    updateCraftingProgress();
    const interval = setInterval(updateCraftingProgress, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    // soundManager.playButtonClick();
  };

  const handleItemUse = (item: any) => {
    if (!item) return;

    // 这里可以添加物品使用逻辑
    console.log('Using item:', item);
    // soundManager.playPickupSound();
  };

  const handleCraftingStart = (recipeId: string) => {
    const success = craftingSystem.startCrafting(recipeId, inventory, playerStats.level);
    if (success) {
      // soundManager.playButtonClick();
      // 更新背包
      if (onInventoryChange) {
        onInventoryChange([...inventory]);
      }
    }
  };

  const handleShopBuy = (shopId: string, itemId: string, quantity: number) => {
    const result = shopSystem.buyItem(shopId, itemId, quantity, playerStats.gold, playerStats.level);
    if (result.success) {
      // soundManager.playButtonClick();
      // 更新玩家金币
      if (onStatsChange) {
        onStatsChange({
          ...playerStats,
          gold: playerStats.gold - result.cost
        });
      }
    }
  };

  const handleShopSell = (shopId: string, itemId: string, quantity: number) => {
    const result = shopSystem.sellItem(shopId, itemId, quantity, inventory);
    if (result.success) {
      // soundManager.playButtonClick();
      // 更新玩家金币和背包
      if (onStatsChange) {
        onStatsChange({
          ...playerStats,
          gold: playerStats.gold + result.earnings
        });
      }
      if (onInventoryChange) {
        const newInventory = inventory.map(item => {
          if (item.id === itemId) {
            return { ...item, quantity: item.quantity - quantity };
          }
          return item;
        }).filter(item => item.quantity > 0);
        onInventoryChange(newInventory);
      }
    }
  };

  const handleSoundSettingChange = (setting: string, value: any) => {
    const newSettings = { ...soundSettings, [setting]: value };
    setSoundSettings(newSettings);

    switch (setting) {
      case 'isMuted':
        soundManager.setMuted(value);
        break;
      case 'musicVolume':
        soundManager.setMusicVolume(value);
        break;
      case 'sfxVolume':
        soundManager.setSFXVolume(value);
        break;
    }
  };

  const renderStatusTab = () => (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-3">角色状态</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-300">等级: {playerStats.level}</p>
            <p className="text-gray-300">经验: {playerStats.experience}</p>
            <p className="text-gray-300">金币: {playerStats.gold}</p>
          </div>
          <div>
            <p className="text-gray-300">生命值: {playerStats.health}/{playerStats.maxHealth}</p>
            <p className="text-gray-300">当前地图: {mapManager.getCurrentMapName()}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-3">制作进度</h3>
        {craftingProgress.length > 0 ? (
          <div className="space-y-2">
            {craftingProgress.map((crafting, index) => (
              <div key={index} className="bg-gray-700 rounded p-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">
                    {craftingSystem.getRecipe(crafting.recipeId)?.name}
                  </span>
                  <span className="text-gray-400">
                    {Math.round(crafting.progress * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2 mt-1">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${crafting.progress * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">没有正在制作的物品</p>
        )}
      </div>
    </div>
  );

  const renderInventoryTab = () => (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-3">背包 ({inventory.length}/20)</h3>
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 20 }, (_, index) => {
            const item = inventory[index];
            return (
              <div
                key={index}
                className={`w-12 h-12 border-2 rounded cursor-pointer flex items-center justify-center ${
                  item ? 'border-blue-500 bg-gray-700' : 'border-gray-600 bg-gray-800'
                } ${selectedItem === item ? 'ring-2 ring-blue-400' : ''}`}
                onClick={() => setSelectedItem(item)}
              >
                {item && (
                  <div className="text-center">
                    <div className="text-xs text-white">{item.icon || '📦'}</div>
                    <div className="text-xs text-gray-300">{item.quantity}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedItem && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3">物品详情</h3>
          <div className="space-y-2">
            <p className="text-gray-300">名称: {selectedItem.name}</p>
            <p className="text-gray-300">数量: {selectedItem.quantity}</p>
            <p className="text-gray-300">类型: {selectedItem.type}</p>
            {selectedItem.description && (
              <p className="text-gray-400 text-sm">{selectedItem.description}</p>
            )}
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
              onClick={() => handleItemUse(selectedItem)}
            >
              使用
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderCraftingTab = () => {
    const availableRecipes = craftingSystem.getRecipesByLevel(playerStats.level);
    const recommendedRecipes = craftingSystem.getRecommendedRecipes(inventory, playerStats.level);

    return (
      <div className="space-y-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3">推荐配方</h3>
          <div className="space-y-2">
            {recommendedRecipes.slice(0, 3).map((recipe) => (
              <div key={recipe.id} className="bg-gray-700 rounded p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-white font-medium">{recipe.name}</h4>
                    <p className="text-gray-400 text-sm">{recipe.description}</p>
                    <p className="text-gray-400 text-sm">
                      难度: {craftingSystem.getDifficultyDescription(recipe.difficulty)} | 
                      时间: {craftingSystem.getCraftingTimeDescription(recipe.craftingTime)}
                    </p>
                  </div>
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                    onClick={() => handleCraftingStart(recipe.id)}
                  >
                    制作
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3">所有配方</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {availableRecipes.map((recipe) => {
              const canCraft = craftingSystem.canCraft(recipe.id, inventory, playerStats.level);
              return (
                <div key={recipe.id} className="bg-gray-700 rounded p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-white font-medium">{recipe.name}</h4>
                      <p className="text-gray-400 text-sm">{recipe.description}</p>
                      <p className="text-gray-400 text-sm">
                        难度: {craftingSystem.getDifficultyDescription(recipe.difficulty)} | 
                        时间: {craftingSystem.getCraftingTimeDescription(recipe.craftingTime)}
                      </p>
                      {!canCraft.canCraft && (
                        <p className="text-red-400 text-sm">
                          缺少: {canCraft.missingItems.join(', ')}
                        </p>
                      )}
                    </div>
                    <button
                      className={`px-3 py-1 rounded text-sm ${
                        canCraft.canCraft
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                      onClick={() => canCraft.canCraft && handleCraftingStart(recipe.id)}
                      disabled={!canCraft.canCraft}
                    >
                      制作
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderShopTab = () => {
    const shops = shopSystem.getAllShops();
    const currentShop = selectedShop || shops[0];

    return (
      <div className="space-y-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3">商店</h3>
          <div className="flex space-x-2 mb-4">
            {shops.map((shop) => (
              <button
                key={shop.id}
                className={`px-3 py-1 rounded text-sm ${
                  selectedShop?.id === shop.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
                onClick={() => setSelectedShop(shop)}
              >
                {shop.name}
              </button>
            ))}
          </div>

          {currentShop && (
            <div className="space-y-4">
              <div className="bg-gray-700 rounded p-3">
                <h4 className="text-white font-medium">{currentShop.name}</h4>
                <p className="text-gray-400 text-sm">{currentShop.description}</p>
                <p className="text-gray-400 text-sm">
                  声望: {shopSystem.getReputationLevel(shopSystem.getPlayerReputation(currentShop.id))}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-white font-medium">商品</h4>
                {currentShop.items.map((item) => (
                  <div key={item.id} className="bg-gray-700 rounded p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <h5 className="text-white">{item.itemId}</h5>
                        <p className="text-gray-400 text-sm">价格: {item.price} 金币</p>
                        {item.quantity !== -1 && (
                          <p className="text-gray-400 text-sm">库存: {item.quantity}</p>
                        )}
                      </div>
                      <button
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                        onClick={() => handleShopBuy(currentShop.id, item.itemId, 1)}
                      >
                        购买
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSettingsTab = () => (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-3">音效设置</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">静音</span>
            <input
              type="checkbox"
              checked={soundSettings.isMuted}
              onChange={(e) => handleSoundSettingChange('isMuted', e.target.checked)}
              className="w-4 h-4"
            />
          </div>
          
          <div>
            <label className="text-gray-300 text-sm">音乐音量</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={soundSettings.musicVolume}
              onChange={(e) => handleSoundSettingChange('musicVolume', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="text-gray-300 text-sm">音效音量</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={soundSettings.sfxVolume}
              onChange={(e) => handleSoundSettingChange('sfxVolume', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-3">游戏信息</h3>
        <div className="space-y-2 text-sm">
          <p className="text-gray-300">当前地图: {mapManager.getCurrentMapName()}</p>
          <p className="text-gray-300">地图类型: {mapManager.getCurrentMapLighting()}</p>
          <p className="text-gray-300">游戏版本: 2.0.0</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-900 text-white p-4 rounded-lg">
      {/* 标签页导航 */}
      <div className="flex space-x-1 mb-4 border-b border-gray-700">
        {[
          { key: 'status', label: '状态', icon: '📊' },
          { key: 'inventory', label: '背包', icon: '🎒' },
          { key: 'quests', label: '任务', icon: '📋' },
          { key: 'crafting', label: '制作', icon: '⚒️' },
          { key: 'shop', label: '商店', icon: '🏪' },
          { key: 'map', label: '地图', icon: '🗺️' },
          { key: 'settings', label: '设置', icon: '⚙️' }
        ].map((tab) => (
          <button
            key={tab.key}
            className={`px-3 py-2 rounded-t-lg text-sm flex items-center space-x-1 ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            onClick={() => handleTabChange(tab.key as typeof activeTab)}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 标签页内容 */}
      <div className="min-h-96">
        {activeTab === 'status' && renderStatusTab()}
        {activeTab === 'inventory' && renderInventoryTab()}
        {activeTab === 'quests' && (
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-3">任务日志</h3>
            <p className="text-gray-400">任务系统已集成，详情请查看任务标签页</p>
          </div>
        )}
        {activeTab === 'crafting' && renderCraftingTab()}
        {activeTab === 'shop' && renderShopTab()}
        {activeTab === 'map' && (
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-3">地图信息</h3>
            <p className="text-gray-400">地图系统已集成，支持多地图切换和传送点</p>
          </div>
        )}
        {activeTab === 'settings' && renderSettingsTab()}
      </div>
    </div>
  );
};