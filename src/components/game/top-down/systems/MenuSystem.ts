/**
 * 菜单系统
 * 处理游戏菜单、菜单层级、动画效果、快捷键、状态持久化等功能
 */

import { storage } from '../utils';

// 菜单项类型
export type MenuItemType = 'button' | 'toggle' | 'slider' | 'select' | 'submenu' | 'separator' | 'custom';

// 菜单项
export interface MenuItem {
  id: string;
  type: MenuItemType;
  label: string;
  icon?: string;
  shortcut?: string;
  enabled?: boolean;
  visible?: boolean;
  value?: any;
  minValue?: number;
  maxValue?: number;
  step?: number;
  options?: string[];
  submenu?: MenuItem[];
  action?: () => void;
  customComponent?: any;
  metadata?: Record<string, any>;
}

// 菜单配置
export interface MenuConfig {
  // 显示设置
  display: {
    theme: 'default' | 'dark' | 'light' | 'pixel' | 'modern' | 'custom';
    fontSize: number;
    fontFamily: string;
    backgroundColor: string;
    textColor: string;
    selectedColor: string;
    disabledColor: string;
    borderColor: string;
    borderWidth: number;
    padding: number;
    margin: number;
    borderRadius: number;
    shadow: boolean;
    transparency: number;
  };
  
  // 动画设置
  animation: {
    enableAnimations: boolean;
    animationDuration: number;
    animationType: 'fade' | 'slide' | 'scale' | 'bounce' | 'none';
    hoverEffect: boolean;
    hoverScale: number;
    hoverColor: string;
  };
  
  // 交互设置
  interaction: {
    enableKeyboard: boolean;
    enableMouse: boolean;
    enableTouch: boolean;
    autoFocus: boolean;
    loopNavigation: boolean;
    closeOnEscape: boolean;
    closeOnClickOutside: boolean;
  };
  
  // 快捷键设置
  shortcuts: {
    enableShortcuts: boolean;
    showShortcuts: boolean;
    shortcutPosition: 'right' | 'left' | 'none';
    shortcutSeparator: string;
  };
  
  // 状态设置
  state: {
    saveState: boolean;
    restoreState: boolean;
    autoSave: boolean;
    saveInterval: number;
  };
  
  // 调试设置
  debug: {
    showItemIds: boolean;
    logMenuEvents: boolean;
    enableDebugMode: boolean;
  };
}

// 菜单状态
export interface MenuState {
  currentMenu: string;
  selectedItems: Record<string, number>;
  openSubmenus: string[];
  menuHistory: string[];
  customData: Record<string, any>;
  lastUpdateTime: number;
}

// 菜单主题
export interface MenuTheme {
  name: string;
  display: {
    backgroundColor: string;
    textColor: string;
    selectedColor: string;
    disabledColor: string;
    borderColor: string;
    shadowColor: string;
  };
  animation: {
    duration: number;
    easing: string;
  };
  fonts: {
    primary: string;
    secondary: string;
  };
}

// 菜单事件
export interface MenuEvent {
  type: 'open' | 'close' | 'select' | 'change' | 'action' | 'navigate' | 'error';
  menuId: string;
  itemId?: string;
  data?: any;
  timestamp: number;
}

export class MenuSystem {
  private static instance: MenuSystem;
  private config: MenuConfig;
  private menus: Map<string, MenuItem[]> = new Map();
  private currentMenu: string | null = null;
  private menuState: MenuState;
  private isActive = false;
  private scene: Phaser.Scene | null = null;
  private menuContainer: Phaser.GameObjects.Container | null = null;
  private menuObjects: Map<string, Phaser.GameObjects.Container> = new Map();
  private events: MenuEvent[] = [];
  private callbacks: Map<string, (data: any) => void> = new Map();
  private themes: Map<string, MenuTheme> = new Map();
  
  // 动画状态
  private animationState = {
    isAnimating: false,
    currentAnimation: null as any,
    animationQueue: [] as any[]
  };

  private constructor() {
    this.config = this.getDefaultConfig();
    this.menuState = this.getDefaultState();
    this.loadConfig();
    this.loadState();
    this.loadThemes();
    this.initializeDefaultMenus();
  }

