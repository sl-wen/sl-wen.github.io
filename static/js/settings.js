// 导入supabase客户端
import { supabase } from './supabase-config.js';
import { showMessage } from './common.js';

document.addEventListener('DOMContentLoaded', function () {
    // 为用户名表单添加提交事件监听
    const usernameForm = document.getElementById('username-form');
    const usernamedetail = document.getElementById('username-detail');
    // 检查用户会话状态
    const userSessionStr = sessionStorage.getItem('userSession');
    const userProfileStr = sessionStorage.getItem('userProfile');
    // 解析 JSON 字符串
    const userSession = userSessionStr ? JSON.parse(userSessionStr) : null;
    const userProfile = userProfileStr ? JSON.parse(userProfileStr) : null;
    if (usernamedetail) {
        usernamedetail.value = userProfile?.username || userSession?.user.email;
    }
    if (usernameForm) {
        usernameForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // 阻止表单默认提交行为
            const newusername = document.getElementById('username-detail').value;

            // 验证输入不为空
            if (!newusername) {
                showMessage('用户名不能为空', 'error');
                return;
            }

            await usernamechange(userProfile, newusername);
        });
    }

    // 变更用户名函数
    const usernamechange = async (userProfile, newusername) => {
        const user_id = userProfile.user_id;
        try {
            showMessage('变更中...', 'info');


            // 获取用户详细信息
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('username', newusername)
                .single();

            if (profile) {
                showMessage('用户名已存在', 'error');
                return null;
            }

            // 变更用户资料
            const { error: usernamechangeError } = await supabase
                .from('profiles')
                .update({
                    username: newusername,
                    updated_at: new Date()
                })
                .eq('user_id', user_id);

            if (usernamechangeError) console.error('变更用户资料失败:', usernamechangeError);

            const { data: newprofile } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', user_id)
                .single();

            sessionStorage.setItem('userProfile', JSON.stringify(newprofile));
            showMessage('变更用户资料成功！', 'success');

            // 跳转到首页
            setTimeout(() => {
                window.location.href = `/`;
            }, 1500);
        } catch (error) {
            showMessage(error.message || '变更用户资料失败', 'error');
            return null;
        }
    };
});