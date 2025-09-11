/**
 * WeatherEffectsManager - 天气效果管理器
 * 
 * 负责管理游戏中各种天气效果的视觉表现：
 * - 雨滴效果
 * - 雪花效果
 * - 风的粒子效果
 * - 雾气效果
 * - 闪电效果
 */

export default class WeatherEffectsManager {
    /**
     * @param {Phaser.Scene} scene Phaser场景实例
     */
    constructor(scene) {
        this.scene = scene;

        // 粒子系统
        this.rainEmitter = null;
        this.snowEmitter = null;
        this.windEmitter = null;
        this.fogOverlay = null;

        // 音效（预留）
        this.rainSound = null;
        this.windSound = null;
        this.thunderSound = null;

        // 当前天气状态
        this.currentWeather = 'clear';
        this.currentIntensity = 0.5;
        this.isTransitioning = false;

        this.initializeEffects();
    }

    /**
     * 初始化所有天气效果
     */
    initializeEffects() {
        this.createRainEffect();
        this.createSnowEffect();
        this.createWindEffect();
        this.createFogEffect();
    }

    /**
     * 创建雨滴效果
     */
    createRainEffect() {
        // 雨滴素材应该在BootScene中预加载，这里直接使用
        // 如果没有加载，创建备用纹理
        if (!this.scene.textures.exists('raindrop_0')) {
            console.warn('Rain drop textures not loaded, creating fallback texture');
            this.createFallbackRainTexture();
        }

        // 创建雨滴粒子发射器，使用真实的雨滴素材
        this.rainEmitter = this.scene.add.particles(0, -50, 'raindrop_0', {
            x: { min: -100, max: this.scene.scale.gameSize.width + 100 },
            y: -50,
            speedX: { min: -40, max: -20 }, // 倾斜的雨滴轨迹
            speedY: { min: 300, max: 500 }, // 更快的下落速度
            scale: { min: 1.0, max: 2.0 },  // 更大的雨滴
            alpha: { min: 0.6, max: 1.0 },  // 更明显的透明度
            lifespan: { min: 1500, max: 3000 }, // 适中的生命周期
            frequency: 30, // 更频繁的雨滴
            quantity: { min: 2, max: 4 }, // 每次发射更多雨滴
            // 轻微旋转模拟风的影响
            rotation: { min: -0.1, max: 0.1 }
        });

        this.rainEmitter.setDepth(1500);
        this.rainEmitter.stop();

        // 创建雨滴动画（如果纹理存在）
        this.createRainDropAnimation();
    }

    /**
     * 创建备用雨滴纹理
     */
    createFallbackRainTexture() {
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(0x87CEEB, 0.8);
        graphics.fillRect(0, 0, 2, 8);
        graphics.generateTexture('raindrop_0', 2, 8);
        graphics.destroy();
    }

    /**
     * 创建雨滴动画
     */
    createRainDropAnimation() {
        // 如果雨滴纹理存在，创建动画
        if (this.scene.textures.exists('raindrop_0') &&
            this.scene.textures.exists('raindrop_1') &&
            this.scene.textures.exists('raindrop_2')) {

            if (!this.scene.anims.exists('rain_drop_anim')) {
                this.scene.anims.create({
                    key: 'rain_drop_anim',
                    frames: [
                        { key: 'raindrop_0' },
                        { key: 'raindrop_1' },
                        { key: 'raindrop_2' }
                    ],
                    frameRate: 8,
                    repeat: -1
                });
            }
        }
    }

    /**
     * 创建雪花效果
     */
    createSnowEffect() {
        // 创建雪花纹理
        if (!this.scene.textures.exists('snowflake')) {
            const graphics = this.scene.add.graphics();
            graphics.lineStyle(1, 0xFFFFFF, 1);
            graphics.strokeCircle(3, 3, 2);
            graphics.fillStyle(0xFFFFFF, 0.8);
            graphics.fillCircle(3, 3, 1);
            graphics.generateTexture('snowflake', 6, 6);
            graphics.destroy();
        }

        this.snowEmitter = this.scene.add.particles(0, -50, 'snowflake', {
            x: { min: -50, max: this.scene.scale.gameSize.width + 50 },
            y: -50,
            speedX: { min: -30, max: 30 },
            speedY: { min: 50, max: 150 },
            scale: { min: 0.3, max: 1.0 },
            alpha: { min: 0.4, max: 0.9 },
            lifespan: 8000,
            frequency: 100,
            quantity: 1,
            // 添加飘动效果
            accelerationX: { min: -10, max: 10 },
            maxVelocityX: 50
        });

        this.snowEmitter.setDepth(1500);
        this.snowEmitter.stop();
    }

