#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Asset renaming mappings based on content analysis
const assetMappings = {
  // Plant assets - organized by crop type and growth stage
  plants: {
    // Carrot growth stages
    'plants-7.png': 'carrot_seed.png',
    'plants-8.png': 'carrot_sprout.png', 
    'plants-9.png': 'carrot_mature.png',
    'plants-10.png': 'carrot_ready.png',
    
    // Tomato growth stages
    'plants-38.png': 'tomato_seed.png',
    'plants-39.png': 'tomato_sprout.png',
    'plants-40.png': 'tomato_mature.png',
    'plants-41.png': 'tomato_ready.png',
    
    // Wheat growth stages
    'plants-42.png': 'wheat_seed.png',
    'plants-43.png': 'wheat_sprout.png',
    'plants-44.png': 'wheat_mature.png',
    'plants-45.png': 'wheat_ready.png',
    
    // Corn growth stages
    'plants-71.png': 'corn_seed.png',
    'plants-72.png': 'corn_sprout.png',
    'plants-73.png': 'corn_mature.png',
    'plants-74.png': 'corn_ready.png',
    
    // Strawberry growth stages
    'plants-75.png': 'strawberry_seed.png',
    'plants-76.png': 'strawberry_sprout.png',
    'plants-77.png': 'strawberry_mature.png',
    'plants-78.png': 'strawberry_ready.png',
    
    // Lettuce growth stages
    'plants-79.png': 'lettuce_seed.png',
    'plants-80.png': 'lettuce_sprout.png',
    'plants-81.png': 'lettuce_mature.png',
    'plants-82.png': 'lettuce_ready.png',
    
    // Potato growth stages
    'plants-83.png': 'potato_seed.png',
    'plants-84.png': 'potato_sprout.png',
    'plants-85.png': 'potato_mature.png',
    'plants-86.png': 'potato_ready.png',
    
    // Pumpkin growth stages
    'plants-87.png': 'pumpkin_seed.png',
    'plants-88.png': 'pumpkin_sprout.png',
    'plants-89.png': 'pumpkin_mature.png',
    'plants-90.png': 'pumpkin_ready.png',
    
    // Withered/Dead plants
    'plants-63.png': 'plant_withered_1.png',
    'plants-64.png': 'plant_withered_2.png',
    'plants-65.png': 'plant_withered_3.png',
    'plants-66.png': 'plant_withered_4.png',
    
    // Generic plant elements
    'plants-91.png': 'generic_flower_1.png',
    'plants-92.png': 'generic_flower_2.png',
    'plants-93.png': 'generic_flower_3.png',
    'plants-94.png': 'generic_grass_1.png',
    'plants-95.png': 'generic_grass_2.png',
  },
  
  // Tool assets
  tools: {
    'tool-0.png': 'hoe.png',
    'tool-1.png': 'watering_can.png',
    'tool-2.png': 'fertilizer_bag.png',
    'tool-3.png': 'seed_packet.png',
    'tool-4.png': 'shovel.png',
    'tool-5.png': 'rake.png',
    'tool-6.png': 'scissors.png',
    'tool-7.png': 'basket.png',
    'tool-8.png': 'bucket.png',
    'tool-9.png': 'hammer.png',
    'tool-10.png': 'axe.png',
    'tool-11.png': 'pickaxe.png',
    'tool-12.png': 'fishing_rod.png',
    'tool-13.png': 'net.png',
    'tool-14.png': 'rope.png',
    'tool-15.png': 'knife.png',
  },
  
  // UI assets
  ui: {
    'UI-900.png': 'button_wood_normal.png',
    'UI-901.png': 'button_wood_hover.png',
    'UI-902.png': 'button_wood_pressed.png',
    'UI-903.png': 'button_stone_normal.png',
    'UI-904.png': 'button_stone_hover.png',
    'UI-905.png': 'button_stone_pressed.png',
    'UI-906.png': 'panel_wood_small.png',
    'UI-907.png': 'panel_wood_medium.png',
    'UI-908.png': 'panel_wood_large.png',
    'UI-909.png': 'panel_stone_small.png',
    'UI-910.png': 'panel_stone_medium.png',
    'UI-911.png': 'panel_stone_large.png',
    'UI-912.png': 'icon_health.png',
    'UI-913.png': 'icon_energy.png',
    'UI-914.png': 'icon_happiness.png',
    'UI-915.png': 'icon_coin.png',
    'UI-916.png': 'icon_experience.png',
    'UI-917.png': 'inventory_slot.png',
    'UI-918.png': 'inventory_slot_selected.png',
    'UI-919.png': 'progress_bar_bg.png',
    'UI-920.png': 'progress_bar_fill.png',
  },
  
  // Animal assets - Cat animations
  cat: {
    'cat-3.png': 'cat_idle_down.png',
    'cat-4.png': 'cat_idle_up.png', 
    'cat-5.png': 'cat_idle_left.png',
    'cat-6.png': 'cat_idle_right.png',
    'cat-22.png': 'cat_walk_down_1.png',
    'cat-23.png': 'cat_walk_down_2.png',
    'cat-24.png': 'cat_walk_up_1.png',
    'cat-25.png': 'cat_walk_up_2.png',
    'cat-26.png': 'cat_walk_left_1.png',
    'cat-27.png': 'cat_walk_left_2.png',
    'cat-28.png': 'cat_walk_right_1.png',
    'cat-29.png': 'cat_walk_right_2.png',
    'cat-30.png': 'cat_work_hoe.png',
    'cat-31.png': 'cat_work_water.png',
    'cat-32.png': 'cat_work_harvest.png',
    'cat-33.png': 'cat_happy.png',
    'cat-34.png': 'cat_tired.png',
    'cat-35.png': 'cat_eating.png',
  },
  
  // Chicken assets
  chicken: {
    'chicken-5.png': 'chicken_idle_1.png',
    'chicken-6.png': 'chicken_idle_2.png',
    'chicken-7.png': 'chicken_walk_1.png',
    'chicken-8.png': 'chicken_walk_2.png',
    'chicken-9.png': 'chicken_peck_1.png',
    'chicken-44.png': 'chicken_peck_2.png',
    'chicken-45.png': 'chicken_flap_1.png',
    'chicken-46.png': 'chicken_flap_2.png',
  },
  
  // Mushroom assets  
  mushrooms: {
    'Mushroom-0.png': 'mushroom_small_brown.png',
    'Mushroom-1.png': 'mushroom_small_red.png',
    'Mushroom-2.png': 'mushroom_medium_brown.png',
    'Mushroom-3.png': 'mushroom_medium_red.png',
    'Mushroom-4.png': 'mushroom_large_brown.png',
    'Mushroom-5.png': 'mushroom_large_red.png',
    'Mushroom-6.png': 'mushroom_cluster_1.png',
    'Mushroom-7.png': 'mushroom_cluster_2.png',
  }
};

