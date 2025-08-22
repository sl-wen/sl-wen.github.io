import { supabase } from './supabase-config';

// 任务基础信息接口 - 定义任务的基本属性
export interface Task {
  task_id: string; // 任务唯一标识符
  task_name: string; // 任务名称
  task_description: string; // 任务描述
  tasktype_id: string; // 任务类型ID
  action_type: string; // 动作类型（如daily_login、post_article等）
  required_count: number; // 完成任务所需的次数
  coins_reward: number; // 完成任务获得的金币奖励
  exp_reward: number; // 完成任务获得的经验值奖励
  min_level: number; // 任务最低等级要求
  max_level: number; // 任务最高等级限制
  is_active: boolean; // 任务是否激活状态
  reset_frequency: string; // 任务重置频率（daily、weekly、never等）
}

// 任务进度接口 - 记录用户的任务完成情况
export interface TaskProgress {
  usertask_id: string; // 用户任务记录唯一标识符
  user_id: string; // 用户ID
  task_id: string; // 关联的任务ID
  current_count: number; // 当前完成次数
  is_claimed: boolean; // 是否已领取奖励
  claimed_at: string; // 奖励领取时间
  created_at: string; // 记录创建时间
  updated_at: string; // 记录更新时间
  task_name: string; // 任务名称（来自关联表）
  task_description: string; // 任务描述（来自关联表）
  tasktype_id: string; // 任务类型ID（来自关联表）
  action_type: string; // 动作类型（来自关联表）
  required_count: number; // 需要完成的次数（来自关联表）
  coins_reward: number; // 金币奖励（来自关联表）
  exp_reward: number; // 经验奖励（来自关联表）
  reset_frequency: string; // 重置频率（来自关联表）
  name: string; // 任务类型名称
  description: string; // 任务类型描述
}

// 任务奖励历史接口 - 记录用户已领取的奖励历史
export interface TaskRewardHistory {
  task_reward_history_id: string; // 奖励历史记录唯一标识符
  user_id: string; // 用户ID
  task_id: string; // 任务ID
  coins_gained: number; // 获得的金币数量
  experience_gained: number; // 获得的经验值数量
  claimed_at: string; // 领取时间
  task_name?: string; // 任务名称（可选）
  task_description?: string; // 任务描述（可选）
  action_type?: string; // 动作类型（可选）
}

// 用户等级配置接口 - 定义不同等级的属性和奖励
export interface UserLevel {
  level: number; // 等级数值
  required_exp: number; // 升级所需经验值
  daily_login_exp: number; // 每日登录获得的经验值
  daily_login_coins: number; // 每日登录获得的金币
  level_up_reward_coins: number; // 升级时获得的金币奖励
}

// 连续登录奖励接口 - 定义连续登录的奖励机制
export interface ConsecutiveLoginReward {
  task_id: string; // 任务ID
  task_name: string; // 任务名称
  required_count: number; // 需要连续登录的天数
  coins_reward: number; // 金币奖励
  exp_reward: number; // 经验奖励
}

// 获取用户等级配置信息 - 根据等级获取对应的配置数据
export const getUserLevel = async (level: number): Promise<UserLevel | null> => {
  try {
    const { data: userLevels, error } = await supabase
      .from('user_levels')
      .select('*')
      .eq('level', level)
      .maybeSingle();

    if (error) throw error;
    return userLevels;
  } catch (error) {
    console.error('获取用户等级表失败:', error);
    return null;
  }
};

// 获取连续登录奖励配置 - 根据连续登录天数获取对应的奖励
export const getConsecutiveLoginRewards = async (consecutiveLogins: number): Promise<ConsecutiveLoginReward | null> => {
  try {
    const { data: consecutiveLoginsRewards, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('action_type', 'consecutive_login')
      .lte('required_count', consecutiveLogins)
      .order('required_count', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return consecutiveLoginsRewards;
  } catch (error) {
    console.error('获取连续登录奖励表失败:', error);
    return null;
  }
};

// 更新用户等级 - 当用户升级时更新数据库中的等级信息
export const updateProfileLevel = async (level: number, userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        level: level + 1, // 等级+1
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('更新用户等级失败:', error);
    throw error;
  }
};

// 更新用户登录信息 - 记录最后登录时间和连续登录天数
export const updateProfileLastLogin = async (userId: string, consecutive_logins: number): Promise<void> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        last_login: new Date().toISOString(), // 更新最后登录时间
        consecutive_logins: consecutive_logins, // 更新连续登录天数
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('更新用户登录时间失败:', error);
    throw error;
  }
};

/**
 * 检查是否为当天首次登录
 * @param lastLogin 上次登录时间字符串
 * @returns boolean 是否为当天首次登录
 */
