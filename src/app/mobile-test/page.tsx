'use client';

import { useEffect, useState } from 'react';
import { mobileTestHelper } from '@/components/game/top-down/MobileTestHelper';

export default function MobileTestPage() {
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [touchCount, setTouchCount] = useState(0);
  const [isDebugEnabled, setIsDebugEnabled] = useState(false);

  useEffect(() => {
    // 获取设备信息
    const info = mobileTestHelper.detectDevice();
    setDeviceInfo(info);

    // 更新触摸计数
    const updateTouchCount = () => {
      const touchLog = mobileTestHelper.getTouchLog();
      setTouchCount(touchLog.length);
    };

    // 每秒更新一次触摸计数
    const interval = setInterval(updateTouchCount, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleEnableDebug = () => {
    mobileTestHelper.enableDebug();
    setIsDebugEnabled(true);
  };

  const handleDisableDebug = () => {
    mobileTestHelper.disableDebug();
    setIsDebugEnabled(false);
  };

  const handleClearLog = () => {
    mobileTestHelper.clearTouchLog();
    setTouchCount(0);
  };

  const handleTestTouch = async () => {
    const testElement = document.getElementById('test-touch-area');
    if (testElement) {
      const response = await mobileTestHelper.testTouchResponse(testElement);
      alert(`触摸测试结果: ${response ? '成功' : '失败'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">移动端触摸测试</h1>
        
        {/* 设备信息 */}
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-3">设备信息</h2>
          {deviceInfo && (
            <div className="space-y-2 text-sm">
              <div>设备类型: {deviceInfo.isMobile ? '移动设备' : deviceInfo.isTablet ? '平板' : '桌面'}</div>
              <div>触摸支持: {deviceInfo.touchSupport ? '是' : '否'}</div>
              <div>用户代理: {deviceInfo.userAgent}</div>
            </div>
          )}
        </div>

        {/* 控制按钮 */}
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-3">控制面板</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleEnableDebug}
              disabled={isDebugEnabled}
              className="px-4 py-2 bg-green-600 text-white rounded disabled:bg-gray-600"
            >
              启用调试
            </button>
            <button
              onClick={handleDisableDebug}
              disabled={!isDebugEnabled}
              className="px-4 py-2 bg-red-600 text-white rounded disabled:bg-gray-600"
            >
              禁用调试
            </button>
            <button
              onClick={handleClearLog}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              清空日志
            </button>
            <button
              onClick={handleTestTouch}
              className="px-4 py-2 bg-purple-600 text-white rounded"
            >
              测试触摸
            </button>
          </div>
        </div>

        {/* 触摸测试区域 */}
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-3">触摸测试区域</h2>
          <div
            id="test-touch-area"
            className="w-full h-32 bg-blue-600 rounded-lg flex items-center justify-center cursor-pointer touch-feedback"
            style={{
              minHeight: '44px',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation'
            }}
          >
            <p className="text-center">
              点击或触摸此区域进行测试<br />
              触摸次数: {touchCount}
            </p>
          </div>
        </div>

        {/* 状态显示 */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">状态信息</h2>
          <div className="space-y-2 text-sm">
            <div>调试模式: {isDebugEnabled ? '启用' : '禁用'}</div>
            <div>触摸次数: {touchCount}</div>
            <div>屏幕尺寸: {typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : '未知'}</div>
          </div>
        </div>

        {/* 使用说明 */}
        <div className="mt-6 bg-blue-900/50 border border-blue-500 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">使用说明</h3>
          <ul className="text-sm space-y-1">
            <li>• 点击"启用调试"开始记录触摸事件</li>
            <li>• 在触摸测试区域进行点击或触摸操作</li>
            <li>• 查看控制台输出了解详细的触摸事件信息</li>
            <li>• 点击"测试触摸"验证触摸响应功能</li>
          </ul>
        </div>
      </div>
    </div>
  );
}