'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Item, ItemType, ItemRarity } from '../systems/ItemSystem';

// 背包槽位接口
export interface InventorySlot {
  id: string;
  item: Item | null;
  position: { x: number; y: number };
  isDragging: boolean;
  isHovered: boolean;
}

// 背包配置接口
export interface InventoryConfig {
  rows: number;
  columns: number;
  slotSize: number;
  slotSpacing: number;
  maxWeight: number;
  enableDragDrop: boolean;
  enableSorting: boolean;
  enableFiltering: boolean;
}

// 背包事件接口
export interface InventoryEvent {
  type: 'item_click' | 'item_drag_start' | 'item_drag_end' | 'item_drop' | 'item_use' | 'item_equip';
  item: Item;
  slotId?: string;
  position?: { x: number; y: number };
}

interface InventoryUIProps {
  items: Item[];
  config?: Partial<InventoryConfig>;
  onEvent?: (event: InventoryEvent) => void;
  isVisible?: boolean;
  onClose?: () => void;
}

export const InventoryUI: React.FC<InventoryUIProps> = ({
  items,
  config = {},
  onEvent,
  isVisible = false,
  onClose
}) => {
  const [slots, setSlots] = useState<InventorySlot[]>([]);
  const [draggedItem, setDraggedItem] = useState<{ item: Item; slotId: string } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'type' | 'rarity' | 'level' | 'name'>('type');
  const [filterType, setFilterType] = useState<ItemType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentWeight, setCurrentWeight] = useState(0);

  const defaultConfig: InventoryConfig = {
    rows: 6,
    columns: 8,
    slotSize: 60,
    slotSpacing: 4,
    maxWeight: 100,
    enableDragDrop: true,
    enableSorting: true,
    enableFiltering: true
  };

  const finalConfig = { ...defaultConfig, ...config };
  const containerRef = useRef<HTMLDivElement>(null);

  // 初始化背包槽位
  useEffect(() => {
    const newSlots: InventorySlot[] = [];
    for (let row = 0; row < finalConfig.rows; row++) {
      for (let col = 0; col < finalConfig.columns; col++) {
        const id = `slot_${row}_${col}`;
        newSlots.push({
          id,
          item: null,
          position: { x: col, y: row },
          isDragging: false,
          isHovered: false
        });
      }
    }
    setSlots(newSlots);
  }, [finalConfig.rows, finalConfig.columns]);

  // 更新槽位物品
  useEffect(() => {
    const filteredItems = filterItems(items);
    const sortedItems = sortItems(filteredItems);
    
    const newSlots = [...slots];
    let itemIndex = 0;
    let totalWeight = 0;

    newSlots.forEach(slot => {
      if (itemIndex < sortedItems.length) {
        slot.item = sortedItems[itemIndex];
        totalWeight += (slot.item?.weight || 0) * (slot.item?.currentStack || 1);
        itemIndex++;
      } else {
        slot.item = null;
      }
    });

    setSlots(newSlots);
    setCurrentWeight(totalWeight);
  }, [items, sortBy, filterType, searchQuery]);

  // 过滤物品
  const filterItems = (itemList: Item[]): Item[] => {
    let filtered = itemList;

    // 按类型过滤
    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.type === filterType);
    }

    // 按搜索查询过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  // 排序物品
  const sortItems = (itemList: Item[]): Item[] => {
    const sorted = [...itemList];

    switch (sortBy) {
      case 'type':
        sorted.sort((a, b) => a.type.localeCompare(b.type));
        break;
      case 'rarity':
        sorted.sort((a, b) => {
          const rarityOrder = {
            [ItemRarity.COMMON]: 0,
            [ItemRarity.UNCOMMON]: 1,
            [ItemRarity.RARE]: 2,
            [ItemRarity.EPIC]: 3,
            [ItemRarity.LEGENDARY]: 4
          };
          return rarityOrder[b.rarity] - rarityOrder[a.rarity];
        });
        break;
      case 'level':
        sorted.sort((a, b) => b.level - a.level);
        break;
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return sorted;
  };

  // 获取稀有度颜色
  const getRarityColor = (rarity: ItemRarity): string => {
    const colors = {
      [ItemRarity.COMMON]: 'border-gray-400',
      [ItemRarity.UNCOMMON]: 'border-green-400',
      [ItemRarity.RARE]: 'border-blue-400',
      [ItemRarity.EPIC]: 'border-purple-400',
      [ItemRarity.LEGENDARY]: 'border-orange-400'
    };
    return colors[rarity] || 'border-gray-400';
  };

  // 获取物品类型图标
  const getItemTypeIcon = (type: ItemType): string => {
    const icons = {
      [ItemType.WEAPON]: '⚔️',
      [ItemType.ARMOR]: '🛡️',
      [ItemType.HELMET]: '⛑️',
      [ItemType.BOOTS]: '👢',
      [ItemType.ACCESSORY]: '💍',
      [ItemType.CONSUMABLE]: '🧪',
      [ItemType.MATERIAL]: '📦',
      [ItemType.QUEST]: '📋',
      [ItemType.KEY]: '🔑'
    };
    return icons[type] || '❓';
  };

  // 处理槽位点击
  const handleSlotClick = (slot: InventorySlot) => {
    if (!slot.item) return;

    setSelectedSlot(slot.id);
    
    if (onEvent) {
      onEvent({
        type: 'item_click',
        item: slot.item,
        slotId: slot.id
      });
    }
  };

  // 处理拖拽开始
  const handleDragStart = (e: React.DragEvent, slot: InventorySlot) => {
    if (!slot.item || !finalConfig.enableDragDrop) return;

    setDraggedItem({ item: slot.item, slotId: slot.id });
    setDragOffset({
      x: e.clientX - e.currentTarget.getBoundingClientRect().left,
      y: e.clientY - e.currentTarget.getBoundingClientRect().top
    });

    e.dataTransfer.setData('text/plain', slot.id);
    e.dataTransfer.effectAllowed = 'move';

    if (onEvent) {
      onEvent({
        type: 'item_drag_start',
        item: slot.item,
        slotId: slot.id
      });
    }
  };

  // 处理拖拽结束
  const handleDragEnd = (e: React.DragEvent, slot: InventorySlot) => {
    if (!slot.item) return;

    setDraggedItem(null);
    setDragOffset({ x: 0, y: 0 });

    if (onEvent) {
      onEvent({
        type: 'item_drag_end',
        item: slot.item,
        slotId: slot.id
      });
    }
  };

  // 处理拖拽悬停
  const handleDragOver = (e: React.DragEvent, slot: InventorySlot) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // 处理拖拽放置
  const handleDrop = (e: React.DragEvent, targetSlot: InventorySlot) => {
    e.preventDefault();
    
    if (!draggedItem) return;

    const sourceSlotId = e.dataTransfer.getData('text/plain');
    
    if (onEvent) {
      onEvent({
        type: 'item_drop',
        item: draggedItem.item,
        slotId: targetSlot.id,
        position: targetSlot.position
      });
    }

    setDraggedItem(null);
  };

  // 处理物品使用
  const handleItemUse = (item: Item) => {
    if (onEvent) {
      onEvent({
        type: 'item_use',
        item
      });
    }
  };

  // 处理物品装备
  const handleItemEquip = (item: Item) => {
    if (onEvent) {
      onEvent({
        type: 'item_equip',
        item
      });
    }
  };

  // 渲染槽位
  const renderSlot = (slot: InventorySlot) => {
    const isSelected = selectedSlot === slot.id;
    const isOverWeight = currentWeight > finalConfig.maxWeight;

    return (
      <div
        key={slot.id}
        className={`
          relative bg-gray-800 border-2 rounded-lg cursor-pointer
          transition-all duration-200 hover:scale-105
          ${slot.item ? getRarityColor(slot.item.rarity) : 'border-gray-600'}
          ${isSelected ? 'ring-2 ring-blue-400' : ''}
          ${isOverWeight ? 'border-red-500' : ''}
        `}
        style={{
          width: finalConfig.slotSize,
          height: finalConfig.slotSize,
          margin: finalConfig.slotSpacing / 2
        }}
        onClick={() => handleSlotClick(slot)}
        draggable={slot.item && finalConfig.enableDragDrop ? true : undefined}
        onDragStart={(e) => handleDragStart(e, slot)}
        onDragEnd={(e) => handleDragEnd(e, slot)}
        onDragOver={(e) => handleDragOver(e, slot)}
        onDrop={(e) => handleDrop(e, slot)}
      >
        {slot.item && (
          <>
            {/* 物品图标 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-2xl">{getItemTypeIcon(slot.item.type)}</div>
            </div>

            {/* 物品数量 */}
            {slot.item.stackable && slot.item.currentStack > 1 && (
              <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                {slot.item.currentStack}
              </div>
            )}

            {/* 物品等级 */}
            {slot.item.level > 1 && (
              <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1 rounded">
                Lv.{slot.item.level}
              </div>
            )}

            {/* 稀有度指示器 */}
            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-yellow-400" />
          </>
        )}
      </div>
    );
  };

  // 渲染物品详情
  const renderItemDetails = () => {
    const selectedSlotItem = slots.find((slot: any) => slot.id === selectedSlot);
          if (!selectedSlotItem?.item) return null;

      const item = selectedSlotItem.item;

    return (
      <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="text-3xl">{getItemTypeIcon(item.type)}</div>
          <div>
            <h3 className="text-lg font-bold text-white">{item.name}</h3>
            <p className="text-sm text-gray-400">等级 {item.level}</p>
          </div>
        </div>

        <p className="text-gray-300 text-sm mb-3">{item.description}</p>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">稀有度:</span>
            <span className="text-white">{item.rarity}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">重量:</span>
            <span className="text-white">{item.weight}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">价值:</span>
            <span className="text-white">{item.value}</span>
          </div>
        </div>

        <div className="flex gap-2">
          {item.type === ItemType.CONSUMABLE && (
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
              onClick={() => handleItemUse(item)}
            >
              使用
            </button>
          )}
          {[ItemType.WEAPON, ItemType.ARMOR, ItemType.HELMET, ItemType.BOOTS, ItemType.ACCESSORY].includes(item.type) && (
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
              onClick={() => handleItemEquip(item)}
            >
              装备
            </button>
          )}
        </div>
      </div>
    );
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* 标题栏 */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">背包</h2>
          <button
            className="text-gray-400 hover:text-white"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* 控制栏 */}
        <div className="flex gap-4 mb-4">
          {/* 搜索框 */}
          <input
            type="text"
            placeholder="搜索物品..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-gray-700 text-white px-3 py-1 rounded text-sm flex-1"
          />

          {/* 排序选择 */}
          {finalConfig.enableSorting && (
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-gray-700 text-white px-3 py-1 rounded text-sm"
            >
              <option value="type">按类型</option>
              <option value="rarity">按稀有度</option>
              <option value="level">按等级</option>
              <option value="name">按名称</option>
            </select>
          )}

          {/* 过滤选择 */}
          {finalConfig.enableFiltering && (
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-gray-700 text-white px-3 py-1 rounded text-sm"
            >
              <option value="all">全部</option>
              <option value={ItemType.WEAPON}>武器</option>
              <option value={ItemType.ARMOR}>防具</option>
              <option value={ItemType.CONSUMABLE}>消耗品</option>
              <option value={ItemType.MATERIAL}>材料</option>
              <option value={ItemType.QUEST}>任务物品</option>
            </select>
          )}
        </div>

        {/* 重量信息 */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-400 text-sm">
            重量: {currentWeight.toFixed(1)} / {finalConfig.maxWeight}
          </span>
          <div className="w-32 bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                currentWeight > finalConfig.maxWeight ? 'bg-red-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min((currentWeight / finalConfig.maxWeight) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex gap-6">
          {/* 背包槽位 */}
          <div className="flex-1">
            <div
              ref={containerRef}
              className="grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${finalConfig.columns}, ${finalConfig.slotSize + finalConfig.slotSpacing}px)`,
                gridTemplateRows: `repeat(${finalConfig.rows}, ${finalConfig.slotSize + finalConfig.slotSpacing}px)`
              }}
            >
              {slots.map(renderSlot)}
            </div>
          </div>

          {/* 物品详情 */}
          <div className="w-80">
            {renderItemDetails()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryUI;