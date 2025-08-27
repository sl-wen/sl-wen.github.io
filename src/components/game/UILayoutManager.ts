import * as Phaser from 'phaser';

/**
 * UI元素接口
 * 定义UI元素的基本属性和布局信息
 */
interface UIElement {
  id: string;                                                           // 元素唯一标识
  x: number;                                                            // X坐标
  y: number;                                                            // Y坐标
  width: number;                                                        // 宽度
  height: number;                                                       // 高度
  priority: number;                                                     // 优先级，数值越高越重要
  anchor: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';  // 锚点位置
  margin: number;                                                       // 边距
  isVisible: boolean;                                                   // 是否可见
}

/**
 * 安全区域接口
 * 定义屏幕的安全显示区域，避免被系统UI遮挡
 */
interface SafeArea {
  top: number;    // 顶部安全距离
  right: number;  // 右侧安全距离
  bottom: number; // 底部安全距离
  left: number;   // 左侧安全距离
}

/**
 * 智能UI布局管理器
 * 负责管理游戏UI元素的响应式布局和位置计算
 */
export class UILayoutManager {
  private scene: Phaser.Scene;
  private elements: Map<string, UIElement> = new Map();
  private screenWidth: number = 0;
  private screenHeight: number = 0;
  private safeArea: SafeArea = { top: 0, right: 0, bottom: 0, left: 0 };
  private isPortrait: boolean = false;
  private isMobile: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.updateScreenInfo();
    this.setupResizeListener();
  }

  private updateScreenInfo() {
    this.screenWidth = this.scene.cameras.main.width;
    this.screenHeight = this.scene.cameras.main.height;
    this.isPortrait = this.screenHeight > this.screenWidth;
    this.isMobile = this.screenWidth < 768;

    // 计算安全区域
    this.calculateSafeArea();
  }

  /**
   * 计算安全区域
   * 考虑开发者工具、浏览器UI等可能遮挡的区域
   */
  private calculateSafeArea() {
    // 基础边距
    const basePadding = 1;

    // 桌面端需要考虑开发者工具可能遮挡右侧内容
    if (this.isMobile) {
      this.safeArea = {
        top: this.isPortrait ? 50 : 30, // 状态栏高度
        right: basePadding,
        bottom: this.isPortrait ? 80 : 40, // 导航栏或手势区域
        left: basePadding
      };
    } else {

      this.safeArea = {
        top: basePadding,
        right: basePadding, // 为开发者工具预留空间
        bottom: basePadding,
        left: basePadding
      };
    }

    // 动态检测屏幕宽度变化，自动调整右侧安全区域
    this.detectDeveloperTools();
  }

  /**
   * 检测开发者工具是否打开
   * 通过监听窗口大小变化来动态调整安全区域
   */
  private detectDeveloperTools() {
    // 监听窗口大小变化
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        const currentWidth = window.innerWidth;

        // 如果窗口宽度显著减少，可能是开发者工具打开了
        if (currentWidth < this.screenWidth * 0.8) {
          this.safeArea.right = Math.max(400, this.screenWidth - currentWidth + 50);
          this.repositionAllElements();
        } else {
          // 窗口恢复正常，减少右侧安全区域
          this.safeArea.right = this.isMobile ? 20 : 30;
          this.repositionAllElements();
        }
      });
    }
  }

  private setupResizeListener() {
    this.scene.scale.on('resize', () => {
      this.updateScreenInfo();
      this.repositionAllElements();
    });
  }

  // 注册UI元素
  public registerElement(element: UIElement): void {
    this.elements.set(element.id, element);
    this.repositionElement(element.id);
  }

  // 更新元素配置
  public updateElement(id: string, updates: Partial<UIElement>): void {
    const element = this.elements.get(id);
    if (element) {
      Object.assign(element, updates);
      this.repositionElement(id);
    }
  }

  /**
   * 获取元素的最佳位置
   * @param id 元素ID
   * @returns 计算出的最佳位置坐标
   */
  public getOptimalPosition(id: string): { x: number; y: number } {
    const element = this.elements.get(id);  // 获取元素
    if (!element) {
      return { x: 0, y: 0 };  // 如果元素不存在，返回默认位置
    }

    return this.calculatePosition(element);  // 计算并返回最佳位置
  }

  /**
   * 计算元素位置
   * 根据锚点和安全区域计算元素的基础位置
   * @param element UI元素
   * @returns 计算出的位置坐标
   */
  private calculatePosition(element: UIElement): { x: number; y: number } {
    let x: number, y: number;  // 位置坐标

    // 根据锚点计算基础位置
    switch (element.anchor) {
      case 'top-left':
        x = this.safeArea.left + element.margin;      // 左上角：安全区域左边界 + 边距
        y = this.safeArea.top + element.margin;       // 左上角：安全区域上边界 + 边距
        break;

      case 'top-right':
        x = this.screenWidth - this.safeArea.right - element.width - element.margin;  // 右上角：屏幕宽度 - 安全区域右边界 - 元素宽度 - 边距
        y = this.safeArea.top + element.margin;       // 右上角：安全区域上边界 + 边距
        break;

      case 'bottom-left':
        x = this.safeArea.left + element.margin;      // 左下角：安全区域左边界 + 边距
        y = this.screenHeight - this.safeArea.bottom - element.height - element.margin;  // 左下角：屏幕高度 - 安全区域下边界 - 元素高度 - 边距
        break;

      case 'bottom-right':
        x = this.screenWidth - this.safeArea.right - element.width - element.margin;  // 右下角：屏幕宽度 - 安全区域右边界 - 元素宽度 - 边距
        y = this.screenHeight - this.safeArea.bottom - element.height - element.margin; // 右下角：屏幕高度 - 安全区域下边界 - 元素高度 - 边距
        break;

      case 'center':
        x = (this.screenWidth - element.width) / 2;   // 中心：屏幕宽度的一半减去元素宽度的一半
        y = (this.screenHeight - element.height) / 2; // 中心：屏幕高度的一半减去元素高度的一半
        break;

      default:
        x = element.x;  // 默认使用元素的原始X坐标
        y = element.y;  // 默认使用元素的原始Y坐标
    }

    // 检查并解决冲突
    const resolvedPosition = this.resolveConflicts(element, x, y);  // 解决与其他元素的冲突

    return resolvedPosition;  // 返回最终位置
  }

  private resolveConflicts(currentElement: UIElement, x: number, y: number): { x: number; y: number } {
    const conflictElements = Array.from(this.elements.values())
      .filter(el =>
        el.id !== currentElement.id &&
        el.isVisible &&
        this.isOverlapping(
          { x, y, width: currentElement.width, height: currentElement.height },
          { x: el.x, y: el.y, width: el.width, height: el.height }
        )
      );

    if (conflictElements.length === 0) {
      return { x, y };
    }

    // 根据优先级解决冲突
    for (const conflictElement of conflictElements) {
      if (currentElement.priority <= conflictElement.priority) {
        // 当前元素优先级较低，需要移动位置
        const newPosition = this.findAlternativePosition(currentElement, conflictElement);
        if (newPosition) {
          return newPosition;
        }
      }
    }

    return { x, y };
  }

  private isOverlapping(rect1: { x: number; y: number; width: number; height: number },
    rect2: { x: number; y: number; width: number; height: number }): boolean {
    return !(rect1.x + rect1.width < rect2.x ||
      rect2.x + rect2.width < rect1.x ||
      rect1.y + rect1.height < rect2.y ||
      rect2.y + rect2.height < rect1.y);
  }

  /**
   * 查找替代位置
   * 当元素位置发生冲突时，寻找可用的替代位置
   * @param element 当前元素
   * @param conflictElement 冲突元素
   * @returns 替代位置或null
   */
  private findAlternativePosition(element: UIElement, conflictElement: UIElement): { x: number; y: number } | null {
    const margin = 10;  // 元素间距

    // 尝试不同的替代位置
    const alternatives = [
      // 在冲突元素的右侧
      { x: conflictElement.x + conflictElement.width + margin, y: element.y },
      // 在冲突元素的左侧
      { x: conflictElement.x - element.width - margin, y: element.y },
      // 在冲突元素的上方
      { x: element.x, y: conflictElement.y - element.height - margin },
      // 在冲突元素的下方
      { x: element.x, y: conflictElement.y + conflictElement.height + margin }
    ];

    for (const alt of alternatives) {
      if (this.isPositionValid(alt.x, alt.y, element.width, element.height)) {
        return alt;  // 找到有效位置
      }
    }

    return null;  // 没有找到有效位置
  }

  /**
   * 检查位置是否有效
   * 验证元素位置是否在安全区域内
   * @param x X坐标
   * @param y Y坐标
   * @param width 元素宽度
   * @param height 元素高度
   * @returns 位置是否有效
   */
  private isPositionValid(x: number, y: number, width: number, height: number): boolean {
    // 检查是否在屏幕边界内
    return x >= this.safeArea.left &&                                    // 左边界检查
      y >= this.safeArea.top &&                                          // 上边界检查
      x + width <= this.screenWidth - this.safeArea.right &&             // 右边界检查
      y + height <= this.screenHeight - this.safeArea.bottom;            // 下边界检查
  }

  /**
   * 重新定位单个元素
   * @param id 元素ID
   */
  private repositionElement(id: string): void {
    const element = this.elements.get(id);  // 获取元素
    if (!element || !element.isVisible) {
      return;  // 如果元素不存在或不可见，则跳过
    }

    const newPosition = this.calculatePosition(element);  // 计算新位置
    element.x = newPosition.x;  // 更新X坐标
    element.y = newPosition.y;  // 更新Y坐标
  }

  /**
   * 重新定位所有元素
   * 按优先级排序，优先级高的先定位
   */
  private repositionAllElements(): void {
    // 按优先级排序，优先级高的先定位
    const sortedElements = Array.from(this.elements.values())
      .filter(el => el.isVisible)  // 过滤出可见元素
      .sort((a, b) => b.priority - a.priority);  // 按优先级降序排序

    for (const element of sortedElements) {
      this.repositionElement(element.id);  // 重新定位每个元素
    }
  }

  // 获取推荐的摇杆位置 - 改进的移动端响应式算法
  public getJoystickPosition(radius: number): { x: number; y: number } {
    const baseMargin = this.isMobile ? 15 : 20;
    let x: number, y: number;

    if (this.isMobile) {
      if (this.isPortrait) {
        // 竖屏：左下角，避开底部手势区域
        // 使用相对位置确保在不同屏幕尺寸上都有合适的位置
        x = Math.max(
          radius + baseMargin, 
          Math.min(this.screenWidth * 0.15, this.screenWidth * 0.25)
        );
        y = this.screenHeight - Math.max(
          this.safeArea.bottom + radius + baseMargin,
          this.screenHeight * 0.08
        );
      } else {
        // 横屏：左下角，考虑更小的边距以节省空间
        x = Math.max(
          this.safeArea.left + radius + baseMargin,
          this.screenWidth * 0.08
        );
        y = this.screenHeight - Math.max(
          this.safeArea.bottom + radius + baseMargin,
          this.screenHeight * 0.08
        );
      }
    } else {
      // 桌面端：左下角固定位置
      x = this.safeArea.left + radius + baseMargin * 1.5;
      y = this.screenHeight - this.safeArea.bottom - radius - baseMargin * 1.5;
    }

    // 更严格的边界检查，确保摇杆完全可见
    const minX = radius + baseMargin;
    const maxX = this.screenWidth - radius - baseMargin;
    const minY = radius + baseMargin;
    const maxY = this.screenHeight - radius - baseMargin;

    x = Math.max(minX, Math.min(x, maxX));
    y = Math.max(minY, Math.min(y, maxY));

    console.log(`UILayoutManager calculated joystick position: ${x}, ${y} (screen: ${this.screenWidth}x${this.screenHeight}, mobile: ${this.isMobile}, portrait: ${this.isPortrait})`);

    return { x, y };
  }

  /**
   * 获取推荐的动作按钮位置
   * 根据屏幕尺寸和方向计算动作按钮的最佳位置
   * @param buttonSize 按钮大小
   * @param count 按钮数量
   * @returns 按钮位置数组
   */
  public getActionButtonsPosition(buttonSize: number, count: number): { x: number; y: number }[] {
    const margin = 15;  // 边距
    const spacing = buttonSize + 10;  // 按钮间距
    const positions: { x: number; y: number }[] = [];  // 位置数组

    if (this.isMobile) {
      if (this.isPortrait) {
        // 竖屏：右下角垂直排列
        const startX = this.screenWidth - this.safeArea.right - buttonSize - margin;  // 起始X坐标
        const startY = this.screenHeight - this.safeArea.bottom - (count * spacing) + spacing - margin;  // 起始Y坐标

        for (let i = 0; i < count; i++) {
          positions.push({
            x: startX,  // 所有按钮X坐标相同
            y: startY + (i * spacing)  // Y坐标递增
          });
        }
      } else {
        // 横屏：右下角水平排列
        const startX = this.screenWidth - this.safeArea.right - (count * spacing) + spacing - margin;  // 起始X坐标
        const startY = this.screenHeight - this.safeArea.bottom - buttonSize - margin;  // 起始Y坐标

        for (let i = 0; i < count; i++) {
          positions.push({
            x: startX + (i * spacing),  // X坐标递增
            y: startY  // 所有按钮Y坐标相同
          });
        }
      }
    } else {
      // 桌面端：右下角水平排列
      const startX = this.screenWidth - this.safeArea.right - (count * spacing) + spacing - margin * 2;  // 起始X坐标
      const startY = this.screenHeight - this.safeArea.bottom - buttonSize - margin * 2;  // 起始Y坐标

      for (let i = 0; i < count; i++) {
        positions.push({
          x: startX + (i * spacing),  // X坐标递增
          y: startY  // 所有按钮Y坐标相同
        });
      }
    }

    return positions;  // 返回位置数组
  }

  /**
   * 获取状态栏的最佳位置
   * @returns 状态栏位置坐标
   */
  public getStatsBarPosition(): { x: number; y: number } {
    return {
      x: this.safeArea.left + 10,  // 安全区域左边界 + 10像素
      y: this.safeArea.top + 10    // 安全区域上边界 + 10像素
    };
  }

  /**
   * 检查是否是移动设备
   * @returns 是否为移动设备
   */
  public getIsMobile(): boolean {
    return this.isMobile;  // 返回移动设备标识
  }

  /**
   * 检查是否是竖屏
   * @returns 是否为竖屏模式
   */
  public getIsPortrait(): boolean {
    return this.isPortrait;  // 返回竖屏标识
  }

  /**
   * 获取安全区域信息
   * @returns 安全区域信息的副本
   */
  public getSafeArea(): SafeArea {
    return { ...this.safeArea };  // 返回安全区域的副本
  }

  /**
   * 获取屏幕信息
   * @returns 包含屏幕尺寸、方向和安全区域的完整信息
   */
  public getScreenInfo() {
    return {
      width: this.screenWidth,      // 屏幕宽度
      height: this.screenHeight,    // 屏幕高度
      isPortrait: this.isPortrait,  // 是否竖屏
      isMobile: this.isMobile,      // 是否移动设备
      safeArea: this.getSafeArea()  // 安全区域信息
    };
  }

  /**
   * 设置全屏模式
   * 调整UI布局以适应全屏模式
   * @param isFullscreen 是否处于全屏模式
   */
  public setFullscreenMode(isFullscreen: boolean) {
    if (isFullscreen) {
      // 全屏模式下，增加安全区域以避免被系统UI遮挡
      this.safeArea = {
        top: 20,
        right: 1,
        bottom: 30,
        left: 1
      };
    } else {
      // 正常模式下，恢复默认安全区域
      this.safeArea = {
        top: 10,
        right: 1,
        bottom: 20,
        left: 1
      };
    }
    
    // 重新计算所有UI元素位置
    this.updateAllElementPositions();
    
    console.log(`UILayoutManager fullscreen mode: ${isFullscreen ? 'enabled' : 'disabled'}`);
  }

  /**
   * 更新所有UI元素位置
   * 重新计算并应用所有元素的布局
   */
  private updateAllElementPositions() {
    this.elements.forEach((element, id) => {
      const position = this.calculatePosition(element);
      // 这里可以添加实际更新UI元素位置的代码
      console.log(`Updated ${id} position:`, position);
    });
  }

  /**
   * 清理资源
   * 清空所有UI元素
   */
  public destroy() {
    this.elements.clear();  // 清空元素映射
  }
}