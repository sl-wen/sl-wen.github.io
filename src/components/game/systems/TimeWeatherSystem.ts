import * as Phaser from 'phaser';
import { GameManager } from './GameManager';
import { AudioManager } from './AudioManager';

/**
 * 天气类型枚举
 */
export enum WeatherType {
  SUNNY = 'sunny',
  CLOUDY = 'cloudy',
  RAINY = 'rainy',
  STORMY = 'stormy',
  SNOWY = 'snowy',
  WINDY = 'windy'
}

/**
 * 季节类型枚举
 */
export enum SeasonType {
  SPRING = 'spring',
  SUMMER = 'summer',
  AUTUMN = 'autumn',
  WINTER = 'winter'
}

/**
 * 时间天气系统类
 * 参考top-down-react-phaser-game的环境系统，提供完整的时间和天气模拟
 */
export class TimeWeatherSystem {
  private scene: Phaser.Scene;
  private gameManager: GameManager;
  private audioManager: AudioManager;

  // 时间系统
  private currentTime: {
    year: number;
    season: SeasonType;
    day: number;
    hour: number;
    minute: number;
  } = {
    year: 1,
    season: SeasonType.SPRING,
    day: 1,
    hour: 6, // 早上6点开始
    minute: 0
  };

  private timeSpeed: number = 1; // 时间流逝速度倍率
  private timeTimer: Phaser.Time.TimerEvent | null = null;
  private realMinuteToGameMinute = 1000; // 1秒 = 1游戏分钟

  // 天气系统
  private currentWeather: WeatherType = WeatherType.SUNNY;
  private weatherIntensity: number = 0.5; // 天气强度 0-1
  private weatherDuration: number = 0; // 当前天气持续时间
  private weatherChangeTimer: Phaser.Time.TimerEvent | null = null;

  // 视觉效果
  private lightingOverlay: Phaser.GameObjects.Graphics | null = null;
  private weatherParticles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private cloudSprites: Phaser.GameObjects.Sprite[] = [];
  private sunSprite: Phaser.GameObjects.Sprite | null = null;
  private moonSprite: Phaser.GameObjects.Sprite | null = null;

  // 环境音效
  private ambientSounds: Map<string, Phaser.Sound.BaseSound> = new Map();

  // 天气影响作物的系数
  private weatherEffects = {
    [WeatherType.SUNNY]: { growth: 1.0, water: -0.1 },
    [WeatherType.CLOUDY]: { growth: 0.9, water: 0 },
    [WeatherType.RAINY]: { growth: 1.2, water: 0.3 },
    [WeatherType.STORMY]: { growth: 0.7, water: 0.2 },
    [WeatherType.SNOWY]: { growth: 0.3, water: -0.2 },
    [WeatherType.WINDY]: { growth: 0.8, water: -0.2 }
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.gameManager = GameManager.getInstance();
    // 从场景获取共享的系统实例，避免重复创建
    this.audioManager = (scene as any).audioManager || new AudioManager(scene);
    
    this.initialize();
  }

  /**
   * 初始化系统
   */
  private initialize(): void {
    this.createVisualElements();
    this.startTimeSystem();
    this.startWeatherSystem();
    this.setupEventListeners();
    
    console.log('TimeWeatherSystem initialized');
  }

  /**
   * 创建视觉元素
   */
  private createVisualElements(): void {
    // 创建光照遮罩
    this.lightingOverlay = this.scene.add.graphics();
    this.lightingOverlay.setDepth(1000);

    // 创建太阳和月亮
    this.sunSprite = this.scene.add.sprite(100, 100, 'sun');
    this.sunSprite.setDepth(999);
    this.sunSprite.setScale(0.8);

    this.moonSprite = this.scene.add.sprite(100, 100, 'moon');
    this.moonSprite.setDepth(999);
    this.moonSprite.setScale(0.6);
    this.moonSprite.setVisible(false);

    // 创建云朵
    this.createClouds();

    // 更新初始光照
    this.updateLighting();
  }

