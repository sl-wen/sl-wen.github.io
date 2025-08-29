export interface HelpCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  articles: HelpArticle[];
}

export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  lastUpdated: string;
}

export class HelpManager {
  private static instance: HelpManager;
  private categories: Map<string, HelpCategory> = new Map();
  private searchHistory: string[] = [];
  private favorites: string[] = [];

  private constructor() {
    this.initializeHelpContent();
  }

  public static getInstance(): HelpManager {
    if (!HelpManager.instance) {
      HelpManager.instance = new HelpManager();
    }
    return HelpManager.instance;
  }

  private initializeHelpContent(): void {
    // 基础操作帮助
    this.addCategory({
      id: 'basic_controls',
      name: '基础操作',
      icon: '🎮',
      description: '学习游戏的基本操作和控制',
      articles: [
        {
          id: 'movement_controls',
          title: '角色移动',
          content: `
## 角色移动

### 键盘控制
- **W** 或 **↑** - 向上移动
- **S** 或 **↓** - 向下移动
- **A** 或 **←** - 向左移动
- **D** 或 **→** - 向右移动

### 移动技巧
- 角色会按照网格移动，确保精确的位置控制
- 移动时会有动画效果
- 在移动过程中无法进行其他操作
          `,
          tags: ['移动', '控制', '基础'],
          difficulty: 'beginner',
          lastUpdated: '2025-01-01'
        },
        {
          id: 'combat_controls',
          title: '战斗操作',
          content: `
## 战斗操作

### 攻击
- **空格键** - 攻击敌人
- 需要先获得武器才能攻击
- 攻击有冷却时间

### 战斗技巧
- 观察敌人的攻击模式
- 在敌人攻击后寻找反击机会
- 保持适当的距离
- 利用地形优势
          `,
          tags: ['战斗', '攻击', '技巧'],
          difficulty: 'beginner',
          lastUpdated: '2025-01-01'
        },
        {
          id: 'interaction_controls',
          title: '交互操作',
          content: `
## 交互操作

### 基本交互
- **回车键** - 与NPC对话
- **回车键** - 与物品交互
- **回车键** - 激活特殊功能

### 交互提示
- 可交互的对象会有特殊标记
- 靠近对象时会显示交互提示
- 某些交互需要特定条件
          `,
          tags: ['交互', '对话', 'NPC'],
          difficulty: 'beginner',
          lastUpdated: '2025-01-01'
        }
      ]
    });

    // 游戏系统帮助
    this.addCategory({
      id: 'game_systems',
      name: '游戏系统',
      icon: '⚙️',
      description: '了解游戏的各种系统',
      articles: [
        {
          id: 'inventory_system',
          title: '背包系统',
          content: `
## 背包系统

### 打开背包
- 按 **I** 键打开背包
- 背包显示所有收集的物品

### 物品类型
- **装备** - 武器、防具等
- **消耗品** - 药水、食物等
- **材料** - 制作材料
- **任务物品** - 任务相关物品

### 物品管理
- 物品会自动分类
- 可以查看物品详细信息
- 某些物品可以堆叠
          `,
          tags: ['背包', '物品', '管理'],
          difficulty: 'beginner',
          lastUpdated: '2025-01-01'
        },
        {
          id: 'crafting_system',
          title: '制作系统',
          content: `
## 制作系统

### 制作界面
- 在背包中点击制作标签页
- 显示所有可制作的配方

### 制作流程
1. 选择要制作的物品
2. 确认材料是否足够
3. 点击制作按钮
4. 等待制作完成

### 制作技巧
- 收集足够的材料
- 注意制作成功率
- 制作会获得经验值
- 某些配方需要解锁
          `,
          tags: ['制作', '配方', '材料'],
          difficulty: 'intermediate',
          lastUpdated: '2025-01-01'
        },
        {
          id: 'shop_system',
          title: '商店系统',
          content: `
## 商店系统

### 商店功能
- 购买物品
- 出售物品
- 查看价格
- 声望系统

### 交易技巧
- 比较不同商店的价格
- 注意物品的稀有度
- 提升商店声望获得优惠
- 某些物品只能在特定商店购买
          `,
          tags: ['商店', '交易', '声望'],
          difficulty: 'intermediate',
          lastUpdated: '2025-01-01'
        }
      ]
    });

    // 游戏机制帮助
    this.addCategory({
      id: 'game_mechanics',
      name: '游戏机制',
      icon: '🎯',
      description: '深入了解游戏机制',
      articles: [
        {
          id: 'combat_mechanics',
          title: '战斗机制',
          content: `
## 战斗机制

### 伤害计算
- 基础伤害 + 武器伤害 + 属性加成
- 敌人有防御值
- 暴击会造成额外伤害

### 战斗状态
- **正常状态** - 可以自由行动
- **攻击状态** - 正在攻击，无法移动
- **受伤状态** - 受到伤害，短暂无敌时间

### 敌人类型
- **普通敌人** - 基础AI，容易对付
- **精英敌人** - 更强的属性和技能
- **Boss敌人** - 具有特殊技能和机制
          `,
          tags: ['战斗', '机制', '敌人'],
          difficulty: 'intermediate',
          lastUpdated: '2025-01-01'
        },
        {
          id: 'level_system',
          title: '等级系统',
          content: `
## 等级系统

### 经验获取
- 击败敌人
- 完成任务
- 制作物品
- 探索地图

### 等级提升
- 增加最大生命值
- 提升攻击力
- 解锁新能力
- 获得技能点

### 技能树
- 分配技能点
- 解锁新技能
- 提升技能等级
- 选择技能分支
          `,
          tags: ['等级', '经验', '技能'],
          difficulty: 'intermediate',
          lastUpdated: '2025-01-01'
        },
        {
          id: 'quest_system',
          title: '任务系统',
          content: `
## 任务系统

### 任务类型
- **主线任务** - 推进故事剧情
- **支线任务** - 获得额外奖励
- **日常任务** - 每日可重复完成
- **成就任务** - 长期目标

### 任务流程
1. 接受任务
2. 查看任务目标
3. 完成任务要求
4. 返回交任务
5. 获得奖励

### 任务技巧
- 同时进行多个任务
- 注意任务时间限制
- 某些任务有特殊要求
- 任务奖励会随等级提升
          `,
          tags: ['任务', '剧情', '奖励'],
          difficulty: 'beginner',
          lastUpdated: '2025-01-01'
        }
      ]
    });

    // 高级技巧帮助
    this.addCategory({
      id: 'advanced_tips',
      name: '高级技巧',
      icon: '🏆',
      description: '掌握高级游戏技巧',
      articles: [
        {
          id: 'combat_advanced',
          title: '高级战斗技巧',
          content: `
## 高级战斗技巧

### 连击系统
- 连续攻击可以造成额外伤害
- 不同武器有不同的连击模式
- 掌握连击时机很重要

### 闪避技巧
- 在敌人攻击前移动
- 利用地形进行闪避
- 某些技能可以无敌闪避

### 团队配合
- 与NPC配合战斗
- 利用不同角色的技能
- 制定战斗策略
          `,
          tags: ['战斗', '技巧', '高级'],
          difficulty: 'advanced',
          lastUpdated: '2025-01-01'
        },
        {
          id: 'economy_management',
          title: '经济管理',
          content: `
## 经济管理

### 金币获取
- 击败敌人掉落
- 完成任务奖励
- 出售物品
- 探索隐藏宝箱

### 金币使用
- 购买装备和物品
- 升级技能
- 解锁新功能
- 投资商店声望

### 经济策略
- 平衡收支
- 投资有价值的物品
- 关注市场价格变化
- 建立稳定的收入来源
          `,
          tags: ['经济', '金币', '策略'],
          difficulty: 'advanced',
          lastUpdated: '2025-01-01'
        },
        {
          id: 'speed_running',
          title: '速通技巧',
          content: `
## 速通技巧

### 路线优化
- 规划最优路径
- 避免不必要的战斗
- 利用传送点

### 资源管理
- 合理分配技能点
- 选择关键装备
- 优化制作配方

### 时间节省
- 跳过可选内容
- 使用快捷键
- 熟悉游戏机制
          `,
          tags: ['速通', '优化', '技巧'],
          difficulty: 'advanced',
          lastUpdated: '2025-01-01'
        }
      ]
    });

    // 故障排除帮助
    this.addCategory({
      id: 'troubleshooting',
      name: '故障排除',
      icon: '🔧',
      description: '解决常见问题',
      articles: [
        {
          id: 'performance_issues',
          title: '性能问题',
          content: `
## 性能问题

### 常见问题
- 游戏运行缓慢
- 画面卡顿
- 加载时间过长

### 解决方案
1. 降低图形设置
2. 关闭不必要的程序
3. 更新显卡驱动
4. 检查系统要求

### 优化建议
- 使用推荐的设置
- 定期清理缓存
- 保持系统更新
          `,
          tags: ['性能', '优化', '问题'],
          difficulty: 'beginner',
          lastUpdated: '2025-01-01'
        },
        {
          id: 'control_issues',
          title: '控制问题',
          content: `
## 控制问题

### 常见问题
- 按键无响应
- 角色移动异常
- 菜单无法打开

### 解决方案
1. 检查按键设置
2. 重新连接输入设备
3. 重启游戏
4. 检查浏览器兼容性

### 控制设置
- 自定义按键绑定
- 调整鼠标灵敏度
- 启用/禁用触摸控制
          `,
          tags: ['控制', '按键', '设置'],
          difficulty: 'beginner',
          lastUpdated: '2025-01-01'
        },
        {
          id: 'save_issues',
          title: '存档问题',
          content: `
## 存档问题

### 常见问题
- 存档丢失
- 无法保存游戏
- 存档损坏

### 解决方案
1. 检查存储空间
2. 清除浏览器缓存
3. 使用云存档
4. 联系技术支持

### 存档管理
- 定期备份存档
- 使用多个存档槽
- 避免在重要时刻关闭游戏
          `,
          tags: ['存档', '保存', '备份'],
          difficulty: 'beginner',
          lastUpdated: '2025-01-01'
        }
      ]
    });
  }

