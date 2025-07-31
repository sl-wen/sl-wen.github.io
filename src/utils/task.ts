import { supabase } from './supabase-config';

export interface Task {
  task_id: string;
  task_name: string;
  task_description: string;
  tasktype_id: string;
  action_type: string;
  required_count: number;
  coins_reward: number;
  exp_reward: number;
  min_level: number;
  max_level: number;
  is_active: boolean;
  reset_frequency: string;
}

export interface TaskProgress {
  usertask_id: string;
  user_id: string;
  task_id: string;
  current_count: number;
  is_claimed: boolean;
  claimed_at: string;
  created_at: string;
  updated_at: string;
  task_name: string;
  task_description: string;
  tasktype_id: string;
  action_type: string;
  required_count: number;
  coins_reward: number;
  exp_reward: number;
  reset_frequency: string;
  name: string;
  description: string;
}

export interface TaskRewardHistory {
  task_reward_history_id: string;
  user_id: string;
  task_id: string;
  coins_reward: number;
  exp_reward: number;
  claimed_at: string;
  task_name?: string;
  task_description?: string;
  action_type?: string;
}

export interface UserLevel {
  level: number;
  required_exp: number;
  daily_login_exp: number;
  daily_login_coins: number;
  level_up_reward_coins: number;
}

export interface ConsecutiveLoginReward {
  task_id: string;
  task_name: string;
  required_count: number;
  coins_reward: number;
  exp_reward: number;
}

// 获取用户等级表
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

// 获取连续登录奖励表
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

// 更新用户等级
export const updateProfileLevel = async (level: number, userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        level: level + 1,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('更新用户等级失败:', error);
    throw error;
  }
};

// 更新用户登录时间
export const updateProfileLastLogin = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        last_login: new Date().toISOString(),
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
 */
export const isFirstLoginOfDay = (lastLogin: string | null): boolean => {
  if (!lastLogin) {
    return true;
  }

  const lastLoginDate = new Date(lastLogin);
  const now = new Date();

  return !(
    lastLoginDate.getFullYear() === now.getFullYear() &&
    lastLoginDate.getMonth() === now.getMonth() &&
    lastLoginDate.getDate() === now.getDate()
  );
};

/**
 * 检查是否为当周首次登录
 */
export const isFirstLoginOfWeek = (lastLogin: string | null): boolean => {
  if (!lastLogin) {
    return true;
  }

  const lastLoginDate = new Date(lastLogin);
  const now = new Date();

  const msPerDay = 24 * 60 * 60 * 1000;
  const lastLoginDays = Math.floor(lastLoginDate.getTime() / msPerDay);
  const nowDays = Math.floor(now.getTime() / msPerDay);

  const lastLoginDay = (lastLoginDate.getDay() + 6) % 7;
  const nowDay = (now.getDay() + 6) % 7;

  const lastLoginMonday = lastLoginDays - lastLoginDay;
  const nowMonday = nowDays - nowDay;

  return lastLoginMonday !== nowMonday;
};

/**
 * 更新连续登录天数
 */
export const getConsecutiveLogins = (lastLogin: string | null, consecutiveLogins: number): number => {
  if (!lastLogin) {
    return 1;
  }

  const lastLoginDate = new Date(lastLogin);
  const now = new Date();

  const lastLoginDateOnly = new Date(lastLoginDate.getFullYear(), lastLoginDate.getMonth(), lastLoginDate.getDate());
  const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffTime = todayDateOnly.getTime() - lastLoginDateOnly.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  if (diffDays === 1) {
    return consecutiveLogins + 1;
  } else if (diffDays === 0) {
    return consecutiveLogins;
  } else {
    return 1;
  }
};



// 初始化任务处理函数
export const initUserTasks = async (userId: string): Promise<void> => {
  try {
    console.log('初始化任务开始');
    const userTasksData = await getUserTasks(userId);
    console.log('userTasksData:', userTasksData);

    if (!userTasksData || userTasksData.length === 0) {
      const tasksData = await getAllTasks();
      console.log('tasksData:', tasksData);

      if (tasksData && tasksData.length > 0) {
        console.log('首次初始化开始');
        for (const taskData of tasksData) {
          try {
            const newUserTask = {
              user_id: userId,
              task_id: taskData.task_id,
              current_count: 0,
              is_claimed: false,
              claimed_at: null,
            };
            await insertUserTask(newUserTask);
          } catch (error) {
            console.log('用户任务进度初期追加失败', error);
          }
        }
      }
    } else {
      for (const userTaskData of userTasksData) {
        console.log('进度初始化开始');
        try {
          if (userTaskData.name === 'daily' && isFirstLoginOfDay(userTaskData.updated_at)) {
            await resetUserTask(userTaskData.usertask_id);
            console.log('daily任务进度初期化', userTaskData.usertask_id);
          }
          if (userTaskData.name === 'weekly' && isFirstLoginOfWeek(userTaskData.updated_at)) {
            await resetUserTask(userTaskData.usertask_id);
          }
        } catch (error) {
          console.log('用户任务进度初期追加失败', error);
        }
      }
    }
  } catch (error) {
    console.log('初始化任务进度失败', error);
    throw error;
  }
};

