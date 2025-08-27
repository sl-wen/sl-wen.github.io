import * as Phaser from 'phaser';
import { GameManager } from './GameManager';

/**
 * 音频管理器类
 * 参考top-down-react-phaser-game的音频处理方式
 * 统一管理背景音乐、音效、环境音等
 */
export class AudioManager {
  private scene: Phaser.Scene;
  private gameManager: GameManager;
  
  // 音频资源
  private backgroundMusic: Phaser.Sound.BaseSound | null = null;
  private soundEffects: Map<string, Phaser.Sound.BaseSound> = new Map();
  private ambientSounds: Map<string, Phaser.Sound.BaseSound> = new Map();
  
  // 音频设置
  private audioSettings = {
    masterVolume: 1.0,
    musicVolume: 0.7,
    sfxVolume: 0.8,
    ambientVolume: 0.5,
    isMuted: false,
    currentMusicTrack: '',
    fadeInDuration: 1000,
    fadeOutDuration: 1000
  };

  // 音频池（性能优化）
  private audioPool: Map<string, Phaser.Sound.BaseSound[]> = new Map();
  private maxPoolSize = 5;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.gameManager = GameManager.getInstance();
    this.setupAudioEvents();
    this.loadAudioSettings();
  }

  /**
   * 设置音频事件监听
   */
  private setupAudioEvents(): void {
    this.gameManager.on('game-paused', this.pauseAllAudio, this);
    this.gameManager.on('game-resumed', this.resumeAllAudio, this);
    this.gameManager.on('season-changed', this.handleSeasonChange, this);
    this.gameManager.on('time-changed', this.handleTimeChange, this);
  }

  /**
   * 加载音频设置
   */
  private loadAudioSettings(): void {
    try {
      const savedSettings = localStorage.getItem('farm-game-audio-settings');
      if (savedSettings) {
        this.audioSettings = { ...this.audioSettings, ...JSON.parse(savedSettings) };
      }
    } catch (error) {
      console.warn('Failed to load audio settings:', error);
    }
  }

  /**
   * 保存音频设置
   */
  private saveAudioSettings(): void {
    try {
      localStorage.setItem('farm-game-audio-settings', JSON.stringify(this.audioSettings));
    } catch (error) {
      console.warn('Failed to save audio settings:', error);
    }
  }

  /**
   * 预加载音频资源
   */
  public preloadAudio(): void {
    // 背景音乐
    this.scene.load.audio('farm_music_spring', ['assets/audio/music/spring_farm.mp3', 'assets/audio/music/spring_farm.ogg']);
    this.scene.load.audio('farm_music_summer', ['assets/audio/music/summer_farm.mp3', 'assets/audio/music/summer_farm.ogg']);
    this.scene.load.audio('farm_music_autumn', ['assets/audio/music/autumn_farm.mp3', 'assets/audio/music/autumn_farm.ogg']);
    this.scene.load.audio('farm_music_winter', ['assets/audio/music/winter_farm.mp3', 'assets/audio/music/winter_farm.ogg']);

    // 音效
    this.scene.load.audio('plant_seed', ['assets/audio/sfx/plant.mp3', 'assets/audio/sfx/plant.ogg']);
    this.scene.load.audio('water_crop', ['assets/audio/sfx/water.mp3', 'assets/audio/sfx/water.ogg']);
    this.scene.load.audio('harvest_crop', ['assets/audio/sfx/harvest.mp3', 'assets/audio/sfx/harvest.ogg']);
    this.scene.load.audio('cooking_start', ['assets/audio/sfx/cooking.mp3', 'assets/audio/sfx/cooking.ogg']);
    this.scene.load.audio('cooking_complete', ['assets/audio/sfx/cooking_done.mp3', 'assets/audio/sfx/cooking_done.ogg']);
    this.scene.load.audio('cat_meow', ['assets/audio/sfx/meow.mp3', 'assets/audio/sfx/meow.ogg']);
    this.scene.load.audio('cat_purr', ['assets/audio/sfx/purr.mp3', 'assets/audio/sfx/purr.ogg']);
    this.scene.load.audio('footstep_grass', ['assets/audio/sfx/footstep_grass.mp3', 'assets/audio/sfx/footstep_grass.ogg']);
    this.scene.load.audio('ui_click', ['assets/audio/sfx/ui_click.mp3', 'assets/audio/sfx/ui_click.ogg']);
    this.scene.load.audio('ui_hover', ['assets/audio/sfx/ui_hover.mp3', 'assets/audio/sfx/ui_hover.ogg']);

    // 环境音
    this.scene.load.audio('birds_chirping', ['assets/audio/ambient/birds.mp3', 'assets/audio/ambient/birds.ogg']);
    this.scene.load.audio('wind_gentle', ['assets/audio/ambient/wind.mp3', 'assets/audio/ambient/wind.ogg']);
    this.scene.load.audio('water_stream', ['assets/audio/ambient/stream.mp3', 'assets/audio/ambient/stream.ogg']);
    this.scene.load.audio('farm_ambience', ['assets/audio/ambient/farm.mp3', 'assets/audio/ambient/farm.ogg']);
  }

  /**
   * 初始化音频系统
   */
  public initialize(): void {
    // 创建音频池
    this.initializeAudioPools();
    
    // 设置初始背景音乐
    this.playBackgroundMusic('farm_music_spring');
    
    // 播放环境音
    this.playAmbientSound('farm_ambience', true);
    
    console.log('AudioManager initialized');
  }

  /**
   * 初始化音频池
   */
  private initializeAudioPools(): void {
    const pooledSounds = ['footstep_grass', 'ui_click', 'ui_hover'];
    
    pooledSounds.forEach(soundKey => {
      if (this.scene.cache.audio.exists(soundKey)) {
        const pool: Phaser.Sound.BaseSound[] = [];
        for (let i = 0; i < this.maxPoolSize; i++) {
          const sound = this.scene.sound.add(soundKey, { volume: 0 });
          pool.push(sound);
        }
        this.audioPool.set(soundKey, pool);
      }
    });
  }

  /**
   * 播放背景音乐
   */
  public playBackgroundMusic(musicKey: string, fadeIn: boolean = true): void {
    if (this.audioSettings.currentMusicTrack === musicKey && this.backgroundMusic?.isPlaying) {
      return;
    }

    // 停止当前音乐
    if (this.backgroundMusic) {
      if (fadeIn) {
        this.scene.tweens.add({
          targets: this.backgroundMusic,
          volume: 0,
          duration: this.audioSettings.fadeOutDuration,
          onComplete: () => {
            this.backgroundMusic?.stop();
            this.startNewMusic(musicKey, fadeIn);
          }
        });
      } else {
        this.backgroundMusic.stop();
        this.startNewMusic(musicKey, fadeIn);
      }
    } else {
      this.startNewMusic(musicKey, fadeIn);
    }
  }

  /**
   * 开始播放新音乐
   */
  private startNewMusic(musicKey: string, fadeIn: boolean): void {
    if (!this.scene.cache.audio.exists(musicKey)) {
      console.warn(`Music track ${musicKey} not found`);
      return;
    }

    this.backgroundMusic = this.scene.sound.add(musicKey, {
      loop: true,
      volume: fadeIn ? 0 : this.audioSettings.musicVolume * this.audioSettings.masterVolume
    });

    this.backgroundMusic.play();
    this.audioSettings.currentMusicTrack = musicKey;

    if (fadeIn) {
      this.scene.tweens.add({
        targets: this.backgroundMusic,
        volume: this.audioSettings.musicVolume * this.audioSettings.masterVolume,
        duration: this.audioSettings.fadeInDuration
      });
    }
  }

  /**
   * 播放音效
   */
  public playSoundEffect(sfxKey: string, config?: { volume?: number; rate?: number; loop?: boolean }): void {
    if (this.audioSettings.isMuted) return;

    // 检查是否使用音频池
    const pool = this.audioPool.get(sfxKey);
    if (pool) {
      const availableSound = pool.find(sound => !sound.isPlaying);
      if (availableSound) {
        availableSound.setVolume((config?.volume || 1) * this.audioSettings.sfxVolume * this.audioSettings.masterVolume);
        availableSound.setRate(config?.rate || 1);
        availableSound.play();
        return;
      }
    }

    // 普通播放方式
    if (this.scene.cache.audio.exists(sfxKey)) {
      const sound = this.scene.sound.add(sfxKey, {
        volume: (config?.volume || 1) * this.audioSettings.sfxVolume * this.audioSettings.masterVolume,
        rate: config?.rate || 1,
        loop: config?.loop || false
      });

      sound.play();

      // 如果不是循环音效，播放完后销毁
      if (!config?.loop) {
        sound.once('complete', () => {
          sound.destroy();
        });
      } else {
        this.soundEffects.set(sfxKey, sound);
      }
    } else {
      console.warn(`Sound effect ${sfxKey} not found`);
    }
  }

  /**
   * 播放环境音
   */
  public playAmbientSound(ambientKey: string, loop: boolean = true, volume: number = 1): void {
    if (this.audioSettings.isMuted) return;

    if (this.scene.cache.audio.exists(ambientKey)) {
      const ambient = this.scene.sound.add(ambientKey, {
        loop: loop,
        volume: volume * this.audioSettings.ambientVolume * this.audioSettings.masterVolume
      });

      ambient.play();
      this.ambientSounds.set(ambientKey, ambient);
    }
  }

  /**
   * 停止环境音
   */
  public stopAmbientSound(ambientKey: string): void {
    const ambient = this.ambientSounds.get(ambientKey);
    if (ambient) {
      ambient.stop();
      this.ambientSounds.delete(ambientKey);
    }
  }

  /**
   * 设置主音量
   */
  public setMasterVolume(volume: number): void {
    this.audioSettings.masterVolume = Phaser.Math.Clamp(volume, 0, 1);
    this.updateAllVolumes();
    this.saveAudioSettings();
  }

  /**
   * 设置音乐音量
   */
  public setMusicVolume(volume: number): void {
    this.audioSettings.musicVolume = Phaser.Math.Clamp(volume, 0, 1);
    if (this.backgroundMusic) {
      this.backgroundMusic.setVolume(this.audioSettings.musicVolume * this.audioSettings.masterVolume);
    }
    this.saveAudioSettings();
  }

  /**
   * 设置音效音量
   */
  public setSfxVolume(volume: number): void {
    this.audioSettings.sfxVolume = Phaser.Math.Clamp(volume, 0, 1);
    this.saveAudioSettings();
  }

  /**
   * 设置环境音音量
   */
  public setAmbientVolume(volume: number): void {
    this.audioSettings.ambientVolume = Phaser.Math.Clamp(volume, 0, 1);
    this.ambientSounds.forEach(ambient => {
      ambient.setVolume(this.audioSettings.ambientVolume * this.audioSettings.masterVolume);
    });
    this.saveAudioSettings();
  }

  /**
   * 切换静音
   */
  public toggleMute(): void {
    this.audioSettings.isMuted = !this.audioSettings.isMuted;
    if (this.audioSettings.isMuted) {
      this.scene.sound.pauseAll();
    } else {
      this.scene.sound.resumeAll();
    }
    this.saveAudioSettings();
  }

  /**
   * 更新所有音量
   */
  private updateAllVolumes(): void {
    if (this.backgroundMusic) {
      this.backgroundMusic.setVolume(this.audioSettings.musicVolume * this.audioSettings.masterVolume);
    }

    this.ambientSounds.forEach(ambient => {
      ambient.setVolume(this.audioSettings.ambientVolume * this.audioSettings.masterVolume);
    });
  }

  /**
   * 暂停所有音频
   */
  private pauseAllAudio(): void {
    this.scene.sound.pauseAll();
  }

  /**
   * 恢复所有音频
   */
  private resumeAllAudio(): void {
    if (!this.audioSettings.isMuted) {
      this.scene.sound.resumeAll();
    }
  }

  /**
   * 处理季节变化
   */
  private handleSeasonChange(season: string): void {
    const musicTracks = {
      spring: 'farm_music_spring',
      summer: 'farm_music_summer',
      autumn: 'farm_music_autumn',
      winter: 'farm_music_winter'
    };

    const trackKey = musicTracks[season as keyof typeof musicTracks];
    if (trackKey) {
      this.playBackgroundMusic(trackKey, true);
    }
  }

  /**
   * 处理时间变化
   */
  private handleTimeChange(timeData: { hour: number; isDay: boolean }): void {
    // 根据时间调整环境音
    if (timeData.isDay) {
      this.playAmbientSound('birds_chirping', true, 0.7);
    } else {
      this.stopAmbientSound('birds_chirping');
    }
  }

  /**
   * 获取音频设置
   */
  public getAudioSettings() {
    return { ...this.audioSettings };
  }

  /**
   * 播放农场相关音效的便捷方法
   */
  public playFarmSound(action: string, volume?: number): void {
    const soundMap: Record<string, string> = {
      plant: 'plant_seed',
      water: 'water_crop',
      harvest: 'harvest_crop',
      cook: 'cooking_start',
      cookDone: 'cooking_complete',
      meow: 'cat_meow',
      purr: 'cat_purr',
      walk: 'footstep_grass',
      click: 'ui_click',
      hover: 'ui_hover'
    };

    const soundKey = soundMap[action];
    if (soundKey) {
      this.playSoundEffect(soundKey, { volume });
    }
  }

  /**
   * 销毁音频管理器
   */
  public destroy(): void {
    this.scene.sound.stopAll();
    this.soundEffects.clear();
    this.ambientSounds.clear();
    this.audioPool.clear();
    this.gameManager.off('game-paused', this.pauseAllAudio, this);
    this.gameManager.off('game-resumed', this.resumeAllAudio, this);
    this.gameManager.off('season-changed', this.handleSeasonChange, this);
    this.gameManager.off('time-changed', this.handleTimeChange, this);
  }
}