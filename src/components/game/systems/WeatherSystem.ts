import * as Phaser from 'phaser';

/**
 * 天气类型枚举
 */
export enum WeatherType {
    SUNNY = 'sunny',
    CLOUDY = 'cloudy',
    RAINY = 'rainy',
    STORMY = 'stormy',
    SNOWY = 'snowy',
    FOGGY = 'foggy'
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
 * 天气状态接口
 */
export interface WeatherState {
    type: WeatherType;
    intensity: number;           // 强度 0-1
    duration: number;           // 持续时间（毫秒）
    temperature: number;        // 温度 (-20 to 40)
    humidity: number;          // 湿度 0-1
    windSpeed: number;         // 风速 0-1
}

/**
 * 季节配置接口
 */
export interface SeasonConfig {
    season: SeasonType;
    duration: number;           // 季节持续时间（毫秒）
    baseTemperature: number;    // 基础温度
    weatherProbabilities: Record<WeatherType, number>; // 各种天气的概率
    cropGrowthMultiplier: number; // 作物生长速度倍数
    tintColor: number;         // 季节色调
}

/**
 * 天气系统类
 * 负责管理游戏中的天气变化、季节循环和相关视觉效果
 */
export class WeatherSystem {
    private scene: Phaser.Scene;
    private currentWeather: WeatherState;
    private currentSeason: SeasonType;
    private seasonStartTime: number;

    // 视觉效果相关
    private weatherParticles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
    private weatherOverlay: Phaser.GameObjects.Rectangle | null = null;
    private lightingOverlay: Phaser.GameObjects.Rectangle | null = null;
    private cloudSprites: Phaser.GameObjects.Sprite[] = [];

    // 音效相关
    private weatherSounds: Map<WeatherType, Phaser.Sound.BaseSound> = new Map();
    private ambientSound: Phaser.Sound.BaseSound | null = null;

    // 配置
    private seasonConfigs: Record<SeasonType, SeasonConfig> = {
        [SeasonType.SPRING]: {
            season: SeasonType.SPRING,
            duration: 120000, // 2分钟
            baseTemperature: 15,
            weatherProbabilities: {
                [WeatherType.SUNNY]: 0.4,
                [WeatherType.CLOUDY]: 0.3,
                [WeatherType.RAINY]: 0.2,
                [WeatherType.STORMY]: 0.05,
                [WeatherType.SNOWY]: 0.05,
                [WeatherType.FOGGY]: 0.0
            },
            cropGrowthMultiplier: 1.2,
            tintColor: 0x90EE90
        },
        [SeasonType.SUMMER]: {
            season: SeasonType.SUMMER,
            duration: 120000,
            baseTemperature: 28,
            weatherProbabilities: {
                [WeatherType.SUNNY]: 0.6,
                [WeatherType.CLOUDY]: 0.2,
                [WeatherType.RAINY]: 0.1,
                [WeatherType.STORMY]: 0.1,
                [WeatherType.SNOWY]: 0.0,
                [WeatherType.FOGGY]: 0.0
            },
            cropGrowthMultiplier: 1.5,
            tintColor: 0xFFD700
        },
        [SeasonType.AUTUMN]: {
            season: SeasonType.AUTUMN,
            duration: 120000,
            baseTemperature: 12,
            weatherProbabilities: {
                [WeatherType.SUNNY]: 0.3,
                [WeatherType.CLOUDY]: 0.4,
                [WeatherType.RAINY]: 0.2,
                [WeatherType.STORMY]: 0.05,
                [WeatherType.SNOWY]: 0.05,
                [WeatherType.FOGGY]: 0.0
            },
            cropGrowthMultiplier: 0.8,
            tintColor: 0xFFA500
        },
        [SeasonType.WINTER]: {
            season: SeasonType.WINTER,
            duration: 120000,
            baseTemperature: -5,
            weatherProbabilities: {
                [WeatherType.SUNNY]: 0.2,
                [WeatherType.CLOUDY]: 0.3,
                [WeatherType.RAINY]: 0.1,
                [WeatherType.STORMY]: 0.05,
                [WeatherType.SNOWY]: 0.3,
                [WeatherType.FOGGY]: 0.05
            },
            cropGrowthMultiplier: 0.3,
            tintColor: 0xB0E0E6
        }
    };

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.currentSeason = SeasonType.SPRING;
        this.seasonStartTime = Date.now();

        // 初始化天气状态
        this.currentWeather = {
            type: WeatherType.SUNNY,
            intensity: 0.5,
            duration: 30000, // 30秒
            temperature: 20,
            humidity: 0.5,
            windSpeed: 0.3
        };