  public static getInstance(): MenuSystem {
    if (!MenuSystem.instance) {
      MenuSystem.instance = new MenuSystem();
    }
    return MenuSystem.instance;
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfig(): MenuConfig {
    return {
      display: {
        theme: 'pixel',
        fontSize: 16,
        fontFamily: 'Press Start 2P',
        backgroundColor: '#e2b27e',
        textColor: '#000000',
        selectedColor: '#741B47',
        disabledColor: '#888888',
        borderColor: '#ffffff',
        borderWidth: 2,
        padding: 8,
        margin: 4,
        borderRadius: 0,
        shadow: true,
        transparency: 1
      },
      animation: {
        enableAnimations: true,
        animationDuration: 200,
        animationType: 'fade',
        hoverEffect: true,
        hoverScale: 1.05,
        hoverColor: '#f0d8a8'
      },
      interaction: {
        enableKeyboard: true,
        enableMouse: true,
        enableTouch: true,
        autoFocus: true,
        loopNavigation: true,
        closeOnEscape: true,
        closeOnClickOutside: false
      },
      shortcuts: {
        enableShortcuts: true,
        showShortcuts: true,
        shortcutPosition: 'right',
        shortcutSeparator: ' - '
      },
      state: {
        saveState: true,
        restoreState: true,
        autoSave: true,
        saveInterval: 5000
      },
      debug: {
        showItemIds: false,
        logMenuEvents: false,
        enableDebugMode: false
      }
    };
  }

  /**
   * 获取默认状态
   */
  private getDefaultState(): MenuState {
    return {
      currentMenu: '',
      selectedItems: {},
      openSubmenus: [],
      menuHistory: [],
      customData: {},
      lastUpdateTime: Date.now()
    };
  }

  /**
   * 加载配置
   */
  private loadConfig(): void {
    const savedConfig = storage.get('menu_config', null);
    if (savedConfig) {
      this.config = { ...this.config, ...(savedConfig as any) };
    }
  }

  /**
   * 保存配置
   */
  private saveConfig(): void {
    storage.set('menu_config', this.config);
  }

  /**
   * 加载状态
   */
  private loadState(): void {
    const savedState = storage.get('menu_state', null);
    if (savedState) {
      this.menuState = { ...this.menuState, ...(savedState as any) };
    }
  }

  /**
   * 保存状态
   */
  private saveState(): void {
    this.menuState.lastUpdateTime = Date.now();
    storage.set('menu_state', this.menuState);
  }

  /**
   * 加载主题
   */
  private loadThemes(): void {
    const savedThemes = storage.get('menu_themes', null);
    if (savedThemes) {
      this.themes = new Map(savedThemes);
    }
    
    // 添加默认主题
    this.addDefaultThemes();
  }

  /**
   * 添加默认主题
   */
  private addDefaultThemes(): void {
    // 像素主题
    this.themes.set('pixel', {
      name: 'Pixel',
      display: {
        backgroundColor: '#e2b27e',
        textColor: '#000000',
        selectedColor: '#741B47',
        disabledColor: '#888888',
        borderColor: '#ffffff',
        shadowColor: '#000000'
      },
      animation: {
        duration: 150,
        easing: 'ease-out'
      },
      fonts: {
        primary: 'Press Start 2P',
        secondary: 'monospace'
      }
    });

    // 现代主题
    this.themes.set('modern', {
      name: 'Modern',
      display: {
        backgroundColor: '#2c3e50',
        textColor: '#ecf0f1',
        selectedColor: '#3498db',
        disabledColor: '#7f8c8d',
        borderColor: '#34495e',
        shadowColor: '#000000'
      },
      animation: {
        duration: 300,
        easing: 'ease-in-out'
      },
      fonts: {
        primary: 'Arial',
        secondary: 'sans-serif'
      }
    });

    // 暗色主题
    this.themes.set('dark', {
      name: 'Dark',
      display: {
        backgroundColor: '#1a1a1a',
        textColor: '#ffffff',
        selectedColor: '#4CAF50',
        disabledColor: '#666666',
        borderColor: '#333333',
        shadowColor: '#000000'
      },
      animation: {
        duration: 200,
        easing: 'ease'
      },
      fonts: {
        primary: 'Arial',
        secondary: 'sans-serif'
      }
    });
  }

  /**
   * 初始化默认菜单
   */
  private initializeDefaultMenus(): void {
    // 主菜单
    this.addMenu('main', [
      {
        id: 'start',
        type: 'button',
        label: '开始游戏',
        icon: '🎮',
        shortcut: 'Enter',
        action: () => this.triggerCallback('start_game', {})
      },
      {
        id: 'load',
        type: 'button',
        label: '加载游戏',
        icon: '📂',
        shortcut: 'L',
        action: () => this.triggerCallback('load_game', {})
      },
      {
        id: 'settings',
        type: 'submenu',
        label: '设置',
        icon: '⚙️',
        shortcut: 'S',
        submenu: [
          {
            id: 'audio',
            type: 'submenu',
            label: '音频设置',
            icon: '🔊',
            submenu: [
              {
                id: 'master_volume',
                type: 'slider',
                label: '主音量',
                value: 100,
                minValue: 0,
                maxValue: 100,
                step: 5
              },
              {
                id: 'music_volume',
                type: 'slider',
                label: '音乐音量',
                value: 80,
                minValue: 0,
                maxValue: 100,
                step: 5
              },
              {
                id: 'sfx_volume',
                type: 'slider',
                label: '音效音量',
                value: 100,
                minValue: 0,
                maxValue: 100,
                step: 5
              }
            ]
          },
          {
            id: 'graphics',
            type: 'submenu',
            label: '图形设置',
            icon: '🎨',
            submenu: [
              {
                id: 'quality',
                type: 'select',
                label: '画质',
                value: 'high',
                options: ['low', 'medium', 'high', 'ultra']
              },
              {
                id: 'fullscreen',
                type: 'toggle',
                label: '全屏',
                value: false
              },
              {
                id: 'vsync',
                type: 'toggle',
                label: '垂直同步',
                value: true
              }
            ]
          },
          {
            id: 'controls',
            type: 'submenu',
            label: '控制设置',
            icon: '🎮',
            submenu: [
              {
                id: 'mouse_sensitivity',
                type: 'slider',
                label: '鼠标灵敏度',
                value: 1,
                minValue: 0.1,
                maxValue: 3,
                step: 0.1
              },
              {
                id: 'invert_y',
                type: 'toggle',
                label: '反转Y轴',
                value: false
              }
            ]
          }
        ]
      },
      {
        id: 'credits',
        type: 'button',
        label: '制作人员',
        icon: '👥',
        shortcut: 'C',
        action: () => this.triggerCallback('show_credits', {})
      },
      {
        id: 'exit',
        type: 'button',
        label: '退出游戏',
        icon: '🚪',
        shortcut: 'Esc',
        action: () => this.triggerCallback('exit_game', {})
      }
    ]);

    // 游戏内菜单
    this.addMenu('game', [
      {
        id: 'resume',
        type: 'button',
        label: '继续游戏',
        icon: '▶️',
        shortcut: 'Esc',
        action: () => this.triggerCallback('resume_game', {})
      },
      {
        id: 'inventory',
        type: 'button',
        label: '背包',
        icon: '🎒',
        shortcut: 'I',
        action: () => this.triggerCallback('open_inventory', {})
      },
      {
        id: 'quests',
        type: 'button',
        label: '任务',
        icon: '📋',
        shortcut: 'Q',
        action: () => this.triggerCallback('open_quests', {})
      },
      {
        id: 'map',
        type: 'button',
        label: '地图',
        icon: '🗺️',
        shortcut: 'M',
        action: () => this.triggerCallback('open_map', {})
      },
      {
        id: 'settings',
        type: 'submenu',
        label: '设置',
        icon: '⚙️',
        shortcut: 'S',
        submenu: this.getMenu('main')?.find(item => item.id === 'settings')?.submenu || []
      },
      {
        id: 'save',
        type: 'button',
        label: '保存游戏',
        icon: '💾',
        shortcut: 'F5',
        action: () => this.triggerCallback('save_game', {})
      },
      {
        id: 'main_menu',
        type: 'button',
        label: '主菜单',
        icon: '🏠',
        shortcut: 'F1',
        action: () => this.triggerCallback('return_main_menu', {})
      }
    ]);
  }

  /**
   * 初始化菜单系统
   * @param scene - Phaser场景
   */
  initialize(scene: Phaser.Scene): void {
    this.scene = scene;
    this.setupInputHandlers();
    console.log('菜单系统已初始化');
  }

  /**
   * 设置输入处理器
   */
  private setupInputHandlers(): void {
    if (!this.scene) return;
    
    // 键盘输入
    if (this.config.interaction.enableKeyboard) {
      this.scene.input.keyboard?.on('keydown-ESC', () => {
        if (this.isActive) {
          this.closeMenu();
        }
      });
      
      this.scene.input.keyboard?.on('keydown-ENTER', () => {
        if (this.isActive) {
          this.selectCurrentItem();
        }
      });
      
      this.scene.input.keyboard?.on('keydown-ARROW_UP', () => {
        if (this.isActive) {
          this.navigateUp();
        }
      });
      
      this.scene.input.keyboard?.on('keydown-ARROW_DOWN', () => {
        if (this.isActive) {
          this.navigateDown();
        }
      });
      
      this.scene.input.keyboard?.on('keydown-ARROW_LEFT', () => {
        if (this.isActive) {
          this.navigateLeft();
        }
      });
      
      this.scene.input.keyboard?.on('keydown-ARROW_RIGHT', () => {
        if (this.isActive) {
          this.navigateRight();
        }
      });
    }
  }

  /**
   * 打开菜单
   * @param menuId - 菜单ID
   * @param position - 菜单位置
   * @returns 是否成功打开
   */
  openMenu(menuId: string, position: { x: number; y: number } = { x: 0, y: 0 }): boolean {
    if (!this.scene || this.isActive) {
      return false;
    }

    const menu = this.menus.get(menuId);
    if (!menu) {
      console.error(`菜单不存在: ${menuId}`);
      return false;
    }

    this.currentMenu = menuId;
    this.menuState.currentMenu = menuId;
    this.menuState.menuHistory.push(menuId);
    this.isActive = true;

    this.createMenuUI(menuId, menu, position);
    this.restoreMenuState(menuId);
    
    this.addEvent('open', menuId);
    console.log(`打开菜单: ${menuId}`);
    
    return true;
  }

  /**
   * 关闭菜单
   */
  closeMenu(): void {
    if (!this.isActive) return;

    this.saveMenuState();
    this.destroyMenuUI();
    this.isActive = false;
    this.currentMenu = null;
    
    this.addEvent('close', this.menuState.currentMenu);
    console.log('菜单已关闭');
  }

  /**
   * 创建菜单UI
   */
  private createMenuUI(menuId: string, menu: MenuItem[], position: { x: number; y: number }): void {
    if (!this.scene) return;

    const container = this.scene.add.container(position.x, position.y);
    const theme = this.getCurrentTheme();
    
    // 创建背景
    const background = this.createMenuBackground(theme);
    container.add(background);
    
    // 创建菜单项
    let yOffset = this.config.display.padding;
    menu.forEach((item, index) => {
      if (item.visible !== false) {
        const itemContainer = this.createMenuItem(item, index, theme);
        itemContainer.setPosition(0, yOffset);
        container.add(itemContainer);
        yOffset += this.config.display.fontSize + this.config.display.margin * 2;
      }
    });
    
    this.menuObjects.set(menuId, container);
    this.menuContainer = container;
    
    // 应用动画
    if (this.config.animation.enableAnimations) {
      this.animateMenuOpen(container);
    }
  }

  /**
   * 创建菜单背景
   */
  private createMenuBackground(theme: MenuTheme): Phaser.GameObjects.Rectangle {
    if (!this.scene) throw new Error('Scene not available');

    const width = 300;
    const height = 400;
    
    const background = this.scene.add.rectangle(
      0, 0, width, height,
      parseInt(theme.display.backgroundColor.replace('#', '0x')),
      this.config.display.transparency
    );
    
    if (this.config.display.borderWidth > 0) {
      background.setStrokeStyle(
        this.config.display.borderWidth,
        parseInt(theme.display.borderColor.replace('#', '0x'))
      );
    }
    
    if (this.config.display.shadow) {
      // 这里可以添加阴影效果
    }
    
    return background;
  }

  /**
   * 创建菜单项
   */
  private createMenuItem(item: MenuItem, index: number, theme: MenuTheme): Phaser.GameObjects.Container {
    if (!this.scene) throw new Error('Scene not available');

    const container = this.scene.add.container(0, 0);
    
    // 创建文本
    const text = this.scene.add.text(
      0, 0, this.formatMenuItemText(item),
      {
        fontSize: `${this.config.display.fontSize}px`,
        fontFamily: theme.fonts.primary,
        color: item.enabled === false ? theme.display.disabledColor : theme.display.textColor
      }
    );
    text.setOrigin(0, 0.5);
    
    // 创建图标
    if (item.icon) {
      const icon = this.scene.add.text(-20, 0, item.icon, {
        fontSize: `${this.config.display.fontSize}px`
      });
      icon.setOrigin(0, 0.5);
      container.add(icon);
    }
    
    // 创建快捷键
    if (item.shortcut && this.config.shortcuts.showShortcuts) {
      const shortcut = this.scene.add.text(200, 0, item.shortcut, {
        fontSize: `${this.config.display.fontSize - 2}px`,
        fontFamily: theme.fonts.secondary,
        color: theme.display.disabledColor
      });
      shortcut.setOrigin(1, 0.5);
      container.add(shortcut);
    }
    
    container.add(text);
    
    // 添加交互
    if (item.enabled !== false) {
      const hitArea = this.scene.add.rectangle(0, 0, 280, this.config.display.fontSize + 4, 0xffffff, 0);
      hitArea.setInteractive();
      
      hitArea.on('pointerdown', () => {
        this.selectMenuItem(item);
      });
      
      if (this.config.animation.hoverEffect) {
        hitArea.on('pointerover', () => {
          this.onMenuItemHover(container, true);
        });
        
        hitArea.on('pointerout', () => {
          this.onMenuItemHover(container, false);
        });
      }
      
      container.add(hitArea);
    }
    
    return container;
  }

  /**
   * 格式化菜单项文本
   */
  private formatMenuItemText(item: MenuItem): string {
    let text = item.label;
    
    if (item.type === 'toggle') {
      text += `: ${item.value ? '开' : '关'}`;
    } else if (item.type === 'slider') {
      text += `: ${item.value}`;
    } else if (item.type === 'select') {
      text += `: ${item.value}`;
    } else if (item.type === 'submenu') {
      text += ' >';
    }
    
    return text;
  }

  /**
   * 菜单项悬停效果
   */
  private onMenuItemHover(container: Phaser.GameObjects.Container, isHovering: boolean): void {
    if (isHovering) {
      container.setScale(this.config.animation.hoverScale);
      container.setTint(parseInt(this.config.animation.hoverColor.replace('#', '0x')));
    } else {
      container.setScale(1);
      container.clearTint();
    }
  }

  /**
   * 选择菜单项
   */
  private selectMenuItem(item: MenuItem): void {
    if (item.enabled === false) return;

    switch (item.type) {
      case 'button':
        if (item.action) {
          item.action();
        }
        this.addEvent('action', this.currentMenu!, item.id);
        break;
      case 'toggle':
        item.value = !item.value;
        this.addEvent('change', this.currentMenu!, { itemId: item.id, value: item.value });
        break;
      case 'slider':
        // 滑块逻辑在导航中处理
        break;
      case 'select':
        // 选择逻辑在导航中处理
        break;
      case 'submenu':
        if (item.submenu) {
          this.openSubmenu(item.id, item.submenu);
        }
        break;
    }
  }

  /**
   * 打开子菜单
   */
  private openSubmenu(submenuId: string, submenu: MenuItem[]): void {
    if (!this.currentMenu) return;

    this.menuState.openSubmenus.push(submenuId);
    this.addMenu(`${this.currentMenu}_${submenuId}`, submenu);
    this.openMenu(`${this.currentMenu}_${submenuId}`, { x: 320, y: 0 });
  }

  /**
   * 向上导航
   */
  private navigateUp(): void {
    if (!this.currentMenu) return;

    const currentIndex = this.menuState.selectedItems[this.currentMenu] || 0;
    const menu = this.menus.get(this.currentMenu);
    if (!menu) return;

    const visibleItems = menu.filter(item => item.visible !== false);
    const newIndex = this.config.interaction.loopNavigation
      ? (currentIndex - 1 + visibleItems.length) % visibleItems.length
      : Math.max(0, currentIndex - 1);

    this.menuState.selectedItems[this.currentMenu] = newIndex;
    this.updateMenuSelection();
  }

  /**
   * 向下导航
   */
  private navigateDown(): void {
    if (!this.currentMenu) return;

    const currentIndex = this.menuState.selectedItems[this.currentMenu] || 0;
    const menu = this.menus.get(this.currentMenu);
    if (!menu) return;

    const visibleItems = menu.filter(item => item.visible !== false);
    const newIndex = this.config.interaction.loopNavigation
      ? (currentIndex + 1) % visibleItems.length
      : Math.min(visibleItems.length - 1, currentIndex + 1);

    this.menuState.selectedItems[this.currentMenu] = newIndex;
    this.updateMenuSelection();
  }

  /**
   * 向左导航
   */
  private navigateLeft(): void {
    if (!this.currentMenu) return;

    const menu = this.menus.get(this.currentMenu);
    if (!menu) return;

    const currentIndex = this.menuState.selectedItems[this.currentMenu] || 0;
    const currentItem = menu[currentIndex];

    if (currentItem.type === 'slider') {
      currentItem.value = Math.max(currentItem.minValue || 0, (currentItem.value || 0) - (currentItem.step || 1));
      this.addEvent('change', this.currentMenu, { itemId: currentItem.id, value: currentItem.value });
    } else if (currentItem.type === 'select' && currentItem.options) {
      const currentValueIndex = currentItem.options.indexOf(currentItem.value);
      const newValueIndex = this.config.interaction.loopNavigation
        ? (currentValueIndex - 1 + currentItem.options.length) % currentItem.options.length
        : Math.max(0, currentValueIndex - 1);
      currentItem.value = currentItem.options[newValueIndex];
      this.addEvent('change', this.currentMenu, { itemId: currentItem.id, value: currentItem.value });
    }

    this.updateMenuDisplay();
  }

  /**
   * 向右导航
   */
  private navigateRight(): void {
    if (!this.currentMenu) return;

    const menu = this.menus.get(this.currentMenu);
    if (!menu) return;

    const currentIndex = this.menuState.selectedItems[this.currentMenu] || 0;
    const currentItem = menu[currentIndex];

    if (currentItem.type === 'slider') {
      currentItem.value = Math.min(currentItem.maxValue || 100, (currentItem.value || 0) + (currentItem.step || 1));
      this.addEvent('change', this.currentMenu, { itemId: currentItem.id, value: currentItem.value });
    } else if (currentItem.type === 'select' && currentItem.options) {
      const currentValueIndex = currentItem.options.indexOf(currentItem.value);
      const newValueIndex = this.config.interaction.loopNavigation
        ? (currentValueIndex + 1) % currentItem.options.length
        : Math.min(currentItem.options.length - 1, currentValueIndex + 1);
      currentItem.value = currentItem.options[newValueIndex];
      this.addEvent('change', this.currentMenu, { itemId: currentItem.id, value: currentItem.value });
    }

    this.updateMenuDisplay();
  }

  /**
   * 选择当前项目
   */
  private selectCurrentItem(): void {
    if (!this.currentMenu) return;

    const menu = this.menus.get(this.currentMenu);
    if (!menu) return;

    const currentIndex = this.menuState.selectedItems[this.currentMenu] || 0;
    const currentItem = menu[currentIndex];

    if (currentItem && currentItem.enabled !== false) {
      this.selectMenuItem(currentItem);
    }
  }

  /**
   * 更新菜单选择
   */
  private updateMenuSelection(): void {
    if (!this.currentMenu) return;

    const menu = this.menus.get(this.currentMenu);
    if (!menu) return;

    const currentIndex = this.menuState.selectedItems[this.currentMenu] || 0;
    const visibleItems = menu.filter(item => item.visible !== false);
    const currentItem = visibleItems[currentIndex];

    // 更新视觉选择
    this.updateMenuDisplay();
    
    this.addEvent('navigate', this.currentMenu, { itemId: currentItem?.id });
  }

  /**
   * 更新菜单显示
   */
  private updateMenuDisplay(): void {
    if (!this.currentMenu || !this.menuContainer) return;

    const menu = this.menus.get(this.currentMenu);
    if (!menu) return;

    // 重新创建菜单项以反映更改
    this.menuContainer.removeAll(true);
    this.createMenuUI(this.currentMenu, menu, { x: 0, y: 0 });
  }

  /**
   * 菜单打开动画
   */
  private animateMenuOpen(container: Phaser.GameObjects.Container): void {
    if (!this.config.animation.enableAnimations) return;

    container.setScale(0);
    container.setAlpha(0);

    this.scene!.tweens.add({
      targets: container,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: this.config.animation.animationDuration,
      ease: this.config.animation.animationType === 'bounce' ? 'Bounce' : 'Power2'
    });
  }

  /**
   * 菜单关闭动画
   */
  private animateMenuClose(container: Phaser.GameObjects.Container): void {
    if (!this.config.animation.enableAnimations) return;

    this.scene!.tweens.add({
      targets: container,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: this.config.animation.animationDuration,
      ease: 'Power2',
      onComplete: () => {
        container.destroy();
      }
    });
  }

  /**
   * 销毁菜单UI
   */
  private destroyMenuUI(): void {
    if (this.menuContainer) {
      if (this.config.animation.enableAnimations) {
        this.animateMenuClose(this.menuContainer);
      } else {
        this.menuContainer.destroy();
      }
      this.menuContainer = null;
    }
    
    this.menuObjects.clear();
  }

  /**
   * 保存菜单状态
   */
  private saveMenuState(): void {
    if (this.config.state.saveState) {
      this.saveState();
    }
  }

  /**
   * 恢复菜单状态
   */
  private restoreMenuState(menuId: string): void {
    if (!this.config.state.restoreState) return;

    const selectedIndex = this.menuState.selectedItems[menuId];
    if (selectedIndex !== undefined) {
      this.menuState.selectedItems[menuId] = selectedIndex;
    }
  }

  /**
   * 获取当前主题
   */
  private getCurrentTheme(): MenuTheme {
    const themeName = this.config.display.theme;
    return this.themes.get(themeName) || this.themes.get('pixel')!;
  }

  /**
   * 添加事件
   */
  private addEvent(type: MenuEvent['type'], menuId: string, data?: any): void {
    const event: MenuEvent = {
      type,
      menuId,
      data,
      timestamp: Date.now()
    };
    
    this.events.push(event);
    
    if (this.config.debug.logMenuEvents) {
      console.log('菜单事件:', event);
    }
  }

  /**
   * 注册回调
   */
  registerCallback(eventType: string, callback: (data: any) => void): void {
    this.callbacks.set(eventType, callback);
  }

  /**
   * 触发回调
   */
  private triggerCallback(eventType: string, data: any): void {
    const callback = this.callbacks.get(eventType);
    if (callback) {
      callback(data);
    }
  }

  /**
   * 添加菜单
   */
  addMenu(menuId: string, items: MenuItem[]): void {
    this.menus.set(menuId, items);
  }

  /**
   * 获取菜单
   */
  getMenu(menuId: string): MenuItem[] | undefined {
    return this.menus.get(menuId);
  }

  /**
   * 删除菜单
   */
  removeMenu(menuId: string): void {
    this.menus.delete(menuId);
  }

  /**
   * 添加主题
   */
  addTheme(theme: MenuTheme): void {
    this.themes.set(theme.name.toLowerCase(), theme);
    storage.set('menu_themes', Array.from(this.themes.entries()));
  }

  /**
   * 获取主题
   */
  getTheme(themeName: string): MenuTheme | undefined {
    return this.themes.get(themeName);
  }

  /**
   * 获取所有主题
   */
  getAllThemes(): MenuTheme[] {
    return Array.from(this.themes.values());
  }

  /**
   * 获取配置
   */
  getConfig(): MenuConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<MenuConfig>): void {
    this.config = { ...this.config, ...config };
    this.saveConfig();
  }

  /**
   * 获取当前状态
   */
  getCurrentState(): MenuState {
    return { ...this.menuState };
  }

  /**
   * 获取事件历史
   */
  getEvents(): MenuEvent[] {
    return [...this.events];
  }

  /**
   * 是否处于活动状态
   */
  isMenuActive(): boolean {
    return this.isActive;
  }

  /**
   * 获取当前菜单
   */
  getCurrentMenu(): string | null {
    return this.currentMenu;
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.closeMenu();
    this.menus.clear();
    this.events = [];
    this.callbacks.clear();
    this.themes.clear();
    this.scene = null;
  }
}