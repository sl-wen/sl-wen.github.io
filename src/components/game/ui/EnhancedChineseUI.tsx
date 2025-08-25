'use client';

import React, { useState, useCallback, useEffect } from 'react';

interface InventoryItem {
  id: string;
  name: string;
  type: 'crop' | 'seed' | 'tool' | 'material' | 'fertilizer';
  quantity: number;
  quality?: 'poor' | 'normal' | 'good' | 'excellent';
  value: number;
  description?: string;
  stackable: boolean;
  maxStack: number;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  durability?: number;
  maxDurability?: number;
}

interface GameStats {
  gold: number;
  level: number;
  experience: number;
  maxExperience: number;
  energy: number;
  maxEnergy: number;
  totalItemsCollected: number;
  cropsHarvested: number;
  totalPlayTime: number;
  currentSeason: 'spring' | 'summer' | 'fall' | 'winter';
  daysPassed: number;
}

interface EnhancedChineseUIProps {
  isVisible: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  gameStats: GameStats;
  onSellItem?: (itemId: string, quantity: number) => void;
  onUseItem?: (itemId: string) => void;
  onSortInventory?: () => void;
}

type UITab = 'inventory' | 'stats' | 'achievements' | 'settings';

const EnhancedChineseUI: React.FC<EnhancedChineseUIProps> = ({
  isVisible,
  onClose,
  inventory,
  gameStats,
  onSellItem,
  onUseItem,
  onSortInventory
}) => {
  const [activeTab, setActiveTab] = useState<UITab>('inventory');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sellQuantity, setSellQuantity] = useState<number>(1);

  // 过滤和排序库存
  const getFilteredAndSortedInventory = useCallback(() => {
    let filtered = inventory;
    
    // 类型过滤
    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.type === filterType);
    }
    
    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'value':
          return b.value - a.value;
        case 'quantity':
          return b.quantity - a.quantity;
        case 'rarity':
          const rarityOrder = { common: 0, rare: 1, epic: 2, legendary: 3 };
          return (rarityOrder[b.rarity || 'common'] || 0) - (rarityOrder[a.rarity || 'common'] || 0);
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [inventory, filterType, sortBy]);

  const getTypeDisplayName = (type: string): string => {
    const typeNames = {
      crop: '作物',
      seed: '种子',
      tool: '工具',
      material: '材料',
      fertilizer: '肥料',
      all: '全部'
    };
    return typeNames[type as keyof typeof typeNames] || type;
  };

  const getQualityDisplayName = (quality: string): string => {
    const qualityNames = {
      poor: '差',
      normal: '普通',
      good: '良好',
      excellent: '优秀'
    };
    return qualityNames[quality as keyof typeof qualityNames] || quality;
  };

  const getRarityDisplayName = (rarity: string): string => {
    const rarityNames = {
      common: '普通',
      rare: '稀有',
      epic: '史诗',
      legendary: '传说'
    };
    return rarityNames[rarity as keyof typeof rarityNames] || rarity;
  };

  const getSeasonDisplayName = (season: string): string => {
    const seasonNames = {
      spring: '春季',
      summer: '夏季',
      fall: '秋季',
      winter: '冬季'
    };
    return seasonNames[season as keyof typeof seasonNames] || season;
  };

  const getRarityColor = (rarity?: string): string => {
    const colors = {
      common: 'border-gray-300 bg-gray-50',
      rare: 'border-blue-300 bg-blue-50',
      epic: 'border-purple-300 bg-purple-50',
      legendary: 'border-yellow-300 bg-yellow-50'
    };
    return colors[rarity as keyof typeof colors] || colors.common;
  };

  const getQualityColor = (quality?: string): string => {
    const colors = {
      poor: 'bg-red-400',
      normal: 'bg-gray-400',
      good: 'bg-green-400',
      excellent: 'bg-yellow-400'
    };
    return colors[quality as keyof typeof colors] || colors.normal;
  };

  const getItemIcon = (item: InventoryItem): string => {
    // 根据物品类型和ID返回合适的emoji
    const iconMap: Record<string, string> = {
      // 作物
      carrot: '🥕',
      tomato: '🍅',
      wheat: '🌾',
      corn: '🌽',
      potato: '🥔',
      lettuce: '🥬',
      strawberry: '🍓',
      pumpkin: '🎃',
      
      // 种子
      carrot_seeds: '🥕',
      tomato_seeds: '🍅',
      wheat_seeds: '🌾',
      corn_seeds: '🌽',
      potato_seeds: '🥔',
      lettuce_seeds: '🥬',
      strawberry_seeds: '🍓',
      pumpkin_seeds: '🎃',
      
      // 工具
      hoe: '🪓',
      watering_can: '🚿',
      axe: '🪓',
      pickaxe: '⛏️',
      fishing_rod: '🎣',
      
      // 肥料
      basic_fertilizer: '🌱',
      quality_fertilizer: '✨',
      
      // 材料
      wood: '🪵',
      stone: '🪨',
      ore: '⚡'
    };
    
    return iconMap[item.id] || (item.type === 'tool' ? '🔨' : 
                                item.type === 'seed' ? '🌱' : 
                                item.type === 'crop' ? '🥕' : '📦');
  };

  const handleSellItem = useCallback(() => {
    if (selectedItem && onSellItem) {
      onSellItem(selectedItem.id, sellQuantity);
      setSelectedItem(null);
      setSellQuantity(1);
    }
  }, [selectedItem, sellQuantity, onSellItem]);

  const renderInventoryTab = () => {
    const filteredItems = getFilteredAndSortedInventory();
    
    return (
      <div className="p-4">
        {/* 过滤和排序控件 */}
        <div className="flex flex-wrap gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">类型:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部</option>
              <option value="crop">作物</option>
              <option value="seed">种子</option>
              <option value="tool">工具</option>
              <option value="material">材料</option>
              <option value="fertilizer">肥料</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">排序:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">名称</option>
              <option value="value">价值</option>
              <option value="quantity">数量</option>
              <option value="rarity">稀有度</option>
            </select>
          </div>
          
          <button
            onClick={onSortInventory}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
          >
            🔄 整理背包
          </button>
        </div>

        {/* 物品网格 */}
        <div className="grid grid-cols-8 gap-3 mb-4">
          {filteredItems.map((item) => (
            <div
              key={`${item.id}-${item.quantity}`}
              className={`relative border-2 rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
                selectedItem?.id === item.id 
                  ? 'border-blue-400 bg-blue-50 shadow-md' 
                  : `${getRarityColor(item.rarity)} hover:border-gray-400`
              }`}
              onClick={() => setSelectedItem(item)}
            >
              {/* 物品图标 */}
              <div className="text-2xl text-center mb-2">{getItemIcon(item)}</div>
              
              {/* 数量 */}
              {item.quantity > 1 && (
                <span className="absolute top-1 right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {item.quantity > 99 ? '99+' : item.quantity}
                </span>
              )}
              
              {/* 品质指示器 */}
              {item.quality && (
                <div className={`absolute bottom-1 left-1 w-3 h-3 rounded-full ${getQualityColor(item.quality)}`} />
              )}
              
              {/* 稀有度边框 */}
              {item.rarity && item.rarity !== 'common' && (
                <div className={`absolute inset-0 rounded-lg pointer-events-none ${
                  item.rarity === 'legendary' ? 'shadow-yellow-400 shadow-lg' :
                  item.rarity === 'epic' ? 'shadow-purple-400 shadow-md' :
                  item.rarity === 'rare' ? 'shadow-blue-400 shadow-sm' : ''
                }`} />
              )}
              
              {/* 耐久度条 */}
              {item.durability !== undefined && item.maxDurability && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b">
                  <div 
                    className={`h-full rounded-b transition-all ${
                      item.durability > item.maxDurability * 0.5 ? 'bg-green-500' :
                      item.durability > item.maxDurability * 0.25 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${(item.durability / item.maxDurability) * 100}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 空背包提示 */}
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-bold text-gray-600 mb-2">背包空空如也</h3>
            <p className="text-gray-500">去农场收集一些物品吧！</p>
          </div>
        )}
      </div>
    );
  };

  const renderStatsTab = () => (
    <div className="p-4 space-y-4">
      {/* 基础信息 */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
        <h3 className="text-lg font-bold text-green-800 mb-3">🌱 农场信息</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{gameStats.level}</div>
            <div className="text-sm text-gray-600">等级</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{gameStats.gold.toLocaleString()}</div>
            <div className="text-sm text-gray-600">金币</div>
          </div>
        </div>
        
        {/* 经验条 */}
        <div className="mt-3">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>经验值</span>
            <span>{gameStats.experience}/{gameStats.maxExperience}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${(gameStats.experience / gameStats.maxExperience) * 100}%` }}
            />
          </div>
        </div>
        
        {/* 体力条 */}
        <div className="mt-3">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>体力值</span>
            <span>{gameStats.energy}/{gameStats.maxEnergy}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${(gameStats.energy / gameStats.maxEnergy) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* 游戏统计 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-bold text-gray-800 mb-3">📊 游戏统计</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-orange-600">{gameStats.cropsHarvested}</div>
            <div className="text-sm text-orange-700">收获作物</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-purple-600">{gameStats.totalItemsCollected}</div>
            <div className="text-sm text-purple-700">收集物品</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-blue-600">{gameStats.daysPassed}</div>
            <div className="text-sm text-blue-700">游戏天数</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-green-600">{getSeasonDisplayName(gameStats.currentSeason)}</div>
            <div className="text-sm text-green-700">当前季节</div>
          </div>
        </div>
      </div>

      {/* 游戏时间 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
        <h3 className="text-lg font-bold text-gray-800 mb-2">⏰ 游戏时间</h3>
        <div className="text-2xl font-bold text-indigo-600">
          {Math.floor(gameStats.totalPlayTime / 3600)}h {Math.floor((gameStats.totalPlayTime % 3600) / 60)}m
        </div>
      </div>
    </div>
  );

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-5/6 max-w-4xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50 rounded-t-xl">
          <h2 className="text-xl font-bold text-green-800 flex items-center">
            🎒 萌芽之地 - 农场管理
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold transition-colors"
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {[
            { id: 'inventory', label: '🎒 背包', icon: '🎒' },
            { id: 'stats', label: '📊 统计', icon: '📊' },
            { id: 'achievements', label: '🏆 成就', icon: '🏆' },
            { id: 'settings', label: '⚙️ 设置', icon: '⚙️' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as UITab)}
              className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'text-green-700 border-b-2 border-green-500 bg-white'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label.split(' ').slice(1).join(' ')}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'inventory' && renderInventoryTab()}
          {activeTab === 'stats' && renderStatsTab()}
          {activeTab === 'achievements' && (
            <div className="p-4 text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-xl font-bold text-gray-600 mb-2">成就系统</h3>
              <p className="text-gray-500">即将推出，敬请期待！</p>
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="p-4 text-center">
              <div className="text-6xl mb-4">⚙️</div>
              <h3 className="text-xl font-bold text-gray-600 mb-2">游戏设置</h3>
              <p className="text-gray-500">设置功能正在开发中...</p>
            </div>
          )}
        </div>

        {/* Item Details Panel */}
        {selectedItem && (
          <div className="border-t border-gray-200 p-4 bg-gradient-to-r from-gray-50 to-blue-50">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="text-4xl">{getItemIcon(selectedItem)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-lg">{selectedItem.name}</h4>
                    {selectedItem.rarity && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedItem.rarity === 'legendary' ? 'bg-yellow-200 text-yellow-800' :
                        selectedItem.rarity === 'epic' ? 'bg-purple-200 text-purple-800' :
                        selectedItem.rarity === 'rare' ? 'bg-blue-200 text-blue-800' :
                        'bg-gray-200 text-gray-800'
                      }`}>
                        {getRarityDisplayName(selectedItem.rarity)}
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    {getTypeDisplayName(selectedItem.type)} • 数量: {selectedItem.quantity}
                    {selectedItem.quality && ` • 品质: ${getQualityDisplayName(selectedItem.quality)}`}
                  </div>
                  
                  {selectedItem.description && (
                    <p className="text-sm text-gray-700 mb-2">{selectedItem.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm">
                    <span><span className="font-medium">价值:</span> {selectedItem.value} 金币</span>
                    {selectedItem.durability !== undefined && selectedItem.maxDurability && (
                      <span><span className="font-medium">耐久:</span> {selectedItem.durability}/{selectedItem.maxDurability}</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {selectedItem.type !== 'tool' && onSellItem && (
                  <>
                    <input
                      type="number"
                      min="1"
                      max={selectedItem.quantity}
                      value={sellQuantity}
                      onChange={(e) => setSellQuantity(Math.max(1, Math.min(selectedItem.quantity, parseInt(e.target.value) || 1)))}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                    />
                    <button
                      onClick={handleSellItem}
                      className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm font-medium transition-colors"
                    >
                      💰 出售
                    </button>
                  </>
                )}
                
                {selectedItem.type === 'tool' && onUseItem && (
                  <button
                    onClick={() => onUseItem && onUseItem(selectedItem.id)}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm font-medium transition-colors"
                  >
                    🔧 装备
                  </button>
                )}
                
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm font-medium transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedChineseUI;