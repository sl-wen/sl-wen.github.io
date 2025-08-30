'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Achievement, 
  AchievementType, 
  AchievementRarity, 
  AchievementStatus,
  AchievementStats 
} from '../systems/AchievementSystem';

// 成就界面配置接口
export interface AchievementConfig {
  showSecret: boolean;
  showCompleted: boolean;
  sortBy: 'name' | 'rarity' | 'progress' | 'category' | 'unlockDate';
  filterCategory: string;
  filterRarity: AchievementRarity | 'all';
  searchQuery: string;
}

// 成就界面事件接口
export interface AchievementEvent {
  type: string;
  achievement: Achievement;
  data?: any;
}

interface AchievementUIProps {
  achievements: Achievement[];
  stats: AchievementStats;
  config: AchievementConfig;
  onConfigChange: (config: AchievementConfig) => void;
  onAchievementClick: (achievement: Achievement) => void;
  onShareAchievement: (achievementId: string) => void;
  onClose: () => void;
  isVisible: boolean;
}

export const AchievementUI: React.FC<AchievementUIProps> = ({
  achievements,
  stats,
  config,
  onConfigChange,
  onAchievementClick,
  onShareAchievement,
  onClose,
  isVisible
}) => {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareText, setShareText] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // 过滤和排序成就
  const filteredAchievements = achievements.filter(achievement => {
    // 过滤秘密成就
    if (achievement.isSecret && !config.showSecret) {
      return false;
    }

    // 过滤已完成成就
    if (achievement.status === AchievementStatus.COMPLETED && !config.showCompleted) {
      return false;
    }

    // 过滤分类
    if (config.filterCategory && config.filterCategory !== 'all' && achievement.category !== config.filterCategory) {
      return false;
    }

    // 过滤稀有度
    if (config.filterRarity && config.filterRarity !== 'all' && achievement.rarity !== config.filterRarity) {
      return false;
    }

    // 搜索过滤
    if (config.searchQuery) {
      const query = config.searchQuery.toLowerCase();
      return achievement.name.toLowerCase().includes(query) || 
             achievement.description.toLowerCase().includes(query);
    }

    return true;
  }).sort((a, b) => {
    switch (config.sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'rarity':
        return getRarityValue(b.rarity) - getRarityValue(a.rarity);
      case 'progress':
        return b.progress.percentage - a.progress.percentage;
      case 'category':
        return (a.category || '').localeCompare(b.category || '');
      case 'unlockDate':
        return (b.unlockDate || 0) - (a.unlockDate || 0);
      default:
        return 0;
    }
  });

  // 获取稀有度数值
  const getRarityValue = (rarity: AchievementRarity): number => {
    switch (rarity) {
      case AchievementRarity.COMMON: return 1;
      case AchievementRarity.UNCOMMON: return 2;
      case AchievementRarity.RARE: return 3;
      case AchievementRarity.EPIC: return 4;
      case AchievementRarity.LEGENDARY: return 5;
      default: return 0;
    }
  };

  // 获取稀有度颜色
  const getRarityColor = (rarity: AchievementRarity): string => {
    switch (rarity) {
      case AchievementRarity.COMMON: return 'border-gray-400 text-gray-400';
      case AchievementRarity.UNCOMMON: return 'border-green-400 text-green-400';
      case AchievementRarity.RARE: return 'border-blue-400 text-blue-400';
      case AchievementRarity.EPIC: return 'border-purple-400 text-purple-400';
      case AchievementRarity.LEGENDARY: return 'border-orange-400 text-orange-400';
      default: return 'border-gray-400 text-gray-400';
    }
  };

  // 获取稀有度名称
  const getRarityName = (rarity: AchievementRarity): string => {
    switch (rarity) {
      case AchievementRarity.COMMON: return '普通';
      case AchievementRarity.UNCOMMON: return '罕见';
      case AchievementRarity.RARE: return '稀有';
      case AchievementRarity.EPIC: return '史诗';
      case AchievementRarity.LEGENDARY: return '传说';
      default: return '未知';
    }
  };

  // 获取成就类型图标
  const getTypeIcon = (type: AchievementType): string => {
    switch (type) {
      case AchievementType.KILL_COUNT: return '⚔️';
      case AchievementType.QUEST_COMPLETE: return '📋';
      case AchievementType.ITEM_COLLECT: return '🎒';
      case AchievementType.EXPLORE_AREA: return '🗺️';
      case AchievementType.LEVEL_UP: return '⭐';
      case AchievementType.CRAFT_ITEM: return '🔨';
      case AchievementType.TIME_PLAYED: return '⏰';
      case AchievementType.SPECIAL_EVENT: return '🎉';
      default: return '🏆';
    }
  };

  // 获取成就状态图标
  const getStatusIcon = (status: AchievementStatus): string => {
    switch (status) {
      case AchievementStatus.LOCKED: return '🔒';
      case AchievementStatus.UNLOCKED: return '🔓';
      case AchievementStatus.COMPLETED: return '✅';
      default: return '❓';
    }
  };

  // 处理成就点击
  const handleAchievementClick = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    onAchievementClick(achievement);
  };

  // 处理分享成就
  const handleShareAchievement = async (achievementId: string) => {
    setIsSharing(true);
    const shareText = (onShareAchievement(achievementId) as unknown as string) || '';
    setShareText(shareText);

    try {
      if (navigator.share) {
        await navigator.share({
          title: '成就分享',
          text: shareText,
          url: `https://yourgame.com/achievement/${achievementId}`
        });
      } else {
        // 复制到剪贴板
        await navigator.clipboard.writeText(shareText);
        alert('分享文本已复制到剪贴板！');
      }
    } catch (error) {
      console.error('分享失败:', error);
    } finally {
      setIsSharing(false);
    }
  };

  // 处理配置更改
  const handleConfigChange = (updates: Partial<AchievementConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  // 渲染成就卡片
  const renderAchievementCard = (achievement: Achievement) => (
    <div
      key={achievement.id}
      className={`
        relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
        ${getRarityColor(achievement.rarity)}
        ${achievement.status === AchievementStatus.LOCKED ? 'opacity-60' : 'opacity-100'}
        ${achievement.isSecret ? 'bg-gradient-to-r from-gray-800 to-gray-700' : 'bg-gray-800'}
        hover:scale-105 hover:shadow-lg
      `}
      onClick={() => handleAchievementClick(achievement)}
    >
      {/* 秘密成就标识 */}
      {achievement.isSecret && (
        <div className="absolute top-2 right-2 text-yellow-400 text-sm">
          🔒 秘密
        </div>
      )}

      {/* 成就图标和状态 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{getTypeIcon(achievement.type)}</span>
          <span className="text-lg">{getStatusIcon(achievement.status)}</span>
        </div>
        <div className={`text-xs px-2 py-1 rounded border ${getRarityColor(achievement.rarity)}`}>
          {getRarityName(achievement.rarity)}
        </div>
      </div>

      {/* 成就名称 */}
      <h3 className="text-lg font-bold mb-2 truncate">
        {achievement.name}
      </h3>

      {/* 成就描述 */}
      <p className="text-sm text-gray-300 mb-3 line-clamp-2">
        {achievement.description}
      </p>

      {/* 进度条 */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span>进度</span>
          <span>{Math.round(achievement.progress.percentage)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${achievement.progress.percentage}%` }}
          />
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {achievement.progress.current} / {achievement.progress.target}
        </div>
      </div>

      {/* 奖励预览 */}
      {achievement.rewards.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-gray-400 mb-1">奖励:</div>
          <div className="flex flex-wrap gap-1">
            {achievement.rewards.slice(0, 3).map((reward, index) => (
              <span
                key={index}
                className="text-xs px-2 py-1 bg-gray-700 rounded border border-gray-600"
                title={reward.description}
              >
                {reward.type === 'experience' && '💎'}
                {reward.type === 'gold' && '💰'}
                {reward.type === 'item' && '🎁'}
                {reward.type === 'title' && '👑'}
                {reward.type === 'skill_point' && '⚡'}
                {reward.type === 'reputation' && '⭐'}
                {reward.value}
              </span>
            ))}
            {achievement.rewards.length > 3 && (
              <span className="text-xs px-2 py-1 bg-gray-700 rounded">
                +{achievement.rewards.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 解锁时间 */}
      {achievement.unlockDate && (
        <div className="text-xs text-gray-500">
          解锁时间: {new Date(achievement.unlockDate).toLocaleDateString()}
        </div>
      )}

      {/* 分享按钮 */}
      {achievement.status !== AchievementStatus.LOCKED && (
        <button
          className="absolute bottom-2 right-2 text-blue-400 hover:text-blue-300 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            handleShareAchievement(achievement.id);
          }}
          disabled={isSharing}
        >
          {isSharing ? '分享中...' : '📤'}
        </button>
      )}
    </div>
  );

  // 渲染成就详情
  const renderAchievementDetails = () => {
    if (!selectedAchievement) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">成就详情</h2>
            <button
              onClick={() => setSelectedAchievement(null)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className={`p-4 rounded-lg border-2 mb-4 ${getRarityColor(selectedAchievement.rarity)}`}>
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-3xl">{getTypeIcon(selectedAchievement.type)}</span>
              <div>
                <h3 className="text-lg font-bold">{selectedAchievement.name}</h3>
                <div className={`text-sm px-2 py-1 rounded border inline-block ${getRarityColor(selectedAchievement.rarity)}`}>
                  {getRarityName(selectedAchievement.rarity)}
                </div>
              </div>
            </div>

            <p className="text-gray-300 mb-4">{selectedAchievement.description}</p>

            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>进度</span>
                <span>{Math.round(selectedAchievement.progress.percentage)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full"
                  style={{ width: `${selectedAchievement.progress.percentage}%` }}
                />
              </div>
              <div className="text-sm text-gray-400 mt-1">
                {selectedAchievement.progress.current} / {selectedAchievement.progress.target}
              </div>
            </div>

            {selectedAchievement.rewards.length > 0 && (
              <div className="mb-4">
                <h4 className="font-bold mb-2">奖励:</h4>
                <div className="space-y-2">
                  {selectedAchievement.rewards.map((reward, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-gray-800 rounded">
                      <span className="text-lg">
                        {reward.type === 'experience' && '💎'}
                        {reward.type === 'gold' && '💰'}
                        {reward.type === 'item' && '🎁'}
                        {reward.type === 'title' && '👑'}
                        {reward.type === 'skill_point' && '⚡'}
                        {reward.type === 'reputation' && '⭐'}
                      </span>
                      <span className="flex-1">{reward.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedAchievement.unlockDate && (
              <div className="text-sm text-gray-400">
                解锁时间: {new Date(selectedAchievement.unlockDate).toLocaleString()}
              </div>
            )}
          </div>

          <div className="flex space-x-2">
            {selectedAchievement.status !== AchievementStatus.LOCKED && (
              <button
                onClick={() => handleShareAchievement(selectedAchievement.id)}
                disabled={isSharing}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors"
              >
                {isSharing ? '分享中...' : '分享成就'}
              </button>
            )}
            <button
              onClick={() => setSelectedAchievement(null)}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
        <div
          ref={containerRef}
          className="bg-gray-900 rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* 标题栏 */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">成就系统</h1>
              <p className="text-gray-400">解锁成就，获得奖励</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>

          {/* 统计信息 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.totalAchievements}</div>
              <div className="text-sm text-gray-400">总成就数</div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-400">{stats.unlockedAchievements}</div>
              <div className="text-sm text-gray-400">已解锁</div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-400">{Math.round(stats.completionRate)}%</div>
              <div className="text-sm text-gray-400">完成率</div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-400">{stats.rareAchievements}</div>
              <div className="text-sm text-gray-400">稀有成就</div>
            </div>
          </div>

          {/* 过滤和排序控制 */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-300">显示秘密成就:</label>
              <input
                type="checkbox"
                checked={config.showSecret}
                onChange={(e) => handleConfigChange({ showSecret: e.target.checked })}
                className="rounded"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-300">显示已完成:</label>
              <input
                type="checkbox"
                checked={config.showCompleted}
                onChange={(e) => handleConfigChange({ showCompleted: e.target.checked })}
                className="rounded"
              />
            </div>
            <select
              value={config.sortBy}
              onChange={(e) => handleConfigChange({ sortBy: e.target.value as any })}
              className="bg-gray-800 text-white px-3 py-1 rounded border border-gray-600"
            >
              <option value="name">按名称排序</option>
              <option value="rarity">按稀有度排序</option>
              <option value="progress">按进度排序</option>
              <option value="category">按分类排序</option>
              <option value="unlockDate">按解锁时间排序</option>
            </select>
            <select
              value={config.filterCategory}
              onChange={(e) => handleConfigChange({ filterCategory: e.target.value })}
              className="bg-gray-800 text-white px-3 py-1 rounded border border-gray-600"
            >
              <option value="all">所有分类</option>
              <option value="combat">战斗</option>
              <option value="quest">任务</option>
              <option value="collection">收集</option>
              <option value="exploration">探索</option>
              <option value="progression">进度</option>
              <option value="crafting">制作</option>
              <option value="time">时间</option>
              <option value="special">特殊</option>
            </select>
            <select
              value={config.filterRarity}
              onChange={(e) => handleConfigChange({ filterRarity: e.target.value as any })}
              className="bg-gray-800 text-white px-3 py-1 rounded border border-gray-600"
            >
              <option value="all">所有稀有度</option>
              <option value="common">普通</option>
              <option value="uncommon">罕见</option>
              <option value="rare">稀有</option>
              <option value="epic">史诗</option>
              <option value="legendary">传说</option>
            </select>
            <input
              type="text"
              placeholder="搜索成就..."
              value={config.searchQuery}
              onChange={(e) => handleConfigChange({ searchQuery: e.target.value })}
              className="bg-gray-800 text-white px-3 py-1 rounded border border-gray-600 flex-1"
            />
          </div>

          {/* 成就列表 */}
          <div className="flex-1 overflow-y-auto">
            {filteredAchievements.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                没有找到符合条件的成就
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredAchievements.map(renderAchievementCard)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 成就详情弹窗 */}
      {renderAchievementDetails()}
    </>
  );
};