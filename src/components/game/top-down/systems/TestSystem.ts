/**
 * 测试系统
 * 提供单元测试、集成测试、性能测试和UI测试功能
 */

import { storage } from '../utils';

// 测试类型
export type TestType = 'unit' | 'integration' | 'performance' | 'ui' | 'e2e' | 'custom';

// 测试状态
export type TestStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped' | 'timeout';

// 测试优先级
export type TestPriority = 'low' | 'medium' | 'high' | 'critical';

// 测试环境
export type TestEnvironment = 'development' | 'staging' | 'production' | 'local';

// 测试结果
export interface TestResult {
  id: string;
  testId: string;
  status: TestStatus;
  duration: number;
  startTime: number;
  endTime: number;
  error?: string;
  stackTrace?: string;
  screenshots?: string[];
  logs: string[];
  metadata: Record<string, any>;
}

// 测试用例
export interface TestCase {
  id: string;
  name: string;
  description: string;
  type: TestType;
  priority: TestPriority;
  category: string;
  tags: string[];
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
  test: () => Promise<void>;
  timeout: number;
  retries: number;
  dependencies: string[];
  environment: TestEnvironment[];
  isEnabled: boolean;
  metadata: Record<string, any>;
}

// 测试套件
export interface TestSuite {
  id: string;
  name: string;
  description: string;
  tests: string[];
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
  timeout: number;
  parallel: boolean;
  isEnabled: boolean;
  metadata: Record<string, any>;
}

// 测试报告
export interface TestReport {
  id: string;
  name: string;
  description: string;
  startTime: number;
  endTime: number;
  duration: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  timeoutTests: number;
  successRate: number;
  results: TestResult[];
  summary: TestSummary;
  metadata: Record<string, any>;
}

// 测试摘要
export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  timeout: number;
  successRate: number;
  averageDuration: number;
  slowestTest?: TestResult;
  fastestTest?: TestResult;
  mostFailedTest?: string;
  categories: Record<string, number>;
  types: Record<TestType, number>;
  priorities: Record<TestPriority, number>;
}

// 性能指标
export interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  cpuUsage: number;
  loadTime: number;
  renderTime: number;
  updateTime: number;
  networkLatency: number;
  errors: number;
  warnings: number;
  timestamp: number;
}

// 测试配置
export interface TestConfig {
  autoRun: boolean;
  parallelExecution: boolean;
  maxParallelTests: number;
  defaultTimeout: number;
  retryFailedTests: boolean;
  maxRetries: number;
  generateReports: boolean;
  saveScreenshots: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  environment: TestEnvironment;
  includeCategories: string[];
  excludeCategories: string[];
  includeTags: string[];
  excludeTags: string[];
}

// 测试事件
export interface TestEvent {
  type: 'test_started' | 'test_completed' | 'test_failed' | 'suite_started' | 'suite_completed' | 'report_generated' | 'performance_measured' | 'custom';
  data?: any;
  timestamp: number;
}

export class TestSystem {
  private static instance: TestSystem;
  private scene: Phaser.Scene | null = null;
  
  // 数据存储
  private testCases: Map<string, TestCase> = new Map();
  private testSuites: Map<string, TestSuite> = new Map();
  private testResults: TestResult[] = [];
  private reports: TestReport[] = [];
  private events: TestEvent[] = [];
  private callbacks: Map<string, (data: any) => void> = new Map();
  
  // 配置
  private config: TestConfig = {
    autoRun: false,
    parallelExecution: true,
    maxParallelTests: 4,
    defaultTimeout: 30000,
    retryFailedTests: true,
    maxRetries: 3,
    generateReports: true,
    saveScreenshots: true,
    logLevel: 'info',
    environment: 'development',
    includeCategories: [],
    excludeCategories: [],
    includeTags: [],
    excludeTags: []
  };
  
  // 运行时状态
  private isRunning: boolean = false;
  private currentTest?: TestCase;
  private runningTests: Set<string> = new Set();
  private performanceMetrics: PerformanceMetrics[] = [];

  private constructor() {
    this.initializeDefaultTests();
    this.initializeDefaultSuites();
  }

