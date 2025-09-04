/**
 * Topdown 游戏主应用组件
 * 
 * 这是一个基于 Phaser.js 和 React 的俯视角角色扮演游戏
 * 支持键盘和触摸屏操作，包含虚拟摇杆和动作按钮
 * 
 * 主要功能：
 * - 游戏画布渲染
 * - 游戏状态管理
 * - UI 组件集成（对话框、菜单、生命值、金币等）
 * - 输入事件处理
 * - 响应式设计
 * 
 * 使用方法：
 * 1. 启动开发服务器：npm run dev
 * 2. 访问：http://localhost:3000/topdown
 * 3. 使用键盘 WASD/方向键移动角色
 * 4. 使用空格键/动作按钮进行交互
 * 5. 触摸屏用户可使用虚拟摇杆和动作按钮
 */

import { styled } from '@mui/material/styles';
import GridEngine from 'grid-engine';
import * as Phaser from 'phaser';
import { useCallback, useEffect, useRef, useState } from 'react';
import BootScene from './game/scenes/BootScene';
import GameOverScene from './game/scenes/GameOverScene';
import GameScene from './game/scenes/GameScene';
import MainMenuScene from './game/scenes/MainMenuScene';
// Note: dialog_borderbox.png is now served from public/game/assets/images/dialog_borderbox.png
import './App.css';
import ActionButton from "./game/ActionButton";
import DialogBox from "./game/DialogBox";
import GameMenu from "./game/GameMenu";
import HeroCoin from "./game/HeroCoin";
import { calculateGameSize } from "./game/utils";
import VirtualJoystick from "./game/VirtualJoystick";

// 计算游戏尺寸和缩放倍数，确保在不同设备上都有良好的显示效果
const { width, height, multiplier } = calculateGameSize();

/**
 * 游戏内容包装器样式组件
 * 负责游戏画布的显示和定位
 */
