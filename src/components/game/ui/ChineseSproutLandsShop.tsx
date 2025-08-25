'use client';

import React, { useState, useCallback } from 'react';

interface ShopItem {
  id: string;
  name: string;
  type: 'seed' | 'tool' | 'upgrade' | 'fertilizer';
  price: number;
  description: string;
  icon: string;
  inStock: number;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface ChineseSproutLandsShopProps {
  isVisible: boolean;
  onClose: () => void;
  playerGold: number;
  onPurchase: (item: ShopItem, quantity: number) => boolean;
  playerLevel?: number;
  season?: 'spring' | 'summer' | 'fall' | 'winter';
}

const CHINESE_SHOP_ITEMS: ShopItem[] = [
  // 春季种子
  {
    id: 'carrot_seeds',
    name: '胡萝卜种子',
    type: 'seed',
    price: 20,
    description: '营养丰富的根茎类蔬菜，生长迅速，适合新手种植。春秋两季均可种植。',
    icon: '🥕',
    inStock: 50,
    category: '春季种子',
    rarity: 'common'
  },
  {
    id: 'lettuce_seeds',
    name: '生菜种子',
    type: 'seed',
    price: 15,
    description: '清脆爽口的叶菜类，生长周期短，是农场新手的理想选择。',
    icon: '🥬',
    inStock: 75,
    category: '春季种子',
    rarity: 'common'
  },
  {
    id: 'strawberry_seeds',
    name: '草莓种子',
    type: 'seed',
    price: 100,
    description: '香甜的浆果类作物，价值很高，需要精心照料才能获得最佳品质。',
    icon: '🍓',
    inStock: 20,
    category: '春季种子',
    rarity: 'rare'
  },

  // 夏季种子
  {
    id: 'tomato_seeds',
    name: '番茄种子',
    type: 'seed',
    price: 50,
    description: '多汁的夏季经典作物，需要充足的阳光和水分，收获丰厚。',
    icon: '🍅',
    inStock: 30,
    category: '夏季种子',
    rarity: 'common'
  },
  {
    id: 'corn_seeds',
    name: '玉米种子',
    type: 'seed',
    price: 80,
    description: '高大的谷物作物，生长周期较长但产量很高，是夏季的主力作物。',
    icon: '🌽',
    inStock: 25,
    category: '夏季种子',
    rarity: 'common'
  },
  {
    id: 'watermelon_seeds',
    name: '西瓜种子',
    type: 'seed',
    price: 120,
    description: '夏日消暑佳品，需要大量空间和水分，但价值极高。',
    icon: '🍉',
    inStock: 15,
    category: '夏季种子',
    rarity: 'rare'
  },

  // 秋季种子
  {
    id: 'potato_seeds',
    name: '土豆种子',
    type: 'seed',
    price: 25,
    description: '耐寒的块茎作物，适合秋季种植，是冬季储备的重要食物。',
    icon: '🥔',
    inStock: 40,
    category: '秋季种子',
    rarity: 'common'
  },
  {
    id: 'pumpkin_seeds',
    name: '南瓜种子',
    type: 'seed',
    price: 100,
    description: '巨大的秋季作物，生长缓慢但体积庞大，是节日装饰的完美选择。',
    icon: '🎃',
    inStock: 15,
    category: '秋季种子',
    rarity: 'rare'
  },

  // 全季种子
  {
    id: 'wheat_seeds',
    name: '小麦种子',
    type: 'seed',
    price: 10,
    description: '基础的谷物作物，一年四季都能种植，是面包制作的主要原料。',
    icon: '🌾',
    inStock: 100,
    category: '全季种子',
    rarity: 'common'
  },

  // 基础工具
  {
    id: 'copper_hoe',
    name: '铜制锄头',
    type: 'tool',
    price: 150,
    description: '比基础锄头更耐用的升级版工具，能够更高效地翻耕土地。',
    icon: '🪓',
    inStock: 10,
    category: '基础工具',
    rarity: 'common'
  },
  {
    id: 'steel_watering_can',
    name: '钢制洒水壶',
    type: 'tool',
    price: 200,
    description: '容量更大的洒水壶，一次能为更多作物浇水，大大提高效率。',
    icon: '🚿',
    inStock: 8,
    category: '基础工具',
    rarity: 'common'
  },

  // 高级工具
  {
    id: 'golden_hoe',
    name: '黄金锄头',
    type: 'tool',
    price: 500,
    description: '传说中的农具，永不损坏，能够瞬间翻耕大片土地。',
    icon: '⚡',
    inStock: 1,
    category: '高级工具',
    rarity: 'legendary'
  },
  {
    id: 'sprinkler',
    name: '自动洒水器',
    type: 'tool',
    price: 800,
    description: '高科技农具，能够自动为周围9格内的作物浇水。',
    icon: '💧',
    inStock: 3,
    category: '高级工具',
    rarity: 'epic'
  },

  // 肥料和增强道具
  {
    id: 'basic_fertilizer',
    name: '基础肥料',
    type: 'fertilizer',
    price: 30,
    description: '提高作物生长速度25%，让你的农作物更快成熟。',
    icon: '🌱',
    inStock: 50,
    category: '肥料',
    rarity: 'common'
  },
  {
    id: 'quality_fertilizer',
    name: '品质肥料',
    type: 'fertilizer',
    price: 75,
    description: '提高作物品质等级，让普通作物有机会成长为优质作物。',
    icon: '✨',
    inStock: 20,
    category: '肥料',
    rarity: 'rare'
  },

  // 升级道具
  {
    id: 'inventory_expansion',
    name: '背包扩容包',
    type: 'upgrade',
    price: 500,
    description: '永久增加12个背包格子，让你能携带更多物品。',
    icon: '🎒',
    inStock: 5,
    category: '升级道具',
    rarity: 'rare'
  },
  {
    id: 'energy_crystal',
    name: '体力水晶',
    type: 'upgrade',
    price: 750,
    description: '永久增加最大体力值50点，让你能工作更长时间。',
    icon: '💎',
    inStock: 3,
    category: '升级道具',
    rarity: 'epic'
  }
];

const ChineseSproutLandsShop: React.FC<ChineseSproutLandsShopProps> = ({
  isVisible,
  onClose,
  playerGold,
  onPurchase,
  playerLevel = 1,
  season = 'spring'
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('春季种子');
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 根据季节和等级过滤商品
  const getAvailableItems = useCallback(() => {
    return CHINESE_SHOP_ITEMS.filter(item => {
      // 等级限制
      if (item.rarity === 'epic' && playerLevel < 5) return false;
      if (item.rarity === 'legendary' && playerLevel < 10) return false;
      
      // 季节限制
      if (item.category.includes('季种子') && !item.category.includes(getSeasonName(season))) {
        return false;
      }
      
      // 搜索过滤
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }, [playerLevel, season, searchQuery]);

  const getSeasonName = (season: string) => {
    const seasonMap = {
      spring: '春',
      summer: '夏',
      fall: '秋',
      winter: '冬'
    };
    return seasonMap[season as keyof typeof seasonMap] || '春';
  };

  const categories = [
    `${getSeasonName(season)}季种子`,
    '全季种子',
    '基础工具',
    '高级工具',
    '肥料',
    '升级道具'
  ];

  const filteredItems = getAvailableItems().filter(item => 
    selectedCategory === '全部' || item.category === selectedCategory
  );

  const getRarityColor = (rarity: string) => {
    const colors = {
      common: 'border-gray-300 bg-gray-50',
      rare: 'border-blue-300 bg-blue-50',
      epic: 'border-purple-300 bg-purple-50',
      legendary: 'border-yellow-300 bg-yellow-50'
    };
    return colors[rarity as keyof typeof colors] || colors.common;
  };

  const getRarityText = (rarity: string) => {
    const texts = {
      common: '普通',
      rare: '稀有',
      epic: '史诗',
      legendary: '传说'
    };
    return texts[rarity as keyof typeof texts] || '普通';
  };

  const handlePurchase = useCallback((item: ShopItem, quantity: number) => {
    const totalCost = item.price * quantity;
    if (playerGold >= totalCost && onPurchase(item, quantity)) {
      console.log(`成功购买 ${quantity}x ${item.name}，花费 ${totalCost} 金币`);
      setSelectedItem(null);
      setPurchaseQuantity(1);
    }
  }, [playerGold, onPurchase]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-11/12 max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50 rounded-t-xl">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-green-800 flex items-center">
              🏪 萌芽之地商店
            </h2>
            <div className="text-sm text-gray-600">
              {getSeasonName(season)}季 • 等级 {playerLevel}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-yellow-100 px-4 py-2 rounded-full shadow-sm">
              <span className="text-yellow-600 font-bold text-lg">💰 {playerGold.toLocaleString()} 金币</span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="搜索商品..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="全部">全部分类</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Category Sidebar */}
          <div className="w-48 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
            <h3 className="font-bold text-gray-800 mb-3 text-center">商品分类</h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory('全部')}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                  selectedCategory === '全部'
                    ? 'bg-blue-100 text-blue-800 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                📦 全部商品
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                    selectedCategory === category
                      ? 'bg-blue-100 text-blue-800 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {category.includes('种子') ? '🌱' : 
                   category.includes('工具') ? '🔨' : 
                   category.includes('肥料') ? '🌿' : 
                   category.includes('升级') ? '⬆️' : '📋'} {category}
                </button>
              ))}
            </div>
          </div>

