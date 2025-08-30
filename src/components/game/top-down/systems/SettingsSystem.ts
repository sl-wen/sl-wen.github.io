import * as Phaser from 'phaser';

// 设置类型枚举
export enum SettingsCategory {
  AUDIO = 'audio',
  VIDEO = 'video',
  CONTROLS = 'controls',
  GAME = 'game',
  ACCESSIBILITY = 'accessibility'
}

// 音频设置接口
export interface AudioSettings {
  masterVolume: number;      // 主音量 (0-1)
  musicVolume: number;       // 音乐音量 (0-1)
  sfxVolume: number;         // 音效音量 (0-1)
  voiceVolume: number;       // 语音音量 (0-1)
  musicEnabled: boolean;     // 音乐开关
  sfxEnabled: boolean;       // 音效开关
  voiceEnabled: boolean;     // 语音开关
  ambientVolume: number;     // 环境音音量 (0-1)
  uiVolume: number;          // UI音效音量 (0-1)
  dynamicRange: 'low' | 'medium' | 'high'; // 动态范围
  spatialAudio: boolean;     // 3D音效
  reverbEnabled: boolean;    // 混响效果
  equalizer: {               // 均衡器设置
    bass: number;            // 低音 (-10 to 10)
    mid: number;             // 中音 (-10 to 10)
    treble: number;          // 高音 (-10 to 10)
  };
}

// 视频设置接口
export interface VideoSettings {
  resolution: string;        // 分辨率
  fullscreen: boolean;       // 全屏模式
  vsync: boolean;           // 垂直同步
  quality: 'low' | 'medium' | 'high' | 'ultra'; // 画质
  brightness: number;        // 亮度 (0-2)
  contrast: number;          // 对比度 (0-2)
  saturation: number;        // 饱和度 (0-2)
  gamma: number;             // 伽马值 (0-2)
  antiAliasing: boolean;     // 抗锯齿
  shadows: boolean;          // 阴影
  reflections: boolean;      // 反射
  particles: boolean;        // 粒子效果
  bloom: boolean;            // 泛光效果
  motionBlur: boolean;       // 运动模糊
  depthOfField: boolean;     // 景深效果
  frameRate: 30 | 60 | 120 | 'unlimited'; // 帧率限制
  renderScale: number;       // 渲染缩放 (0.5-2.0)
}

// 控制设置接口
export interface ControlSettings {
  keyBindings: {             // 按键绑定
    moveUp: string;
    moveDown: string;
    moveLeft: string;
    moveRight: string;
    interact: string;
    attack: string;
    inventory: string;
    quest: string;
    map: string;
    menu: string;
    sprint: string;
    crouch: string;
    jump: string;
    use: string;
    drop: string;
    chat: string;
    screenshot: string;
  };
  mouseSensitivity: number;  // 鼠标灵敏度 (0.1-5.0)
  invertY: boolean;          // 反转Y轴
  invertX: boolean;          // 反转X轴
  gamepadEnabled: boolean;   // 手柄启用
  gamepadSensitivity: number; // 手柄灵敏度 (0.1-5.0)
  gamepadVibration: boolean; // 手柄震动
  gamepadDeadzone: number;   // 手柄死区 (0-1)
  touchEnabled: boolean;     // 触摸控制启用
  touchSensitivity: number;  // 触摸灵敏度 (0.1-5.0)
  autoRun: boolean;          // 自动奔跑
  toggleCrouch: boolean;     // 切换蹲下
  holdToSprint: boolean;     // 按住奔跑
}

// 游戏设置接口
export interface GameSettings {
  language: string;          // 语言
  difficulty: 'easy' | 'normal' | 'hard' | 'expert'; // 难度
  autoSave: boolean;         // 自动存档
  autoSaveInterval: number;  // 自动存档间隔 (分钟)
  showHints: boolean;        // 显示提示
  showTutorial: boolean;     // 显示教程
  uiScale: number;           // UI缩放 (0.5-2.0)
  showFPS: boolean;          // 显示帧率
  showCoordinates: boolean;  // 显示坐标
  showDamageNumbers: boolean; // 显示伤害数字
  showHealthBars: boolean;   // 显示血条
  showMinimap: boolean;      // 显示小地图
  showQuestMarkers: boolean; // 显示任务标记
  showItemNames: boolean;    // 显示物品名称
  showTooltips: boolean;     // 显示工具提示
  cameraShake: boolean;      // 相机震动
  screenEffects: boolean;    // 屏幕特效
  bloodEffects: boolean;     // 血液特效
  goreLevel: 'none' | 'low' | 'medium' | 'high'; // 血腥程度
  matureContent: boolean;    // 成人内容
  profanityFilter: boolean;  // 脏话过滤
}

