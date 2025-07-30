import { useAuth } from './auth-context';
import { updateTaskProgress } from './task';

export const useTaskProgress = () => {
  const { userProfile } = useAuth();

  const updateProgress = async (actionType: string, count: number = 1) => {
    if (!userProfile?.user_id) return;

    try {
      await updateTaskProgress(userProfile.user_id, actionType, count);
    } catch (error) {
      console.error('更新任务进度失败:', error);
    }
  };

  return {
    updateProgress,
    isLoggedIn: !!userProfile?.user_id
  };
};

// 预定义的任务动作类型
export const TASK_ACTIONS = {
  LOGIN: 'login',
  LIKE: 'like',
  COMMENT: 'comment',
  POST: 'post',
  BE_LIKED: 'be_liked',
  CONSECUTIVE_LOGIN: 'consecutive_login'
} as const;

export type TaskActionType = typeof TASK_ACTIONS[keyof typeof TASK_ACTIONS];