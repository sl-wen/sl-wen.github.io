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
 * 3. 地图导出（Tiled → JSON）：npm run tmx:json:default（输出到 public/topdown/game/map.json）
 * 4. 资源路径：图片/音频/图集统一从 public/game/assets/ 提供
 * 5. 使用键盘 WASD/方向键移动角色；空格键/动作按钮交互
 * 6. 移动端 UI 门控：仅在“开始游戏”后且设备为移动端时渲染摇杆与动作按钮
 * 7. 自动保存：场景触发 autosave-request 事件，React 侧节流保存；设置弹窗可手动保存
 * 
 * 事件总线（React ↔ Phaser）约定：
 * - new-dialog / <character>-dialog-finished：显示/结束对话
 * - menu-items / menu-item-selected：渲染菜单/选择结果
 * - cat-coin：更新金币；action-context：更新动作语义
 * - virtual-joystick-direction / action-button-pressed：移动/动作输入
 * - inventory-update / open-seed-select / seed-selected / seed-select-cancel：背包/种子流程
 * - request-save-snapshot / save-snapshot-ready / autosave-request：存档与自动保存
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
import { useAuth } from '@/utils/auth-context';
import { supabase } from '@/utils/supabase-config';
import './App.css';
import ActionButton from "./game/ActionButton";
import CatCoin from "./game/CatCoin";
import DialogBox from "./game/DialogBox";
import GameMenu from "./game/GameMenu";
import HUDBar from "./game/HUDBar";
import InventoryModal from "./game/InventoryModal";
import Quickbar from "./game/Quickbar";
import RadialMenu from "./game/RadialMenu";
import SettingsModal from "./game/SettingsModal";
import TimeControlPanel from "./game/TimeControlPanel";
import { calculateGameSize } from "./game/utils";
import VirtualJoystick from "./game/VirtualJoystick";

// 默认游戏尺寸，将在组件内部重新计算
const defaultGameSize = { width: 400, height: 300, multiplier: 1, isMobile: false };

/**
 * 游戏内容包装器样式组件
 * 负责游戏画布的显示和定位
 */
