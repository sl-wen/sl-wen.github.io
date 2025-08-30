'use client';

import React, { useState, useEffect } from 'react';
import { Item, ItemType, ItemRarity } from '../systems/ItemSystem';

// 装备槽位类型
export enum EquipmentSlotType {
  WEAPON = 'weapon',
  ARMOR = 'armor',
  HELMET = 'helmet',
  BOOTS = 'boots',
  ACCESSORY_1 = 'accessory_1',
  ACCESSORY_2 = 'accessory_2',
  RING_1 = 'ring_1',
  RING_2 = 'ring_2',
  AMULET = 'amulet'
}

// 装备槽位接口
export interface EquipmentSlot {
  type: EquipmentSlotType;
  item: Item | null;
  isEquipped: boolean;
  isHovered: boolean;
}

// 角色属性接口
export interface CharacterStats {
  level: number;
  experience: number;
  maxExperience: number;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  attack: number;
  defense: number;
  magicAttack: number;
  magicDefense: number;
  speed: number;
  criticalRate: number;
  criticalDamage: number;
  dodgeRate: number;
  blockRate: number;
}

// 装备事件接口
export interface EquipmentEvent {
  type: 'equip' | 'unequip' | 'slot_click' | 'item_hover';
  item: Item;
  slotType: EquipmentSlotType;
}

interface EquipmentUIProps {
  equipment: Map<EquipmentSlotType, Item | null>;
  stats: CharacterStats;
  onEvent?: (event: EquipmentEvent) => void;
  isVisible?: boolean;
  onClose?: () => void;
}

