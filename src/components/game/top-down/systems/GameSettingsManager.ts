export interface GameSettings {
  // 音效设置
  sound: {
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
    isMuted: boolean;
  };
  
  // 图形设置
  graphics: {
    pixelArt: boolean;
    antialias: boolean;
    fullscreen: boolean;
    vsync: boolean;
    fps: number;
  };
  
  // 控制设置
  controls: {
    keyboardLayout: 'qwerty' | 'azerty' | 'custom';
    mouseSensitivity: number;
    touchEnabled: boolean;
    gamepadEnabled: boolean;
  };
  
  // 游戏设置
  gameplay: {
    difficulty: 'easy' | 'normal' | 'hard';
    autoSave: boolean;
    saveInterval: number;
    tutorialEnabled: boolean;
    hintsEnabled: boolean;
  };
  
  // 界面设置
  ui: {
    language: string;
    fontSize: 'small' | 'medium' | 'large';
    uiScale: number;
    showFPS: boolean;
    showDebugInfo: boolean;
  };
  
  // 性能设置
  performance: {
    maxFPS: number;
    enableParticles: boolean;
    enableShadows: boolean;
    enableReflections: boolean;
    textureQuality: 'low' | 'medium' | 'high';
  };
}

export class GameSettingsManager {
  private static instance: GameSettingsManager;
  private settings: GameSettings;
  private onSettingsChangeCallback?: (settings: GameSettings) => void;

  private constructor() {
    this.settings = this.getDefaultSettings();
    this.loadSettings();
  }

  public static getInstance(): GameSettingsManager {
    if (!GameSettingsManager.instance) {
      GameSettingsManager.instance = new GameSettingsManager();
    }
    return GameSettingsManager.instance;
  }

  private getDefaultSettings(): GameSettings {
    return {
      sound: {
        masterVolume: 1.0,
        musicVolume: 0.7,
        sfxVolume: 0.8,
        isMuted: false
      },
      graphics: {
        pixelArt: true,
        antialias: false,
        fullscreen: false,
        vsync: true,
        fps: 60
      },
      controls: {
        keyboardLayout: 'qwerty',
        mouseSensitivity: 1.0,
        touchEnabled: true,
        gamepadEnabled: true
      },
      gameplay: {
        difficulty: 'normal',
        autoSave: true,
        saveInterval: 300, // 5分钟
        tutorialEnabled: true,
        hintsEnabled: true
      },
      ui: {
        language: 'zh-CN',
        fontSize: 'medium',
        uiScale: 1.0,
        showFPS: false,
        showDebugInfo: false
      },
      performance: {
        maxFPS: 60,
        enableParticles: true,
        enableShadows: false,
        enableReflections: false,
        textureQuality: 'medium'
      }
    };
  }

  // 获取设置
  public getSettings(): GameSettings {
    return { ...this.settings };
  }

  // 更新设置
  public updateSettings(newSettings: Partial<GameSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
    
    if (this.onSettingsChangeCallback) {
      this.onSettingsChangeCallback(this.settings);
    }

    // 触发设置更新事件
    const customEvent = new CustomEvent('settings-changed', {
      detail: { settings: this.settings }
    });
    window.dispatchEvent(customEvent);
  }

  // 音效设置
  public setMasterVolume(volume: number): void {
    this.settings.sound.masterVolume = Math.max(0, Math.min(1, volume));
    this.updateSettings({ sound: this.settings.sound });
  }

  public setMusicVolume(volume: number): void {
    this.settings.sound.musicVolume = Math.max(0, Math.min(1, volume));
    this.updateSettings({ sound: this.settings.sound });
  }

  public setSFXVolume(volume: number): void {
    this.settings.sound.sfxVolume = Math.max(0, Math.min(1, volume));
    this.updateSettings({ sound: this.settings.sound });
  }

  public setMuted(muted: boolean): void {
    this.settings.sound.isMuted = muted;
    this.updateSettings({ sound: this.settings.sound });
  }

  // 图形设置
  public setPixelArt(enabled: boolean): void {
    this.settings.graphics.pixelArt = enabled;
    this.updateSettings({ graphics: this.settings.graphics });
  }

