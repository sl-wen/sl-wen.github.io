import GridEngine from 'grid-engine';
import * as Phaser from 'phaser';
import React, { useCallback, useEffect, useRef, useState } from 'react';

// 导入游戏场景
import BootScene from './scenes/BootScene';
import GameScene from './scenes/GameScene';
import MainMenuScene from './scenes/MainMenuScene';

interface TopDownGameProps {
  width?: number;
  height?: number;
}

export const TopDownGame: React.FC<TopDownGameProps> = ({
  width = 800,
  height = 600
}) => {
  const gameRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<Phaser.Game | null>(null);
  const [isGameReady, setIsGameReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 初始化游戏
  const initializeGame = useCallback(() => {
    console.log('开始初始化游戏');

    if (!gameRef.current) {
      console.error('错误: gameRef.current 为空');
      setError('游戏容器未找到');
      return;
    }

    // 检查容器是否在DOM中且可见
    if (!gameRef.current.offsetParent) {
      console.error('错误: 游戏容器不可见或未挂载到DOM');
      setError('游戏容器未正确挂载');
      return;
    }

    if (gameInstanceRef.current) {
      console.log('游戏实例已存在，跳过初始化');
      return;
    }

    console.log('创建Phaser游戏配置');
    console.log('容器尺寸:', gameRef.current.clientWidth, 'x', gameRef.current.clientHeight);

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      title: 'Top-Down Game',
      parent: gameRef.current,
      width: width,
      height: height,
      autoRound: true,
      pixelArt: true,
      scale: {
        autoCenter: Phaser.Scale.CENTER_BOTH,
        mode: Phaser.Scale.FIT,
      },
      scene: [
        BootScene,
        MainMenuScene,
        GameScene,
      ],
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      plugins: {
        scene: [
          {
            key: 'gridEngine',
            plugin: GridEngine,
            mapping: 'gridEngine',
          },
        ],
      },
      backgroundColor: '#000000',
    };

    try {
      console.log('创建Phaser游戏实例');
      gameInstanceRef.current = new Phaser.Game(config);
      console.log('Phaser游戏实例创建成功');
      setIsGameReady(true);
    } catch (error) {
      console.error('游戏初始化失败:', error);
      setError(`游戏初始化失败: ${error}`);
    }
  }, [width, height]);

  // 初始化游戏
  useEffect(() => {
    console.log('TopDownGame useEffect 触发');

    if (typeof window !== 'undefined') {
      console.log('在客户端环境中，等待DOM元素准备就绪');

      // 使用 requestAnimationFrame 确保在下一帧渲染后执行
      let retryCount = 0;
      const maxRetries = 100; // 增加最大重试次数到100次（约5秒）
      let timeoutId: NodeJS.Timeout;

      const checkDOMReady = () => {
        if (gameRef.current && gameRef.current.offsetParent !== null) {
          console.log('DOM元素已准备就绪，开始初始化游戏');
          clearTimeout(timeoutId);
          
          // 额外延迟确保容器完全渲染
          setTimeout(() => {
            if (gameRef.current) {
              initializeGame();
            }
          }, 100);
        } else {
          retryCount++;
          console.log(`DOM元素仍未准备就绪，重试次数: ${retryCount}/${maxRetries}`);

          if (retryCount >= maxRetries) {
            console.error('错误: 达到最大重试次数，DOM元素仍未准备就绪');
            setError('游戏容器初始化超时 游戏容器未找到');
            return;
          }

          // 如果DOM元素还没有准备好，继续等待
          timeoutId = setTimeout(checkDOMReady, 50);
        }
      };

      // 使用 MutationObserver 监听DOM变化
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && gameRef.current) {
            console.log('检测到DOM变化，检查容器状态');
            checkDOMReady();
          }
        });
      });

      // 开始观察DOM变化
      if (gameRef.current?.parentNode) {
        observer.observe(gameRef.current.parentNode, {
          childList: true,
          subtree: true
        });
      }

      // 延迟开始检查
      setTimeout(checkDOMReady, 100);

      return () => {
        console.log('TopDownGame 组件卸载，清理游戏实例');
        clearTimeout(timeoutId);
        observer.disconnect();
        if (gameInstanceRef.current) {
          gameInstanceRef.current.destroy(true);
          gameInstanceRef.current = null;
        }
      };
    } else {
      console.log('不在客户端环境中，跳过游戏初始化');
    }
  }, [initializeGame]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-white text-center">
          <div className="text-xl mb-2">游戏加载失败</div>
          <div className="text-sm text-gray-400">{error}</div>
          <button
            onClick={() => {
              setError(null);
              setIsGameReady(false);
              initializeGame();
            }}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  if (!isGameReady) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-white text-xl">加载游戏中...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* 游戏画布容器 */}
      <div
        ref={gameRef}
        className="w-full h-full"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          margin: 'auto',
          padding: 0,
          overflow: 'hidden',
        }}
      />
    </div>
  );
};