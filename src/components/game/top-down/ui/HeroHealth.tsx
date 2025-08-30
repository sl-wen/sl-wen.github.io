'use client';

import React from 'react';

// 生命值状态类型
export type HealthState = 'full' | 'half' | 'empty';

// 生命值组件属性
interface HeroHealthProps {
  gameSize: {
    width: number;
    height: number;
    multiplier: number;
  };
  healthStates: HealthState[];
}

// 生命值显示组件
// 移植自原项目，使用TailwindCSS替代Material-UI
const HeroHealth: React.FC<HeroHealthProps> = ({ gameSize, healthStates }) => {
  const { width, height, multiplier } = gameSize;

  // 计算容器位置
  const containerStyle = {
    imageRendering: 'pixelated' as const,
    position: 'absolute' as const,
    top: `${16 * multiplier}px`,
    left: `${(16 * multiplier) + (window.innerWidth - (width * multiplier)) / 2}px`,
    display: 'flex' as const,
  };

  // 生命值样式
  const healthStyle = {
    width: `${16 * multiplier}px`,
    height: `${16 * multiplier}px`,
  };

  // 生命值状态样式
  const getHealthStateStyle = (state: HealthState) => {
    const backgroundSize = `${48 * multiplier}px ${16 * multiplier}px`;

    switch (state) {
      case 'full':
        return {
          backgroundSize,
          background: `url("/assets/topdown/images/health.png") no-repeat 0 0`,
        };
      case 'half':
        return {
          backgroundSize,
          background: `url("/assets/topdown/images/health.png") no-repeat -${16 * multiplier}px 0`,
        };
      case 'empty':
        return {
          backgroundSize,
          background: `url("/assets/topdown/images/health.png") no-repeat -${32 * multiplier}px 0`,
        };
      default:
        return {};
    }
  };

  // 如果没有生命值状态，不渲染
  if (!healthStates || healthStates.length === 0) {
    return null;
  }

  return (
    <div style={containerStyle} className="z-10">
      {healthStates.map((healthState, index) => (
        <div
          key={index}
          style={{
            ...healthStyle,
            ...getHealthStateStyle(healthState),
          }}
          className="select-none"
        />
      ))}
    </div>
  );
};

// 默认导出
export default HeroHealth;

// 导出类型
export type { HeroHealthProps };