  /**
   * 创建云朵
   */
  private createClouds(): void {
    const cloudCount = 5;
    const worldBounds = this.scene.cameras.main.getBounds();

    for (let i = 0; i < cloudCount; i++) {
      const cloud = this.scene.add.sprite(
        Math.random() * worldBounds.width,
        50 + Math.random() * 100,
        'cloud'
      );
      cloud.setDepth(998);
      cloud.setScale(0.5 + Math.random() * 0.5);
      cloud.setAlpha(0.7);
      this.cloudSprites.push(cloud);

      // 云朵缓慢移动
      this.scene.tweens.add({
        targets: cloud,
        x: cloud.x + 200,
        duration: 60000 + Math.random() * 30000,
        repeat: -1,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
    }
  }

  /**
   * 启动时间系统
   */
  private startTimeSystem(): void {
    this.timeTimer = this.scene.time.addEvent({
      delay: this.realMinuteToGameMinute / this.timeSpeed,
      callback: this.advanceTime,
      callbackScope: this,
      loop: true
    });
  }

  /**
   * 启动天气系统
   */
  private startWeatherSystem(): void {
    this.weatherChangeTimer = this.scene.time.addEvent({
      delay: 30000, // 每30秒检查天气变化
      callback: this.updateWeather,
      callbackScope: this,
      loop: true
    });

    // 初始天气
    this.setWeather(this.getRandomWeatherForSeason(), 0.5);
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    this.gameManager.on('game-paused', this.pauseTime, this);
    this.gameManager.on('game-resumed', this.resumeTime, this);
  }

  /**
   * 推进时间
   */
  private advanceTime(): void {
    this.currentTime.minute++;

    if (this.currentTime.minute >= 60) {
      this.currentTime.minute = 0;
      this.currentTime.hour++;

      if (this.currentTime.hour >= 24) {
        this.currentTime.hour = 0;
        this.currentTime.day++;

        // 检查季节变化
        if (this.currentTime.day > 30) {
          this.currentTime.day = 1;
          this.advanceSeason();
        }
      }

      // 每小时触发事件
      this.onHourChange();
    }

    // 更新视觉效果
    this.updateTimeVisuals();
    
    // 发送时间变化事件
    this.gameManager.emit('time-changed', {
      ...this.currentTime,
      isDay: this.isDaytime(),
      isDawn: this.isDawn(),
      isDusk: this.isDusk()
    });
  }

  /**
   * 推进季节
   */
  private advanceSeason(): void {
    const seasons = [SeasonType.SPRING, SeasonType.SUMMER, SeasonType.AUTUMN, SeasonType.WINTER];
    const currentIndex = seasons.indexOf(this.currentTime.season);
    const nextIndex = (currentIndex + 1) % seasons.length;
    
    if (nextIndex === 0) {
      this.currentTime.year++;
    }
    
    this.currentTime.season = seasons[nextIndex];
    
    // 发送季节变化事件
    this.gameManager.emit('season-changed', this.currentTime.season);
    
    console.log(`Season changed to ${this.currentTime.season}, Year ${this.currentTime.year}`);
  }

  /**
   * 小时变化处理
   */
  private onHourChange(): void {
    // 更新环境音效
    this.updateAmbientSounds();
    
    // 特定时间的事件
    switch (this.currentTime.hour) {
      case 6:
        this.audioManager.playFarmSound('rooster_crow');
        break;
      case 12:
        // 正午，最亮的时候
        break;
      case 18:
        // 傍晚，开始变暗
        break;
      case 22:
        // 夜晚，大部分NPC睡觉
        break;
    }
  }

  /**
   * 更新时间视觉效果
   */
  private updateTimeVisuals(): void {
    this.updateLighting();
    this.updateCelestialBodies();
  }

  /**
   * 更新光照
   */
  private updateLighting(): void {
    if (!this.lightingOverlay) return;

    this.lightingOverlay.clear();

    let lightLevel = this.calculateLightLevel();
    let lightColor = this.calculateLightColor();

    // 应用天气影响
    if (this.currentWeather === WeatherType.CLOUDY || this.currentWeather === WeatherType.STORMY) {
      lightLevel *= 0.7;
    } else if (this.currentWeather === WeatherType.RAINY) {
      lightLevel *= 0.6;
      lightColor = this.blendColors(lightColor, 0x4a6fa5, 0.3); // 蓝色调
    } else if (this.currentWeather === WeatherType.SNOWY) {
      lightLevel *= 0.8;
      lightColor = this.blendColors(lightColor, 0xe6f3ff, 0.4); // 白色调
    }

    // 创建光照遮罩
    const alpha = 1 - lightLevel;
    if (alpha > 0) {
      const bounds = this.scene.cameras.main.getBounds();
      this.lightingOverlay.fillStyle(lightColor, alpha);
      this.lightingOverlay.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
    }
  }

  /**
   * 计算光照强度
   */
  private calculateLightLevel(): number {
    const hour = this.currentTime.hour + this.currentTime.minute / 60;
    
    if (hour >= 6 && hour <= 18) {
      // 白天
      if (hour >= 10 && hour <= 14) {
        return 1.0; // 正午最亮
      } else {
        // 渐变到最亮/最暗
        const distanceFromNoon = Math.abs(hour - 12);
        return Math.max(0.3, 1.0 - (distanceFromNoon - 2) * 0.2);
      }
    } else {
      // 夜晚
      return 0.1;
    }
  }

  /**
   * 计算光照颜色
   */
  private calculateLightColor(): number {
    const hour = this.currentTime.hour + this.currentTime.minute / 60;
    
    if (this.isDawn()) {
      return 0xffa500; // 橙色（黎明）
    } else if (this.isDusk()) {
      return 0xff6b35; // 红橙色（黄昏）
    } else if (this.isDaytime()) {
      return 0xffffff; // 白色（白天）
    } else {
      return 0x191970; // 深蓝色（夜晚）
    }
  }

  /**
   * 更新天体（太阳/月亮）位置
   */
  private updateCelestialBodies(): void {
    const bounds = this.scene.cameras.main.getBounds();
    const hour = this.currentTime.hour + this.currentTime.minute / 60;
    
    // 计算天体位置（弧形轨迹）
    const progress = (hour - 6) / 12; // 6点到18点的进度
    const angle = progress * Math.PI; // 半圆弧
    const centerX = bounds.width / 2;
    const centerY = bounds.height;
    const radius = bounds.height * 0.8;
    
    const x = centerX + Math.cos(angle + Math.PI) * radius;
    const y = centerY + Math.sin(angle + Math.PI) * radius;

    if (this.isDaytime()) {
      if (this.sunSprite) {
        this.sunSprite.setPosition(x, y);
        this.sunSprite.setVisible(true);
      }
      if (this.moonSprite) {
        this.moonSprite.setVisible(false);
      }
    } else {
      if (this.moonSprite) {
        // 月亮在夜晚的对面位置
        const nightProgress = (hour > 18 ? hour - 18 : hour + 6) / 12;
        const nightAngle = nightProgress * Math.PI;
        const moonX = centerX + Math.cos(nightAngle + Math.PI) * radius;
        const moonY = centerY + Math.sin(nightAngle + Math.PI) * radius;
        this.moonSprite.setPosition(moonX, moonY);
        this.moonSprite.setVisible(true);
      }
      if (this.sunSprite) {
        this.sunSprite.setVisible(false);
      }
    }
  }

  /**
   * 更新天气
   */
  private updateWeather(): void {
    this.weatherDuration++;
    
    // 根据持续时间和随机因素决定是否改变天气
    const changeChance = Math.min(this.weatherDuration * 0.1, 0.3);
    
    if (Math.random() < changeChance) {
      const newWeather = this.getRandomWeatherForSeason();
      const newIntensity = 0.3 + Math.random() * 0.7;
      this.setWeather(newWeather, newIntensity);
    }
  }

  /**
   * 设置天气
   */
  public setWeather(weather: WeatherType, intensity: number = 0.5): void {
    this.currentWeather = weather;
    this.weatherIntensity = intensity;
    this.weatherDuration = 0;

    this.updateWeatherVisuals();
    this.updateWeatherSounds();
    
    // 发送天气变化事件
    this.gameManager.emit('weather-changed', {
      weather: this.currentWeather,
      intensity: this.weatherIntensity
    });

    console.log(`Weather changed to ${weather} with intensity ${intensity}`);
  }

  /**
   * 更新天气视觉效果
   */
  private updateWeatherVisuals(): void {
    // 清除现有粒子效果
    if (this.weatherParticles) {
      this.weatherParticles.stop();
      this.weatherParticles = null;
    }

    // 更新云朵透明度
    const cloudAlpha = this.getCloudAlphaForWeather();
    this.cloudSprites.forEach(cloud => {
      cloud.setAlpha(cloudAlpha);
    });

    // 创建天气粒子效果
    this.createWeatherParticles();
  }

  /**
   * 创建天气粒子效果
   */
  private createWeatherParticles(): void {
    const bounds = this.scene.cameras.main.getBounds();

    switch (this.currentWeather) {
      case WeatherType.RAINY:
        this.weatherParticles = this.scene.add.particles(0, 0, 'raindrop', {
          x: { min: bounds.x, max: bounds.x + bounds.width },
          y: bounds.y - 50,
          speedY: { min: 200, max: 400 },
          speedX: { min: -50, max: 50 },
          scale: { min: 0.3, max: 0.7 },
          alpha: { min: 0.3, max: 0.8 },
          lifespan: 3000,
          quantity: Math.floor(this.weatherIntensity * 10)
        });
        break;

      case WeatherType.SNOWY:
        this.weatherParticles = this.scene.add.particles(0, 0, 'snowflake', {
          x: { min: bounds.x, max: bounds.x + bounds.width },
          y: bounds.y - 50,
          speedY: { min: 50, max: 150 },
          speedX: { min: -30, max: 30 },
          scale: { min: 0.2, max: 0.8 },
          alpha: { min: 0.6, max: 1.0 },
          lifespan: 5000,
          quantity: Math.floor(this.weatherIntensity * 8)
        });
        break;

      case WeatherType.STORMY:
        // 闪电效果
        this.createLightningEffect();
        break;
    }

    if (this.weatherParticles) {
      this.weatherParticles.setDepth(997);
    }
  }

  /**
   * 创建闪电效果
   */
  private createLightningEffect(): void {
    const lightningInterval = 5000 / this.weatherIntensity;
    
    this.scene.time.addEvent({
      delay: lightningInterval,
      callback: () => {
        if (this.currentWeather === WeatherType.STORMY) {
          // 闪电闪光效果
          const flash = this.scene.add.graphics();
          flash.fillStyle(0xffffff, 0.8);
          const bounds = this.scene.cameras.main.getBounds();
          flash.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
          flash.setDepth(1001);

          // 快速闪烁
          this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 100,
            yoyo: true,
            repeat: 2,
            onComplete: () => flash.destroy()
          });

          // 雷声
          this.scene.time.delayedCall(200, () => {
            this.audioManager.playSoundEffect('thunder', { volume: this.weatherIntensity });
          });
        }
      },
      loop: true
    });
  }

