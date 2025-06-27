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

export const getAvailableTasks = async (userLevel: number) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .lte('min_level', userLevel)
      .eq('is_active', 'ture');

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
        started_at: new Date().toISOString(),
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
        completed_at: new Date().toISOString(),
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
      exp: task.reward_exp,
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