export const EquipmentUI: React.FC<EquipmentUIProps> = ({
  equipment,
  stats,
  onEvent,
  isVisible = false,
  onClose
}) => {
  const [slots, setSlots] = useState<EquipmentSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlotType | null>(null);
  const [hoveredItem, setHoveredItem] = useState<Item | null>(null);

  // 初始化装备槽位
  useEffect(() => {
    const equipmentSlots: EquipmentSlot[] = [
      { type: EquipmentSlotType.WEAPON, item: null, isEquipped: false, isHovered: false },
      { type: EquipmentSlotType.ARMOR, item: null, isEquipped: false, isHovered: false },
      { type: EquipmentSlotType.HELMET, item: null, isEquipped: false, isHovered: false },
      { type: EquipmentSlotType.BOOTS, item: null, isEquipped: false, isHovered: false },
      { type: EquipmentSlotType.ACCESSORY_1, item: null, isEquipped: false, isHovered: false },
      { type: EquipmentSlotType.ACCESSORY_2, item: null, isEquipped: false, isHovered: false },
      { type: EquipmentSlotType.RING_1, item: null, isEquipped: false, isHovered: false },
      { type: EquipmentSlotType.RING_2, item: null, isEquipped: false, isHovered: false },
      { type: EquipmentSlotType.AMULET, item: null, isEquipped: false, isHovered: false }
    ];

    // 更新装备状态
    equipmentSlots.forEach(slot => {
      slot.item = equipment.get(slot.type) || null;
      slot.isEquipped = slot.item !== null;
    });

    setSlots(equipmentSlots);
  }, [equipment]);

  // 获取槽位名称
  const getSlotName = (slotType: EquipmentSlotType): string => {
    const names = {
      [EquipmentSlotType.WEAPON]: '武器',
      [EquipmentSlotType.ARMOR]: '护甲',
      [EquipmentSlotType.HELMET]: '头盔',
      [EquipmentSlotType.BOOTS]: '靴子',
      [EquipmentSlotType.ACCESSORY_1]: '饰品1',
      [EquipmentSlotType.ACCESSORY_2]: '饰品2',
      [EquipmentSlotType.RING_1]: '戒指1',
      [EquipmentSlotType.RING_2]: '戒指2',
      [EquipmentSlotType.AMULET]: '项链'
    };
    return names[slotType] || '未知';
  };

  // 获取槽位图标
  const getSlotIcon = (slotType: EquipmentSlotType): string => {
    const icons = {
      [EquipmentSlotType.WEAPON]: '⚔️',
      [EquipmentSlotType.ARMOR]: '🛡️',
      [EquipmentSlotType.HELMET]: '⛑️',
      [EquipmentSlotType.BOOTS]: '👢',
      [EquipmentSlotType.ACCESSORY_1]: '💍',
      [EquipmentSlotType.ACCESSORY_2]: '💍',
      [EquipmentSlotType.RING_1]: '💍',
      [EquipmentSlotType.RING_2]: '💍',
      [EquipmentSlotType.AMULET]: '📿'
    };
    return icons[slotType] || '❓';
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

  // 处理槽位点击
  const handleSlotClick = (slot: EquipmentSlot) => {
    setSelectedSlot(slot.type);
    
    if (slot.item && onEvent) {
      onEvent({
        type: 'slot_click',
        item: slot.item,
        slotType: slot.type
      });
    }
  };

  // 处理物品悬停
  const handleItemHover = (item: Item, slotType: EquipmentSlotType) => {
    setHoveredItem(item);
    
    if (onEvent) {
      onEvent({
        type: 'item_hover',
        item,
        slotType
      });
    }
  };

  // 处理物品离开
  const handleItemLeave = () => {
    setHoveredItem(null);
  };

  // 处理卸下装备
  const handleUnequip = (slot: EquipmentSlot) => {
    if (!slot.item) return;

    if (onEvent) {
      onEvent({
        type: 'unequip',
        item: slot.item,
        slotType: slot.type
      });
    }
  };

  // 渲染装备槽位
  const renderEquipmentSlot = (slot: EquipmentSlot) => {
    const isSelected = selectedSlot === slot.type;

    return (
      <div
        key={slot.type}
        className={`
          relative bg-gray-800 border-2 rounded-lg cursor-pointer
          transition-all duration-200 hover:scale-105
          ${slot.item ? getRarityColor(slot.item.rarity) : 'border-gray-600'}
          ${isSelected ? 'ring-2 ring-blue-400' : ''}
          ${slot.isEquipped ? 'bg-gray-700' : 'bg-gray-800'}
        `}
        style={{ width: 80, height: 80 }}
        onClick={() => handleSlotClick(slot)}
        onMouseEnter={() => slot.item && handleItemHover(slot.item, slot.type)}
        onMouseLeave={handleItemLeave}
      >
        {/* 槽位图标 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-2xl text-gray-500">
            {slot.item ? getSlotIcon(slot.type) : getSlotIcon(slot.type)}
          </div>
        </div>

        {/* 装备物品 */}
        {slot.item && (
          <>
            {/* 物品图标 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-2xl">{getSlotIcon(slot.type)}</div>
            </div>

            {/* 物品等级 */}
            {slot.item.level > 1 && (
              <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1 rounded">
                Lv.{slot.item.level}
              </div>
            )}

            {/* 稀有度指示器 */}
            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-yellow-400" />

            {/* 卸下按钮 */}
            <button
              className="absolute bottom-1 right-1 bg-red-600 hover:bg-red-700 text-white text-xs px-1 rounded"
              onClick={(e) => {
                e.stopPropagation();
                handleUnequip(slot);
              }}
            >
              卸下
            </button>
          </>
        )}

        {/* 槽位名称 */}
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 whitespace-nowrap">
          {getSlotName(slot.type)}
        </div>
      </div>
    );
  };

  // 渲染角色信息
  const renderCharacterInfo = () => {
    const experiencePercentage = (stats.experience / stats.maxExperience) * 100;
    const healthPercentage = (stats.health / stats.maxHealth) * 100;
    const manaPercentage = (stats.mana / stats.maxMana) * 100;

    return (
      <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">角色信息</h3>
        
        {/* 等级和经验 */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">等级 {stats.level}</span>
            <span className="text-gray-400">{stats.experience} / {stats.maxExperience}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${experiencePercentage}%` }}
            />
          </div>
        </div>

        {/* 生命值 */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">生命值</span>
            <span className="text-red-400">{stats.health} / {stats.maxHealth}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-red-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${healthPercentage}%` }}
            />
          </div>
        </div>

        {/* 魔法值 */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">魔法值</span>
            <span className="text-blue-400">{stats.mana} / {stats.maxMana}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${manaPercentage}%` }}
            />
          </div>
        </div>

        {/* 属性统计 */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">攻击:</span>
            <span className="text-white">{stats.attack}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">防御:</span>
            <span className="text-white">{stats.defense}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">魔法攻击:</span>
            <span className="text-white">{stats.magicAttack}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">魔法防御:</span>
            <span className="text-white">{stats.magicDefense}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">速度:</span>
            <span className="text-white">{stats.speed}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">暴击率:</span>
            <span className="text-white">{(stats.criticalRate * 100).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">暴击伤害:</span>
            <span className="text-white">{(stats.criticalDamage * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">闪避率:</span>
            <span className="text-white">{(stats.dodgeRate * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>
    );
  };

  // 渲染物品详情
  const renderItemDetails = () => {
    if (!hoveredItem) return null;

    return (
      <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="text-3xl">{getSlotIcon(EquipmentSlotType.WEAPON)}</div>
          <div>
            <h3 className="text-lg font-bold text-white">{hoveredItem.name}</h3>
            <p className="text-sm text-gray-400">等级 {hoveredItem.level}</p>
          </div>
        </div>

        <p className="text-gray-300 text-sm mb-3">{hoveredItem.description}</p>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">稀有度:</span>
            <span className="text-white">{hoveredItem.rarity}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">重量:</span>
            <span className="text-white">{hoveredItem.weight}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">价值:</span>
            <span className="text-white">{hoveredItem.value}</span>
          </div>
        </div>

        {/* 装备效果 */}
        {hoveredItem.effects.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-bold text-white mb-2">装备效果:</h4>
            <div className="space-y-1">
              {hoveredItem.effects.map((effect, index) => (
                <div key={index} className="text-sm text-green-400">
                  • {effect.type}: +{effect.value}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
            onClick={() => {
              const slot = slots.find(s => s.item?.id === hoveredItem.id);
              if (slot) handleUnequip(slot);
            }}
          >
            卸下
          </button>
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
          <h2 className="text-xl font-bold text-white">装备</h2>
          <button
            className="text-gray-400 hover:text-white"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="flex gap-6">
          {/* 左侧：角色信息和装备槽位 */}
          <div className="flex-1">
            {/* 角色信息 */}
            {renderCharacterInfo()}

            {/* 装备槽位 */}
            <div className="mt-6">
              <h3 className="text-lg font-bold text-white mb-4">装备槽位</h3>
              <div className="grid grid-cols-3 gap-4">
                {slots.map(renderEquipmentSlot)}
              </div>
            </div>
          </div>

          {/* 右侧：物品详情 */}
          <div className="w-80">
            {renderItemDetails()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipmentUI;