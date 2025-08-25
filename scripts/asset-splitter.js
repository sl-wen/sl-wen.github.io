#!/usr/bin/env node

/**
 * Farm Assets Splitter
 * 自动分割农场素材图集为单独的精灵文件
 */

const fs = require('fs').promises;
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

class FarmAssetSplitter {
    constructor() {
        this.inputDir = path.join(process.cwd(), 'public', 'assets', 'farm-assets');
        this.outputDir = path.join(process.cwd(), 'public', 'assets', 'sprites');
        this.catalogFile = path.join(process.cwd(), 'asset-catalog.json');
        this.catalog = {
            generated: new Date().toISOString(),
            atlases: {},
            sprites: {}
        };
    }

    /**
     * 初始化输出目录
     */
    async initializeOutputDir() {
        try {
            await fs.mkdir(this.outputDir, { recursive: true });
            
            // 创建子目录
            const subdirs = ['overworld', 'plants', 'objects', 'characters', 'ui', 'animals', 'tilesets'];
            for (const subdir of subdirs) {
                await fs.mkdir(path.join(this.outputDir, subdir), { recursive: true });
            }
            
            console.log('✅ 输出目录初始化完成');
        } catch (error) {
            console.error('❌ 初始化输出目录失败:', error);
            throw error;
        }
    }

    /**
     * 分割 Overworld.png 图集
     */
    async splitOverworldAtlas() {
        const atlasPath = path.join(this.inputDir, 'Overworld.png');
        
        try {
            const image = await loadImage(atlasPath);
            console.log(`📂 处理 Overworld.png (${image.width}x${image.height})`);
            
            // Overworld 精灵定义 - 基于32x32网格
            const overworldSprites = [
                // 地形类 (32x32)
                { name: 'grass_basic', x: 0, y: 0, width: 32, height: 32, category: 'terrain' },
                { name: 'grass_flowers', x: 32, y: 0, width: 32, height: 32, category: 'terrain' },
                { name: 'dirt_basic', x: 64, y: 0, width: 32, height: 32, category: 'terrain' },
                { name: 'dirt_tilled', x: 96, y: 0, width: 32, height: 32, category: 'terrain' },
                { name: 'stone_path', x: 128, y: 0, width: 32, height: 32, category: 'terrain' },
                { name: 'water_basic', x: 160, y: 0, width: 32, height: 32, category: 'terrain' },
                
                // 建筑类 (多种尺寸)
                { name: 'house_small', x: 0, y: 32, width: 64, height: 64, category: 'buildings' },
                { name: 'barn', x: 64, y: 32, width: 96, height: 64, category: 'buildings' },
                { name: 'well', x: 160, y: 32, width: 32, height: 48, category: 'buildings' },
                
                // 装饰物
                { name: 'tree_oak', x: 0, y: 96, width: 48, height: 64, category: 'decorations' },
                { name: 'tree_pine', x: 48, y: 96, width: 32, height: 64, category: 'decorations' },
                { name: 'bush_small', x: 80, y: 96, width: 16, height: 16, category: 'decorations' },
                { name: 'rock_small', x: 96, y: 96, width: 16, height: 16, category: 'decorations' },
                { name: 'rock_large', x: 112, y: 96, width: 32, height: 24, category: 'decorations' },
                
                // 围栏系统
                { name: 'fence_horizontal', x: 0, y: 160, width: 32, height: 16, category: 'fences' },
                { name: 'fence_vertical', x: 32, y: 160, width: 16, height: 32, category: 'fences' },
                { name: 'fence_corner_tl', x: 48, y: 160, width: 16, height: 16, category: 'fences' },
                { name: 'fence_corner_tr', x: 64, y: 160, width: 16, height: 16, category: 'fences' },
                { name: 'fence_corner_bl', x: 48, y: 176, width: 16, height: 16, category: 'fences' },
                { name: 'fence_corner_br', x: 64, y: 176, width: 16, height: 16, category: 'fences' },
                
                // 道路系统
                { name: 'road_straight_h', x: 0, y: 192, width: 32, height: 32, category: 'roads' },
                { name: 'road_straight_v', x: 32, y: 192, width: 32, height: 32, category: 'roads' },
                { name: 'road_corner_tl', x: 64, y: 192, width: 32, height: 32, category: 'roads' },
                { name: 'road_corner_tr', x: 96, y: 192, width: 32, height: 32, category: 'roads' },
                { name: 'road_corner_bl', x: 64, y: 224, width: 32, height: 32, category: 'roads' },
                { name: 'road_corner_br', x: 96, y: 224, width: 32, height: 32, category: 'roads' },
                { name: 'road_cross', x: 128, y: 192, width: 32, height: 32, category: 'roads' },
                { name: 'road_t_up', x: 160, y: 192, width: 32, height: 32, category: 'roads' },
                { name: 'road_t_down', x: 192, y: 192, width: 32, height: 32, category: 'roads' },
                { name: 'road_t_left', x: 128, y: 224, width: 32, height: 32, category: 'roads' },
                { name: 'road_t_right', x: 160, y: 224, width: 32, height: 32, category: 'roads' },
            ];

            await this.extractSprites(image, overworldSprites, 'overworld', 'Overworld.png');
            
        } catch (error) {
            console.error('❌ 处理 Overworld.png 失败:', error);
        }
    }