const GameContentWrapper = styled('div')(({ theme, gameWidth, gameHeight }) => ({
  width: '100vw',
  height: '100vh',
  margin: 'auto',
  padding: 0,
  overflow: 'hidden',
  position: 'relative',
  // 确保游戏画面在容器中居中
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  // 让容器能够更好地利用空间
  maxWidth: '100vw',
  maxHeight: '100vh',
  '& canvas': {
    imageRendering: 'pixelated',
    msInterpolationMode: 'nearest-neighbor',
    boxShadow: '0px 0px 0px 3px rgba(0,0,0,0.75)',
    // 确保画布完全填充容器
    width: '100% !important',
    height: '100% !important',
    objectFit: 'fill',
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
  const { userProfile, refreshProfile } = useAuth();

  // 在客户端动态计算游戏尺寸
  const [gameSize, setGameSize] = useState(defaultGameSize);

  useEffect(() => {
    // 确保在客户端计算游戏尺寸
    if (typeof window !== 'undefined') {
      const size = calculateGameSize();
      setGameSize(size);

      // 调试信息
      console.log(`设备类型: ${size.isMobile ? '手机' : 'PC'}`);
      console.log(`游戏尺寸: ${size.width}x${size.height}, 缩放倍数: ${size.multiplier}`);
      console.log(`屏幕尺寸: ${window.innerWidth}x${window.innerHeight}`);
    }

    // 添加窗口大小变化监听器
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        const newSize = calculateGameSize();
        setGameSize(newSize);

        // 只调整游戏画布大小，不重新创建游戏
        if (gameRef.current && gameRef.current.scale) {
          gameRef.current.scale.resize(newSize.width, newSize.height);
        }
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  // 游戏状态管理
  const [messages, setMessages] = useState([]);           // 当前显示的对话消息
  const [characterName, setCharacterName] = useState(''); // 当前对话的角色名称
  const [gameMenuItems, setGameMenuItems] = useState([]); // 游戏菜单选项
  const [gameMenuPosition, setGameMenuPosition] = useState('center'); // 菜单显示位置
  const [catCoins, setcatCoins] = useState(null);      // 角色金币数量
  const [joystickDirection, setJoystickDirection] = useState(null); // 虚拟摇杆方向
  const [actionContext, setActionContext] = useState('');     // 交互上下文：talk/interact/none
  const [hasGameStarted, setHasGameStarted] = useState(false); // 是否已点击开始进入游戏
  const [inventory, setInventory] = useState({ tags: { seeds: { items: { 'huluobo-0': { id: 'huluobo-0', name: '胡萝卜种子', count: 0 }, 'bailuobo-0': { id: 'bailuobo-0', name: '白萝卜种子', count: 0 } } }, misc: { items: { water: { id: 'water', name: '水', count: 0 } } }, fruits: { items: { 'huluobo-5': { id: 'huluobo-5', name: '胡萝卜', count: 0 }, 'bailuobo-5': { id: 'bailuobo-5', name: '白萝卜', count: 0 } } } } });
  const [showInventory, setShowInventory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [inventorySelectMode, setInventorySelectMode] = useState(false);
  const [timeText, setTimeText] = useState('--:--');
  const [weatherIcon, setWeatherIcon] = useState('☀');
  const [preferredSeedId, setPreferredSeedId] = useState(null);
  const [showSeedRadial, setShowSeedRadial] = useState(false);
  const [timeInfo, setTimeInfo] = useState({});
  const [showTimePanel, setShowTimePanel] = useState(false);

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

    // 当玩家点击开始时，显示金币、摇杆与动作按钮
    if (selectedItem === 'start') {
      setHasGameStarted(true);
    } else if (selectedItem === 'exit') {
      setHasGameStarted(false);
    }
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
    // 只在组件首次挂载时创建游戏，不依赖 gameSize
    if (gameRef.current) {
      return; // 游戏已存在，不重新创建
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
      antialias: false,                     // 禁用抗锯齿，保证像素清晰
      roundPixels: true,                    // 渲染取整，避免亚像素抖动
      width: gameSize.width,                // 游戏宽度
      height: gameSize.height,              // 游戏高度
      autoRound: true,                      // 自动四舍五入像素位置
      pixelArt: true,                       // 像素艺术模式
      scale: {
        autoCenter: Phaser.Scale.CENTER_BOTH, // 自动居中
        mode: Phaser.Scale.RESIZE, // 使用RESIZE模式让游戏完全填充容器
      },
      scene: [                              // 游戏场景列表
        BootScene,                           // 启动场景
        MainMenuScene,                       // 主菜单场景
        GameScene,                           // 主游戏场景
        GameOverScene,                       // 游戏结束场景
      ],
      physics: {
        default: 'arcade',                   // 物理引擎：街机物理
        arcade: {
          debug: false,                       // 启用物理调试模式
        },
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
  }, []); // 移除 gameSize 依赖，只在组件挂载时创建一次

  /**
   * 设置游戏事件监听器
   * 监听游戏引擎发送的各种事件，更新 UI 状态
   */
  useEffect(() => {
    // 监听新对话事件
    const dialogBoxEventListener = ({ detail }) => {
      const rawKey = detail.characterName;
      setCharacterName(rawKey);
      const normalizedKey = String(rawKey || '').trim();
      const nextMessages = dialogs[normalizedKey] || [{ message: '...' }];
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
    const catCoinEventListener = ({ detail }) => {
      setcatCoins(detail.catCoins);
    };
    window.addEventListener('cat-coin', catCoinEventListener);

    // 监听行动上下文事件（决定右下角按钮图标）
    const actionContextEventListener = ({ detail }) => {
      setActionContext(detail.context);
    };
    window.addEventListener('action-context', actionContextEventListener);

    // 背包更新
    const inventoryListener = ({ detail }) => {
      const inv = detail.inventory;
      if (!inv || inv.tags === undefined) {
        // 兼容旧版
        setInventory({
          tags: {
            seeds: { items: { 'huluobo-0': { id: 'huluobo-0', name: '胡萝卜种子', count: inv?.seeds ?? 0 }, 'bailuobo-0': { id: 'bailuobo-0', name: '白萝卜种子', count: 0 } } },
            misc: { items: { water: { id: 'water', name: '水', count: inv?.water ?? 0 } } },
            fruits: { items: { 'huluobo-5': { id: 'huluobo-5', name: '胡萝卜', count: inv?.fruits ?? 0 }, 'bailuobo-5': { id: 'bailuobo-5', name: '白萝卜', count: 0 } } },
          },
        });
      } else {
        setInventory(inv);
      }
    };
    window.addEventListener('inventory-update', inventoryListener);

    // 监听打开种子选择流程
    const openSeedSelectListener = () => {
      setInventorySelectMode(true);
      setShowInventory(true);
    };
    window.addEventListener('open-seed-select', openSeedSelectListener);

    // 时间与天气
    const timeWeatherListener = ({ detail }) => {
      const t = detail?.time || '--:--';
      const w = (detail?.weather === 'rain') ? '🌧'
        : (detail?.weather === 'wind') ? '🍃'
          : (detail?.weather === 'snow') ? '❄'
            : '☀';
      setTimeText(t);
      setWeatherIcon(w);
      setTimeInfo(detail || {});
    };
    window.addEventListener('time-weather', timeWeatherListener);

    // 清理事件监听器
    return () => {
      window.removeEventListener('new-dialog', dialogBoxEventListener);
      window.removeEventListener('menu-items', gameMenuEventListener);
      window.removeEventListener('cat-coin', catCoinEventListener);
      window.removeEventListener('action-context', actionContextEventListener);
      window.removeEventListener('inventory-update', inventoryListener);
      window.removeEventListener('open-seed-select', openSeedSelectListener);
      window.removeEventListener('time-weather', timeWeatherListener);
    };
  }, [setCharacterName, setMessages]);

  // 处理时间倍率变化
  const handleTimeSpeedChange = useCallback((speed) => {
    try {
      const evt = new CustomEvent('time-speed-change', { detail: { speed } });
      window.dispatchEvent(evt);
    } catch (e) {
      console.error('Failed to dispatch time speed change event:', e);
    }
  }, []);

  const handleSeedSelected = (seedId) => {
    try {
      const evt = new CustomEvent('seed-selected', { detail: { seedId } });
      window.dispatchEvent(evt);
    } catch (e) { }
    setShowInventory(false);
    setInventorySelectMode(false);
    setPreferredSeedId(seedId || null);
  };

  const requestSaveSnapshot = () => {
    return new Promise((resolve) => {
      const handler = ({ detail }) => {
        window.removeEventListener('save-snapshot-ready', handler);
        resolve(detail);
      };
      window.addEventListener('save-snapshot-ready', handler);
      const evt = new CustomEvent('request-save-snapshot');
      window.dispatchEvent(evt);
    });
  };

  // 将任意对象安全转为可序列化 JSON（移除函数/undefined/Infinity，处理 Map/Set）
  const sanitizeForJson = useCallback((input) => {
    try {
      const cache = new WeakSet();
      const result = JSON.parse(
        JSON.stringify(
          input,
          (key, value) => {
            if (typeof value === 'function' || typeof value === 'symbol') return undefined;
            if (typeof value === 'number' && (!Number.isFinite(value) || Number.isNaN(value))) return null;
            if (value && typeof value === 'object') {
              if (cache.has(value)) return undefined; // 断开循环引用
              cache.add(value);
              if (value instanceof Map) return Object.fromEntries(value);
              if (value instanceof Set) return Array.from(value);
            }
            return value;
          }
        )
      );
      return result;
    } catch (_) {
      return null;
    }
  }, []);

  // 统一保存逻辑（支持手动与自动保存）
  const lastAutosaveRef = useRef(0);
  const savingRef = useRef(false);
  const saveSnapshotToProfile = useCallback(async (opts = { silent: false }) => {
    if (savingRef.current) return; // 防重入
    try {
      savingRef.current = true;
      const rawSnapshot = await requestSaveSnapshot();
      const snapshot = sanitizeForJson(rawSnapshot) ?? {};
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const derivedUsername =
          (user.user_metadata && (user.user_metadata.user_name || user.user_metadata.preferred_username)) ||
          (user.email ? user.email.split('@')[0] : null) ||
          `player_${String(user.id).slice(0, 8)}`;

        // 使用 upsert 基于 user_id 冲突更新 farmdata，保证幂等
        // 若后端列有约束要求为 JSON 数组，则将对象包裹为数组
        const farmdataPayload = Array.isArray(snapshot) ? snapshot : [snapshot];

        const { data: upserted, error: upsertError } = await supabase
          .from('profiles')
          .upsert(
            [{ user_id: user.id, username: derivedUsername, farmdata: farmdataPayload }],
            { onConflict: 'user_id' }
          )
          .select('user_id, farmdata');
        if (upsertError) throw upsertError;
        console.log('Supabase upsert OK:', upserted?.length ? upserted[0] : upserted);
        const local = JSON.parse(localStorage.getItem('userProfile') || '{}');
        local.farmdata = snapshot;
        localStorage.setItem('userProfile', JSON.stringify(local));
        await refreshProfile();
      } else {
        const local = JSON.parse(localStorage.getItem('userProfile') || '{}');
        local.farmdata = snapshot;
        localStorage.setItem('userProfile', JSON.stringify(local));
        console.warn('未登录：已仅保存到 localStorage，不会写入 Supabase');
      }
      if (!opts.silent) setShowSettings(false);
    } catch (e) {
      console.error(opts.silent ? '自动保存失败' : '保存失败', e);
    } finally {
      savingRef.current = false;
    }
  }, [refreshProfile]);

  const handleSave = async () => {
    await saveSnapshotToProfile({ silent: false });
  };

  // 监听自动保存请求（由 GameScene 发起）并节流
  useEffect(() => {
    const handler = async () => {
      const now = Date.now();
      if (now - lastAutosaveRef.current < 1500) return; // 1.5s 节流
      lastAutosaveRef.current = now;
      await saveSnapshotToProfile({ silent: true });
    };
    window.addEventListener('autosave-request', handler);
    return () => window.removeEventListener('autosave-request', handler);
  }, [saveSnapshotToProfile]);

  return (
    <div>
      <GameWrapper>
        {/* 游戏画布容器 */}
        <GameContentWrapper
          id="game-content"
          gameWidth={gameSize.width}
          gameHeight={gameSize.height}
        >
          {/* 这里将渲染 Phaser 游戏画布 */}
        </GameContentWrapper>

        {/* HUD 顶栏：头像+设置（PC端始终显示；移动端在开始后显示）*/}
        {((!gameSize.isMobile) || hasGameStarted) && (
          <HUDBar
            gameSize={{ width: gameSize.width, height: gameSize.height, multiplier: gameSize.multiplier }}
            avatarUrl={userProfile?.avatar_url}
            onAvatarClick={() => setShowInventory(true)}
            onSettingsClick={() => setShowSettings(true)}
            onTimeClick={() => setShowTimePanel(!showTimePanel)}
            timeText={timeText}
            weatherIcon={weatherIcon}
          />
        )}

        {/* 角色金币显示 - 当有金币数据时显示 */}
        {hasGameStarted && catCoins !== null && (
          <CatCoin
            gameSize={{
              width: gameSize.width,
              height: gameSize.height,
              multiplier: gameSize.multiplier,
            }}
            catCoins={catCoins}
          />
        )}

        {/* 对话对话框 - 当有对话消息时显示 */}
        {messages.length > 0 && (
          <DialogBox
            onDone={handleMessageIsDone}
            characterName={characterName}
            messages={messages}
            gameSize={{
              width: gameSize.width,
              height: gameSize.height,
              multiplier: gameSize.multiplier,
            }}
            safeBottomOffset={140}
          />
        )}

        {/* 游戏菜单 - 当有菜单选项时显示 */}
        {gameMenuItems.length > 0 && (
          <GameMenu
            items={gameMenuItems}
            gameSize={{
              width: gameSize.width,
              height: gameSize.height,
              multiplier: gameSize.multiplier,
            }}
            position={gameMenuPosition}
            onSelected={handleMenuItemSelected}
          />
        )}

        {/* 虚拟摇杆 - 仅在移动端且点击开始后显示 */}
        {hasGameStarted && gameSize.isMobile && (
          <VirtualJoystick
            onDirectionChange={handleJoystickDirectionChange}
            gameSize={{
              width: gameSize.width,
              height: gameSize.height,
              multiplier: gameSize.multiplier,
            }}
          />
        )}

        {/* 动作按钮 - 仅在移动端且点击开始后显示 */}
        {hasGameStarted && gameSize.isMobile && (
          <ActionButton
            onAction={handleActionButtonPress}
            gameSize={{
              width: gameSize.width,
              height: gameSize.height,
              multiplier: gameSize.multiplier,
            }}
            icon={
              actionContext === 'talk' ? '💬'
                : actionContext === 'interact' ? '❗'
                  : actionContext === 'plant' ? '🌱'
                    : actionContext === 'water' ? '💧'
                      : actionContext === 'harvest' ? '🧺'
                        : actionContext === 'refill' ? '🚰'
                        : '•'
            }
            label={
              actionContext === 'talk' ? 'Talk'
                : actionContext === 'interact' ? 'Open'
                  : actionContext === 'plant' ? 'Plant'
                    : actionContext === 'water' ? 'Water'
                      : actionContext === 'harvest' ? 'Harvest'
                        : actionContext === 'refill' ? 'Refill'
                        : ''
            }
          />
        )}

        {/* 背包弹窗 */}
        {hasGameStarted && showInventory && (
          <InventoryModal
            gameSize={{ width: gameSize.width, height: gameSize.height, multiplier: gameSize.multiplier }}
            inventory={inventory}
            selectMode={inventorySelectMode}
            selectTag={'seeds'}
            onSelect={handleSeedSelected}
            onClose={() => {
              if (inventorySelectMode) {
                try {
                  const evt = new CustomEvent('seed-select-cancel');
                  window.dispatchEvent(evt);
                } catch (e) { }
                setInventorySelectMode(false);
              }
              setShowInventory(false);
            }}
          />
        )}

        {/* 快捷栏（工具/种子） */}
        {hasGameStarted && (
          <Quickbar
            gameSize={{ width: gameSize.width, height: gameSize.height, multiplier: gameSize.multiplier }}
            seedSummary={{ total: (inventory?.tags?.seeds ? Object.values(inventory.tags.seeds.items).reduce((s, it) => s + (it?.count || 0), 0) : 0) }}
            selectedSeedId={preferredSeedId}
            onOpenSeedMenu={() => setShowSeedRadial(true)}
            onSelectWater={() => {
              try {
                const evt = new CustomEvent('preferred-tool', { detail: { tool: 'water' } });
                window.dispatchEvent(evt);
              } catch (e) { }
            }}
          />
        )}

        {/* 径向菜单：快速选择种子 */}
        {hasGameStarted && showSeedRadial && (
          <RadialMenu
            gameSize={{ width: gameSize.width, height: gameSize.height, multiplier: gameSize.multiplier }}
            items={Object.values(inventory?.tags?.seeds?.items || {}).map(it => ({ id: it.id, label: it.name, count: it.count }))}
            selectedId={preferredSeedId}
            onSelect={(id) => {
              setPreferredSeedId(id);
              setShowSeedRadial(false);
              try {
                const evt = new CustomEvent('preferred-seed', { detail: { seedId: id } });
                window.dispatchEvent(evt);
              } catch (e) { }
            }}
            onClose={() => setShowSeedRadial(false)}
          />
        )}

        {/* 时间控制面板 */}
        {hasGameStarted && (
          <TimeControlPanel
            gameSize={{ width: gameSize.width, height: gameSize.height, multiplier: gameSize.multiplier }}
            timeInfo={timeInfo}
            onSpeedChange={handleTimeSpeedChange}
            visible={showTimePanel}
            position="top-right"
          />
        )}

        {/* 设置弹窗 */}
        {hasGameStarted && showSettings && (
          <SettingsModal
            gameSize={{ width: gameSize.width, height: gameSize.height, multiplier: gameSize.multiplier }}
            onSave={handleSave}
            onExit={() => window.location.reload()}
            onClose={() => setShowSettings(false)}
          />
        )}
      </GameWrapper>
    </div>
  );
}

export default App;