export const isFirstLoginOfDay = (lastLogin: string | null): boolean => {
  if (!lastLogin) {
    return true; // 如果没有登录记录，视为首次登录
  }

  const lastLoginDate = new Date(lastLogin);
  const now = new Date();

  // 比较年月日是否相同
  return !(
    lastLoginDate.getFullYear() === now.getFullYear() &&
    lastLoginDate.getMonth() === now.getMonth() &&
    lastLoginDate.getDate() === now.getDate()
  );
};

/**
 * 检查是否为当周首次登录
 * @param lastLogin 上次登录时间字符串
 * @returns boolean 是否为当周首次登录
 */
export const isFirstLoginOfWeek = (lastLogin: string | null): boolean => {
  if (!lastLogin) {
    return true; // 如果没有登录记录，视为首次登录
  }

  const lastLoginDate = new Date(lastLogin);
  const now = new Date();

  const msPerDay = 24 * 60 * 60 * 1000; // 一天的毫秒数
  const lastLoginDays = Math.floor(lastLoginDate.getTime() / msPerDay);
  const nowDays = Math.floor(now.getTime() / msPerDay);

  // 计算周一的日期（周一为一周的开始）
  const lastLoginDay = (lastLoginDate.getDay() + 6) % 7; // 转换为周一开始的星期
  const nowDay = (now.getDay() + 6) % 7;

  const lastLoginMonday = lastLoginDays - lastLoginDay;
  const nowMonday = nowDays - nowDay;

  // 如果两个周一不同，说明不在同一周
  return lastLoginMonday !== nowMonday;
};

/**
 * 计算连续登录天数
 * @param lastLogin 上次登录时间字符串
 * @param consecutiveLogins 当前连续登录天数
 * @returns number 更新后的连续登录天数
 */
export const getConsecutiveLogins = (lastLogin: string | null, consecutiveLogins: number): number => {
  if (!lastLogin) {
    return 1; // 首次登录，连续登录天数为1
  }

  const lastLoginDate = new Date(lastLogin);
  const now = new Date();

  // 只比较日期部分，忽略时间
  const lastLoginDateOnly = new Date(lastLoginDate.getFullYear(), lastLoginDate.getMonth(), lastLoginDate.getDate());
  const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffTime = todayDateOnly.getTime() - lastLoginDateOnly.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24); // 计算天数差

  if (diffDays === 1) {
    // 昨天登录过，连续天数+1
    return consecutiveLogins + 1;
  } else if (diffDays === 0) {
    // 今天已经登录过，保持原有天数
    return consecutiveLogins;
  } else {
    // 中断了连续登录，重新开始
    return 1;
  }
};



// 初始化用户任务系统 - 为新用户创建任务或重置现有任务
export const initUserTasks = async (userId: string): Promise<void> => {
  try {
    console.log('初始化任务开始');
    const userTasksData = await getUserTasks(userId);
    console.log('userTasksData:', userTasksData);

    if (!userTasksData || userTasksData.length === 0) {
      // 首次初始化 - 为新用户创建所有可用任务的进度记录
      const tasksData = await getAllTasks();
      console.log('tasksData:', tasksData);

      if (tasksData && tasksData.length > 0) {
        console.log('首次初始化开始');
        const userTaskPromises = tasksData.map(taskData => {
          // 为每个任务创建用户进度记录
          const newUserTask = {
            user_id: userId,
            task_id: taskData.task_id,
            current_count: 0, // 初始完成次数为0
            is_claimed: false, // 初始未领取奖励
            claimed_at: null, // 初始无领取时间
          };
          return insertUserTask(newUserTask).catch(error => {
            console.warn('用户任务进度初期追加失败', error);
          });
        });
        
        // 并行创建所有任务进度记录
        await Promise.all(userTaskPromises);
        console.log('首次初始化完成');
      }
    } else {
      // 检查并重置需要重置的任务（针对现有用户）
      const resetPromises = userTasksData.map(async (userTaskData) => {
        try {
          let shouldReset = false;
          let resetReason = '';

          // 检查每日任务重置条件
          if (userTaskData.reset_frequency === 'daily' && isFirstLoginOfDay(userTaskData.updated_at)) {
            shouldReset = true;
            resetReason = 'daily';
          }
          
          // 检查每周任务重置条件
          if (userTaskData.reset_frequency === 'weekly' && isFirstLoginOfWeek(userTaskData.updated_at)) {
            shouldReset = true;
            resetReason = 'weekly';
          }

          if (shouldReset) {
            await resetUserTask(userTaskData.usertask_id);
            console.log(`${resetReason}任务进度重置完成:`, userTaskData.task_name, userTaskData.usertask_id);
          }
        } catch (error) {
          console.warn('任务重置失败:', userTaskData.task_name, error);
        }
      });

      // 并行重置所有需要重置的任务
      await Promise.all(resetPromises);
      console.log('任务重置检查完成');
    }
  } catch (error) {
    console.error('初始化任务进度失败', error);
    throw error;
  }
};