    /**
     * 创建风的粒子效果
     */
    createWindEffect() {
        // 创建风粒子纹理（小点）
        if (!this.scene.textures.exists('windparticle')) {
            const graphics = this.scene.add.graphics();
            graphics.fillStyle(0xE6E6FA, 0.6);
            graphics.fillCircle(1, 1, 1);
            graphics.generateTexture('windparticle', 2, 2);
            graphics.destroy();
        }

        this.windEmitter = this.scene.add.particles(-50, 0, 'windparticle', {
            x: -50,
            y: { min: 0, max: this.scene.scale.gameSize.height },
            speedX: { min: 150, max: 300 },
            speedY: { min: -30, max: 30 },
            scale: { min: 0.5, max: 2.0 },
            alpha: { min: 0.2, max: 0.6 },
            lifespan: 4000,
            frequency: 80,
            quantity: 3
        });

        this.windEmitter.setDepth(1500);
        this.windEmitter.stop();
    }

    /**
     * 创建雾气效果
     */
    createFogEffect() {
        this.fogOverlay = this.scene.add.rectangle(
            0, 0,
            this.scene.scale.gameSize.width,
            this.scene.scale.gameSize.height,
            0xF5F5F5, 0.0
        )
            .setOrigin(0, 0)
            .setDepth(1600)
            .setScrollFactor(0)
            .setBlendMode(Phaser.BlendModes.OVERLAY);
    }

    /**
     * 更新天气效果
     * @param {string} weather 天气类型
     * @param {number} intensity 强度 (0-1)
     * @param {number} deltaMs 帧间隔时间
     */
    updateWeather(weather, intensity = 0.5, deltaMs = 16) {
        if (this.currentWeather !== weather || Math.abs(this.currentIntensity - intensity) > 0.1) {
            this.transitionToWeather(weather, intensity);
        }

        // 更新当前天气效果
        this.updateCurrentWeatherEffects(deltaMs);
    }

    /**
     * 过渡到新天气
     * @param {string} newWeather 新天气类型
     * @param {number} newIntensity 新强度
     */
    transitionToWeather(newWeather, newIntensity) {
        if (this.isTransitioning) return;

        this.isTransitioning = true;
        const oldWeather = this.currentWeather;

        // 停止旧天气效果
        this.fadeOutWeather(oldWeather, () => {
            // 启动新天气效果
            this.fadeInWeather(newWeather, newIntensity, () => {
                this.currentWeather = newWeather;
                this.currentIntensity = newIntensity;
                this.isTransitioning = false;
            });
        });
    }

    /**
     * 淡出天气效果
     * @param {string} weather 天气类型
     * @param {Function} callback 完成回调
     */
    fadeOutWeather(weather, callback) {
        const duration = 2000; // 2秒过渡

        switch (weather) {
            case 'rain':
                if (this.rainEmitter) {
                    this.scene.tweens.add({
                        targets: this.rainEmitter,
                        alpha: 0,
                        duration: duration,
                        onComplete: () => {
                            this.rainEmitter.stop();
                            this.stopAnimatedRainDrops();
                            if (callback) callback();
                        }
                    });
                } else if (callback) callback();
                break;

            case 'snow':
                if (this.snowEmitter) {
                    this.scene.tweens.add({
                        targets: this.snowEmitter,
                        alpha: 0,
                        duration: duration,
                        onComplete: () => {
                            this.snowEmitter.stop();
                            if (callback) callback();
                        }
                    });
                } else if (callback) callback();
                break;

            case 'wind':
                if (this.windEmitter) {
                    this.scene.tweens.add({
                        targets: this.windEmitter,
                        alpha: 0,
                        duration: duration,
                        onComplete: () => {
                            this.windEmitter.stop();
                            if (callback) callback();
                        }
                    });
                } else if (callback) callback();
                break;

            default:
                if (callback) callback();
                break;
        }
    }

    /**
     * 淡入天气效果
     * @param {string} weather 天气类型
     * @param {number} intensity 强度
     * @param {Function} callback 完成回调
     */
    fadeInWeather(weather, intensity, callback) {
        const duration = 2000;

        switch (weather) {
            case 'rain':
                if (this.rainEmitter) {
                    this.startRainEffect(intensity);
                    this.scene.tweens.add({
                        targets: this.rainEmitter,
                        alpha: intensity,
                        duration: duration,
                        onComplete: callback
                    });
                } else if (callback) callback();
                break;

            case 'snow':
                if (this.snowEmitter) {
                    this.startSnowEffect(intensity);
                    this.scene.tweens.add({
                        targets: this.snowEmitter,
                        alpha: intensity,
                        duration: duration,
                        onComplete: callback
                    });
                } else if (callback) callback();
                break;

            case 'wind':
                if (this.windEmitter) {
                    this.startWindEffect(intensity);
                    this.scene.tweens.add({
                        targets: this.windEmitter,
                        alpha: intensity * 0.6, // 风效果透明度更低
                        duration: duration,
                        onComplete: callback
                    });
                } else if (callback) callback();
                break;

            default:
                if (callback) callback();
                break;
        }
    }