  public setFullscreen(enabled: boolean): void {
    this.settings.graphics.fullscreen = enabled;
    this.updateSettings({ graphics: this.settings.graphics });
  }

  public setFPS(fps: number): void {
    this.settings.graphics.fps = Math.max(30, Math.min(144, fps));
    this.updateSettings({ graphics: this.settings.graphics });
  }

  // 控制设置
  public setKeyboardLayout(layout: 'qwerty' | 'azerty' | 'custom'): void {
    this.settings.controls.keyboardLayout = layout;
    this.updateSettings({ controls: this.settings.controls });
  }

  public setMouseSensitivity(sensitivity: number): void {
    this.settings.controls.mouseSensitivity = Math.max(0.1, Math.min(3.0, sensitivity));
    this.updateSettings({ controls: this.settings.controls });
  }

  // 游戏设置
  public setDifficulty(difficulty: 'easy' | 'normal' | 'hard'): void {
    this.settings.gameplay.difficulty = difficulty;
    this.updateSettings({ gameplay: this.settings.gameplay });
  }

  public setAutoSave(enabled: boolean): void {
    this.settings.gameplay.autoSave = enabled;
    this.updateSettings({ gameplay: this.settings.gameplay });
  }

  public setTutorialEnabled(enabled: boolean): void {
    this.settings.gameplay.tutorialEnabled = enabled;
    this.updateSettings({ gameplay: this.settings.gameplay });
  }

  // 界面设置
  public setLanguage(language: string): void {
    this.settings.ui.language = language;
    this.updateSettings({ ui: this.settings.ui });
  }

  public setFontSize(size: 'small' | 'medium' | 'large'): void {
    this.settings.ui.fontSize = size;
    this.updateSettings({ ui: this.settings.ui });
  }

  public setUIScale(scale: number): void {
    this.settings.ui.uiScale = Math.max(0.5, Math.min(2.0, scale));
    this.updateSettings({ ui: this.settings.ui });
  }

  public setShowFPS(show: boolean): void {
    this.settings.ui.showFPS = show;
    this.updateSettings({ ui: this.settings.ui });
  }

  public setShowDebugInfo(show: boolean): void {
    this.settings.ui.showDebugInfo = show;
    this.updateSettings({ ui: this.settings.ui });
  }

  // 性能设置
  public setMaxFPS(fps: number): void {
    this.settings.performance.maxFPS = Math.max(30, Math.min(144, fps));
    this.updateSettings({ performance: this.settings.performance });
  }

  public setTextureQuality(quality: 'low' | 'medium' | 'high'): void {
    this.settings.performance.textureQuality = quality;
    this.updateSettings({ performance: this.settings.performance });
  }

  public setEnableParticles(enabled: boolean): void {
    this.settings.performance.enableParticles = enabled;
    this.updateSettings({ performance: this.settings.performance });
  }

  // 预设配置
  public applyPreset(preset: 'low' | 'medium' | 'high' | 'ultra'): void {
    switch (preset) {
      case 'low':
        this.updateSettings({
          graphics: {
            ...this.settings.graphics,
            pixelArt: true,
            antialias: false,
            fps: 30
          },
          performance: {
            ...this.settings.performance,
            maxFPS: 30,
            enableParticles: false,
            enableShadows: false,
            enableReflections: false,
            textureQuality: 'low'
          }
        });
        break;
      case 'medium':
        this.updateSettings({
          graphics: {
            ...this.settings.graphics,
            pixelArt: true,
            antialias: false,
            fps: 60
          },
          performance: {
            ...this.settings.performance,
            maxFPS: 60,
            enableParticles: true,
            enableShadows: false,
            enableReflections: false,
            textureQuality: 'medium'
          }
        });
        break;
      case 'high':
        this.updateSettings({
          graphics: {
            ...this.settings.graphics,
            pixelArt: false,
            antialias: true,
            fps: 60
          },
          performance: {
            ...this.settings.performance,
            maxFPS: 60,
            enableParticles: true,
            enableShadows: true,
            enableReflections: false,
            textureQuality: 'high'
          }
        });
        break;
      case 'ultra':
        this.updateSettings({
          graphics: {
            ...this.settings.graphics,
            pixelArt: false,
            antialias: true,
            fps: 144
          },
          performance: {
            ...this.settings.performance,
            maxFPS: 144,
            enableParticles: true,
            enableShadows: true,
            enableReflections: true,
            textureQuality: 'high'
          }
        });
        break;
    }
  }

