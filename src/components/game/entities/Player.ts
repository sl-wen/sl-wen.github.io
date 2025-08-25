import * as Phaser from 'phaser';
import { CatStats, InventoryItem, ToolType } from '../types/GameTypes';

/**
 * 小猫玩家类
 * 继承自Phaser物理精灵，实现可控制的农场小猫角色
 * 包含移动、交互、属性管理等功能
 */
export class Cat extends Phaser.Physics.Arcade.Sprite {
  private direction: string = 'down';           // 小猫当前朝向（up, down, left, right）
  private stats: CatStats;                      // 小猫的属性数值（血量、体力、快乐值等）
  private currentTool: ToolType | null = null;  // 当前选中的工具
  private inventory: InventoryItem[] = [];      // 背包物品列表
  public isActing: boolean = false;             // 是否正在执行动作（防止动作重叠）

  /**
 * 构造函数
 * 创建小猫实例并初始化所有属性
 * @param scene 游戏场景
 * @param x 初始X坐标
 * @param y 初始Y坐标
 */
  constructor(scene: Phaser.Scene, x: number, y: number) {
    // 确定使用的纹理 - 使用cat_idle作为默认纹理
    let textureKey = 'cat_idle';

    // 检查纹理是否存在，如果不存在则创建fallback
    if (!scene.textures.exists('cat_idle')) {
      console.warn('cat_idle texture not found, creating fallback');
      // 创建一个简单的fallback纹理（橙色方块，代表小猫）
      scene.add.graphics()
        .fillStyle(0xffa500) // 橙色
        .fillRect(0, 0, 32, 32)
        .generateTexture('cat_fallback', 32, 32)
        .destroy();

      textureKey = 'cat_fallback';
    }

    // 调用父类构造函数
    super(scene, x, y, textureKey, 0);

    // 初始化小猫属性数值
    this.stats = {
      health: 100, // 当前健康值
      maxHealth: 100, // 最大健康值
      energy: 100, // 当前体力值
      maxEnergy: 100, // 最大体力值
      level: 1, // 角色等级
      experience: 0, // 当前经验值
      happiness: 100, // 当前快乐值
      maxHappiness: 100 // 最大快乐值
    };

    // 将小猫添加到游戏场景中
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 设置物理属性
    this.setCollideWorldBounds(true); // 限制在游戏世界边界内
    this.setSize(24, 24); // 设置碰撞体积大小
    this.setOffset(4, 8); // 设置碰撞体积偏移，使其与精灵图像对齐

    // 设置初始显示属性
    this.setDepth(10); // 设置渲染层级，确保小猫在其他对象之上

    // 创建小猫的各种动画
    try {
      this.createAnimations();
      console.log('Cat animations created successfully');

      // 开始播放默认的静止动画
      if (this.anims.exists('cat_idle_down')) {
        this.play('cat_idle_down');
        console.log('Cat idle animation started');
      } else {
        console.warn('cat_idle_down animation not found');
      }
    } catch (error) {
      console.error('Failed to create cat animations:', error);
      // 使用静态纹理作为fallback
      if (this.scene.textures.exists('cat')) {
        this.setTexture('cat');
      } else {
        console.warn('cat texture not found, using default');
      }
    }

    // 初始化背包，给小猫一些基础工具
    this.initializeInventory();
  }

  // 初始化背包物品 - 给小猫配备基础的农场工具和种子
  private initializeInventory() {
    this.inventory = [
      {
        id: 'watering_can',
        name: '水壶',
        type: 'tool',
        quantity: 1,
        icon: 'watering_can',
        description: '给作物浇水的工具'
      },
      {
        id: 'hoe',
        name: '锄头',
        type: 'tool',
        quantity: 1,
        icon: 'hoe',
        description: '用来耕地的工具'
      },
      {
        id: 'carrot_seeds',
        name: '胡萝卜种子',
        type: 'seed',
        quantity: 10,
        icon: 'carrot_seeds',
        description: '可以种植胡萝卜的种子'
      },
      {
        id: 'tomato_seeds',
        name: '番茄种子',
        type: 'seed',
        quantity: 5,
        icon: 'tomato_seeds',
        description: '可以种植番茄的种子'
      }
    ];
  }

