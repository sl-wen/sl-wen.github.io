import React from 'react';
import { HeroCoinProps } from '../types/GameTypes';
import { GAME_CONSTANTS } from '../constants/gameConstants';

export const HeroCoin: React.FC<HeroCoinProps> = ({
  gameSize,
  heroCoins
}) => {
  // 计算金币显示位置
  const coinIconSize = GAME_CONSTANTS.COIN_ICON_SIZE;
  const coinX = gameSize.width - 100;
  const coinY = 20;

  return (
    <div
      className="fixed z-40 flex items-center bg-black bg-opacity-50 rounded-lg px-3 py-2 shadow-lg"
      style={{
        left: `${coinX}px`,
        top: `${coinY}px`
      }}
    >
      {/* 金币图标 */}
      <div
        className="mr-2 drop-shadow-lg"
        style={{
          width: `${coinIconSize}px`,
          height: `${coinIconSize}px`
        }}
      >
        <img
          src="/game/assets/images/coin.png"
          alt="Coin"
          className="w-full h-full"
        />
      </div>

      {/* 金币数量 */}
      <div className="text-yellow-400 text-lg font-bold drop-shadow-lg">
        {heroCoins}
      </div>
    </div>
  );
};