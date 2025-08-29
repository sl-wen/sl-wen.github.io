'use client';

import React, { useState, useEffect } from 'react';
import { GameSettingsManager, GameSettings } from '../systems/GameSettingsManager';

interface SettingsUIProps {
  isVisible: boolean;
  onClose: () => void;
}

export const SettingsUI: React.FC<SettingsUIProps> = ({
  isVisible,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'sound' | 'graphics' | 'controls' | 'gameplay' | 'ui' | 'performance'>('sound');
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const settingsManager = GameSettingsManager.getInstance();

  useEffect(() => {
    if (isVisible) {
      loadSettings();
    }
  }, [isVisible]);

  const loadSettings = () => {
    const currentSettings = settingsManager.getSettings();
    setSettings(currentSettings);
    setHasChanges(false);
  };

  const updateSetting = (path: string, value: any) => {
    if (!settings) return;

    const newSettings = { ...settings };
    const keys = path.split('.');
    let current: any = newSettings;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setSettings(newSettings);
    setHasChanges(true);
  };

  const applySettings = () => {
    if (settings) {
      settingsManager.updateSettings(settings);
      setHasChanges(false);
    }
  };

  const resetSettings = () => {
    if (confirm('确定要重置所有设置吗？')) {
      settingsManager.resetSettings();
      loadSettings();
    }
  };

  const applyPreset = (preset: 'low' | 'medium' | 'high' | 'ultra') => {
    settingsManager.applyPreset(preset);
    loadSettings();
  };

  const applyRecommended = () => {
    settingsManager.applyRecommendedSettings();
    loadSettings();
  };

  if (!isVisible || !settings) return null;

  const tabs = [
    { id: 'sound', name: '音效', icon: '🔊' },
    { id: 'graphics', name: '图形', icon: '🎨' },
    { id: 'controls', name: '控制', icon: '🎮' },
    { id: 'gameplay', name: '游戏', icon: '⚙️' },
    { id: 'ui', name: '界面', icon: '🖥️' },
    { id: 'performance', name: '性能', icon: '⚡' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white p-6 rounded-lg max-w-4xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">⚙️ 游戏设置</h2>
          <button
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm"
          >
            关闭
          </button>
        </div>

        {/* 标签页导航 */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tab.icon} {tab.name}
            </button>
          ))}
        </div>

        {/* 预设按钮 */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => applyPreset('low')}
            className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-xs"
          >
            低配置
          </button>
          <button
            onClick={() => applyPreset('medium')}
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs"
          >
            中配置
          </button>
          <button
            onClick={() => applyPreset('high')}
            className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs"
          >
            高配置
          </button>
          <button
            onClick={() => applyPreset('ultra')}
            className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-xs"
          >
            超高配置
          </button>
          <button
            onClick={applyRecommended}
            className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-xs"
          >
            推荐配置
          </button>
        </div>

        {/* 设置内容 */}
        <div className="space-y-6">
          {/* 音效设置 */}
          {activeTab === 'sound' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">🔊 音效设置</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    主音量: {Math.round(settings.sound.masterVolume * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.sound.masterVolume}
                    onChange={(e) => updateSetting('sound.masterVolume', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    音乐音量: {Math.round(settings.sound.musicVolume * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.sound.musicVolume}
                    onChange={(e) => updateSetting('sound.musicVolume', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    音效音量: {Math.round(settings.sound.sfxVolume * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.sound.sfxVolume}
                    onChange={(e) => updateSetting('sound.sfxVolume', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="muted"
                    checked={settings.sound.isMuted}
                    onChange={(e) => updateSetting('sound.isMuted', e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="muted" className="text-sm">
                    静音
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 图形设置 */}
          {activeTab === 'graphics' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">🎨 图形设置</h3>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="pixelArt"
                    checked={settings.graphics.pixelArt}
                    onChange={(e) => updateSetting('graphics.pixelArt', e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="pixelArt" className="text-sm">
                    像素艺术模式
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="antialias"
                    checked={settings.graphics.antialias}
                    onChange={(e) => updateSetting('graphics.antialias', e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="antialias" className="text-sm">
                    抗锯齿
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="fullscreen"
                    checked={settings.graphics.fullscreen}
                    onChange={(e) => updateSetting('graphics.fullscreen', e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="fullscreen" className="text-sm">
                    全屏模式
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    目标帧率: {settings.graphics.fps} FPS
                  </label>
                  <select
                    value={settings.graphics.fps}
                    onChange={(e) => updateSetting('graphics.fps', parseInt(e.target.value))}
                    className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm"
                  >
                    <option value={30}>30 FPS</option>
                    <option value={60}>60 FPS</option>
                    <option value={120}>120 FPS</option>
                    <option value={144}>144 FPS</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 控制设置 */}
          {activeTab === 'controls' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">🎮 控制设置</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">键盘布局</label>
                  <select
                    value={settings.controls.keyboardLayout}
                    onChange={(e) => updateSetting('controls.keyboardLayout', e.target.value)}
                    className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm"
                  >
                    <option value="qwerty">QWERTY</option>
                    <option value="azerty">AZERTY</option>
                    <option value="custom">自定义</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    鼠标灵敏度: {settings.controls.mouseSensitivity.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="3.0"
                    step="0.1"
                    value={settings.controls.mouseSensitivity}
                    onChange={(e) => updateSetting('controls.mouseSensitivity', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="touchEnabled"
                    checked={settings.controls.touchEnabled}
                    onChange={(e) => updateSetting('controls.touchEnabled', e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="touchEnabled" className="text-sm">
                    启用触摸控制
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="gamepadEnabled"
                    checked={settings.controls.gamepadEnabled}
                    onChange={(e) => updateSetting('controls.gamepadEnabled', e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="gamepadEnabled" className="text-sm">
                    启用手柄支持
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 游戏设置 */}
          {activeTab === 'gameplay' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">⚙️ 游戏设置</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">游戏难度</label>
                  <select
                    value={settings.gameplay.difficulty}
                    onChange={(e) => updateSetting('gameplay.difficulty', e.target.value)}
                    className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm"
                  >
                    <option value="easy">简单</option>
                    <option value="normal">普通</option>
                    <option value="hard">困难</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoSave"
                    checked={settings.gameplay.autoSave}
                    onChange={(e) => updateSetting('gameplay.autoSave', e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="autoSave" className="text-sm">
                    自动保存
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    保存间隔: {settings.gameplay.saveInterval} 秒
                  </label>
                  <input
                    type="range"
                    min="60"
                    max="1800"
                    step="60"
                    value={settings.gameplay.saveInterval}
                    onChange={(e) => updateSetting('gameplay.saveInterval', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="tutorialEnabled"
                    checked={settings.gameplay.tutorialEnabled}
                    onChange={(e) => updateSetting('gameplay.tutorialEnabled', e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="tutorialEnabled" className="text-sm">
                    启用教程
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="hintsEnabled"
                    checked={settings.gameplay.hintsEnabled}
                    onChange={(e) => updateSetting('gameplay.hintsEnabled', e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="hintsEnabled" className="text-sm">
                    显示提示
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 界面设置 */}
          {activeTab === 'ui' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">🖥️ 界面设置</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">语言</label>
                  <select
                    value={settings.ui.language}
                    onChange={(e) => updateSetting('ui.language', e.target.value)}
                    className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm"
                  >
                    <option value="zh-CN">简体中文</option>
                    <option value="en-US">English</option>
                    <option value="ja-JP">日本語</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">字体大小</label>
                  <select
                    value={settings.ui.fontSize}
                    onChange={(e) => updateSetting('ui.fontSize', e.target.value)}
                    className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm"
                  >
                    <option value="small">小</option>
                    <option value="medium">中</option>
                    <option value="large">大</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    界面缩放: {settings.ui.uiScale.toFixed(1)}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={settings.ui.uiScale}
                    onChange={(e) => updateSetting('ui.uiScale', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showFPS"
                    checked={settings.ui.showFPS}
                    onChange={(e) => updateSetting('ui.showFPS', e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="showFPS" className="text-sm">
                    显示FPS
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showDebugInfo"
                    checked={settings.ui.showDebugInfo}
                    onChange={(e) => updateSetting('ui.showDebugInfo', e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="showDebugInfo" className="text-sm">
                    显示调试信息
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 性能设置 */}
          {activeTab === 'performance' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">⚡ 性能设置</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    最大帧率: {settings.performance.maxFPS} FPS
                  </label>
                  <select
                    value={settings.performance.maxFPS}
                    onChange={(e) => updateSetting('performance.maxFPS', parseInt(e.target.value))}
                    className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm"
                  >
                    <option value={30}>30 FPS</option>
                    <option value={60}>60 FPS</option>
                    <option value={120}>120 FPS</option>
                    <option value={144}>144 FPS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">纹理质量</label>
                  <select
                    value={settings.performance.textureQuality}
                    onChange={(e) => updateSetting('performance.textureQuality', e.target.value)}
                    className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm"
                  >
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enableParticles"
                    checked={settings.performance.enableParticles}
                    onChange={(e) => updateSetting('performance.enableParticles', e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="enableParticles" className="text-sm">
                    启用粒子效果
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enableShadows"
                    checked={settings.performance.enableShadows}
                    onChange={(e) => updateSetting('performance.enableShadows', e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="enableShadows" className="text-sm">
                    启用阴影
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enableReflections"
                    checked={settings.performance.enableReflections}
                    onChange={(e) => updateSetting('performance.enableReflections', e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="enableReflections" className="text-sm">
                    启用反射
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 底部操作 */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-700">
          <div className="flex gap-2">
            <button
              onClick={resetSettings}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm"
            >
              重置设置
            </button>
            <button
              onClick={() => {
                const summary = settingsManager.getSettingsSummary();
                console.log('设置摘要:', summary);
                alert('设置摘要已输出到控制台');
              }}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
            >
              查看摘要
            </button>
          </div>
          
          <div className="flex gap-2">
            {hasChanges && (
              <button
                onClick={applySettings}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm"
              >
                应用更改
              </button>
            )}
            <button
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-sm"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};