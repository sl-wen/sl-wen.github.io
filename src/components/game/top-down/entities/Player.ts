import * as Phaser from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private speed: number = 150;
  private direction: string = 'down';
  private isMoving: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');

    // 添加到场景和物理系统
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 设置物理属性
    this.setCollideWorldBounds(true);
    this.setSize(24, 24); // 设置碰撞体积
    this.setOffset(4, 8); // 设置碰撞偏移

    // 创建动画
    this.createAnimations();

    // 播放默认动画
    this.play('player_idle_down');
  }

  private createAnimations(): void {
    const anims = this.scene.anims;

    // 创建简单的动画（使用相同的纹理）
    const playerFrames = [{ key: 'player', frame: 0 }];

    // 创建行走动画
    anims.create({
      key: 'player_walk_down',
      frames: playerFrames,
      frameRate: 8,
      repeat: -1
    });

    anims.create({
      key: 'player_walk_up',
      frames: playerFrames,
      frameRate: 8,
      repeat: -1
    });

    anims.create({
      key: 'player_walk_left',
      frames: playerFrames,
      frameRate: 8,
      repeat: -1
    });

    anims.create({
      key: 'player_walk_right',
      frames: playerFrames,
      frameRate: 8,
      repeat: -1
    });

    // 创建静止动画
    anims.create({
      key: 'player_idle_down',
      frames: playerFrames,
      frameRate: 1
    });

    anims.create({
      key: 'player_idle_up',
      frames: playerFrames,
      frameRate: 1
    });

    anims.create({
      key: 'player_idle_left',
      frames: playerFrames,
      frameRate: 1
    });

    anims.create({
      key: 'player_idle_right',
      frames: playerFrames,
      frameRate: 1
    });
  }

  public handleMovement(left: boolean, right: boolean, up: boolean, down: boolean): void {
    // 重置速度
    this.setVelocity(0, 0);

    // 计算移动方向
    let moveX = 0;
    let moveY = 0;

    if (left) moveX = -1;
    if (right) moveX = 1;
    if (up) moveY = -1;
    if (down) moveY = 1;

    // 标准化对角线移动
    if (moveX !== 0 && moveY !== 0) {
      moveX *= 0.707; // 1/√2
      moveY *= 0.707;
    }

    // 设置速度
    this.setVelocity(moveX * this.speed, moveY * this.speed);

    // 更新动画
    this.updateAnimation(moveX, moveY);
  }

  private updateAnimation(moveX: number, moveY: number): void {
    if (moveX === 0 && moveY === 0) {
      // 静止状态
      this.isMoving = false;
      this.play(`player_idle_${this.direction}`, true);
    } else {
      // 移动状态
      this.isMoving = true;
      
      // 确定方向
      if (Math.abs(moveX) > Math.abs(moveY)) {
        this.direction = moveX > 0 ? 'right' : 'left';
      } else {
        this.direction = moveY > 0 ? 'down' : 'up';
      }
      
      this.play(`player_walk_${this.direction}`, true);
    }
  }

  public getDirection(): string {
    return this.direction;
  }

  public isPlayerMoving(): boolean {
    return this.isMoving;
  }

  public setSpeed(speed: number): void {
    this.speed = speed;
  }

  public getSpeed(): number {
    return this.speed;
  }
}
