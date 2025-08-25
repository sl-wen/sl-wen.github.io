'use client';

import React, { useState, useCallback } from 'react';
import { SeedItem, ToolItem } from '../entities/SproutLandsInventory';

interface ShopItem {
  id: string;
  name: string;
  type: 'seed' | 'tool' | 'upgrade';
  price: number;
  description: string;
  icon: string;
  inStock: number;
  category: string;
}

interface SproutLandsShopProps {
  isVisible: boolean;
  onClose: () => void;
  playerGold: number;
  onPurchase: (item: ShopItem, quantity: number) => boolean;
}

const SHOP_ITEMS: ShopItem[] = [
  // Seeds
  {
    id: 'seed_carrot',
    name: 'Carrot Seeds',
    type: 'seed',
    price: 20,
    description: 'Fast-growing root vegetable. Grows in spring and fall.',
    icon: '🥕',
    inStock: 50,
    category: 'seeds'
  },
  {
    id: 'seed_tomato',
    name: 'Tomato Seeds',
    type: 'seed',
    price: 50,
    description: 'Juicy summer crop. Takes time but worth the wait.',
    icon: '🍅',
    inStock: 30,
    category: 'seeds'
  },
  {
    id: 'seed_wheat',
    name: 'Wheat Seeds',
    type: 'seed',
    price: 10,
    description: 'Versatile grain crop. Grows in multiple seasons.',
    icon: '🌾',
    inStock: 100,
    category: 'seeds'
  },
  {
    id: 'seed_corn',
    name: 'Corn Seeds',
    type: 'seed',
    price: 80,
    description: 'Large summer crop with high yield.',
    icon: '🌽',
    inStock: 25,
    category: 'seeds'
  },
  {
    id: 'seed_strawberry',
    name: 'Strawberry Seeds',
    type: 'seed',
    price: 100,
    description: 'Premium berry crop. High value and delicious.',
    icon: '🍓',
    inStock: 20,
    category: 'seeds'
  },
  {
    id: 'seed_lettuce',
    name: 'Lettuce Seeds',
    type: 'seed',
    price: 15,
    description: 'Quick-growing leafy green. Perfect for beginners.',
    icon: '🥬',
    inStock: 75,
    category: 'seeds'
  },
  {
    id: 'seed_potato',
    name: 'Potato Seeds',
    type: 'seed',
    price: 25,
    description: 'Hearty tuber crop. Good for cool seasons.',
    icon: '🥔',
    inStock: 40,
    category: 'seeds'
  },
  {
    id: 'seed_pumpkin',
    name: 'Pumpkin Seeds',
    type: 'seed',
    price: 100,
    description: 'Giant fall crop. Takes the longest but highest value.',
    icon: '🎃',
    inStock: 15,
    category: 'seeds'
  },
  
  // Tools
  {
    id: 'tool_copper_hoe',
    name: 'Copper Hoe',
    type: 'tool',
    price: 200,
    description: 'Upgraded hoe with better durability.',
    icon: '🪓',
    inStock: 5,
    category: 'tools'
  },
  {
    id: 'tool_steel_watering_can',
    name: 'Steel Watering Can',
    type: 'tool',
    price: 300,
    description: 'Waters multiple tiles at once.',
    icon: '🚿',
    inStock: 3,
    category: 'tools'
  },
  {
    id: 'tool_axe',
    name: 'Axe',
    type: 'tool',
    price: 150,
    description: 'Clear trees and woody debris from your farm.',
    icon: '🪓',
    inStock: 10,
    category: 'tools'
  },
  {
    id: 'tool_pickaxe',
    name: 'Pickaxe',
    type: 'tool',
    price: 200,
    description: 'Break rocks and clear stone from your land.',
    icon: '⛏️',
    inStock: 8,
    category: 'tools'
  },
  
  // Upgrades
  {
    id: 'upgrade_backpack',
    name: 'Backpack Upgrade',
    type: 'upgrade',
    price: 500,
    description: 'Increase inventory capacity by 12 slots.',
    icon: '🎒',
    inStock: 1,
    category: 'upgrades'
  },
  {
    id: 'upgrade_energy_drink',
    name: 'Energy Drink',
    type: 'upgrade',
    price: 50,
    description: 'Instantly restore 50 energy points.',
    icon: '⚡',
    inStock: 20,
    category: 'upgrades'
  },
  {
    id: 'upgrade_fertilizer',
    name: 'Premium Fertilizer',
    type: 'upgrade',
    price: 75,
    description: 'Boost crop growth speed by 25% for 5 crops.',
    icon: '💊',
    inStock: 15,
    category: 'upgrades'
  }
];