          {/* Items Grid */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg ${
                    selectedItem?.id === item.id
                      ? 'border-blue-400 bg-blue-50 shadow-md'
                      : `${getRarityColor(item.rarity)} hover:border-gray-400`
                  } ${playerGold < item.price ? 'opacity-60' : ''}`}
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="text-center mb-3">
                    <div className="text-4xl mb-2">{item.icon}</div>
                    <h4 className="font-bold text-gray-800 mb-1">{item.name}</h4>
                    <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${
                      item.rarity === 'legendary' ? 'bg-yellow-200 text-yellow-800' :
                      item.rarity === 'epic' ? 'bg-purple-200 text-purple-800' :
                      item.rarity === 'rare' ? 'bg-blue-200 text-blue-800' :
                      'bg-gray-200 text-gray-800'
                    }`}>
                      {getRarityText(item.rarity)}
                    </div>
                    <p className="text-xs text-gray-600 mb-3 h-12 overflow-hidden">
                      {item.description}
                    </p>
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-green-600 text-lg">{item.price.toLocaleString()} 金币</span>
                      <span className="text-xs text-gray-500">库存: {item.inStock}</span>
                    </div>
                    
                    {playerGold >= item.price && item.inStock > 0 ? (
                      <div className="text-center">
                        <span className="text-xs text-green-600 font-medium">✅ 可购买</span>
                      </div>
                    ) : (
                      <div className="text-center">
                        <span className="text-xs text-red-500 font-medium">
                          {playerGold < item.price ? '💰 金币不足' : '📦 暂时缺货'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-gray-600 mb-2">没有找到商品</h3>
                <p className="text-gray-500">试试搜索其他关键词或选择不同的分类</p>
              </div>
            )}
          </div>
        </div>

        {/* Purchase Panel */}
        {selectedItem && (
          <div className="border-t border-gray-200 p-4 bg-gradient-to-r from-gray-50 to-blue-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-5xl">{selectedItem.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-xl">{selectedItem.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedItem.rarity === 'legendary' ? 'bg-yellow-200 text-yellow-800' :
                      selectedItem.rarity === 'epic' ? 'bg-purple-200 text-purple-800' :
                      selectedItem.rarity === 'rare' ? 'bg-blue-200 text-blue-800' :
                      'bg-gray-200 text-gray-800'
                    }`}>
                      {getRarityText(selectedItem.rarity)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{selectedItem.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span><span className="font-medium">单价:</span> {selectedItem.price.toLocaleString()} 金币</span>
                    <span><span className="font-medium">库存:</span> {selectedItem.inStock} 个</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {(selectedItem.type === 'seed' || selectedItem.type === 'fertilizer') && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">数量:</label>
                    <input
                      type="number"
                      min="1"
                      max={Math.min(selectedItem.inStock, Math.floor(playerGold / selectedItem.price))}
                      value={purchaseQuantity}
                      onChange={(e) => setPurchaseQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
                
                <div className="text-right">
                  <div className="text-sm text-gray-600">总价</div>
                  <div className="font-bold text-xl text-green-600">
                    {(selectedItem.price * purchaseQuantity).toLocaleString()} 金币
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePurchase(selectedItem, purchaseQuantity)}
                    disabled={playerGold < selectedItem.price * purchaseQuantity || selectedItem.inStock === 0}
                    className={`px-6 py-2 rounded-lg font-medium transition-all ${
                      playerGold >= selectedItem.price * purchaseQuantity && selectedItem.inStock > 0
                        ? 'bg-green-500 text-white hover:bg-green-600 shadow-md hover:shadow-lg'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    💰 购买
                  </button>
                  
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChineseSproutLandsShop;