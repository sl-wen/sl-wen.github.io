import { Scene } from 'phaser';

// 英雄状态接口
interface HeroStatus {
    position: { x: number; y: number };
    previousPosition: { x: number; y: number };
    frame: string;
    facingDirection: string;
    health: number;
    maxHealth: number;
    coin: number;
    canPush: boolean;
    haveSword: boolean;
}

// 游戏场景数据接口
interface GameSceneData {
    heroStatus: HeroStatus;
    mapKey: string;
}

// 菜单项选择事件详情接口
interface MenuItemSelectedDetail {
    selectedItem: string;
}

/**
 * 主菜单场景
 * 显示游戏主菜单，处理菜单选择逻辑
 */
export default class MainMenuScene extends Scene {
    constructor() {
        super('MainMenuScene');
    }

    /**
     * 预加载阶段 - 此场景无需额外加载资源
     */
    preload(): void {
        // 无需额外加载
    }

    /**
     * 创建阶段 - 设置主菜单界面和事件监听
     */
    create(): void {
        const { width: gameWidth, height: gameHeight } = this.cameras.main;

        // 添加游戏 Logo
        this.add.image(gameWidth / 2, Math.ceil(gameHeight / 10), 'game_logo')
            .setOrigin(0.5, 0)
            .setDepth(1);

        // 添加背景图片并缩放以适应屏幕
        const scale = Math.max(Math.ceil(gameWidth / 480), Math.ceil(gameHeight / 216));
        this.add.image(0, 0, 'main_menu_background')
            .setScale(scale)
            .setDepth(0)
            .setOrigin(0, 0);

        // 发送菜单项事件到 UI 层
        const customEvent = new CustomEvent('menu-items', {
            detail: {
                menuItems: ['start', 'exit'],
                menuPosition: 'center',
            },
        });

        window.dispatchEvent(customEvent);

        // 监听菜单项选择事件
        const gameMenuSelectedEventListener = (event: Event) => {
            const { detail } = (event as CustomEvent).detail as MenuItemSelectedDetail;
            switch (detail.selectedItem) {
                case 'start': {
                    // 启动游戏场景，设置初始英雄状态
                    const initialHeroStatus: HeroStatus = {
                        position: { x: 4, y: 3 },
                        previousPosition: { x: 4, y: 3 },
                        frame: 'hero_idle_down_01',
                        facingDirection: 'down',
                        health: 60,
                        maxHealth: 60,
                        coin: 0,
                        canPush: false,
                        haveSword: false,
                    };

                    const gameSceneData: GameSceneData = {
                        heroStatus: initialHeroStatus,
                        mapKey: 'home_page_city_house_01',
                    };

                    this.scene.start('GameScene', gameSceneData);
                    break;
                }

                case 'exit': {
                    // 退出游戏，重新加载页面
                    window.location.reload();
                    break;
                }

                case 'settings': {
                    // 设置选项（待实现）
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