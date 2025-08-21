const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Asset generation configurations
const TILE_SIZE = 32;
const CHARACTER_SIZE = 32;

// Color palettes for different asset types
const PALETTES = {
  grass: ['#2d5016', '#3e6b1e', '#4f8626', '#60a02e'],
  stone: ['#5a5a5a', '#6b6b6b', '#7c7c7c', '#8d8d8d'],
  water: ['#1e3a8a', '#2563eb', '#3b82f6', '#60a5fa'],
  tree: ['#0f3818', '#1e5128', '#2d6a38', '#3c8348'],
  character: ['#8b4513', '#d2691e', '#daa520', '#f4a460'],
  chest: ['#8b4513', '#daa520', '#ffd700', '#ffff00'],
  ui: ['#2d3748', '#4a5568', '#718096', '#a0aec0']
};

// Create directories
const createDirectories = () => {
  const dirs = [
    'public/assets/characters',
    'public/assets/tiles',
    'public/assets/items',
    'public/assets/ui',
    'public/assets/effects'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Generate a pixel art tile
const generateTile = (type, size = TILE_SIZE) => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const colors = PALETTES[type] || PALETTES.grass;
  
  // Clear canvas
  ctx.fillStyle = colors[0];
  ctx.fillRect(0, 0, size, size);
  
  switch (type) {
    case 'grass':
      // Base grass
      ctx.fillStyle = colors[1];
      ctx.fillRect(0, 0, size, size);
      
      // Add grass details
      for (let i = 0; i < 12; i++) {
        const x = Math.floor(Math.random() * size);
        const y = Math.floor(Math.random() * size);
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.fillRect(x, y, 2, 3);
      }
      break;
      
    case 'stone':
      // Base stone
      ctx.fillStyle = colors[1];
      ctx.fillRect(0, 0, size, size);
      
      // Add stone texture
      for (let i = 0; i < 8; i++) {
        const x = Math.floor(Math.random() * (size - 4));
        const y = Math.floor(Math.random() * (size - 4));
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.fillRect(x, y, 4, 4);
      }
      break;
      
    case 'water':
      // Animated water effect
      ctx.fillStyle = colors[1];
      ctx.fillRect(0, 0, size, size);
      
      // Add water ripples
      for (let i = 0; i < 6; i++) {
        const x = Math.floor(Math.random() * size);
        const y = Math.floor(Math.random() * size);
        ctx.fillStyle = colors[2];
        ctx.fillRect(x, y, 3, 1);
        ctx.fillRect(x + 1, y + 1, 1, 1);
      }
      break;
      
    case 'tree':
      // Tree trunk
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(size/2 - 4, size - 16, 8, 16);
      
      // Tree leaves
      ctx.fillStyle = colors[2];
      ctx.fillRect(size/2 - 12, 4, 24, 20);
      ctx.fillStyle = colors[3];
      ctx.fillRect(size/2 - 8, 8, 16, 16);
      break;
  }
  
  return canvas;
};

// Generate character sprite
const generateCharacter = (type, size = CHARACTER_SIZE) => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  switch (type) {
    case 'player':
      // Head
      ctx.fillStyle = '#ffdbac';
      ctx.fillRect(size/2 - 6, 4, 12, 8);
      
      // Hair
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(size/2 - 8, 2, 16, 6);
      
      // Body
      ctx.fillStyle = '#4169e1';
      ctx.fillRect(size/2 - 6, 12, 12, 12);
      
      // Arms
      ctx.fillStyle = '#ffdbac';
      ctx.fillRect(size/2 - 10, 14, 4, 8);
      ctx.fillRect(size/2 + 6, 14, 4, 8);
      
      // Legs
      ctx.fillStyle = '#654321';
      ctx.fillRect(size/2 - 6, 24, 4, 8);
      ctx.fillRect(size/2 + 2, 24, 4, 8);
      break;
      
    case 'npc':
      // Head
      ctx.fillStyle = '#ffdbac';
      ctx.fillRect(size/2 - 6, 4, 12, 8);
      
      // Hair
      ctx.fillStyle = '#2f4f2f';
      ctx.fillRect(size/2 - 8, 2, 16, 6);
      
      // Body
      ctx.fillStyle = '#228b22';
      ctx.fillRect(size/2 - 6, 12, 12, 12);
      
      // Arms
      ctx.fillStyle = '#ffdbac';
      ctx.fillRect(size/2 - 10, 14, 4, 8);
      ctx.fillRect(size/2 + 6, 14, 4, 8);
      
      // Legs
      ctx.fillStyle = '#654321';
      ctx.fillRect(size/2 - 6, 24, 4, 8);
      ctx.fillRect(size/2 + 2, 24, 4, 8);
      break;
      
    case 'enemy':
      // Head (skull-like)
      ctx.fillStyle = '#f5f5dc';
      ctx.fillRect(size/2 - 6, 4, 12, 8);
      
      // Eyes
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(size/2 - 4, 6, 2, 2);
      ctx.fillRect(size/2 + 2, 6, 2, 2);
      
      // Body
      ctx.fillStyle = '#2f2f2f';
      ctx.fillRect(size/2 - 6, 12, 12, 12);
      
      // Arms
      ctx.fillStyle = '#2f2f2f';
      ctx.fillRect(size/2 - 10, 14, 4, 8);
      ctx.fillRect(size/2 + 6, 14, 4, 8);
      
      // Legs
      ctx.fillStyle = '#2f2f2f';
      ctx.fillRect(size/2 - 6, 24, 4, 8);
      ctx.fillRect(size/2 + 2, 24, 4, 8);
      break;
  }
  
  return canvas;
};