    /**
     * 分割 Plants.png 图集
     */
    async splitPlantsAtlas() {
        const atlasPath = path.join(this.inputDir, 'Plants.png');
        
        try {
            const image = await loadImage(atlasPath);
            console.log(`📂 处理 Plants.png (${image.width}x${image.height})`);
            
            // Plants 精灵定义 - 基于16x16网格，包含生长阶段
            const plantSprites = [
                // 小麦生长阶段
                { name: 'wheat_stage_1', x: 0, y: 0, width: 16, height: 16, category: 'crops' },
                { name: 'wheat_stage_2', x: 16, y: 0, width: 16, height: 16, category: 'crops' },
                { name: 'wheat_stage_3', x: 32, y: 0, width: 16, height: 16, category: 'crops' },
                { name: 'wheat_stage_4', x: 48, y: 0, width: 16, height: 16, category: 'crops' },
                { name: 'wheat_harvest', x: 64, y: 0, width: 16, height: 16, category: 'crops' },
                
                // 胡萝卜生长阶段
                { name: 'carrot_stage_1', x: 0, y: 16, width: 16, height: 16, category: 'crops' },
                { name: 'carrot_stage_2', x: 16, y: 16, width: 16, height: 16, category: 'crops' },
                { name: 'carrot_stage_3', x: 32, y: 16, width: 16, height: 16, category: 'crops' },
                { name: 'carrot_stage_4', x: 48, y: 16, width: 16, height: 16, category: 'crops' },
                { name: 'carrot_harvest', x: 64, y: 16, width: 16, height: 16, category: 'crops' },
                
                // 土豆生长阶段
                { name: 'potato_stage_1', x: 0, y: 32, width: 16, height: 16, category: 'crops' },
                { name: 'potato_stage_2', x: 16, y: 32, width: 16, height: 16, category: 'crops' },
                { name: 'potato_stage_3', x: 32, y: 32, width: 16, height: 16, category: 'crops' },
                { name: 'potato_stage_4', x: 48, y: 32, width: 16, height: 16, category: 'crops' },
                { name: 'potato_harvest', x: 64, y: 32, width: 16, height: 16, category: 'crops' },
                
                // 花朵 (基于用户提供的坐标)
                { name: 'flower_red', x: 248, y: 128, width: 8, height: 8, category: 'flowers' },
                { name: 'flower_blue', x: 256, y: 128, width: 8, height: 8, category: 'flowers' },
                { name: 'flower_yellow', x: 256, y: 136, width: 8, height: 8, category: 'flowers' },
                { name: 'flower_white', x: 248, y: 136, width: 8, height: 8, category: 'flowers' },
                { name: 'flower_pink', x: 248, y: 144, width: 8, height: 8, category: 'flowers' },
                { name: 'flower_purple', x: 256, y: 144, width: 8, height: 8, category: 'flowers' },
                { name: 'flower_orange', x: 248, y: 152, width: 8, height: 8, category: 'flowers' },
                { name: 'flower_green', x: 256, y: 152, width: 8, height: 8, category: 'flowers' },
                
                // 树木和灌木
                { name: 'sapling', x: 0, y: 48, width: 16, height: 16, category: 'trees' },
                { name: 'young_tree', x: 16, y: 48, width: 16, height: 32, category: 'trees' },
                { name: 'mature_tree', x: 32, y: 48, width: 32, height: 48, category: 'trees' },
                
                // 野生植物
                { name: 'grass_wild', x: 0, y: 64, width: 16, height: 16, category: 'wild' },
                { name: 'mushroom_red', x: 16, y: 64, width: 8, height: 8, category: 'wild' },
                { name: 'mushroom_brown', x: 24, y: 64, width: 8, height: 8, category: 'wild' },
                { name: 'berries', x: 32, y: 64, width: 16, height: 16, category: 'wild' },
            ];

            await this.extractSprites(image, plantSprites, 'plants', 'Plants.png');
            
        } catch (error) {
            console.error('❌ 处理 Plants.png 失败:', error);
        }
    }

