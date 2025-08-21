import * as Phaser from 'phaser';

export class NPC extends Phaser.Physics.Arcade.Sprite {
  private dialogue: string;
  private interactionCooldown: boolean = false;
  private isInteracting: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, dialogue: string) {
    super(scene, x, y, 'npc');

    this.dialogue = dialogue;

    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // Static body

    // Set properties
    this.setSize(24, 24);
    this.setOffset(4, 8);
    this.setDepth(5);
    this.setTint(0x2ecc71);

    // Create idle animation
    this.createIdleAnimation();

    // Add interaction indicator
    this.createInteractionIndicator();
  }

  private createIdleAnimation() {
    // Simple breathing animation
    this.scene.tweens.add({
      targets: this,
      scaleY: 0.95,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private createInteractionIndicator() {
    // Create a floating exclamation mark
    const indicator = this.scene.add.text(this.x, this.y - 40, '!', {
      fontSize: '20px',
      color: '#f1c40f',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 4, y: 2 }
    });
    indicator.setOrigin(0.5);
    indicator.setVisible(false);

    // Store reference for later use
    (this as any).indicator = indicator;

    // Floating animation for indicator
    this.scene.tweens.add({
      targets: indicator,
      y: indicator.y - 5,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  public interact() {
    if (this.interactionCooldown) return;

    this.interactionCooldown = true;
    this.isInteracting = true;

    // Show interaction effect
    this.setTint(0x27ae60);

    // Create speech bubble effect
    const speechBubble = this.scene.add.graphics();
    speechBubble.fillStyle(0xffffff, 0.9);
    speechBubble.fillRoundedRect(this.x - 50, this.y - 60, 100, 30, 5);
    speechBubble.lineStyle(2, 0x000000);
    speechBubble.strokeRoundedRect(this.x - 50, this.y - 60, 100, 30, 5);

    // Add speech bubble tail
    speechBubble.fillTriangle(this.x - 5, this.y - 30, this.x + 5, this.y - 30, this.x, this.y - 20);
    speechBubble.strokeTriangle(this.x - 5, this.y - 30, this.x + 5, this.y - 30, this.x, this.y - 20);

    // Show dialogue
    (this.scene as any).showDialogue(this.dialogue);

    // Gain experience for talking to NPCs
    const gameScene = this.scene;
    if ((gameScene as any).player) {
      (gameScene as any).player.gainExperience(10);
    }

    // Remove speech bubble after delay
    this.scene.time.delayedCall(3000, () => {
      speechBubble.destroy();
      this.setTint(0x2ecc71);
      this.isInteracting = false;
    });

    // Reset cooldown
    this.scene.time.delayedCall(1000, () => {
      this.interactionCooldown = false;
    });
  }

  public showIndicator(show: boolean) {
    if ((this as any).indicator) {
      (this as any).indicator.setVisible(show && !this.isInteracting);
    }
  }

  public setDialogue(newDialogue: string) {
    this.dialogue = newDialogue;
  }

  public getDialogue(): string {
    return this.dialogue;
  }

  update() {
    // Update indicator position
    if ((this as any).indicator) {
      (this as any).indicator.x = this.x;
    }
  }

  destroy() {
    if ((this as any).indicator) {
      (this as any).indicator.destroy();
    }
    super.destroy();
  }
}