    /**
     * 启动雨效果
     * @param {number} intensity 强度
     */
    startRainEffect(intensity) {
        if (!this.rainEmitter) return;

        const baseFreq = 30;
        const baseQuantity = 2;

        // 根据强度调整雨滴参数
        const config = {
            frequency: Math.max(10, baseFreq / (intensity * 2 + 0.5)),
            quantity: Math.ceil(baseQuantity * (intensity * 2 + 0.5)),
            speedX: {
                min: -40 * (1 + intensity),
                max: -20 * (1 + intensity)
            },
            speedY: {
                min: 300 * (0.8 + intensity * 0.4),
                max: 500 * (0.8 + intensity * 0.4)
            },
            alpha: {
                min: 0.4 + intensity * 0.2,
                max: 0.7 + intensity * 0.3
            }
        };

        this.rainEmitter.setConfig(config);
        this.rainEmitter.start();

        // 启动动画雨滴（额外的视觉效果）
        this.startAnimatedRainDrops(intensity);
    }

    /**
     * 启动动画雨滴效果
     * @param {number} intensity 强度
     */
    startAnimatedRainDrops(intensity) {
        // 清理之前的动画雨滴
        if (this.animatedRainDrops) {
            this.animatedRainDrops.forEach(drop => drop.destroy());
        }
        this.animatedRainDrops = [];

        // 根据强度创建动画雨滴
        const dropCount = Math.ceil(intensity * 8 + 3);

        for (let i = 0; i < dropCount; i++) {
            this.createAnimatedRainDrop(intensity);
        }

        // 定时创建新的动画雨滴
        if (this.rainDropTimer) {
            this.rainDropTimer.destroy();
        }

        this.rainDropTimer = this.scene.time.addEvent({
            delay: 500 / (intensity + 0.5), // 根据强度调整频率
            callback: () => this.createAnimatedRainDrop(intensity),
            loop: true
        });
    }

    /**
     * 创建单个动画雨滴
     * @param {number} intensity 强度
     */
    createAnimatedRainDrop(intensity) {
        if (!this.scene.anims.exists('rain_drop_anim')) return;

        const startX = -50 + Math.random() * (this.scene.scale.gameSize.width + 100);
        const startY = -50 - Math.random() * 100;

        const rainDrop = this.scene.add.sprite(startX, startY, 'raindrop_0');
        rainDrop.setDepth(1550); // 在粒子效果之上
        rainDrop.setScale(1.5 + Math.random() * 0.5);
        rainDrop.setAlpha(0.7 + intensity * 0.3);

        // 播放雨滴动画
        rainDrop.anims.play('rain_drop_anim');

        // 添加到管理列表
        this.animatedRainDrops = this.animatedRainDrops || [];
        this.animatedRainDrops.push(rainDrop);

        // 移动动画
        const moveSpeed = 400 + intensity * 200;
        const windEffect = -30 - intensity * 20;
        const finalX = startX + windEffect;
        const finalY = this.scene.scale.gameSize.height - 20; // 稍微在地面上方

        this.scene.tweens.add({
            targets: rainDrop,
            x: finalX,
            y: finalY,
            duration: (this.scene.scale.gameSize.height + 70) / moveSpeed * 1000,
            ease: 'Linear',
            onComplete: () => {
                // 创建撞击效果
                this.createRainSplash(finalX, finalY, intensity);

                // 从列表中移除并销毁
                const index = this.animatedRainDrops.indexOf(rainDrop);
                if (index > -1) {
                    this.animatedRainDrops.splice(index, 1);
                }
                rainDrop.destroy();
            }
        });
    }

