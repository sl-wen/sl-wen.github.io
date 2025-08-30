import * as Phaser from 'phaser';

// 音频类型枚举
export enum AudioType {
  SFX = 'sfx',           // 音效
  MUSIC = 'music',       // 音乐
  VOICE = 'voice',       // 语音
  AMBIENT = 'ambient',   // 环境音
  UI = 'ui'              // UI音效
}

// 音频状态枚举
export enum AudioState {
  STOPPED = 'stopped',   // 停止
  PLAYING = 'playing',   // 播放中
  PAUSED = 'paused',     // 暂停
  FADING = 'fading'      // 淡入淡出
}

// 音频优先级枚举
export enum AudioPriority {
  LOW = 1,       // 低优先级
  NORMAL = 2,    // 普通优先级
  HIGH = 3,      // 高优先级
  CRITICAL = 4   // 关键优先级
}

// 音频配置接口
export interface AudioConfig {
  key: string;
  type: AudioType;
  url: string;
  volume: number;
  loop: boolean;
  rate: number;
  detune: number;
  seek: number;
  delay: number;
  priority: AudioPriority;
  spatial?: boolean;
  distance?: number;
  maxDistance?: number;
  pan?: number;
  onStart?: () => void;
  onComplete?: () => void;
  onStop?: () => void;
}

// 3D音频配置接口
export interface SpatialAudioConfig extends AudioConfig {
  spatial: true;
  distance: number;
  maxDistance: number;
  pan: number;
  sourceX: number;
  sourceY: number;
  listenerX: number;
  listenerY: number;
}

// 音频实例接口
export interface AudioInstance {
  id: string;
  config: AudioConfig;
  state: AudioState;
  sound?: Phaser.Sound.BaseSound;
  volume: number;
  startTime: number;
  endTime?: number;
  fadeStartTime?: number;
  fadeEndTime?: number;
  fadeStartVolume?: number;
  fadeEndVolume?: number;
}

// 音频池配置接口
export interface AudioPoolConfig {
  key: string;
  maxInstances: number;
  preloadCount: number;
  config: AudioConfig;
}

// 音频事件接口
export interface AudioEvent {
  type: string;
  audioId: string;
  config: AudioConfig;
  data?: any;
  timestamp: number;
}

export class AudioSystem {
  private scene: Phaser.Scene;
  private audioInstances: Map<string, AudioInstance>;
  private audioPools: Map<string, AudioInstance[]>;
  private eventListeners: Map<string, Function[]>;
  private masterVolume: number;
  private musicVolume: number;
  private sfxVolume: number;
  private voiceVolume: number;
  private ambientVolume: number;
  private uiVolume: number;
  private isMuted: boolean;
  private spatialAudioEnabled: boolean;
  private listenerPosition: { x: number; y: number };
  private currentMusic?: AudioInstance;
  private fadeQueue: Array<{ audioId: string; targetVolume: number; duration: number }>;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.audioInstances = new Map();
    this.audioPools = new Map();
    this.eventListeners = new Map();
    this.masterVolume = 1.0;
    this.musicVolume = 0.8;
    this.sfxVolume = 1.0;
    this.voiceVolume = 1.0;
    this.ambientVolume = 0.7;
    this.uiVolume = 0.9;
    this.isMuted = false;
    this.spatialAudioEnabled = true;
    this.listenerPosition = { x: 0, y: 0 };
    this.fadeQueue = [];