        this.initializeWeatherSystem();
    }

    /**
     * 初始化天气系统
     */
    private initializeWeatherSystem(): void {
        this.createWeatherOverlay();
        this.createLightingSystem();
        this.generateRandomWeather();

        // 设置天气更新定时器
        this.scene.time.addEvent({
            delay: 10000, // 每10秒检查一次天气变化
            callback: this.updateWeatherCycle,
            callbackScope: this,
            loop: true
        });
    }

    /**
     * 创建天气覆盖层
     */
    private createWeatherOverlay(): void {
        const { width, height } = this.scene.cameras.main;

        this.weatherOverlay = this.scene.add.rectangle(
            width / 2,
            height / 2,
            width,
            height,
            0x000000,
            0
        );
        this.weatherOverlay.setDepth(1000);
    }

    /**
     * 创建光照系统
     */
    private createLightingSystem(): void {
        const { width, height } = this.scene.cameras.main;

        this.lightingOverlay = this.scene.add.rectangle(
            width / 2,
            height / 2,
            width,
            height,
            0xFFFFFF,
            0.1
        );
        this.lightingOverlay.setDepth(999);
        this.lightingOverlay.setBlendMode(Phaser.BlendModes.MULTIPLY);
    }

    /**
     * 更新天气循环
     */
    private updateWeatherCycle(): void {
        // 检查季节变化
        this.checkSeasonChange();

        // 随机生成新天气
        if (Math.random() < 0.3) { // 30%概率改变天气
            this.generateRandomWeather();
        }
    }

    /**
     * 检查季节变化
     */
    private checkSeasonChange(): void {
        const currentTime = Date.now();
        const seasonDuration = this.seasonConfigs[this.currentSeason].duration;

        if (currentTime - this.seasonStartTime > seasonDuration) {
            this.changeSeason();
        }
    }

    /**
     * 改变季节
     */
    private changeSeason(): void {
        const seasons = Object.values(SeasonType);
        const currentIndex = seasons.indexOf(this.currentSeason);
        const nextIndex = (currentIndex + 1) % seasons.length;

        this.currentSeason = seasons[nextIndex];
        this.seasonStartTime = Date.now();

        // 应用季节效果
        this.applySeasonEffects();

        // 触发季节变化事件
        this.scene.events.emit('seasonChanged', this.currentSeason);

        console.log(`Season changed to: ${this.currentSeason}`);
    }

    /**
     * 应用季节效果
     */
    private applySeasonEffects(): void {
        const seasonConfig = this.seasonConfigs[this.currentSeason];

        // 应用季节色调
        if (this.lightingOverlay) {
            this.scene.tweens.add({
                targets: this.lightingOverlay,
                alpha: 0.2,
                duration: 2000,
                ease: 'Power2',
                onComplete: () => {
                    if (this.lightingOverlay) {
                        this.lightingOverlay.setTint(seasonConfig.tintColor);
                    }
                }
            });
        }
    }

    /**
     * 生成随机天气
     */
    private generateRandomWeather(): void {
        const seasonConfig = this.seasonConfigs[this.currentSeason];
        const weatherTypes = Object.keys(seasonConfig.weatherProbabilities) as WeatherType[];

        // 根据概率选择天气类型
        const random = Math.random();
        let cumulativeProbability = 0;
        let selectedWeather = WeatherType.SUNNY;

        for (const weatherType of weatherTypes) {
            cumulativeProbability += seasonConfig.weatherProbabilities[weatherType];
            if (random <= cumulativeProbability) {
                selectedWeather = weatherType;
                break;
            }
        }

        // 生成天气参数
        this.currentWeather = {
            type: selectedWeather,
            intensity: Math.random() * 0.7 + 0.3, // 0.3-1.0
            duration: Math.random() * 40000 + 20000, // 20-60秒
            temperature: seasonConfig.baseTemperature + (Math.random() - 0.5) * 10,
            humidity: Math.random(),
            windSpeed: Math.random()
        };

        this.applyWeatherEffects();
    }

    /**
     * 应用天气效果
     */
    private applyWeatherEffects(): void {
        // 清除之前的效果
        this.clearWeatherEffects();

        switch (this.currentWeather.type) {
            case WeatherType.RAINY:
                this.createRainEffect();
                break;
            case WeatherType.SNOWY:
                this.createSnowEffect();
                break;
            case WeatherType.STORMY:
                this.createStormEffect();
                break;
            case WeatherType.CLOUDY:
                this.createCloudyEffect();
                break;
            case WeatherType.FOGGY:
                this.createFogEffect();
                break;
            case WeatherType.SUNNY:
                this.createSunnyEffect();
                break;
        }

        // 播放天气音效
        this.playWeatherSound();

        // 触发天气变化事件
        this.scene.events.emit('weatherChanged', this.currentWeather);
    }