  /**
   * 更新天气音效
   */
  private updateWeatherSounds(): void {
    // 停止所有天气音效
    this.ambientSounds.forEach(sound => sound.stop());
    this.ambientSounds.clear();

    // 播放新的天气音效
    switch (this.currentWeather) {
      case WeatherType.RAINY:
        this.audioManager.playAmbientSound('rain', true, this.weatherIntensity);
        break;
      case WeatherType.WINDY:
        this.audioManager.playAmbientSound('wind', true, this.weatherIntensity);
        break;
      case WeatherType.STORMY:
        this.audioManager.playAmbientSound('storm', true, this.weatherIntensity);
        break;
    }
  }

  /**
   * 更新环境音效
   */
  private updateAmbientSounds(): void {
    if (this.isDaytime()) {
      this.audioManager.playAmbientSound('birds_chirping', true, 0.6);
      this.audioManager.stopAmbientSound('night_crickets');
    } else {
      this.audioManager.playAmbientSound('night_crickets', true, 0.4);
      this.audioManager.stopAmbientSound('birds_chirping');
    }
  }

  /**
   * 获取季节对应的随机天气
   */
  private getRandomWeatherForSeason(): WeatherType {
    const weatherProbabilities = {
      [SeasonType.SPRING]: {
        [WeatherType.SUNNY]: 0.4,
        [WeatherType.CLOUDY]: 0.3,
        [WeatherType.RAINY]: 0.25,
        [WeatherType.WINDY]: 0.05
      },
      [SeasonType.SUMMER]: {
        [WeatherType.SUNNY]: 0.6,
        [WeatherType.CLOUDY]: 0.2,
        [WeatherType.STORMY]: 0.15,
        [WeatherType.WINDY]: 0.05
      },
      [SeasonType.AUTUMN]: {
        [WeatherType.CLOUDY]: 0.4,
        [WeatherType.RAINY]: 0.3,
        [WeatherType.WINDY]: 0.2,
        [WeatherType.SUNNY]: 0.1
      },
      [SeasonType.WINTER]: {
        [WeatherType.SNOWY]: 0.4,
        [WeatherType.CLOUDY]: 0.3,
        [WeatherType.SUNNY]: 0.2,
        [WeatherType.WINDY]: 0.1
      }
    };

    const probabilities = weatherProbabilities[this.currentTime.season];
    const random = Math.random();
    let cumulative = 0;

    for (const [weather, probability] of Object.entries(probabilities)) {
      cumulative += probability;
      if (random <= cumulative) {
        return weather as WeatherType;
      }
    }

    return WeatherType.SUNNY;
  }

