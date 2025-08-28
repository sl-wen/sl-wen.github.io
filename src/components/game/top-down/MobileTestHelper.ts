/**
 * 移动端测试辅助工具
 * 用于调试和验证移动端触摸事件
 */

export class MobileTestHelper {
  private static instance: MobileTestHelper;
  private isDebugMode: boolean = false;
  private touchLog: Array<{ type: string; x: number; y: number; timestamp: number }> = [];

  static getInstance(): MobileTestHelper {
    if (!MobileTestHelper.instance) {
      MobileTestHelper.instance = new MobileTestHelper();
    }
    return MobileTestHelper.instance;
  }

  /**
   * 启用调试模式
   */
  enableDebug(): void {
    this.isDebugMode = true;
    console.log('🔧 移动端测试模式已启用');
    this.setupTouchLogging();
  }

  /**
   * 禁用调试模式
   */
  disableDebug(): void {
    this.isDebugMode = false;
    console.log('🔧 移动端测试模式已禁用');
  }

  /**
   * 设置触摸事件日志
   */
  private setupTouchLogging(): void {
    if (!this.isDebugMode) return;

    const logTouch = (type: string, x: number, y: number) => {
      this.touchLog.push({
        type,
        x,
        y,
        timestamp: Date.now()
      });
      
      // 只保留最近50条记录
      if (this.touchLog.length > 50) {
        this.touchLog.shift();
      }

      console.log(`👆 ${type}: (${x}, ${y})`);
    };

    // 监听全局触摸事件
    document.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      logTouch('touchstart', touch.clientX, touch.clientY);
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      const touch = e.changedTouches[0];
      logTouch('touchend', touch.clientX, touch.clientY);
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      logTouch('touchmove', touch.clientX, touch.clientY);
    }, { passive: true });
  }

  /**
   * 获取触摸日志
   */
  getTouchLog(): Array<{ type: string; x: number; y: number; timestamp: number }> {
    return [...this.touchLog];
  }

  /**
   * 清空触摸日志
   */
  clearTouchLog(): void {
    this.touchLog = [];
  }

  /**
   * 检测设备类型
   */
  detectDevice(): {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    userAgent: string;
    touchSupport: boolean;
  } {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isTablet = /ipad|android(?=.*\b(?:tablet|tab)\b)/i.test(userAgent);
    const isDesktop = !isMobile && !isTablet;
    const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    return {
      isMobile,
      isTablet,
      isDesktop,
      userAgent: navigator.userAgent,
      touchSupport
    };
  }

  /**
   * 测试触摸事件响应
   */
  testTouchResponse(element: HTMLElement): Promise<boolean> {
    return new Promise((resolve) => {
      let touchDetected = false;
      let timeout: NodeJS.Timeout;

      const handleTouch = () => {
        touchDetected = true;
        clearTimeout(timeout);
        element.removeEventListener('touchstart', handleTouch);
        resolve(true);
      };

      element.addEventListener('touchstart', handleTouch, { passive: true });

      // 5秒超时
      timeout = setTimeout(() => {
        element.removeEventListener('touchstart', handleTouch);
        resolve(false);
      }, 5000);
    });
  }

  /**
   * 显示设备信息
   */
  showDeviceInfo(): void {
    const deviceInfo = this.detectDevice();
    console.group('📱 设备信息');
    console.log('设备类型:', deviceInfo.isMobile ? '移动设备' : deviceInfo.isTablet ? '平板' : '桌面');
    console.log('触摸支持:', deviceInfo.touchSupport ? '是' : '否');
    console.log('用户代理:', deviceInfo.userAgent);
    console.groupEnd();
  }

  /**
   * 创建测试UI
   */
  createTestUI(): HTMLElement {
    const testDiv = document.createElement('div');
    testDiv.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px;
      border-radius: 5px;
      font-size: 12px;
      z-index: 10000;
      max-width: 200px;
    `;

    const deviceInfo = this.detectDevice();
    testDiv.innerHTML = `
      <div><strong>设备测试</strong></div>
      <div>类型: ${deviceInfo.isMobile ? '移动' : deviceInfo.isTablet ? '平板' : '桌面'}</div>
      <div>触摸: ${deviceInfo.touchSupport ? '支持' : '不支持'}</div>
      <div>触摸次数: ${this.touchLog.length}</div>
      <button onclick="this.parentElement.remove()" style="margin-top: 5px; padding: 2px 5px;">关闭</button>
    `;

    return testDiv;
  }
}

// 导出单例实例
export const mobileTestHelper = MobileTestHelper.getInstance();