    /**
     * 创建雨效果
     */
    private createRainEffect(): void {
        const { width, height } = this.scene.cameras.main;

        // 创建雨滴粒子系统
        if (this.scene.add.particles) {
            this.weatherParticles = this.scene.add.particles(width / 2, -50, 'rainDrop', {
                x: { min: 0, max: width },
                y: { min: -50, max: -10 },
                speedY: { min: 200, max: 400 },
                speedX: { min: -50, max: 50 },
                scale: { min: 0.5, max: 1.0 },
                alpha: { min: 0.6, max: 1.0 },
                lifespan: 3000,
                quantity: this.currentWeather.intensity * 20
            });
            this.weatherParticles.setDepth(998);
        }

        // 添加雨天覆盖层
        if (this.weatherOverlay) {
            this.weatherOverlay.setFillStyle(0x4A90E2, 0.2 * this.currentWeather.intensity);
        }
    }

    /**
     * 创建雪效果
     */
    private createSnowEffect(): void {
        const { width, height } = this.scene.cameras.main;

        // 创建雪花粒子系统
        if (this.scene.add.particles) {
            this.weatherParticles = this.scene.add.particles(width / 2, -50, 'snowFlake', {
                x: { min: 0, max: width },
                y: { min: -50, max: -10 },
                speedY: { min: 50, max: 150 },
                speedX: { min: -30, max: 30 },
                scale: { min: 0.3, max: 0.8 },
                alpha: { min: 0.7, max: 1.0 },
                lifespan: 5000,
                quantity: this.currentWeather.intensity * 15,
                rotate: { min: 0, max: 360 }
            });
            this.weatherParticles.setDepth(998);
        }

        // 添加雪天覆盖层
        if (this.weatherOverlay) {
            this.weatherOverlay.setFillStyle(0xFFFFFF, 0.15 * this.currentWeather.intensity);
        }
    }

    /**
     * 创建暴风雨效果
     */
    private createStormEffect(): void {
        this.createRainEffect(); // 先创建雨效果

        // 添加闪电效果
        this.createLightningEffect();

        // 增强雨天效果
        if (this.weatherOverlay) {
            this.weatherOverlay.setFillStyle(0x2C3E50, 0.4 * this.currentWeather.intensity);
        }
    }

    /**
     * 创建闪电效果
     */
    private createLightningEffect(): void {
        const lightningInterval = this.scene.time.addEvent({
            delay: Math.random() * 5000 + 3000, // 3-8秒随机间隔
            callback: () => {
                if (this.lightingOverlay) {
                    // 闪电闪烁
                    this.lightingOverlay.setAlpha(0.8);
                    this.lightingOverlay.setTint(0xFFFFFF);

                    this.scene.tweens.add({
                        targets: this.lightingOverlay,
                        alpha: 0.1,
                        duration: 200,
                        ease: 'Power2'
                    });
                }

                // 雷声延迟
                this.scene.time.delayedCall(500, () => {
                    // 播放雷声音效（如果有的话）
                    this.playThunderSound();
                });
            },
            loop: true
        });

        // 暴风雨结束时清除闪电
        this.scene.time.delayedCall(this.currentWeather.duration, () => {
            lightningInterval.destroy();
        });
    }

    /**
     * 创建多云效果
     */
    private createCloudyEffect(): void {
        // 添加云朵
        this.createClouds();

        // 稍微变暗
        if (this.weatherOverlay) {
            this.weatherOverlay.setFillStyle(0x708090, 0.1 * this.currentWeather.intensity);
        }
    }

    /**
     * 创建雾效果
     */
    private createFogEffect(): void {
        if (this.weatherOverlay) {
            this.weatherOverlay.setFillStyle(0xF0F8FF, 0.3 * this.currentWeather.intensity);
        }
    }

    /**
     * 创建晴天效果
     */
    private createSunnyEffect(): void {
        // 明亮的覆盖层
        if (this.weatherOverlay) {
            this.weatherOverlay.setFillStyle(0xFFD700, 0.05);
        }
    }