// 计算是否达到升级条件 - 判断当前经验加上奖励经验是否超过升级所需经验
export const calculateNewLevel = (experience: number, rewardsExperience: number, requiredExp: number): boolean => {
  return (experience + rewardsExperience) > requiredExp;
};

// 获取用户的所有任务进度 - 从数据库视图中查询用户任务信息
export const getUserTasks = async (userId: string): Promise<TaskProgress[] | null> => {
  try {
    const { data: userTasks, error } = await supabase
      .from('user_tasks_view') // 使用视图获取完整的任务信息
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true }) // 按任务类型名称排序
      .order('action_type', { ascending: false }); // 按动作类型排序

    if (error) throw error;
    return userTasks;
  } catch (error) {
    console.error('getUserTasks error', error);
    return null;
  }
};

// 创建新的用户任务进度记录 - 为用户添加新任务的初始进度
export const insertUserTask = async (newUserTask: {
  user_id: string;
  task_id: string;
  current_count: number;
  is_claimed: boolean;
  claimed_at: string | null;
}): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_tasks')
      .insert([newUserTask])
      .select()
      .maybeSingle();

    if (error) throw error;
  } catch (error) {
    console.error('insertUserTask error', error);
    throw error;
  }
};

// 重置用户任务进度 - 将任务进度清零并重置领取状态
export const resetUserTask = async (userTaskId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_tasks')
      .update({
        current_count: 0, // 重置完成次数
        is_claimed: false, // 重置领取状态
        claimed_at: null, // 清空领取时间
        updated_at: new Date().toISOString()
      })
      .eq('usertask_id', userTaskId);

    if (error) throw error;
  } catch (error) {
    console.error('resetUserTask error', error);
    throw error;
  }
};

// 根据任务ID获取单个任务信息 - 查询特定任务的详细信息
export const getTask = async (taskId: string): Promise<Task | null> => {
  try {
    const { data: task, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('task_id', taskId)
      .maybeSingle();

    if (error) throw error;
    return task;
  } catch (error) {
    console.error('getTask error', error);
    return null;
  }
};

// 获取系统中的所有任务 - 用于初始化用户任务时获取完整任务列表
export const getAllTasks = async (): Promise<Task[] | null> => {
  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*');

    if (error) throw error;
    return tasks;
  } catch (error) {
    console.error('getAllTasks error', error);
    return null;
  }
};

// 根据任务类型ID获取任务类型信息 - 查询任务分类的详细信息
export const getTaskType = async (taskTypeId: string): Promise<{
  tasktype_id: string;
  name: string;
  description: string;
} | null> => {
  try {
    const { data: taskType, error } = await supabase
      .from('task_types')
      .select('*')
      .eq('tasktype_id', taskTypeId)
      .maybeSingle();

    if (error) throw error;
    return taskType;
  } catch (error) {
    console.error('getTaskType error', error);
    return null;
  }
};

// 获取用户任务奖励历史记录 - 查询用户已领取的所有任务奖励
export const getTaskRewardHistory = async (userId: string): Promise<TaskRewardHistory[] | null> => {
  try {
    const { data: taskRewardHistory, error } = await supabase
      .from('task_reward_history')
      .select(`
        *,
        tasks!inner(
          task_name,
          task_description,
          action_type
        )
      `)
      .eq('user_id', userId)
      .order('claimed_at', { ascending: false }); // 按领取时间倒序排列

    if (error) throw error;

    // 映射数据以匹配接口结构
    return taskRewardHistory?.map(record => ({
      task_reward_history_id: record.task_reward_history_id,
      user_id: record.user_id,
      task_id: record.task_id,
      coins_gained: record.coins_gained,
      experience_gained: record.experience_gained,
      claimed_at: record.claimed_at,
      task_name: record.tasks?.task_name,
      task_description: record.tasks?.task_description,
      action_type: record.tasks?.action_type
    })) || null;
  } catch (error) {
    console.error('getTaskRewardHistory error', error);
    return null;
  }
};

