export class AudioManager {
  private static instance: AudioManager;
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private musicVolume: number = 0.5;
  private sfxVolume: number = 0.7;
  private isMuted: boolean = false;
  private currentMusic: AudioBufferSourceNode | null = null;

  private constructor() {
    this.initAudioContext();
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private initAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  // 加载音效文件
  public async loadSound(name: string, url: string): Promise<void> {
    if (!this.audioContext) return;

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.sounds.set(name, audioBuffer);
    } catch (error) {
      console.warn(`Failed to load sound: ${name}`, error);
    }
  }

  // 播放音效
  public playSound(name: string, volume: number = 1): void {
    if (!this.audioContext || this.isMuted || !this.sounds.has(name)) return;

    try {
      const buffer = this.sounds.get(name)!;
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = buffer;
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      gainNode.gain.value = this.sfxVolume * volume;

      source.start();
    } catch (error) {
      console.warn(`Failed to play sound: ${name}`, error);
    }
  }

  // 播放背景音乐
  public playMusic(name: string, loop: boolean = true): void {
    if (!this.audioContext || this.isMuted || !this.sounds.has(name)) return;

    // 停止当前音乐
    this.stopMusic();

    try {
      const buffer = this.sounds.get(name)!;
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = buffer;
      source.loop = loop;
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      gainNode.gain.value = this.musicVolume;

      source.start();
      this.currentMusic = source;
    } catch (error) {
      console.warn(`Failed to play music: ${name}`, error);
    }
  }

  // 停止背景音乐
  public stopMusic(): void {
    if (this.currentMusic) {
      try {
        this.currentMusic.stop();
      } catch (e) {
        // 音乐可能已经停止
      }
      this.currentMusic = null;
    }
  }

  // 设置音量
  public setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.currentMusic) {
      // 需要重新创建gainNode来改变音量
    }
  }

  public setSFXVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  // 静音/取消静音
  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted) {
      this.stopMusic();
    }
  }

  public isSoundMuted(): boolean {
    return this.isMuted;
  }

  // 预加载游戏音效
  public async preloadGameSounds(): Promise<void> {
    const soundFiles = [
      { name: 'hoe', url: '/assets/audio/hoe.wav' },
      { name: 'water', url: '/assets/audio/water.wav' },
      { name: 'plant', url: '/assets/audio/plant.wav' },
      { name: 'harvest', url: '/assets/audio/harvest.wav' },
      { name: 'coin', url: '/assets/audio/coin.wav' },
      { name: 'level_up', url: '/assets/audio/level_up.wav' },
      { name: 'menu_click', url: '/assets/audio/menu_click.wav' },
      { name: 'error', url: '/assets/audio/error.wav' },
      { name: 'success', url: '/assets/audio/success.wav' },
      { name: 'background_spring', url: '/assets/audio/spring_theme.mp3' },
      { name: 'background_summer', url: '/assets/audio/summer_theme.mp3' },
      { name: 'background_fall', url: '/assets/audio/fall_theme.mp3' },
      { name: 'background_winter', url: '/assets/audio/winter_theme.mp3' }
    ];

    const loadPromises = soundFiles.map(({ name, url }) =>
      this.loadSound(name, url).catch(() => {
        // 如果音效文件不存在，创建简单的音效
        this.createSyntheticSound(name);
      })
    );

    await Promise.all(loadPromises);
  }

  // 创建合成音效（当音效文件不存在时）
  private createSyntheticSound(name: string): void {
    if (!this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;
    let duration = 0.2; // 默认0.2秒
    let frequency = 440; // 默认频率

    // 根据音效名称设置参数
    switch (name) {
      case 'hoe':
        duration = 0.1;
        frequency = 200;
        break;
      case 'water':
        duration = 0.3;
        frequency = 800;
        break;
      case 'plant':
        duration = 0.15;
        frequency = 600;
        break;
      case 'harvest':
        duration = 0.2;
        frequency = 880;
        break;
      case 'coin':
        duration = 0.1;
        frequency = 1200;
        break;
      case 'level_up':
        duration = 0.5;
        frequency = 1000;
        break;
      case 'menu_click':
        duration = 0.05;
        frequency = 800;
        break;
      case 'error':
        duration = 0.2;
        frequency = 150;
        break;
      case 'success':
        duration = 0.3;
        frequency = 1500;
        break;
    }

    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      let value = 0;

      switch (name) {
        case 'hoe':
          // 短促的噪声
          value = (Math.random() - 0.5) * 0.3 * Math.exp(-t * 10);
          break;
        case 'water':
          // 流水声效果
          value = (Math.random() - 0.5) * 0.2 * Math.sin(2 * Math.PI * frequency * t);
          break;
        case 'plant':
          // 轻柔的音调
          value = Math.sin(2 * Math.PI * frequency * t) * 0.2 * Math.exp(-t * 5);
          break;
        case 'harvest':
          // 愉快的音调
          value = Math.sin(2 * Math.PI * frequency * t) * 0.3 * (1 - t / duration);
          break;
        case 'coin':
          // 清脆的金属声
          value = Math.sin(2 * Math.PI * frequency * t) * 0.4 * Math.exp(-t * 15);
          break;
        case 'level_up':
          // 上升音调
          const freq = frequency * (1 + t * 2);
          value = Math.sin(2 * Math.PI * freq * t) * 0.3 * (1 - t / duration);
          break;
        case 'menu_click':
          // 短促的点击声
          value = Math.sin(2 * Math.PI * frequency * t) * 0.2 * Math.exp(-t * 20);
          break;
        case 'error':
          // 低沉的错误音
          value = Math.sin(2 * Math.PI * frequency * t) * 0.4 * Math.exp(-t * 3);
          break;
        case 'success':
          // 成功的音调
          value = Math.sin(2 * Math.PI * frequency * t) * 0.3 * Math.sin(Math.PI * t / duration);
          break;
        default:
          value = Math.sin(2 * Math.PI * frequency * t) * 0.2 * (1 - t / duration);
      }

      data[i] = value;
    }

    this.sounds.set(name, buffer);
  }
}

