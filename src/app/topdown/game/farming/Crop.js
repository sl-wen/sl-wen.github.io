/**
 * Crop - 单株作物模型与渲染
 * 阶段含义：
 * 0 种子；1~4 生长阶段；5 果实可收获
 */

export default class Crop {
    /**
     * @param {Phaser.Scene} scene
     * @param {number} tileX - 地块 X（网格）
     * @param {number} tileY - 地块 Y（网格）
     * @param {object} options
     * @param {string} [options.cropKey='bailuobo'] - 作物图集前缀
     * @param {number} [options.tileSize=16]
     */
    constructor(scene, tileX, tileY, options = {}) {
        this.scene = scene;
        this.tileX = tileX;
        this.tileY = tileY;
        // 作物 key 必须与 farmplants.json 帧名前缀一致
        this.cropKey = options.cropKey || 'bailuobo';
        this.tileSize = options.tileSize || 16;

        this.stage = 1;           // 1~5（1~4 生长，5 可收获）
        this.watered = false;     // 是否已浇水（用于推进到下一阶段）
        this._timer = null;       // Phaser 定时器

        // 渲染精灵
        const pixelX = this.tileX * this.tileSize + this.tileSize / 2;
        const pixelY = this.tileY * this.tileSize + this.tileSize / 2;
        this.sprite = scene.add.sprite(pixelX, pixelY, 'farmplants', this._frameName())
            .setOrigin(0.5, 0.5) // 居中显示
            .setDepth(100); // 提高深度确保作物显示在地图图层之上
    }

    _frameName() {
        return `${this.cropKey}-${this.stage}.png`;
    }

    _updateSprite() {
        if (this.sprite) {
            this.sprite.setFrame(this._frameName());
        }
    }

    /**
     * 浇水：开始当前阶段向下一阶段的生长计时
     * @param {number} durationMs - 推进到下一阶段所需时间
     */
    water(durationMs) {
        if (this.stage >= 5) return; // 已成熟
        if (this.watered) return;    // 已浇水等待中

        this.watered = true;
        if (this._timer) {
            this._timer.remove(false);
            this._timer = null;
        }
        this._timer = this.scene.time.delayedCall(durationMs, () => {
            this.advanceStage();
        });
    }

    /**
     * 前进一步生长阶段；阶段 5 停止
     */
    advanceStage() {
        if (this.stage >= 5) return;
        this.stage += 1;
        this.watered = false;
        this._updateSprite();
    }

    /** 可否收获（阶段 5） */
    canHarvest() {
        return this.stage >= 5;
    }

    /** 销毁渲染对象与计时器 */
    destroy() {
        if (this._timer) {
            this._timer.remove(false);
            this._timer = null;
        }
        if (this.sprite) {
            this.sprite.destroy();
            this.sprite = null;
        }
    }

    /**
     * 导出用于存档的简化数据
     */
    toJSON() {
        return {
            x: this.tileX,
            y: this.tileY,
            stage: this.stage,
            watered: this.watered,
            cropKey: this.cropKey,
        };
    }

    /**
     * 从存档恢复
     */
    static fromSave(scene, data, options = {}) {
        const crop = new Crop(scene, data.x, data.y, { ...options, cropKey: data.cropKey || 'bailuobo' });
        crop.stage = data.stage ?? 0;
        crop.watered = data.watered ?? false;
        crop._updateSprite();
        return crop;
    }
}