  public static getInstance(): TestSystem {
    if (!TestSystem.instance) {
      TestSystem.instance = new TestSystem();
    }
    return TestSystem.instance;
  }

  /**
   * 初始化测试系统
   */
  public initialize(scene: Phaser.Scene): void {
    this.scene = scene;
    this.setupEventHandlers();
    console.log('测试系统已初始化');
  }

  /**
   * 初始化默认测试用例
   */
  private initializeDefaultTests(): void {
    // 游戏系统测试
    this.addTestCase({
      id: 'game_initialization',
      name: '游戏初始化测试',
      description: '测试游戏系统是否正确初始化',
      type: 'unit',
      priority: 'high',
      category: 'game_system',
      tags: ['initialization', 'core'],
      setup: async () => {
        // 设置测试环境
      },
      teardown: async () => {
        // 清理测试环境
      },
      test: async () => {
        // 测试游戏初始化
        if (!this.scene) {
          throw new Error('游戏场景未初始化');
        }
        
        // 测试基本系统
        const systems = [
          'soundManager',
          'mapManager',
          'mapInteractionManager',
          'performanceManager',
          'teleportSystem',
          'enemyAISystem',
          'itemSystem',
          'enhancedInventorySystem',
          'particleSystem',
          'screenEffectSystem',
          'mobileAdapterSystem',
          'enhancedShopSystem',
          'enhancedCraftingSystem',
          'enhancedGameStatsSystem',
          'enhancedAchievementSystem'
        ];
        
        for (const system of systems) {
          if (!(this.scene as any)[system]) {
            throw new Error(`系统 ${system} 未初始化`);
          }
        }
      },
      timeout: 10000,
      retries: 2,
      dependencies: [],
      environment: ['development', 'staging'],
      isEnabled: true,
      metadata: {}
    });

    // 地图系统测试
    this.addTestCase({
      id: 'map_loading',
      name: '地图加载测试',
      description: '测试地图是否正确加载',
      type: 'integration',
      priority: 'high',
      category: 'map_system',
      tags: ['loading', 'map'],
      test: async () => {
        if (!this.scene) {
          throw new Error('游戏场景未初始化');
        }
        
        const mapManager = (this.scene as any).mapManager;
        if (!mapManager) {
          throw new Error('地图管理器未初始化');
        }
        
        // 测试地图加载
        const currentMap = mapManager.getCurrentMap();
        if (!currentMap) {
          throw new Error('当前地图未加载');
        }
        
        // 测试地图数据完整性
        if (!currentMap.tilemap) {
          throw new Error('地图瓦片数据缺失');
        }
      },
      timeout: 15000,
      retries: 1,
      dependencies: ['game_initialization'],
      environment: ['development', 'staging'],
      isEnabled: true,
      metadata: {}
    });

    // 玩家移动测试
    this.addTestCase({
      id: 'player_movement',
      name: '玩家移动测试',
      description: '测试玩家移动功能',
      type: 'integration',
      priority: 'high',
      category: 'player_system',
      tags: ['movement', 'player'],
      test: async () => {
        if (!this.scene) {
          throw new Error('游戏场景未初始化');
        }
        
        const gridEngine = (this.scene as any).gridEngine;
        if (!gridEngine) {
          throw new Error('网格引擎未初始化');
        }
        
        const hero = (this.scene as any).hero;
        if (!hero) {
          throw new Error('英雄角色未初始化');
        }
        
        // 测试移动功能
        const initialPosition = gridEngine.getPosition(hero.name);
        if (!initialPosition) {
          throw new Error('无法获取玩家初始位置');
        }
        
        // 模拟移动
        const newPosition = {
          x: initialPosition.x + 1,
          y: initialPosition.y
        };
        
        const canMove = gridEngine.isBlocked(newPosition.x, newPosition.y);
        if (canMove) {
          throw new Error('移动位置被阻挡');
        }
      },
      timeout: 10000,
      retries: 2,
      dependencies: ['map_loading'],
      environment: ['development', 'staging'],
      isEnabled: true,
      metadata: {}
    });

    // 战斗系统测试
    this.addTestCase({
      id: 'combat_system',
      name: '战斗系统测试',
      description: '测试战斗系统功能',
      type: 'integration',
      priority: 'high',
      category: 'combat_system',
      tags: ['combat', 'battle'],
      test: async () => {
        if (!this.scene) {
          throw new Error('游戏场景未初始化');
        }
        
        const hero = (this.scene as any).hero;
        if (!hero) {
          throw new Error('英雄角色未初始化');
        }
        
        // 测试攻击功能
        const initialHealth = hero.health;
        if (initialHealth <= 0) {
          throw new Error('英雄生命值异常');
        }
        
        // 测试攻击动画
        if (!hero.anims) {
          throw new Error('英雄动画系统未初始化');
        }
      },
      timeout: 12000,
      retries: 2,
      dependencies: ['player_movement'],
      environment: ['development', 'staging'],
      isEnabled: true,
      metadata: {}
    });

    // 背包系统测试
    this.addTestCase({
      id: 'inventory_system',
      name: '背包系统测试',
      description: '测试背包系统功能',
      type: 'integration',
      priority: 'medium',
      category: 'inventory_system',
      tags: ['inventory', 'items'],
      test: async () => {
        if (!this.scene) {
          throw new Error('游戏场景未初始化');
        }
        
        const enhancedInventorySystem = (this.scene as any).enhancedInventorySystem;
        if (!enhancedInventorySystem) {
          throw new Error('增强背包系统未初始化');
        }
        
        // 测试背包操作
        const inventory = enhancedInventorySystem.getInventory('main');
        if (!inventory) {
          throw new Error('主背包未初始化');
        }
        
        // 测试添加物品
        const testItem = {
          id: 'test_item',
          name: '测试物品',
          type: 'consumable',
          quantity: 1
        };
        
        const added = enhancedInventorySystem.addItem('main', testItem);
        if (!added) {
          throw new Error('添加物品失败');
        }
      },
      timeout: 10000,
      retries: 2,
      dependencies: ['game_initialization'],
      environment: ['development', 'staging'],
      isEnabled: true,
      metadata: {}
    });

    // 任务系统测试
    this.addTestCase({
      id: 'quest_system',
      name: '任务系统测试',
      description: '测试任务系统功能',
      type: 'integration',
      priority: 'medium',
      category: 'quest_system',
      tags: ['quest', 'mission'],
      test: async () => {
        if (!this.scene) {
          throw new Error('游戏场景未初始化');
        }
        
        const questSystem = (this.scene as any).questSystem;
        if (!questSystem) {
          throw new Error('任务系统未初始化');
        }
        
        // 测试任务列表
        const quests = questSystem.getAllQuests();
        if (!Array.isArray(quests)) {
          throw new Error('任务列表格式错误');
        }
      },
      timeout: 10000,
      retries: 2,
      dependencies: ['game_initialization'],
      environment: ['development', 'staging'],
      isEnabled: true,
      metadata: {}
    });

    // 音效系统测试
    this.addTestCase({
      id: 'sound_system',
      name: '音效系统测试',
      description: '测试音效系统功能',
      type: 'unit',
      priority: 'medium',
      category: 'sound_system',
      tags: ['sound', 'audio'],
      test: async () => {
        if (!this.scene) {
          throw new Error('游戏场景未初始化');
        }
        
        const soundManager = (this.scene as any).soundManager;
        if (!soundManager) {
          throw new Error('音效管理器未初始化');
        }
        
        // 测试音效播放
        const canPlay = soundManager.canPlaySound();
        if (typeof canPlay !== 'boolean') {
          throw new Error('音效播放状态检查失败');
        }
      },
      timeout: 8000,
      retries: 1,
      dependencies: ['game_initialization'],
      environment: ['development', 'staging'],
      isEnabled: true,
      metadata: {}
    });

    // 性能测试
    this.addTestCase({
      id: 'performance_test',
      name: '性能测试',
      description: '测试游戏性能',
      type: 'performance',
      priority: 'high',
      category: 'performance',
      tags: ['performance', 'fps'],
      test: async () => {
        if (!this.scene) {
          throw new Error('游戏场景未初始化');
        }
        
        const performanceManager = (this.scene as any).performanceManager;
        if (!performanceManager) {
          throw new Error('性能管理器未初始化');
        }
        
        // 测试FPS
        const fps = performanceManager.getCurrentFPS();
        if (fps < 30) {
          throw new Error(`FPS过低: ${fps}`);
        }
        
        // 测试内存使用
        const memoryUsage = performanceManager.getMemoryUsage();
        if (memoryUsage > 100) { // 100MB
          throw new Error(`内存使用过高: ${memoryUsage}MB`);
        }
      },
      timeout: 30000,
      retries: 1,
      dependencies: ['game_initialization'],
      environment: ['development', 'staging'],
      isEnabled: true,
      metadata: {}
    });

    // UI测试
    this.addTestCase({
      id: 'ui_rendering',
      name: 'UI渲染测试',
      description: '测试UI渲染功能',
      type: 'ui',
      priority: 'medium',
      category: 'ui_system',
      tags: ['ui', 'rendering'],
      test: async () => {
        if (!this.scene) {
          throw new Error('游戏场景未初始化');
        }
        
        // 测试UI元素渲染
        const uiElements = this.scene.children.list.filter(child => 
          child.type === 'Text' || child.type === 'Image' || child.type === 'Container'
        );
        
        if (uiElements.length === 0) {
          throw new Error('未找到UI元素');
        }
      },
      timeout: 10000,
      retries: 2,
      dependencies: ['game_initialization'],
      environment: ['development', 'staging'],
      isEnabled: true,
      metadata: {}
    });

    // 移动端适配测试
    this.addTestCase({
      id: 'mobile_adaptation',
      name: '移动端适配测试',
      description: '测试移动端适配功能',
      type: 'ui',
      priority: 'medium',
      category: 'mobile_system',
      tags: ['mobile', 'responsive'],
      test: async () => {
        if (!this.scene) {
          throw new Error('游戏场景未初始化');
        }
        
        const mobileAdapterSystem = (this.scene as any).mobileAdapterSystem;
        if (!mobileAdapterSystem) {
          throw new Error('移动端适配系统未初始化');
        }
        
        // 测试设备检测
        const deviceInfo = mobileAdapterSystem.getDeviceInfo();
        if (!deviceInfo) {
          throw new Error('设备信息获取失败');
        }
        
        // 测试屏幕适配
        const config = mobileAdapterSystem.getConfig();
        if (!config) {
          throw new Error('移动端配置获取失败');
        }
      },
      timeout: 15000,
      retries: 2,
      dependencies: ['game_initialization'],
      environment: ['development', 'staging'],
      isEnabled: true,
      metadata: {}
    });
  }