    /**
     * 分割 Objects.png 图集
     */
    async splitObjectsAtlas() {
        const atlasPath = path.join(this.inputDir, 'objects.png');
        
        try {
            const image = await loadImage(atlasPath);
            console.log(`📂 处理 objects.png (${image.width}x${image.height})`);
            
            // Objects 精灵定义 - 工具和物品
            const objectSprites = [
                // 工具类 (16x16)
                { name: 'hoe', x: 0, y: 0, width: 16, height: 16, category: 'tools' },
                { name: 'watering_can', x: 16, y: 0, width: 16, height: 16, category: 'tools' },
                { name: 'axe', x: 32, y: 0, width: 16, height: 16, category: 'tools' },
                { name: 'pickaxe', x: 48, y: 0, width: 16, height: 16, category: 'tools' },
                { name: 'scythe', x: 64, y: 0, width: 16, height: 16, category: 'tools' },
                { name: 'shovel', x: 80, y: 0, width: 16, height: 16, category: 'tools' },
                
                // 种子包
                { name: 'seeds_wheat', x: 0, y: 16, width: 16, height: 16, category: 'seeds' },
                { name: 'seeds_carrot', x: 16, y: 16, width: 16, height: 16, category: 'seeds' },
                { name: 'seeds_potato', x: 32, y: 16, width: 16, height: 16, category: 'seeds' },
                { name: 'seeds_corn', x: 48, y: 16, width: 16, height: 16, category: 'seeds' },
                
                // 容器和存储
                { name: 'chest_wooden', x: 0, y: 32, width: 16, height: 16, category: 'storage' },
                { name: 'chest_metal', x: 16, y: 32, width: 16, height: 16, category: 'storage' },
                { name: 'barrel', x: 32, y: 32, width: 16, height: 16, category: 'storage' },
                { name: 'crate', x: 48, y: 32, width: 16, height: 16, category: 'storage' },
                { name: 'sack', x: 64, y: 32, width: 16, height: 16, category: 'storage' },
                
                // 装饰物品
                { name: 'scarecrow', x: 0, y: 48, width: 16, height: 32, category: 'decorations' },
                { name: 'mailbox', x: 16, y: 48, width: 16, height: 16, category: 'decorations' },
                { name: 'signpost', x: 32, y: 48, width: 16, height: 24, category: 'decorations' },
                { name: 'lantern', x: 48, y: 48, width: 12, height: 16, category: 'decorations' },
                
                // 食物和产品
                { name: 'bread', x: 0, y: 80, width: 16, height: 16, category: 'food' },
                { name: 'milk', x: 16, y: 80, width: 16, height: 16, category: 'food' },
                { name: 'cheese', x: 32, y: 80, width: 16, height: 16, category: 'food' },
                { name: 'egg', x: 48, y: 80, width: 16, height: 16, category: 'food' },
            ];

            await this.extractSprites(image, objectSprites, 'objects', 'objects.png');
            
        } catch (error) {
            console.error('❌ 处理 objects.png 失败:', error);
        }
    }

