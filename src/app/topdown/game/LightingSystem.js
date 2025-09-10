/**
 * LightingSystem - 光照系统
 * 
 * 管理游戏中的动态光照效果：
 * - 角色周围的光圈
 * - 建筑物和火把的光源
 * - 昼夜变化的整体光照
 * - 动态阴影效果
 */

export default class LightingSystem {
    /**
     * @param {Phaser.Scene} scene Phaser场景实例
     */
    constructor(scene) {
        this.scene = scene;
        
        // 光源列表
        this.lightSources = new Map();
        
        // 主要光照层
        this.lightingLayer = null;
        this.shadowLayer = null;
        
        // 角色光圈
        this.playerLight = null;
        
        // 光照配置
        this.config = {
            playerLightRadius: 80,
            playerLightIntensity: 0.8,
            torchLightRadius: 60,
            torchLightIntensity: 0.9,
            buildingLightRadius: 40,
            buildingLightIntensity: 0.7
        };
        
        this.initialize();
    }

    /**
     * 初始化光照系统
     */
    initialize() {
        this.createLightingLayers();
        this.createPlayerLight();
    }

    /**
     * 创建光照图层
     */
    createLightingLayers() {
        // 创建光照纹理
        if (!this.scene.textures.exists('lightGradient')) {
            this.createLightTextures();
        }
        
        // 光照层（用于添加光源）
        this.lightingLayer = this.scene.add.container(0, 0);
        this.lightingLayer.setDepth(1800);
        
        // 阴影层（用于遮挡效果）
        this.shadowLayer = this.scene.add.container(0, 0);
        this.shadowLayer.setDepth(1801);
    }

    /**
     * 创建光照纹理
     */
    createLightTextures() {
        // 创建径向渐变光照纹理
        const size = 200;
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size / 2;
        
        const canvas = this.scene.add.renderTexture(0, 0, size, size);
        const graphics = this.scene.add.graphics();
        
        // 创建径向渐变
        for (let r = 0; r < radius; r += 2) {
            const alpha = Math.max(0, 1 - (r / radius) * (r / radius)); // 二次衰减
            graphics.fillStyle(0xffffff, alpha);
            graphics.fillCircle(centerX, centerY, radius - r);
        }
        
        canvas.draw(graphics, 0, 0);
        canvas.saveTexture('lightGradient');
        
        graphics.destroy();
        canvas.destroy();
        
        // 创建火把光照纹理（更温暖的颜色）
        const torchCanvas = this.scene.add.renderTexture(0, 0, size, size);
        const torchGraphics = this.scene.add.graphics();
        
        for (let r = 0; r < radius; r += 2) {
            const alpha = Math.max(0, 1 - (r / radius) * (r / radius));
            // 火把使用暖色调
            torchGraphics.fillStyle(0xffaa44, alpha * 0.8);
            torchGraphics.fillCircle(centerX, centerY, radius - r);
        }
        
        torchCanvas.draw(torchGraphics, 0, 0);
        torchCanvas.saveTexture('torchLight');
        
        torchGraphics.destroy();
        torchCanvas.destroy();
    }

    /**
     * 创建角色光圈
     */
    createPlayerLight() {
        this.playerLight = this.scene.add.image(0, 0, 'lightGradient');
        this.playerLight.setBlendMode(Phaser.BlendModes.ADD);
        this.playerLight.setAlpha(0);
        this.playerLight.setScale(this.config.playerLightRadius / 100);
        this.lightingLayer.add(this.playerLight);
    }

    /**
     * 更新光照系统
     * @param {number} nightAlpha 夜晚强度 (0-1)
     * @param {string} phase 时间阶段
     * @param {Object} playerPosition 玩家位置
     */
    update(nightAlpha, phase, playerPosition) {
        this.updatePlayerLight(nightAlpha, playerPosition);
        this.updateStaticLights(nightAlpha, phase);
        this.updateDynamicEffects();
    }

    /**
     * 更新角色光照
     * @param {number} nightAlpha 夜晚强度
     * @param {Object} playerPosition 玩家位置
     */
    updatePlayerLight(nightAlpha, playerPosition) {
        if (!this.playerLight || !playerPosition) return;
        
        // 更新位置
        this.playerLight.setPosition(playerPosition.x, playerPosition.y);
        
        // 根据夜晚强度调整光照强度
        const lightIntensity = Math.max(0, nightAlpha * this.config.playerLightIntensity);
        this.playerLight.setAlpha(lightIntensity);
        
        // 添加轻微的闪烁效果
        if (lightIntensity > 0) {
            const flicker = 0.9 + Math.sin(this.scene.time.now * 0.01) * 0.1;
            this.playerLight.setScale(
                (this.config.playerLightRadius / 100) * flicker
            );
        }
    }

