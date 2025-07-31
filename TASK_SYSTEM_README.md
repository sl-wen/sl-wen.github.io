# 任务系统实现文档

## 概述

本任务系统基于 React + TypeScript + Next.js 实现，完全复刻了 master 分支的功能，同时提供了现代化的用户体验。

## 核心功能

### 1. 登录初始化任务
- **自动任务初始化**: 用户登录时自动初始化所有可用任务
- **登录奖励处理**: 处理每日登录奖励和连续登录奖励
- **任务重置**: 根据任务类型（每日/每周）自动重置任务进度

### 2. 任务类型
- **每日任务**: 登录、点赞、评论、发帖
- **每周任务**: 周活跃、周点赞、周评论、周分享
- **成就任务**: 累计里程碑任务
- **行为任务**: 连续登录奖励

### 3. 任务进度跟踪
- **实时更新**: 用户操作时实时更新任务进度
- **进度显示**: 可视化进度条和百分比
- **状态管理**: 进行中、可领取、已领取状态

### 4. 奖励系统
- **金币奖励**: 完成任务获得金币
- **经验奖励**: 完成任务获得经验值
- **等级升级**: 经验值达到要求时自动升级
- **连续登录**: 连续登录天数奖励

## 技术实现

### 文件结构

```
src/
├── utils/
│   ├── task.ts              # 任务系统核心逻辑
│   ├── task-hooks.ts        # React Hooks
│   └── auth-context.tsx     # 认证上下文（集成任务）
├── components/
│   ├── TaskProgress.tsx     # 任务进度组件
│   └── TaskHistory.tsx      # 任务历史组件
└── app/
    └── profile/
        └── page.tsx         # 个人中心页面
```

### 核心接口

```typescript
// 任务接口
interface Task {
  task_id: string;
  task_name: string;
  task_description: string;
  action_type: string;
  required_count: number;
  coins_reward: number;
  exp_reward: number;
  reset_frequency: string;
}

// 任务进度接口
interface TaskProgress {
  usertask_id: string;
  current_count: number;
  is_claimed: boolean;
  task_name: string;
  coins_reward: number;
  exp_reward: number;
}

// 任务奖励历史接口
interface TaskRewardHistory {
  task_reward_history_id: string;
  coins_reward: number;
  exp_reward: number;
  claimed_at: string;
  task_name: string;
}
```

### 主要函数

#### 任务管理
- `initUserTasks(userId)`: 初始化用户任务
- `getUserTasks(userId)`: 获取用户任务列表
- `updateTaskProgress(userId, actionType)`: 更新任务进度
- `claimTaskReward(userTaskId, userId)`: 领取任务奖励

#### 登录奖励
- `handleLoginRewards(profile)`: 处理登录奖励
- `getConsecutiveLogins(lastLogin, consecutiveLogins)`: 计算连续登录天数
- `isFirstLoginOfDay(lastLogin)`: 检查是否当天首次登录

#### 任务重置
- `isFirstLoginOfWeek(lastLogin)`: 检查是否当周首次登录
- `resetUserTask(userTaskId)`: 重置用户任务进度

## 使用指南

### 1. 登录初始化
用户登录时，系统会自动：
1. 处理登录奖励（金币、经验、连续登录奖励）
2. 初始化用户任务（首次登录）
3. 重置每日/每周任务（非首次登录）

### 2. 任务进度更新
系统会在以下操作时自动更新任务进度：
- **点赞**: 文章点赞、评论点赞
- **评论**: 发表评论、回复评论
- **发帖**: 发布新文章
- **登录**: 每日登录

### 3. 个人中心功能
用户可以在个人中心：
- **查看任务进度**: 实时显示任务完成情况
- **领取奖励**: 完成任务后领取金币和经验
- **查看历史**: 查看已完成的任务和奖励记录

### 4. 任务类型说明

#### 每日任务
- **每日登录**: 每天首次登录获得奖励
- **每日点赞**: 每天点赞文章或评论
- **每日评论**: 每天发表评论
- **每日发帖**: 每天发布文章

#### 每周任务
- **周活跃**: 一周内完成多个任务
- **周点赞**: 一周内点赞多次
- **周评论**: 一周内评论多次
- **周分享**: 一周内分享内容

#### 成就任务
- **累计登录**: 累计登录天数达到目标
- **累计点赞**: 累计点赞次数达到目标
- **累计评论**: 累计评论次数达到目标
- **累计发帖**: 累计发帖次数达到目标

## 数据库结构

### 主要表
- `tasks`: 任务定义表
- `user_tasks`: 用户任务进度表
- `task_reward_history`: 任务奖励历史表
- `user_levels`: 用户等级表
- `profiles`: 用户资料表（包含金币、经验、等级）

### 视图
- `user_tasks_view`: 用户任务视图（关联任务和进度）

## 测试

### 运行测试
```bash
npm run test:task
```

### 测试内容
1. 数据库连接测试
2. 任务表结构验证
3. 任务类型配置检查
4. 用户等级系统测试
5. 任务视图功能测试
6. 奖励历史记录测试

## 配置说明

### 环境变量
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 任务配置
任务配置在数据库的 `tasks` 表中，包括：
- 任务名称和描述
- 动作类型（login, like, comment, post）
- 完成要求数量
- 奖励金币和经验
- 重置频率（daily, weekly, achievement）

## 注意事项

1. **任务重置**: 每日任务每天重置，每周任务每周重置
2. **奖励领取**: 任务完成后需要手动领取奖励
3. **进度更新**: 任务进度实时更新，无需刷新页面
4. **错误处理**: 系统包含完善的错误处理和用户提示
5. **性能优化**: 使用 React Hooks 和状态管理优化性能

## 扩展功能

### 可扩展的任务类型
- 分享任务
- 收藏任务
- 关注任务
- 签到任务

### 可扩展的奖励类型
- 特殊道具
- 徽章系统
- 等级特权
- 活动参与资格

## 维护说明

### 添加新任务
1. 在数据库 `tasks` 表中添加任务记录
2. 在 `task-hooks.ts` 中添加新的动作类型
3. 在相应组件中调用 `updateProgress` 函数

### 修改任务奖励
1. 直接修改数据库中的奖励配置
2. 系统会自动应用新的奖励设置

### 监控任务系统
1. 查看任务完成率
2. 监控奖励发放情况
3. 分析用户行为模式