export const SproutLandsShop: React.FC<SproutLandsShopProps> = ({
  isVisible,
  onClose,
  playerGold,
  onPurchase
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('seeds');
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);

  const categories = [
    { id: 'seeds', name: '🌱 Seeds', icon: '🌱' },
    { id: 'tools', name: '🔨 Tools', icon: '🔨' },
    { id: 'upgrades', name: '⬆️ Upgrades', icon: '⬆️' }
  ];

  const filteredItems = SHOP_ITEMS.filter(item => item.category === selectedCategory);

  const handlePurchase = useCallback(() => {
    if (selectedItem && onPurchase) {
      const success = onPurchase(selectedItem, purchaseQuantity);
      if (success) {
        setSelectedItem(null);
        setPurchaseQuantity(1);
      }
    }
  }, [selectedItem, purchaseQuantity, onPurchase]);

  const canAfford = (item: ShopItem, quantity: number): boolean => {
    return playerGold >= item.price * quantity;
  };

  const getTotalCost = (): number => {
    return selectedItem ? selectedItem.price * purchaseQuantity : 0;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-4/5 max-w-5xl h-4/5 max-h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-green-50 rounded-t-xl">
          <div className="flex items-center">
            <h2 className="text-xl font-bold text-green-800 mr-4">
              🏪 Sprout Lands General Store
            </h2>
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg px-3 py-1">
              <span className="text-yellow-800 font-bold">{playerGold}g</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Category Sidebar */}
          <div className="w-48 bg-gray-50 border-r border-gray-200">
            <div className="p-4">
              <h3 className="font-bold text-gray-700 mb-3">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`
                      w-full text-left px-3 py-2 rounded-lg transition-colors
                      ${selectedCategory === category.id
                        ? 'bg-green-100 text-green-800 border border-green-300'
                        : 'text-gray-600 hover:bg-gray-100'
                      }
                    `}
                  >
                    <span className="mr-2">{category.icon}</span>
                    {category.name.split(' ').slice(1).join(' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Items Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`
                    border-2 rounded-lg p-4 cursor-pointer transition-all
                    ${selectedItem?.id === item.id
                      ? 'border-green-500 bg-green-50'
                      : canAfford(item, 1)
                        ? 'border-gray-300 hover:border-gray-400 bg-white'
                        : 'border-red-200 bg-red-50 opacity-75'
                    }
                  `}
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{item.icon}</span>
                      <div>
                        <h4 className="font-bold text-lg">{item.name}</h4>
                        <p className="text-sm text-gray-600">In Stock: {item.inStock}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`
                        text-lg font-bold
                        ${canAfford(item, 1) ? 'text-green-600' : 'text-red-600'}
                      `}>
                        {item.price}g
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-3">{item.description}</p>
                  
                  {!canAfford(item, 1) && (
                    <div className="text-xs text-red-600 font-medium">
                      Insufficient funds
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Purchase Panel */}
        {selectedItem && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-3xl mr-4">{selectedItem.icon}</span>
                <div>
                  <h4 className="font-bold text-lg">{selectedItem.name}</h4>
                  <p className="text-sm text-gray-600">{selectedItem.description}</p>
                  <p className="text-sm text-gray-500">
                    Price: {selectedItem.price}g each • In Stock: {selectedItem.inStock}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Quantity Selector */}
                {selectedItem.type !== 'upgrade' && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Qty:</label>
                    <div className="flex items-center border border-gray-300 rounded">
                      <button
                        onClick={() => setPurchaseQuantity(Math.max(1, purchaseQuantity - 1))}
                        className="px-2 py-1 hover:bg-gray-100"
                        disabled={purchaseQuantity <= 1}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={purchaseQuantity}
                        onChange={(e) => setPurchaseQuantity(Math.max(1, Math.min(selectedItem.inStock, parseInt(e.target.value) || 1)))}
                        className="w-16 text-center border-0 focus:outline-none"
                        min="1"
                        max={selectedItem.inStock}
                      />
                      <button
                        onClick={() => setPurchaseQuantity(Math.min(selectedItem.inStock, purchaseQuantity + 1))}
                        className="px-2 py-1 hover:bg-gray-100"
                        disabled={purchaseQuantity >= selectedItem.inStock}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Total Cost */}
                <div className="text-right">
                  <div className="text-sm text-gray-600">Total:</div>
                  <div className={`text-lg font-bold ${canAfford(selectedItem, purchaseQuantity) ? 'text-green-600' : 'text-red-600'}`}>
                    {getTotalCost()}g
                  </div>
                </div>
                
                {/* Purchase Button */}
                <button
                  onClick={handlePurchase}
                  disabled={!canAfford(selectedItem, purchaseQuantity) || selectedItem.inStock < purchaseQuantity}
                  className={`
                    px-6 py-2 rounded-lg font-bold transition-colors
                    ${canAfford(selectedItem, purchaseQuantity) && selectedItem.inStock >= purchaseQuantity
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }
                  `}
                >
                  Purchase
                </button>
                
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SproutLandsShop;