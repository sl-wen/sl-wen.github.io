import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase-config';
import { getUserProfile } from '../utils/supabase-config';
import Loading from '../components/Loading';

interface UserProfile {
  id: string;
  username: string;
  avatar_url: string;
  level: number;
  coins: number;
  experience: number;
  tasks: UserTask[];
  task_history: TaskHistory[];
}

interface UserTask {
  id: number;
  task_name: string;
  progress: number;
  total: number;
  status: string;
}

interface TaskHistory {
  id: number;
  task_name: string;
  reward: number;
  completed_at: string;
}

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const userProfile = await getUserProfile(user.id);
      if (userProfile) {
        setProfile(userProfile as UserProfile);
      }
    } catch (error) {
      console.error('加载用户资料失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!profile) {
    return <div>未找到用户资料</div>;
  }

  return (
    <div className="profile-container">
      <h1>个人中心</h1>
      
      <div className="user-stats">
        <div className="level">
          <label>等级</label>
          <span className="stat-value">{profile.level}</span>
        </div>
        <div className="coins">
          <label>金币</label>
          <span className="stat-value">{profile.coins}</span>
        </div>
        <div className="experience">
          <label>经验值</label>
          <span className="stat-value">{profile.experience}</span>
        </div>
      </div>

      <div className="tasks-section">
        <div className="task-progress">
          <h2>任务进度</h2>
          <table>
            <thead>
              <tr>
                <th>任务名称</th>
                <th>进度</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {profile.tasks.map(task => (
                <tr key={task.id}>
                  <td>{task.task_name}</td>
                  <td>{task.progress}/{task.total}</td>
                  <td>{task.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="task-history">
          <h2>任务历史</h2>
          <table>
            <thead>
              <tr>
                <th>任务名称</th>
                <th>奖励</th>
                <th>完成时间</th>
              </tr>
            </thead>
            <tbody>
              {profile.task_history.map(history => (
                <tr key={history.id}>
                  <td>{history.task_name}</td>
                  <td>{history.reward}</td>
                  <td>{new Date(history.completed_at).toLocaleString('zh-CN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;