    this.initializeAudioSystem();
    this.setupEventListeners();
  }

  /**
   * 初始化音频系统
   */
  private initializeAudioSystem(): void {
    // 初始化音频池
    this.initializeAudioPools();
    
    // 设置默认音量
    this.updateAllVolumes();
    
    console.log('音频系统初始化完成');
  }

  /**
   * 初始化音频池
   */
  private initializeAudioPools(): void {
    // 音效池
    this.createAudioPool({
      key: 'sfx_pool',
      maxInstances: 20,
      preloadCount: 5,
      config: {
        key: 'sfx',
        type: AudioType.SFX,
        url: '',
        volume: 1.0,
        loop: false,
        rate: 1.0,
        detune: 0,
        seek: 0,
        delay: 0,
        priority: AudioPriority.NORMAL
      }
    });

    // 音乐池
    this.createAudioPool({
      key: 'music_pool',
      maxInstances: 3,
      preloadCount: 1,
      config: {
        key: 'music',
        type: AudioType.MUSIC,
        url: '',
        volume: 0.8,
        loop: true,
        rate: 1.0,
        detune: 0,
        seek: 0,
        delay: 0,
        priority: AudioPriority.HIGH
      }
    });

    // 语音池
    this.createAudioPool({
      key: 'voice_pool',
      maxInstances: 5,
      preloadCount: 2,
      config: {
        key: 'voice',
        type: AudioType.VOICE,
        url: '',
        volume: 1.0,
        loop: false,
        rate: 1.0,
        detune: 0,
        seek: 0,
        delay: 0,
        priority: AudioPriority.CRITICAL
      }
    });
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听游戏事件
    this.scene.events.on('set_master_volume', this.handleMasterVolumeChange, this);
    this.scene.events.on('set_music_volume', this.handleMusicVolumeChange, this);
    this.scene.events.on('set_sfx_volume', this.handleSfxVolumeChange, this);
    this.scene.events.on('set_voice_volume', this.handleVoiceVolumeChange, this);
    this.scene.events.on('set_ambient_volume', this.handleAmbientVolumeChange, this);
    this.scene.events.on('set_ui_volume', this.handleUiVolumeChange, this);
    this.scene.events.on('set_music_enabled', this.handleMusicEnabledChange, this);
    this.scene.events.on('set_sfx_enabled', this.handleSfxEnabledChange, this);
    this.scene.events.on('set_voice_enabled', this.handleVoiceEnabledChange, this);
    this.scene.events.on('set_spatial_audio', this.handleSpatialAudioChange, this);
  }

  /**
   * 创建音频池
   */
  public createAudioPool(config: AudioPoolConfig): void {
    const pool: AudioInstance[] = [];
    
    for (let i = 0; i < config.preloadCount; i++) {
      const audioId = `${config.key}_${i}`;
      const audio: AudioInstance = {
        id: audioId,
        config: { ...config.config },
        state: AudioState.STOPPED,
        volume: config.config.volume,
        startTime: Date.now()
      };
      
      pool.push(audio);
    }
    
    this.audioPools.set(config.key, pool);
    console.log(`音频池创建成功: ${config.key}`);
  }

  /**
   * 从池中获取音频实例
   */
  public getAudioFromPool(poolKey: string): AudioInstance | null {
    const pool = this.audioPools.get(poolKey);
    if (!pool) {
      console.error('音频池不存在:', poolKey);
      return null;
    }
    
    // 查找可用的音频实例
    for (const audio of pool) {
      if (audio.state === AudioState.STOPPED) {
        return audio;
      }
    }
    
    // 如果没有可用的实例，返回null
    return null;
  }

  /**
   * 播放音频
   */
  public playAudio(config: AudioConfig, position?: { x: number; y: number }): string | null {
    if (this.isMuted) {
      return null;
    }

    // 检查音量设置
    if (!this.isAudioTypeEnabled(config.type)) {
      return null;
    }

    const audioId = `${config.key}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const audio: AudioInstance = {
      id: audioId,
      config,
      state: AudioState.PLAYING,
      volume: this.calculateVolume(config),
      startTime: Date.now()
    };

    // 创建Phaser音频
    try {
      const sound = this.scene.sound.add(config.key, {
        volume: audio.volume,
        loop: config.loop,
        rate: config.rate,
        detune: config.detune,
        seek: config.seek,
        delay: config.delay
      });

      audio.sound = sound;

      // 设置事件监听器
      sound.on('start', () => {
        audio.state = AudioState.PLAYING;
        this.emitEvent('audio_started', { audioId, config });
        
        if (config.onStart) {
          config.onStart();
        }
      });

      sound.on('complete', () => {
        audio.state = AudioState.STOPPED;
        this.emitEvent('audio_completed', { audioId, config });
        
        if (config.onComplete) {
          config.onComplete();
        }
        
        // 清理音频实例
        this.cleanupAudio(audioId);
      });

      sound.on('stop', () => {
        audio.state = AudioState.STOPPED;
        this.emitEvent('audio_stopped', { audioId, config });
        
        if (config.onStop) {
          config.onStop();
        }
      });

      // 播放音频
      sound.play();

      // 如果是音乐，停止当前音乐
      if (config.type === AudioType.MUSIC) {
        this.stopCurrentMusic();
        this.currentMusic = audio;
      }

      // 如果是3D音频，设置空间属性
      if (config.spatial && position) {
        this.setSpatialAudio(audio, position);
      }

      this.audioInstances.set(audioId, audio);
      this.emitEvent('audio_created', { audioId, config });
      
      return audioId;
    } catch (error) {
      console.error('播放音频失败:', error);
      return null;
    }
  }

  /**
   * 播放音效
   */
  public playSFX(key: string, volume: number = 1.0, position?: { x: number; y: number }): string | null {
    return this.playAudio({
      key,
      type: AudioType.SFX,
      url: '',
      volume,
      loop: false,
      rate: 1.0,
      detune: 0,
      seek: 0,
      delay: 0,
      priority: AudioPriority.NORMAL
    }, position);
  }

  /**
   * 播放音乐
   */
  public playMusic(key: string, volume: number = 0.8, loop: boolean = true): string | null {
    return this.playAudio({
      key,
      type: AudioType.MUSIC,
      url: '',
      volume,
      loop,
      rate: 1.0,
      detune: 0,
      seek: 0,
      delay: 0,
      priority: AudioPriority.HIGH
    });
  }

  /**
   * 播放语音
   */
  public playVoice(key: string, volume: number = 1.0): string | null {
    return this.playAudio({
      key,
      type: AudioType.VOICE,
      url: '',
      volume,
      loop: false,
      rate: 1.0,
      detune: 0,
      seek: 0,
      delay: 0,
      priority: AudioPriority.CRITICAL
    });
  }

  /**
   * 播放环境音
   */
  public playAmbient(key: string, volume: number = 0.7, loop: boolean = true): string | null {
    return this.playAudio({
      key,
      type: AudioType.AMBIENT,
      url: '',
      volume,
      loop,
      rate: 1.0,
      detune: 0,
      seek: 0,
      delay: 0,
      priority: AudioPriority.LOW
    });
  }

  /**
   * 播放UI音效
   */
  public playUI(key: string, volume: number = 0.9): string | null {
    return this.playAudio({
      key,
      type: AudioType.UI,
      url: '',
      volume,
      loop: false,
      rate: 1.0,
      detune: 0,
      seek: 0,
      delay: 0,
      priority: AudioPriority.NORMAL
    });
  }

  /**
   * 停止音频
   */
  public stopAudio(audioId: string): boolean {
    const audio = this.audioInstances.get(audioId);
    if (!audio || !audio.sound) {
      return false;
    }

    audio.sound.stop();
    audio.state = AudioState.STOPPED;
    
    this.emitEvent('audio_stopped', { audioId, config: audio.config });
    return true;
  }

  /**
   * 暂停音频
   */
  public pauseAudio(audioId: string): boolean {
    const audio = this.audioInstances.get(audioId);
    if (!audio || !audio.sound) {
      return false;
    }

    audio.sound.pause();
    audio.state = AudioState.PAUSED;
    
    this.emitEvent('audio_paused', { audioId, config: audio.config });
    return true;
  }

  /**
   * 恢复音频
   */
  public resumeAudio(audioId: string): boolean {
    const audio = this.audioInstances.get(audioId);
    if (!audio || !audio.sound) {
      return false;
    }

    audio.sound.resume();
    audio.state = AudioState.PLAYING;
    
    this.emitEvent('audio_resumed', { audioId, config: audio.config });
    return true;
  }

  /**
   * 淡入音频
   */
  public fadeInAudio(audioId: string, duration: number = 1000, targetVolume: number = 1.0): boolean {
    const audio = this.audioInstances.get(audioId);
    if (!audio || !audio.sound) {
      return false;
    }

    const startVolume = (audio.sound as any).volume || 1;
    const startTime = Date.now();
    
    audio.state = AudioState.FADING;
    audio.fadeStartTime = startTime;
    audio.fadeEndTime = startTime + duration;
    audio.fadeStartVolume = startVolume;
    audio.fadeEndVolume = targetVolume;

    this.fadeQueue.push({ audioId, targetVolume, duration });
    
    this.emitEvent('audio_fade_started', { audioId, config: audio.config });
    return true;
  }

  /**
   * 淡出音频
   */
  public fadeOutAudio(audioId: string, duration: number = 1000): boolean {
    const audio = this.audioInstances.get(audioId);
    if (!audio || !audio.sound) {
      return false;
    }

    return this.fadeInAudio(audioId, duration, 0);
  }

  /**
   * 停止当前音乐
   */
  public stopCurrentMusic(): void {
    if (this.currentMusic) {
      this.stopAudio(this.currentMusic.id);
      this.currentMusic = undefined;
    }
  }

  /**
   * 停止所有音频
   */
  public stopAllAudio(): void {
    this.audioInstances.forEach((audio, audioId) => {
      if (audio.sound) {
        audio.sound.stop();
      }
    });
    
    this.audioInstances.clear();
    this.currentMusic = undefined;
    this.fadeQueue = [];
    
    this.emitEvent('all_audio_stopped', {});
  }

  /**
   * 暂停所有音频
   */
  public pauseAllAudio(): void {
    this.audioInstances.forEach((audio, audioId) => {
      if (audio.sound && audio.state === AudioState.PLAYING) {
        this.pauseAudio(audioId);
      }
    });
    
    this.emitEvent('all_audio_paused', {});
  }

  /**
   * 恢复所有音频
   */
  public resumeAllAudio(): void {
    this.audioInstances.forEach((audio, audioId) => {
      if (audio.sound && audio.state === AudioState.PAUSED) {
        this.resumeAudio(audioId);
      }
    });
    
    this.emitEvent('all_audio_resumed', {});
  }

  /**
   * 设置静音
   */
  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    
    if (muted) {
      this.pauseAllAudio();
    } else {
      this.resumeAllAudio();
    }
    
    this.emitEvent('audio_muted_changed', {});
  }

  /**
   * 设置主音量
   */
  public setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    this.updateAllVolumes();
    this.emitEvent('master_volume_changed', {});
  }

  /**
   * 设置音乐音量
   */
  public setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    this.updateTypeVolumes(AudioType.MUSIC);
    this.emitEvent('music_volume_changed', {});
  }

  /**
   * 设置音效音量
   */
  public setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    this.updateTypeVolumes(AudioType.SFX);
    this.emitEvent('sfx_volume_changed', {});
  }

  /**
   * 设置语音音量
   */
  public setVoiceVolume(volume: number): void {
    this.voiceVolume = Math.max(0, Math.min(1, volume));
    this.updateTypeVolumes(AudioType.VOICE);
    this.emitEvent('voice_volume_changed', {});
  }

  /**
   * 设置环境音量
   */
  public setAmbientVolume(volume: number): void {
    this.ambientVolume = Math.max(0, Math.min(1, volume));
    this.updateTypeVolumes(AudioType.AMBIENT);
    this.emitEvent('ambient_volume_changed', {});
  }

  /**
   * 设置UI音量
   */
  public setUiVolume(volume: number): void {
    this.uiVolume = Math.max(0, Math.min(1, volume));
    this.updateTypeVolumes(AudioType.UI);
    this.emitEvent('ui_volume_changed', {});
  }

  /**
   * 设置监听器位置（用于3D音频）
   */
  public setListenerPosition(x: number, y: number): void {
    this.listenerPosition = { x, y };
    this.updateSpatialAudio();
  }

  /**
   * 启用/禁用3D音频
   */
  public setSpatialAudioEnabled(enabled: boolean): void {
    this.spatialAudioEnabled = enabled;
    this.updateSpatialAudio();
    this.emitEvent('spatial_audio_changed', {});
  }

  /**
   * 设置3D音频
   */
  private setSpatialAudio(audio: AudioInstance, position: { x: number; y: number }): void {
    if (!this.spatialAudioEnabled || !audio.sound) return;

    const distance = Math.sqrt(
      Math.pow(position.x - this.listenerPosition.x, 2) + 
      Math.pow(position.y - this.listenerPosition.y, 2)
    );

    const maxDistance = (audio.config as SpatialAudioConfig).maxDistance || 1000;
    const volume = Math.max(0, 1 - (distance / maxDistance));
    
    // 计算立体声平衡
    const pan = (position.x - this.listenerPosition.x) / maxDistance;
    (audio.sound as any).setPan(Math.max(-1, Math.min(1, pan)));
    
    // 设置音量
    (audio.sound as any).setVolume(volume * audio.volume);
  }

  /**
   * 更新所有3D音频
   */
  private updateSpatialAudio(): void {
    if (!this.spatialAudioEnabled) return;

    this.audioInstances.forEach((audio, audioId) => {
      if (audio.config.spatial && audio.sound) {
        // 这里需要根据音频的位置信息更新3D效果
        // 由于我们没有存储位置信息，这里只是示例
        this.updateAudioVolume(audio);
      }
    });
  }

  /**
   * 计算音频音量
   */
  private calculateVolume(config: AudioConfig): number {
    let baseVolume = config.volume;
    
    switch (config.type) {
      case AudioType.MUSIC:
        baseVolume *= this.musicVolume;
        break;
      case AudioType.SFX:
        baseVolume *= this.sfxVolume;
        break;
      case AudioType.VOICE:
        baseVolume *= this.voiceVolume;
        break;
      case AudioType.AMBIENT:
        baseVolume *= this.ambientVolume;
        break;
      case AudioType.UI:
        baseVolume *= this.uiVolume;
        break;
    }
    
    return baseVolume * this.masterVolume;
  }

  /**
   * 更新所有音量
   */
  private updateAllVolumes(): void {
    this.audioInstances.forEach((audio, audioId) => {
      this.updateAudioVolume(audio);
    });
  }

  /**
   * 更新特定类型的音量
   */
  private updateTypeVolumes(type: AudioType): void {
    this.audioInstances.forEach((audio, audioId) => {
      if (audio.config.type === type) {
        this.updateAudioVolume(audio);
      }
    });
  }

  /**
   * 更新单个音频的音量
   */
  private updateAudioVolume(audio: AudioInstance): void {
    if (!audio.sound) return;

    const newVolume = this.calculateVolume(audio.config);
    audio.volume = newVolume;
    (audio.sound as any).setVolume(newVolume);
  }

  /**
   * 检查音频类型是否启用
   */
  private isAudioTypeEnabled(type: AudioType): boolean {
    switch (type) {
      case AudioType.MUSIC:
        return this.musicVolume > 0;
      case AudioType.SFX:
        return this.sfxVolume > 0;
      case AudioType.VOICE:
        return this.voiceVolume > 0;
      case AudioType.AMBIENT:
        return this.ambientVolume > 0;
      case AudioType.UI:
        return this.uiVolume > 0;
      default:
        return true;
    }
  }

  /**
   * 清理音频实例
   */
  private cleanupAudio(audioId: string): void {
    const audio = this.audioInstances.get(audioId);
    if (!audio) return;

    if (audio.sound) {
      audio.sound.destroy();
    }

    this.audioInstances.delete(audioId);
  }

  /**
   * 事件处理器
   */
  private handleMasterVolumeChange = (data: any): void => {
    this.setMasterVolume(data.volume);
  };

  private handleMusicVolumeChange = (data: any): void => {
    this.setMusicVolume(data.volume);
  };

  private handleSfxVolumeChange = (data: any): void => {
    this.setSfxVolume(data.volume);
  };

  private handleVoiceVolumeChange = (data: any): void => {
    this.setVoiceVolume(data.volume);
  };

  private handleAmbientVolumeChange = (data: any): void => {
    this.setAmbientVolume(data.volume);
  };

  private handleUiVolumeChange = (data: any): void => {
    this.setUiVolume(data.volume);
  };

  private handleMusicEnabledChange = (data: any): void => {
    if (!data.enabled) {
      this.stopCurrentMusic();
    }
  };

  private handleSfxEnabledChange = (data: any): void => {
    if (!data.enabled) {
      // 停止所有音效
      this.audioInstances.forEach((audio, audioId) => {
        if (audio.config.type === AudioType.SFX) {
          this.stopAudio(audioId);
        }
      });
    }
  };

  private handleVoiceEnabledChange = (data: any): void => {
    if (!data.enabled) {
      // 停止所有语音
      this.audioInstances.forEach((audio, audioId) => {
        if (audio.config.type === AudioType.VOICE) {
          this.stopAudio(audioId);
        }
      });
    }
  };

  private handleSpatialAudioChange = (data: any): void => {
    this.setSpatialAudioEnabled(data.enabled);
  };

  /**
   * 注册事件监听器
   */
  public on(event: string, callback: (event: AudioEvent) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * 移除事件监听器
   */
  public off(event: string, callback: (event: AudioEvent) => void): void {
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
  private emitEvent(type: string, data: Partial<AudioEvent>): void {
    const event: AudioEvent = {
      type,
      audioId: data.audioId || '',
      config: data.config!,
      data: data.data,
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
    // 更新淡入淡出队列
    this.updateFadeQueue();
    
    // 更新3D音频
    if (this.spatialAudioEnabled) {
      this.updateSpatialAudio();
    }
  }

  /**
   * 更新淡入淡出队列
   */
  private updateFadeQueue(): void {
    const currentTime = Date.now();
    
    for (let i = this.fadeQueue.length - 1; i >= 0; i--) {
      const fade = this.fadeQueue[i];
      const audio = this.audioInstances.get(fade.audioId);
      
      if (!audio || !audio.sound) {
        this.fadeQueue.splice(i, 1);
        continue;
      }
      
      if (audio.fadeStartTime && audio.fadeEndTime && audio.fadeStartVolume !== undefined && audio.fadeEndVolume !== undefined) {
        const elapsed = currentTime - audio.fadeStartTime;
        const duration = audio.fadeEndTime - audio.fadeStartTime;
        const progress = Math.min(1, elapsed / duration);
        
        const currentVolume = audio.fadeStartVolume + (audio.fadeEndVolume - audio.fadeStartVolume) * progress;
        (audio.sound as any).setVolume(currentVolume);
        
        if (progress >= 1) {
          audio.state = AudioState.PLAYING;
          audio.fadeStartTime = undefined;
          audio.fadeEndTime = undefined;
          audio.fadeStartVolume = undefined;
          audio.fadeEndVolume = undefined;
          
          this.emitEvent('audio_fade_completed', { audioId: fade.audioId, config: audio.config });
          this.fadeQueue.splice(i, 1);
        }
      }
    }
  }

  /**
   * 获取音频状态
   */
  public getAudioState(audioId: string): AudioState | null {
    const audio = this.audioInstances.get(audioId);
    return audio ? audio.state : null;
  }

  /**
   * 获取当前音量
   */
  public getCurrentVolume(audioId: string): number {
    const audio = this.audioInstances.get(audioId);
    return audio ? audio.volume : 0;
  }

  /**
   * 获取音频统计信息
   */
  public getAudioStats(): any {
    const stats = {
      totalInstances: this.audioInstances.size,
      playing: 0,
      paused: 0,
      stopped: 0,
      fading: 0,
      byType: {
        [AudioType.SFX]: 0,
        [AudioType.MUSIC]: 0,
        [AudioType.VOICE]: 0,
        [AudioType.AMBIENT]: 0,
        [AudioType.UI]: 0
      }
    };
    
    this.audioInstances.forEach((audio) => {
      (stats as any)[audio.state]++;
      (stats.byType as any)[audio.config.type]++;
    });
    
    return stats;
  }

  /**
   * 销毁系统
   */
  public destroy(): void {
    // 停止所有音频
    this.stopAllAudio();
    
    // 移除事件监听器
    this.scene.events.off('set_master_volume', this.handleMasterVolumeChange, this);
    this.scene.events.off('set_music_volume', this.handleMusicVolumeChange, this);
    this.scene.events.off('set_sfx_volume', this.handleSfxVolumeChange, this);
    this.scene.events.off('set_voice_volume', this.handleVoiceVolumeChange, this);
    this.scene.events.off('set_ambient_volume', this.handleAmbientVolumeChange, this);
    this.scene.events.off('set_ui_volume', this.handleUiVolumeChange, this);
    this.scene.events.off('set_music_enabled', this.handleMusicEnabledChange, this);
    this.scene.events.off('set_sfx_enabled', this.handleSfxEnabledChange, this);
    this.scene.events.off('set_voice_enabled', this.handleVoiceEnabledChange, this);
    this.scene.events.off('set_spatial_audio', this.handleSpatialAudioChange, this);

    // 清理数据
    this.audioInstances.clear();
    this.audioPools.clear();
    this.eventListeners.clear();
    this.fadeQueue = [];
  }
}