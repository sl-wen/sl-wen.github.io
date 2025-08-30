/**
 * 物品系统
 * 负责管理游戏中的物品、装备、制作、强化和交易
 */

import * as Phaser from 'phaser';

// 物品类型枚举
export enum ItemType {
  WEAPON = 'weapon',
  ARMOR = 'armor',
  HELMET = 'helmet',
  BOOTS = 'boots',
  ACCESSORY = 'accessory',
  CONSUMABLE = 'consumable',
  MATERIAL = 'material',
  QUEST = 'quest',
  KEY = 'key'
}

// 物品稀有度枚举
export enum ItemRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

// 物品效果类型枚举
export enum EffectType {
  HEAL = 'heal',
  MANA = 'mana',
  BUFF = 'buff',
  DEBUFF = 'debuff',
  TELEPORT = 'teleport',
  SUMMON = 'summon',
  CRAFT = 'craft'
}

// 物品接口
export interface Item {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  level: number;
  icon: string;
  sprite?: string;
  stackable: boolean;
  maxStack: number;
  currentStack: number;
  value: number;
  weight: number;
  effects: ItemEffect[];
  requirements: ItemRequirement[];
  craftable: boolean;
  recipe?: string[];
  sellable: boolean;
  tradeable: boolean;
  unique: boolean;
  bound: boolean;
  durability?: number;
  maxDurability?: number;
}

// 物品效果接口
export interface ItemEffect {
  type: EffectType;
  value: number;
  duration?: number;
  target: 'self' | 'target' | 'area';
  range?: number;
  conditions?: string[];
}

// 物品需求接口
export interface ItemRequirement {
  type: 'level' | 'skill' | 'quest' | 'item';
  value: any;
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte';
}

// 物品使用结果接口
export interface ItemUseResult {
  success: boolean;
  message: string;
  effects?: any[];
  consumed: boolean;
  error?: string;
}

// 物品事件接口
export interface ItemEvent {
  type: 'pickup' | 'drop' | 'use' | 'equip' | 'unequip' | 'craft' | 'break';
  item: Item;
  quantity?: number;
  position?: { x: number; y: number };
  target?: any;
}

