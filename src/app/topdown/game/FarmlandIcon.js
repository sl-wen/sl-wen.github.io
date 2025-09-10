/**
 * FarmlandIcon - 耕地交互图标
 * 显示在耕地上的可点击图标，用于种植、浇水、收获等操作
 */

export default class FarmlandIcon {
    /**
     * @param {Phaser.Scene} scene
     * @param {number} tileX - 地块 X（网格）
     * @param {number} tileY - 地块 Y（网格）
     * @param {string} actionType - 动作类型：'plant', 'water', 'harvest'
     * @param {object} options
     */
    constructor(scene, tileX, tileY, actionType, options = {}) {
        this.scene = scene;
        this.tileX = tileX;
        this.tileY = tileY;
        this.actionType = actionType;
        this.tileSize = options.tileSize || 64;
        
        // 创建图标精灵
        this.createIcon();
        
        // 设置交互
        this.setupInteraction();
    }
    
    createIcon() {
        const pixelX = this.tileX * this.tileSize + this.tileSize / 2;
        const pixelY = this.tileY * this.tileSize + this.tileSize / 4; // 显示在瓦片上方
        
        // 根据动作类型选择图标
        let iconColor = 0xFFFFFF;
        let iconText = '';
        
        switch (this.actionType) {
            case 'plant':
                iconColor = 0x90EE90; // 浅绿色
                iconText = '🌱';
                break;
            case 'water':
                iconColor = 0x87CEEB; // 天空蓝
                iconText = '💧';
                break;
            case 'harvest':
                iconColor = 0xFFD700; // 金色
                iconText = '🌾';
                break;
            default:
                iconColor = 0xFFFFFF;
                iconText = '?';
        }
        
        // 创建圆形背景
        this.background = this.scene.add.circle(pixelX, pixelY, 16, iconColor, 0.8)
            .setDepth(200)
            .setStrokeStyle(2, 0x000000, 1.0);
        
        // 创建文本图标
        this.icon = this.scene.add.text(pixelX, pixelY, iconText, {
            fontSize: '20px',
            fill: '#000000'
        })
        .setOrigin(0.5, 0.5)
        .setDepth(201);
        
        // 添加悬浮效果
        this.scene.tweens.add({
            targets: [this.background, this.icon],
            y: pixelY - 5,
            duration: 1000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }
    
    setupInteraction() {
        // 设置交互区域
        this.background.setInteractive({ useHandCursor: true });
        this.icon.setInteractive({ useHandCursor: true });
        
        // 点击事件
        const onClick = () => {
            this.onIconClick();
        };
        
        this.background.on('pointerdown', onClick);
        this.icon.on('pointerdown', onClick);
        
        // 悬停效果
        const onHover = () => {
            this.background.setScale(1.2);
            this.icon.setScale(1.2);
        };
        
        const onHoverOut = () => {
            this.background.setScale(1.0);
            this.icon.setScale(1.0);
        };
        
        this.background.on('pointerover', onHover);
        this.background.on('pointerout', onHoverOut);
        this.icon.on('pointerover', onHover);
        this.icon.on('pointerout', onHoverOut);
    }
    
    onIconClick() {
        // 触发自定义事件，让GameScene处理
        this.scene.events.emit('farmland-icon-clicked', {
            tileX: this.tileX,
            tileY: this.tileY,
            actionType: this.actionType
        });
    }
    
    destroy() {
        if (this.background) {
            this.background.destroy();
        }
        if (this.icon) {
            this.icon.destroy();
        }
    }
    
    setVisible(visible) {
        if (this.background) {
            this.background.setVisible(visible);
        }
        if (this.icon) {
            this.icon.setVisible(visible);
        }
    }
}