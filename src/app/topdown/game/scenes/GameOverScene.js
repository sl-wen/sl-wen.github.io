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

export default class GameOverScene extends Scene {
    /**
     * 构造函数
     * 
     * 初始化游戏结束场景，设置场景的唯一标识符
     */
    constructor() {
        super('GameOverScene');
    }

    /**
     * 资源预加载方法
     * 
     * 在此方法中预加载游戏结束场景所需的资源
     * 如背景图片、音效等（当前为预留实现）
     */
    preload() {
        // TODO: 加载游戏结束背景图片和相关资源
        // 示例：
        // this.load.image('game_over_background', '/game/assets/images/game_over_bg.png');
        // this.load.audio('game_over_sound', '/game/assets/audio/game_over.mp3');
    }

    /**
     * 场景创建方法
     * 
     * 负责创建游戏结束界面的所有视觉元素和交互逻辑
     * 包括"Game Over"文字、背景图片以及菜单选项
     */
    create() {
        // "Game Over"文字的字体大小配置
        const fontSize = 24;
        
        // 获取游戏画面尺寸，用于计算元素位置
        const { width: gameWidth, height: gameHeight } = this.cameras.main;

        /**
         * 创建"Game Over"文字显示
         * 
         * 使用像素风格字体，居中显示在屏幕上方
         * 设置较高的深度值确保文字显示在所有元素之上
         */
        const gameOverText = this.add.text(
            gameWidth / 2,                      // X坐标：屏幕水平中心
            Math.ceil(gameHeight / 5),          // Y坐标：屏幕高度的1/5处
            'game over',                        // 显示文字
            {
                fontFamily: '"Press Start 2P"', // 像素风格字体
                fontSize: `${fontSize}px`,      // 字体大小
                size: `${fontSize}px`,          // 备用字体大小属性
                fill: '#ffffff',                // 文字填充色（白色）
                color: '#ffffff',               // 文字颜色（白色）
            }
        ).setDepth(10)                          // 设置高深度值，确保在最前层
         .setOrigin(0.5, 0.5);                 // 设置锚点为中心

        /**
         * 创建背景图片
         * 
         * 计算合适的缩放比例以覆盖整个屏幕
         * 基础分辨率假设为220x124，根据实际屏幕调整
         */
        const scale = Math.max(Math.ceil(gameWidth / 220), Math.ceil(gameHeight / 124));
        this.add.image(0, 0, 'game_over_background')
            .setScale(scale)                    // 应用计算的缩放比例
            .setDepth(0)                       // 设置为背景层（最低深度）
            .setOrigin(0, 0);                  // 设置锚点为左上角

        /**
         * 向React层发送菜单显示事件
         * 
         * 通知React组件显示游戏结束菜单选项
         * 包括重试和退出两个选项
         */
        const customEvent = new CustomEvent('menu-items', {
            detail: {
                // 菜单选项：重试和退出（使用国际化键值）
                menuItems: ['game.game_over.retry', 'game.game_over.exit'],
                menuPosition: 'center',          // 菜单位置：屏幕中央
            },
        });

        // 派发菜单显示事件
        window.dispatchEvent(customEvent);

        /**
         * 菜单选择事件监听器
         * 
         * 处理来自React层的用户菜单选择
         * 根据选择执行相应的游戏流程控制
         * 
         * @param {CustomEvent} event - 包含选择结果的自定义事件
         * @param {Object} event.detail - 事件详情对象
         * @param {string} event.detail.selectedItem - 用户选择的菜单项标识符
         */
        const gameMenuSelectedEventListener = ({ detail }) => {
            switch (detail.selectedItem) {
                case 'game.game_over.retry': {
                    /**
                     * 重试逻辑
                     * 
                     * 返回主菜单场景，允许玩家重新开始游戏
                     * 这样玩家可以选择加载存档或开始新游戏
                     */
                    this.scene.start('MainMenuScene');
                    break;
                }

                case 'game.game_over.exit': {
                    /**
                     * 退出游戏逻辑
                     * 
                     * 刷新页面完全退出游戏
                     * 注意：这会清除所有未保存的游戏状态
                     */
                    window.location.reload();
                    break;
                }

                default: {
                    /**
                     * 未知选项处理
                     * 
                     * 对于未预期的菜单选项，记录警告但不执行任何操作
                     */
                    console.warn('Unknown game over menu item:', detail.selectedItem);
                    break;
                }
            }

            /**
             * 清理事件监听器
             * 
             * 菜单选择完成后移除事件监听器，防止内存泄漏
             * 确保每次菜单交互都是一次性的
             */
            window.removeEventListener(
                'menu-item-selected',
                gameMenuSelectedEventListener
            );
        };

        /**
         * 注册菜单选择事件监听器
         * 
         * 监听来自React GameMenu组件的选择事件
         * 当用户在菜单中做出选择时会触发相应的处理逻辑
         */
        window.addEventListener(
            'menu-item-selected',
            gameMenuSelectedEventListener
        );
    }
}
