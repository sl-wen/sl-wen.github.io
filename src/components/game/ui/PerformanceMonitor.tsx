import React, { useState, useEffect } from 'react';

interface PerformanceData {
  fps: number;
  memory: {
    used: number;
    total: number;
  };
  renderTime: number;
}

interface PerformanceMonitorProps {
  isVisible?: boolean;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  isVisible = false
}) => {
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    fps: 0,
    memory: { used: 0, total: 0 },
    renderTime: 0
  });

  useEffect(() => {
    if (!isVisible) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const updatePerformance = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        // 获取内存信息（如果可用）
        const memory = (performance as any).memory 
          ? {
              used: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024),
              total: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024)
            }
          : { used: 0, total: 0 };

        setPerformanceData({
          fps,
          memory,
          renderTime: Math.round(currentTime - lastTime)
        });

        frameCount = 0;
        lastTime = currentTime;
      }

      animationId = requestAnimationFrame(updatePerformance);
    };

    animationId = requestAnimationFrame(updatePerformance);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  const getFpsColor = (fps: number) => {
    if (fps >= 55) return 'text-green-400';
    if (fps >= 45) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getMemoryColor = (used: number, total: number) => {
    const percentage = (used / total) * 100;
    if (percentage < 70) return 'text-green-400';
    if (percentage < 90) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div 
      className="fixed z-50 bg-black bg-opacity-80 border border-gray-600 rounded-lg p-2 text-xs font-mono"
      style={{
        right: '10px',
        top: '10px',
        minWidth: '120px'
      }}
    >
      <div className="text-white font-bold mb-1">性能监控</div>
      <div className={`${getFpsColor(performanceData.fps)}`}>
        FPS: {performanceData.fps}
      </div>
      <div className={`${getMemoryColor(performanceData.memory.used, performanceData.memory.total)}`}>
        内存: {performanceData.memory.used}MB / {performanceData.memory.total}MB
      </div>
      <div className="text-gray-400">
        渲染: {performanceData.renderTime}ms
      </div>
    </div>
  );
};