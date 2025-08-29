/**
 * 游戏音效管理系统
 * 负责管理背景音乐、音效和音频设置
 */

import { storage } from '../utils';

// 音效类型
export type SoundType = 'music' | 'sfx' | 'voice' | 'ambient' | 'ui';

// 音效配置
export interface SoundConfig {
  key: string;
  volume: number;
  loop?: boolean;
  rate?: number;
  detune?: number;
  pan?: number;
  fadeIn?: number;
  fadeOut?: number;
  spatial?: boolean;
  maxDistance?: number;
  refDistance?: number;
  rolloffFactor?: number;
  category?: SoundType;
  priority?: number;
  tags?: string[];
}

// 音效预设
export interface SoundPreset {
  name: string;
  description: string;
  settings: {
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
    voiceVolume: number;
    ambientVolume: number;
    uiVolume: number;
    enable3D: boolean;
    enableReverb: boolean;
    enableEcho: boolean;
    lowPassFilter: number;
    highPassFilter: number;
  };
}

// 音效队列项
export interface SoundQueueItem {
  id: string;
  config: SoundConfig;
  delay: number;
  priority: number;
  timestamp: number;
  callback?: () => void;
}

// 3D音效位置
export interface SoundPosition {
  x: number;
  y: number;
  z?: number;
  listenerX: number;
  listenerY: number;
  listenerZ?: number;
}

// 音效事件
export interface SoundEvent {
  type: 'play' | 'stop' | 'pause' | 'resume' | 'volume_change' | 'mute' | 'unmute' | 'fade' | 'error';
  soundKey: string;
  data?: any;
  timestamp: number;
}

// 音频统计
export interface AudioStats {
  totalSounds: number;
  activeSounds: number;
  memoryUsage: number;
  cpuUsage: number;
  bufferUnderruns: number;
  audioContextState: string;
}

export class SoundManager {
  private static instance: SoundManager;
  private scene: Phaser.Scene | null = null;
  
  // 基础设置
  private isMuted: boolean = false;
  private masterVolume: number = 1.0;
  private musicVolume: number = 0.5;
  private sfxVolume: number = 0.7;
  private voiceVolume: number = 0.8;
  private ambientVolume: number = 0.4;
  private uiVolume: number = 0.6;
  
  // 高级设置
  private enable3D: boolean = true;
  private enableReverb: boolean = false;
  private enableEcho: boolean = false;
  private lowPassFilter: number = 22050;
  private highPassFilter: number = 20;
  
  // 音效管理
  private currentMusic: string | null = null;
  private activeSounds: Map<string, Phaser.Sound.BaseSound> = new Map();
  private soundQueue: SoundQueueItem[] = [];
  private soundPresets: Map<string, SoundPreset> = new Map();
  private events: SoundEvent[] = [];
  private callbacks: Map<string, (data: any) => void> = new Map();
  
  // 3D音频
  private listenerPosition: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
  private spatialSounds: Map<string, SoundPosition> = new Map();
  
  // 音频处理
  private audioContext: AudioContext | null = null;
  private reverbNode: ConvolverNode | null = null;
  private echoNode: DelayNode | null = null;
  private lowPassNode: BiquadFilterNode | null = null;
  private highPassNode: BiquadFilterNode | null = null;
  
  // 统计信息
  private stats: AudioStats = {
    totalSounds: 0,
    activeSounds: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    bufferUnderruns: 0,
    audioContextState: 'suspended'
  };

