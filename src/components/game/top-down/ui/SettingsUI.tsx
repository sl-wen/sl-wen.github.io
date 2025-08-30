'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  SettingsCategory, 
  GameSettingsData,
  AudioSettings,
  VideoSettings,
  ControlSettings,
  GameSettings,
  AccessibilitySettings
} from '../systems/SettingsSystem';

// 设置界面配置接口
export interface SettingsConfig {
  activeCategory: SettingsCategory;
  showAdvanced: boolean;
  showPreview: boolean;
  autoApply: boolean;
}

// 设置界面事件接口
export interface SettingsEvent {
  type: string;
  category: SettingsCategory;
  key: string;
  value: any;
  data?: any;
}

interface SettingsUIProps {
  settings: GameSettingsData;
  config: SettingsConfig;
  onConfigChange: (config: SettingsConfig) => void;
  onSettingChange: (category: SettingsCategory, key: string, value: any) => void;
  onResetCategory: (category: SettingsCategory) => void;
  onResetAll: () => void;
  onExport: () => void;
  onImport: (data: string) => void;
  onClose: () => void;
  isVisible: boolean;
}

export const SettingsUI: React.FC<SettingsUIProps> = ({
  settings,
  config,
  onConfigChange,
  onSettingChange,
  onResetCategory,
  onResetAll,
  onExport,
  onImport,
  onClose,
  isVisible
}) => {
  const [selectedCategory, setSelectedCategory] = useState<SettingsCategory>(config.activeCategory);
  const [showAdvanced, setShowAdvanced] = useState(config.showAdvanced);
  const [showPreview, setShowPreview] = useState(config.showPreview);
  const [autoApply, setAutoApply] = useState(config.autoApply);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 更新配置
  useEffect(() => {
    onConfigChange({
      activeCategory: selectedCategory,
      showAdvanced,
      showPreview,
      autoApply
    });
  }, [selectedCategory, showAdvanced, showPreview, autoApply]);

  // 处理设置变更
  const handleSettingChange = (category: SettingsCategory, key: string, value: any) => {
    onSettingChange(category, key, value);
  };

  // 处理文件导入
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError('');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        onImport(content);
        setIsImporting(false);
      } catch (error) {
        setImportError('导入失败：文件格式错误');
        setIsImporting(false);
      }
    };
    reader.onerror = () => {
      setImportError('导入失败：无法读取文件');
      setIsImporting(false);
    };
    reader.readAsText(file);
  };

  // 触发文件选择
  const triggerFileImport = () => {
    fileInputRef.current?.click();
  };

  // 渲染音频设置
  const renderAudioSettings = () => {
    const audio = settings.audio;
    
    return (
      <div className="space-y-6">
        {/* 音量控制 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">音量控制</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">主音量</label>
              <span className="text-sm text-gray-400">{Math.round(audio.masterVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={audio.masterVolume}
              onChange={(e) => handleSettingChange(SettingsCategory.AUDIO, 'masterVolume', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">音乐音量</label>
              <span className="text-sm text-gray-400">{Math.round(audio.musicVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={audio.musicVolume}
              onChange={(e) => handleSettingChange(SettingsCategory.AUDIO, 'musicVolume', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">音效音量</label>
              <span className="text-sm text-gray-400">{Math.round(audio.sfxVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={audio.sfxVolume}
              onChange={(e) => handleSettingChange(SettingsCategory.AUDIO, 'sfxVolume', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">语音音量</label>
              <span className="text-sm text-gray-400">{Math.round(audio.voiceVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={audio.voiceVolume}
              onChange={(e) => handleSettingChange(SettingsCategory.AUDIO, 'voiceVolume', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </div>

        {/* 音频开关 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">音频开关</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">音乐</label>
              <input
                type="checkbox"
                checked={audio.musicEnabled}
                onChange={(e) => handleSettingChange(SettingsCategory.AUDIO, 'musicEnabled', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">音效</label>
              <input
                type="checkbox"
                checked={audio.sfxEnabled}
                onChange={(e) => handleSettingChange(SettingsCategory.AUDIO, 'sfxEnabled', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">语音</label>
              <input
                type="checkbox"
                checked={audio.voiceEnabled}
                onChange={(e) => handleSettingChange(SettingsCategory.AUDIO, 'voiceEnabled', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 高级音频设置 */}
        {showAdvanced && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">高级音频</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-300">动态范围</label>
                <select
                  value={audio.dynamicRange}
                  onChange={(e) => handleSettingChange(SettingsCategory.AUDIO, 'dynamicRange', e.target.value)}
                  className="bg-gray-700 text-white text-sm rounded px-3 py-1 border border-gray-600"
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-300">3D音效</label>
                <input
                  type="checkbox"
                  checked={audio.spatialAudio}
                  onChange={(e) => handleSettingChange(SettingsCategory.AUDIO, 'spatialAudio', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-300">混响效果</label>
                <input
                  type="checkbox"
                  checked={audio.reverbEnabled}
                  onChange={(e) => handleSettingChange(SettingsCategory.AUDIO, 'reverbEnabled', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 渲染视频设置
  const renderVideoSettings = () => {
    const video = settings.video;
    
    return (
      <div className="space-y-6">
        {/* 显示设置 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">显示设置</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">分辨率</label>
              <select
                value={video.resolution}
                onChange={(e) => handleSettingChange(SettingsCategory.VIDEO, 'resolution', e.target.value)}
                className="bg-gray-700 text-white text-sm rounded px-3 py-1 border border-gray-600"
              >
                <option value="1920x1080">1920x1080</option>
                <option value="2560x1440">2560x1440</option>
                <option value="3840x2160">3840x2160</option>
                <option value="1280x720">1280x720</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">全屏模式</label>
              <input
                type="checkbox"
                checked={video.fullscreen}
                onChange={(e) => handleSettingChange(SettingsCategory.VIDEO, 'fullscreen', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">垂直同步</label>
              <input
                type="checkbox"
                checked={video.vsync}
                onChange={(e) => handleSettingChange(SettingsCategory.VIDEO, 'vsync', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 画质设置 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">画质设置</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">画质预设</label>
              <select
                value={video.quality}
                onChange={(e) => handleSettingChange(SettingsCategory.VIDEO, 'quality', e.target.value)}
                className="bg-gray-700 text-white text-sm rounded px-3 py-1 border border-gray-600"
              >
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
                <option value="ultra">超高</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">帧率限制</label>
              <select
                value={video.frameRate}
                onChange={(e) => handleSettingChange(SettingsCategory.VIDEO, 'frameRate', e.target.value)}
                className="bg-gray-700 text-white text-sm rounded px-3 py-1 border border-gray-600"
              >
                <option value={30}>30 FPS</option>
                <option value={60}>60 FPS</option>
                <option value={120}>120 FPS</option>
                <option value="unlimited">无限制</option>
              </select>
            </div>
          </div>
        </div>

        {/* 颜色调整 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">颜色调整</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">亮度</label>
              <span className="text-sm text-gray-400">{Math.round(video.brightness * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.01"
              value={video.brightness}
              onChange={(e) => handleSettingChange(SettingsCategory.VIDEO, 'brightness', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">对比度</label>
              <span className="text-sm text-gray-400">{Math.round(video.contrast * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.01"
              value={video.contrast}
              onChange={(e) => handleSettingChange(SettingsCategory.VIDEO, 'contrast', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">饱和度</label>
              <span className="text-sm text-gray-400">{Math.round(video.saturation * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.01"
              value={video.saturation}
              onChange={(e) => handleSettingChange(SettingsCategory.VIDEO, 'saturation', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </div>

        {/* 高级视频设置 */}
        {showAdvanced && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">高级视频</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-300">抗锯齿</label>
                <input
                  type="checkbox"
                  checked={video.antiAliasing}
                  onChange={(e) => handleSettingChange(SettingsCategory.VIDEO, 'antiAliasing', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-300">阴影</label>
                <input
                  type="checkbox"
                  checked={video.shadows}
                  onChange={(e) => handleSettingChange(SettingsCategory.VIDEO, 'shadows', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-300">粒子效果</label>
                <input
                  type="checkbox"
                  checked={video.particles}
                  onChange={(e) => handleSettingChange(SettingsCategory.VIDEO, 'particles', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-300">泛光效果</label>
                <input
                  type="checkbox"
                  checked={video.bloom}
                  onChange={(e) => handleSettingChange(SettingsCategory.VIDEO, 'bloom', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 渲染控制设置
  const renderControlSettings = () => {
    const controls = settings.controls;
    
    return (
      <div className="space-y-6">
        {/* 按键绑定 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">按键绑定</h3>
          
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(controls.keyBindings).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <label className="text-sm text-gray-300">{getKeyBindingLabel(key)}</label>
                <button
                  className="bg-gray-700 text-white text-sm rounded px-3 py-1 border border-gray-600 hover:bg-gray-600 transition-colors"
                  onClick={() => {/* 这里可以添加按键重新绑定逻辑 */}}
                >
                  {value}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 鼠标设置 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">鼠标设置</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">鼠标灵敏度</label>
              <span className="text-sm text-gray-400">{controls.mouseSensitivity.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="5.0"
              step="0.1"
              value={controls.mouseSensitivity}
              onChange={(e) => handleSettingChange(SettingsCategory.CONTROLS, 'mouseSensitivity', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-300">反转Y轴</label>
            <input
              type="checkbox"
              checked={controls.invertY}
              onChange={(e) => handleSettingChange(SettingsCategory.CONTROLS, 'invertY', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 手柄设置 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">手柄设置</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">启用手柄</label>
              <input
                type="checkbox"
                checked={controls.gamepadEnabled}
                onChange={(e) => handleSettingChange(SettingsCategory.CONTROLS, 'gamepadEnabled', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">手柄震动</label>
              <input
                type="checkbox"
                checked={controls.gamepadVibration}
                onChange={(e) => handleSettingChange(SettingsCategory.CONTROLS, 'gamepadVibration', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 触摸控制 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">触摸控制</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">启用触摸</label>
              <input
                type="checkbox"
                checked={controls.touchEnabled}
                onChange={(e) => handleSettingChange(SettingsCategory.CONTROLS, 'touchEnabled', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 渲染游戏设置
  const renderGameSettings = () => {
    const game = settings.game;
    
    return (
      <div className="space-y-6">
        {/* 基本设置 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">基本设置</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">语言</label>
              <select
                value={game.language}
                onChange={(e) => handleSettingChange(SettingsCategory.GAME, 'language', e.target.value)}
                className="bg-gray-700 text-white text-sm rounded px-3 py-1 border border-gray-600"
              >
                <option value="zh-CN">简体中文</option>
                <option value="en-US">English</option>
                <option value="ja-JP">日本語</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">难度</label>
              <select
                value={game.difficulty}
                onChange={(e) => handleSettingChange(SettingsCategory.GAME, 'difficulty', e.target.value)}
                className="bg-gray-700 text-white text-sm rounded px-3 py-1 border border-gray-600"
              >
                <option value="easy">简单</option>
                <option value="normal">普通</option>
                <option value="hard">困难</option>
                <option value="expert">专家</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">UI缩放</label>
              <span className="text-sm text-gray-400">{Math.round(game.uiScale * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={game.uiScale}
              onChange={(e) => handleSettingChange(SettingsCategory.GAME, 'uiScale', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </div>

        {/* 显示选项 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">显示选项</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">显示帧率</label>
              <input
                type="checkbox"
                checked={game.showFPS}
                onChange={(e) => handleSettingChange(SettingsCategory.GAME, 'showFPS', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">显示伤害数字</label>
              <input
                type="checkbox"
                checked={game.showDamageNumbers}
                onChange={(e) => handleSettingChange(SettingsCategory.GAME, 'showDamageNumbers', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">显示血条</label>
              <input
                type="checkbox"
                checked={game.showHealthBars}
                onChange={(e) => handleSettingChange(SettingsCategory.GAME, 'showHealthBars', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">显示小地图</label>
              <input
                type="checkbox"
                checked={game.showMinimap}
                onChange={(e) => handleSettingChange(SettingsCategory.GAME, 'showMinimap', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">显示工具提示</label>
              <input
                type="checkbox"
                checked={game.showTooltips}
                onChange={(e) => handleSettingChange(SettingsCategory.GAME, 'showTooltips', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 特效设置 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">特效设置</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">相机震动</label>
              <input
                type="checkbox"
                checked={game.cameraShake}
                onChange={(e) => handleSettingChange(SettingsCategory.GAME, 'cameraShake', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">屏幕特效</label>
              <input
                type="checkbox"
                checked={game.screenEffects}
                onChange={(e) => handleSettingChange(SettingsCategory.GAME, 'screenEffects', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">血液特效</label>
              <input
                type="checkbox"
                checked={game.bloodEffects}
                onChange={(e) => handleSettingChange(SettingsCategory.GAME, 'bloodEffects', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">血腥程度</label>
              <select
                value={game.goreLevel}
                onChange={(e) => handleSettingChange(SettingsCategory.GAME, 'goreLevel', e.target.value)}
                className="bg-gray-700 text-white text-sm rounded px-3 py-1 border border-gray-600"
              >
                <option value="none">无</option>
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 渲染无障碍设置
  const renderAccessibilitySettings = () => {
    const accessibility = settings.accessibility;
    
    return (
      <div className="space-y-6">
        {/* 视觉辅助 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">视觉辅助</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">色盲模式</label>
              <select
                value={accessibility.colorBlindMode}
                onChange={(e) => handleSettingChange(SettingsCategory.ACCESSIBILITY, 'colorBlindMode', e.target.value)}
                className="bg-gray-700 text-white text-sm rounded px-3 py-1 border border-gray-600"
              >
                <option value="none">无</option>
                <option value="protanopia">红色盲</option>
                <option value="deuteranopia">绿色盲</option>
                <option value="tritanopia">蓝色盲</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">高对比度</label>
              <input
                type="checkbox"
                checked={accessibility.highContrast}
                onChange={(e) => handleSettingChange(SettingsCategory.ACCESSIBILITY, 'highContrast', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">大字体</label>
              <input
                type="checkbox"
                checked={accessibility.largeText}
                onChange={(e) => handleSettingChange(SettingsCategory.ACCESSIBILITY, 'largeText', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 字幕设置 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">字幕设置</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">启用字幕</label>
              <input
                type="checkbox"
                checked={accessibility.subtitles}
                onChange={(e) => handleSettingChange(SettingsCategory.ACCESSIBILITY, 'subtitles', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">字幕大小</label>
              <select
                value={accessibility.subtitleSize}
                onChange={(e) => handleSettingChange(SettingsCategory.ACCESSIBILITY, 'subtitleSize', e.target.value)}
                className="bg-gray-700 text-white text-sm rounded px-3 py-1 border border-gray-600"
              >
                <option value="small">小</option>
                <option value="medium">中</option>
                <option value="large">大</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">字幕背景</label>
              <input
                type="checkbox"
                checked={accessibility.subtitleBackground}
                onChange={(e) => handleSettingChange(SettingsCategory.ACCESSIBILITY, 'subtitleBackground', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 动画设置 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">动画设置</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">减少动画</label>
              <input
                type="checkbox"
                checked={accessibility.reducedMotion}
                onChange={(e) => handleSettingChange(SettingsCategory.ACCESSIBILITY, 'reducedMotion', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">减少粒子</label>
              <input
                type="checkbox"
                checked={accessibility.reducedParticles}
                onChange={(e) => handleSettingChange(SettingsCategory.ACCESSIBILITY, 'reducedParticles', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">简化UI</label>
              <input
                type="checkbox"
                checked={accessibility.simplifiedUI}
                onChange={(e) => handleSettingChange(SettingsCategory.ACCESSIBILITY, 'simplifiedUI', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 获取按键绑定标签
  const getKeyBindingLabel = (key: string): string => {
    const labels: { [key: string]: string } = {
      moveUp: '向上移动',
      moveDown: '向下移动',
      moveLeft: '向左移动',
      moveRight: '向右移动',
      interact: '交互',
      attack: '攻击',
      inventory: '背包',
      quest: '任务',
      map: '地图',
      menu: '菜单',
      sprint: '奔跑',
      crouch: '蹲下',
      jump: '跳跃',
      use: '使用',
      drop: '丢弃',
      chat: '聊天',
      screenshot: '截图'
    };
    return labels[key] || key;
  };

  // 渲染当前分类的设置
  const renderCurrentCategory = () => {
    switch (selectedCategory) {
      case SettingsCategory.AUDIO:
        return renderAudioSettings();
      case SettingsCategory.VIDEO:
        return renderVideoSettings();
      case SettingsCategory.CONTROLS:
        return renderControlSettings();
      case SettingsCategory.GAME:
        return renderGameSettings();
      case SettingsCategory.ACCESSIBILITY:
        return renderAccessibilitySettings();
      default:
        return <div className="text-gray-400">请选择设置分类</div>;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* 标题栏 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">游戏设置</h1>
            <p className="text-gray-400">自定义您的游戏体验</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        {/* 设置分类导航 */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {Object.values(SettingsCategory).map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {getCategoryLabel(category)}
            </button>
          ))}
        </div>

        {/* 设置选项 */}
        <div className="flex space-x-4 mb-6">
          <label className="flex items-center space-x-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={showAdvanced}
              onChange={(e) => setShowAdvanced(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <span>显示高级选项</span>
          </label>
          
          <label className="flex items-center space-x-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={showPreview}
              onChange={(e) => setShowPreview(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <span>实时预览</span>
          </label>
          
          <label className="flex items-center space-x-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={autoApply}
              onChange={(e) => setAutoApply(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <span>自动应用</span>
          </label>
        </div>

        {/* 设置内容 */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6">
            {renderCurrentCategory()}
          </div>
        </div>

        {/* 底部操作 */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-700">
          <div className="flex space-x-2">
            <button
              onClick={() => onResetCategory(selectedCategory)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm transition-colors"
            >
              重置当前分类
            </button>
            <button
              onClick={onResetAll}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm transition-colors"
            >
              重置所有设置
            </button>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={onExport}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm transition-colors"
            >
              导出设置
            </button>
            <button
              onClick={triggerFileImport}
              disabled={isImporting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors disabled:opacity-50"
            >
              {isImporting ? '导入中...' : '导入设置'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
          </div>
        </div>

        {/* 导入错误提示 */}
        {importError && (
          <div className="mt-4 p-3 bg-red-900 border border-red-600 rounded text-red-200 text-sm">
            {importError}
          </div>
        )}
      </div>
    </div>
  );
};

// 获取分类标签
const getCategoryLabel = (category: SettingsCategory): string => {
  const labels: { [key in SettingsCategory]: string } = {
    [SettingsCategory.AUDIO]: '音频',
    [SettingsCategory.VIDEO]: '视频',
    [SettingsCategory.CONTROLS]: '控制',
    [SettingsCategory.GAME]: '游戏',
    [SettingsCategory.ACCESSIBILITY]: '无障碍'
  };
  return labels[category];
};