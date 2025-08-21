import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  private dialogueBox!: Phaser.GameObjects.Container;
  private dialogueText!: Phaser.GameObjects.Text;
  private notificationText!: Phaser.GameObjects.Text;
  private healthBar!: Phaser.GameObjects.Graphics;
  private manaBar!: Phaser.GameObjects.Graphics;

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
    // Health bar
    const healthBg = this.add.graphics();
    healthBg.fillStyle(0x8b0000);
    healthBg.fillRect(20, 20, 200, 20);
    healthBg.setScrollFactor(0);
    
    this.healthBar = this.add.graphics();
    this.healthBar.fillStyle(0xff0000);
    this.healthBar.fillRect(20, 20, 200, 20);
    this.healthBar.setScrollFactor(0);
    
    // Health text
    const healthText = this.add.text(25, 22, 'HP', {
      fontSize: '14px',
      color: '#ffffff'
    });
    healthText.setScrollFactor(0);
    
    // Mana bar
    const manaBg = this.add.graphics();
    manaBg.fillStyle(0x000080);
    manaBg.fillRect(20, 45, 200, 20);
    manaBg.setScrollFactor(0);
    
    this.manaBar = this.add.graphics();
    this.manaBar.fillStyle(0x0000ff);
    this.manaBar.fillRect(20, 45, 150, 20);
    this.manaBar.setScrollFactor(0);
    
    // Mana text
    const manaText = this.add.text(25, 47, 'MP', {
      fontSize: '14px',
      color: '#ffffff'
    });
    manaText.setScrollFactor(0);
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

  update() {
    // Update UI elements if needed
    this.updatePlayerStats();
  }

  private updatePlayerStats() {
    // This would typically get real player stats
    // For now, just animate the bars slightly
    const healthPercent = 0.8 + Math.sin(this.time.now * 0.001) * 0.1;
    const manaPercent = 0.6 + Math.cos(this.time.now * 0.002) * 0.2;
    
    this.healthBar.clear();
    this.healthBar.fillStyle(0xff0000);
    this.healthBar.fillRect(20, 20, 200 * Math.max(0, healthPercent), 20);
    
    this.manaBar.clear();
    this.manaBar.fillStyle(0x0000ff);
    this.manaBar.fillRect(20, 45, 200 * Math.max(0, manaPercent), 20);
  }
}