    /**
     * 分割 Character.png 图集
     */
    async splitCharacterAtlas() {
        const atlasPath = path.join(this.inputDir, 'character.png');
        
        try {
            const image = await loadImage(atlasPath);
            console.log(`📂 处理 character.png (${image.width}x${image.height})`);
            
            // Character 精灵定义 - 角色动画帧
            const characterSprites = [
                // 玩家角色 - 向下行走
                { name: 'player_down_idle', x: 0, y: 0, width: 16, height: 16, category: 'player' },
                { name: 'player_down_walk1', x: 16, y: 0, width: 16, height: 16, category: 'player' },
                { name: 'player_down_walk2', x: 32, y: 0, width: 16, height: 16, category: 'player' },
                { name: 'player_down_walk3', x: 48, y: 0, width: 16, height: 16, category: 'player' },
                
                // 玩家角色 - 向上行走
                { name: 'player_up_idle', x: 0, y: 16, width: 16, height: 16, category: 'player' },
                { name: 'player_up_walk1', x: 16, y: 16, width: 16, height: 16, category: 'player' },
                { name: 'player_up_walk2', x: 32, y: 16, width: 16, height: 16, category: 'player' },
                { name: 'player_up_walk3', x: 48, y: 16, width: 16, height: 16, category: 'player' },
                
                // 玩家角色 - 向左行走
                { name: 'player_left_idle', x: 0, y: 32, width: 16, height: 16, category: 'player' },
                { name: 'player_left_walk1', x: 16, y: 32, width: 16, height: 16, category: 'player' },
                { name: 'player_left_walk2', x: 32, y: 32, width: 16, height: 16, category: 'player' },
                { name: 'player_left_walk3', x: 48, y: 32, width: 16, height: 16, category: 'player' },
                
                // 玩家角色 - 向右行走
                { name: 'player_right_idle', x: 0, y: 48, width: 16, height: 16, category: 'player' },
                { name: 'player_right_walk1', x: 16, y: 48, width: 16, height: 16, category: 'player' },
                { name: 'player_right_walk2', x: 32, y: 48, width: 16, height: 16, category: 'player' },
                { name: 'player_right_walk3', x: 48, y: 48, width: 16, height: 16, category: 'player' },
                
                // 动作动画
                { name: 'player_action_hoe', x: 0, y: 64, width: 16, height: 16, category: 'actions' },
                { name: 'player_action_water', x: 16, y: 64, width: 16, height: 16, category: 'actions' },
                { name: 'player_action_harvest', x: 32, y: 64, width: 16, height: 16, category: 'actions' },
                { name: 'player_action_plant', x: 48, y: 64, width: 16, height: 16, category: 'actions' },
            ];

            await this.extractSprites(image, characterSprites, 'characters', 'character.png');
            
        } catch (error) {
            console.error('❌ 处理 character.png 失败:', error);
        }
    }

    /**
     * 提取精灵到文件
     */
    async extractSprites(atlasImage, sprites, outputSubDir, atlasName) {
        const outputPath = path.join(this.outputDir, outputSubDir);
        
        // 记录图集信息
        this.catalog.atlases[atlasName] = {
            width: atlasImage.width,
            height: atlasImage.height,
            spriteCount: sprites.length,
            outputDir: outputSubDir
        };

        for (const sprite of sprites) {
            try {
                // 创建画布
                const canvas = createCanvas(sprite.width, sprite.height);
                const ctx = canvas.getContext('2d');
                
                // 从图集中提取精灵
                ctx.drawImage(
                    atlasImage,
                    sprite.x, sprite.y, sprite.width, sprite.height,
                    0, 0, sprite.width, sprite.height
                );
                
                // 保存为PNG文件
                const filename = `${sprite.name}.png`;
                const filePath = path.join(outputPath, filename);
                const buffer = canvas.toBuffer('image/png');
                await fs.writeFile(filePath, buffer);
                
                // 记录精灵信息到目录
                this.catalog.sprites[sprite.name] = {
                    file: `sprites/${outputSubDir}/${filename}`,
                    atlas: atlasName,
                    x: sprite.x,
                    y: sprite.y,
                    width: sprite.width,
                    height: sprite.height,
                    category: sprite.category || 'misc'
                };
                
                console.log(`  ✅ 提取: ${sprite.name} (${sprite.width}x${sprite.height})`);
                
            } catch (error) {
                console.error(`  ❌ 提取失败: ${sprite.name}`, error);
            }
        }
    }

    /**
     * 处理Premium包中的资源
     */
    async processPremiumPacks() {
        const premiumSpritesDir = path.join(this.inputDir, 'Sprout Lands - Sprites - premium pack');
        const premiumUIDir = path.join(this.inputDir, 'Sprout Lands - UI Pack - Premium pack');
        
        try {
            // 处理Tilesets
            const tilesetsDir = path.join(premiumSpritesDir, 'Tilesets');
            await this.processTilesets(tilesetsDir);
            
            // 处理Animals
            const animalsDir = path.join(premiumSpritesDir, 'Animals');
            await this.processAnimals(animalsDir);
            
            // 处理UI元素
            const uiSpritesDir = path.join(premiumUIDir, 'UI Sprites');
            await this.processUISprites(uiSpritesDir);
            
        } catch (error) {
            console.error('❌ 处理Premium包失败:', error);
        }
    }