// 计算新等级
export const calculateNewLevel = (experience: number, rewardsExperience: number, requiredExp: number): boolean => {
  return (experience + rewardsExperience) > requiredExp;
};

// 获取用户任务
export const getUserTasks = async (userId: string): Promise<TaskProgress[] | null> => {
  try {
    const { data: userTasks, error } = await supabase
      .from('user_tasks_view')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true })
      .order('action_type', { ascending: false });

    if (error) throw error;
    return userTasks;
  } catch (error) {
    console.error('getUserTasks error', error);
    return null;
  }
};

// 插入用户任务
export const insertUserTask = async (newUserTask: any): Promise<void> => {
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

// 重置用户任务
export const resetUserTask = async (userTaskId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_tasks')
      .update({
        current_count: 0,
        updated_at: new Date().toISOString()
      })
      .eq('usertask_id', userTaskId);

    if (error) throw error;
  } catch (error) {
    console.error('resetUserTask error', error);
    throw error;
  }
};

// 获取任务
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

// 获取所有任务
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

// 获取任务类型
export const getTaskType = async (taskTypeId: string): Promise<any | null> => {
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

// 获取任务奖励历史
export const getTaskRewardHistory = async (userId: string): Promise<TaskRewardHistory[] | null> => {
  try {
    const { data: taskRewardHistory, error } = await supabase
      .from('task_reward_history')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return taskRewardHistory;
  } catch (error) {
    console.error('getTaskRewardHistory error', error);
    return null;
  }
};

// 领取任务奖励
export const claimTaskReward = async (userTaskId: string, userId: string): Promise<void> => {
  try {
    // 获取用户任务信息
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

    // 更新用户任务状态
    const { error: updateError } = await supabase
      .from('user_tasks')
      .update({
        is_claimed: true,
        claimed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('usertask_id', userTaskId);

    if (updateError) throw updateError;

    // 记录奖励历史
    const { error: historyError } = await supabase
      .from('task_reward_history')
      .insert({
        user_id: userId,
        task_id: userTask.task_id,
        coins_reward: userTask.coins_reward,
        exp_reward: userTask.exp_reward,
        claimed_at: new Date().toISOString()
      });

    if (historyError) throw historyError;

    // 更新用户金币和经验值
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('coins, experience')
      .eq('user_id', userId)
      .single();

    if (profileError) throw profileError;

    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({
        coins: (profile.coins || 0) + userTask.coins_reward,
        experience: (profile.experience || 0) + userTask.exp_reward,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateProfileError) throw updateProfileError;

  } catch (error) {
    console.error('claimTaskReward error', error);
    throw error;
  }
};

// 更新任务进度
export const updateTaskProgress = async (userId: string, actionType: string, count: number = 1): Promise<void> => {
  try {
    // 获取用户的所有任务
    const userTasks = await getUserTasks(userId);
    if (!userTasks) return;

    // 找到匹配的任务并更新进度
    for (const userTask of userTasks) {
      if (userTask.action_type === actionType && !userTask.is_claimed) {
        const newCount = Math.min(userTask.current_count + count, userTask.required_count);
        
        const { error } = await supabase
          .from('user_tasks')
          .update({
            current_count: newCount,
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

export const calculateLevel = (experience: number): number => {
  const baseExp = 100;
  const expMultiplier = 1.5;
  let level = 1;
  let expRequired = baseExp;

  while (experience >= expRequired) {
    experience -= expRequired;
    level++;
    expRequired = Math.floor(baseExp * Math.pow(expMultiplier, level - 1));
  }

  return level;
};

export const getExpForNextLevel = (currentLevel: number): number => {
  const baseExp = 100;
  const expMultiplier = 1.5;
  return Math.floor(baseExp * Math.pow(expMultiplier, currentLevel - 1));
};