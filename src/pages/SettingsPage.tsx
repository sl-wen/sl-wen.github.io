import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase-config';
import Loading from '../components/Loading';
import { Input, Button, Card, Alert } from '../components/ui';

interface UserProfile {
  user_id: string;
  username: string;
  avatar_url: string;
  level: number;
  coins: number;
  experience: number;
}

interface settingFormData {
  username: string;
  avatar_url: string;
}

const SettingsPage: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<settingFormData>({
    username: '',
    avatar_url: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  // 加载本地profile
  const loadProfile = async () => {
    try {
      const data = localStorage.getItem('userProfile');
      if (data) {
        const profile: UserProfile = JSON.parse(data);
        setUserProfile(profile);
        setFormData({
          username: profile.username || '',
          avatar_url: profile.avatar_url || ''
        });
      } else {
        setUserProfile(null);
        setFormData({
          username: '',
          avatar_url: ''
        });
      }
    } catch (error) {
      setError('加载用户资料失败');
    } finally {
      setLoading(false);
    }
  };

  // 编辑内容实时更新
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // 保存
  const handlesettingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!userProfile) return;

    // 校验输入
    if (!formData.username.trim()) {
      setError('用户名不能为空');
      setLoading(false);
      return;
    }

    try {
      // 更新Supabase数据库
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          avatar_url: formData.avatar_url
        })
        .eq('user_id', userProfile.user_id);

      if (updateError) {
        setError('保存失败: ' + updateError.message);
      } else {
        // 更新 localStorage/profile 状态
        const updatedProfile = {
          ...userProfile,
          username: formData.username,
          avatar_url: formData.avatar_url
        };
        setUserProfile(updatedProfile);
        localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
        setSuccess('保存成功！');
      }
    } catch (err) {
      setError('保存出错');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!userProfile) {
    return <div>未找到用户资料</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            个人设置
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            管理您的个人资料信息
          </p>
          <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mt-4"></div>
        </div>

        {/* 消息提示 */}
        {error && (
          <Alert variant="error" onClose={() => setError(null)} className="mb-6">
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" onClose={() => setSuccess(null)} className="mb-6">
            {success}
          </Alert>
        )}

        {/* 设置表单 */}
        <Card>
          <form onSubmit={handlesettingSubmit} className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <span>👤</span>
                基本信息
              </h2>
              
              <div className="space-y-4">
                <Input
                  label="用户名"
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="请输入用户名"
                  required
                  fullWidth
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  }
                />

                <Input
                  label="头像URL"
                  type="url"
                  id="avatar_url"
                  name="avatar_url"
                  value={formData.avatar_url}
                  onChange={handleInputChange}
                  placeholder="请输入头像图片链接"
                  fullWidth
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                  helperText="支持常见图片格式，建议尺寸 200x200px"
                />

                {/* 头像预览 */}
                {formData.avatar_url && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      头像预览
                    </label>
                    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <img 
                        src={formData.avatar_url} 
                        alt="Avatar Preview" 
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMzIiIGZpbGw9IiNGM0Y0RjYiLz4KPHN2ZyB4PSIxNiIgeT0iMTYiIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjOUI5OUIkij4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyUzYuNDggMjIgMTIgMjJTMjIgMTcuNTIgMjIgMTJTMTcuNTIgMiAxMiAyWk0xMiA2QzEzLjY2IDYgMTUgNy4zNCAxNSA5UzEzLjY2IDEyIDEyIDEyUzkgMTAuNjYgOSA5UzEwLjM0IDYgMTIgNlpNMTIgMjBDOS4zMyAyMCA2Ljk4IDE4LjUgNS44IDE2LjJDNi45NSAxNS40OSA4LjY0IDE1IDEyIDE1UzE3LjA1IDE1LjQ5IDE4LjIgMTYuMkMxNy4wMiAxOC41IDE0LjY3IDIwIDEyIDIwWiIgZmlsbD0iIzlCOUJCNSIvPgo8L3N2Zz4KPC9zdmc+';
                        }}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">头像预览</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">这就是其他用户看到的头像</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 提交按钮 */}
            <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading || !formData.username.trim()}
                isLoading={loading}
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                }
              >
                {loading ? '保存中...' : '保存设置'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
