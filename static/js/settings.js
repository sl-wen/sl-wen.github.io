// 导入supabase客户端
import { supabase } from './supabase-config.js';
import * as common from './common.js';

document.addEventListener('DOMContentLoaded', function () {
    // 为用户名表单添加提交事件监听
    const usernameForm = document.getElementById('username-form');
    if (usernameForm) {
        usernameForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // 阻止表单默认提交行为
            const newusername = document.getElementById('username-detail').value;

            // 验证输入不为空
            if (!newusername) {
                common.showMessage('用户名不能为空', 'error');
                return;
            }

            await usernamechange(newusername);
        });
    }

    // 变更用户名函数
    const usernamechange = async (newusername) => {
        const userProfile = sessionStorage.getItem('userProfile');
        const profileid = userProfile.id;
        try {
            common.showMessage('变更中...', 'info');


            // 获取用户详细信息
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('username', newusername)
                .single();

            if (profile.username) {
                common.showMessage('用户名已存在', 'error');
                return null;
            }

            // 变更用户资料
            const { error: usernamechangeError } = await supabase
                .from('profiles')
                .update({
                    username: newusername,
                    updated_at: new Date()
                })
                .eq('id', profileid);

            if (usernamechangeError) console.error('变更用户资料失败:', usernamechangeError);

            const { data: newprofile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', profileid)
                .single();

            sessionStorage.setItem('userProfile', JSON.stringify(newprofile));
            common.showMessage('变更用户资料成功！', 'success');

            // 跳转到首页
            setTimeout(() => {
                window.location.href = `/`;
            }, 1500);
        } catch (error) {
            common.showMessage(error.message || '变更用户资料失败', 'error');
            return null;
        }
    };
});