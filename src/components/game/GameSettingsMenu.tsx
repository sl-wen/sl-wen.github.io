'use client';

import React from 'react';

interface GameSettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onExitGame: () => void;
  gameSettings: {
    soundEnabled: boolean;
    musicVolume: number;
    sfxVolume: number;
    fullscreen: boolean;
    autoSave: boolean;
    difficulty: string;
  };
  onSettingsChange: (settings: any) => void;
  isFullscreen: boolean;
}

const GameSettingsMenu: React.FC<GameSettingsMenuProps> = ({
  isOpen,
  onClose,
  onSave,
  onExitGame,
  gameSettings,
  onSettingsChange,
  isFullscreen
}) => {
  if (!isOpen) return null;

  const handleSettingChange = (key: string, value: any) => {
    onSettingsChange({
      ...gameSettings,
      [key]: value
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-[100] backdrop-blur-sm pb-2 sm:pb-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 sm:p-6 w-full max-w-md mx-2 sm:mx-4 border border-slate-600 shadow-2xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto">
        {/* 标题 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <span className="mr-3">⚙️</span>
            游戏  设置
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 设置选项 */}
        <div className="space-y-6">
          {/* 音频设置 */}
          <div className="bg-slate-700/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <span className="mr-2">🔊</span>
              音频设置
            </h3>

            <div className="space-y-4">
              {/* 声音开关 */}
              <div className="flex items-center justify-between">
                <span className="text-slate-300">启用声音</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gameSettings.soundEnabled}
                    onChange={(e) => handleSettingChange('soundEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300  rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* 音乐音量 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">音乐音量</span>
                  <span className="text-blue-400 font-medium">{gameSettings.musicVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={gameSettings.musicVolume}
                  onChange={(e) => handleSettingChange('musicVolume', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
                  disabled={!gameSettings.soundEnabled}
                />
              </div>

              {/* 音效音量 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">音效音量</span>
                  <span className="text-green-400 font-medium">{gameSettings.sfxVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={gameSettings.sfxVolume}
                  onChange={(e) => handleSettingChange('sfxVolume', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
                  disabled={!gameSettings.soundEnabled}
                />
              </div>
            </div>
          </div>

          {/* 游戏设置 */}
          <div className="bg-slate-700/30 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <span className="mr-2">🎮</span>
              游戏设置
            </h3>

            <div className="space-y-4">
              {/* 自动保存 */}
              <div className="flex items-center justify-between">
                <span className="text-slate-300">自动保存</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gameSettings.autoSave}
                    onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300  rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* 难度设置 */}
              <div className="space-y-2">
                <span className="text-slate-300">游戏难度</span>
                <select
                  value={gameSettings.difficulty}
                  onChange={(e) => handleSettingChange('difficulty', e.target.value)}
                  className="w-full bg-slate-600 text-white rounded-lg px-3 py-2 border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="easy">简单</option>
                  <option value="normal">普通</option>
                  <option value="hard">困难</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col space-y-3 mt-6">
          {/* 保存游戏按钮 */}
          <button
            onClick={onSave}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center"
          >
            <span className="mr-2">💾</span>
            保存游戏
          </button>

          {/* 退出游戏按钮 */}
          <button
            onClick={onExitGame}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center"
          >
            <span className="mr-2">🚪</span>
            退出游戏
          </button>

          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center"
          >
            <span className="mr-2">↩️</span>
            返回游戏
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameSettingsMenu;