'use client';

import React, { useEffect, useState } from 'react';

// 交互提示类型
export enum InteractionType {
  NPC = 'npc',
  ITEM = 'item',
  DOOR = 'door',
  CHEST = 'chest',
  TRIGGER = 'trigger',
  SHOP = 'shop',
  QUEST = 'quest'
}

// 交互提示配置
export interface InteractionHintConfig {
  showIcon: boolean;
  showText: boolean;
  showDistance: boolean;
  iconSize: number;
  textSize: number;
  animationDuration: number;
  fadeInDuration: number;
  fadeOutDuration: number;
}

// 交互提示数据
export interface InteractionHintData {
  type: InteractionType;
  name: string;
  description?: string;
  distance: number;
  position: { x: number; y: number };
  isVisible: boolean;
  isHighlighted: boolean;
}

interface InteractionHintUIProps {
  hints: InteractionHintData[];
  config?: Partial<InteractionHintConfig>;
  onInteraction?: (hint: InteractionHintData) => void;
}

export const InteractionHintUI: React.FC<InteractionHintUIProps> = ({
  hints,
  config = {},
  onInteraction
}) => {
  const [visibleHints, setVisibleHints] = useState<InteractionHintData[]>([]);
  const [animations, setAnimations] = useState<Map<string, string>>(new Map());

  const defaultConfig: InteractionHintConfig = {
    showIcon: true,
    showText: true,
    showDistance: true,
    iconSize: 24,
    textSize: 14,
    animationDuration: 300,
    fadeInDuration: 200,
    fadeOutDuration: 150
  };

  const finalConfig = { ...defaultConfig, ...config };

  // 获取交互类型图标
  const getInteractionIcon = (type: InteractionType): string => {
    const icons = {
      [InteractionType.NPC]: '👤',
      [InteractionType.ITEM]: '📦',
      [InteractionType.DOOR]: '🚪',
      [InteractionType.CHEST]: '🗃️',
      [InteractionType.TRIGGER]: '⚡',
      [InteractionType.SHOP]: '🏪',
      [InteractionType.QUEST]: '❓'
    };
    return icons[type] || '❓';
  };

  // 获取交互类型颜色
  const getInteractionColor = (type: InteractionType): string => {
    const colors = {
      [InteractionType.NPC]: 'text-blue-400',
      [InteractionType.ITEM]: 'text-green-400',
      [InteractionType.DOOR]: 'text-yellow-400',
      [InteractionType.CHEST]: 'text-orange-400',
      [InteractionType.TRIGGER]: 'text-purple-400',
      [InteractionType.SHOP]: 'text-cyan-400',
      [InteractionType.QUEST]: 'text-red-400'
    };
    return colors[type] || 'text-gray-400';
  };

  // 获取交互类型背景色
  const getInteractionBgColor = (type: InteractionType): string => {
    const colors = {
      [InteractionType.NPC]: 'bg-blue-900/80',
      [InteractionType.ITEM]: 'bg-green-900/80',
      [InteractionType.DOOR]: 'bg-yellow-900/80',
      [InteractionType.CHEST]: 'bg-orange-900/80',
      [InteractionType.TRIGGER]: 'bg-purple-900/80',
      [InteractionType.SHOP]: 'bg-cyan-900/80',
      [InteractionType.QUEST]: 'bg-red-900/80'
    };
    return colors[type] || 'bg-gray-900/80';
  };

  // 格式化距离
  const formatDistance = (distance: number): string => {
    if (distance < 16) return '很近';
    if (distance < 32) return '近';
    if (distance < 64) return '中等';
    return '远';
  };

  // 处理交互点击
  const handleInteraction = (hint: InteractionHintData) => {
    if (onInteraction) {
      onInteraction(hint);
    }
  };

  // 更新可见提示
  useEffect(() => {
    const visible = hints.filter(hint => hint.isVisible);
    setVisibleHints(visible);

    // 添加动画
    visible.forEach(hint => {
      const key = `${hint.type}-${hint.name}`;
      if (!animations.has(key)) {
        setAnimations(prev => new Map(prev.set(key, 'fade-in')));
        
        // 动画完成后移除
        setTimeout(() => {
          setAnimations(prev => {
            const newMap = new Map(prev);
            newMap.delete(key);
            return newMap;
          });
        }, finalConfig.fadeInDuration);
      }
    });
  }, [hints, finalConfig.fadeInDuration]);

  if (visibleHints.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {visibleHints.map((hint, index) => {
        const key = `${hint.type}-${hint.name}-${index}`;
        const animation = animations.get(key) || '';
        const isHighlighted = hint.isHighlighted;

        return (
          <div
            key={key}
            className={`
              absolute pointer-events-auto
              transform -translate-x-1/2 -translate-y-full
              transition-all duration-${finalConfig.animationDuration}
              ${animation === 'fade-in' ? 'animate-fadeIn' : ''}
              ${isHighlighted ? 'scale-110' : 'scale-100'}
            `}
            style={{
              left: hint.position.x,
              top: hint.position.y - 20,
              animationDuration: `${finalConfig.fadeInDuration}ms`
            }}
            onClick={() => handleInteraction(hint)}
          >
            {/* 交互提示容器 */}
            <div
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg
                border border-white/20 shadow-lg
                ${getInteractionBgColor(hint.type)}
                ${isHighlighted ? 'ring-2 ring-white/50' : ''}
                hover:scale-105 transition-transform duration-200
                cursor-pointer
              `}
            >
              {/* 图标 */}
              {finalConfig.showIcon && (
                <div
                  className={`
                    flex items-center justify-center
                    ${getInteractionColor(hint.type)}
                    ${isHighlighted ? 'animate-pulse' : ''}
                  `}
                  style={{ fontSize: finalConfig.iconSize }}
                >
                  {getInteractionIcon(hint.type)}
                </div>
              )}

              {/* 文本内容 */}
              <div className="flex flex-col">
                {/* 名称 */}
                {finalConfig.showText && (
                  <div className="text-white font-semibold text-sm whitespace-nowrap">
                    {hint.name}
                  </div>
                )}

                {/* 描述 */}
                {hint.description && finalConfig.showText && (
                  <div className="text-gray-300 text-xs whitespace-nowrap">
                    {hint.description}
                  </div>
                )}

                {/* 距离 */}
                {finalConfig.showDistance && (
                  <div className="text-gray-400 text-xs">
                    {formatDistance(hint.distance)}
                  </div>
                )}
              </div>

              {/* 交互提示 */}
              <div className="text-white/60 text-xs ml-2">
                E
              </div>
            </div>

            {/* 连接线 */}
            <div
              className="absolute top-full left-1/2 transform -translate-x-1/2"
              style={{
                width: 2,
                height: 20,
                background: `linear-gradient(to bottom, ${getInteractionColor(hint.type).replace('text-', '')}, transparent)`
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

// 简化的交互提示组件
export const SimpleInteractionHint: React.FC<{ hint: InteractionHintData | null }> = ({ hint }) => {
  if (!hint || !hint.isVisible) {
    return null;
  }

  return (
    <div
      className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50"
      style={{
        left: hint.position.x,
        top: hint.position.y - 30
      }}
    >
      <div className="bg-black/80 text-white px-3 py-2 rounded-lg border border-white/20 text-sm">
        <div className="flex items-center gap-2">
          <span>{getInteractionIcon(hint.type)}</span>
          <span>{hint.name}</span>
          <span className="text-gray-400">按 E 交互</span>
        </div>
      </div>
    </div>
  );
};

// 移动端优化的交互提示
export const MobileInteractionHint: React.FC<{ hint: InteractionHintData | null }> = ({ hint }) => {
  if (!hint || !hint.isVisible) {
    return null;
  }

  return (
    <div
      className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-50"
      style={{
        left: hint.position.x,
        top: hint.position.y - 40
      }}
    >
      <div className="bg-black/90 text-white px-4 py-3 rounded-xl border-2 border-white/30 text-base shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getInteractionIcon(hint.type)}</span>
          <div className="flex flex-col">
            <span className="font-bold">{hint.name}</span>
            {hint.description && (
              <span className="text-gray-300 text-sm">{hint.description}</span>
            )}
          </div>
          <div className="ml-4 bg-white/20 px-2 py-1 rounded text-sm">
            点击交互
          </div>
        </div>
      </div>
    </div>
  );
};

// 游戏内交互提示组件
export const GameInteractionHint: React.FC<{
  hint: InteractionHintData | null;
  isMobile?: boolean;
}> = ({ hint, isMobile = false }) => {
  if (isMobile) {
    return <MobileInteractionHint hint={hint} />;
  }
  return <SimpleInteractionHint hint={hint} />;
};

// 工具函数：获取交互图标
export const getInteractionIcon = (type: InteractionType): string => {
  const icons = {
    [InteractionType.NPC]: '👤',
    [InteractionType.ITEM]: '📦',
    [InteractionType.DOOR]: '🚪',
    [InteractionType.CHEST]: '🗃️',
    [InteractionType.TRIGGER]: '⚡',
    [InteractionType.SHOP]: '🏪',
    [InteractionType.QUEST]: '❓'
  };
  return icons[type] || '❓';
};

// 工具函数：获取交互颜色
export const getInteractionColor = (type: InteractionType): string => {
  const colors = {
    [InteractionType.NPC]: 'text-blue-400',
    [InteractionType.ITEM]: 'text-green-400',
    [InteractionType.DOOR]: 'text-yellow-400',
    [InteractionType.CHEST]: 'text-orange-400',
    [InteractionType.TRIGGER]: 'text-purple-400',
    [InteractionType.SHOP]: 'text-cyan-400',
    [InteractionType.QUEST]: 'text-red-400'
  };
  return colors[type] || 'text-gray-400';
};

export default InteractionHintUI;