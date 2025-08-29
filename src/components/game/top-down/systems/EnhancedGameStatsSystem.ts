/**
 * 增强游戏数据统计系统
 * 提供详细的游戏数据分析、可视化、导出功能和高级跟踪
 */

import { storage } from '../utils';

// 统计类型
export type StatType = 'combat' | 'movement' | 'inventory' | 'quest' | 'crafting' | 'trading' | 'exploration' | 'social' | 'performance' | 'achievement' | 'custom';

// 统计周期
export type StatPeriod = 'session' | 'daily' | 'weekly' | 'monthly' | 'total' | 'custom';

// 数据类型
export type DataType = 'count' | 'duration' | 'distance' | 'damage' | 'currency' | 'experience' | 'percentage' | 'rating' | 'custom';

// 图表类型
export type ChartType = 'line' | 'bar' | 'pie' | 'scatter' | 'area' | 'radar' | 'heatmap' | 'gauge';

// 导出格式
export type ExportFormat = 'json' | 'csv' | 'excel' | 'pdf' | 'html';

// 统计指标
export interface StatMetric {
  id: string;
  name: string;
  description: string;
  type: StatType;
  dataType: DataType;
  unit: string;
  category: string;
  tags: string[];
  isVisible: boolean;
  isTracked: boolean;
  defaultValue: number;
  metadata: Record<string, any>;
}

// 统计数据点
export interface StatDataPoint {
  id: string;
  metricId: string;
  value: number;
  timestamp: number;
  period: StatPeriod;
  sessionId: string;
  playerId: string;
  context: Record<string, any>;
  metadata: Record<string, any>;
}

// 统计聚合
export interface StatAggregation {
  metricId: string;
  period: StatPeriod;
  startTime: number;
  endTime: number;
  count: number;
  sum: number;
  average: number;
  min: number;
  max: number;
  median: number;
  standardDeviation: number;
  trend: number; // 趋势值 (正数表示上升，负数表示下降)
  dataPoints: StatDataPoint[];
  metadata: Record<string, any>;
}

// 统计报告
export interface StatReport {
  id: string;
  name: string;
  description: string;
  type: StatType;
  period: StatPeriod;
  startTime: number;
  endTime: number;
  metrics: string[];
  aggregations: StatAggregation[];
  insights: StatInsight[];
  recommendations: StatRecommendation[];
  charts: StatChart[];
  metadata: Record<string, any>;
}

// 统计洞察
export interface StatInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'achievement' | 'warning' | 'opportunity';
  title: string;
  description: string;
  metricId: string;
  value: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  isRead: boolean;
  metadata: Record<string, any>;
}

// 统计建议
export interface StatRecommendation {
  id: string;
  type: 'improvement' | 'optimization' | 'goal' | 'strategy';
  title: string;
  description: string;
  metricIds: string[];
  priority: 'low' | 'medium' | 'high';
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedImpact: number;
  estimatedTime: number;
  isCompleted: boolean;
  metadata: Record<string, any>;
}

// 统计图表
export interface StatChart {
  id: string;
  name: string;
  type: ChartType;
  metricIds: string[];
  period: StatPeriod;
  startTime: number;
  endTime: number;
  config: ChartConfig;
  data: ChartData;
  metadata: Record<string, any>;
}

// 图表配置
export interface ChartConfig {
  width: number;
  height: number;
  colors: string[];
  showLegend: boolean;
  showGrid: boolean;
  showLabels: boolean;
  animation: boolean;
  responsive: boolean;
  customOptions: Record<string, any>;
}

// 图表数据
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
  metadata: Record<string, any>;
}

// 图表数据集
export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  fill: boolean;
  tension: number;
  metadata: Record<string, any>;
}

// 统计目标
export interface StatGoal {
  id: string;
  name: string;
  description: string;
  metricId: string;
  targetValue: number;
  currentValue: number;
  startTime: number;
  endTime: number;
  isCompleted: boolean;
  progress: number; // 0-100
  rewards: GoalReward[];
  metadata: Record<string, any>;
}