// 无障碍设置接口
export interface AccessibilitySettings {
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'; // 色盲模式
  highContrast: boolean;     // 高对比度
  largeText: boolean;        // 大字体
  screenReader: boolean;     // 屏幕阅读器
  subtitles: boolean;        // 字幕
  subtitleSize: 'small' | 'medium' | 'large'; // 字幕大小
  subtitleColor: string;     // 字幕颜色
  subtitleBackground: boolean; // 字幕背景
  audioDescriptions: boolean; // 音频描述
  reducedMotion: boolean;    // 减少动画
  reducedParticles: boolean; // 减少粒子
  simplifiedUI: boolean;     // 简化UI
  oneHandedMode: boolean;    // 单手模式
  voiceCommands: boolean;    // 语音命令
  eyeTracking: boolean;      // 眼动追踪
}

// 完整设置接口
export interface GameSettingsData {
  audio: AudioSettings;
  video: VideoSettings;
  controls: ControlSettings;
  game: GameSettings;
  accessibility: AccessibilitySettings;
  version: string;
  lastModified: number;
}

// 设置事件接口
export interface SettingsEvent {
  type: string;
  category: SettingsCategory;
  key: string;
  value: any;
  timestamp: number;
}

export class SettingsSystem {
  private scene: Phaser.Scene;
  private settings: GameSettingsData;
  private eventListeners: Map<string, Function[]>;
  private storageKey: string;
  private defaultSettings: GameSettingsData;
  private isInitialized: boolean;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.eventListeners = new Map();
    this.storageKey = 'game_settings';
    this.isInitialized = false;

    this.defaultSettings = this.createDefaultSettings();
    this.settings = { ...this.defaultSettings };

