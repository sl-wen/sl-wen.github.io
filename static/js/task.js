// 导入supabase客户端
import { supabase } from './supabase-config.js';
import { showMessage } from './common.js';

// 为标签按钮添加切换功能
document.addEventListener('DOMContentLoaded', () => {
    // 检查用户会话状态
    const userSessionStr = sessionStorage.getItem('userSession');
    const userProfileStr = sessionStorage.getItem('userProfile');
    // 解析 JSON 字符串
    const userSession = userSessionStr ? JSON.parse(userSessionStr) : null;
    const userProfile = userProfileStr ? JSON.parse(userProfileStr) : null;

    const tagButtons = document.querySelectorAll('.tag-btn');
    const displaySections = document.querySelectorAll('.displaydiv');

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
                        id: data.user.id,
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

});


// 获取用户等级表
function getuserlevels(level) {

    const { data: user_levels, error: profileError } = await supabase
        .from('user_levels')
        .select('*')
        .eq('level', level)
        .single();

    return user_levels;
}

// 获取连续登录奖励表
function getconsecutiveLoginsrewards(consecutiveLogins) {

    const { data: consecutiveLoginsrewards, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('action_type', 'consecutive_login')
        .lte('required_count', consecutiveLogins)  // 小于等于指定consecutiveLogins
        .order('required_count', { ascending: false })  // 按consecutiveLogins降序排列
        .limit(1);  // 只取第一条记录

    return consecutiveLoginsrewards;
}

// 更新用户等级
function updprofileslevel(level, id) {

    const { error } = await supabase
        .from('profiles')
        .update({
            level: level + 1,
            updated_at: new Date()
        })
        .eq('id', id);
}

// 更新用户登录时间
function updprofileslastlogin(id) {

    const { error } = await supabase
        .from('profiles')
        .update({
            last_login: new Date(),
            updated_at: new Date()
        })
        .eq('id', id);
}

/**
 * 检查是否为当天首次登录
 * @param lastLoginTime 上次登录时间
 * @returns 是否为当天首次登录
 */
function isFirstLoginOfDay(last_login) {
    if (!last_login) {
        return true; // 如果没有上次登录时间，视为首次登录
    }

    const lastLogin = new Date(lastLoginTime);
    const now = new Date();

    // 检查是否为同一天 (比较年、月、日)
    return !(
        lastLogin.getFullYear() === now.getFullYear() &&
        lastLogin.getMonth() === now.getMonth() &&
        lastLogin.getDate() === now.getDate()
    );
}

/**
 * 更新连续登录天数
 * @param last_login 上次登录时间
 * @param consecutive_logins 当前连续登录天数
 * @returns 更新后的连续登录天数
 */
function getconsecutivelogins(last_login, consecutive_logins) {
    if (!last_login) {
        return 1; // 首次登录，连续登录天数为1
    }

    const lastLogin = new Date(last_login);
    const now = new Date();

    // 计算日期差异 (不考虑时分秒)
    const lastLoginDate = new Date(lastLogin.getFullYear(), lastLogin.getMonth(), lastLogin.getDate());
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffTime = todayDate.getTime() - lastLoginDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
        // 连续登录，天数+1
        return consecutive_logins + 1;
    } else if (diffDays === 0) {
        // 当天重复登录，连续天数不变
        return consecutive_logins;
    } else {
        // 登录间隔超过1天，重置为1
        return 1;
    }
}

/**
 * 处理用户登录奖励
 * @param profile 用户
 */
async function handleLoginRewards(profile) {

    // 更新连续登录天数
    const consecutiveLogins = getconsecutivelogins(
        profile.last_login,
        profile.consecutive_logins || 0
    );

    const userlevel = getuserlevels();
    // 检查是否为当天首次登录
    const isFirstLogin = isFirstLoginOfDay(profile.last_login);

    const rewards_experience = 0;
    const rewards_coins = 0;
    const updlevel = profile.level;
    // 如果不是当天首次登录，只更新登录时间，不给予奖励
    if (!isFirstLogin) {
        updprofileslastlogin();

        showMessage('今日已领取登录奖励', 'info')
    } else {
        rewards_experience = userlevel.daily_login_exp || 0;
        rewards_coins = userlevel.daily_login_exp || 0;
        const consecutiveLoginsrewards = getconsecutiveLoginsrewards(consecutiveLogins);
        rewards_experience += consecutiveLoginsrewards.rewards_exp || 0;
        rewards_coins += consecutiveLoginsrewards.rewards_coins || 0;

        if (consecutiveLogins > 1) {
            showMessage(`连续登录 ${consecutiveLogins} 天,获得 ${consecutiveLoginsrewards.rewards_exp} 经验和 ${consecutiveLoginsrewards.rewards_coins} 币)`, 'info')
        }

        if ((profile.experience + rewards_experience) > userlevel.required_exp) {
            const updlevel = updlevel + 1;
            rewards_coins += userlevel.level_up_reward_coins;
            showMessage(`恭喜升级！到达 ${updlevel} 级,获得${userlevel.level_up_reward_coins} 币`, 'info')
        }
        // 更新用户资料
        const updatedProfile = {
            experience: (profile.experience || 0) + rewards_experience,
            coins: (profile.coins || 0) + rewards_coins,
            consecutive_logins: consecutiveLogins,
            level: updlevel,
            last_login: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }

        const { data, error } = await supabase
            .from('profiles')
            .update(updatedProfile)
            .eq('id', profile.id)
            .select();

        // 返回结果
        showMessage(`获得 ${rewards_experience} 经验和 ${rewards_experience} 币`, 'info')
    }
}

export default {
    handleLoginRewards,
    updprofileslevel
};