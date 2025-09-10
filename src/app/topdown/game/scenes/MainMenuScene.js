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

    /**
     * 场景创建方法
     * 
     * 负责创建主菜单的视觉元素和交互逻辑
     * 包括游戏Logo、背景图片的显示以及菜单事件的处理
     */
    create() {
        // 获取游戏画面的宽度和高度，用于计算元素位置
        const { width: gameWidth, height: gameHeight } = this.cameras.main;

        /**
         * 添加游戏Logo
         * 
         * 位置：屏幕上方居中，距离顶部约10%的高度
         * 深度：设为1，确保显示在背景之上
         */
        this.add.image(gameWidth / 2, Math.ceil(gameHeight / 10), 'game_logo')
            .setOrigin(0.5, 0)      // 设置锚点为顶部中心
            .setDepth(1);           // 设置渲染层级，确保在背景之上

        /**
         * 添加背景图片
         * 
         * 计算合适的缩放比例，确保背景能够覆盖整个屏幕
         * 基础分辨率假设为 480x216，根据实际屏幕尺寸进行缩放
         */
        const scale = Math.max(Math.ceil(gameWidth / 480), Math.ceil(gameHeight / 216));
        this.add.image(0, 0, 'main_menu_background')
            .setScale(scale)        // 应用计算出的缩放比例
            .setDepth(0)           // 设置为最低层级，作为背景
            .setOrigin(0, 0);      // 设置锚点为左上角

        /**
         * 向React层发送菜单显示事件
         * 
         * 通过自定义事件通知React组件显示主菜单选项
         * React的GameMenu组件会监听此事件并渲染相应的菜单界面
         */
        const customEvent = new CustomEvent('menu-items', {
            detail: {
                menuItems: ['start', 'exit'],    // 菜单选项：开始游戏、退出
                menuPosition: 'center',          // 菜单位置：屏幕中央
            },
        });

        window.dispatchEvent(customEvent);

        /**
         * 菜单选择事件监听器
         * 
         * 监听来自React层的菜单选择结果，根据用户选择执行相应操作
         * 
         * @param {CustomEvent} event - 包含选择结果的自定义事件
         * @param {Object} event.detail - 事件详情
         * @param {string} event.detail.selectedItem - 用户选择的菜单项
         */
        const gameMenuSelectedEventListener = ({ detail }) => {
            switch (detail.selectedItem) {
                case 'start': {
                    /**
                     * 开始游戏逻辑
                     * 
                     * 1. 设置默认的游戏状态
                     * 2. 尝试从localStorage加载存档数据
                     * 3. 启动GameScene并传递初始状态
                     */
                    
                    // 初始化默认的农场存档和游戏状态
                    let farmSave = null;                    // 农场存档数据
                    let mapKey = 'map';                     // 默认地图标识符
                    
                    // 默认角色状态配置
                    let catStatus = {
                        position: { x: 24, y: 24 },         // 角色初始位置（网格坐标）
                        previousPosition: { x: 24, y: 24 }, // 角色上一个位置（用于传送回退）
                        frame: 'cat_idle_down',             // 角色初始动画帧
                        facingDirection: 'down',            // 角色初始朝向
                        coin: 0,                            // 初始金币数量
                        haveSword: false,                   // 是否拥有剑
                    };

                    /**
                     * 从localStorage加载存档数据
                     * 
                     * 尝试读取用户的游戏存档，包括农场数据、角色状态等
                     * 如果加载失败则使用默认配置
                     */
                    try {
                        const local = JSON.parse(localStorage.getItem('userProfile') || '{}');
                        if (local && local.farmdata) {
                            // 处理可能的数组格式存档数据
                            const fd = Array.isArray(local.farmdata) ? (local.farmdata[0] || {}) : local.farmdata;
                            farmSave = fd.farmSave || fd;   // 提取农场存档
                            
                            // 兼容性处理：支持存档根层包含mapKey和catStatus
                            mapKey = fd.mapKey || mapKey;
                            
                            if (fd.catStatus) {
                                /**
                                 * 角色朝向标准化函数
                                 * 
                                 * 将各种可能的朝向值标准化为四个基本方向
                                 * 处理可能的8方向输入或异常值
                                 * 
                                 * @param {string} dir - 原始朝向值
                                 * @returns {string} 标准化后的朝向（up/down/left/right）
                                 */
                                const normalizeFacing = (dir) => {
                                    if (!dir) return 'down';    // 默认朝向
                                    
                                    // 如果已经是标准的四方向，直接返回
                                    if (dir === 'up' || dir === 'right' || dir === 'down' || dir === 'left') return dir;
                                    
                                    // 处理复合方向（如up-left）或其他格式
                                    const s = String(dir);
                                    if (s.includes('up')) return 'up';
                                    if (s.includes('down')) return 'down';
                                    if (s.includes('left')) return 'left';
                                    if (s.includes('right')) return 'right';
                                    return 'down';  // 兜底默认值
                                };
                                
                                const incoming = fd.catStatus;
                                // 合并存档中的角色状态，并标准化朝向
                                catStatus = { 
                                    ...catStatus, 
                                    ...incoming, 
                                    facingDirection: normalizeFacing(incoming.facingDirection) 
                                };
                            }
                        }
                    } catch (_) { 
                        // 存档加载失败，使用默认配置
                        console.warn('Failed to load save data, using default configuration');
                    }

                    /**
                     * 启动游戏场景
                     * 
                     * 切换到GameScene并传递初始化数据
                     * 包括角色状态、地图标识符和农场存档数据
                     */
                    this.scene.start('GameScene', {
                        catStatus,      // 角色初始状态
                        mapKey,         // 要加载的地图标识符
                        farmSave,       // 农场存档数据
                    });
                    break;
                }

                case 'exit': {
                    /**
                     * 退出游戏逻辑
                     * 
                     * 刷新页面回到初始状态
                     * 注意：这会清除所有未保存的数据
                     */
                    window.location.reload();
                    break;
                }

                case 'settings': {
                    /**
                     * 设置菜单逻辑
                     * 
                     * 预留的设置功能入口
                     * 可以在这里添加游戏设置界面的逻辑
                     */
                    // TODO: 实现设置界面
                    break;
                }

                default: {
                    // 未知的菜单选项，不执行任何操作
                    console.warn('Unknown menu item selected:', detail.selectedItem);
                    break;
                }
            }

            /**
             * 清理事件监听器
             * 
             * 菜单选择完成后移除事件监听器，避免内存泄漏
             * 确保每次菜单操作都是一次性的
             */
            window.removeEventListener(
                'menu-item-selected',
                gameMenuSelectedEventListener
            );
        };

        /**
         * 注册菜单选择事件监听器
         * 
         * 监听来自React组件的菜单选择事件
         * 当用户在GameMenu组件中做出选择时，会触发此监听器
         */
        window.addEventListener(
            'menu-item-selected',
            gameMenuSelectedEventListener
        );
    }
}