// 目标奖励
export interface GoalReward {
  type: 'experience' | 'currency' | 'item' | 'achievement' | 'title' | 'custom';
  value: number;
  itemId?: string;
  isClaimed: boolean;
  metadata: Record<string, any>;
}

// 统计比较
export interface StatComparison {
  id: string;
  name: string;
  description: string;
  metricId: string;
  baseline: StatAggregation;
  comparison: StatAggregation;
  difference: number;
  percentageChange: number;
  significance: 'low' | 'medium' | 'high';
  metadata: Record<string, any>;
}

// 统计事件
export interface StatEvent {
  type: 'metric_updated' | 'goal_completed' | 'insight_generated' | 'report_created' | 'chart_updated' | 'comparison_made' | 'export_generated' | 'custom';
  data?: any;
  timestamp: number;
}

// 统计配置
export interface StatConfig {
  autoTracking: boolean;
  realTimeUpdates: boolean;
  dataRetention: number; // 数据保留天数
  maxDataPoints: number;
  aggregationInterval: number; // 聚合间隔 (分钟)
  insightGeneration: boolean;
  goalTracking: boolean;
  chartGeneration: boolean;
  exportEnabled: boolean;
  privacyMode: boolean;
}

// 统计会话
export interface StatSession {
  id: string;
  startTime: number;
  endTime?: number;
  duration: number;
  playerId: string;
  metrics: Map<string, number>;
  events: StatEvent[];
  metadata: Record<string, any>;
}

export class EnhancedGameStatsSystem {
  private static instance: EnhancedGameStatsSystem;
  private scene: Phaser.Scene | null = null;
  
  // 数据存储
  private metrics: Map<string, StatMetric> = new Map();
  private dataPoints: StatDataPoint[] = [];
  private aggregations: Map<string, StatAggregation> = new Map();
  private reports: StatReport[] = [];
  private insights: StatInsight[] = [];
  private recommendations: StatRecommendation[] = [];
  private charts: StatChart[] = [];
  private goals: StatGoal[] = [];
  private comparisons: StatComparison[] = [];
  private sessions: Map<string, StatSession> = new Map();
  private events: StatEvent[] = [];
  private callbacks: Map<string, (data: any) => void> = new Map();
  
  // 配置
  private config: StatConfig = {
    autoTracking: true,
    realTimeUpdates: true,
    dataRetention: 365, // 1年
    maxDataPoints: 10000,
    aggregationInterval: 60, // 1小时
    insightGeneration: true,
    goalTracking: true,
    chartGeneration: true,
    exportEnabled: true,
    privacyMode: false
  };
  
  // 当前会话
  private currentSession: StatSession | null = null;
  private aggregationTimer: number = 0;

  private constructor() {
    this.initializeDefaultMetrics();
    this.startSession();
    this.startTimers();
  }

  public static getInstance(): EnhancedGameStatsSystem {
    if (!EnhancedGameStatsSystem.instance) {
      EnhancedGameStatsSystem.instance = new EnhancedGameStatsSystem();
    }
    return EnhancedGameStatsSystem.instance;
  }

  /**
   * 初始化增强游戏数据统计系统
   */
  public initialize(scene: Phaser.Scene): void {
    this.scene = scene;
    this.setupEventHandlers();
    console.log('增强游戏数据统计系统已初始化');
  }

