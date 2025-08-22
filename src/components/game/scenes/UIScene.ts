import * as Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  private dialogueBox!: Phaser.GameObjects.Container;
  private dialogueText!: Phaser.GameObjects.Text;
  private notificationText!: Phaser.GameObjects.Text;
  private healthBar!: Phaser.GameObjects.Graphics;
  private manaBar!: Phaser.GameObjects.Graphics;
  private healthText!: Phaser.GameObjects.Text;
  private manaText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    // Create UI elements
    this.createDialogueBox();
    this.createNotificationArea();
    this.createPlayerStats();
    this.createMiniMap();

    // Listen for events from GameScene
    this.events.on('showDialogue', this.showDialogue, this);
    this.events.on('showNotification', this.showNotification, this);
    this.events.on('playerStatsChanged', this.onPlayerStatsChanged, this);
  }

  private createDialogueBox() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Create dialogue container
    this.dialogueBox = this.add.container(width / 2, height - 100);

    // Background
    const dialogueBg = this.add.graphics();
    dialogueBg.fillStyle(0x000000, 0.8);
    dialogueBg.fillRoundedRect(-300, -40, 600, 80, 10);
    dialogueBg.lineStyle(2, 0x4ecdc4);
    dialogueBg.strokeRoundedRect(-300, -40, 600, 80, 10);

    // Text
    this.dialogueText = this.add.text(0, 0, '', {
      fontSize: '16px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 580 }
    });
    this.dialogueText.setOrigin(0.5);

    // Add to container
    this.dialogueBox.add([dialogueBg, this.dialogueText]);
    this.dialogueBox.setVisible(false);
    this.dialogueBox.setScrollFactor(0);
  }

  private createNotificationArea() {
    const width = this.cameras.main.width;

    this.notificationText = this.add.text(width / 2, 50, '', {
      fontSize: '18px',
      color: '#f1c40f',
      align: 'center',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 20, y: 10 }
    });
    this.notificationText.setOrigin(0.5);
    this.notificationText.setScrollFactor(0);
    this.notificationText.setVisible(false);
  }

  private createPlayerStats() {
    // Health bar background
    const healthBg = this.add.graphics();
    healthBg.fillStyle(0x8b0000);
    healthBg.fillRect(20, 20, 200, 20);
    healthBg.setScrollFactor(0);

    // Health bar
    this.healthBar = this.add.graphics();
    this.healthBar.setScrollFactor(0);

    // Health text with actual values
    this.healthText = this.add.text(25, 22, 'HP: 100/100', {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.healthText.setScrollFactor(0);

    // Mana bar background
    const manaBg = this.add.graphics();
    manaBg.fillStyle(0x000080);
    manaBg.fillRect(20, 45, 200, 20);
    manaBg.setScrollFactor(0);

    // Mana bar
    this.manaBar = this.add.graphics();
    this.manaBar.setScrollFactor(0);

    // Mana text with actual values
    this.manaText = this.add.text(25, 47, 'MP: 50/100', {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.manaText.setScrollFactor(0);

    // Level text
    this.levelText = this.add.text(25, 70, 'Level: 1', {
      fontSize: '12px',
      color: '#f1c40f',
      fontStyle: 'bold'
    });
    this.levelText.setScrollFactor(0);
  }

  private createMiniMap() {
    const width = this.cameras.main.width;

    // Mini map background
    const miniMapBg = this.add.graphics();
    miniMapBg.fillStyle(0x000000, 0.7);
    miniMapBg.fillRect(width - 120, 20, 100, 100);
    miniMapBg.lineStyle(2, 0x4ecdc4);
    miniMapBg.strokeRect(width - 120, 20, 100, 100);
    miniMapBg.setScrollFactor(0);

    // Mini map title
    const miniMapTitle = this.add.text(width - 70, 10, '地图', {
      fontSize: '12px',
      color: '#ffffff'
    });
    miniMapTitle.setOrigin(0.5);
    miniMapTitle.setScrollFactor(0);

    // Player dot on mini map
    const playerDot = this.add.graphics();
    playerDot.fillStyle(0x3498db);
    playerDot.fillCircle(width - 70, 70, 3);
    playerDot.setScrollFactor(0);
  }

  private showDialogue(text: string) {
    this.dialogueText.setText(text);
    this.dialogueBox.setVisible(true);

    // Auto hide after 3 seconds
    this.time.delayedCall(3000, () => {
      this.dialogueBox.setVisible(false);
    });
  }

  private showNotification(text: string) {
    this.notificationText.setText(text);
    this.notificationText.setVisible(true);

    // Fade out animation
    this.tweens.add({
      targets: this.notificationText,
      alpha: 0,
      duration: 2000,
      delay: 1000,
      onComplete: () => {
        this.notificationText.setVisible(false);
        this.notificationText.setAlpha(1);
      }
    });
  }

  private onPlayerStatsChanged(stats: any) {
    // Immediately update UI when player stats change
    this.updatePlayerStatsWithData(stats);
  }

  private updatePlayerStatsWithData(stats: any) {
    // Calculate percentages
    const healthPercent = stats.health / stats.maxHealth;
    const manaPercent = stats.mana / stats.maxMana;
    
    // Update health bar
    this.healthBar.clear();
    this.healthBar.fillStyle(0xff0000);
    this.healthBar.fillRect(20, 20, 200 * Math.max(0, healthPercent), 20);
    
    // Update mana bar
    this.manaBar.clear();
    this.manaBar.fillStyle(0x0000ff);
    this.manaBar.fillRect(20, 45, 200 * Math.max(0, manaPercent), 20);
    
    // Update text displays
    this.healthText.setText(`HP: ${Math.ceil(stats.health)}/${stats.maxHealth}`);
    this.manaText.setText(`MP: ${Math.ceil(stats.mana)}/${stats.maxMana}`);
    this.levelText.setText(`Level: ${stats.level}`);
    
    // Change bar color based on health percentage
    if (healthPercent < 0.25) {
      this.healthBar.clear();
      this.healthBar.fillStyle(0x8b0000); // Dark red when low
      this.healthBar.fillRect(20, 20, 200 * Math.max(0, healthPercent), 20);
    } else if (healthPercent < 0.5) {
      this.healthBar.clear();
      this.healthBar.fillStyle(0xff8c00); // Orange when medium
      this.healthBar.fillRect(20, 20, 200 * Math.max(0, healthPercent), 20);
    }
    
    // Add pulsing effect when health is low
    if (healthPercent < 0.25) {
      const pulse = 0.8 + Math.sin(this.time.now * 0.01) * 0.2;
      this.healthText.setAlpha(pulse);
    } else {
      this.healthText.setAlpha(1);
    }
  }

  update() {
    // Update UI elements - fallback to polling if events don't work
    this.updatePlayerStats();
  }

  private updatePlayerStats() {
    // Get the GameScene instance
    const gameScene = this.scene.get('GameScene') as any;
    
    if (gameScene && gameScene.player) {
      const stats = gameScene.player.getStats();
      this.updatePlayerStatsWithData(stats);
    }
  }
}