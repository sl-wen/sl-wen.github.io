import React, { useEffect, useState } from 'react';

interface CompatibilityCheck {
  name: string;
  supported: boolean;
  description: string;
}

interface BrowserCompatibilityProps {
  onCompatibilityResult: (isCompatible: boolean) => void;
}

export const BrowserCompatibility: React.FC<BrowserCompatibilityProps> = ({
  onCompatibilityResult
}) => {
  const [checks, setChecks] = useState<CompatibilityCheck[]>([]);
  const [isChecking, setIsChecking] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (info: string) => {
    console.log(`[BrowserCompatibility Debug] ${info}`);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  useEffect(() => {
    addDebugInfo('开始浏览器兼容性检查');

    const performChecks = () => {
      addDebugInfo('执行兼容性检查');

      const compatibilityChecks: CompatibilityCheck[] = [
        {
          name: 'Canvas API',
          supported: !!document.createElement('canvas').getContext,
          description: '支持HTML5 Canvas绘图'
        },
        {
          name: 'WebGL',
          supported: !!window.WebGLRenderingContext,
          description: '支持WebGL 3D图形渲染'
        },
        {
          name: 'Audio API',
          supported: !!window.AudioContext || !!(window as any).webkitAudioContext,
          description: '支持Web Audio API音频播放'
        },
        {
          name: 'Local Storage',
          supported: !!window.localStorage,
          description: '支持本地存储'
        },
        {
          name: 'Touch Events',
          supported: 'ontouchstart' in window,
          description: '支持触摸事件（移动端）'
        },
        {
          name: 'Request Animation Frame',
          supported: !!window.requestAnimationFrame,
          description: '支持动画帧请求'
        },
        {
          name: 'ES6+ Features',
          supported: (() => {
            try {
              new Function('() => {}');
              return true;
            } catch {
              return false;
            }
          })(),
          description: '支持ES6+语法特性'
        },
        {
          name: 'Performance API',
          supported: !!window.performance && !!window.performance.now,
          description: '支持性能监控API'
        }
      ];

      addDebugInfo(`兼容性检查完成，共${compatibilityChecks.length}项`);

      setChecks(compatibilityChecks);
      setIsChecking(false);

      const isCompatible = compatibilityChecks.every(check => check.supported);
      addDebugInfo(`兼容性结果: ${isCompatible ? '通过' : '不通过'}`);

      // 延迟一点时间再调用回调，确保UI更新
      setTimeout(() => {
        addDebugInfo('调用兼容性结果回调');
        onCompatibilityResult(isCompatible);
      }, 100);
    };

    // 添加超时保护
    const timeoutId = setTimeout(() => {
      addDebugInfo('兼容性检查超时，强制通过');
      setIsChecking(false);
      onCompatibilityResult(true);
    }, 5000); // 5秒超时

    performChecks();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [onCompatibilityResult]);

  if (isChecking) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-md mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <div className="text-white text-lg font-semibold mb-2">
              检查浏览器兼容性
            </div>
            <div className="text-gray-400 text-sm mb-4">
              正在检测您的浏览器是否支持游戏运行...
            </div>

            {/* 调试信息 */}
            <div className="text-left text-xs text-gray-500 max-h-20 overflow-y-auto">
              {debugInfo.map((info, index) => (
                <div key={index}>{info}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const supportedCount = checks.filter(check => check.supported).length;
  const totalCount = checks.length;
  const isCompatible = supportedCount === totalCount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
        <div className="text-center mb-6">
          <div className={`text-2xl mb-2 ${isCompatible ? 'text-green-400' : 'text-red-400'}`}>
            {isCompatible ? '✅' : '⚠️'}
          </div>
          <h2 className="text-white text-xl font-bold mb-2">
            浏览器兼容性检查
          </h2>
          <p className="text-gray-400 text-sm">
            {supportedCount} / {totalCount} 项检查通过
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {checks.map((check, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <div className="flex-1">
                <div className="text-white font-medium">{check.name}</div>
                <div className="text-gray-400 text-sm">{check.description}</div>
              </div>
              <div className={`ml-4 text-lg ${check.supported ? 'text-green-400' : 'text-red-400'}`}>
                {check.supported ? '✓' : '✗'}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          {isCompatible ? (
            <div className="space-y-3">
              <p className="text-green-400 font-semibold">
                您的浏览器完全兼容！游戏可以正常运行。
              </p>
              <button
                onClick={() => onCompatibilityResult(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                开始游戏
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-red-400 font-semibold">
                您的浏览器不完全兼容，游戏可能无法正常运行。
              </p>
              <div className="text-gray-400 text-sm">
                <p>建议使用以下浏览器：</p>
                <ul className="mt-2 space-y-1">
                  <li>• Chrome 60+</li>
                  <li>• Firefox 55+</li>
                  <li>• Safari 12+</li>
                  <li>• Edge 79+</li>
                </ul>
              </div>
              <button
                onClick={() => onCompatibilityResult(false)}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                继续尝试
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};