// Generate item sprite
const generateItem = (type, size = CHARACTER_SIZE) => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  switch (type) {
    case 'chest':
      // Chest body
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(size/2 - 12, size/2 - 4, 24, 16);
      
      // Chest lid
      ctx.fillStyle = '#daa520';
      ctx.fillRect(size/2 - 12, size/2 - 8, 24, 8);
      
      // Lock
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(size/2 - 2, size/2 - 2, 4, 4);
      
      // Hinges
      ctx.fillStyle = '#2f2f2f';
      ctx.fillRect(size/2 - 10, size/2 - 6, 2, 2);
      ctx.fillRect(size/2 + 8, size/2 - 6, 2, 2);
      break;
      
    case 'potion':
      // Bottle
      ctx.fillStyle = '#87ceeb';
      ctx.fillRect(size/2 - 4, size/2 - 8, 8, 16);
      ctx.fillRect(size/2 - 2, size/2 - 12, 4, 4);
      
      // Cork
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(size/2 - 3, size/2 - 14, 6, 2);
      
      // Liquid
      ctx.fillStyle = '#ff1493';
      ctx.fillRect(size/2 - 3, size/2 - 6, 6, 12);
      break;
      
    case 'sword':
      // Handle
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(size/2 - 1, size/2 + 4, 2, 8);
      
      // Guard
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(size/2 - 4, size/2 + 2, 8, 2);
      
      // Blade
      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(size/2 - 1, size/2 - 12, 2, 14);
      ctx.fillRect(size/2 - 2, size/2 - 10, 4, 2);
      break;
  }
  
  return canvas;
};

// Generate UI elements
const generateUI = (type, width = 100, height = 30) => {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const colors = PALETTES.ui;
  
  switch (type) {
    case 'button':
      // Button background
      ctx.fillStyle = colors[1];
      ctx.fillRect(0, 0, width, height);
      
      // Button border
      ctx.fillStyle = colors[3];
      ctx.fillRect(0, 0, width, 2);
      ctx.fillRect(0, 0, 2, height);
      ctx.fillStyle = colors[0];
      ctx.fillRect(0, height - 2, width, 2);
      ctx.fillRect(width - 2, 0, 2, height);
      break;
      
    case 'panel':
      // Panel background
      ctx.fillStyle = colors[0];
      ctx.fillRect(0, 0, width, height);
      
      // Panel border
      ctx.fillStyle = colors[2];
      ctx.fillRect(2, 2, width - 4, height - 4);
      break;
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
const generateAssets = () => {
  console.log('Generating game assets...');
  
  createDirectories();
  
  // Generate tiles
  const tileTypes = ['grass', 'stone', 'water', 'tree'];
  tileTypes.forEach(type => {
    const canvas = generateTile(type);
    saveCanvas(canvas, `public/assets/tiles/${type}.png`);
  });
  
  // Generate characters
  const characterTypes = ['player', 'npc', 'enemy'];
  characterTypes.forEach(type => {
    const canvas = generateCharacter(type);
    saveCanvas(canvas, `public/assets/characters/${type}.png`);
  });
  
  // Generate items
  const itemTypes = ['chest', 'potion', 'sword'];
  itemTypes.forEach(type => {
    const canvas = generateItem(type);
    saveCanvas(canvas, `public/assets/items/${type}.png`);
  });
  
  // Generate UI elements
  const buttonCanvas = generateUI('button', 100, 32);
  saveCanvas(buttonCanvas, 'public/assets/ui/button.png');
  
  const panelCanvas = generateUI('panel', 200, 150);
  saveCanvas(panelCanvas, 'public/assets/ui/panel.png');
  
  console.log('Asset generation complete!');
};

// Run the generator
generateAssets();