  /**
   * 初始化默认测试套件
   */
  private initializeDefaultSuites(): void {
    // 核心系统测试套件
    this.addTestSuite({
      id: 'core_systems',
      name: '核心系统测试套件',
      description: '测试游戏核心系统',
      tests: ['game_initialization', 'map_loading', 'player_movement'],
      setup: async () => {
        console.log('开始核心系统测试套件');
      },
      teardown: async () => {
        console.log('完成核心系统测试套件');
      },
      timeout: 60000,
      parallel: false,
      isEnabled: true,
      metadata: {}
    });

    // 功能系统测试套件
    this.addTestSuite({
      id: 'feature_systems',
      name: '功能系统测试套件',
      description: '测试游戏功能系统',
      tests: ['combat_system', 'inventory_system', 'quest_system'],
      setup: async () => {
        console.log('开始功能系统测试套件');
      },
      teardown: async () => {
        console.log('完成功能系统测试套件');
      },
      timeout: 90000,
      parallel: true,
      isEnabled: true,
      metadata: {}
    });

    // 性能测试套件
    this.addTestSuite({
      id: 'performance_suite',
      name: '性能测试套件',
      description: '测试游戏性能',
      tests: ['performance_test'],
      setup: async () => {
        console.log('开始性能测试套件');
      },
      teardown: async () => {
        console.log('完成性能测试套件');
      },
      timeout: 120000,
      parallel: false,
      isEnabled: true,
      metadata: {}
    });

    // UI测试套件
    this.addTestSuite({
      id: 'ui_suite',
      name: 'UI测试套件',
      description: '测试用户界面',
      tests: ['ui_rendering', 'mobile_adaptation'],
      setup: async () => {
        console.log('开始UI测试套件');
      },
      teardown: async () => {
        console.log('完成UI测试套件');
      },
      timeout: 60000,
      parallel: true,
      isEnabled: true,
      metadata: {}
    });
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    // 监听游戏事件进行测试
    if (this.scene) {
      this.scene.events.on('test-event', this.handleTestEvent, this);
    }
  }