  // 创建小猫的所有动画 - 包括行走、静止和动作动画
  private createAnimations() {
    const anims = this.scene.anims;

    // 检查纹理是否存在
    if (!this.scene.textures.exists('cat_walk')) {
      console.warn('cat_walk texture not found, skipping animations');
      return;
    }

    // 各个方向的行走动画
    // 向下行走动画
    if (!anims.exists('cat_walk_down')) {
      anims.create({
        key: 'cat_walk_down',
        frames: anims.generateFrameNumbers('cat_walk', { start: 0, end: Math.min(1, 3) }),
        frameRate: 8, // 动画帧率
        repeat: -1 // 无限循环
      });
    }

    // 向左行走动画
    if (!anims.exists('cat_walk_left')) {
      anims.create({
        key: 'cat_walk_left',
        frames: anims.generateFrameNumbers('cat_walk', { start: 0, end: Math.min(1, 3) }),
        frameRate: 8,
        repeat: -1
      });
    }

    // 向右行走动画
    if (!anims.exists('cat_walk_right')) {
      anims.create({
        key: 'cat_walk_right',
        frames: anims.generateFrameNumbers('cat_walk', { start: 0, end: Math.min(1, 3) }),
        frameRate: 8,
        repeat: -1
      });
    }

    // 向上行走动画
    if (!anims.exists('cat_walk_up')) {
      anims.create({
        key: 'cat_walk_up',
        frames: anims.generateFrameNumbers('cat_walk', { start: 0, end: Math.min(1, 3) }),
        frameRate: 8,
        repeat: -1
      });
    }

    // 各个方向的静止动画（使用第一帧作为静止状态）
    if (!anims.exists('cat_idle_down')) {
      anims.create({
        key: 'cat_idle_down',
        frames: [{ key: 'cat_walk', frame: 0 }],
        frameRate: 1
      });
    }

    if (!anims.exists('cat_idle_left')) {
      anims.create({
        key: 'cat_idle_left',
        frames: [{ key: 'cat_walk', frame: 0 }],
        frameRate: 1
      });
    }

    if (!anims.exists('cat_idle_right')) {
      anims.create({
        key: 'cat_idle_right',
        frames: [{ key: 'cat_walk', frame: 0 }],
        frameRate: 1
      });
    }

    if (!anims.exists('cat_idle_up')) {
      anims.create({
        key: 'cat_idle_up',
        frames: [{ key: 'cat_walk', frame: 0 }],
        frameRate: 1
      });
    }

    // 农场动作动画
    anims.create({
      key: 'cat_digging',
      frames: anims.generateFrameNumbers('cat_actions', { start: 0, end: Math.min(1, 3) }),
      frameRate: 6,
      repeat: 2 // 重复2次
    });

    anims.create({
      key: 'cat_watering',
      frames: anims.generateFrameNumbers('cat_actions', { start: 0, end: Math.min(1, 3) }),
      frameRate: 6,
      repeat: 2
    });

    anims.create({
      key: 'cat_harvesting',
      frames: anims.generateFrameNumbers('cat_actions', { start: 0, end: Math.min(1, 3) }),
      frameRate: 6,
      repeat: 1 // 收获动作只重复1次
    });
  }

  // 设置小猫朝向并播放相应动画
  public setDirection(direction: string) {
    this.direction = direction;

    // 根据速度判断小猫是否在移动
    const isMoving = Math.abs(this.body!.velocity.x) > 10 || Math.abs(this.body!.velocity.y) > 10;

    if (this.isActing) {
      return; // 正在执行动作时不改变动画
    }

    // 根据移动状态播放相应动画
    if (isMoving) {
      this.play(`cat_walk_${direction}`, true);
    } else {
      this.play(`cat_idle_${direction}`, true);
    }
  }

  // 移动小猫 - 改进的移动系统，增加Joy感和响应性
  public move(x: number, y: number) {
    if (this.isActing) return; // 执行动作时无法移动

    // 标准化输入向量以防止对角线移动过快
    const inputMagnitude = Math.sqrt(x * x + y * y);
    if (inputMagnitude > 0) {
      x = x / inputMagnitude;
      y = y / inputMagnitude;
    }

    // 动态速度系统 - 增加加速度感
    const baseSpeed = 140; // 提高基础速度
    const inputStrength = Math.min(inputMagnitude, 1);
    
    // 使用缓动函数增加速度响应感
    const easedInput = this.easeInOutQuad(inputStrength);
    const adjustedSpeed = baseSpeed * (0.3 + 0.7 * easedInput); // 最低30%速度，最高100%

    // 添加微小的随机抖动，增加自然感
    const jitterX = (Math.random() - 0.5) * 0.02 * inputStrength;
    const jitterY = (Math.random() - 0.5) * 0.02 * inputStrength;

    // 设置速度，使用标准化的方向向量和抖动
    this.setVelocity(
      (x + jitterX) * adjustedSpeed, 
      (y + jitterY) * adjustedSpeed
    );

    // 更新朝向和动画
    this.updateDirectionAndAnimation(x, y, inputStrength);

    // 增强的移动效果
    if (inputStrength > 0.3) {
      this.createMovementParticles();
    }

    // 添加移动音效（概率性）
    if (inputStrength > 0.5 && Math.random() < 0.1) {
      this.playMovementSound();
    }
  }

