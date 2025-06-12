// 导入supabase客户端
import { supabase } from './supabase-config.js';
import { showMessage } from './common.js';
import { handleLoginRewards } from './task.js';

// 为标签按钮添加切换功能
document.addEventListener('DOMContentLoaded', () => {
    const tagButtons = document.querySelectorAll('.tag-btn');
    const displaySections = document.querySelectorAll('.displaydiv');

    tagButtons.forEach(button => {
        button.addEventListener('click', function () {
            const tag = this.getAttribute('data-tag');

            // 移除所有按钮的活动状态
            tagButtons.forEach(btn => btn.classList.remove('active'));

            // 为当前点击的按钮添加活动状态
            this.classList.add('active');

            // 隐藏所有内容
            displaySections.forEach(section => section.classList.remove('active'));

            // 显示对应标签的内容
            document.getElementById(`${tag}-form`).classList.add('active');
        });
    });


    // 为登录表单添加提交事件监听
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // 阻止表单默认提交行为
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            // 验证输入不为空
            if (!email || !password) {
                showMessage('邮箱和密码不能为空', 'error');
                return;
            }

            await login(email, password);
        });
    }

    // 为注册表单添加提交事件监听
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const passwordAgain = document.getElementById('passwordagain').value;

            // 验证输入不为空
            if (!email || !password || !passwordAgain) {
                showMessage('所有字段都必须填写', 'error');
                return;
            }

            // 验证两次密码输入是否一致
            if (password !== passwordAgain) {
                showMessage('两次输入的密码不一致', 'error');
                return;
            }

            // 验证邮箱格式
            if (!isValidEmail(email)) {
                showMessage('请输入有效的邮箱地址', 'error');
                return;
            }

            if (!isPasswordComplex(password)) {
                showMessage('密码需至少8位，且包含大写、小写、数字、特殊字符中的最少两种', 'error');
                return;
            }

            await signup(email, password);
        });
    }

    // 为忘记密码表单添加提交事件监听
    const forgetForm = document.getElementById('forget-form');
    if (forgetForm) {
        forgetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('forget-email').value;

            if (!email) {
                showMessage('请输入邮箱', 'error');
                return;
            }

            if (!isValidEmail(email)) {
                showMessage('请输入有效的邮箱地址', 'error');
                return;
            }

            await resetPassword(email);
        });
    }

    // 登录函数
    const login = async (email, password) => {
        try {
            showMessage('登录中...', 'info');

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            showMessage('登录成功！', 'success');
            const { data: sessiondata, error: sessionerror } = await supabase.auth.getSession();
            const session = sessiondata?.session;
            // 获取用户详细信息
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .single();

            sessionStorage.setItem('userSession', JSON.stringify(session));
            sessionStorage.setItem('userProfile', JSON.stringify(profile));
            await handleLoginRewards(profile);
            // 跳转到首页
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);

            return profile;
        } catch (error) {
            showMessage(error.message || '登录失败，请检查邮箱和密码', 'error');
            return null;
        }
    };

    // 注册函数
    const signup = async (email, password) => {
        try {
            showMessage('注册中...', 'info');

            // 使用Supabase Auth注册
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/pages/login.html`,
                },
            });

            if (error) throw error;

            // 创建用户资料
            if (data.user) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([{
                        user_id: data.user.id,
                        username: email.split('@')[0],
                        level: 0,
                        amount: 0,
                        adress: '',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    }]);

                if (profileError) console.error('创建用户资料失败:', profileError);
            }

            showMessage('注册成功！请验证您的邮箱后登录', 'success');
            // 切换到登录表单
            setTimeout(() => {
                document.querySelector('[data-tag="login"]').click();
            }, 1000);

            return data;
        } catch (error) {
            showMessage(error.message || '注册失败', 'error');
            return null;
        }
    };

    // 重置密码函数
    const resetPassword = async (email) => {
        try {
            showMessage('处理中...', 'info');

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/pages/reset-password.html`,
            });

            if (error) throw error;

            showMessage('重置密码链接已发送到您的邮箱', 'success');
        } catch (error) {
            showMessage(error.message || '重置密码请求失败', 'error');
        }
    };

    // 设置密码强度监听
    const signuppassword = document.getElementById('signup-password');

    if (signuppassword) {
        signuppassword.addEventListener('input', function () {
            updatePasswordStrength(this.value);
        });
    }

});