  /**
   * 初始化默认指标
   */
  private initializeDefaultMetrics(): void {
    // 战斗指标
    this.addMetric({
      id: 'combat_damage_dealt',
      name: '造成伤害',
      description: '玩家造成的总伤害',
      type: 'combat',
      dataType: 'damage',
      unit: 'HP',
      category: 'combat',
      tags: ['damage', 'combat'],
      isVisible: true,
      isTracked: true,
      defaultValue: 0,
      metadata: {}
    });

    this.addMetric({
      id: 'combat_damage_taken',
      name: '受到伤害',
      description: '玩家受到的总伤害',
      type: 'combat',
      dataType: 'damage',
      unit: 'HP',
      category: 'combat',
      tags: ['damage', 'combat'],
      isVisible: true,
      isTracked: true,
      defaultValue: 0,
      metadata: {}
    });

    this.addMetric({
      id: 'combat_enemies_defeated',
      name: '击败敌人',
      description: '击败的敌人数量',
      type: 'combat',
      dataType: 'count',
      unit: '个',
      category: 'combat',
      tags: ['enemies', 'combat'],
      isVisible: true,
      isTracked: true,
      defaultValue: 0,
      metadata: {}
    });

    // 移动指标
    this.addMetric({
      id: 'movement_distance_traveled',
      name: '移动距离',
      description: '玩家移动的总距离',
      type: 'movement',
      dataType: 'distance',
      unit: 'tiles',
      category: 'movement',
      tags: ['distance', 'movement'],
      isVisible: true,
      isTracked: true,
      defaultValue: 0,
      metadata: {}
    });

    this.addMetric({
      id: 'movement_time_spent',
      name: '移动时间',
      description: '玩家移动的总时间',
      type: 'movement',
      dataType: 'duration',
      unit: 'seconds',
      category: 'movement',
      tags: ['time', 'movement'],
      isVisible: true,
      isTracked: true,
      defaultValue: 0,
      metadata: {}
    });

    // 背包指标
    this.addMetric({
      id: 'inventory_items_collected',
      name: '收集物品',
      description: '收集的物品数量',
      type: 'inventory',
      dataType: 'count',
      unit: '个',
      category: 'inventory',
      tags: ['items', 'collection'],
      isVisible: true,
      isTracked: true,
      defaultValue: 0,
      metadata: {}
    });

    this.addMetric({
      id: 'inventory_items_used',
      name: '使用物品',
      description: '使用的物品数量',
      type: 'inventory',
      dataType: 'count',
      unit: '个',
      category: 'inventory',
      tags: ['items', 'usage'],
      isVisible: true,
      isTracked: true,
      defaultValue: 0,
      metadata: {}
    });

    // 任务指标
    this.addMetric({
      id: 'quest_completed',
      name: '完成任务',
      description: '完成的任务数量',
      type: 'quest',
      dataType: 'count',
      unit: '个',
      category: 'quest',
      tags: ['quests', 'completion'],
      isVisible: true,
      isTracked: true,
      defaultValue: 0,
      metadata: {}
    });

    this.addMetric({
      id: 'quest_experience_gained',
      name: '任务经验',
      description: '从任务获得的经验',
      type: 'quest',
      dataType: 'experience',
      unit: 'XP',
      category: 'quest',
      tags: ['experience', 'quests'],
      isVisible: true,
      isTracked: true,
      defaultValue: 0,
      metadata: {}
    });

    // 制作指标
    this.addMetric({
      id: 'crafting_items_created',
      name: '制作物品',
      description: '制作的物品数量',
      type: 'crafting',
      dataType: 'count',
      unit: '个',
      category: 'crafting',
      tags: ['crafting', 'items'],
      isVisible: true,
      isTracked: true,
      defaultValue: 0,
      metadata: {}
    });

    this.addMetric({
      id: 'crafting_success_rate',
      name: '制作成功率',
      description: '制作成功的比例',
      type: 'crafting',
      dataType: 'percentage',
      unit: '%',
      category: 'crafting',
      tags: ['crafting', 'success'],
      isVisible: true,
      isTracked: true,
      defaultValue: 0,
      metadata: {}
    });

    // 交易指标
    this.addMetric({
      id: 'trading_items_sold',
      name: '出售物品',
      description: '出售的物品数量',
      type: 'trading',
      dataType: 'count',
      unit: '个',
      category: 'trading',
      tags: ['trading', 'sales'],
      isVisible: true,
      isTracked: true,
      defaultValue: 0,
      metadata: {}
    });

    this.addMetric({
      id: 'trading_currency_earned',
      name: '赚取货币',
      description: '赚取的货币数量',
      type: 'trading',
      dataType: 'currency',
      unit: 'gold',
      category: 'trading',
      tags: ['trading', 'currency'],
      isVisible: true,
      isTracked: true,
      defaultValue: 0,
      metadata: {}
    });

    // 探索指标
    this.addMetric({
      id: 'exploration_areas_discovered',
      name: '发现区域',
      description: '发现的区域数量',
      type: 'exploration',
      dataType: 'count',
      unit: '个',
      category: 'exploration',
      tags: ['exploration', 'areas'],
      isVisible: true,
      isTracked: true,
      defaultValue: 0,
      metadata: {}
    });

    this.addMetric({
      id: 'exploration_secrets_found',
      name: '发现秘密',
      description: '发现的秘密数量',
      type: 'exploration',
      dataType: 'count',
      unit: '个',
      category: 'exploration',
      tags: ['exploration', 'secrets'],
      isVisible: true,
      isTracked: true,
      defaultValue: 0,
      metadata: {}
    });

    // 性能指标
    this.addMetric({
      id: 'performance_fps_average',
      name: '平均FPS',
      description: '游戏运行的平均帧率',
      type: 'performance',
      dataType: 'count',
      unit: 'FPS',
      category: 'performance',
      tags: ['performance', 'fps'],
      isVisible: true,
      isTracked: true,
      defaultValue: 60,
      metadata: {}
    });

    this.addMetric({
      id: 'performance_memory_usage',
      name: '内存使用',
      description: '游戏内存使用量',
      type: 'performance',
      dataType: 'count',
      unit: 'MB',
      category: 'performance',
      tags: ['performance', 'memory'],
      isVisible: true,
      isTracked: true,
      defaultValue: 0,
      metadata: {}
    });
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    // 监听游戏事件
    if (this.scene) {
      this.scene.events.on('combat-damage-dealt', this.handleCombatDamageDealt, this);
      this.scene.events.on('combat-damage-taken', this.handleCombatDamageTaken, this);
      this.scene.events.on('enemy-defeated', this.handleEnemyDefeated, this);
      this.scene.events.on('player-moved', this.handlePlayerMoved, this);
      this.scene.events.on('item-collected', this.handleItemCollected, this);
      this.scene.events.on('item-used', this.handleItemUsed, this);
      this.scene.events.on('quest-completed', this.handleQuestCompleted, this);
      this.scene.events.on('item-crafted', this.handleItemCrafted, this);
      this.scene.events.on('item-sold', this.handleItemSold, this);
      this.scene.events.on('area-discovered', this.handleAreaDiscovered, this);
      this.scene.events.on('secret-found', this.handleSecretFound, this);
    }
  }