    /**
     * 创建云朵
     */
    private createClouds(): void {
        const { width } = this.scene.cameras.main;
        const cloudCount = Math.floor(this.currentWeather.intensity * 5) + 2;

        for (let i = 0; i < cloudCount; i++) {
            // 创建简单的云朵图形
            const cloud = this.scene.add.ellipse(
                Math.random() * width,
                Math.random() * 200 + 50,
                Math.random() * 100 + 60,
                Math.random() * 50 + 30,
                0xFFFFFF,
                0.7
            );

            cloud.setDepth(997);
            this.cloudSprites.push(cloud);

            // 云朵漂移动画
            this.scene.tweens.add({
                targets: cloud,
                x: cloud.x + Math.random() * 200 - 100,
                duration: Math.random() * 20000 + 10000,
                ease: 'Linear',
                repeat: -1,
                yoyo: true
            });
        }
    }

    /**
     * 播放天气音效
     */
    private playWeatherSound(): void {
        // 停止之前的音效
        if (this.ambientSound) {
            this.ambientSound.stop();
        }

        // 根据天气类型播放对应音效
        const soundKey = `weather_${this.currentWeather.type}`;
        try {
            const audioCache = (this.scene.game as any).cache?.audio;
            const has = (audioCache && audioCache.exists && audioCache.exists(soundKey)) || ((this.scene.sound as any).get && (this.scene.sound as any).get(soundKey));
            if (has) {
                this.ambientSound = this.scene.sound.add(soundKey, {
                    loop: true,
                    volume: this.currentWeather.intensity * 0.3
                });
                this.ambientSound.play();
            }
        } catch { }
    }

    /**
     * 播放雷声音效
     */
    private playThunderSound(): void {
        try {
            const audioCache = (this.scene.game as any).cache?.audio;
            const has = (audioCache && audioCache.exists && audioCache.exists('thunder')) || ((this.scene.sound as any).get && (this.scene.sound as any).get('thunder'));
            if (has) {
                const thunderSound = this.scene.sound.add('thunder', {
                    volume: this.currentWeather.intensity * 0.5
                });
                thunderSound.play();
            }
        } catch { }
    }

    /**
     * 清除天气效果
     */
    private clearWeatherEffects(): void {
        // 清除粒子效果
        if (this.weatherParticles) {
            this.weatherParticles.destroy();
            this.weatherParticles = null;
        }

        // 清除云朵
        this.cloudSprites.forEach(cloud => cloud.destroy());
        this.cloudSprites = [];

        // 重置覆盖层
        if (this.weatherOverlay) {
            this.weatherOverlay.setAlpha(0);
        }

        // 停止音效
        if (this.ambientSound) {
            this.ambientSound.stop();
            this.ambientSound = null;
        }
    }

    /**
     * 获取当前天气状态
     */
    getCurrentWeather(): WeatherState {
        return { ...this.currentWeather };
    }

    /**
     * 获取当前季节
     */
    getCurrentSeason(): SeasonType {
        return this.currentSeason;
    }

    /**
     * 获取季节配置
     */
    getSeasonConfig(season?: SeasonType): SeasonConfig {
        return this.seasonConfigs[season || this.currentSeason];
    }

    /**
     * 手动设置天气
     */
    setWeather(weatherType: WeatherType, intensity: number = 0.5): void {
        this.currentWeather = {
            type: weatherType,
            intensity: Math.max(0, Math.min(1, intensity)),
            duration: 60000, // 1分钟
            temperature: this.seasonConfigs[this.currentSeason].baseTemperature,
            humidity: Math.random(),
            windSpeed: Math.random()
        };

        this.applyWeatherEffects();
    }

    /**
     * 手动设置季节
     */
    setSeason(season: SeasonType): void {
        this.currentSeason = season;
        this.seasonStartTime = Date.now();
        this.applySeasonEffects();
        this.generateRandomWeather();
    }

    /**
     * 更新系统
     */
    update(time: number, delta: number): void {
        // 更新粒子效果
        if (this.weatherParticles) {
            // 根据风速调整粒子方向
            const windEffect = this.currentWeather.windSpeed * 50;
            // 这里可以添加更多动态效果
        }
    }

    /**
     * 销毁天气系统
     */
    destroy(): void {
        this.clearWeatherEffects();

        if (this.weatherOverlay) {
            this.weatherOverlay.destroy();
        }

        if (this.lightingOverlay) {
            this.lightingOverlay.destroy();
        }

        this.weatherSounds.forEach(sound => {
            if (sound.isPlaying) {
                sound.stop();
            }
        });
        this.weatherSounds.clear();
    }
}