import * as Phaser from 'phaser';

// UI元素类型定义
interface UIElement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  priority: number; // 优先级，数值越高越重要
  anchor: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  margin: number;
  isVisible: boolean;
}

interface SafeArea {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

// 智能UI布局管理器
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

  private calculateSafeArea() {
    // 基础边距
    const basePadding = this.isMobile ? 20 : 30;

    // 移动端需要考虑状态栏、导航栏等
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
        right: basePadding,
        bottom: basePadding,
        left: basePadding
      };
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

  // 获取元素的最佳位置
  public getOptimalPosition(id: string): { x: number; y: number } {
    const element = this.elements.get(id);
    if (!element) {
      return { x: 0, y: 0 };
    }

    return this.calculatePosition(element);
  }

  private calculatePosition(element: UIElement): { x: number; y: number } {
    let x: number, y: number;

    // 根据锚点计算基础位置
    switch (element.anchor) {
      case 'top-left':
        x = this.safeArea.left + element.margin;
        y = this.safeArea.top + element.margin;
        break;

      case 'top-right':
        x = this.screenWidth - this.safeArea.right - element.width - element.margin;
        y = this.safeArea.top + element.margin;
        break;

      case 'bottom-left':
        x = this.safeArea.left + element.margin;
        y = this.screenHeight - this.safeArea.bottom - element.height - element.margin;
        break;

      case 'bottom-right':
        x = this.screenWidth - this.safeArea.right - element.width - element.margin;
        y = this.screenHeight - this.safeArea.bottom - element.height - element.margin;
        break;

      case 'center':
        x = (this.screenWidth - element.width) / 2;
        y = (this.screenHeight - element.height) / 2;
        break;

      default:
        x = element.x;
        y = element.y;
    }

    // 检查并解决冲突
    const resolvedPosition = this.resolveConflicts(element, x, y);

    return resolvedPosition;
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

  private findAlternativePosition(element: UIElement, conflictElement: UIElement): { x: number; y: number } | null {
    const margin = 10;

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
        return alt;
      }
    }

    return null;
  }

  private isPositionValid(x: number, y: number, width: number, height: number): boolean {
    // 检查是否在屏幕边界内
    return x >= this.safeArea.left &&
      y >= this.safeArea.top &&
      x + width <= this.screenWidth - this.safeArea.right &&
      y + height <= this.screenHeight - this.safeArea.bottom;
  }

  private repositionElement(id: string): void {
    const element = this.elements.get(id);
    if (!element || !element.isVisible) {
      return;
    }

    const newPosition = this.calculatePosition(element);
    element.x = newPosition.x;
    element.y = newPosition.y;
  }

  private repositionAllElements(): void {
    // 按优先级排序，优先级高的先定位
    const sortedElements = Array.from(this.elements.values())
      .filter(el => el.isVisible)
      .sort((a, b) => b.priority - a.priority);

    for (const element of sortedElements) {
      this.repositionElement(element.id);
    }
  }

  // 获取推荐的摇杆位置
  public getJoystickPosition(radius: number): { x: number; y: number } {
    const margin = 20;
    let x: number, y: number;

    if (this.isMobile) {
      if (this.isPortrait) {
        // 竖屏：左下角，避开底部手势区域
        x = Math.max(radius + margin, this.screenWidth * 0.15);
        y = this.screenHeight - this.safeArea.bottom - radius - margin;
      } else {
        // 横屏：左下角，标准位置
        x = this.safeArea.left + radius + margin;
        y = this.screenHeight - this.safeArea.bottom - radius - margin;
      }
    } else {
      // 桌面端：左下角固定位置
      x = this.safeArea.left + radius + margin * 2;
      y = this.screenHeight - this.safeArea.bottom - radius - margin * 2;
    }

    // 边界检查
    x = Math.max(radius + margin, Math.min(x, this.screenWidth - radius - margin));
    y = Math.max(radius + margin, Math.min(y, this.screenHeight - radius - margin));

    return { x, y };
  }

  // 获取推荐的动作按钮位置
  public getActionButtonsPosition(buttonSize: number, count: number): { x: number; y: number }[] {
    const margin = 15;
    const spacing = buttonSize + 10;
    const positions: { x: number; y: number }[] = [];

    if (this.isMobile) {
      if (this.isPortrait) {
        // 竖屏：右下角垂直排列
        const startX = this.screenWidth - this.safeArea.right - buttonSize - margin;
        const startY = this.screenHeight - this.safeArea.bottom - (count * spacing) + spacing - margin;

        for (let i = 0; i < count; i++) {
          positions.push({
            x: startX,
            y: startY + (i * spacing)
          });
        }
      } else {
        // 横屏：右下角水平排列
        const startX = this.screenWidth - this.safeArea.right - (count * spacing) + spacing - margin;
        const startY = this.screenHeight - this.safeArea.bottom - buttonSize - margin;

        for (let i = 0; i < count; i++) {
          positions.push({
            x: startX + (i * spacing),
            y: startY
          });
        }
      }
    } else {
      // 桌面端：右下角水平排列
      const startX = this.screenWidth - this.safeArea.right - (count * spacing) + spacing - margin * 2;
      const startY = this.screenHeight - this.safeArea.bottom - buttonSize - margin * 2;

      for (let i = 0; i < count; i++) {
        positions.push({
          x: startX + (i * spacing),
          y: startY
        });
      }
    }

    return positions;
  }

  // 获取状态栏的最佳位置
  public getStatsBarPosition(): { x: number; y: number } {
    return {
      x: this.safeArea.left + 10,
      y: this.safeArea.top + 10
    };
  }

  // 检查是否是移动设备
  public getIsMobile(): boolean {
    return this.isMobile;
  }

  // 检查是否是竖屏
  public getIsPortrait(): boolean {
    return this.isPortrait;
  }

  // 获取安全区域信息
  public getSafeArea(): SafeArea {
    return { ...this.safeArea };
  }

  // 获取屏幕信息
  public getScreenInfo() {
    return {
      width: this.screenWidth,
      height: this.screenHeight,
      isPortrait: this.isPortrait,
      isMobile: this.isMobile,
      safeArea: this.getSafeArea()
    };
  }

  // 清理资源
  public destroy() {
    this.elements.clear();
  }
}