  // 音效配置
  private readonly soundEffects: Record<string, SoundConfig> = {
    // 移动音效
    walk: { key: 'walk', volume: 0.3, category: 'sfx', priority: 1 },
    run: { key: 'run', volume: 0.4, category: 'sfx', priority: 1 },
    jump: { key: 'jump', volume: 0.5, category: 'sfx', priority: 2 },
    land: { key: 'land', volume: 0.4, category: 'sfx', priority: 2 },
    
    // 战斗音效
    attack: { key: 'attack', volume: 0.6, category: 'sfx', priority: 3 },
    hit: { key: 'hit', volume: 0.5, category: 'sfx', priority: 3 },
    enemyDeath: { key: 'enemy_death', volume: 0.4, category: 'sfx', priority: 2 },
    playerHit: { key: 'player_hit', volume: 0.5, category: 'sfx', priority: 3 },
    block: { key: 'block', volume: 0.4, category: 'sfx', priority: 2 },
    dodge: { key: 'dodge', volume: 0.3, category: 'sfx', priority: 2 },
    critical: { key: 'critical', volume: 0.7, category: 'sfx', priority: 4 },
    
    // 交互音效
    pickup: { key: 'pickup', volume: 0.4, category: 'sfx', priority: 2 },
    openChest: { key: 'open_chest', volume: 0.5, category: 'sfx', priority: 2 },
    doorOpen: { key: 'door_open', volume: 0.4, category: 'sfx', priority: 2 },
    doorClose: { key: 'door_close', volume: 0.3, category: 'sfx', priority: 1 },
    unlock: { key: 'unlock', volume: 0.5, category: 'sfx', priority: 2 },
    teleport: { key: 'teleport', volume: 0.6, category: 'sfx', priority: 3 },
    
    // UI音效
    buttonClick: { key: 'button_click', volume: 0.3, category: 'ui', priority: 1 },
    menuOpen: { key: 'menu_open', volume: 0.3, category: 'ui', priority: 1 },
    menuClose: { key: 'menu_close', volume: 0.2, category: 'ui', priority: 1 },
    levelUp: { key: 'level_up', volume: 0.6, category: 'ui', priority: 4 },
    achievement: { key: 'achievement', volume: 0.7, category: 'ui', priority: 4 },
    notification: { key: 'notification', volume: 0.4, category: 'ui', priority: 2 },
    
    // 环境音效
    wind: { key: 'wind', volume: 0.2, category: 'ambient', priority: 1, loop: true },
    water: { key: 'water', volume: 0.3, category: 'ambient', priority: 1, loop: true },
    fire: { key: 'fire', volume: 0.4, category: 'ambient', priority: 1, loop: true },
    rain: { key: 'rain', volume: 0.3, category: 'ambient', priority: 1, loop: true },
    thunder: { key: 'thunder', volume: 0.6, category: 'ambient', priority: 3 },
    birds: { key: 'birds', volume: 0.2, category: 'ambient', priority: 1 },
    
    // 语音音效
    npcGreeting: { key: 'npc_greeting', volume: 0.8, category: 'voice', priority: 3 },
    npcFarewell: { key: 'npc_farewell', volume: 0.7, category: 'voice', priority: 2 },
    questAccept: { key: 'quest_accept', volume: 0.8, category: 'voice', priority: 3 },
    questComplete: { key: 'quest_complete', volume: 0.8, category: 'voice', priority: 4 },
    playerVoice: { key: 'player_voice', volume: 0.8, category: 'voice', priority: 3 }
  };

  // 背景音乐配置
  private readonly backgroundMusic: Record<string, SoundConfig> = {
    mainMenu: { key: 'main_menu_music', volume: 0.4, category: 'music', loop: true, priority: 5 },
    village: { key: 'village_music', volume: 0.3, category: 'music', loop: true, priority: 5 },
    forest: { key: 'forest_music', volume: 0.3, category: 'music', loop: true, priority: 5 },
    cave: { key: 'cave_music', volume: 0.3, category: 'music', loop: true, priority: 5 },
    battle: { key: 'battle_music', volume: 0.4, category: 'music', loop: true, priority: 5 },
    victory: { key: 'victory_music', volume: 0.5, category: 'music', loop: false, priority: 5 },
    defeat: { key: 'defeat_music', volume: 0.4, category: 'music', loop: false, priority: 5 },
    boss: { key: 'boss_music', volume: 0.5, category: 'music', loop: true, priority: 5 },
    exploration: { key: 'exploration_music', volume: 0.3, category: 'music', loop: true, priority: 5 }
  };

  private constructor() {
    this.loadSettings();
    this.loadPresets();
    this.initializeAudioContext();
  }

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  /**
   * 初始化音效管理器
   */
  public initialize(scene: Phaser.Scene): void {
    this.scene = scene;
    this.loadAudioAssets();
    this.setupAudioProcessing();
    console.log('音效管理器已初始化');
  }

