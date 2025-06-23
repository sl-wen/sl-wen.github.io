// 导入supabase客户端
import { supabase } from './supabase-config.js';
import { showMessage } from './common.js';

document.addEventListener('DOMContentLoaded', function () {
    // 为用户名表单添加提交事件监听
    const settingForm = document.getElementById('setting-form');
    const usernamedetail = document.getElementById('username-detail');
    const avatarurldetail = document.getElementById('avatar_url-detail');
    // 检查用户会话状态
    const userSessionStr = localStorage.getItem('userSession');
    const userProfileStr = localStorage.getItem('userProfile');
    // 解析 JSON 字符串
    const userSession = userSessionStr ? JSON.parse(userSessionStr) : null;
    const userProfile = userProfileStr ? JSON.parse(userProfileStr) : null;
    if (usernamedetail) {
        usernamedetail.value = userProfile?.username || userSession?.user.email;
    }
    if (avatarurldetail) {
        avatarurldetail.value = userProfile?.avatar_url;
    }
    if (settingForm) {
        settingForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // 阻止表单默认提交行为
            const newusername = document.getElementById('username-detail').value;
            const newavatarurl = document.getElementById('avatar_url-detail').value;

            // 验证输入不为空
            if (!newusername) {
                showMessage('用户名不能为空', 'error');
                return;
            }
            // 验证URL格式
            if (!isValidURL(newavatarurl)) {
                showMessage('请输入有效的URL', 'error');
                return;
            }

            if (userProfile.username != newusername || userProfile.avatar_url != newavatarurl) {
                await userProfilechange(userProfile, newusername, newavatarurl);
            }
            else {
                showMessage('用户资料未变更', 'info');
            }
        });
    }

    function isValidURL(url) {
        try {
            new URL(url);
            return true;
        } catch (error) {
            return false;
        }
    }

    // 变更用户名函数
    const userProfilechange = async (userProfile, newusername, newavatarurl) => {

        const user_id = userProfile.user_id;
        try {
            showMessage('变更中...', 'info');

            if (userProfile.username != newusername) {
                // 获取用户详细信息
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('username', newusername)
                    .maybeSingle();

                if (profile) {
                    showMessage('用户名已存在', 'error');
                    return null;
                }
            }

            // 变更用户资料
            const { error: userProfilechangeError } = await supabase
                .from('profiles')
                .update({
                    username: newusername,
                    avatar_url: newavatarurl,
                    updated_at: new Date()
                })
                .eq('user_id', user_id);

            if (userProfilechangeError) {
                showMessage(userProfilechangeError.message || '变更用户资料失败', 'error');
                return ;
            }

            const { data: newprofile } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', user_id)
                .maybeSingle();

            localStorage.setItem('userProfile', JSON.stringify(newprofile));
            showMessage('变更用户资料成功！', 'success');

            // 跳转到首页
            setTimeout(() => {
                window.location.href = `/`;
            }, 1500);
        } catch (error) {
            showMessage(error.message || '变更用户资料失败', 'error');
            return ;
        }
    };
});