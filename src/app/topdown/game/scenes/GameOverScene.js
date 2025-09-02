/**
 * 游戏结束场景 GameOverScene
 * 
 * 职责：
 * - 显示“Game Over”文案与背景
 * - 通过事件展示菜单项（重试/退出）并接收选择
 * - 处理菜单选择：返回主菜单或刷新页面退出
 * 
 * 使用方法：
 * - 本场景已在 `App.js` 的 scene 列表中注册
 * - 由 `GameScene` 在玩家死亡时：this.scene.start('GameOverScene') 进入
 * - React 层的 `GameMenu` 监听 `menu-items` 并通过 `menu-item-selected` 回传
 */
import { Scene } from 'phaser';

export default class MainMenuScene extends Scene {
    constructor() {
        super('GameOverScene');
    }

    preload() {
        // TODO
    }

    create() {
        const fontSize = 24;
        const { width: gameWidth, height: gameHeight } = this.cameras.main;

        const gameOverText = this.add.text(
            gameWidth / 2,
            Math.ceil(gameHeight / 5),
            'game over',
            {
                fontFamily: '"Press Start 2P"',
                fontSize: `${fontSize}px`,
                size: `${fontSize}px`,
                fill: '#ffffff',
                color: '#ffffff',
            }
        ).setDepth(10).setOrigin(0.5, 0.5);

        const scale = Math.max(Math.ceil(gameWidth / 220), Math.ceil(gameHeight / 124));
        this.add.image(0, 0, 'game_over_background')
            .setScale(scale)
            .setDepth(0)
            .setOrigin(0, 0);

        const customEvent = new CustomEvent('menu-items', {
            detail: {
                menuItems: ['game.game_over.retry', 'game.game_over.exit'],
                menuPosition: 'center',
            },
        });

        window.dispatchEvent(customEvent);
        const gameMenuSelectedEventListener = ({ detail }) => {
            switch (detail.selectedItem) {
                case 'game.game_over.retry': {
                    // 返回主菜单
                    this.scene.start('MainMenuScene');
                    break;
                }

                case 'game.game_over.exit': {
                    // 刷新页面退出
                    window.location.reload();
                    break;
                }

                default: {
                    break;
                }
            }

            window.removeEventListener(
                'menu-item-selected',
                gameMenuSelectedEventListener
            );
        };

        window.addEventListener(
            'menu-item-selected',
            gameMenuSelectedEventListener
        );
    }
}
