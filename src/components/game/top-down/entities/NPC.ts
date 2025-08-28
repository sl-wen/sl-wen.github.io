import * as Phaser from 'phaser';

export class NPC extends Phaser.Physics.Arcade.Sprite {
  private dialogue: string[] = [
    "你好，旅行者！",
    "欢迎来到我们的村庄。",
    "有什么我可以帮助你的吗？"
  ];
  private currentDialogueIndex: number = 0;
  private dialogueBox?: Phaser.GameObjects.Container;
  private isInDialogue: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'npc');

    // 添加到场景和物理系统
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 设置物理属性
    this.setCollideWorldBounds(true);
    this.setSize(24, 24);
    this.setOffset(4, 8);

    // 创建动画
    this.createAnimations();

    // 播放默认动画
    this.play('npc_idle');

    // 设置NPC为静态物体
    this.body!.setImmovable(true);
  }

  private createAnimations(): void {
    const anims = this.scene.anims;

    // 创建NPC静止动画
    anims.create({
      key: 'npc_idle',
      frames: [{ key: 'npc', frame: 0 }],
      frameRate: 4,
      repeat: -1
    });
  }

  public startDialogue(): void {
    if (this.isInDialogue) {
      this.nextDialogue();
    } else {
      this.showDialogue();
    }
  }

  private showDialogue(): void {
    this.isInDialogue = true;
    this.currentDialogueIndex = 0;
    this.displayDialogue();
  }

  private nextDialogue(): void {
    this.currentDialogueIndex++;
    if (this.currentDialogueIndex >= this.dialogue.length) {
      this.endDialogue();
    } else {
      this.displayDialogue();
    }
  }

  private displayDialogue(): void {
    // 移除之前的对话框
    if (this.dialogueBox) {
      this.dialogueBox.destroy();
    }

    // 创建新的对话框
    this.dialogueBox = this.scene.add.container(0, 0);

    // 对话框背景
    const background = this.scene.add.rectangle(
      this.x, 
      this.y - 60, 
      200, 
      40, 
      0x000000, 
      0.8
    );

    // 对话文本
    const text = this.scene.add.text(
      this.x, 
      this.y - 60, 
      this.dialogue[this.currentDialogueIndex],
      {
        fontSize: '12px',
        color: '#ffffff',
        align: 'center'
      }
    );
    text.setOrigin(0.5);

    // 添加到容器
    this.dialogueBox.add([background, text]);
    this.dialogueBox.setDepth(1000);

    // 设置对话框不跟随相机
    this.dialogueBox.setScrollFactor(0);
  }

  private endDialogue(): void {
    this.isInDialogue = false;
    if (this.dialogueBox) {
      this.dialogueBox.destroy();
      this.dialogueBox = undefined;
    }
  }

  public update(): void {
    // NPC的更新逻辑
    // 可以在这里添加巡逻、AI行为等
  }

  public setDialogue(dialogue: string[]): void {
    this.dialogue = dialogue;
  }

  public getDialogue(): string[] {
    return this.dialogue;
  }

  public isInDialogueMode(): boolean {
    return this.isInDialogue;
  }
}