  /**
   * 获取云朵透明度
   */
  private getCloudAlphaForWeather(): number {
    switch (this.currentWeather) {
      case WeatherType.SUNNY: return 0.3;
      case WeatherType.CLOUDY: return 0.7;
      case WeatherType.RAINY: return 0.8;
      case WeatherType.STORMY: return 0.9;
      case WeatherType.SNOWY: return 0.6;
      case WeatherType.WINDY: return 0.5;
      default: return 0.5;
    }
  }

  /**
   * 混合颜色
   */
  private blendColors(color1: number, color2: number, ratio: number): number {
    const r1 = (color1 >> 16) & 0xff;
    const g1 = (color1 >> 8) & 0xff;
    const b1 = color1 & 0xff;

    const r2 = (color2 >> 16) & 0xff;
    const g2 = (color2 >> 8) & 0xff;
    const b2 = color2 & 0xff;

    const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
    const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
    const b = Math.round(b1 * (1 - ratio) + b2 * ratio);

    return (r << 16) | (g << 8) | b;
  }

  /**
   * 时间检查方法
   */
  public isDaytime(): boolean {
    return this.currentTime.hour >= 6 && this.currentTime.hour < 18;
  }

  public isDawn(): boolean {
    return this.currentTime.hour >= 5 && this.currentTime.hour < 7;
  }

