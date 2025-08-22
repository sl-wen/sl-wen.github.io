import * as Phaser from 'phaser';

// NPC类 - 非玩家角色，提供对话交互和农场指导功能
export class NPC extends Phaser.Physics.Arcade.Sprite {
  private dialogue: string; // NPC的对话内容
  private interactionCooldown: boolean = false; // 交互冷却状态，防止频繁交互
  private isInteracting: boolean = false; // 是否正在进行交互

  // 构造函数 - 创建NPC实例并设置对话内容
  constructor(scene: Phaser.Scene, x: number, y: number, dialogue: string) {
    super(scene, x, y, 'npc');

    this.dialogue = dialogue;

    // 将NPC添加到游戏场景中
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // 静态物理体，不会移动

    // 设置NPC的物理和显示属性
    this.setSize(24, 24); // 设置碰撞体积大小
    this.setOffset(4, 8); // 设置碰撞体积偏移
    this.setDepth(5); // 设置渲染层级，低于玩家
    this.setTint(0x2ecc71); // 设置绿色色调，表示友善NPC

    // 创建静止时的呼吸动画
    this.createIdleAnimation();

    // 添加交互提示图标
    this.createInteractionIndicator();
  }

  // 创建NPC的静止动画 - 轻微的呼吸效果让NPC显得生动
  private createIdleAnimation() {
    this.scene.tweens.add({
      targets: this, // 动画目标是NPC本身
      scaleY: 0.95, // Y轴缩放到95%
      duration: 1500, // 动画持续1.5秒
      yoyo: true, // 来回播放
      repeat: -1, // 无限重复
      ease: 'Sine.easeInOut' // 使用正弦缓动，更自然
    });
  }

  // 创建交互提示图标 - 显示感叹号表示可以交互
  private createInteractionIndicator() {
    // 创建浮动的感叹号文本
    const indicator = this.scene.add.text(this.x, this.y - 40, '!', {
      fontSize: '20px',
      color: '#f1c40f', // 金黄色
      backgroundColor: 'rgba(0,0,0,0.7)', // 半透明黑色背景
      padding: { x: 4, y: 2 }
    });
    indicator.setOrigin(0.5); // 设置原点为中心
    indicator.setVisible(false); // 默认隐藏

    // 存储引用以便后续使用
    (this as any).indicator = indicator;

    // 为指示器添加浮动动画
    this.scene.tweens.add({
      targets: indicator,
      y: indicator.y - 5, // 向上浮动5像素
      duration: 1000, // 动画持续1秒
      yoyo: true, // 来回播放
      repeat: -1, // 无限重复
      ease: 'Sine.easeInOut' // 平滑的正弦缓动
    });
  }

  // 交互方法 - 处理玩家与NPC的对话交互
  public interact() {
    if (this.interactionCooldown) return; // 冷却期内不响应交互

    this.interactionCooldown = true;
    this.isInteracting = true;

    // 显示交互效果 - 改变NPC颜色
    this.setTint(0x27ae60); // 更深的绿色表示正在交互

    // 创建对话气泡效果
    const speechBubble = this.scene.add.graphics();
    speechBubble.fillStyle(0xffffff, 0.9); // 白色填充，90%透明度
    speechBubble.fillRoundedRect(this.x - 50, this.y - 60, 100, 30, 5); // 圆角矩形气泡
    speechBubble.lineStyle(2, 0x000000); // 黑色边框
    speechBubble.strokeRoundedRect(this.x - 50, this.y - 60, 100, 30, 5);

    // 添加对话气泡的小尾巴（指向NPC）
    speechBubble.fillTriangle(this.x - 5, this.y - 30, this.x + 5, this.y - 30, this.x, this.y - 20);
    speechBubble.strokeTriangle(this.x - 5, this.y - 30, this.x + 5, this.y - 30, this.x, this.y - 20);

    // 显示对话内容
    (this.scene as any).showDialogue(this.dialogue);

    // 与NPC对话可以获得经验值
    const gameScene = this.scene;
    if ((gameScene as any).player) {
      (gameScene as any).player.gainExperience(10); // 给玩家10点经验
    }

    // 延时移除对话气泡
    this.scene.time.delayedCall(3000, () => {
      speechBubble.destroy(); // 销毁气泡图形
      this.setTint(0x2ecc71); // 恢复原始颜色
      this.isInteracting = false;
    });

    // 设置交互冷却时间
    this.scene.time.delayedCall(1000, () => {
      this.interactionCooldown = false;
    });
  }

  // 显示或隐藏交互提示 - 玩家靠近时显示感叹号
  public showIndicator(show: boolean) {
    if ((this as any).indicator) {
      // 只有在不交互时才显示提示
      (this as any).indicator.setVisible(show && !this.isInteracting);
    }
  }

  // 设置新的对话内容 - 允许动态修改NPC的对话
  public setDialogue(newDialogue: string) {
    this.dialogue = newDialogue;
  }

  // 获取当前对话内容
  public getDialogue(): string {
    return this.dialogue;
  }

  // 每帧更新 - 保持交互指示器位置同步
  update() {
    // 更新指示器位置，跟随NPC移动（虽然NPC是静态的）
    if ((this as any).indicator) {
      (this as any).indicator.x = this.x;
    }
  }

  // 销毁NPC时的清理工作 - 确保相关资源被正确释放
  destroy() {
    if ((this as any).indicator) {
      (this as any).indicator.destroy(); // 销毁交互指示器
    }
    super.destroy(); // 调用父类的销毁方法
  }
}