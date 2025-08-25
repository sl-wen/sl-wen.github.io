'use client';

import React, { useState, useEffect } from 'react';
import { LoadingProgress } from '../utils/ResourceLoader';

interface LoadingScreenProps {
  isVisible: boolean;
  progress: LoadingProgress;
  onLoadingComplete?: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  isVisible,
  progress,
  onLoadingComplete
}) => {
  const [displayText, setDisplayText] = useState('准备中...');
  const [dots, setDots] = useState('');

  // 动画点点点效果
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // 更新显示文本
  useEffect(() => {
    if (progress.isComplete) {
      setDisplayText('加载完成！');
      setTimeout(() => {
        onLoadingComplete?.();
      }, 500);
    } else if (progress.currentResource) {
      setDisplayText(`正在加载 ${progress.currentResource}`);
    } else {
      setDisplayText('准备中');
    }
  }, [progress, onLoadingComplete]);

  // 获取加载提示
  const getLoadingTips = () => {
    const tips = [
      '🌱 在萌芽之地，每一颗种子都蕴含着无限可能',
      '💧 记得给作物浇水，它们会以丰收回报你的照料',
      '🌟 品质越高的作物，售价也会更高哦',
      '🔨 工具会磨损，记得及时修理或购买新的',
      '🌸 不同的季节适合种植不同的作物',
      '💰 合理规划资金，投资更好的种子和工具',
      '🏆 完成各种成就可以获得特殊奖励',
      '📦 整理背包可以让物品排列更整齐',
      '🎯 专注种植单一作物可以提高效率',
      '🌈 享受农场生活的宁静与美好'
    ];
    
    return tips[Math.floor(progress.percentage / 10) % tips.length];
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 flex items-center justify-center z-50">
      {/* 背景动画 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white opacity-10 rounded-full animate-spin" 
             style={{ animationDuration: '20s' }} />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-white opacity-5 rounded-full animate-spin" 
             style={{ animationDuration: '30s', animationDirection: 'reverse' }} />
      </div>

      {/* 主要内容 */}
      <div className="relative z-10 text-center text-white p-8 max-w-md mx-auto">
        {/* 游戏标题 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-shadow-lg">
            🌱 萌芽之地
          </h1>
          <p className="text-xl opacity-90">Sprout Lands</p>
        </div>

        {/* 加载动画 */}
        <div className="mb-6">
          <div className="relative w-32 h-32 mx-auto mb-4">
            {/* 外圈旋转 */}
            <div className="absolute inset-0 border-4 border-white border-opacity-30 rounded-full animate-spin"
                 style={{ animationDuration: '2s' }}>
              <div className="absolute top-0 left-1/2 w-2 h-2 bg-white rounded-full transform -translate-x-1/2 -translate-y-1" />
            </div>
            
            {/* 内圈反向旋转 */}
            <div className="absolute inset-4 border-4 border-white border-opacity-50 rounded-full animate-spin"
                 style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}>
              <div className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-white rounded-full transform -translate-x-1/2 -translate-y-0.5" />
            </div>
            
            {/* 中心图标 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-4xl animate-pulse">🌱</div>
            </div>
          </div>

          {/* 进度条 */}
          <div className="w-full bg-white bg-opacity-20 rounded-full h-3 mb-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-400 to-green-400 rounded-full transition-all duration-300 ease-out relative"
              style={{ width: `${progress.percentage}%` }}
            >
              {/* 进度条光效 */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse" />
            </div>
          </div>

          {/* 进度文本 */}
          <div className="flex justify-between text-sm opacity-80">
            <span>{progress.loaded}/{progress.total}</span>
            <span>{progress.percentage}%</span>
          </div>
        </div>

        {/* 加载状态 */}
        <div className="mb-6">
          <p className="text-lg font-medium mb-2">
            {displayText}{dots}
          </p>
          
          {/* 加载提示 */}
          <div className="bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
            <p className="text-sm opacity-90 leading-relaxed">
              💡 {getLoadingTips()}
            </p>
          </div>
        </div>

        {/* 加载完成动画 */}
        {progress.isComplete && (
          <div className="animate-bounce">
            <div className="text-6xl mb-2">🎉</div>
            <p className="text-xl font-bold">准备开始你的农场之旅！</p>
          </div>
        )}

        {/* 底部信息 */}
        {!progress.isComplete && (
          <div className="absolute bottom-8 left-0 right-0 text-center">
            <p className="text-sm opacity-70">
              正在加载游戏资源，请稍候...
            </p>
          </div>
        )}
      </div>

      {/* 装饰元素 */}
      <div className="absolute inset-0 pointer-events-none">
        {/* 飘动的种子 */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute text-2xl opacity-20 animate-float"
            style={{
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 3) * 20}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + i * 0.5}s`
            }}
          >
            🌱
          </div>
        ))}
        
        {/* 飘动的叶子 */}
        {[...Array(4)].map((_, i) => (
          <div
            key={`leaf-${i}`}
            className="absolute text-xl opacity-15 animate-float"
            style={{
              right: `${10 + i * 20}%`,
              top: `${30 + (i % 2) * 30}%`,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${4 + i * 0.3}s`
            }}
          >
            🍃
          </div>
        ))}
      </div>

      {/* CSS 动画样式 */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .text-shadow-lg {
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;