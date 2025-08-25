'use client';

import React, { useState, useCallback } from 'react';
import { InventoryItem, ToolItem, SeedItem, CropItem } from '../entities/SproutLandsInventory';

interface SproutLandsUIProps {
  isVisible: boolean;
  onClose: () => void;
  inventory: {
    getAllItems: () => InventoryItem[];
    getGold: () => number;
    getInventoryStats: () => any;
    sellItem: (id: string, quantity: number) => number;
    getTools: () => ToolItem[];
    getSeeds: () => SeedItem[];
    getCrops: () => CropItem[];
  };
  onToolSelect?: (toolType: string) => void;
  currentTool?: string;
}

type UITab = 'inventory' | 'tools' | 'seeds' | 'crops' | 'stats';

export const SproutLandsUI: React.FC<SproutLandsUIProps> = ({
  isVisible,
  onClose,
  inventory,
  onToolSelect,
  currentTool
}) => {
  const [activeTab, setActiveTab] = useState<UITab>('inventory');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const stats = inventory.getInventoryStats();

  const handleSellItem = useCallback((item: InventoryItem) => {
    const sellValue = inventory.sellItem(item.id, 1);
    if (sellValue > 0) {
      // Could add a notification system here
      console.log(`出售 ${item.name} 获得 ${sellValue} 金币`);
    }
  }, [inventory]);

  const handleToolSelect = useCallback((toolType: string) => {
    if (onToolSelect) {
      onToolSelect(toolType);
    }
  }, [onToolSelect]);

  if (!isVisible) return null;

  const renderInventoryGrid = (items: InventoryItem[]) => (
    <div className="grid grid-cols-6 gap-2 p-4">
      {items.map((item) => (
        <div
          key={item.id}
          className={`
            relative border-2 rounded-lg p-2 cursor-pointer transition-all
            ${selectedItem?.id === item.id 
              ? 'border-yellow-400 bg-yellow-50' 
              : 'border-gray-300 hover:border-gray-400 bg-white'
            }
            ${item.type === 'tool' && (item as ToolItem).durability <= 10 
              ? 'border-red-300' 
              : ''
            }
          `}
          onClick={() => setSelectedItem(item)}
        >
          {/* Item Icon Placeholder */}
          <div className={`
            w-8 h-8 rounded mb-1 flex items-center justify-center text-xs font-bold
            ${getItemColorClass(item.type)}
          `}>
            {getItemIcon(item.type)}
          </div>
          
          {/* Item Quantity */}
          {item.quantity > 1 && (
            <span className="absolute top-1 right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {item.quantity}
            </span>
          )}
          
          {/* Quality Indicator */}
          {item.quality && (
            <div className={`absolute bottom-1 left-1 w-2 h-2 rounded-full ${getQualityColorClass(item.quality)}`} />
          )}
          
          {/* Durability Bar for Tools */}
          {item.type === 'tool' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b">
              <div 
                className="h-full bg-green-500 rounded-b transition-all"
                style={{ 
                  width: `${((item as ToolItem).durability / (item as ToolItem).maxDurability) * 100}%` 
                }}
              />
            </div>
          )}
        </div>
      ))}
      
      {/* Empty slots */}
      {Array.from({ length: Math.max(0, stats.maxSlots - stats.usedSlots) }, (_, i) => (
        <div key={`empty-${i}`} className="border-2 border-dashed border-gray-200 rounded-lg p-2 h-16" />
      ))}
    </div>
  );

  const renderToolsTab = () => {
    const tools = inventory.getTools();
    
    return (
      <div className="p-4">
        <h3 className="text-lg font-bold mb-4 text-green-800">工具</h3>
        <div className="grid grid-cols-2 gap-4">
          {tools.map((tool) => (
            <div
              key={tool.id}
              className={`
                border-2 rounded-lg p-4 cursor-pointer transition-all
                ${currentTool === tool.toolType 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-300 hover:border-gray-400 bg-white'
                }
              `}
              onClick={() => handleToolSelect(tool.toolType)}
            >
              <div className="flex items-center mb-2">
                <div className={`w-10 h-10 rounded-lg mr-3 flex items-center justify-center ${getItemColorClass('tool')}`}>
                  {getToolIcon(tool.toolType)}
                </div>
                <div>
                  <h4 className="font-semibold">{tool.name}</h4>
                  <p className="text-sm text-gray-600">
                    耐久度: {tool.durability}/{tool.maxDurability}
                  </p>
                </div>
              </div>
              
              {/* Durability Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    tool.durability > tool.maxDurability * 0.5 ? 'bg-green-500' :
                    tool.durability > tool.maxDurability * 0.25 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${(tool.durability / tool.maxDurability) * 100}%` }}
                />
              </div>
              
              {tool.description && (
                <p className="text-xs text-gray-500 mt-2">{tool.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderStatsTab = () => (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-4 text-green-800">统计信息</h3>
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-yellow-800">金币</span>
            <span className="text-xl font-bold text-yellow-600">{stats.gold}g</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm text-blue-600">物品总数</div>
            <div className="text-lg font-bold text-blue-800">{stats.totalItems}</div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-sm text-green-600">背包格子</div>
            <div className="text-lg font-bold text-green-800">{stats.usedSlots}/{stats.maxSlots}</div>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="text-sm text-purple-600">总价值</div>
            <div className="text-lg font-bold text-purple-800">{stats.totalValue}g</div>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="text-sm text-orange-600">已用格子</div>
            <div className="text-lg font-bold text-orange-800">
              {Math.round((stats.usedSlots / stats.maxSlots) * 100)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-4/5 max-w-4xl h-4/5 max-h-96 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-green-50 rounded-t-xl">
          <h2 className="text-xl font-bold text-green-800 flex items-center">
            🌱 萌芽之地 背包
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {[
            { id: 'inventory', label: '📦 所有物品', icon: '📦' },
            { id: 'tools', label: '🔨 工具', icon: '🔨' },
            { id: 'seeds', label: '🌱 种子', icon: '🌱' },
            { id: 'crops', label: '🥕 作物', icon: '🥕' },
            { id: 'stats', label: '📊 统计', icon: '📊' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as UITab)}
              className={`
                px-4 py-2 font-medium transition-colors
                ${activeTab === tab.id
                  ? 'text-green-700 border-b-2 border-green-500 bg-white'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }
              `}
            >
              <span className="mr-1">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label.split(' ').slice(1).join(' ')}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'inventory' && renderInventoryGrid(inventory.getAllItems())}
          {activeTab === 'tools' && renderToolsTab()}
          {activeTab === 'seeds' && renderInventoryGrid(inventory.getSeeds())}
          {activeTab === 'crops' && renderInventoryGrid(inventory.getCrops())}
          {activeTab === 'stats' && renderStatsTab()}
        </div>

        {/* Item Details Panel */}
        {selectedItem && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-bold text-lg">{selectedItem.name}</h4>
                <p className="text-sm text-gray-600 mb-2">
                  {getTypeDisplayName(selectedItem.type)} • 数量: {selectedItem.quantity}
                </p>
                {selectedItem.description && (
                  <p className="text-sm text-gray-700 mb-2">{selectedItem.description}</p>
                )}
                {selectedItem.quality && (
                  <div className="flex items-center mb-2">
                    <span className="text-sm font-medium mr-2">品质:</span>
                    <span className={`text-sm font-bold ${getQualityTextClass(selectedItem.quality)}`}>
                      {getQualityDisplayName(selectedItem.quality)}
                    </span>
                  </div>
                )}
                <p className="text-sm">
                  <span className="font-medium">价值:</span> 每个 {selectedItem.value} 金币
                </p>
              </div>
              
              <div className="flex gap-2">
                {selectedItem.type !== 'tool' && (
                  <button
                    onClick={() => handleSellItem(selectedItem)}
                    className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
                  >
                    出售 (1)
                  </button>
                )}
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
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

// Helper functions
const getItemColorClass = (type: string): string => {
  switch (type) {
    case 'tool': return 'bg-orange-400 text-white';
    case 'seed': return 'bg-green-400 text-white';
    case 'crop': return 'bg-red-400 text-white';
    case 'food': return 'bg-purple-400 text-white';
    case 'material': return 'bg-gray-400 text-white';
    default: return 'bg-blue-400 text-white';
  }
};

const getItemIcon = (type: string): string => {
  switch (type) {
    case 'tool': return '🔨';
    case 'seed': return '🌱';
    case 'crop': return '🥕';
    case 'food': return '🍎';
    case 'material': return '📦';
    default: return '❓';
  }
};

const getToolIcon = (toolType: string): string => {
  switch (toolType) {
    case 'hoe': return '🪓';
    case 'wateringCan': return '🚿';
    case 'seeds': return '🌱';
    case 'axe': return '🪓';
    case 'pickaxe': return '⛏️';
    case 'fishingRod': return '🎣';
    default: return '🔨';
  }
};

const getQualityColorClass = (quality: string): string => {
  switch (quality) {
    case 'poor': return 'bg-gray-400';
    case 'normal': return 'bg-blue-400';
    case 'good': return 'bg-green-400';
    case 'excellent': return 'bg-yellow-400';
    default: return 'bg-gray-400';
  }
};

const getQualityTextClass = (quality: string): string => {
  switch (quality) {
    case 'poor': return 'text-gray-600';
    case 'normal': return 'text-blue-600';
    case 'good': return 'text-green-600';
    case 'excellent': return 'text-yellow-600';
    default: return 'text-gray-600';
  }
};

const getTypeDisplayName = (type: string): string => {
  switch (type) {
    case 'tool': return '工具';
    case 'seed': return '种子';
    case 'crop': return '作物';
    case 'food': return '食物';
    case 'material': return '材料';
    default: return '未知';
  }
};

const getQualityDisplayName = (quality: string): string => {
  switch (quality) {
    case 'poor': return '差';
    case 'normal': return '普通';
    case 'good': return '良好';
    case 'excellent': return '优秀';
    default: return '未知';
  }
};

export default SproutLandsUI;