import { supabase } from './supabase-config';

// 优化的查询构建器
export class QueryBuilder {
  private query: any;
  private tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.query = supabase.from(tableName);
  }

  // 选择字段，避免查询不必要的数据
  select(columns: string = '*') {
    this.query = this.query.select(columns);
    return this;
  }

  // 添加过滤条件
  filter(column: string, operator: string, value: any) {
    this.query = this.query.filter(column, operator, value);
    return this;
  }

  // 排序
  order(column: string, ascending: boolean = true) {
    this.query = this.query.order(column, { ascending });
    return this;
  }

  // 分页
  range(from: number, to: number) {
    this.query = this.query.range(from, to);
    return this;
  }

  // 限制返回数量
  limit(count: number) {
    this.query = this.query.limit(count);
    return this;
  }

  // 执行查询
  async execute() {
    const { data, error } = await this.query;
    if (error) throw error;
    return data;
  }

  // 执行单条查询
  async single() {
    const { data, error } = await this.query.single();
    if (error) throw error;
    return data;
  }

  // 获取数量
  async count(countMethod: 'exact' | 'planned' | 'estimated' = 'exact') {
    const { count, error } = await this.query.select('*', { count: countMethod as any, head: true });
    if (error) throw error;
    return count;
  }
}

// 批量查询优化器
export class BatchQueryOptimizer {
  private queries: Array<() => Promise<any>> = [];
  private results: any[] = [];

  // 添加查询到批次
  add<T>(queryFn: () => Promise<T>): BatchQueryOptimizer {
    this.queries.push(queryFn);
    return this;
  }

  // 并行执行所有查询
  async executeAll(): Promise<any[]> {
    try {
      this.results = await Promise.all(
        this.queries.map(query => 
          query().catch(error => {
            console.warn('批量查询中的单个查询失败:', error);
            return null; // 返回null而不是抛出错误
          })
        )
      );
      return this.results;
    } catch (error) {
      console.error('批量查询失败:', error);
      throw error;
    } finally {
      this.clear();
    }
  }

  // 清理查询队列
  clear(): void {
    this.queries = [];
    this.results = [];
  }
}

// 查询性能监控
export const withQueryPerformance = async <T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> => {
  const startTime = performance.now();
  
  try {
    const result = await queryFn();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // 只在开发环境记录性能日志
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Query Performance] ${queryName}: ${duration.toFixed(2)}ms`);
    }
    
    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.error(`[Query Error] ${queryName} failed after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
};