// 游戏音效触发器
export class GameAudioTriggers {
  private audioManager: AudioManager;

  constructor() {
    this.audioManager = AudioManager.getInstance();
  }

  // 公开的预加载方法，避免直接访问私有 audioManager
  public async preloadGameSounds(): Promise<void> {
    return this.audioManager.preloadGameSounds();
  }

  // 工具使用音效
  public playToolSound(toolType: string): void {
    switch (toolType) {
      case 'hoe':
        this.audioManager.playSound('hoe');
        break;
      case 'watering_can':
        this.audioManager.playSound('water');
        break;
      case 'seeds':
        this.audioManager.playSound('plant');
        break;
    }
  }

  // 收获音效
  public playHarvestSound(): void {
    this.audioManager.playSound('harvest');
  }

  // 金币音效
  public playCoinSound(): void {
    this.audioManager.playSound('coin');
  }

  // 升级音效
  public playLevelUpSound(): void {
    this.audioManager.playSound('level_up');
  }

  // UI音效
  public playMenuClickSound(): void {
    this.audioManager.playSound('menu_click');
  }

  public playErrorSound(): void {
    this.audioManager.playSound('error');
  }

  public playSuccessSound(): void {
    this.audioManager.playSound('success');
  }

  // 季节背景音乐
  public playSeasonMusic(season: string): void {
    const musicName = `background_${season}`;
    this.audioManager.playMusic(musicName);
  }

  // 停止音乐
  public stopMusic(): void {
    this.audioManager.stopMusic();
  }

  // 设置音量
  public setVolume(musicVolume: number, sfxVolume: number): void {
    this.audioManager.setMusicVolume(musicVolume);
    this.audioManager.setSFXVolume(sfxVolume);
  }

  // 静音控制
  public setMuted(muted: boolean): void {
    this.audioManager.setMuted(muted);
  }

  public isMuted(): boolean {
    return this.audioManager.isSoundMuted();
  }
}