// 领取任务奖励 - 处理用户领取已完成任务的奖励，更新用户资产
export const claimTaskReward = async (userTaskId: string, userId: string): Promise<void> => {
  try {
    // 获取用户任务详细信息，验证任务状态
    const { data: userTask, error: userTaskError } = await supabase
      .from('user_tasks_view')
      .select('*')
      .eq('usertask_id', userTaskId)
      .eq('user_id', userId)
      .single();

    if (userTaskError) throw userTaskError;

    if (!userTask) {
      throw new Error('任务不存在');
    }

    if (userTask.is_claimed) {
      throw new Error('任务奖励已领取');
    }

    if (userTask.current_count < userTask.required_count) {
      throw new Error('任务未完成，无法领取奖励');
    }

    // 更新用户任务状态为已领取
    const { error: updateError } = await supabase
      .from('user_tasks')
      .update({
        is_claimed: true, // 标记为已领取
        claimed_at: new Date().toISOString(), // 记录领取时间
        updated_at: new Date().toISOString()
      })
      .eq('usertask_id', userTaskId);

    if (updateError) throw updateError;

    // 记录奖励历史到历史表
    const { error: historyError } = await supabase
      .from('task_reward_history')
      .insert({
        user_id: userId,
        task_id: userTask.task_id,
        coins_gained: userTask.coins_reward, // 记录获得的金币
        experience_gained: userTask.exp_reward, // 记录获得的经验
        claimed_at: new Date().toISOString()
      });

    if (historyError) throw historyError;

    // 获取用户当前的金币和经验值
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('coins, experience')
      .eq('user_id', userId)
      .single();

    if (profileError) throw profileError;

    // 更新用户的金币和经验值
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({
        coins: (profile.coins || 0) + userTask.coins_reward, // 增加金币
        experience: (profile.experience || 0) + userTask.exp_reward, // 增加经验
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateProfileError) throw updateProfileError;

  } catch (error) {
    console.error('claimTaskReward error', error);
    throw error;
  }
};

// 更新任务进度 - 根据用户行为自动更新相关任务的完成进度
export const updateTaskProgress = async (userId: string, actionType: string, count: number = 1): Promise<void> => {
  try {
    // 获取用户的所有任务进度
    const userTasks = await getUserTasks(userId);
    if (!userTasks) return;

    // 找到匹配动作类型的任务并更新进度
    for (const userTask of userTasks) {
      // 只更新匹配动作类型且未领取奖励的任务
      if (userTask.action_type === actionType && !userTask.is_claimed) {
        // 确保进度不会超过任务要求的次数
        const newCount = Math.min(userTask.current_count + count, userTask.required_count);

        const { error } = await supabase
          .from('user_tasks')
          .update({
            current_count: newCount, // 更新完成次数
            updated_at: new Date().toISOString()
          })
          .eq('usertask_id', userTask.usertask_id);

        if (error) {
          console.error('更新任务进度失败:', error);
        }
      }
    }
  } catch (error) {
    console.error('updateTaskProgress error', error);
    throw error;
  }
};

export const getAvailableTasks = async (userLevel: number) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .lte('min_level', userLevel)
      .eq('is_active', true);

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

export const getTaskProgress = async (user_id: string) => {
  try {
    const { data, error } = await supabase
      .from('user_tasks_view')
      .select('*')
      .eq('user_id', user_id)
      .order('task_name', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

export const startTask = async (userId: string, taskId: string) => {
  try {
    const { data, error } = await supabase
      .from('task_progress')
      .insert({
        user_id: userId,
        task_id: taskId,
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
};

export const completeTask = async (userId: string, taskId: string) => {
  try {
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('reward_coins, reward_exp')
      .eq('id', taskId)
      .single();

    if (taskError) throw taskError;

    const { data: progress, error: progressError } = await supabase
      .from('task_progress')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('task_id', taskId)
      .select()
      .single();

    if (progressError) throw progressError;

    // 更新用户的金币和经验值
    const { error: updateError } = await supabase.rpc('update_user_rewards', {
      user_id: userId,
      coins: task.reward_coins,
      exp: task.reward_exp
    });

    if (updateError) throw updateError;

    return progress;
  } catch (error) {
    throw error;
  }
};

// 根据经验值计算用户等级 - 使用递增的经验值需求计算当前等级
export const calculateLevel = (experience: number): number => {
  const baseExp = 100; // 基础经验值需求
  const expMultiplier = 1.5; // 经验值增长倍数
  let level = 1; // 起始等级
  let expRequired = baseExp; // 当前等级所需经验

  // 循环计算等级，直到经验不足以升级
  while (experience >= expRequired) {
    experience -= expRequired; // 消耗经验
    level++; // 等级提升
    expRequired = Math.floor(baseExp * Math.pow(expMultiplier, level - 1)); // 计算下一级所需经验
  }

  return level;
};

// 获取升级到下一等级所需的经验值 - 计算从当前等级到下一等级需要的经验
export const getExpForNextLevel = (currentLevel: number): number => {
  const baseExp = 100; // 基础经验值
  const expMultiplier = 1.5; // 经验值增长倍数
  return Math.floor(baseExp * Math.pow(expMultiplier, currentLevel - 1));
};