    /**
     * 创建雨滴撞击地面的效果
     * @param {number} x X坐标
     * @param {number} y Y坐标
     * @param {number} intensity 强度
     */
    createRainSplash(x, y, intensity) {
        // 创建简单的水花效果
        const splashCount = 3 + Math.floor(intensity * 3);

        for (let i = 0; i < splashCount; i++) {
            const splash = this.scene.add.graphics();
            splash.fillStyle(0x87CEEB, 0.6);
            splash.fillCircle(0, 0, 1 + Math.random() * 2);
            splash.setPosition(x + (Math.random() - 0.5) * 10, y);
            splash.setDepth(1540);

            // 水花飞溅动画
            this.scene.tweens.add({
                targets: splash,
                x: x + (Math.random() - 0.5) * 30,
                y: y - Math.random() * 15,
                alpha: 0,
                scaleX: 0.5,
                scaleY: 0.5,
                duration: 300 + Math.random() * 200,
                ease: 'Quad.easeOut',
                onComplete: () => splash.destroy()
            });
        }

        // 偶尔创建更大的水花
        if (Math.random() < 0.3) {
            const bigSplash = this.scene.add.graphics();
            bigSplash.fillStyle(0x87CEEB, 0.4);
            bigSplash.fillCircle(0, 0, 3);
            bigSplash.setPosition(x, y);
            bigSplash.setDepth(1540);

            this.scene.tweens.add({
                targets: bigSplash,
                scaleX: 3,
                scaleY: 0.5,
                alpha: 0,
                duration: 400,
                ease: 'Quad.easeOut',
                onComplete: () => bigSplash.destroy()
            });
        }
    }

    /**
     * 停止动画雨滴
     */
    stopAnimatedRainDrops() {
        if (this.animatedRainDrops) {
            this.animatedRainDrops.forEach(drop => drop.destroy());
            this.animatedRainDrops = [];
        }

        if (this.rainDropTimer) {
            this.rainDropTimer.destroy();
            this.rainDropTimer = null;
        }
    }

    /**
     * 启动雪效果
     * @param {number} intensity 强度
     */
    startSnowEffect(intensity) {
        if (!this.snowEmitter) return;

        const baseFreq = 100;
        const baseQuantity = 1;

        this.snowEmitter.setConfig({
            frequency: baseFreq / (intensity + 0.5),
            quantity: Math.ceil(baseQuantity * (intensity * 1.5 + 0.5))
        });

        this.snowEmitter.start();
    }

    /**
     * 启动风效果
     * @param {number} intensity 强度
     */
    startWindEffect(intensity) {
        if (!this.windEmitter) return;

        const baseFreq = 80;
        const baseQuantity = 3;

        this.windEmitter.setConfig({
            frequency: baseFreq / (intensity + 0.5),
            quantity: Math.ceil(baseQuantity * (intensity + 0.5)),
            speedX: { min: 150 * intensity, max: 300 * (intensity + 0.5) }
        });

        this.windEmitter.start();
    }

    /**
     * 更新当前天气效果
     * @param {number} deltaMs 帧间隔时间
     */
    updateCurrentWeatherEffects(deltaMs) {
        // 这里可以添加天气效果的实时更新逻辑
        // 比如雨滴的方向随风向变化等

        if (this.currentWeather === 'rain' && this.rainEmitter && this.rainEmitter.active) {
            // 可以根据风向调整雨滴角度
            // this.adjustRainDirection();
        }
    }

    /**
     * 创建闪电效果
     */
    createLightningEffect() {
        // 先闪白屏
        const flash = this.scene.add.rectangle(
            0, 0,
            this.scene.scale.gameSize.width,
            this.scene.scale.gameSize.height,
            0xFFFFFF, 0.8
        )
            .setOrigin(0, 0)
            .setDepth(2100)
            .setScrollFactor(0);

        // 快速淡出
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 150,
            onComplete: () => flash.destroy()
        });

        // 播放雷声（如果有音效）
        // if (this.thunderSound) this.thunderSound.play();
    }

    /**
     * 销毁所有天气效果
     */
    destroy() {
        if (this.rainEmitter) {
            this.rainEmitter.destroy();
            this.rainEmitter = null;
        }

        // 清理动画雨滴
        this.stopAnimatedRainDrops();

        if (this.snowEmitter) {
            this.snowEmitter.destroy();
            this.snowEmitter = null;
        }

        if (this.windEmitter) {
            this.windEmitter.destroy();
            this.windEmitter = null;
        }

        if (this.fogOverlay) {
            this.fogOverlay.destroy();
            this.fogOverlay = null;
        }
    }

    /**
     * 调整画布大小时重新设置效果范围
     * @param {number} width 新宽度  
     * @param {number} height 新高度
     */
    resize(width, height) {
        // 更新粒子发射器的范围
        if (this.rainEmitter) {
            this.rainEmitter.setConfig({
                x: { min: -100, max: width + 100 }
            });
        }

        if (this.snowEmitter) {
            this.snowEmitter.setConfig({
                x: { min: -50, max: width + 50 }
            });
        }

        if (this.windEmitter) {
            this.windEmitter.setConfig({
                y: { min: 0, max: height }
            });
        }

        if (this.fogOverlay) {
            this.fogOverlay.setSize(width, height);
        }
    }
}