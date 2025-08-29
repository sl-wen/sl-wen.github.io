/**
 * 游戏音效管理系统
 * 负责管理背景音乐、音效和音频设置
 */
export class SoundManager {
  private static instance: SoundManager;
  private scene: Phaser.Scene | null = null;
  private isMuted: boolean = false;
  private musicVolume: number = 0.5;
  private sfxVolume: number = 0.7;
  private currentMusic: string | null = null;

  // 音效配置
  private readonly soundEffects = {
    // 移动音效
    walk: { key: 'walk', volume: 0.3 },
    run: { key: 'run', volume: 0.4 },
    
    // 战斗音效
    attack: { key: 'attack', volume: 0.6 },
    hit: { key: 'hit', volume: 0.5 },
    enemyDeath: { key: 'enemy_death', volume: 0.4 },
    playerHit: { key: 'player_hit', volume: 0.5 },
    
    // 交互音效
    pickup: { key: 'pickup', volume: 0.4 },
    openChest: { key: 'open_chest', volume: 0.5 },
    doorOpen: { key: 'door_open', volume: 0.4 },
    
    // UI音效
    buttonClick: { key: 'button_click', volume: 0.3 },
    menuOpen: { key: 'menu_open', volume: 0.3 },
    levelUp: { key: 'level_up', volume: 0.6 },
    
    // 环境音效
    wind: { key: 'wind', volume: 0.2 },
    water: { key: 'water', volume: 0.3 },
    fire: { key: 'fire', volume: 0.4 }
  };

  // 背景音乐配置
  private readonly backgroundMusic = {
    mainMenu: { key: 'main_menu_music', volume: 0.4, loop: true },
    village: { key: 'village_music', volume: 0.3, loop: true },
    forest: { key: 'forest_music', volume: 0.3, loop: true },
    cave: { key: 'cave_music', volume: 0.3, loop: true },
    battle: { key: 'battle_music', volume: 0.4, loop: true },
    victory: { key: 'victory_music', volume: 0.5, loop: false }
  };

  private constructor() {
    this.loadSettings();
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
  }

  /**
   * 加载音频资源
   */
  private loadAudioAssets(): void {
    if (!this.scene) return;

    // 加载音效
    Object.keys(this.soundEffects).forEach(key => {
      const config = this.soundEffects[key as keyof typeof this.soundEffects];
      this.scene!.load.audio(config.key, `assets/audio/sfx/${config.key}.mp3`);
    });

    // 加载背景音乐
    Object.keys(this.backgroundMusic).forEach(key => {
      const config = this.backgroundMusic[key as keyof typeof this.backgroundMusic];
      this.scene!.load.audio(config.key, `assets/audio/music/${config.key}.mp3`);
    });
  }

  /**
   * 播放背景音乐
   */
  public playBackgroundMusic(musicKey: keyof typeof this.backgroundMusic): void {
    if (!this.scene || this.isMuted) return;

    const config = this.backgroundMusic[musicKey];
    if (!config) return;

    // 停止当前音乐
    this.stopBackgroundMusic();

    // 播放新音乐
    this.scene.sound.play(config.key, {
      volume: config.volume * this.musicVolume,
      loop: config.loop
    });

    this.currentMusic = musicKey;
  }

  /**
   * 停止背景音乐
   */
  public stopBackgroundMusic(): void {
    if (!this.scene) return;

    if (this.currentMusic) {
      const config = this.backgroundMusic[this.currentMusic as keyof typeof this.backgroundMusic];
      if (config) {
        this.scene.sound.stopByKey(config.key);
      }
      this.currentMusic = null;
    }
  }

  /**
   * 播放音效
   */
  public playSoundEffect(soundKey: keyof typeof this.soundEffects): void {
    if (!this.scene || this.isMuted) return;

    const config = this.soundEffects[soundKey];
    if (!config) return;

    this.scene.sound.play(config.key, {
      volume: config.volume * this.sfxVolume
    });
  }

  /**
   * 设置静音状态
   */
  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    this.saveSettings();

    if (muted) {
      this.stopBackgroundMusic();
    } else if (this.currentMusic) {
      this.playBackgroundMusic(this.currentMusic as keyof typeof this.backgroundMusic);
    }
  }

  /**
   * 设置音乐音量
   */
  public setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    this.saveSettings();

    // 更新当前音乐音量
    if (this.currentMusic && this.scene) {
      const config = this.backgroundMusic[this.currentMusic as keyof typeof this.backgroundMusic];
      if (config) {
        this.scene.sound.setVolume(config.volume * this.musicVolume, config.key);
      }
    }
  }

  /**
   * 设置音效音量
   */
  public setSFXVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
  }

  /**
   * 获取当前设置
   */
  public getSettings() {
    return {
      isMuted: this.isMuted,
      musicVolume: this.musicVolume,
      sfxVolume: this.sfxVolume
    };
  }

  /**
   * 加载设置
   */
  private loadSettings(): void {
    try {
      const saved = localStorage.getItem('game_sound_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.isMuted = settings.isMuted ?? false;
        this.musicVolume = settings.musicVolume ?? 0.5;
        this.sfxVolume = settings.sfxVolume ?? 0.7;
      }
    } catch (error) {
      console.warn('Failed to load sound settings:', error);
    }
  }

  /**
   * 保存设置
   */
  private saveSettings(): void {
    try {
      const settings = {
        isMuted: this.isMuted,
        musicVolume: this.musicVolume,
        sfxVolume: this.sfxVolume
      };
      localStorage.setItem('game_sound_settings', JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save sound settings:', error);
    }
  }

  /**
   * 播放随机环境音效
   */
  public playRandomAmbientSound(): void {
    const ambientSounds = ['wind', 'water', 'fire'];
    const randomSound = ambientSounds[Math.floor(Math.random() * ambientSounds.length)];
    this.playSoundEffect(randomSound as keyof typeof this.soundEffects);
  }

  /**
   * 播放战斗音效序列
   */
  public playCombatSequence(): void {
    this.playSoundEffect('attack');
    
    // 延迟播放命中音效
    setTimeout(() => {
      this.playSoundEffect('hit');
    }, 200);
  }

  /**
   * 播放升级音效
   */
  public playLevelUpSound(): void {
    this.playSoundEffect('levelUp');
  }

  /**
   * 播放物品拾取音效
   */
  public playPickupSound(): void {
    this.playSoundEffect('pickup');
  }

  /**
   * 播放按钮点击音效
   */
  public playButtonClick(): void {
    this.playSoundEffect('buttonClick');
  }

  /**
   * 播放菜单打开音效
   */
  public playMenuOpen(): void {
    this.playSoundEffect('menuOpen');
  }
}