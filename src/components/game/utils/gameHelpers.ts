import Phaser from 'phaser';

// 创建交互式游戏对象
export const createInteractiveGameObject = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  type: string,
  isDebugMode: boolean = false,
  origin: { x: number; y: number } = { x: 0, y: 0 }
): Phaser.GameObjects.Rectangle => {
  const gameObject = scene.add.rectangle(x, y, width, height, 0xff0000, 0);
  gameObject.setOrigin(origin.x, origin.y);
  gameObject.setData('type', type);
  
  if (isDebugMode) {
    gameObject.setFillStyle(0xff0000, 0.3);
  }
  
  return gameObject;
};

// 获取动画帧
export const getFramesForAnimation = (
  textureKey: string,
  animationName: string
): Phaser.Types.Animations.AnimationFrame[] => {
  const frames: Phaser.Types.Animations.AnimationFrame[] = [];
  
  // 根据动画名称生成帧
  switch (animationName) {
    case 'idle':
      for (let i = 1; i <= 4; i++) {
        frames.push({ key: textureKey, frame: `${textureKey}_${animationName}_${i.toString().padStart(2, '0')}` });
      }
      break;
    case 'walking_up':
    case 'walking_down':
    case 'walking_left':
    case 'walking_right':
      for (let i = 1; i <= 4; i++) {
        frames.push({ key: textureKey, frame: `${textureKey}_${animationName}_${i.toString().padStart(2, '0')}` });
      }
      break;
    case 'attack_up':
    case 'attack_down':
    case 'attack_left':
    case 'attack_right':
      for (let i = 1; i <= 4; i++) {
        frames.push({ key: textureKey, frame: `${textureKey}_${animationName}_${i.toString().padStart(2, '0')}` });
      }
      break;
    case 'die':
      for (let i = 1; i <= 4; i++) {
        frames.push({ key: textureKey, frame: `${textureKey}_${animationName}_${i.toString().padStart(2, '0')}` });
      }
      break;
  }
  
  return frames;
};

// 获取停止帧
export const getStopFrame = (direction: string, charId: string): string => {
  return `${charId}_idle_${direction}_01`;
};

// 获取相反方向
export const getOppositeDirection = (direction: string): string => {
  switch (direction) {
    case 'up': return 'down';
    case 'down': return 'up';
    case 'left': return 'right';
    case 'right': return 'left';
    default: return 'down';
  }
};

// 获取后方位置
export const getBackPosition = (facingDirection: string, position: { x: number; y: number }): { x: number; y: number } => {
  switch (facingDirection) {
    case 'up':
      return { x: position.x, y: position.y + 1 };
    case 'down':
      return { x: position.x, y: position.y - 1 };
    case 'left':
      return { x: position.x + 1, y: position.y };
    case 'right':
      return { x: position.x - 1, y: position.y };
    default:
      return position;
  }
};

// 计算推箱子位置
export const calculatePushTilePosition = (heroPosition: { x: number; y: number }, facingDirection: string): { x: number; y: number } => {
  switch (facingDirection) {
    case 'up':
      return { x: heroPosition.x, y: heroPosition.y - 1 };
    case 'down':
      return { x: heroPosition.x, y: heroPosition.y + 1 };
    case 'left':
      return { x: heroPosition.x - 1, y: heroPosition.y };
    case 'right':
      return { x: heroPosition.x + 1, y: heroPosition.y };
    default:
      return heroPosition;
  }
};

// 获取敌人颜色
export const getEnemyColor = (enemyType: string): number => {
  switch (enemyType) {
    case 'slime':
      return 0x00ff00; // 绿色
    case 'goblin':
      return 0xff0000; // 红色
    case 'skeleton':
      return 0xcccccc; // 灰色
    default:
      return 0xffffff; // 白色
  }
};

// 获取敌人攻击速度
export const getEnemyAttackSpeed = (enemyType: string): number => {
  switch (enemyType) {
    case 'slime':
      return 1000;
    case 'goblin':
      return 800;
    case 'skeleton':
      return 1200;
    default:
      return 1000;
  }
};

// 获取敌人种类
export const getEnemySpecies = (enemyType: string): string => {
  switch (enemyType) {
    case 'slime':
      return 'slime';
    case 'goblin':
      return 'goblin';
    case 'skeleton':
      return 'skeleton';
    default:
      return 'slime';
  }
};

// 从Tiled数据中提取NPC数据
export const extractNpcDataFromTiled = (value: string): {
  facingDirection: string;
  movementType: string;
  npcKey: string;
  delay: number;
  area: number;
} => {
  const [npcKey, facingDirection, movementType, delay, area] = value.split(':');
  return {
    facingDirection: facingDirection || 'down',
    movementType: movementType || 'random',
    npcKey: npcKey || 'npc_01',
    delay: parseInt(delay) || 1000,
    area: parseInt(area) || 4
  };
};

// 从Tiled数据中提取传送数据
export const extractTeleportDataFromTiled = (value: string): {
  mapKey: string;
  x: number;
  y: number;
} => {
  const [mapKey, x, y] = value.split(':');
  return {
    mapKey: mapKey || 'main_map',
    x: parseInt(x) || 0,
    y: parseInt(y) || 0
  };
};

// 生成随机位置
export const generateRandomPosition = (minX: number, maxX: number, minY: number, maxY: number): { x: number; y: number } => {
  return {
    x: Math.floor(Math.random() * (maxX - minX + 1)) + minX,
    y: Math.floor(Math.random() * (maxY - minY + 1)) + minY
  };
};

// 检查位置是否有效
export const isValidPosition = (x: number, y: number, mapWidth: number, mapHeight: number): boolean => {
  return x >= 0 && x < mapWidth && y >= 0 && y < mapHeight;
};

// 计算距离
export const calculateDistance = (pos1: { x: number; y: number }, pos2: { x: number; y: number }): number => {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

// 检查是否在范围内
export const isInRange = (pos1: { x: number; y: number }, pos2: { x: number; y: number }, range: number): boolean => {
  return calculateDistance(pos1, pos2) <= range;
};