  public isDusk(): boolean {
    return this.currentTime.hour >= 17 && this.currentTime.hour < 19;
  }

  /**
   * 获取天气对作物的影响
   */
  public getWeatherEffect(): { growth: number; water: number } {
    return this.weatherEffects[this.currentWeather] || { growth: 1.0, water: 0 };
  }

  /**
   * 获取当前时间信息
   */
  public getCurrentTime() {
    return { ...this.currentTime };
  }

  /**
   * 获取当前天气信息
   */
  public getCurrentWeather(): { weather: WeatherType; intensity: number } {
    return {
      weather: this.currentWeather,
      intensity: this.weatherIntensity
    };
  }

  /**
   * 设置时间速度
   */
  public setTimeSpeed(speed: number): void {
    this.timeSpeed = Math.max(0.1, Math.min(speed, 10));
    
    if (this.timeTimer) {
      this.timeTimer.destroy();
      this.startTimeSystem();
    }
  }

  /**
   * 暂停时间
   */
  private pauseTime(): void {
    if (this.timeTimer) {
      this.timeTimer.paused = true;
    }
    if (this.weatherChangeTimer) {
      this.weatherChangeTimer.paused = true;
    }
  }

  /**
   * 恢复时间
   */
  private resumeTime(): void {
    if (this.timeTimer) {
      this.timeTimer.paused = false;
    }
    if (this.weatherChangeTimer) {
      this.weatherChangeTimer.paused = false;
    }
  }

  /**
   * 销毁系统
   */
  public destroy(): void {
    if (this.timeTimer) {
      this.timeTimer.destroy();
    }
    if (this.weatherChangeTimer) {
      this.weatherChangeTimer.destroy();
    }
    if (this.weatherParticles) {
      this.weatherParticles.destroy();
    }
    if (this.lightingOverlay) {
      this.lightingOverlay.destroy();
    }

    this.ambientSounds.forEach(sound => sound.destroy());
    this.ambientSounds.clear();

    this.gameManager.off('game-paused', this.pauseTime, this);
    this.gameManager.off('game-resumed', this.resumeTime, this);
  }
}