  /**
   * 开始定时器
   */
  private startTimers(): void {
    // 聚合定时器
    setInterval(() => {
      this.performAggregation();
    }, this.config.aggregationInterval * 60 * 1000);

    // 数据清理定时器
    setInterval(() => {
      this.cleanupOldData();
    }, 24 * 60 * 60 * 1000); // 每天清理一次

    // 洞察生成定时器
    if (this.config.insightGeneration) {
      setInterval(() => {
        this.generateInsights();
      }, 60 * 60 * 1000); // 每小时生成一次洞察
    }
  }

  /**
   * 开始会话
   */
  private startSession(): void {
    this.currentSession = {
      id: this.generateSessionId(),
      startTime: Date.now(),
      duration: 0,
      playerId: 'player',
      metrics: new Map(),
      events: [],
      metadata: {}
    };
    
    this.sessions.set(this.currentSession.id, this.currentSession);
    this.addEvent('custom', { sessionId: this.currentSession.id });
  }

  /**
   * 结束会话
   */
  public endSession(): void {
    if (this.currentSession) {
      this.currentSession.endTime = Date.now();
      this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;
      
      this.addEvent('custom', { 
        sessionId: this.currentSession.id, 
        duration: this.currentSession.duration 
      });
      
      this.currentSession = null;
    }
  }

  /**
   * 添加指标
   */
  public addMetric(metric: StatMetric): void {
    this.metrics.set(metric.id, metric);
    this.addEvent('custom', { metricId: metric.id, metric });
  }

  /**
   * 获取指标
   */
  public getMetric(metricId: string): StatMetric | undefined {
    return this.metrics.get(metricId);
  }

