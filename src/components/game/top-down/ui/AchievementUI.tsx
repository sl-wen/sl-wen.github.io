'use client';

import React, { useState, useEffect } from 'react';
import { GameStatsManager, Achievement } from '../systems/GameStatsManager';

interface AchievementUIProps {
  isVisible: boolean;
  onClose: () => void;
}

export const AchievementUI: React.FC<AchievementUIProps> = ({
  isVisible,
  onClose
}) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const statsManager = GameStatsManager.getInstance();

  useEffect(() => {
    if (isVisible) {
      loadAchievementData();
    }
  }, [isVisible]);

  const loadAchievementData = () => {
    const allAchievements = statsManager.getAchievements();
    const unlocked = statsManager.getUnlockedAchievements();
    const currentStats = statsManager.getStats();

    setAchievements(allAchievements);
    setUnlockedAchievements(unlocked);
    setStats(currentStats);
  };

  const getProgress = (achievementId: string) => {
    return statsManager.getProgress(achievementId);
  };

  const getCategoryAchievements = () => {
    if (selectedCategory === 'all') {
      return achievements;
    }
    return achievements.filter(achievement => {
      const category = getAchievementCategory(achievement.id);
      return category === selectedCategory;
    });
  };

  const getAchievementCategory = (achievementId: string): string => {
    if (achievementId.includes('warrior') || achievementId.includes('blood') || achievementId.includes('veteran')) {
      return 'combat';
    }
    if (achievementId.includes('collector') || achievementId.includes('treasure')) {
      return 'collection';
    }
    if (achievementId.includes('explorer') || achievementId.includes('adventurer')) {
      return 'exploration';
    }
    if (achievementId.includes('quest')) {
      return 'quest';
    }
    if (achievementId.includes('craftsman')) {
      return 'crafting';
    }
    if (achievementId.includes('merchant')) {
      return 'trading';
    }
    if (achievementId.includes('dedicated')) {
      return 'time';
    }
    return 'other';
  };

  const getCategoryName = (category: string): string => {
    const categoryNames: { [key: string]: string } = {
      all: '全部',
      combat: '战斗',
      collection: '收集',
      exploration: '探索',
      quest: '任务',
      crafting: '制作',
      trading: '交易',
      time: '时间',
      other: '其他'
    };
    return categoryNames[category] || category;
  };

  const getCategoryIcon = (category: string): string => {
    const categoryIcons: { [key: string]: string } = {
      all: '🏆',
      combat: '⚔️',
      collection: '📦',
      exploration: '🗺️',
      quest: '📋',
      crafting: '🔨',
      trading: '💰',
      time: '⏰',
      other: '🎯'
    };
    return categoryIcons[category] || '🎯';
  };

  const categories = ['all', 'combat', 'collection', 'exploration', 'quest', 'crafting', 'trading', 'time'];

  // 添加弹窗尺寸调试信息
  useEffect(() => {
    if (isVisible) {
      console.log('🏆 [DEBUG] 成就UI显示:', {
        isVisible,
        achievementsCount: achievements.length,
        unlockedCount: unlockedAchievements.length,
        stats: stats
      });
    }
  }, [isVisible, achievements.length, unlockedAchievements.length, stats]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white p-6 rounded-lg max-w-4xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">🏆 成就系统</h2>
          <button
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm"
          >
            关闭
          </button>
        </div>

        {/* 统计概览 */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-800 rounded">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {unlockedAchievements.length}/{achievements.length}
              </div>
              <div className="text-sm text-gray-300">成就完成</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {stats.enemiesDefeated}
              </div>
              <div className="text-sm text-gray-300">击败敌人</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {stats.itemsCollected}
              </div>
              <div className="text-sm text-gray-300">收集物品</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {Math.floor(stats.playTime / 60)}分
              </div>
              <div className="text-sm text-gray-300">游戏时长</div>
            </div>
          </div>
        )}

        {/* 分类选择 */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded text-sm transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {getCategoryIcon(category)} {getCategoryName(category)}
            </button>
          ))}
        </div>

        {/* 成就列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {getCategoryAchievements().map(achievement => {
            const progress = getProgress(achievement.id);
            const isUnlocked = unlockedAchievements.some(a => a.id === achievement.id);
            const category = getAchievementCategory(achievement.id);

            return (
              <div
                key={achievement.id}
                className={`p-4 rounded border-2 transition-all ${
                  isUnlocked
                    ? 'border-green-500 bg-green-900/20'
                    : 'border-gray-600 bg-gray-800/50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {isUnlocked ? '🏆' : '🔒'}
                    </span>
                    <div>
                      <h3 className={`font-bold ${isUnlocked ? 'text-green-400' : 'text-gray-400'}`}>
                        {achievement.name}
                      </h3>
                      <p className="text-sm text-gray-300">
                        {achievement.description}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {getCategoryIcon(category)}
                  </span>
                </div>

                {/* 进度条 */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>进度</span>
                    <span>{progress.current}/{progress.target}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isUnlocked ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {Math.round(progress.percentage)}% 完成
                  </div>
                </div>

                {/* 奖励信息 */}
                {achievement.reward && isUnlocked && (
                  <div className="mt-2 p-2 bg-yellow-900/20 border border-yellow-600 rounded text-xs">
                    <span className="text-yellow-400">奖励: </span>
                    <span className="text-gray-300">
                      {achievement.reward.type === 'experience' && `${achievement.reward.value} 经验`}
                      {achievement.reward.type === 'item' && `${achievement.reward.value} 物品`}
                      {achievement.reward.type === 'ability' && `${achievement.reward.value} 能力`}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 空状态 */}
        {getCategoryAchievements().length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-2">🎯</div>
            <div>该分类下暂无成就</div>
          </div>
        )}

        {/* 底部操作 */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-700">
          <button
            onClick={() => {
              const report = statsManager.generateReport();
              console.log('游戏统计报告:', report);
              alert('统计报告已输出到控制台');
            }}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
          >
            导出统计报告
          </button>
          <button
            onClick={() => {
              if (confirm('确定要重置所有统计数据吗？此操作不可撤销。')) {
                statsManager.resetStats();
                loadAchievementData();
              }
            }}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm"
          >
            重置统计
          </button>
        </div>
      </div>
    </div>
  );
};