export class ItemSystem {
  private scene: Phaser.Scene;
  private items: Map<string, Item> = new Map();
  private itemTemplates: Map<string, Item> = new Map();
  private droppedItems: Map<string, { item: Item; sprite: Phaser.GameObjects.Sprite; position: { x: number; y: number } }> = new Map();
  private eventListeners: Map<string, ((event: ItemEvent) => void)[]> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initializeItemTemplates();
  }

  // 初始化物品模板
  private initializeItemTemplates(): void {
    // 武器类
    this.addItemTemplate({
      id: 'sword_basic',
      name: '基础剑',
      description: '一把普通的铁剑',
      type: ItemType.WEAPON,
      rarity: ItemRarity.COMMON,
      level: 1,
      icon: 'sword_icon',
      sprite: 'sword_sprite',
      stackable: false,
      maxStack: 1,
      currentStack: 1,
      value: 50,
      weight: 2,
      effects: [
        { type: EffectType.BUFF, value: 5, target: 'self' }
      ],
      requirements: [
        { type: 'level', value: 1, operator: 'gte' }
      ],
      craftable: true,
      recipe: ['iron_ingot', 'wood'],
      sellable: true,
      tradeable: true,
      unique: false,
      bound: false,
      durability: 100,
      maxDurability: 100
    });

    // 防具类
    this.addItemTemplate({
      id: 'armor_leather',
      name: '皮甲',
      description: '轻便的皮革护甲',
      type: ItemType.ARMOR,
      rarity: ItemRarity.COMMON,
      level: 1,
      icon: 'armor_icon',
      sprite: 'armor_sprite',
      stackable: false,
      maxStack: 1,
      currentStack: 1,
      value: 30,
      weight: 1,
      effects: [
        { type: EffectType.BUFF, value: 3, target: 'self' }
      ],
      requirements: [
        { type: 'level', value: 1, operator: 'gte' }
      ],
      craftable: true,
      recipe: ['leather', 'thread'],
      sellable: true,
      tradeable: true,
      unique: false,
      bound: false,
      durability: 80,
      maxDurability: 80
    });

    // 消耗品类
    this.addItemTemplate({
      id: 'health_potion',
      name: '生命药水',
      description: '恢复50点生命值',
      type: ItemType.CONSUMABLE,
      rarity: ItemRarity.COMMON,
      level: 1,
      icon: 'potion_red',
      sprite: 'potion_red',
      stackable: true,
      maxStack: 99,
      currentStack: 1,
      value: 10,
      weight: 0.1,
      effects: [
        { type: EffectType.HEAL, value: 50, target: 'self' }
      ],
      requirements: [],
      craftable: true,
      recipe: ['herb_red', 'water'],
      sellable: true,
      tradeable: true,
      unique: false,
      bound: false
    });

    // 材料类
    this.addItemTemplate({
      id: 'iron_ingot',
      name: '铁锭',
      description: '锻造用的铁锭',
      type: ItemType.MATERIAL,
      rarity: ItemRarity.COMMON,
      level: 1,
      icon: 'iron_ingot',
      sprite: 'iron_ingot',
      stackable: true,
      maxStack: 999,
      currentStack: 1,
      value: 5,
      weight: 0.5,
      effects: [],
      requirements: [],
      craftable: false,
      sellable: true,
      tradeable: true,
      unique: false,
      bound: false
    });

    // 稀有物品
    this.addItemTemplate({
      id: 'sword_legendary',
      name: '传说之剑',
      description: '传说中的神器',
      type: ItemType.WEAPON,
      rarity: ItemRarity.LEGENDARY,
      level: 50,
      icon: 'sword_legendary',
      sprite: 'sword_legendary',
      stackable: false,
      maxStack: 1,
      currentStack: 1,
      value: 10000,
      weight: 5,
      effects: [
        { type: EffectType.BUFF, value: 50, target: 'self' },
        { type: EffectType.SUMMON, value: 1, target: 'area', range: 100 }
      ],
      requirements: [
        { type: 'level', value: 50, operator: 'gte' },
        { type: 'quest', value: 'legendary_quest', operator: 'eq' }
      ],
      craftable: false,
      sellable: false,
      tradeable: false,
      unique: true,
      bound: true,
      durability: 1000,
      maxDurability: 1000
    });
  }

  // 添加物品模板
  public addItemTemplate(template: Item): void {
    this.itemTemplates.set(template.id, template);
  }

  // 创建物品实例
  public createItem(itemId: string, quantity: number = 1): Item | null {
    const template = this.itemTemplates.get(itemId);
    if (!template) {
      console.error(`Item template not found: ${itemId}`);
      return null;
    }

    const item: Item = {
      ...template,
      currentStack: Math.min(quantity, template.maxStack)
    };

    return item;
  }

  // 掉落物品到地面
  public dropItem(item: Item, position: { x: number; y: number }, quantity: number = 1): string {
    const dropId = `drop_${Date.now()}_${Math.random()}`;
    
    // 创建掉落物品精灵
    const sprite = this.scene.add.sprite(position.x, position.y, item.sprite || item.icon);
    sprite.setDepth(10);
    sprite.setScale(0.5);
    
    // 添加拾取交互
    sprite.setInteractive();
    sprite.on('pointerdown', () => {
      this.pickupItem(dropId);
    });

    // 添加掉落动画
    this.scene.tweens.add({
      targets: sprite,
      y: position.y - 10,
      duration: 500,
      ease: 'Bounce.easeOut'
    });

    // 存储掉落物品信息
    const droppedItem = {
      item: { ...item, currentStack: quantity },
      sprite,
      position
    };

    this.droppedItems.set(dropId, droppedItem);

    // 发送掉落事件
    this.emitEvent('drop', {
      type: 'drop',
      item,
      quantity,
      position
    });

    return dropId;
  }

  // 拾取物品
  public pickupItem(dropId: string): boolean {
    const droppedItem = this.droppedItems.get(dropId);
    if (!droppedItem) {
      return false;
    }

    // 这里应该检查背包空间
    // 暂时直接移除掉落物品
    droppedItem.sprite.destroy();
    this.droppedItems.delete(dropId);

    // 发送拾取事件
    this.emitEvent('pickup', {
      type: 'pickup',
      item: droppedItem.item,
      quantity: droppedItem.item.currentStack,
      position: droppedItem.position
    });

    return true;
  }

  // 使用物品
  public useItem(item: Item, target?: any): ItemUseResult {
    // 检查物品是否可以使用
    if (item.type !== ItemType.CONSUMABLE && item.type !== ItemType.KEY) {
      return {
        success: false,
        message: '此物品无法使用',
        consumed: false,
        error: 'NOT_USABLE'
      };
    }

    // 检查需求
    if (!this.checkRequirements(item.requirements)) {
      return {
        success: false,
        message: '不满足使用条件',
        consumed: false,
        error: 'REQUIREMENTS_NOT_MET'
      };
    }

    // 应用物品效果
    const effects = this.applyItemEffects(item, target);

    // 发送使用事件
    this.emitEvent('use', {
      type: 'use',
      item,
      target
    });

    return {
      success: true,
      message: '物品使用成功',
      effects,
      consumed: true
    };
  }

  // 装备物品
  public equipItem(item: Item, slot: string): boolean {
    if (!this.isEquippable(item)) {
      return false;
    }

    // 检查需求
    if (!this.checkRequirements(item.requirements)) {
      return false;
    }

    // 发送装备事件
    this.emitEvent('equip', {
      type: 'equip',
      item
    });

    return true;
  }

  // 卸下装备
  public unequipItem(item: Item): boolean {
    // 发送卸下事件
    this.emitEvent('unequip', {
      type: 'unequip',
      item
    });

    return true;
  }

  // 检查物品是否可装备
  private isEquippable(item: Item): boolean {
    return [
      ItemType.WEAPON,
      ItemType.ARMOR,
      ItemType.HELMET,
      ItemType.BOOTS,
      ItemType.ACCESSORY
    ].includes(item.type);
  }

  // 检查需求
  private checkRequirements(requirements: ItemRequirement[]): boolean {
    // 这里应该检查玩家的等级、技能、任务等
    // 暂时返回true
    return true;
  }

  // 应用物品效果
  private applyItemEffects(item: Item, target?: any): any[] {
    const effects: any[] = [];

    item.effects.forEach(effect => {
      switch (effect.type) {
        case EffectType.HEAL:
          // 治疗效果
          if (target && target.health !== undefined) {
            const healAmount = Math.min(effect.value, target.maxHealth - target.health);
            target.health += healAmount;
            effects.push({ type: 'heal', amount: healAmount });
          }
          break;

        case EffectType.MANA:
          // 魔法恢复效果
          if (target && target.mana !== undefined) {
            const manaAmount = Math.min(effect.value, target.maxMana - target.mana);
            target.mana += manaAmount;
            effects.push({ type: 'mana', amount: manaAmount });
          }
          break;

        case EffectType.BUFF:
          // 增益效果
          effects.push({ type: 'buff', value: effect.value, duration: effect.duration });
          break;

        case EffectType.DEBUFF:
          // 减益效果
          effects.push({ type: 'debuff', value: effect.value, duration: effect.duration });
          break;

        case EffectType.TELEPORT:
          // 传送效果
          effects.push({ type: 'teleport', target: effect.target });
          break;

        case EffectType.SUMMON:
          // 召唤效果
          effects.push({ type: 'summon', value: effect.value, range: effect.range });
          break;

        case EffectType.CRAFT:
          // 制作效果
          effects.push({ type: 'craft', value: effect.value });
          break;
      }
    });

    return effects;
  }

  // 制作物品
  public craftItem(recipeId: string, materials: Item[]): ItemUseResult {
    const recipe = this.itemTemplates.get(recipeId);
    if (!recipe || !recipe.craftable) {
      return {
        success: false,
        message: '无法制作此物品',
        consumed: false,
        error: 'NOT_CRAFTABLE'
      };
    }

    // 检查材料
    if (!this.checkCraftingMaterials(recipe, materials)) {
      return {
        success: false,
        message: '材料不足',
        consumed: false,
        error: 'INSUFFICIENT_MATERIALS'
      };
    }

    // 创建物品
    const craftedItem = this.createItem(recipeId);
    if (!craftedItem) {
      return {
        success: false,
        message: '制作失败',
        consumed: false,
        error: 'CRAFT_FAILED'
      };
    }

    // 发送制作事件
    this.emitEvent('craft', {
      type: 'craft',
      item: craftedItem
    });

    return {
      success: true,
      message: '制作成功',
      consumed: true
    };
  }

  // 检查制作材料
  private checkCraftingMaterials(recipe: Item, materials: Item[]): boolean {
    if (!recipe.recipe) return true;

    const materialCounts = new Map<string, number>();
    materials.forEach(material => {
      const count = materialCounts.get(material.id) || 0;
      materialCounts.set(material.id, count + material.currentStack);
    });

    for (const requiredMaterial of recipe.recipe) {
      const available = materialCounts.get(requiredMaterial) || 0;
      if (available < 1) {
        return false;
      }
    }

    return true;
  }

  // 获取物品稀有度颜色
  public getRarityColor(rarity: ItemRarity): string {
    const colors = {
      [ItemRarity.COMMON]: '#ffffff',
      [ItemRarity.UNCOMMON]: '#1eff00',
      [ItemRarity.RARE]: '#0070dd',
      [ItemRarity.EPIC]: '#a335ee',
      [ItemRarity.LEGENDARY]: '#ff8000'
    };
    return colors[rarity] || '#ffffff';
  }

  // 获取物品稀有度名称
  public getRarityName(rarity: ItemRarity): string {
    const names = {
      [ItemRarity.COMMON]: '普通',
      [ItemRarity.UNCOMMON]: '优秀',
      [ItemRarity.RARE]: '稀有',
      [ItemRarity.EPIC]: '史诗',
      [ItemRarity.LEGENDARY]: '传说'
    };
    return names[rarity] || '未知';
  }

  // 获取物品类型名称
  public getItemTypeName(type: ItemType): string {
    const names = {
      [ItemType.WEAPON]: '武器',
      [ItemType.ARMOR]: '护甲',
      [ItemType.HELMET]: '头盔',
      [ItemType.BOOTS]: '靴子',
      [ItemType.ACCESSORY]: '饰品',
      [ItemType.CONSUMABLE]: '消耗品',
      [ItemType.MATERIAL]: '材料',
      [ItemType.QUEST]: '任务物品',
      [ItemType.KEY]: '钥匙'
    };
    return names[type] || '未知';
  }

  // 获取物品模板
  public getItemTemplate(itemId: string): Item | undefined {
    return this.itemTemplates.get(itemId);
  }

  // 获取所有物品模板
  public getAllItemTemplates(): Item[] {
    return Array.from(this.itemTemplates.values());
  }

  // 获取掉落物品
  public getDroppedItems(): Map<string, { item: Item; sprite: Phaser.GameObjects.Sprite; position: { x: number; y: number } }> {
    return new Map(this.droppedItems);
  }

  // 事件监听
  public on(event: string, callback: (event: ItemEvent) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  public off(event: string, callback: (event: ItemEvent) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // 发送事件
  private emitEvent(type: string, data: Partial<ItemEvent>): void {
    const event: ItemEvent = {
      type: type as any,
      item: data.item!,
      ...data
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in item event listener:', error);
        }
      });
    }
  }

  // 更新方法
  public update(time: number, delta: number): void {
    // 更新掉落物品的动画效果
    this.droppedItems.forEach((droppedItem, dropId) => {
      // 可以添加漂浮动画等效果
    });
  }

  // 销毁
  public destroy(): void {
    // 清理所有掉落物品
    this.droppedItems.forEach(droppedItem => {
      droppedItem.sprite.destroy();
    });

    // 清理数据
    this.items.clear();
    this.itemTemplates.clear();
    this.droppedItems.clear();
    this.eventListeners.clear();
  }
}