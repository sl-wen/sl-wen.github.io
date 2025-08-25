#!/usr/bin/env node

/**
 * 运行农场资产分割器的便捷脚本
 */

const { FarmAssetSplitter } = require('./asset-splitter');
const path = require('path');
const fs = require('fs').promises;

async function checkDependencies() {
    try {
        // 检查canvas依赖
        require('canvas');
        console.log('✅ Canvas依赖检查通过');
        return true;
    } catch (error) {
        console.error('❌ Canvas依赖未安装');
        console.log('请运行: npm install canvas');
        return false;
    }
}

async function checkInputAssets() {
    const assetsDir = path.join(process.cwd(), 'public', 'assets', 'farm-assets');
    const requiredFiles = ['Overworld.png', 'Plants.png', 'objects.png', 'character.png'];
    
    console.log('🔍 检查输入资产...');
    
    for (const file of requiredFiles) {
        const filePath = path.join(assetsDir, file);
        try {
            await fs.access(filePath);
            console.log(`  ✅ ${file}`);
        } catch (error) {
            console.log(`  ❌ ${file} - 文件不存在`);
        }
    }
}

async function main() {
    console.log('🎮 农场资产分割工具\n');
    
    // 检查依赖
    if (!(await checkDependencies())) {
        process.exit(1);
    }
    
    // 检查输入文件
    await checkInputAssets();
    
    console.log('\n📝 即将执行以下操作:');
    console.log('  1. 分割 Overworld.png 为地形、建筑、装饰精灵');
    console.log('  2. 分割 Plants.png 为作物、花朵精灵');
    console.log('  3. 分割 objects.png 为工具、物品精灵');
    console.log('  4. 分割 character.png 为角色动画帧');
    console.log('  5. 处理Premium包中的额外资源');
    console.log('  6. 生成精灵目录和TypeScript类型定义');
    
    console.log('\n⚠️  注意: 这将在 public/assets/sprites/ 目录中创建大量文件');
    
    // 在生产环境中可能需要用户确认
    if (process.env.NODE_ENV !== 'development') {
        console.log('\n按 Ctrl+C 取消，或等待5秒自动开始...');
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    console.log('\n🚀 开始处理...\n');
    
    try {
        const splitter = new FarmAssetSplitter();
        await splitter.run();
        
        console.log('\n🎉 处理完成！');
        console.log('\n📋 接下来你可以:');
        console.log('  1. 使用 ImprovedSpriteManager 加载分割后的精灵');
        console.log('  2. 查看 asset-catalog.json 了解所有可用精灵');
        console.log('  3. 使用 src/types/sprites.ts 中的类型定义');
        console.log('  4. 在游戏中按分类加载精灵: loadSpritesByCategory("terrain")');
        
    } catch (error) {
        console.error('\n❌ 处理失败:', error);
        process.exit(1);
    }
}

// 运行主函数
if (require.main === module) {
    main().catch(error => {
        console.error('❌ 脚本执行失败:', error);
        process.exit(1);
    });
}

module.exports = { main };