  // 缓动函数 - 增加输入响应的平滑感
  private easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  // 播放移动音效
  private playMovementSound() {
    // 这里可以添加脚步声或其他移动音效
    // 暂时使用控制台输出作为占位符
    if (Math.random() < 0.05) { // 降低频率避免控制台污染
      console.log('🐾 Cat step sound');
    }
  }

  // 更新朝向和播放相应动画
  private updateDirectionAndAnimation(x: number, y: number, inputStrength: number) {
    // 只在有明显移动时更新朝向
    if (inputStrength > 0.1) {
      // 根据移动方向确定朝向（优先考虑水平方向）
      if (Math.abs(x) > Math.abs(y)) {
        this.setDirection(x > 0 ? 'right' : 'left');
      } else if (y !== 0) {
        this.setDirection(y > 0 ? 'down' : 'up');
      }

      // 播放行走动画
      const walkAnimKey = `cat_walk_${this.direction}`;
      if (this.scene.anims.exists(walkAnimKey) && !this.anims.isPlaying) {
        this.play(walkAnimKey, true);
      }
    }
  }

  // 停止移动 - 改进的停止系统，增加惯性和缓动效果
  public stop(): this {
    // 使用惯性停止而非立即停止
    this.smoothStop(0.85);
    return this;
  }

  // 平滑停止移动（用于更自然的移动感觉）
  public smoothStop(deceleration: number = 0.85): this {
    const currentVelocity = this.body as Phaser.Physics.Arcade.Body;
    if (currentVelocity) {
      const currentSpeedX = currentVelocity.velocity.x;
      const currentSpeedY = currentVelocity.velocity.y;
      
      // 应用减速
      currentVelocity.setVelocity(
        currentSpeedX * deceleration,
        currentSpeedY * deceleration
      );
      
      // 如果速度很小就完全停止
      if (Math.abs(currentSpeedX) < 8 && Math.abs(currentSpeedY) < 8) {
        currentVelocity.setVelocity(0, 0);
        
        // 播放静止动画（如果不在执行动作）
        if (!this.isActing) {
          const idleAnimKey = `cat_idle_${this.direction}`;
          if (this.scene.anims.exists(idleAnimKey)) {
            this.play(idleAnimKey, true);
          }
        }
      }
    }
    return this;
  }

  // 立即停止（紧急情况使用）
  public hardStop(): this {
    this.setVelocity(0, 0);
    
    // 播放静止动画（如果不在执行动作）
    if (!this.isActing) {
      const idleAnimKey = `cat_idle_${this.direction}`;
      if (this.scene.anims.exists(idleAnimKey)) {
        this.play(idleAnimKey, true);
      }
    }
    return this;
  }

  // 执行农场动作 - 挖掘、浇水、收获
  public performAction(action: 'dig' | 'water' | 'harvest') {
    if (this.isActing) return false; // 已在执行动作时返回失败

    this.isActing = true;
    this.setVelocity(0, 0); // 停止移动

    let animationKey: string;
    let duration: number;

    // 根据动作类型设置动画和消耗
    switch (action) {
      case 'dig':
        animationKey = 'cat_digging';
        duration = 1000; // 挖掘持续1秒
        this.consumeEnergy(5); // 消耗5点体力
        break;
      case 'water':
        animationKey = 'cat_watering';
        duration = 800; // 浇水持续0.8秒
        this.consumeEnergy(3); // 消耗3点体力
        break;
      case 'harvest':
        animationKey = 'cat_harvesting';
        duration = 600; // 收获持续0.6秒
        this.consumeEnergy(2); // 消耗2点体力
        this.gainHappiness(5); // 收获增加5点快乐值
        break;
    }

    this.play(animationKey);

    // 添加动作特效
    this.createInteractionEffect();

    // 动作完成后返回静止状态
    this.scene.time.delayedCall(duration, () => {
      this.isActing = false;
      this.play(`cat_idle_${this.direction}`);
    });

    return true; // 返回成功
  }

  // 消耗体力 - 执行动作时减少体力值
  public consumeEnergy(amount: number) {
    this.stats.energy = Math.max(0, this.stats.energy - amount);
    if (this.stats.energy === 0) {
      this.scene.events.emit('cat-tired'); // 体力耗尽时发出事件
    }
  }

  // 恢复体力 - 休息或食用食物时增加体力
  public restoreEnergy(amount: number) {
    this.stats.energy = Math.min(this.stats.maxEnergy, this.stats.energy + amount);
  }

  // 增加快乐值 - 成功完成农场活动时增加
  public gainHappiness(amount: number) {
    this.stats.happiness = Math.min(this.stats.maxHappiness, this.stats.happiness + amount);
  }

