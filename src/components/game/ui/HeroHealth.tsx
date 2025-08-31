import React from 'react';
import { HeroHealthProps, HealthState } from '../types/GameTypes';
import { GAME_CONSTANTS } from '../constants/gameConstants';

export const HeroHealth: React.FC<HeroHealthProps> = ({
  gameSize,
  healthStates
}) => {
  if (!healthStates || healthStates.length === 0) {
    return null;
  }

  const healthState = healthStates[0]; // 取第一个血量状态
  const healthPercentage = (healthState.current / healthState.max) * 100;

  // 计算血量条位置和尺寸
  const healthBarWidth = GAME_CONSTANTS.HEALTH_BAR_WIDTH;
  const healthBarHeight = GAME_CONSTANTS.HEALTH_BAR_HEIGHT;
  const healthBarX = 20;
  const healthBarY = 20;

  // 根据血量百分比确定颜色
  const getHealthColor = (percentage: number) => {
    if (percentage > 60) return '#00ff00'; // 绿色
    if (percentage > 30) return '#ffff00'; // 黄色
    return '#ff0000'; // 红色
  };

  const healthColor = getHealthColor(healthPercentage);

  return (
    <div
      className="fixed z-40"
      style={{
        left: `${healthBarX}px`,
        top: `${healthBarY}px`,
        width: `${healthBarWidth}px`,
        height: `${healthBarHeight}px`
      }}
    >
      {/* 血量条背景 */}
      <div className="w-full h-full bg-black bg-opacity-70 border border-white rounded">
        {/* 血量条填充 */}
        <div
          className="h-full rounded transition-all duration-300"
          style={{
            width: `${healthPercentage}%`,
            backgroundColor: healthColor
          }}
        />
      </div>

      {/* 血量文本 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white text-xs font-bold">
          {healthState.current} / {healthState.max}
        </span>
      </div>

      {/* 血量图标 */}
      <div className="absolute -left-6 top-0 w-5 h-5">
        <img
          src="/game/assets/sprites/heart.png"
          alt="Health"
          className="w-full h-full"
          style={{
            filter: healthPercentage > 30 ? 'none' : 'brightness(0.5)'
          }}
        />
      </div>
    </div>
  );
};