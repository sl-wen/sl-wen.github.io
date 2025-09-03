const { createCanvas } = require('canvas');
const fs = require('fs');

// Generate animated character sprite sheets
const generateAnimatedCharacter = (type, size = 32) => {
  const frameCount = 4; // 4 frames for walk animation
  const directions = ['down', 'left', 'right', 'up']; // 4 directions
  const sheetWidth = frameCount * size;
  const sheetHeight = directions.length * size;
  
  const canvas = createCanvas(sheetWidth, sheetHeight);
  const ctx = canvas.getContext('2d');
  
  // Character color schemes
  const colorSchemes = {
    player: {
      skin: '#ffdbac',
      hair: '#8b4513',
      body: '#4169e1',
      legs: '#654321'
    },
    npc: {
      skin: '#ffdbac',
      hair: '#2f4f2f',
      body: '#228b22',
      legs: '#654321'
    },
    enemy: {
      skin: '#f5f5dc',
      hair: '#2f2f2f',
      body: '#2f2f2f',
      legs: '#2f2f2f',
      eyes: '#ff0000'
    }
  };
  
  const colors = colorSchemes[type] || colorSchemes.player;
  
  directions.forEach((direction, dirIndex) => {
    for (let frame = 0; frame < frameCount; frame++) {
      const x = frame * size;
      const y = dirIndex * size;
      
      // Clear frame
      ctx.clearRect(x, y, size, size);
      
      // walk animation offset
      const walkOffset = frame % 2 === 0 ? 0 : 1;
      const bobOffset = frame % 2 === 0 ? 0 : -1;
      
      // Draw character based on direction
      drawCharacterFrame(ctx, x, y, size, direction, colors, walkOffset, bobOffset, type);
    }
  });
  
  return canvas;
};

const drawCharacterFrame = (ctx, x, y, size, direction, colors, walkOffset, bobOffset, type) => {
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  
  // Head
  ctx.fillStyle = colors.skin;
  ctx.fillRect(centerX - 6, centerY - 10 + bobOffset, 12, 8);
  
  // Hair
  ctx.fillStyle = colors.hair;
  ctx.fillRect(centerX - 8, centerY - 12 + bobOffset, 16, 6);
  
  // Eyes for enemy
  if (type === 'enemy' && colors.eyes) {
    ctx.fillStyle = colors.eyes;
    ctx.fillRect(centerX - 4, centerY - 8 + bobOffset, 2, 2);
    ctx.fillRect(centerX + 2, centerY - 8 + bobOffset, 2, 2);
  }
  
  // Body
  ctx.fillStyle = colors.body;
  ctx.fillRect(centerX - 6, centerY - 2 + bobOffset, 12, 12);
  
  // Arms (animated based on walk)
  ctx.fillStyle = colors.skin;
  if (direction === 'left' || direction === 'right') {
    // Side view arms
    const armOffset = walkOffset * 2 - 1;
    ctx.fillRect(centerX - 10, centerY + armOffset + bobOffset, 4, 8);
    ctx.fillRect(centerX + 6, centerY - armOffset + bobOffset, 4, 8);
  } else {
    // Front/back view arms
    ctx.fillRect(centerX - 10, centerY + walkOffset + bobOffset, 4, 8);
    ctx.fillRect(centerX + 6, centerY + walkOffset + bobOffset, 4, 8);
  }
  
  // Legs (animated based on walk)
  ctx.fillStyle = colors.legs;
  const legOffset = walkOffset * 2;
  if (direction === 'left' || direction === 'right') {
    ctx.fillRect(centerX - 6, centerY + 10 + bobOffset, 4, 8);
    ctx.fillRect(centerX + 2, centerY + 10 + bobOffset, 4, 8);
  } else {
    ctx.fillRect(centerX - 6 + legOffset, centerY + 10 + bobOffset, 4, 8);
    ctx.fillRect(centerX + 2 - legOffset, centerY + 10 + bobOffset, 4, 8);
  }
};

// Generate chest animation frames
const generateAnimatedChest = (size = 32) => {
  const frameCount = 3; // closed, opening, open
  const canvas = createCanvas(frameCount * size, size);
  const ctx = canvas.getContext('2d');
  
  for (let frame = 0; frame < frameCount; frame++) {
    const x = frame * size;
    const centerX = x + size / 2;
    const centerY = size / 2;
    
    // Chest body
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(centerX - 12, centerY - 4, 24, 16);
    
    // Chest lid (animated)
    ctx.fillStyle = '#daa520';
    if (frame === 0) {
      // Closed
      ctx.fillRect(centerX - 12, centerY - 8, 24, 8);
    } else if (frame === 1) {
      // Opening
      ctx.fillRect(centerX - 12, centerY - 10, 24, 6);
      ctx.fillRect(centerX - 10, centerY - 12, 20, 2);
    } else {
      // Open
      ctx.fillRect(centerX - 12, centerY - 14, 24, 6);
      // Treasure glow
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(centerX - 8, centerY - 6, 16, 8);
    }
    
    // Lock (only on closed chest)
    if (frame === 0) {
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(centerX - 2, centerY - 2, 4, 4);
    }
    
    // Hinges
    ctx.fillStyle = '#2f2f2f';
    ctx.fillRect(centerX - 10, centerY - 6, 2, 2);
    ctx.fillRect(centerX + 8, centerY - 6, 2, 2);
  }
  
  return canvas;
};

// Generate water animation frames
const generateAnimatedWater = (size = 32) => {
  const frameCount = 4;
  const canvas = createCanvas(frameCount * size, size);
  const ctx = canvas.getContext('2d');
  
  for (let frame = 0; frame < frameCount; frame++) {
    const x = frame * size;
    
    // Base water
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(x, 0, size, size);
    
    // Animated ripples
    ctx.fillStyle = '#3b82f6';
    for (let i = 0; i < 6; i++) {
      const rippleX = x + (i * 6 + frame * 2) % size;
      const rippleY = (i * 8 + frame * 3) % size;
      ctx.fillRect(rippleX, rippleY, 3, 1);
      ctx.fillRect(rippleX + 1, rippleY + 1, 1, 1);
    }
    
    // Highlight ripples
    ctx.fillStyle = '#60a5fa';
    for (let i = 0; i < 3; i++) {
      const highlightX = x + (i * 10 + frame * 4) % size;
      const highlightY = (i * 12 + frame * 2) % size;
      ctx.fillRect(highlightX, highlightY, 2, 1);
    }
  }
  
  return canvas;
};

// Save canvas as PNG
const saveCanvas = (canvas, filepath) => {
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filepath, buffer);
  console.log(`Generated: ${filepath}`);
};

// Main generation function
const generateAnimatedAssets = () => {
  console.log('Generating animated game assets...');
  
  // Create directories
  const dirs = ['public/assets/animations'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  // Generate animated characters
  const characterTypes = ['player', 'npc', 'enemy'];
  characterTypes.forEach(type => {
    const canvas = generateAnimatedCharacter(type);
    saveCanvas(canvas, `public/assets/animations/${type}_walk.png`);
  });
  
  // Generate animated chest
  const chestCanvas = generateAnimatedChest();
  saveCanvas(chestCanvas, 'public/assets/animations/chest_open.png');
  
  // Generate animated water
  const waterCanvas = generateAnimatedWater();
  saveCanvas(waterCanvas, 'public/assets/animations/water_flow.png');
  
  console.log('Animated asset generation complete!');
};

// Run the generator
generateAnimatedAssets();