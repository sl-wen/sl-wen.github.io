import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase-config';
import Loading from '../components/Loading';
import '../styles/ProfilePage.css';

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
    <div className="profile-container">
      <h1>个人中心</h1>
      {error && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}
      <form className="userprofile" onSubmit={handlesettingSubmit}>
        <div className="username">
          <label>用户名</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="avatar_url">
          <label>头像URL</label>
          <input
            type="text"
            id="avatar_url"
            name="avatar_url"
            value={formData.avatar_url}
            onChange={handleInputChange}
          />
        </div>
        <div className="avatar_preview" style={{margin: '10px 0'}}>
          {formData.avatar_url && (
            <img src={formData.avatar_url} alt="Avatar" style={{height:50,borderRadius:8}} />
          )}
        </div>
        <button type="submit" disabled={loading}>保存</button>
      </form>
    </div>
  );
};

export default SettingsPage;