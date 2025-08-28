import { Scene } from 'phaser';

// 菜单项选择事件详情接口
interface MenuItemSelectedDetail {
    selectedItem: string;
}

/**
 * 游戏结束场景
 * 显示游戏结束界面，提供重试和退出选项
 */
export default class GameOverScene extends Scene {
    constructor() {
        super('GameOverScene');
    }

    /**
     * 预加载阶段 - 此场景无需额外加载资源
     */
    preload(): void {
        // TODO: 如果需要可以在这里加载额外资源
    }

    /**
     * 创建阶段 - 设置游戏结束界面和事件监听
     */
    create(): void {
        const fontSize = 24;
        const { width: gameWidth, height: gameHeight } = this.cameras.main;

        // 创建游戏结束文本
        const gameOverText = this.add.text(
            gameWidth / 2,
            Math.ceil(gameHeight / 5),
            'game over',
            {
                fontFamily: '"Press Start 2P"',
                fontSize: `${fontSize}px`,
                color: '#ffffff',
            }
        ).setDepth(10).setOrigin(0.5, 0.5);

        // 添加背景图片并缩放以适应屏幕
        const scale = Math.max(Math.ceil(gameWidth / 220), Math.ceil(gameHeight / 124));
        this.add.image(0, 0, 'game_over_background')
            .setScale(scale)
            .setDepth(0)
            .setOrigin(0, 0);

        // 发送菜单项事件到 UI 层
        const customEvent = new CustomEvent('menu-items', {
            detail: {
                menuItems: ['game.game_over.retry', 'game.game_over.exit'],
                menuPosition: 'center',
            },
        });

        window.dispatchEvent(customEvent);

        // 监听菜单项选择事件
        const gameMenuSelectedEventListener = (event: Event) => {
            const { selectedItem } = (event as CustomEvent).detail as MenuItemSelectedDetail;
            switch (selectedItem) {
                case 'game.game_over.retry': {
                    // 重试游戏，返回主菜单
                    this.scene.start('MainMenuScene');
                    break;
                }

                case 'game.game_over.exit': {
                    // 退出游戏，重新加载页面
                    window.location.reload();
                    break;
                }

                default: {
                    // 未知选项
                    break;
                }
            }

            // 移除事件监听器
            window.removeEventListener(
                'menu-item-selected',
                gameMenuSelectedEventListener as EventListener
            );
        };

        // 添加菜单项选择事件监听器
        window.addEventListener(
            'menu-item-selected',
            gameMenuSelectedEventListener as EventListener
        );
    }
}