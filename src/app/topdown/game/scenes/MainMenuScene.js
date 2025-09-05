/**
 * 主菜单场景 MainMenuScene
 * 
 * 职责：
 * - 显示游戏标题与主菜单背景
 * - 通过自定义事件将菜单选项传递给 React 层的 `GameMenu` 组件
 * - 监听 React 侧选择结果，进入游戏或退出
 * 
 * 使用方法：
 * - 本场景已在 `App.js` 的 scene 列表中注册
 * - 资源（logo、背景）应在 `BootScene` 中预加载：
 *   this.load.image('game_logo', '...');
 *   this.load.image('main_menu_background', '...');
 * - React 层监听 `menu-items` 事件展示菜单，用户选择后发送 `menu-item-selected` 事件回本场景
 */
import { Scene } from 'phaser';

export default class MainMenuScene extends Scene {
    constructor() {
        super('MainMenuScene');
    }

    preload() {
        // TODO
    }

    create() {
        // 计算画面中心用于摆放 Logo 与背景
        const { width: gameWidth, height: gameHeight } = this.cameras.main;

        this.add.image(gameWidth / 2, Math.ceil(gameHeight / 10), 'game_logo')
            .setOrigin(0.5, 0)
            .setDepth(1);

        const scale = Math.max(Math.ceil(gameWidth / 480), Math.ceil(gameHeight / 216));
        this.add.image(0, 0, 'main_menu_background')
            .setScale(scale)
            .setDepth(0)
            .setOrigin(0, 0);

        // 通过事件告知 React 层：需要显示菜单项
        const customEvent = new CustomEvent('menu-items', {
            detail: {
                menuItems: ['start', 'exit'],
                menuPosition: 'center',
            },
        });

        window.dispatchEvent(customEvent);
        // 监听 React 层返回的菜单选择结果
        const gameMenuSelectedEventListener = ({ detail }) => {
            switch (detail.selectedItem) {
                case 'start': {
                    // 启动游戏：进入 GameScene 并传递初始主角状态与地图 key
                    let farmSave = null;
                    let mapKey = 'main_map';
                    let catStatus = {
                        position: { x: 4, y: 3 },
                        previousPosition: { x: 4, y: 3 },
                        frame: 'hero_idle_down_1',
                        facingDirection: 'down',
                        coin: 0,
                        haveSword: false,
                    };
                    try {
                        const local = JSON.parse(localStorage.getItem('userProfile') || '{}');
                        if (local && local.farmdata) {
                            farmSave = local.farmdata.farmSave || local.farmdata;
                            // 兼容性：允许 farmdata 根层含 mapKey/catStatus
                            mapKey = local.farmdata.mapKey || mapKey;
                            if (local.farmdata.catStatus) {
                                catStatus = { ...catStatus, ...local.farmdata.catStatus };
                            }
                        }
                    } catch (_) { /* ignore */ }
                    this.scene.start('GameScene', {
                        catStatus,
                        mapKey,
                        farmSave,
                    });
                    break;
                }

                case 'exit': {
                    // 退出回到浏览器初始状态
                    window.location.reload();
                    break;
                }

                case 'settings': {
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