    /**
     * 更新静态光源
     * @param {number} nightAlpha 夜晚强度
     * @param {string} phase 时间阶段
     */
    updateStaticLights(nightAlpha, phase) {
        this.lightSources.forEach((light, id) => {
            if (light.type === 'static') {
                // 根据时间调整静态光源强度
                let intensity = nightAlpha * light.baseIntensity;
                
                // 黄昏和夜晚时建筑物光源更亮
                if (phase === 'dusk' || phase === 'night' || phase === 'midnight') {
                    intensity *= 1.2;
                }
                
                light.sprite.setAlpha(intensity);
                
                // 火把光源添加闪烁效果
                if (light.subType === 'torch') {
                    const flicker = 0.8 + Math.sin(this.scene.time.now * 0.008 + light.flickerOffset) * 0.2;
                    light.sprite.setScale(light.baseScale * flicker);
                }
            }
        });
    }

    /**
     * 更新动态效果
     */
    updateDynamicEffects() {
        // 这里可以添加更多动态光照效果
        // 比如闪电、魔法效果等
    }

    /**
     * 添加光源
     * @param {string} id 光源唯一标识
     * @param {number} x X坐标
     * @param {number} y Y坐标
     * @param {string} type 光源类型 ('torch', 'building', 'magic')
     * @param {Object} options 配置选项
     */
    addLight(id, x, y, type = 'torch', options = {}) {
        if (this.lightSources.has(id)) {
            console.warn(`Light source with id '${id}' already exists`);
            return;
        }
        
        const config = {
            radius: options.radius || this.config.torchLightRadius,
            intensity: options.intensity || this.config.torchLightIntensity,
            color: options.color || 0xffaa44,
            texture: options.texture || 'torchLight'
        };
        
        const lightSprite = this.scene.add.image(x, y, config.texture);
        lightSprite.setBlendMode(Phaser.BlendModes.ADD);
        lightSprite.setScale(config.radius / 100);
        lightSprite.setAlpha(0);
        
        // 为火把添加随机闪烁偏移
        const flickerOffset = Math.random() * Math.PI * 2;
        
        const lightData = {
            id,
            sprite: lightSprite,
            type: 'static',
            subType: type,
            baseIntensity: config.intensity,
            baseScale: config.radius / 100,
            flickerOffset,
            config
        };
        
        this.lightSources.set(id, lightData);
        this.lightingLayer.add(lightSprite);
        
        return lightData;
    }

    /**
     * 移除光源
     * @param {string} id 光源ID
     */
    removeLight(id) {
        const light = this.lightSources.get(id);
        if (light) {
            light.sprite.destroy();
            this.lightSources.delete(id);
        }
    }

    /**
     * 添加临时光效（如闪电、爆炸等）
     * @param {number} x X坐标
     * @param {number} y Y坐标
     * @param {Object} options 效果配置
     */
    addTemporaryLight(x, y, options = {}) {
        const config = {
            radius: options.radius || 150,
            intensity: options.intensity || 1.0,
            duration: options.duration || 500,
            color: options.color || 0xffffff,
            fadeOut: options.fadeOut !== false
        };
        
        const tempLight = this.scene.add.image(x, y, 'lightGradient');
        tempLight.setBlendMode(Phaser.BlendModes.ADD);
        tempLight.setScale(config.radius / 100);
        tempLight.setAlpha(config.intensity);
        tempLight.setTint(config.color);
        
        this.lightingLayer.add(tempLight);
        
        if (config.fadeOut) {
            this.scene.tweens.add({
                targets: tempLight,
                alpha: 0,
                duration: config.duration,
                onComplete: () => tempLight.destroy()
            });
        } else {
            this.scene.time.delayedCall(config.duration, () => {
                tempLight.destroy();
            });
        }
        
        return tempLight;
    }

    /**
     * 从Tiled地图数据自动添加光源
     * @param {Object} mapData 地图数据
     */
    addLightsFromMap(mapData) {
        // 查找对象层中的光源
        const objectLayer = mapData.getObjectLayer('Lights');
        if (!objectLayer) return;
        
        objectLayer.objects.forEach((obj, index) => {
            const lightType = obj.properties?.find(p => p.name === 'lightType')?.value || 'torch';
            const intensity = obj.properties?.find(p => p.name === 'intensity')?.value || 0.8;
            const radius = obj.properties?.find(p => p.name === 'radius')?.value || 60;
            
            this.addLight(
                `map_light_${index}`,
                obj.x,
                obj.y,
                lightType,
                { intensity, radius }
            );
        });
    }

    /**
     * 调整整体光照强度
     * @param {number} globalIntensity 全局强度倍数
     */
    setGlobalIntensity(globalIntensity) {
        if (this.lightingLayer) {
            this.lightingLayer.setAlpha(globalIntensity);
        }
    }

    /**
     * 销毁光照系统
     */
    destroy() {
        this.lightSources.forEach(light => {
            light.sprite.destroy();
        });
        this.lightSources.clear();
        
        if (this.lightingLayer) {
            this.lightingLayer.destroy();
            this.lightingLayer = null;
        }
        
        if (this.shadowLayer) {
            this.shadowLayer.destroy();
            this.shadowLayer = null;
        }
        
        this.playerLight = null;
    }

    /**
     * 调整画布大小
     * @param {number} width 新宽度
     * @param {number} height 新高度
     */
    resize(width, height) {
        // 光照系统通常不需要特殊的resize处理
        // 因为光源位置是基于世界坐标的
    }
}