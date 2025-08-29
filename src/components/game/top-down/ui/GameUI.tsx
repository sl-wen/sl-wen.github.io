'use client';

import React, { useState, useEffect } from 'react';
import { InventorySystem, GameItem } from '../systems/InventorySystem';
import { QuestSystem, Quest } from '../systems/QuestSystem';
import { CombatSystem, CombatState } from '../systems/CombatSystem';

interface GameUIProps {
  inventory: InventorySystem;
  questSystem: QuestSystem;
  combatSystem: CombatSystem;
  playerHealth: number;
  playerMaxHealth: number;
  playerLevel: number;
  playerExperience: number;
  playerGold: number;
  isMobile: boolean;
}

export const GameUI: React.FC<GameUIProps> = ({
  inventory,
  questSystem,
  combatSystem,
  playerHealth,
  playerMaxHealth,
  playerLevel,
  playerExperience,
  playerGold,
  isMobile
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'inventory' | 'quests' | 'combat'>('status');
  const [showUI, setShowUI] = useState(true);
  const [selectedInventorySlot, setSelectedInventorySlot] = useState<number | null>(null);

  // 切换UI显示
  const toggleUI = () => setShowUI(!showUI);

  // 处理键盘快捷键
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'i' || e.key === 'I') {
        setActiveTab('inventory');
        setShowUI(true);
      } else if (e.key === 'q' || e.key === 'Q') {
        setActiveTab('quests');
        setShowUI(true);
      } else if (e.key === 'c' || e.key === 'C') {
        setActiveTab('combat');
        setShowUI(true);
      } else if (e.key === 'Escape') {
        setShowUI(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!showUI) {
    return (
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={toggleUI}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-bold"
        >
          {isMobile ? '📱' : 'UI'}
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-50 pointer-events-none">
      {/* 顶部状态栏 */}
      <div className="absolute top-4 left-4 right-4 pointer-events-auto">
        <div className="bg-black/80 rounded-lg p-3 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* 等级和经验 */}
              <div className="text-center">
                <div className="text-lg font-bold">Lv.{playerLevel}</div>
                <div className="text-xs text-gray-300">
                  EXP: {playerExperience}/{playerLevel * 100}
                </div>
              </div>

              {/* 生命值 */}
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-red-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(playerHealth / playerMaxHealth) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-bold">
                  {playerHealth}/{playerMaxHealth}
                </span>
              </div>

              {/* 金币 */}
              <div className="flex items-center space-x-1">
                <span className="text-yellow-400">💰</span>
                <span className="font-bold">{playerGold}</span>
              </div>
            </div>

            {/* 关闭按钮 */}
            <button
              onClick={toggleUI}
              className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* 主UI面板 */}
      <div className="absolute top-20 left-4 right-4 bottom-4 pointer-events-auto">
        <div className="bg-black/90 rounded-lg h-full flex flex-col">
          {/* 标签栏 */}
          <div className="flex border-b border-gray-700">
            {[
              { key: 'status', label: '状态', icon: '❤️' },
              { key: 'inventory', label: '背包', icon: '🎒' },
              { key: 'quests', label: '任务', icon: '📋' },
              { key: 'combat', label: '战斗', icon: '⚔️' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 py-2 px-4 text-sm font-bold transition-colors ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* 内容区域 */}
          <div className="flex-1 overflow-auto p-4">
            {activeTab === 'status' && <StatusTab playerLevel={playerLevel} playerExperience={playerExperience} />}
            {activeTab === 'inventory' && (
              <InventoryTab 
                inventory={inventory} 
                selectedSlot={selectedInventorySlot}
                onSelectSlot={setSelectedInventorySlot}
                isMobile={isMobile}
              />
            )}
            {activeTab === 'quests' && <QuestTab questSystem={questSystem} />}
            {activeTab === 'combat' && <CombatTab combatSystem={combatSystem} />}
          </div>
        </div>
      </div>
    </div>
  );
};

// 状态标签页组件
const StatusTab: React.FC<{ playerLevel: number; playerExperience: number }> = ({ playerLevel, playerExperience }) => {
  const experienceToNext = playerLevel * 100;
  const progress = (playerExperience / experienceToNext) * 100;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white mb-4">角色状态</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800 p-3 rounded">
          <div className="text-sm text-gray-400">等级</div>
          <div className="text-xl font-bold text-white">{playerLevel}</div>
        </div>
        
        <div className="bg-gray-800 p-3 rounded">
          <div className="text-sm text-gray-400">经验值</div>
          <div className="text-xl font-bold text-white">{playerExperience}</div>
        </div>
      </div>

      <div className="bg-gray-800 p-3 rounded">
        <div className="text-sm text-gray-400 mb-2">升级进度</div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-xs text-gray-400 mt-1">
          距离下一级还需 {experienceToNext - playerExperience} 经验
        </div>
      </div>
    </div>
  );
};

// 背包标签页组件
const InventoryTab: React.FC<{
  inventory: InventorySystem;
  selectedSlot: number | null;
  onSelectSlot: (slot: number | null) => void;
  isMobile: boolean;
}> = ({ inventory, selectedSlot, onSelectSlot, isMobile }) => {
  const inventoryData = inventory.getInventory();
  const equipment = inventory.getEquipment();
  const stats = inventory.getInventoryStats();

  const handleSlotClick = (index: number) => {
    if (selectedSlot === index) {
      onSelectSlot(null);
    } else {
      onSelectSlot(index);
    }
  };

  const handleUseItem = (index: number) => {
    const slot = inventoryData[index];
    if (slot.item) {
      if (slot.item.type === 'consumable') {
        inventory.useConsumable(index);
      } else if (slot.item.type === 'weapon' || slot.item.type === 'armor') {
        inventory.equipItem(index);
      }
    }
    onSelectSlot(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-white">背包</h3>
        <div className="text-sm text-gray-400">
          {stats.used}/{stats.total}
        </div>
      </div>

      {/* 装备栏 */}
      <div className="bg-gray-800 p-3 rounded">
        <div className="text-sm text-gray-400 mb-2">装备</div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: 'weapon', label: '武器', item: equipment.weapon },
            { key: 'armor', label: '护甲', item: equipment.armor },
            { key: 'accessory', label: '饰品', item: equipment.accessory }
          ].map(({ key, label, item }) => (
            <div key={key} className="bg-gray-700 p-2 rounded text-center">
              <div className="text-xs text-gray-400">{label}</div>
              <div className="text-sm text-white">
                {item ? item.name : '空'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 背包格子 */}
      <div className="grid grid-cols-5 gap-2">
        {inventoryData.map((slot, index) => (
          <div
            key={index}
            onClick={() => handleSlotClick(index)}
            className={`aspect-square bg-gray-700 rounded border-2 cursor-pointer transition-colors ${
              selectedSlot === index ? 'border-blue-500' : 'border-gray-600'
            } ${slot.item ? 'hover:border-gray-400' : ''}`}
          >
            {slot.item && (
              <div className="h-full flex flex-col items-center justify-center p-1">
                <div className="text-lg">{slot.item.icon}</div>
                {slot.quantity > 1 && (
                  <div className="text-xs bg-black/50 text-white px-1 rounded absolute bottom-0 right-0">
                    {slot.quantity}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 选中物品详情 */}
      {selectedSlot !== null && inventoryData[selectedSlot]?.item && (
        <div className="bg-gray-800 p-3 rounded">
          <div className="text-sm text-gray-400 mb-2">物品详情</div>
          <div className="text-white mb-2">{inventoryData[selectedSlot]!.item!.name}</div>
          <div className="text-xs text-gray-300 mb-3">{inventoryData[selectedSlot]!.item!.description}</div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => handleUseItem(selectedSlot)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
            >
              使用
            </button>
            <button
              onClick={() => onSelectSlot(null)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// 任务标签页组件
const QuestTab: React.FC<{ questSystem: QuestSystem }> = ({ questSystem }) => {
  const activeQuests = questSystem.getActiveQuests();
  const completedQuests = questSystem.getCompletedQuests();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white mb-4">任务日志</h3>

      {/* 活跃任务 */}
      <div>
        <div className="text-sm text-gray-400 mb-2">进行中的任务 ({activeQuests.length})</div>
        {activeQuests.length === 0 ? (
          <div className="text-gray-500 text-sm">暂无进行中的任务</div>
        ) : (
          <div className="space-y-2">
            {activeQuests.map(quest => (
              <div key={quest.id} className="bg-gray-800 p-3 rounded">
                <div className="text-white font-bold mb-1">{quest.title}</div>
                <div className="text-sm text-gray-300 mb-2">{quest.description}</div>
                <div className="space-y-1">
                  {quest.objectives.map(objective => (
                    <div key={objective.id} className="text-xs text-gray-400">
                      {objective.description}: {objective.current}/{objective.required}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 已完成任务 */}
      <div>
        <div className="text-sm text-gray-400 mb-2">已完成任务 ({completedQuests.length})</div>
        {completedQuests.length === 0 ? (
          <div className="text-gray-500 text-sm">暂无已完成的任务</div>
        ) : (
          <div className="text-xs text-gray-400">
            {completedQuests.slice(0, 5).join(', ')}
            {completedQuests.length > 5 && `... 还有 ${completedQuests.length - 5} 个`}
          </div>
        )}
      </div>
    </div>
  );
};

// 战斗标签页组件
const CombatTab: React.FC<{ combatSystem: CombatSystem }> = ({ combatSystem }) => {
  const combatState = combatSystem.getCombatState();
  const combatHistory = combatSystem.getCombatHistory();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white mb-4">战斗信息</h3>

      {/* 战斗状态 */}
      <div className="bg-gray-800 p-3 rounded">
        <div className="text-sm text-gray-400 mb-2">战斗状态</div>
        <div className="text-white">
          {combatState.isInCombat ? '战斗中' : '未在战斗'}
        </div>
        {combatState.isInCombat && (
          <div className="text-xs text-gray-400 mt-1">
            参与者: {combatState.participants.length} 人
          </div>
        )}
      </div>

      {/* 战斗历史 */}
      <div>
        <div className="text-sm text-gray-400 mb-2">最近战斗记录</div>
        {combatHistory.length === 0 ? (
          <div className="text-gray-500 text-sm">暂无战斗记录</div>
        ) : (
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {combatHistory.slice(-5).map((result, index) => (
              <div key={index} className="text-xs bg-gray-800 p-2 rounded">
                <div className="text-white">
                  {result.attacker} → {result.target}
                </div>
                <div className="text-gray-400">
                  伤害: {result.damage} {result.isCritical && '(暴击)'}
                </div>
                {result.targetDefeated && (
                  <div className="text-green-400">
                    击败! 获得 {result.experience} 经验, {result.gold} 金币
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};