  // 减少快乐值 - 体力不足或其他负面情况时减少
  public loseHappiness(amount: number) {
    this.stats.happiness = Math.max(0, this.stats.happiness - amount);
  }

  // 获得经验值 - 完成各种农场活动时增加
  public gainExperience(amount: number) {
    this.stats.experience += amount;
    const expForNextLevel = this.stats.level * 100; // 升级所需经验 = 等级 × 100

    if (this.stats.experience >= expForNextLevel) {
      this.levelUp(); // 经验足够时升级
    }
  }

  // 升级处理 - 提升等级并增加各项属性上限
  private levelUp() {
    this.stats.level++;
    this.stats.experience = 0; // 重置经验值
    this.stats.maxHealth += 10; // 增加最大血量
    this.stats.maxEnergy += 10; // 增加最大体力
    this.stats.maxHappiness += 5; // 增加最大快乐值
    // 升级时恢复满状态
    this.stats.health = this.stats.maxHealth;
    this.stats.energy = this.stats.maxEnergy;
    this.stats.happiness = this.stats.maxHappiness;

    // 发出升级事件，显示升级效果
    this.scene.events.emit('cat-level-up', this.stats.level);
  }

  // 设置当前工具
  public setCurrentTool(tool: ToolType | null) {
    this.currentTool = tool;
  }

  // 获取当前工具
  public getCurrentTool(): ToolType | null {
    return this.currentTool;
  }

  // 获取背包物品列表
  public getInventory(): InventoryItem[] {
    return this.inventory;
  }

  // 添加物品到背包 - 相同物品会叠加数量
  public addToInventory(item: InventoryItem): boolean {
    const existingItem = this.inventory.find(i => i.id === item.id);
    if (existingItem) {
      existingItem.quantity += item.quantity; // 叠加数量
    } else {
      this.inventory.push(item); // 添加新物品
    }
    return true;
  }

  // 从背包移除物品 - 指定数量，数量不足时返回失败
  public removeFromInventory(itemId: string, quantity: number = 1): boolean {
    const item = this.inventory.find(i => i.id === itemId);
    if (!item || item.quantity < quantity) {
      return false; // 物品不存在或数量不足
    }

    item.quantity -= quantity;
    if (item.quantity === 0) {
      // 数量为0时从背包中移除
      this.inventory = this.inventory.filter(i => i.id !== itemId);
    }
    return true;
  }

  // 获取小猫属性的副本（防止外部直接修改）
  public getStats(): CatStats {
    return { ...this.stats };
  }

  // 检查是否可以执行动作 - 不在动作中且有体力
  public canPerformAction(): boolean {
    return !this.isActing && this.stats.energy > 0;
  }

  // 创建移动时的微粒效果
  private createMovementParticles() {
    // 避免过度创建粒子效果
    if (Math.random() < 0.3) {
      const particles = this.scene.add.particles(this.x, this.y + 10, 'grass', {
        scale: { start: 0.1, end: 0 },
        alpha: { start: 0.6, end: 0 },
        tint: [0x27ae60, 0x2ecc71, 0x58d68d],
        lifespan: 300,
        quantity: 2,
        speed: { min: 10, max: 30 },
        gravityY: 50
      });

      this.scene.time.delayedCall(300, () => {
        particles.destroy();
      });
    }
  }

  // 创建交互时的特效
  private createInteractionEffect() {
    // 创建交互光环效果
    const ring = this.scene.add.circle(this.x, this.y, 5, 0xffffff, 0);
    ring.setStrokeStyle(3, 0x74b9ff, 0.8);
    ring.setDepth(15);

    this.scene.tweens.add({
      targets: ring,
      scaleX: 3,
      scaleY: 3,
      alpha: 0,
      duration: 400,
      ease: 'Power2',
      onComplete: () => ring.destroy()
    });

    // 添加上升的光点
    for (let i = 0; i < 3; i++) {
      const sparkle = this.scene.add.text(
        this.x + (Math.random() - 0.5) * 30,
        this.y - 10,
        '✨',
        { fontSize: '12px' }
      );
      sparkle.setDepth(15);

      this.scene.tweens.add({
        targets: sparkle,
        y: sparkle.y - 40,
        alpha: 0,
        duration: 800 + (i * 200),
        ease: 'Power2',
        onComplete: () => sparkle.destroy()
      });
    }
  }

  // 每帧更新 - 处理体力恢复和快乐值变化
  update() {
    // 体力自然恢复（缓慢）
    if (this.stats.energy < this.stats.maxEnergy) {
      this.stats.energy = Math.min(this.stats.maxEnergy, this.stats.energy + 0.01);
    }

    // 体力过低时快乐值会下降
    if (this.stats.energy < 20) {
      this.loseHappiness(0.005);
    }
  }
}