  private addCategory(category: HelpCategory): void {
    this.categories.set(category.id, category);
  }

  // 获取所有分类
  public getAllCategories(): HelpCategory[] {
    return Array.from(this.categories.values());
  }

  // 获取分类
  public getCategory(categoryId: string): HelpCategory | undefined {
    return this.categories.get(categoryId);
  }

  // 获取文章
  public getArticle(categoryId: string, articleId: string): HelpArticle | undefined {
    const category = this.categories.get(categoryId);
    return category?.articles.find(article => article.id === articleId);
  }

  // 搜索文章
  public searchArticles(query: string): HelpArticle[] {
    const results: HelpArticle[] = [];
    const lowerQuery = query.toLowerCase();

    this.categories.forEach(category => {
      category.articles.forEach(article => {
        if (
          article.title.toLowerCase().includes(lowerQuery) ||
          article.content.toLowerCase().includes(lowerQuery) ||
          article.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        ) {
          results.push(article);
        }
      });
    });

    return results;
  }

  // 按难度筛选文章
  public getArticlesByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): HelpArticle[] {
    const results: HelpArticle[] = [];

    this.categories.forEach(category => {
      category.articles.forEach(article => {
        if (article.difficulty === difficulty) {
          results.push(article);
        }
      });
    });

    return results;
  }

  // 按标签筛选文章
  public getArticlesByTag(tag: string): HelpArticle[] {
    const results: HelpArticle[] = [];

    this.categories.forEach(category => {
      category.articles.forEach(article => {
        if (article.tags.includes(tag)) {
          results.push(article);
        }
      });
    });

    return results;
  }

  // 获取所有标签
  public getAllTags(): string[] {
    const tags = new Set<string>();

    this.categories.forEach(category => {
      category.articles.forEach(article => {
        article.tags.forEach(tag => tags.add(tag));
      });
    });

    return Array.from(tags).sort();
  }

  // 搜索历史
  public addToSearchHistory(query: string): void {
    if (query.trim()) {
      this.searchHistory = [query, ...this.searchHistory.filter(q => q !== query)].slice(0, 10);
      this.saveSearchHistory();
    }
  }

  public getSearchHistory(): string[] {
    return [...this.searchHistory];
  }

  public clearSearchHistory(): void {
    this.searchHistory = [];
    this.saveSearchHistory();
  }

  // 收藏功能
  public addToFavorites(articleId: string): void {
    if (!this.favorites.includes(articleId)) {
      this.favorites.push(articleId);
      this.saveFavorites();
    }
  }

  public removeFromFavorites(articleId: string): void {
    this.favorites = this.favorites.filter(id => id !== articleId);
    this.saveFavorites();
  }

  public getFavorites(): HelpArticle[] {
    const results: HelpArticle[] = [];

    this.categories.forEach(category => {
      category.articles.forEach(article => {
        if (this.favorites.includes(article.id)) {
          results.push(article);
        }
      });
    });

    return results;
  }

  public isFavorite(articleId: string): boolean {
    return this.favorites.includes(articleId);
  }

  // 获取热门文章
  public getPopularArticles(): HelpArticle[] {
    // 这里可以根据访问统计返回热门文章
    // 暂时返回所有文章
    const results: HelpArticle[] = [];

    this.categories.forEach(category => {
      results.push(...category.articles);
    });

    return results.slice(0, 10);
  }

  // 获取最近更新
  public getRecentlyUpdated(): HelpArticle[] {
    const results: HelpArticle[] = [];

    this.categories.forEach(category => {
      results.push(...category.articles);
    });

    return results
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
      .slice(0, 10);
  }

  // 数据持久化
  private saveSearchHistory(): void {
    try {
      localStorage.setItem('help_search_history', JSON.stringify(this.searchHistory));
    } catch (error) {
      console.error('保存搜索历史失败:', error);
    }
  }

  private loadSearchHistory(): void {
    try {
      const saved = localStorage.getItem('help_search_history');
      if (saved) {
        this.searchHistory = JSON.parse(saved);
      }
    } catch (error) {
      console.error('加载搜索历史失败:', error);
    }
  }

  private saveFavorites(): void {
    try {
      localStorage.setItem('help_favorites', JSON.stringify(this.favorites));
    } catch (error) {
      console.error('保存收藏失败:', error);
    }
  }

  private loadFavorites(): void {
    try {
      const saved = localStorage.getItem('help_favorites');
      if (saved) {
        this.favorites = JSON.parse(saved);
      }
    } catch (error) {
      console.error('加载收藏失败:', error);
    }
  }

  // 初始化
  public initialize(): void {
    this.loadSearchHistory();
    this.loadFavorites();
  }
}