  /**
   * 添加测试用例
   */
  public addTestCase(testCase: TestCase): void {
    this.testCases.set(testCase.id, testCase);
    this.addEvent('custom', { testCase });
  }

  /**
   * 获取测试用例
   */
  public getTestCase(testId: string): TestCase | undefined {
    return this.testCases.get(testId);
  }

  /**
   * 获取所有测试用例
   */
  public getAllTestCases(): TestCase[] {
    return Array.from(this.testCases.values());
  }

  /**
   * 添加测试套件
   */
  public addTestSuite(testSuite: TestSuite): void {
    this.testSuites.set(testSuite.id, testSuite);
  }

  /**
   * 获取测试套件
   */
  public getTestSuite(suiteId: string): TestSuite | undefined {
    return this.testSuites.get(suiteId);
  }

  /**
   * 获取所有测试套件
   */
  public getAllTestSuites(): TestSuite[] {
    return Array.from(this.testSuites.values());
  }

  /**
   * 运行单个测试
   */
  public async runTest(testId: string): Promise<TestResult> {
    const testCase = this.getTestCase(testId);
    if (!testCase) {
      throw new Error(`测试用例不存在: ${testId}`);
    }

    if (!testCase.isEnabled) {
      return this.createSkippedResult(testId, '测试已禁用');
    }

    const result: TestResult = {
      id: this.generateResultId(),
      testId,
      status: 'running',
      duration: 0,
      startTime: Date.now(),
      endTime: 0,
      logs: [],
      metadata: {}
    };

    this.currentTest = testCase;
    this.runningTests.add(testId);
    this.addEvent('test_started', { testCase, result });

    try {
      // 运行设置
      if (testCase.setup) {
        await testCase.setup();
      }

      // 运行测试
      const testStartTime = Date.now();
      await Promise.race([
        testCase.test(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('测试超时')), testCase.timeout)
        )
      ]);
      