    this.initializeSettings();
    this.setupEventListeners();
  }

  /**
   * 创建默认设置
   */
  private createDefaultSettings(): GameSettingsData {
    return {
      audio: {
        masterVolume: 1.0,
        musicVolume: 0.8,
        sfxVolume: 1.0,
        voiceVolume: 1.0,
        musicEnabled: true,
        sfxEnabled: true,
        voiceEnabled: true,
        ambientVolume: 0.7,
        uiVolume: 0.9,
        dynamicRange: 'medium',
        spatialAudio: true,
        reverbEnabled: true,
        equalizer: {
          bass: 0,
          mid: 0,
          treble: 0
        }
      },
      
      video: {
        resolution: '1920x1080',
        fullscreen: false,
        vsync: true,
        quality: 'high',
        brightness: 1.0,
        contrast: 1.0,
        saturation: 1.0,
        gamma: 1.0,
        antiAliasing: true,
        shadows: true,
        reflections: true,
        particles: true,
        bloom: true,
        motionBlur: false,
        depthOfField: false,
        frameRate: 60,
        renderScale: 1.0
      },
      
      controls: {
        keyBindings: {
          moveUp: 'W',
          moveDown: 'S',
          moveLeft: 'A',
          moveRight: 'D',
          interact: 'E',
          attack: 'SPACE',
          inventory: 'I',
          quest: 'L',
          map: 'M',
          menu: 'ESC',
          sprint: 'SHIFT',
          crouch: 'CTRL',
          jump: 'SPACE',
          use: 'F',
          drop: 'Q',
          chat: 'ENTER',
          screenshot: 'F12'
        },
        mouseSensitivity: 1.0,
        invertY: false,
        invertX: false,
        gamepadEnabled: true,
        gamepadSensitivity: 1.0,
        gamepadVibration: true,
        gamepadDeadzone: 0.1,
        touchEnabled: true,
        touchSensitivity: 1.0,
        autoRun: false,
        toggleCrouch: false,
        holdToSprint: true
      },
      
      game: {
        language: 'zh-CN',
        difficulty: 'normal',
        autoSave: true,
        autoSaveInterval: 5,
        showHints: true,
        showTutorial: true,
        uiScale: 1.0,
        showFPS: false,
        showCoordinates: false,
        showDamageNumbers: true,
        showHealthBars: true,
        showMinimap: true,
        showQuestMarkers: true,
        showItemNames: true,
        showTooltips: true,
        cameraShake: true,
        screenEffects: true,
        bloodEffects: true,
        goreLevel: 'medium',
        matureContent: false,
        profanityFilter: true
      },
      
      accessibility: {
        colorBlindMode: 'none',
        highContrast: false,
        largeText: false,
        screenReader: false,
        subtitles: true,
        subtitleSize: 'medium',
        subtitleColor: '#ffffff',
        subtitleBackground: true,
        audioDescriptions: false,
        reducedMotion: false,
        reducedParticles: false,
        simplifiedUI: false,
        oneHandedMode: false,
        voiceCommands: false,
        eyeTracking: false
      },
      
      version: '1.0.0',
      lastModified: Date.now()
    };
  }

  /**
   * 初始化设置
   */
  private initializeSettings(): void {
    try {
      // 尝试从本地存储加载设置
      const savedSettings = this.loadFromStorage();
      if (savedSettings) {
        // 合并保存的设置和默认设置
        this.settings = this.mergeSettings(this.defaultSettings, savedSettings);
      }
      
      // 应用设置到游戏
      this.applySettings();
      this.isInitialized = true;
      
      console.log('设置系统初始化完成');
    } catch (error) {
      console.error('设置系统初始化失败:', error);
      // 使用默认设置
      this.settings = { ...this.defaultSettings };
    }
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听游戏事件
    this.scene.events.on('settings_changed', this.handleSettingsChanged, this);
  }

  /**
   * 合并设置
   */
  private mergeSettings(defaultSettings: GameSettingsData, savedSettings: any): GameSettingsData {
    const merged = { ...defaultSettings };
    
    // 递归合并对象
    const mergeObject = (target: any, source: any) => {
      for (const key in source) {
        if (source.hasOwnProperty(key)) {
          if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
            if (!target[key] || typeof target[key] !== 'object') {
              target[key] = {};
            }
            mergeObject(target[key], source[key]);
          } else {
            target[key] = source[key];
          }
        }
      }
    };
    
    mergeObject(merged, savedSettings);
    return merged;
  }

  /**
   * 获取设置值
   */
  public getSetting<T>(category: SettingsCategory, key: string): T {
    if (!this.isInitialized) {
      console.warn('设置系统尚未初始化');
      return this.defaultSettings[category][key] as T;
    }
    
    return this.settings[category][key] as T;
  }

  /**
   * 设置值
   */
  public setSetting(category: SettingsCategory, key: string, value: any): void {
    if (!this.isInitialized) {
      console.warn('设置系统尚未初始化');
      return;
    }
    
    const oldValue = this.settings[category][key];
    this.settings[category][key] = value;
    this.settings.lastModified = Date.now();
    
    // 应用设置
    this.applySetting(category, key, value);
    
    // 保存到存储
    this.saveToStorage();
    
    // 发出事件
    this.emitEvent('setting_changed', {
      category,
      key,
      value,
      oldValue
    });
    
    console.log(`设置已更新: ${category}.${key} = ${value}`);
  }

  /**
   * 批量设置
   */
  public setSettings(category: SettingsCategory, settings: Partial<any>): void {
    if (!this.isInitialized) {
      console.warn('设置系统尚未初始化');
      return;
    }
    
    for (const [key, value] of Object.entries(settings)) {
      this.setSetting(category, key, value);
    }
  }

  /**
   * 重置设置
   */
  public resetSettings(category?: SettingsCategory): void {
    if (category) {
      // 重置特定分类
      this.settings[category] = { ...this.defaultSettings[category] };
      this.applyCategorySettings(category);
    } else {
      // 重置所有设置
      this.settings = { ...this.defaultSettings };
      this.applySettings();
    }
    
    this.settings.lastModified = Date.now();
    this.saveToStorage();
    
    this.emitEvent('settings_reset', { category });
    console.log(`设置已重置${category ? ` (${category})` : ''}`);
  }

  /**
   * 应用设置
   */
  private applySettings(): void {
    this.applyCategorySettings(SettingsCategory.AUDIO);
    this.applyCategorySettings(SettingsCategory.VIDEO);
    this.applyCategorySettings(SettingsCategory.CONTROLS);
    this.applyCategorySettings(SettingsCategory.GAME);
    this.applyCategorySettings(SettingsCategory.ACCESSIBILITY);
  }

  /**
   * 应用分类设置
   */
  private applyCategorySettings(category: SettingsCategory): void {
    switch (category) {
      case SettingsCategory.AUDIO:
        this.applyAudioSettings();
        break;
      case SettingsCategory.VIDEO:
        this.applyVideoSettings();
        break;
      case SettingsCategory.CONTROLS:
        this.applyControlSettings();
        break;
      case SettingsCategory.GAME:
        this.applyGameSettings();
        break;
      case SettingsCategory.ACCESSIBILITY:
        this.applyAccessibilitySettings();
        break;
    }
  }

  /**
   * 应用单个设置
   */
  private applySetting(category: SettingsCategory, key: string, value: any): void {
    switch (category) {
      case SettingsCategory.AUDIO:
        this.applyAudioSetting(key, value);
        break;
      case SettingsCategory.VIDEO:
        this.applyVideoSetting(key, value);
        break;
      case SettingsCategory.CONTROLS:
        this.applyControlSetting(key, value);
        break;
      case SettingsCategory.GAME:
        this.applyGameSetting(key, value);
        break;
      case SettingsCategory.ACCESSIBILITY:
        this.applyAccessibilitySetting(key, value);
        break;
    }
  }

  /**
   * 应用音频设置
   */
  private applyAudioSettings(): void {
    const audio = this.settings.audio;
    
    // 设置音量
    this.scene.events.emit('set_master_volume', { volume: audio.masterVolume });
    this.scene.events.emit('set_music_volume', { volume: audio.musicVolume });
    this.scene.events.emit('set_sfx_volume', { volume: audio.sfxVolume });
    this.scene.events.emit('set_voice_volume', { volume: audio.voiceVolume });
    this.scene.events.emit('set_ambient_volume', { volume: audio.ambientVolume });
    this.scene.events.emit('set_ui_volume', { volume: audio.uiVolume });
    
    // 设置开关
    this.scene.events.emit('set_music_enabled', { enabled: audio.musicEnabled });
    this.scene.events.emit('set_sfx_enabled', { enabled: audio.sfxEnabled });
    this.scene.events.emit('set_voice_enabled', { enabled: audio.voiceEnabled });
    
    // 设置高级选项
    this.scene.events.emit('set_spatial_audio', { enabled: audio.spatialAudio });
    this.scene.events.emit('set_reverb_enabled', { enabled: audio.reverbEnabled });
    this.scene.events.emit('set_dynamic_range', { range: audio.dynamicRange });
    this.scene.events.emit('set_equalizer', { equalizer: audio.equalizer });
  }

  /**
   * 应用音频单个设置
   */
  private applyAudioSetting(key: string, value: any): void {
    switch (key) {
      case 'masterVolume':
        this.scene.events.emit('set_master_volume', { volume: value });
        break;
      case 'musicVolume':
        this.scene.events.emit('set_music_volume', { volume: value });
        break;
      case 'sfxVolume':
        this.scene.events.emit('set_sfx_volume', { volume: value });
        break;
      case 'voiceVolume':
        this.scene.events.emit('set_voice_volume', { volume: value });
        break;
      case 'musicEnabled':
        this.scene.events.emit('set_music_enabled', { enabled: value });
        break;
      case 'sfxEnabled':
        this.scene.events.emit('set_sfx_enabled', { enabled: value });
        break;
      case 'voiceEnabled':
        this.scene.events.emit('set_voice_enabled', { enabled: value });
        break;
      case 'spatialAudio':
        this.scene.events.emit('set_spatial_audio', { enabled: value });
        break;
      case 'reverbEnabled':
        this.scene.events.emit('set_reverb_enabled', { enabled: value });
        break;
    }
  }

  /**
   * 应用视频设置
   */
  private applyVideoSettings(): void {
    const video = this.settings.video;
    
    // 设置分辨率
    this.scene.events.emit('set_resolution', { resolution: video.resolution });
    
    // 设置全屏
    this.scene.events.emit('set_fullscreen', { fullscreen: video.fullscreen });
    
    // 设置画质
    this.scene.events.emit('set_quality', { quality: video.quality });
    
    // 设置垂直同步
    this.scene.events.emit('set_vsync', { vsync: video.vsync });
    
    // 设置帧率
    this.scene.events.emit('set_frame_rate', { frameRate: video.frameRate });
    
    // 设置渲染缩放
    this.scene.events.emit('set_render_scale', { scale: video.renderScale });
    
    // 设置视觉效果
    this.scene.events.emit('set_anti_aliasing', { enabled: video.antiAliasing });
    this.scene.events.emit('set_shadows', { enabled: video.shadows });
    this.scene.events.emit('set_reflections', { enabled: video.reflections });
    this.scene.events.emit('set_particles', { enabled: video.particles });
    this.scene.events.emit('set_bloom', { enabled: video.bloom });
    this.scene.events.emit('set_motion_blur', { enabled: video.motionBlur });
    this.scene.events.emit('set_depth_of_field', { enabled: video.depthOfField });
    
    // 设置颜色调整
    this.scene.events.emit('set_brightness', { brightness: video.brightness });
    this.scene.events.emit('set_contrast', { contrast: video.contrast });
    this.scene.events.emit('set_saturation', { saturation: video.saturation });
    this.scene.events.emit('set_gamma', { gamma: video.gamma });
  }

  /**
   * 应用视频单个设置
   */
  private applyVideoSetting(key: string, value: any): void {
    switch (key) {
      case 'resolution':
        this.scene.events.emit('set_resolution', { resolution: value });
        break;
      case 'fullscreen':
        this.scene.events.emit('set_fullscreen', { fullscreen: value });
        break;
      case 'quality':
        this.scene.events.emit('set_quality', { quality: value });
        break;
      case 'vsync':
        this.scene.events.emit('set_vsync', { vsync: value });
        break;
      case 'frameRate':
        this.scene.events.emit('set_frame_rate', { frameRate: value });
        break;
      case 'brightness':
        this.scene.events.emit('set_brightness', { brightness: value });
        break;
      case 'contrast':
        this.scene.events.emit('set_contrast', { contrast: value });
        break;
      case 'saturation':
        this.scene.events.emit('set_saturation', { saturation: value });
        break;
      case 'gamma':
        this.scene.events.emit('set_gamma', { gamma: value });
        break;
    }
  }

  /**
   * 应用控制设置
   */
  private applyControlSettings(): void {
    const controls = this.settings.controls;
    
    // 设置按键绑定
    this.scene.events.emit('set_key_bindings', { bindings: controls.keyBindings });
    
    // 设置鼠标灵敏度
    this.scene.events.emit('set_mouse_sensitivity', { sensitivity: controls.mouseSensitivity });
    
    // 设置手柄设置
    this.scene.events.emit('set_gamepad_enabled', { enabled: controls.gamepadEnabled });
    this.scene.events.emit('set_gamepad_sensitivity', { sensitivity: controls.gamepadSensitivity });
    this.scene.events.emit('set_gamepad_vibration', { enabled: controls.gamepadVibration });
    this.scene.events.emit('set_gamepad_deadzone', { deadzone: controls.gamepadDeadzone });
    
    // 设置触摸控制
    this.scene.events.emit('set_touch_enabled', { enabled: controls.touchEnabled });
    this.scene.events.emit('set_touch_sensitivity', { sensitivity: controls.touchSensitivity });
  }

  /**
   * 应用控制单个设置
   */
  private applyControlSetting(key: string, value: any): void {
    switch (key) {
      case 'keyBindings':
        this.scene.events.emit('set_key_bindings', { bindings: value });
        break;
      case 'mouseSensitivity':
        this.scene.events.emit('set_mouse_sensitivity', { sensitivity: value });
        break;
      case 'gamepadEnabled':
        this.scene.events.emit('set_gamepad_enabled', { enabled: value });
        break;
      case 'gamepadSensitivity':
        this.scene.events.emit('set_gamepad_sensitivity', { sensitivity: value });
        break;
      case 'gamepadVibration':
        this.scene.events.emit('set_gamepad_vibration', { enabled: value });
        break;
      case 'touchEnabled':
        this.scene.events.emit('set_touch_enabled', { enabled: value });
        break;
    }
  }

  /**
   * 应用游戏设置
   */
  private applyGameSettings(): void {
    const game = this.settings.game;
    
    // 设置语言
    this.scene.events.emit('set_language', { language: game.language });
    
    // 设置难度
    this.scene.events.emit('set_difficulty', { difficulty: game.difficulty });
    
    // 设置UI缩放
    this.scene.events.emit('set_ui_scale', { scale: game.uiScale });
    
    // 设置显示选项
    this.scene.events.emit('set_show_fps', { show: game.showFPS });
    this.scene.events.emit('set_show_coordinates', { show: game.showCoordinates });
    this.scene.events.emit('set_show_damage_numbers', { show: game.showDamageNumbers });
    this.scene.events.emit('set_show_health_bars', { show: game.showHealthBars });
    this.scene.events.emit('set_show_minimap', { show: game.showMinimap });
    this.scene.events.emit('set_show_quest_markers', { show: game.showQuestMarkers });
    this.scene.events.emit('set_show_item_names', { show: game.showItemNames });
    this.scene.events.emit('set_show_tooltips', { show: game.showTooltips });
    
    // 设置特效
    this.scene.events.emit('set_camera_shake', { enabled: game.cameraShake });
    this.scene.events.emit('set_screen_effects', { enabled: game.screenEffects });
    this.scene.events.emit('set_blood_effects', { enabled: game.bloodEffects });
    this.scene.events.emit('set_gore_level', { level: game.goreLevel });
  }

  /**
   * 应用游戏单个设置
   */
  private applyGameSetting(key: string, value: any): void {
    switch (key) {
      case 'language':
        this.scene.events.emit('set_language', { language: value });
        break;
      case 'difficulty':
        this.scene.events.emit('set_difficulty', { difficulty: value });
        break;
      case 'uiScale':
        this.scene.events.emit('set_ui_scale', { scale: value });
        break;
      case 'showFPS':
        this.scene.events.emit('set_show_fps', { show: value });
        break;
      case 'showDamageNumbers':
        this.scene.events.emit('set_show_damage_numbers', { show: value });
        break;
      case 'showHealthBars':
        this.scene.events.emit('set_show_health_bars', { show: value });
        break;
      case 'cameraShake':
        this.scene.events.emit('set_camera_shake', { enabled: value });
        break;
      case 'bloodEffects':
        this.scene.events.emit('set_blood_effects', { enabled: value });
        break;
    }
  }

  /**
   * 应用无障碍设置
   */
  private applyAccessibilitySettings(): void {
    const accessibility = this.settings.accessibility;
    
    // 设置色盲模式
    this.scene.events.emit('set_color_blind_mode', { mode: accessibility.colorBlindMode });
    
    // 设置高对比度
    this.scene.events.emit('set_high_contrast', { enabled: accessibility.highContrast });
    
    // 设置大字体
    this.scene.events.emit('set_large_text', { enabled: accessibility.largeText });
    
    // 设置字幕
    this.scene.events.emit('set_subtitles', { enabled: accessibility.subtitles });
    this.scene.events.emit('set_subtitle_size', { size: accessibility.subtitleSize });
    this.scene.events.emit('set_subtitle_color', { color: accessibility.subtitleColor });
    this.scene.events.emit('set_subtitle_background', { enabled: accessibility.subtitleBackground });
    
    // 设置减少动画
    this.scene.events.emit('set_reduced_motion', { enabled: accessibility.reducedMotion });
    this.scene.events.emit('set_reduced_particles', { enabled: accessibility.reducedParticles });
    
    // 设置简化UI
    this.scene.events.emit('set_simplified_ui', { enabled: accessibility.simplifiedUI });
  }

  /**
   * 应用无障碍单个设置
   */
  private applyAccessibilitySetting(key: string, value: any): void {
    switch (key) {
      case 'colorBlindMode':
        this.scene.events.emit('set_color_blind_mode', { mode: value });
        break;
      case 'highContrast':
        this.scene.events.emit('set_high_contrast', { enabled: value });
        break;
      case 'largeText':
        this.scene.events.emit('set_large_text', { enabled: value });
        break;
      case 'subtitles':
        this.scene.events.emit('set_subtitles', { enabled: value });
        break;
      case 'reducedMotion':
        this.scene.events.emit('set_reduced_motion', { enabled: value });
        break;
      case 'simplifiedUI':
        this.scene.events.emit('set_simplified_ui', { enabled: value });
        break;
    }
  }

  /**
   * 获取所有设置
   */
  public getAllSettings(): GameSettingsData {
    return { ...this.settings };
  }

  /**
   * 获取分类设置
   */
  public getCategorySettings(category: SettingsCategory): any {
    return { ...this.settings[category] };
  }

  /**
   * 导出设置
   */
  public exportSettings(): string {
    const exportData = {
      ...this.settings,
      exportedAt: Date.now(),
      exportVersion: this.settings.version
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * 导入设置
   */
  public importSettings(settingsJson: string): boolean {
    try {
      const importData = JSON.parse(settingsJson);
      
      // 验证导入数据
      if (!this.validateSettings(importData)) {
        throw new Error('设置数据格式无效');
      }
      
      // 合并设置
      this.settings = this.mergeSettings(this.defaultSettings, importData);
      this.settings.lastModified = Date.now();
      
      // 应用设置
      this.applySettings();
      
      // 保存到存储
      this.saveToStorage();
      
      this.emitEvent('settings_imported', { settings: this.settings });
      console.log('设置导入成功');
      return true;
    } catch (error) {
      console.error('设置导入失败:', error);
      return false;
    }
  }

  /**
   * 验证设置数据
   */
  private validateSettings(data: any): boolean {
    return data && 
           typeof data.audio === 'object' &&
           typeof data.video === 'object' &&
           typeof data.controls === 'object' &&
           typeof data.game === 'object' &&
           typeof data.accessibility === 'object';
  }

  /**
   * 处理设置变更事件
   */
  private handleSettingsChanged = (data: any): void => {
    // 这里可以处理来自其他系统的设置变更请求
    console.log('收到设置变更请求:', data);
  };

  /**
   * 保存到本地存储
   */
  private saveToStorage(): void {
    try {
      const data = JSON.stringify(this.settings);
      localStorage.setItem(this.storageKey, data);
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  }

  /**
   * 从本地存储加载
   */
  private loadFromStorage(): GameSettingsData | null {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return null;
      
      return JSON.parse(data);
    } catch (error) {
      console.error('加载设置失败:', error);
      return null;
    }
  }

  /**
   * 注册事件监听器
   */
  public on(event: string, callback: (event: SettingsEvent) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * 移除事件监听器
   */
  public off(event: string, callback: (event: SettingsEvent) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 发出事件
   */
  private emitEvent(type: string, data: Partial<SettingsEvent>): void {
    const event: SettingsEvent = {
      type,
      category: data.category!,
      key: data.key!,
      value: data.value,
      timestamp: Date.now()
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(callback => callback(event));
    }
  }

  /**
   * 更新系统
   */
  public update(time: number, delta: number): void {
    // 设置系统通常不需要每帧更新
    // 但可以在这里添加一些定期检查或清理逻辑
  }

  /**
   * 销毁系统
   */
  public destroy(): void {
    // 移除事件监听器
    this.scene.events.off('settings_changed', this.handleSettingsChanged, this);

    // 清理数据
    this.eventListeners.clear();
    
    // 保存最终设置
    this.saveToStorage();
  }
}