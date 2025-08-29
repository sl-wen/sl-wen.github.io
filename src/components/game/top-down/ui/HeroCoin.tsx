'use client';

import React from 'react';
import { calculateGameSize } from '../utils';

// 金币组件属性
interface HeroCoinProps {
  gameSize: {
    width: number;
    height: number;
    multiplier: number;
  };
  heroCoins: number;
}

// 金币显示组件
// 移植自原项目，使用TailwindCSS替代Material-UI
const HeroCoin: React.FC<HeroCoinProps> = ({ gameSize, heroCoins }) => {
  const { width, height, multiplier } = gameSize;

  // 计算容器位置
  const containerStyle = {
    fontFamily: '"Press Start 2P"',
    fontSize: `${12 * multiplier}px`,
    textTransform: 'uppercase' as const,
    imageRendering: 'pixelated' as const,
    position: 'absolute' as const,
    top: `${32 * multiplier}px`,
    left: `${(16 * multiplier) + (window.innerWidth - (width * multiplier)) / 2}px`,
    display: 'flex' as const,
    cursor: 'default' as const,
    userSelect: 'none' as const,
  };

  // 金币图标样式
  const coinStyle = {
    backgroundSize: `${16 * multiplier}px ${16 * multiplier}px`,
    background: `url("/game/assets/images/coin.png") no-repeat 0 0`,
    width: `${16 * multiplier}px`,
    height: `${16 * multiplier}px`,
  };

  // 金币数量样式
  const getCoinTextStyle = (coins: number) => {
    const strokeSize = multiplier;
    const baseStyle = {
      fontSize: `${11 * multiplier}px`,
    };

    // 满金币特殊效果
    if (coins >= 999) {
      return {
        ...baseStyle,
        textShadow: `-${strokeSize}px 0 #FFFFFF, 0 ${strokeSize}px #FFFFFF, ${strokeSize}px 0 #FFFFFF, 0 -${strokeSize}px #FFFFFF`,
        color: '#119923',
      };
    }

    return {
      ...baseStyle,
      color: '#FFFFFF',
    };
  };

  // 格式化金币数量
  const formatCoins = (coins: number): string => {
    return coins.toString().padStart(3, '0');
  };

  // 如果没有金币数据，不渲染
  if (heroCoins === null || heroCoins === undefined) {
    return null;
  }

  return (
    <div style={containerStyle} className="z-10">
      <div style={coinStyle} className="select-none" />
      <span
        style={getCoinTextStyle(heroCoins)}
        className="ml-1 select-none"
      >
        {formatCoins(heroCoins)}
      </span>
    </div>
  );
};

// 默认导出
export default HeroCoin;

// 导出类型
export type { HeroCoinProps };