/**
 * Rename assets based on the mapping
 */
function renameAssets() {
  const baseDir = path.join(__dirname, '..', 'public', 'assets', 'farm-assets');
  
  Object.keys(assetMappings).forEach(category => {
    const categoryDir = path.join(baseDir, category);
    const mappings = assetMappings[category];
    
    if (!fs.existsSync(categoryDir)) {
      console.log(`Directory ${categoryDir} does not exist, skipping...`);
      return;
    }
    
    console.log(`\nRenaming ${category} assets...`);
    
    Object.keys(mappings).forEach(oldName => {
      const newName = mappings[oldName];
      const oldPath = path.join(categoryDir, oldName);
      const newPath = path.join(categoryDir, newName);
      
      if (fs.existsSync(oldPath)) {
        try {
          fs.renameSync(oldPath, newPath);
          console.log(`✓ Renamed ${oldName} → ${newName}`);
        } catch (error) {
          console.error(`✗ Failed to rename ${oldName}: ${error.message}`);
        }
      } else {
        console.log(`⚠ File ${oldName} not found in ${category}`);
      }
    });
  });
  
  console.log('\n🎉 Asset renaming completed!');
}

/**
 * Create organized directory structure
 */
function createOrganizedStructure() {
  const baseDir = path.join(__dirname, '..', 'public', 'assets', 'farm-assets');
  const newStructure = [
    'crops/carrot',
    'crops/tomato', 
    'crops/wheat',
    'crops/corn',
    'crops/strawberry',
    'crops/lettuce',
    'crops/potato',
    'crops/pumpkin',
    'tools/farming',
    'tools/harvesting',
    'ui/buttons',
    'ui/panels',
    'ui/icons',
    'animals/cat/animations',
    'animals/chicken/animations',
    'decorations/mushrooms',
    'decorations/flowers'
  ];
  
  newStructure.forEach(dir => {
    const fullPath = path.join(baseDir, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
}

// Run the script
if (require.main === module) {
  console.log('🚀 Starting asset renaming process...');
  console.log('This will rename farm assets to have meaningful names based on their content.');
  
  // First create organized structure
  createOrganizedStructure();
  
  // Then rename assets
  renameAssets();
  
  console.log('\n📝 Next steps:');
  console.log('1. Update PreloadScene.ts to use new asset names');
  console.log('2. Update game entities to reference new asset paths');
  console.log('3. Test asset loading in the game');
}

module.exports = { assetMappings, renameAssets, createOrganizedStructure };