  /**
   * 获取所有指标
   */
  public getAllMetrics(): StatMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * 记录数据点
   */
  public recordDataPoint(metricId: string, value: number, context?: Record<string, any>): void {
    const metric = this.getMetric(metricId);
    if (!metric || !metric.isTracked) return;

    const dataPoint: StatDataPoint = {
      id: this.generateDataPointId(),
      metricId,
      value,
      timestamp: Date.now(),
      period: 'session',
      sessionId: this.currentSession?.id || 'unknown',
      playerId: 'player',
      context: context || {},
      metadata: {}
    };

    this.dataPoints.push(dataPoint);
    
    // 更新会话指标
    if (this.currentSession) {
      const currentValue = this.currentSession.metrics.get(metricId) || 0;
      this.currentSession.metrics.set(metricId, currentValue + value);
    }

    this.addEvent('metric_updated', { metricId, value, dataPoint });
  }

  /**
   * 获取数据点
   */
  public getDataPoints(metricId: string, period: StatPeriod = 'total', limit: number = 100): StatDataPoint[] {
    return this.dataPoints
      .filter(dp => dp.metricId === metricId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * 执行聚合
   */
  private performAggregation(): void {
    const now = Date.now();
    const period = 'daily';
    const startTime = this.getPeriodStartTime(period, now);
    const endTime = now;

    for (const metric of Array.from(this.metrics.values())) {
      const dataPoints = this.getDataPoints(metric.id, period);
      
      if (dataPoints.length > 0) {
        const values = dataPoints.map(dp => dp.value);
        const aggregation: StatAggregation = {
          metricId: metric.id,
          period,
          startTime,
          endTime,
          count: values.length,
          sum: values.reduce((a, b) => a + b, 0),
          average: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          median: this.calculateMedian(values),
          standardDeviation: this.calculateStandardDeviation(values),
          trend: this.calculateTrend(values),
          dataPoints,
          metadata: {}
        };

        const key = `${metric.id}_${period}_${startTime}`;
        this.aggregations.set(key, aggregation);
      }
    }
  }

  /**
   * 计算中位数
   */
  private calculateMedian(values: number[]): number {
    const sorted = values.sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /**
   * 计算标准差
   */
  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * 计算趋势
   */
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    return secondAvg - firstAvg;
  }

  /**
   * 获取周期开始时间
   */
  private getPeriodStartTime(period: StatPeriod, timestamp: number): number {
    const date = new Date(timestamp);
    
    switch (period) {
      case 'session':
        return this.currentSession?.startTime || timestamp;
      case 'daily':
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      case 'weekly':
        const dayOfWeek = date.getDay();
        date.setDate(date.getDate() - dayOfWeek);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      case 'monthly':
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      case 'total':
        return 0;
      default:
        return timestamp;
    }
  }

  /**
   * 生成洞察
   */
  private generateInsights(): void {
    for (const metric of Array.from(this.metrics.values())) {
      const recentData = this.getDataPoints(metric.id, 'daily', 7);
      if (recentData.length < 3) continue;

      const values = recentData.map(dp => dp.value);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const trend = this.calculateTrend(values);

      // 检测趋势
      if (Math.abs(trend) > avg * 0.2) {
        const insight: StatInsight = {
          id: this.generateInsightId(),
          type: trend > 0 ? 'achievement' : 'warning',
          title: trend > 0 ? `${metric.name}表现优秀` : `${metric.name}需要关注`,
          description: trend > 0 
            ? `${metric.name}在过去一周呈现上升趋势，表现良好。`
            : `${metric.name}在过去一周呈现下降趋势，建议关注。`,
          metricId: metric.id,
          value: avg,
          threshold: avg * 0.2,
          severity: Math.abs(trend) > avg * 0.5 ? 'high' : 'medium',
          timestamp: Date.now(),
          isRead: false,
          metadata: { trend }
        };

        this.insights.push(insight);
        this.addEvent('insight_generated', { insight });
      }

      // 检测异常值
      const stdDev = this.calculateStandardDeviation(values);
      const outliers = values.filter(v => Math.abs(v - avg) > stdDev * 2);
      
      if (outliers.length > 0) {
        const insight: StatInsight = {
          id: this.generateInsightId(),
          type: 'anomaly',
          title: `${metric.name}出现异常`,
          description: `检测到${metric.name}的异常值，可能需要关注。`,
          metricId: metric.id,
          value: outliers[0],
          threshold: avg + stdDev * 2,
          severity: 'medium',
          timestamp: Date.now(),
          isRead: false,
          metadata: { outliers }
        };

        this.insights.push(insight);
        this.addEvent('insight_generated', { insight });
      }
    }
  }

  /**
   * 创建报告
   */
  public createReport(name: string, description: string, type: StatType, period: StatPeriod, metrics: string[]): StatReport {
    const report: StatReport = {
      id: this.generateReportId(),
      name,
      description,
      type,
      period,
      startTime: this.getPeriodStartTime(period, Date.now()),
      endTime: Date.now(),
      metrics,
      aggregations: [],
      insights: [],
      recommendations: [],
      charts: [],
      metadata: {}
    };

    // 添加聚合数据
    for (const metricId of metrics) {
      const key = `${metricId}_${period}_${report.startTime}`;
      const aggregation = this.aggregations.get(key);
      if (aggregation) {
        report.aggregations.push(aggregation);
      }
    }

    // 添加相关洞察
    report.insights = this.insights.filter(insight => 
      metrics.includes(insight.metricId) && 
      insight.timestamp >= report.startTime
    );

    // 生成建议
    report.recommendations = this.generateRecommendations(report);

    // 生成图表
    if (this.config.chartGeneration) {
      report.charts = this.generateCharts(report);
    }

    this.reports.push(report);
    this.addEvent('report_created', { report });
    
    return report;
  }

  /**
   * 生成建议
   */
  private generateRecommendations(report: StatReport): StatRecommendation[] {
    const recommendations: StatRecommendation[] = [];

    for (const aggregation of report.aggregations) {
      const metric = this.getMetric(aggregation.metricId);
      if (!metric) continue;

      // 基于趋势生成建议
      if (aggregation.trend < 0) {
        recommendations.push({
          id: this.generateRecommendationId(),
          type: 'improvement',
          title: `提升${metric.name}`,
          description: `${metric.name}呈现下降趋势，建议采取措施提升。`,
          metricIds: [metric.id],
          priority: 'medium',
          difficulty: 'medium',
          estimatedImpact: Math.abs(aggregation.trend),
          estimatedTime: 60, // 分钟
          isCompleted: false,
          metadata: {}
        });
      }

      // 基于平均值生成建议
      if (aggregation.average < aggregation.max * 0.5) {
        recommendations.push({
          id: this.generateRecommendationId(),
          type: 'optimization',
          title: `优化${metric.name}`,
          description: `${metric.name}的平均值较低，有优化空间。`,
          metricIds: [metric.id],
          priority: 'low',
          difficulty: 'easy',
          estimatedImpact: aggregation.max - aggregation.average,
          estimatedTime: 30,
          isCompleted: false,
          metadata: {}
        });
      }
    }

    return recommendations;
  }

  /**
   * 生成图表
   */
  private generateCharts(report: StatReport): StatChart[] {
    const charts: StatChart[] = [];

    // 生成线图
    if (report.aggregations.length > 0) {
      const lineChart: StatChart = {
        id: this.generateChartId(),
        name: `${report.name}趋势图`,
        type: 'line',
        metricIds: report.metrics,
        period: report.period,
        startTime: report.startTime,
        endTime: report.endTime,
        config: {
          width: 800,
          height: 400,
          colors: ['#ff6384', '#36a2eb', '#cc65fe', '#ffce56'],
          showLegend: true,
          showGrid: true,
          showLabels: true,
          animation: true,
          responsive: true,
          customOptions: {}
        },
        data: {
          labels: report.aggregations.map(agg => new Date(agg.startTime).toLocaleDateString()),
          datasets: report.aggregations.map((agg, index) => ({
            label: this.getMetric(agg.metricId)?.name || agg.metricId,
            data: [agg.average],
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 2,
            fill: false,
            tension: 0.1,
            metadata: {}
          })),
          metadata: {}
        },
        metadata: {}
      };

      charts.push(lineChart);
    }

    return charts;
  }

  /**
   * 创建目标
   */
  public createGoal(name: string, description: string, metricId: string, targetValue: number, duration: number): StatGoal {
    const goal: StatGoal = {
      id: this.generateGoalId(),
      name,
      description,
      metricId,
      targetValue,
      currentValue: 0,
      startTime: Date.now(),
      endTime: Date.now() + duration * 60 * 60 * 1000, // 转换为毫秒
      isCompleted: false,
      progress: 0,
      rewards: [],
      metadata: {}
    };

    this.goals.push(goal);
    this.addEvent('custom', { goal });
    
    return goal;
  }

  /**
   * 更新目标进度
   */
  public updateGoalProgress(goalId: string, value: number): void {
    const goal = this.goals.find(g => g.id === goalId);
    if (!goal) return;

    goal.currentValue = value;
    goal.progress = Math.min(100, (value / goal.targetValue) * 100);

    if (goal.progress >= 100 && !goal.isCompleted) {
      goal.isCompleted = true;
      this.addEvent('goal_completed', { goal });
    }
  }

  /**
   * 导出数据
   */
  public exportData(format: ExportFormat, filters?: Record<string, any>): string {
    if (!this.config.exportEnabled) {
      throw new Error('导出功能已禁用');
    }

    let data: any = {};

    switch (format) {
      case 'json':
        data = {
          metrics: this.getAllMetrics(),
          dataPoints: this.dataPoints,
          aggregations: Array.from(this.aggregations.values()),
          reports: this.reports,
          insights: this.insights,
          goals: this.goals,
          sessions: Array.from(this.sessions.values())
        };
        return JSON.stringify(data, null, 2);

      case 'csv':
        return this.generateCSV(filters);

      case 'excel':
        return this.generateExcel(filters);

      case 'pdf':
        return this.generatePDF(filters);

      case 'html':
        return this.generateHTML(filters);

      default:
        throw new Error(`不支持的导出格式: ${format}`);
    }
  }

  /**
   * 生成CSV
   */
  private generateCSV(filters?: Record<string, any>): string {
    const headers = ['Metric', 'Value', 'Timestamp', 'Period'];
    const rows = this.dataPoints.map(dp => [
      this.getMetric(dp.metricId)?.name || dp.metricId,
      dp.value,
      new Date(dp.timestamp).toISOString(),
      dp.period
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * 生成Excel
   */
  private generateExcel(filters?: Record<string, any>): string {
    // 简化的Excel格式（实际实现需要Excel库）
    return this.generateCSV(filters);
  }

  /**
   * 生成PDF
   */
  private generatePDF(filters?: Record<string, any>): string {
    // 简化的PDF格式（实际实现需要PDF库）
    return `PDF Report - ${new Date().toISOString()}`;
  }

  /**
   * 生成HTML
   */
  private generateHTML(filters?: Record<string, any>): string {
    return `
      <html>
        <head>
          <title>游戏统计报告</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .metric { margin: 10px 0; padding: 10px; border: 1px solid #ccc; }
            .chart { margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1>游戏统计报告</h1>
          <p>生成时间: ${new Date().toLocaleString()}</p>
          ${this.getAllMetrics().map(metric => `
            <div class="metric">
              <h3>${metric.name}</h3>
              <p>${metric.description}</p>
              <p>类型: ${metric.type} | 单位: ${metric.unit}</p>
            </div>
          `).join('')}
        </body>
      </html>
    `;
  }

  /**
   * 清理旧数据
   */
  private cleanupOldData(): void {
    const cutoffTime = Date.now() - (this.config.dataRetention * 24 * 60 * 60 * 1000);
    
    // 清理数据点
    this.dataPoints = this.dataPoints.filter(dp => dp.timestamp > cutoffTime);
    
    // 清理聚合数据
    for (const [key, aggregation] of Array.from(this.aggregations.entries())) {
      if (aggregation.endTime < cutoffTime) {
        this.aggregations.delete(key);
      }
    }
    
    // 清理会话
    for (const [key, session] of Array.from(this.sessions.entries())) {
      if (session.endTime && session.endTime < cutoffTime) {
        this.sessions.delete(key);
      }
    }
    
    // 限制数据点数量
    if (this.dataPoints.length > this.config.maxDataPoints) {
      this.dataPoints = this.dataPoints.slice(-this.config.maxDataPoints);
    }
  }

  /**
   * 事件处理
   */
  private handleCombatDamageDealt(data: any): void {
    this.recordDataPoint('combat_damage_dealt', data.damage, { target: data.target, weapon: data.weapon });
  }

  private handleCombatDamageTaken(data: any): void {
    this.recordDataPoint('combat_damage_taken', data.damage, { source: data.source });
  }

  private handleEnemyDefeated(data: any): void {
    this.recordDataPoint('combat_enemies_defeated', 1, { enemy: data.enemy, level: data.level });
  }

  private handlePlayerMoved(data: any): void {
    this.recordDataPoint('movement_distance_traveled', data.distance, { direction: data.direction });
    this.recordDataPoint('movement_time_spent', data.duration, { speed: data.speed });
  }

  private handleItemCollected(data: any): void {
    this.recordDataPoint('inventory_items_collected', 1, { item: data.item, location: data.location });
  }

  private handleItemUsed(data: any): void {
    this.recordDataPoint('inventory_items_used', 1, { item: data.item, effect: data.effect });
  }

  private handleQuestCompleted(data: any): void {
    this.recordDataPoint('quest_completed', 1, { quest: data.quest, difficulty: data.difficulty });
    this.recordDataPoint('quest_experience_gained', data.experience, { quest: data.quest });
  }

  private handleItemCrafted(data: any): void {
    this.recordDataPoint('crafting_items_created', 1, { item: data.item, quality: data.quality });
  }

  private handleItemSold(data: any): void {
    this.recordDataPoint('trading_items_sold', 1, { item: data.item, price: data.price });
    this.recordDataPoint('trading_currency_earned', data.price, { item: data.item });
  }

  private handleAreaDiscovered(data: any): void {
    this.recordDataPoint('exploration_areas_discovered', 1, { area: data.area, type: data.type });
  }

  private handleSecretFound(data: any): void {
    this.recordDataPoint('exploration_secrets_found', 1, { secret: data.secret, location: data.location });
  }

  /**
   * 生成ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateDataPointId(): string {
    return `dp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateInsightId(): string {
    return `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRecommendationId(): string {
    return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateChartId(): string {
    return `chart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateGoalId(): string {
    return `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 添加事件
   */
  private addEvent(type: StatEvent['type'], data?: any): void {
    const event: StatEvent = {
      type,
      data,
      timestamp: Date.now()
    };
    
    this.events.push(event);
    
    if (this.events.length > 1000) {
      this.events.shift();
    }
    
    this.triggerCallback(type, data);
  }

  /**
   * 注册回调
   */
  public registerCallback(eventType: string, callback: (data: any) => void): void {
    this.callbacks.set(eventType, callback);
  }

  /**
   * 触发回调
   */
  private triggerCallback(eventType: string, data: any): void {
    const callback = this.callbacks.get(eventType);
    if (callback) {
      callback(data);
    }
  }

  /**
   * 获取统计报告
   */
  public getReports(): StatReport[] {
    return [...this.reports];
  }

  /**
   * 获取洞察
   */
  public getInsights(): StatInsight[] {
    return [...this.insights];
  }

  /**
   * 获取目标
   */
  public getGoals(): StatGoal[] {
    return [...this.goals];
  }

  /**
   * 获取图表
   */
  public getCharts(): StatChart[] {
    return [...this.charts];
  }

  /**
   * 获取统计事件
   */
  public getStatEvents(): StatEvent[] {
    return [...this.events];
  }

  /**
   * 清理资源
   */
  public destroy(): void {
    this.endSession();
    this.events = [];
    this.callbacks.clear();
    this.dataPoints = [];
    this.aggregations.clear();
    this.reports = [];
    this.insights = [];
    this.recommendations = [];
    this.charts = [];
    this.goals = [];
    this.comparisons = [];
    this.sessions.clear();
    
    this.scene = null;
    console.log('增强游戏数据统计系统已销毁');
  }
}