const GameContentWrapper = styled('div')(({ theme }) => ({
  width: `${width * multiplier}px`,
  height: `${height * multiplier}px`,
  margin: 'auto',
  padding: 0,
  overflow: 'hidden',
  position: 'relative',
  // 确保游戏画面在容器中居中
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '& canvas': {
    imageRendering: 'pixelated',
    msInterpolationMode: 'nearest-neighbor',
    boxShadow: '0px 0px 0px 3px rgba(0,0,0,0.75)',
    // 确保画布完全填充容器
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
}));

/**
 * 游戏包装器样式组件
 * 设置游戏的整体样式
 */
const GameWrapper = styled('div')(({ theme }) => ({
  color: '#FFFFFF',
}));

/**
 * 游戏对话内容配置
 * 定义了游戏中各种 NPC 和物品的对话内容
 * 
 * 对话格式：
 * - npc_1, npc_2 等：NPC 角色的对话
 * - sword 等：物品或能力的提示信息
 * - sign_1, book_1 等：可读物品的文本
 */
const dialogs = {
  "npc_1": [{
    "message": "你好！",
  }, {
    "message": "你是谁",
  }],
  "npc_2": [{
    "message": "这是哪",
  }],
  "npc_3": [{
    "message": "嗨",
  }, {
    "message": "好的",
  }],
  "npc_4": [{
    "message": "嗨",
  }],
  "sword": [{
    "message": "你获得了一把剑",
  }],
  "sign_1": [{
    "message": "你能够读消息",
  }],
  "book_1": [{
    "message": "欢迎来到我的游戏",
  }]
};

/**
 * 主应用组件
 * 负责游戏的整体管理和状态控制
 */
function App() {
  const gameRef = useRef(null);
  // 游戏状态管理
  const [messages, setMessages] = useState([]);           // 当前显示的对话消息
  const [characterName, setCharacterName] = useState(''); // 当前对话的角色名称
  const [gameMenuItems, setGameMenuItems] = useState([]); // 游戏菜单选项
  const [gameMenuPosition, setGameMenuPosition] = useState('center'); // 菜单显示位置
  const [heroCoins, setHeroCoins] = useState(null);      // 角色金币数量
  const [joystickDirection, setJoystickDirection] = useState(null); // 虚拟摇杆方向
  const [actionContext, setActionContext] = useState('');     // 交互上下文：talk/interact/none

  /**
   * 处理对话完成事件
   * 当玩家完成对话后，发送自定义事件通知游戏引擎
   */
  const handleMessageIsDone = useCallback(() => {
    const customEvent = new CustomEvent(`${characterName}-dialog-finished`, {
      detail: {},
    });
    window.dispatchEvent(customEvent);

    // 清空对话状态
    setMessages([]);
    setCharacterName('');
  }, [characterName]);

  /**
   * 处理菜单项选择事件
   * 当玩家选择菜单选项后，发送自定义事件通知游戏引擎
   */
  const handleMenuItemSelected = useCallback((selectedItem) => {
    setGameMenuItems([]);

    const customEvent = new CustomEvent('menu-item-selected', {
      detail: {
        selectedItem,
      },
    });
    window.dispatchEvent(customEvent);
  }, []);

  /**
   * 处理虚拟摇杆方向变化事件
   * 当玩家操作虚拟摇杆时，更新方向状态并通知游戏引擎
   */
  const handleJoystickDirectionChange = useCallback((dirOrPayload) => {
    // 支持字符串或包含向量信息的对象 { direction, dx, dy, angle }
    const isObject = dirOrPayload && typeof dirOrPayload === 'object';
    const nextDirection = isObject ? dirOrPayload.direction : dirOrPayload;
    setJoystickDirection(nextDirection);

    // 发送虚拟摇杆方向变化事件给游戏（扁平化 payload，便于 InputManager 使用）
    const detail = isObject
      ? { direction: dirOrPayload.direction, dx: dirOrPayload.dx, dy: dirOrPayload.dy, angle: dirOrPayload.angle }
      : { direction: nextDirection };

    const customEvent = new CustomEvent('virtual-joystick-direction', { detail });
    window.dispatchEvent(customEvent);
  }, []);

  /**
   * 处理动作按钮按下事件
   * 当玩家按下动作按钮时，通知游戏引擎执行相应动作
   */
  const handleActionButtonPress = useCallback(() => {
    // 发送动作按钮按下事件给游戏
    const customEvent = new CustomEvent('action-button-pressed', {
      detail: {},
    });
    window.dispatchEvent(customEvent);
  }, []);

  /**
   * 初始化 Phaser 游戏引擎
   * 设置游戏配置、场景、物理引擎和插件
   */
  useEffect(() => {
    if (gameRef.current) {
      try { gameRef.current.destroy(true); } catch (e) { }
      gameRef.current = null;
    }

    if (typeof window !== 'undefined' && window.__phaserGame) {
      try { window.__phaserGame.destroy(true); } catch (e) { }
      window.__phaserGame = null;
    }

    const game = new Phaser.Game({
      type: Phaser.AUTO,                    // 自动选择渲染器（WebGL 或 Canvas）
      title: 'some-game-title',             // 游戏标题
      parent: 'game-content',               // 游戏画布的父容器 ID
      orientation: Phaser.Scale.LANDSCAPE,  // 游戏方向（横屏）
      localStorageName: 'some-game-title',  // 本地存储键名
      width,                                // 游戏宽度
      height,                               // 游戏高度
      autoRound: true,                      // 自动四舍五入像素位置
      pixelArt: true,                       // 像素艺术模式
      scale: {
        autoCenter: Phaser.Scale.CENTER_BOTH, // 自动居中
        mode: Phaser.Scale.FIT,               // 使用 FIT 以避免分裂视图
      },
      scene: [                              // 游戏场景列表
        BootScene,                           // 启动场景
        MainMenuScene,                       // 主菜单场景
        GameScene,                           // 主游戏场景
        GameOverScene,                       // 游戏结束场景
      ],
      physics: {
        default: 'arcade',                   // 物理引擎：街机物理
      },
      plugins: {
        scene: [
          {
            key: 'gridEngine',               // 网格引擎插件
            plugin: GridEngine,              // 插件类
            mapping: 'gridEngine',           // 场景中的映射键
          },
        ],
      },
      backgroundColor: '#000000',            // 背景颜色
    });

    gameRef.current = game;
    if (typeof window !== 'undefined') {
      window.__phaserGame = game;
    }

    return () => {
      try {
        if (gameRef.current) {
          gameRef.current.destroy(true);
          gameRef.current = null;
        }
        if (typeof window !== 'undefined' && window.__phaserGame) {
          window.__phaserGame.destroy(true);
          window.__phaserGame = null;
        }
      } catch (e) { }
    };
  }, []);

  /**
   * 设置游戏事件监听器
   * 监听游戏引擎发送的各种事件，更新 UI 状态
   */
  useEffect(() => {
    // 监听新对话事件
    const dialogBoxEventListener = ({ detail }) => {
      const key = String(detail.characterName);
      setCharacterName(key);
      const nextMessages = dialogs[key] || [{ message: '...' }];
      setMessages(nextMessages);
    };
    window.addEventListener('new-dialog', dialogBoxEventListener);

    // 监听游戏菜单事件
    const gameMenuEventListener = ({ detail }) => {
      setGameMenuItems(detail.menuItems);
      setGameMenuPosition(detail.menuPosition);
    };
    window.addEventListener('menu-items', gameMenuEventListener);

    // 监听角色金币事件
    const heroCoinEventListener = ({ detail }) => {
      const coins = (detail && (detail.heroCoins ?? detail.catCoins)) ?? 0;
      setHeroCoins(coins);
    };
    window.addEventListener('cat-coin', heroCoinEventListener);

    // 监听行动上下文事件（决定右下角按钮图标）
    const actionContextEventListener = ({ detail }) => {
      setActionContext(detail.context);
    };
    window.addEventListener('action-context', actionContextEventListener);

    // 清理事件监听器
    return () => {
      window.removeEventListener('new-dialog', dialogBoxEventListener);
      window.removeEventListener('menu-items', gameMenuEventListener);
      window.removeEventListener('cat-coin', heroCoinEventListener);
      window.removeEventListener('action-context', actionContextEventListener);
    };
  }, [setCharacterName, setMessages]);

  return (
    <div>
      <GameWrapper>
        {/* 游戏画布容器 */}
        <GameContentWrapper
          id="game-content"
        >
          {/* 这里将渲染 Phaser 游戏画布 */}
        </GameContentWrapper>

        {/* 角色金币显示 - 当有金币数据时显示 */}
        {heroCoins !== null && (
          <HeroCoin
            gameSize={{
              width,
              height,
              multiplier,
            }}
            heroCoins={heroCoins}
          />
        )}

        {/* 对话对话框 - 当有对话消息时显示 */}
        {messages.length > 0 && (
          <DialogBox
            onDone={handleMessageIsDone}
            characterName={characterName}
            messages={messages}
            gameSize={{
              width,
              height,
              multiplier,
            }}
            safeBottomOffset={140}
          />
        )}

        {/* 游戏菜单 - 当有菜单选项时显示 */}
        {gameMenuItems.length > 0 && (
          <GameMenu
            items={gameMenuItems}
            gameSize={{
              width,
              height,
              multiplier,
            }}
            position={gameMenuPosition}
            onSelected={handleMenuItemSelected}
          />
        )}

        {/* 虚拟摇杆 - 始终显示在左下角，支持触摸屏操作 */}
        <VirtualJoystick
          onDirectionChange={handleJoystickDirectionChange}
          gameSize={{
            width,
            height,
            multiplier,
          }}
        />

        {/* 动作按钮 - 显示在右下角，用于执行动作 */}
        <ActionButton
          onAction={handleActionButtonPress}
          gameSize={{
            width,
            height,
            multiplier,
          }}
          icon={
            actionContext === 'talk' ? '💬'
            : actionContext === 'interact' ? '🗝️'
            : actionContext === 'plant' ? '🌱'
            : actionContext === 'water' ? '💧'
            : actionContext === 'harvest' ? '🧺'
            : '•'
          }
          label={
            actionContext === 'talk' ? 'Talk'
            : actionContext === 'interact' ? 'Open'
            : actionContext === 'plant' ? 'Plant'
            : actionContext === 'water' ? 'Water'
            : actionContext === 'harvest' ? 'Harvest'
            : ''
          }
        />
      </GameWrapper>
    </div>
  );
}

export default App;
