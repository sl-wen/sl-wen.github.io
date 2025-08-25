/**
 * 自动生成的精灵类型定义
 * 生成时间: 2025-08-25T02:05:48.676Z
 */

// 精灵分类
export type SpriteCategory = 'terrain' | 'buildings' | 'decorations' | 'fences' | 'roads' | 'crops' | 'flowers' | 'trees' | 'wild' | 'tools' | 'seeds' | 'storage' | 'food' | 'player' | 'actions' | 'ui';

// 所有精灵名称
export type SpriteName = 'grass_basic' | 'grass_flowers' | 'dirt_basic' | 'dirt_tilled' | 'stone_path' | 'water_basic' | 'house_small' | 'barn' | 'well' | 'tree_oak' | 'tree_pine' | 'bush_small' | 'rock_small' | 'rock_large' | 'fence_horizontal' | 'fence_vertical' | 'fence_corner_tl' | 'fence_corner_tr' | 'fence_corner_bl' | 'fence_corner_br' | 'road_straight_h' | 'road_straight_v' | 'road_corner_tl' | 'road_corner_tr' | 'road_corner_bl' | 'road_corner_br' | 'road_cross' | 'road_t_up' | 'road_t_down' | 'road_t_left' | 'road_t_right' | 'wheat_stage_1' | 'wheat_stage_2' | 'wheat_stage_3' | 'wheat_stage_4' | 'wheat_harvest' | 'carrot_stage_1' | 'carrot_stage_2' | 'carrot_stage_3' | 'carrot_stage_4' | 'carrot_harvest' | 'potato_stage_1' | 'potato_stage_2' | 'potato_stage_3' | 'potato_stage_4' | 'potato_harvest' | 'flower_red' | 'flower_blue' | 'flower_yellow' | 'flower_white' | 'flower_pink' | 'flower_purple' | 'flower_orange' | 'flower_green' | 'sapling' | 'young_tree' | 'mature_tree' | 'grass_wild' | 'mushroom_red' | 'mushroom_brown' | 'berries' | 'hoe' | 'watering_can' | 'axe' | 'pickaxe' | 'scythe' | 'shovel' | 'seeds_wheat' | 'seeds_carrot' | 'seeds_potato' | 'seeds_corn' | 'chest_wooden' | 'chest_metal' | 'barrel' | 'crate' | 'sack' | 'scarecrow' | 'mailbox' | 'signpost' | 'lantern' | 'bread' | 'milk' | 'cheese' | 'egg' | 'player_down_idle' | 'player_down_walk1' | 'player_down_walk2' | 'player_down_walk3' | 'player_up_idle' | 'player_up_walk1' | 'player_up_walk2' | 'player_up_walk3' | 'player_left_idle' | 'player_left_walk1' | 'player_left_walk2' | 'player_left_walk3' | 'player_right_idle' | 'player_right_walk1' | 'player_right_walk2' | 'player_right_walk3' | 'player_action_hoe' | 'player_action_water' | 'player_action_harvest' | 'player_action_plant' | 'ALL UI ASSETS on one sheet' | 'Teemo Basic emote animations sprite sheet' | 'Teemo premium emote animations sprite sheet-export' | 'Premade dialog box  big' | 'Premade dialog box medium' | 'Premade dialog box small' | 'dialog box big' | 'dialog box character finished talking click to continue indicator - spritesheet ' | 'dialog box medium' | 'dialog box small' | 'dialog box' | 'All Icons' | 'Hearts in wood' | 'Hearts' | 'Medium Happines-Sadness icons' | 'Small Happines-Sadness icons' | 'coins' | 'stars in wood' | 'stars' | 'white icons' | 'Arrow Mouse icon 1' | 'Arrow Mouse icon 2' | 'Arrow Mouse icon 3' | 'Catpaw Mouse icon' | 'Catpaw holding Mouse icon' | 'Catpaw pointing Mouse icon' | 'Triangle Mouse icon 1' | 'Triangle Mouse icon 2' | 'Triangle Mouse icon 3' | 'Triangle small Mouse icon 1' | 'Triangle small Mouse icon 2' | 'Triangle small Mouse icon 3' | 'Setting menu' | 'Stamina circle with black outline sprite sheet ' | 'Stamina circle with white outline sprite sheet ' | 'UI Big Play Button' | 'UI Settings Buttons' | 'X pressed' | 'X' | 'big X pressed' | 'big X' | 'big check mark pressed' | 'big check mark' | 'check mark pressed' | 'check mark' | 'darker X prssed' | 'darker X' | 'darker big X pressed' | 'darker big X' | 'darker big check mark pres' | 'darker big check mark' | 'darker check mark pressed' | 'darker check mark' | 'darker small X pressed' | 'darker small X' | 'darker small check mark pr' | 'darker small check mark' | 'small X pressed' | 'small X' | 'small check mark pressed' | 'small check mark' | 'big check marks' | 'check marks' | 'darker big check marks' | 'darker big x' | 'darker check marks' | 'darker small check marks' | 'darker small x' | 'darker x' | 'small check marks' | 'Xs and check marks' | 'Icon Buttons Spritesheet' | 'medium colored round buttons' | 'small colored round buttons' | 'Small Square Buttons' | 'Square Buttons 19x26' | 'Square Buttons 26x19' | 'Square Buttons 26x26';

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
    terrain: ['grass_basic', 'grass_flowers', 'dirt_basic', 'dirt_tilled', 'stone_path', 'water_basic'];
    buildings: ['house_small', 'barn', 'well'];
    decorations: ['tree_oak', 'tree_pine', 'bush_small', 'rock_small', 'rock_large', 'scarecrow', 'mailbox', 'signpost', 'lantern'];
    fences: ['fence_horizontal', 'fence_vertical', 'fence_corner_tl', 'fence_corner_tr', 'fence_corner_bl', 'fence_corner_br'];
    roads: ['road_straight_h', 'road_straight_v', 'road_corner_tl', 'road_corner_tr', 'road_corner_bl', 'road_corner_br', 'road_cross', 'road_t_up', 'road_t_down', 'road_t_left', 'road_t_right'];
    crops: ['wheat_stage_1', 'wheat_stage_2', 'wheat_stage_3', 'wheat_stage_4', 'wheat_harvest', 'carrot_stage_1', 'carrot_stage_2', 'carrot_stage_3', 'carrot_stage_4', 'carrot_harvest', 'potato_stage_1', 'potato_stage_2', 'potato_stage_3', 'potato_stage_4', 'potato_harvest'];
    flowers: ['flower_red', 'flower_blue', 'flower_yellow', 'flower_white', 'flower_pink', 'flower_purple', 'flower_orange', 'flower_green'];
    trees: ['sapling', 'young_tree', 'mature_tree'];
    wild: ['grass_wild', 'mushroom_red', 'mushroom_brown', 'berries'];
    tools: ['hoe', 'watering_can', 'axe', 'pickaxe', 'scythe', 'shovel'];
    seeds: ['seeds_wheat', 'seeds_carrot', 'seeds_potato', 'seeds_corn'];
    storage: ['chest_wooden', 'chest_metal', 'barrel', 'crate', 'sack'];
    food: ['bread', 'milk', 'cheese', 'egg'];
    player: ['player_down_idle', 'player_down_walk1', 'player_down_walk2', 'player_down_walk3', 'player_up_idle', 'player_up_walk1', 'player_up_walk2', 'player_up_walk3', 'player_left_idle', 'player_left_walk1', 'player_left_walk2', 'player_left_walk3', 'player_right_idle', 'player_right_walk1', 'player_right_walk2', 'player_right_walk3'];
    actions: ['player_action_hoe', 'player_action_water', 'player_action_harvest', 'player_action_plant'];
    ui: ['ALL UI ASSETS on one sheet', 'Teemo Basic emote animations sprite sheet', 'Teemo premium emote animations sprite sheet-export', 'Premade dialog box  big', 'Premade dialog box medium', 'Premade dialog box small', 'dialog box big', 'dialog box character finished talking click to continue indicator - spritesheet ', 'dialog box medium', 'dialog box small', 'dialog box', 'All Icons', 'Hearts in wood', 'Hearts', 'Medium Happines-Sadness icons', 'Small Happines-Sadness icons', 'coins', 'stars in wood', 'stars', 'white icons', 'Arrow Mouse icon 1', 'Arrow Mouse icon 2', 'Arrow Mouse icon 3', 'Catpaw Mouse icon', 'Catpaw holding Mouse icon', 'Catpaw pointing Mouse icon', 'Triangle Mouse icon 1', 'Triangle Mouse icon 2', 'Triangle Mouse icon 3', 'Triangle small Mouse icon 1', 'Triangle small Mouse icon 2', 'Triangle small Mouse icon 3', 'Setting menu', 'Stamina circle with black outline sprite sheet ', 'Stamina circle with white outline sprite sheet ', 'UI Big Play Button', 'UI Settings Buttons', 'X pressed', 'X', 'big X pressed', 'big X', 'big check mark pressed', 'big check mark', 'check mark pressed', 'check mark', 'darker X prssed', 'darker X', 'darker big X pressed', 'darker big X', 'darker big check mark pres', 'darker big check mark', 'darker check mark pressed', 'darker check mark', 'darker small X pressed', 'darker small X', 'darker small check mark pr', 'darker small check mark', 'small X pressed', 'small X', 'small check mark pressed', 'small check mark', 'big check marks', 'check marks', 'darker big check marks', 'darker big x', 'darker check marks', 'darker small check marks', 'darker small x', 'darker x', 'small check marks', 'Xs and check marks', 'Icon Buttons Spritesheet', 'medium colored round buttons', 'small colored round buttons', 'Small Square Buttons', 'Square Buttons 19x26', 'Square Buttons 26x19', 'Square Buttons 26x26'];
}