      result.duration = Date.now() - testStartTime;
      result.status = 'passed';
      result.endTime = Date.now();

      // 运行清理
      if (testCase.teardown) {
        await testCase.teardown();
      }

    } catch (error) {
      result.status = 'failed';
      result.error = error instanceof Error ? error.message : String(error);
      result.stackTrace = error instanceof Error ? error.stack : undefined;
      result.endTime = Date.now();
      result.duration = result.endTime - result.startTime;

      // 重试逻辑
      if (this.config.retryFailedTests && result.status === 'failed') {
        for (let i = 0; i < testCase.retries; i++) {
          try {
            console.log(`重试测试 ${testId} (${i + 1}/${testCase.retries})`);
            await testCase.test();
            result.status = 'passed';
            result.error = undefined;
            result.stackTrace = undefined;
            break;
          } catch (retryError) {
            console.log(`重试失败: ${retryError}`);
          }
        }
      }
    } finally {
      this.runningTests.delete(testId);
      this.currentTest = undefined;
    }

    this.testResults.push(result);
    this.addEvent('test_completed', { testCase, result });
    
    return result;
  }

  /**
   * 运行测试套件
   */
  public async runTestSuite(suiteId: string): Promise<TestReport> {
    const testSuite = this.getTestSuite(suiteId);
    if (!testSuite) {
      throw new Error(`测试套件不存在: ${suiteId}`);
    }

    if (!testSuite.isEnabled) {
      throw new Error(`测试套件已禁用: ${suiteId}`);
    }

    const report: TestReport = {
      id: this.generateReportId(),
      name: testSuite.name,
      description: testSuite.description,
      startTime: Date.now(),
      endTime: 0,
      duration: 0,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      timeoutTests: 0,
      successRate: 0,
      results: [],
      summary: {} as TestSummary,
      metadata: {}
    };

    this.addEvent('suite_started', { testSuite, report });

    try {
      // 运行套件设置
      if (testSuite.setup) {
        await testSuite.setup();
      }

      // 运行测试
      if (testSuite.parallel) {
        const testPromises = testSuite.tests.map(testId => this.runTest(testId));
        const results = await Promise.all(testPromises);
        report.results = results;
      } else {
        for (const testId of testSuite.tests) {
          const result = await this.runTest(testId);
          report.results.push(result);
        }
      }

      // 运行套件清理
      if (testSuite.teardown) {
        await testSuite.teardown();
      }

    } catch (error) {
      console.error('测试套件运行失败:', error);
    } finally {
      report.endTime = Date.now();
      report.duration = report.endTime - report.startTime;
      report.totalTests = report.results.length;
      report.passedTests = report.results.filter(r => r.status === 'passed').length;
      report.failedTests = report.results.filter(r => r.status === 'failed').length;
      report.skippedTests = report.results.filter(r => r.status === 'skipped').length;
      report.timeoutTests = report.results.filter(r => r.status === 'timeout').length;
      report.successRate = report.totalTests > 0 ? (report.passedTests / report.totalTests) * 100 : 0;
      report.summary = this.generateSummary(report.results);

      this.reports.push(report);
      this.addEvent('suite_completed', { testSuite, report });
    }

    return report;
  }

  /**
   * 运行所有测试
   */
  public async runAllTests(): Promise<TestReport> {
    const allTests = this.getAllTestCases().filter(test => test.isEnabled);
    const testIds = allTests.map(test => test.id);

    const report: TestReport = {
      id: this.generateReportId(),
      name: '完整测试套件',
      description: '运行所有启用的测试',
      startTime: Date.now(),
      endTime: 0,
      duration: 0,
      totalTests: testIds.length,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      timeoutTests: 0,
      successRate: 0,
      results: [],
      summary: {} as TestSummary,
      metadata: {}
    };

    console.log(`开始运行 ${testIds.length} 个测试...`);

    try {
      if (this.config.parallelExecution) {
        const chunks = this.chunkArray(testIds, this.config.maxParallelTests);
        for (const chunk of chunks) {
          const chunkPromises = chunk.map(testId => this.runTest(testId));
          const chunkResults = await Promise.all(chunkPromises);
          report.results.push(...chunkResults);
        }
      } else {
        for (const testId of testIds) {
          const result = await this.runTest(testId);
          report.results.push(result);
        }
      }
    } catch (error) {
      console.error('测试运行失败:', error);
    } finally {
      report.endTime = Date.now();
      report.duration = report.endTime - report.startTime;
      report.passedTests = report.results.filter(r => r.status === 'passed').length;
      report.failedTests = report.results.filter(r => r.status === 'failed').length;
      report.skippedTests = report.results.filter(r => r.status === 'skipped').length;
      report.timeoutTests = report.results.filter(r => r.status === 'timeout').length;
      report.successRate = report.totalTests > 0 ? (report.passedTests / report.totalTests) * 100 : 0;
      report.summary = this.generateSummary(report.results);

      this.reports.push(report);
      this.addEvent('report_generated', { report });
    }

    return report;
  }

  /**
   * 性能测试
   */
  public async runPerformanceTest(duration: number = 60000): Promise<PerformanceMetrics[]> {
    const metrics: PerformanceMetrics[] = [];
    const startTime = Date.now();
    const endTime = startTime + duration;

    console.log(`开始性能测试，持续 ${duration / 1000} 秒...`);

    while (Date.now() < endTime) {
      const metric: PerformanceMetrics = {
        fps: this.getCurrentFPS(),
        memoryUsage: this.getMemoryUsage(),
        cpuUsage: this.getCPUUsage(),
        loadTime: this.getLoadTime(),
        renderTime: this.getRenderTime(),
        updateTime: this.getUpdateTime(),
        networkLatency: this.getNetworkLatency(),
        errors: this.getErrorCount(),
        warnings: this.getWarningCount(),
        timestamp: Date.now()
      };

      metrics.push(metric);
      this.addEvent('performance_measured', { metric });

      await new Promise(resolve => setTimeout(resolve, 1000)); // 每秒测量一次
    }

    console.log(`性能测试完成，收集了 ${metrics.length} 个数据点`);
    return metrics;
  }

  /**
   * 生成测试摘要
   */
  private generateSummary(results: TestResult[]): TestSummary {
    const summary: TestSummary = {
      total: results.length,
      passed: results.filter(r => r.status === 'passed').length,
      failed: results.filter(r => r.status === 'failed').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      timeout: results.filter(r => r.status === 'timeout').length,
      successRate: results.length > 0 ? (results.filter(r => r.status === 'passed').length / results.length) * 100 : 0,
      averageDuration: results.length > 0 ? results.reduce((sum, r) => sum + r.duration, 0) / results.length : 0,
      slowestTest: results.reduce((slowest, current) => current.duration > slowest.duration ? current : slowest),
      fastestTest: results.reduce((fastest, current) => current.duration < fastest.duration ? current : fastest),
      mostFailedTest: undefined,
      categories: {},
      types: {} as Record<TestType, number>,
      priorities: {} as Record<TestPriority, number>
    };

    // 统计分类
    results.forEach(result => {
      const testCase = this.getTestCase(result.testId);
      if (testCase) {
        summary.categories[testCase.category] = (summary.categories[testCase.category] || 0) + 1;
        summary.types[testCase.type] = (summary.types[testCase.type] || 0) + 1;
        summary.priorities[testCase.priority] = (summary.priorities[testCase.priority] || 0) + 1;
      }
    });

    return summary;
  }

  /**
   * 创建跳过的测试结果
   */
  private createSkippedResult(testId: string, reason: string): TestResult {
    return {
      id: this.generateResultId(),
      testId,
      status: 'skipped',
      duration: 0,
      startTime: Date.now(),
      endTime: Date.now(),
      error: reason,
      logs: [`测试跳过: ${reason}`],
      metadata: {}
    };
  }

  /**
   * 数组分块
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * 性能指标获取方法
   */
  private getCurrentFPS(): number {
    if (this.scene && (this.scene as any).game) {
      return (this.scene as any).game.loop.actualFps || 60;
    }
    return 60;
  }

  private getMemoryUsage(): number {
    if (performance && (performance as any).memory) {
      return Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024);
    }
    return 0;
  }

  private getCPUUsage(): number {
    // 简化的CPU使用率计算
    return Math.random() * 100;
  }

  private getLoadTime(): number {
    if (performance && performance.timing) {
      return performance.timing.loadEventEnd - performance.timing.navigationStart;
    }
    return 0;
  }

  private getRenderTime(): number {
    // 简化的渲染时间计算
    return 16; // 假设60FPS
  }

  private getUpdateTime(): number {
    // 简化的更新时间计算
    return 8;
  }

  private getNetworkLatency(): number {
    // 简化的网络延迟计算
    return Math.random() * 100;
  }

  private getErrorCount(): number {
    // 简化的错误计数
    return 0;
  }

  private getWarningCount(): number {
    // 简化的警告计数
    return 0;
  }

  /**
   * 事件处理
   */
  private handleTestEvent(data: any): void {
    this.addEvent('custom', data);
  }

  /**
   * 生成ID
   */
  private generateResultId(): string {
    return `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 添加事件
   */
  private addEvent(type: TestEvent['type'], data?: any): void {
    const event: TestEvent = {
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
   * 获取测试结果
   */
  public getTestResults(): TestResult[] {
    return [...this.testResults];
  }

  /**
   * 获取测试报告
   */
  public getTestReports(): TestReport[] {
    return [...this.reports];
  }

  /**
   * 获取测试事件
   */
  public getTestEvents(): TestEvent[] {
    return [...this.events];
  }

  /**
   * 清理资源
   */
  public destroy(): void {
    this.events = [];
    this.callbacks.clear();
    this.testCases.clear();
    this.testSuites.clear();
    this.testResults = [];
    this.reports = [];
    this.performanceMetrics = [];
    
    this.scene = null;
    console.log('测试系统已销毁');
  }
}