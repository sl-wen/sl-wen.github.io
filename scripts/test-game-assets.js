const fs = require('fs');
const path = require('path');

// 检查游戏资源文件是否存在
function checkGameAssets() {
  console.log('🔍 检查游戏资源文件...\n');

  const assetsToCheck = [
    // 图片资源
    'public/game/assets/images/coin.png',
    'public/game/assets/images/dialog_borderbox.png',
    'public/game/assets/images/game_over_background.png',
    'public/game/assets/images/health.png',
    'public/game/assets/images/heart_container.png',
    'public/game/assets/images/main_menu_background.png',
    'public/game/assets/images/push.png',
    'public/game/assets/images/sword.png',
    
    // 精灵资源
    'public/game/assets/sprites/atlas/hero.png',
    'public/game/assets/sprites/atlas/hero.json',
    'public/game/assets/sprites/atlas/heart.png',
    'public/game/assets/sprites/atlas/heart.json',
    'public/game/assets/sprites/atlas/npc_01.png',
    'public/game/assets/sprites/atlas/npc_01.json',
    
    // 瓦片集资源
    'public/game/assets/sprites/maps/tilesets/tileset.png',
    'public/game/assets/sprites/maps/tilesets/tileset.json',
    
    // 地图资源
    'public/game/assets/maps/main_map.json'
  ];

  let allFilesExist = true;
  let existingFiles = 0;

  assetsToCheck.forEach(assetPath => {
    const fullPath = path.join(process.cwd(), assetPath);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      console.log(`✅ ${assetPath} (${(stats.size / 1024).toFixed(1)} KB)`);
      existingFiles++;
    } else {
      console.log(`❌ ${assetPath} - 文件不存在`);
      allFilesExist = false;
    }
  });

  console.log(`\n📊 资源检查结果:`);
  console.log(`   - 总文件数: ${assetsToCheck.length}`);
  console.log(`   - 存在文件: ${existingFiles}`);
  console.log(`   - 缺失文件: ${assetsToCheck.length - existingFiles}`);
  console.log(`   - 状态: ${allFilesExist ? '✅ 所有资源文件都存在' : '❌ 部分资源文件缺失'}`);

  return allFilesExist;
}

// 检查TypeScript编译
function checkTypeScriptCompilation() {
  console.log('\n🔍 检查TypeScript编译...\n');
  
  try {
    const { execSync } = require('child_process');
    execSync('npx tsc --noEmit', { stdio: 'inherit' });
    console.log('✅ TypeScript编译检查通过');
    return true;
  } catch (error) {
    console.log('❌ TypeScript编译检查失败');
    return false;
  }
}

// 主函数
function main() {
  console.log('🎮 游戏资源测试脚本\n');
  console.log('=' .repeat(50));
  
  const assetsOk = checkGameAssets();
  const tsOk = checkTypeScriptCompilation();
  
  console.log('\n' + '=' .repeat(50));
  console.log('📋 测试总结:');
  console.log(`   - 资源文件: ${assetsOk ? '✅ 正常' : '❌ 异常'}`);
  console.log(`   - TypeScript: ${tsOk ? '✅ 正常' : '❌ 异常'}`);
  console.log(`   - 总体状态: ${assetsOk && tsOk ? '✅ 通过' : '❌ 失败'}`);
  
  if (assetsOk && tsOk) {
    console.log('\n🎉 所有检查都通过了！游戏应该可以正常运行。');
    console.log('   访问 http://localhost:3000/top-down-game 来测试游戏。');
  } else {
    console.log('\n⚠️  请修复上述问题后再运行游戏。');
  }
}

// 运行测试
if (require.main === module) {
  main();
}

module.exports = { checkGameAssets, checkTypeScriptCompilation };