    /**
     * 处理瓦片集
     */
    async processTilesets(tilesetsDir) {
        try {
            const files = await fs.readdir(tilesetsDir);
            const pngFiles = files.filter(f => f.endsWith('.png'));
            
            for (const file of pngFiles) {
                const filePath = path.join(tilesetsDir, file);
                const image = await loadImage(filePath);
                
                console.log(`📂 处理瓦片集: ${file} (${image.width}x${image.height})`);
                
                // 自动分割为32x32的瓦片
                await this.autoSplitTileset(image, file, 32, 32);
            }
        } catch (error) {
            console.error('❌ 处理瓦片集失败:', error);
        }
    }

    /**
     * 自动分割瓦片集
     */
    async autoSplitTileset(image, filename, tileWidth, tileHeight) {
        const baseName = path.basename(filename, '.png');
        const outputPath = path.join(this.outputDir, 'tilesets', baseName);
        
        await fs.mkdir(outputPath, { recursive: true });
        
        const cols = Math.floor(image.width / tileWidth);
        const rows = Math.floor(image.height / tileHeight);
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const canvas = createCanvas(tileWidth, tileHeight);
                const ctx = canvas.getContext('2d');
                
                const x = col * tileWidth;
                const y = row * tileHeight;
                
                ctx.drawImage(image, x, y, tileWidth, tileHeight, 0, 0, tileWidth, tileHeight);
                
                const tileName = `${baseName}_${row}_${col}`;
                const tileFile = path.join(outputPath, `${tileName}.png`);
                const buffer = canvas.toBuffer('image/png');
                await fs.writeFile(tileFile, buffer);
                
                // 记录到目录
                this.catalog.sprites[tileName] = {
                    file: `sprites/tilesets/${baseName}/${tileName}.png`,
                    atlas: filename,
                    x: x,
                    y: y,
                    width: tileWidth,
                    height: tileHeight,
                    category: 'tileset'
                };
            }
        }
        
        console.log(`  ✅ 分割瓦片集: ${baseName} (${cols}x${rows} = ${cols * rows} 瓦片)`);
    }

    /**
     * 处理动物精灵
     */
    async processAnimals(animalsDir) {
        try {
            const files = await fs.readdir(animalsDir);
            const pngFiles = files.filter(f => f.endsWith('.png'));
            
            for (const file of pngFiles) {
                const filePath = path.join(animalsDir, file);
                const image = await loadImage(filePath);
                
                console.log(`📂 处理动物精灵: ${file} (${image.width}x${image.height})`);
                
                // 动物通常是16x16或32x32的精灵表
                const spriteSize = image.width <= 128 ? 16 : 32;
                await this.autoSplitAnimationSheet(image, file, spriteSize, spriteSize, 'animals');
            }
        } catch (error) {
            console.error('❌ 处理动物精灵失败:', error);
        }
    }

    /**
     * 自动分割动画精灵表
     */
    async autoSplitAnimationSheet(image, filename, frameWidth, frameHeight, category) {
        const baseName = path.basename(filename, '.png');
        const outputPath = path.join(this.outputDir, category);
        
        const cols = Math.floor(image.width / frameWidth);
        const rows = Math.floor(image.height / frameHeight);
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const canvas = createCanvas(frameWidth, frameHeight);
                const ctx = canvas.getContext('2d');
                
                const x = col * frameWidth;
                const y = row * frameHeight;
                
                ctx.drawImage(image, x, y, frameWidth, frameHeight, 0, 0, frameWidth, frameHeight);
                
                const frameName = `${baseName}_${row}_${col}`;
                const frameFile = path.join(outputPath, `${frameName}.png`);
                const buffer = canvas.toBuffer('image/png');
                await fs.writeFile(frameFile, buffer);
                
                // 记录到目录
                this.catalog.sprites[frameName] = {
                    file: `sprites/${category}/${frameName}.png`,
                    atlas: filename,
                    x: x,
                    y: y,
                    width: frameWidth,
                    height: frameHeight,
                    category: category
                };
            }
        }
        
        console.log(`  ✅ 分割动画表: ${baseName} (${cols}x${rows} = ${cols * rows} 帧)`);
    }

    /**
     * 处理UI精灵
     */
    async processUISprites(uiSpritesDir) {
        try {
            // 递归处理UI目录
            await this.processUIDirectory(uiSpritesDir);
        } catch (error) {
            console.error('❌ 处理UI精灵失败:', error);
        }
    }

    /**
     * 递归处理UI目录
     */
    async processUIDirectory(dir) {
        const items = await fs.readdir(dir, { withFileTypes: true });
        
        for (const item of items) {
            const itemPath = path.join(dir, item.name);
            
            if (item.isDirectory()) {
                await this.processUIDirectory(itemPath);
            } else if (item.name.endsWith('.png')) {
                try {
                    const image = await loadImage(itemPath);
                    const baseName = path.basename(item.name, '.png');
                    const outputFile = path.join(this.outputDir, 'ui', item.name);
                    
                    // 直接复制UI文件（通常不需要分割）
                    const canvas = createCanvas(image.width, image.height);
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(image, 0, 0);
                    
                    const buffer = canvas.toBuffer('image/png');
                    await fs.writeFile(outputFile, buffer);
                    
                    // 记录到目录
                    this.catalog.sprites[baseName] = {
                        file: `sprites/ui/${item.name}`,
                        atlas: item.name,
                        x: 0,
                        y: 0,
                        width: image.width,
                        height: image.height,
                        category: 'ui'
                    };
                    
                    console.log(`  ✅ 复制UI精灵: ${item.name} (${image.width}x${image.height})`);
                } catch (error) {
                    console.error(`  ❌ 处理UI文件失败: ${item.name}`, error);
                }
            }
        }
    }

    /**
     * 保存精灵目录
     */
    async saveCatalog() {
        try {
            const catalogData = JSON.stringify(this.catalog, null, 2);
            await fs.writeFile(this.catalogFile, catalogData);
            console.log(`✅ 精灵目录已保存: ${this.catalogFile}`);
            console.log(`📊 总计: ${Object.keys(this.catalog.sprites).length} 个精灵`);
        } catch (error) {
            console.error('❌ 保存精灵目录失败:', error);
        }
    }

    /**
     * 生成TypeScript类型定义
     */
    async generateTypeDefinitions() {
        const typeDefFile = path.join(process.cwd(), 'src', 'types', 'sprites.ts');
        
        // 确保目录存在
        await fs.mkdir(path.dirname(typeDefFile), { recursive: true });
        
        const categories = [...new Set(Object.values(this.catalog.sprites).map(s => s.category))];
        const spriteNames = Object.keys(this.catalog.sprites);
        
        const typeDefinition = `/**
 * 自动生成的精灵类型定义
 * 生成时间: ${this.catalog.generated}
 */

// 精灵分类
export type SpriteCategory = ${categories.map(c => `'${c}'`).join(' | ')};

// 所有精灵名称
export type SpriteName = ${spriteNames.map(n => `'${n}'`).join(' | ')};

// 精灵信息接口
export interface SpriteInfo {
    file: string;
    atlas: string;
    x: number;
    y: number;
    width: number;
    height: number;
    category: SpriteCategory;
}

// 精灵目录类型
export type SpriteCatalog = Record<SpriteName, SpriteInfo>;

// 按分类分组的精灵
export interface SpritesByCategory {
${categories.map(category => {
    const categorySprites = Object.entries(this.catalog.sprites)
        .filter(([_, info]) => info.category === category)
        .map(([name, _]) => name);
    return `    ${category}: [${categorySprites.map(n => `'${n}'`).join(', ')}];`;
}).join('\n')}
}
`;

        await fs.writeFile(typeDefFile, typeDefinition);
        console.log(`✅ TypeScript类型定义已生成: ${typeDefFile}`);
    }

    /**
     * 运行完整的资产分割流程
     */
    async run() {
        console.log('🚀 开始农场资产分割...\n');
        
        try {
            // 1. 初始化输出目录
            await this.initializeOutputDir();
            
            // 2. 处理主要图集
            await this.splitOverworldAtlas();
            await this.splitPlantsAtlas();
            await this.splitObjectsAtlas();
            await this.splitCharacterAtlas();
            
            // 3. 处理Premium包
            await this.processPremiumPacks();
            
            // 4. 保存精灵目录
            await this.saveCatalog();
            
            // 5. 生成TypeScript类型定义
            await this.generateTypeDefinitions();
            
            console.log('\n🎉 农场资产分割完成！');
            console.log(`📁 输出目录: ${this.outputDir}`);
            console.log(`📋 精灵目录: ${this.catalogFile}`);
            console.log(`🔧 类型定义: src/types/sprites.ts`);
            
        } catch (error) {
            console.error('❌ 资产分割失败:', error);
            process.exit(1);
        }
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    const splitter = new FarmAssetSplitter();
    splitter.run();
}

module.exports = { FarmAssetSplitter };