  /**
   * 加载音频资源
   */
  private loadAudioAssets(): void {
    if (!this.scene) return;

    // 加载音效
    Object.keys(this.soundEffects).forEach(key => {
      const config = this.soundEffects[key];
      this.scene!.load.audio(config.key, `assets/audio/sfx/${config.key}.mp3`);
    });

    // 加载背景音乐
    Object.keys(this.backgroundMusic).forEach(key => {
      const config = this.backgroundMusic[key];
      this.scene!.load.audio(config.key, `assets/audio/music/${config.key}.mp3`);
    });
  }

  /**
   * 初始化音频上下文
   */
  private initializeAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.stats.audioContextState = this.audioContext.state;
      console.log('音频上下文已初始化');
    } catch (error) {
      console.error('无法初始化音频上下文:', error);
    }
  }

  /**
   * 设置音频处理
   */
  private setupAudioProcessing(): void {
    if (!this.audioContext) return;

    // 创建低通滤波器
    this.lowPassNode = this.audioContext.createBiquadFilter();
    this.lowPassNode.type = 'lowpass';
    this.lowPassNode.frequency.value = this.lowPassFilter;

    // 创建高通滤波器
    this.highPassNode = this.audioContext.createBiquadFilter();
    this.highPassNode.type = 'highpass';
    this.highPassNode.frequency.value = this.highPassFilter;

    // 创建混响节点
    if (this.enableReverb) {
      this.createReverbNode();
    }

    // 创建回声节点
    if (this.enableEcho) {
      this.createEchoNode();
    }
  }

  /**
   * 创建混响节点
   */
  private createReverbNode(): void {
    if (!this.audioContext) return;

    this.reverbNode = this.audioContext.createConvolver();
    // 这里可以加载混响脉冲响应
    console.log('混响节点已创建');
  }

  /**
   * 创建回声节点
   */
  private createEchoNode(): void {
    if (!this.audioContext) return;

    this.echoNode = this.audioContext.createDelay(2.0);
    this.echoNode.delayTime.value = 0.3;
    console.log('回声节点已创建');
  }

  /**
   * 播放背景音乐
   */
  public playBackgroundMusic(musicKey: keyof typeof this.backgroundMusic, fadeIn: number = 1000): void {
    if (!this.scene || this.isMuted) return;

    const config = this.backgroundMusic[musicKey];
    if (!config) return;

    // 停止当前音乐
    this.stopBackgroundMusic(fadeIn);

    // 播放新音乐
    const music = this.scene.sound.add(config.key, {
      volume: 0,
      loop: config.loop || false
    });

    music.play();

    // 淡入效果
    if (fadeIn > 0) {
      this.scene.tweens.add({
        targets: music,
        volume: this.getCategoryVolume(config.category || 'music'),
        duration: fadeIn,
        ease: 'Power2'
      });
    } else {
      music.setVolume(this.getCategoryVolume(config.category || 'music'));
    }

    this.currentMusic = musicKey;
    this.activeSounds.set(config.key, music);
    
    this.addEvent('play', config.key, { type: 'music', fadeIn });
    console.log(`播放背景音乐: ${musicKey}`);
  }

  /**
   * 停止背景音乐
   */
  public stopBackgroundMusic(fadeOut: number = 1000): void {
    if (!this.scene || !this.currentMusic) return;

    const config = this.backgroundMusic[this.currentMusic];
    if (!config) return;

    const music = this.scene.sound.get(config.key);
    if (!music) return;

    if (fadeOut > 0) {
      this.scene.tweens.add({
        targets: music,
        volume: 0,
        duration: fadeOut,
        ease: 'Power2',
        onComplete: () => {
          music.stop();
          this.activeSounds.delete(config.key);
        }
      });
    } else {
      music.stop();
      this.activeSounds.delete(config.key);
    }

    this.addEvent('stop', config.key, { type: 'music', fadeOut });
    this.currentMusic = null;
  }

  /**
   * 播放音效
   */
  public playSoundEffect(soundKey: keyof typeof this.soundEffects, position?: SoundPosition): void {
    if (!this.scene || this.isMuted) return;

    const config = this.soundEffects[soundKey];
    if (!config) return;

    // 检查队列优先级
    if (this.soundQueue.length > 0) {
      const lowestPriority = Math.min(...this.soundQueue.map(item => item.priority));
      if (config.priority && config.priority < lowestPriority) {
        // 停止低优先级音效
        this.stopLowPrioritySounds(config.priority);
      }
    }

    const sound = this.scene.sound.add(config.key, {
      volume: this.getCategoryVolume(config.category || 'sfx'),
      loop: config.loop || false,
      rate: config.rate || 1,
      detune: config.detune || 0,
      pan: config.pan || 0
    });

    // 3D音效处理
    if (position && config.spatial && this.enable3D) {
      this.apply3DEffects(sound, position);
    }

    sound.play();
    this.activeSounds.set(config.key, sound);
    
    this.addEvent('play', config.key, { type: 'sfx', position });
  }

  /**
   * 应用3D音效
   */
  private apply3DEffects(sound: Phaser.Sound.BaseSound, position: SoundPosition): void {
    const distance = Math.sqrt(
      Math.pow(position.x - position.listenerX, 2) +
      Math.pow(position.y - position.listenerY, 2) +
      Math.pow((position.z || 0) - (position.listenerZ || 0), 2)
    );

    // 计算音量衰减
    const maxDistance = 1000;
    const volume = Math.max(0, 1 - distance / maxDistance);
    sound.setVolume(volume * this.getCategoryVolume('sfx'));

    // 计算立体声平衡
    const pan = (position.x - position.listenerX) / maxDistance;
    sound.setPan(Math.max(-1, Math.min(1, pan)));

    this.spatialSounds.set(sound.key, position);
  }

  /**
   * 停止低优先级音效
   */
  private stopLowPrioritySounds(minPriority: number): void {
    this.activeSounds.forEach((sound, key) => {
      const config = this.soundEffects[key] || this.backgroundMusic[key];
      if (config && config.priority && config.priority < minPriority) {
        sound.stop();
        this.activeSounds.delete(key);
      }
    });
  }

  /**
   * 播放音效队列
   */
  public playSoundQueue(queue: SoundQueueItem[]): void {
    queue.forEach((item, index) => {
      setTimeout(() => {
        this.playSoundEffect(item.config.key as keyof typeof this.soundEffects);
        if (item.callback) {
          item.callback();
        }
      }, item.delay);
    });
  }

  /**
   * 添加音效到队列
   */
  public addToQueue(soundKey: string, config: SoundConfig, delay: number = 0, callback?: () => void): void {
    const queueItem: SoundQueueItem = {
      id: `${soundKey}_${Date.now()}`,
      config,
      delay,
      priority: config.priority || 1,
      timestamp: Date.now(),
      callback
    };

    this.soundQueue.push(queueItem);
    this.soundQueue.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 清空音效队列
   */
  public clearQueue(): void {
    this.soundQueue = [];
  }

  /**
   * 设置监听器位置
   */
  public setListenerPosition(x: number, y: number, z: number = 0): void {
    this.listenerPosition = { x, y, z };
    this.updateSpatialSounds();
  }

  /**
   * 更新3D音效
   */
  private updateSpatialSounds(): void {
    this.spatialSounds.forEach((position, soundKey) => {
      const sound = this.activeSounds.get(soundKey);
      if (sound) {
        this.apply3DEffects(sound, {
          ...position,
          listenerX: this.listenerPosition.x,
          listenerY: this.listenerPosition.y,
          listenerZ: this.listenerPosition.z
        });
      }
    });
  }

  /**
   * 获取分类音量
   */
  private getCategoryVolume(category: SoundType): number {
    const baseVolume = this.masterVolume;
    let categoryVolume = 1;

    switch (category) {
      case 'music':
        categoryVolume = this.musicVolume;
        break;
      case 'sfx':
        categoryVolume = this.sfxVolume;
        break;
      case 'voice':
        categoryVolume = this.voiceVolume;
        break;
      case 'ambient':
        categoryVolume = this.ambientVolume;
        break;
      case 'ui':
        categoryVolume = this.uiVolume;
        break;
    }

    return baseVolume * categoryVolume;
  }

  /**
   * 设置音量
   */
  public setVolume(category: SoundType, volume: number): void {
    switch (category) {
      case 'music':
        this.musicVolume = Math.max(0, Math.min(1, volume));
        break;
      case 'sfx':
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        break;
      case 'voice':
        this.voiceVolume = Math.max(0, Math.min(1, volume));
        break;
      case 'ambient':
        this.ambientVolume = Math.max(0, Math.min(1, volume));
        break;
      case 'ui':
        this.uiVolume = Math.max(0, Math.min(1, volume));
        break;
    }

    this.updateAllVolumes();
    this.addEvent('volume_change', category, { volume });
  }

  /**
   * 设置主音量
   */
  public setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    this.updateAllVolumes();
    this.addEvent('volume_change', 'master', { volume });
  }

  /**
   * 更新所有音量
   */
  private updateAllVolumes(): void {
    this.activeSounds.forEach((sound, key) => {
      const config = this.soundEffects[key] || this.backgroundMusic[key];
      if (config) {
        const newVolume = this.getCategoryVolume(config.category || 'sfx');
        sound.setVolume(newVolume);
      }
    });
  }

  /**
   * 静音/取消静音
   */
  public toggleMute(): void {
    this.isMuted = !this.isMuted;
    
    if (this.isMuted) {
      this.scene?.sound.pauseAll();
      this.addEvent('mute', 'all', {});
    } else {
      this.scene?.sound.resumeAll();
      this.addEvent('unmute', 'all', {});
    }
  }

  /**
   * 淡入音效
   */
  public fadeIn(soundKey: string, duration: number = 1000): void {
    if (!this.scene) return;

    const sound = this.scene.sound.get(soundKey);
    if (!sound) return;

    const targetVolume = this.getCategoryVolume('music');
    
    this.scene.tweens.add({
      targets: sound,
      volume: targetVolume,
      duration,
      ease: 'Power2'
    });

    this.addEvent('fade', soundKey, { type: 'fadeIn', duration });
  }

  /**
   * 淡出音效
   */
  public fadeOut(soundKey: string, duration: number = 1000): void {
    if (!this.scene) return;

    const sound = this.scene.sound.get(soundKey);
    if (!sound) return;

    this.scene.tweens.add({
      targets: sound,
      volume: 0,
      duration,
      ease: 'Power2',
      onComplete: () => {
        sound.stop();
        this.activeSounds.delete(soundKey);
      }
    });

    this.addEvent('fade', soundKey, { type: 'fadeOut', duration });
  }

  /**
   * 加载音效预设
   */
  private loadPresets(): void {
    const savedPresets = storage.get('sound_presets', null);
    if (savedPresets) {
      this.soundPresets = new Map(savedPresets);
    }
    
    // 添加默认预设
    this.addDefaultPresets();
  }

  /**
   * 添加默认预设
   */
  private addDefaultPresets(): void {
    // 标准预设
    this.soundPresets.set('standard', {
      name: '标准',
      description: '平衡的音效设置',
      settings: {
        masterVolume: 1.0,
        musicVolume: 0.5,
        sfxVolume: 0.7,
        voiceVolume: 0.8,
        ambientVolume: 0.4,
        uiVolume: 0.6,
        enable3D: true,
        enableReverb: false,
        enableEcho: false,
        lowPassFilter: 22050,
        highPassFilter: 20
      }
    });

    // 沉浸式预设
    this.soundPresets.set('immersive', {
      name: '沉浸式',
      description: '增强的3D音效和混响',
      settings: {
        masterVolume: 1.0,
        musicVolume: 0.4,
        sfxVolume: 0.8,
        voiceVolume: 0.9,
        ambientVolume: 0.6,
        uiVolume: 0.5,
        enable3D: true,
        enableReverb: true,
        enableEcho: false,
        lowPassFilter: 22050,
        highPassFilter: 20
      }
    });

    // 音乐优先预设
    this.soundPresets.set('music_focused', {
      name: '音乐优先',
      description: '突出背景音乐',
      settings: {
        masterVolume: 1.0,
        musicVolume: 0.8,
        sfxVolume: 0.5,
        voiceVolume: 0.7,
        ambientVolume: 0.3,
        uiVolume: 0.4,
        enable3D: false,
        enableReverb: false,
        enableEcho: false,
        lowPassFilter: 22050,
        highPassFilter: 20
      }
    });

    // 静音预设
    this.soundPresets.set('silent', {
      name: '静音',
      description: '关闭所有音效',
      settings: {
        masterVolume: 0.0,
        musicVolume: 0.0,
        sfxVolume: 0.0,
        voiceVolume: 0.0,
        ambientVolume: 0.0,
        uiVolume: 0.0,
        enable3D: false,
        enableReverb: false,
        enableEcho: false,
        lowPassFilter: 22050,
        highPassFilter: 20
      }
    });
  }

  /**
   * 应用音效预设
   */
  public applyPreset(presetName: string): void {
    const preset = this.soundPresets.get(presetName);
    if (!preset) return;

    const settings = preset.settings;
    
    this.masterVolume = settings.masterVolume;
    this.musicVolume = settings.musicVolume;
    this.sfxVolume = settings.sfxVolume;
    this.voiceVolume = settings.voiceVolume;
    this.ambientVolume = settings.ambientVolume;
    this.uiVolume = settings.uiVolume;
    this.enable3D = settings.enable3D;
    this.enableReverb = settings.enableReverb;
    this.enableEcho = settings.enableEcho;
    this.lowPassFilter = settings.lowPassFilter;
    this.highPassFilter = settings.highPassFilter;

    this.updateAllVolumes();
    this.setupAudioProcessing();
    
    this.addEvent('volume_change', 'preset', { presetName });
    console.log(`应用音效预设: ${presetName}`);
  }

  /**
   * 添加音效预设
   */
  public addPreset(preset: SoundPreset): void {
    this.soundPresets.set(preset.name.toLowerCase(), preset);
    storage.set('sound_presets', Array.from(this.soundPresets.entries()));
  }

  /**
   * 获取音效预设
   */
  public getPreset(presetName: string): SoundPreset | undefined {
    return this.soundPresets.get(presetName);
  }

  /**
   * 获取所有预设
   */
  public getAllPresets(): SoundPreset[] {
    return Array.from(this.soundPresets.values());
  }

  /**
   * 获取音频统计
   */
  public getAudioStats(): AudioStats {
    this.stats.activeSounds = this.activeSounds.size;
    this.stats.totalSounds = Object.keys(this.soundEffects).length + Object.keys(this.backgroundMusic).length;
    
    if (this.audioContext) {
      this.stats.audioContextState = this.audioContext.state;
    }
    
    return { ...this.stats };
  }

  /**
   * 加载设置
   */
  private loadSettings(): void {
    const savedSettings = storage.get('sound_settings', null);
    if (savedSettings) {
      Object.assign(this, savedSettings);
    }
  }

  /**
   * 保存设置
   */
  private saveSettings(): void {
    const settings = {
      isMuted: this.isMuted,
      masterVolume: this.masterVolume,
      musicVolume: this.musicVolume,
      sfxVolume: this.sfxVolume,
      voiceVolume: this.voiceVolume,
      ambientVolume: this.ambientVolume,
      uiVolume: this.uiVolume,
      enable3D: this.enable3D,
      enableReverb: this.enableReverb,
      enableEcho: this.enableEcho,
      lowPassFilter: this.lowPassFilter,
      highPassFilter: this.highPassFilter
    };
    
    storage.set('sound_settings', settings);
  }

  /**
   * 添加事件
   */
  private addEvent(type: SoundEvent['type'], soundKey: string, data?: any): void {
    const event: SoundEvent = {
      type,
      soundKey,
      data,
      timestamp: Date.now()
    };
    
    this.events.push(event);
    
    // 保持事件历史在合理范围内
    if (this.events.length > 100) {
      this.events.shift();
    }
  }

  /**
   * 注册回调
   */
  registerCallback(eventType: string, callback: (data: any) => void): void {
    this.callbacks.set(eventType, callback);
  }

  /**
   * 触发回调
   */
  private triggerCallback(eventType: string, data: any): void {
    const callback = this.callbacks.get(eventType);
    if (callback) {
      callback(data);
    }
  }

  /**
   * 获取事件历史
   */
  getEvents(): SoundEvent[] {
    return [...this.events];
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.saveSettings();
    
    if (this.scene) {
      this.scene.sound.removeAll();
    }
    
    this.activeSounds.clear();
    this.soundQueue = [];
    this.spatialSounds.clear();
    this.events = [];
    this.callbacks.clear();
    this.soundPresets.clear();
    
    if (this.audioContext) {
      this.audioContext.close();
    }
    
    this.scene = null;
    console.log('音效管理器已销毁');
  }
}