  // 重置设置
  public resetSettings(): void {
    this.settings = this.getDefaultSettings();
    this.saveSettings();
    
    if (this.onSettingsChangeCallback) {
      this.onSettingsChangeCallback(this.settings);
    }
  }

  // 导出设置
  public exportSettings(): string {
    return JSON.stringify(this.settings, null, 2);
  }

  // 导入设置
  public importSettings(settingsJson: string): boolean {
    try {
      const importedSettings = JSON.parse(settingsJson);
      this.settings = { ...this.getDefaultSettings(), ...importedSettings };
      this.saveSettings();
      
      if (this.onSettingsChangeCallback) {
        this.onSettingsChangeCallback(this.settings);
      }
      
      return true;
    } catch (error) {
      console.error('导入设置失败:', error);
      return false;
    }
  }

  // 获取设置建议
  public getRecommendedSettings(): GameSettings {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isLowEnd = navigator.hardwareConcurrency <= 2;

    if (isMobile || isLowEnd) {
      return {
        ...this.getDefaultSettings(),
        graphics: {
          ...this.getDefaultSettings().graphics,
          pixelArt: true,
          antialias: false,
          fps: 30
        },
        performance: {
          ...this.getDefaultSettings().performance,
          maxFPS: 30,
          enableParticles: false,
          enableShadows: false,
          enableReflections: false,
          textureQuality: 'low'
        }
      };
    }

    return this.getDefaultSettings();
  }

  // 应用推荐设置
  public applyRecommendedSettings(): void {
    const recommended = this.getRecommendedSettings();
    this.updateSettings(recommended);
  }

  // 回调设置
  public setOnSettingsChange(callback: (settings: GameSettings) => void): void {
    this.onSettingsChangeCallback = callback;
  }

  // 数据持久化
  private saveSettings(): void {
    try {
      localStorage.setItem('game_settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  }

  private loadSettings(): void {
    try {
      const savedSettings = localStorage.getItem('game_settings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        this.settings = { ...this.getDefaultSettings(), ...parsedSettings };
      }
    } catch (error) {
      console.error('加载设置失败:', error);
    }
  }

  // 获取设置摘要
  public getSettingsSummary(): string {
    const { sound, graphics, gameplay, ui, performance } = this.settings;
    
    return `
游戏设置摘要
==============

音效设置:
- 主音量: ${Math.round(sound.masterVolume * 100)}%
- 音乐音量: ${Math.round(sound.musicVolume * 100)}%
- 音效音量: ${Math.round(sound.sfxVolume * 100)}%
- 静音: ${sound.isMuted ? '是' : '否'}

图形设置:
- 像素艺术: ${graphics.pixelArt ? '开启' : '关闭'}
- 抗锯齿: ${graphics.antialias ? '开启' : '关闭'}
- 全屏: ${graphics.fullscreen ? '开启' : '关闭'}
- 帧率: ${graphics.fps} FPS

游戏设置:
- 难度: ${gameplay.difficulty}
- 自动保存: ${gameplay.autoSave ? '开启' : '关闭'}
- 教程: ${gameplay.tutorialEnabled ? '开启' : '关闭'}

界面设置:
- 语言: ${ui.language}
- 字体大小: ${ui.fontSize}
- 显示FPS: ${ui.showFPS ? '开启' : '关闭'}

性能设置:
- 最大帧率: ${performance.maxFPS} FPS
- 粒子效果: ${performance.enableParticles ? '开启' : '关闭'}
- 阴影: ${performance.enableShadows ? '开启' : '关闭'}
- 纹理质量: ${performance.textureQuality}
    `.trim();
  }
}