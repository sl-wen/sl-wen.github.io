// 导入supabase客户端
import { supabase } from './supabase-config.js';
import { showMessage } from './common.js';
// 获取用户等级表
async function getuserlevels(level) {
    try {
        const { data: user_levels, error: profileError } = await supabase
            .from('user_levels')
            .select('*')
            .eq('level', level)
            .single();

        console.log('user_levels:', user_levels);
        return user_levels;

    } catch (error) {
        showMessage(error.message || '获取用户等级表失败', 'error');
        return null;
    }
}

// 获取连续登录奖励表
async function getconsecutiveLoginsrewards(consecutiveLogins) {
    try {
        const { data: consecutiveLoginsrewards, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('action_type', 'consecutive_login')
            .lte('required_count', consecutiveLogins)  // 小于等于指定consecutiveLogins
            .order('required_count', { ascending: false })  // 按consecutiveLogins降序排列
            .limit(1);  // 只取第一条记录

        console.log('consecutiveLoginsrewards:', consecutiveLoginsrewards);
        return consecutiveLoginsrewards;

    } catch (error) {
        showMessage(error.message || '获取连续登录奖励表失败', 'error');
        return null;
    }
}

// 更新用户等级
async function updprofileslevel(level, user_id) {
    try {
        const { error } = await supabase
            .from('profiles')
            .update({
                level: level + 1,
                updated_at: new Date()
            })
            .eq('user_id', user_id);
    } catch (error) {
        showMessage(error.message || '更新用户等级失败', 'error');
        return null;
    }
}

// 更新用户登录时间
async function updprofileslastlogin(user_id) {
    try {
        const { error } = await supabase
            .from('profiles')
            .update({
                last_login: new Date(),
                updated_at: new Date()
            })
            .eq('user_id', user_id);
    } catch (error) {
        showMessage(error.message || '更新用户登录时间失败', 'error');
        return null;
    }
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

    const lastLogin = new Date(last_login);
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
    try {
        // 更新连续登录天数
        console.log('处理用户登录奖励开始');
        const consecutiveLogins = getconsecutivelogins(
            profile.last_login,
            profile.consecutive_logins || 0
        );
        console.log('更新连续登录天数:', consecutiveLogins);
        console.log('profile:', profile);
        const userlevel = await getuserlevels(profile.level);
        console.log('userlevel:', userlevel);
        // 检查是否为当天首次登录
        const isFirstLogin = isFirstLoginOfDay(profile.last_login);
        console.log('是否为当天首次登录:', isFirstLogin);

        let rewards_experience = 0;
        let rewards_coins = 0;
        let updlevel = profile.level;
        // 如果不是当天首次登录，只更新登录时间，不给予奖励
        if (!isFirstLogin) {
            await updprofileslastlogin(profile.user_id);

            showMessage('今日已领取登录奖励', 'success')
        } else {
            rewards_experience = userlevel.daily_login_exp || 0;
            rewards_coins = userlevel.daily_login_exp || 0;
            const consecutiveLoginsrewards = await getconsecutiveLoginsrewards(consecutiveLogins);
            rewards_experience += consecutiveLoginsrewards.rewards_exp || 0;
            rewards_coins += consecutiveLoginsrewards.rewards_coins || 0;
            console.log('连续登录:', consecutiveLoginsrewards);

            if (consecutiveLogins > 1) {
                showMessage(`连续登录 ${consecutiveLogins} 天,获得 ${consecutiveLoginsrewards.exp_reward} 经验和 ${consecutiveLoginsrewards.coins_reward} 币`, 'success')
            }

            if ((profile.experience + rewards_experience) > userlevel.required_exp) {
                updlevel = updlevel + 1;
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
            console.log('updatedProfile:', updatedProfile);
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .update(updatedProfile)
                    .eq('user_id', profile.user_id)
                    .select();

                // 获取用户详细信息
                const { data: newprofile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('user_id', profile.user.id)
                    .single();

                sessionStorage.setItem('userProfile', JSON.stringify(newprofile));
            } catch (error) {
                showMessage(error.message || '更新用户资料失败', 'error');
            }

            // 返回结果
            showMessage(`获得 ${rewards_experience} 经验和 ${rewards_experience} 币`, 'info')
        }
    } catch (error) {
        showMessage(`error:${error} `, 'error')
    }
}

// 点赞任务处理函数
async function handleLikeTask(user_id) {
    if (!user_id) return;

    try {
        // 获取用户的任务完成情况
        const { data: taskData, error: taskError } = await supabase
            .from('user_tasks')
            .select('*')
            .eq('user_id', user_id)
            .eq('task_type', 'like')
            .eq('completed_date', new Date().toISOString().split('T')[0])
            .maybeSingle();

        if (taskError) throw taskError;

        // 如果今天已经完成了点赞任务，则不再处理
        if (taskData) return;

        // 获取用户资料
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user_id)
            .single();

        if (profileError) throw profileError;

        // 点赞任务奖励：经验值+5，金币+10
        const expReward = 5;
        const coinReward = 10;

        // 更新用户经验值和金币
        const newExp = (profileData.experience || 0) + expReward;
        const newCoins = (profileData.coins || 0) + coinReward;

        // 检查是否升级
        const currentLevel = profileData.level || 1;
        const { newLevel, levelUp } = calculateNewLevel(newExp, currentLevel);

        // 更新用户资料
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                experience: newExp,
                coins: newCoins,
                level: newLevel
            })
            .eq('user_id', user_id);

        if (updateError) throw updateError;

        // 记录任务完成
        const { error: insertError } = await supabase
            .from('user_tasks')
            .insert({
                user_id: user_id,
                task_type: 'like',
                completed_date: new Date().toISOString().split('T')[0],
                reward_exp: expReward,
                reward_coins: coinReward
            });

        if (insertError) throw insertError;

        // 显示奖励消息
        showMessage(`点赞任务完成！获得 ${expReward} 经验和 ${coinReward} 金币`, 'success');

        // 如果升级，显示升级消息
        if (levelUp) {
            showMessage(`恭喜你升级到 ${newLevel} 级！`, 'success');
        }

        // 更新会话中的用户资料
        updateSessionProfile(user_id, newExp, newCoins, newLevel);

    } catch (error) {
        console.error('处理点赞任务时出错:', error);
    }
}

// 评论任务处理函数
async function handleCommentTask(user_id) {
    if (!user_id) return;

    try {
        // 获取用户的任务完成情况
        const { data: taskData, error: taskError } = await supabase
            .from('user_tasks')
            .select('*')
            .eq('user_id', user_id)
            .eq('task_type', 'comment')
            .eq('completed_date', new Date().toISOString().split('T')[0])
            .maybeSingle();

        if (taskError) throw taskError;

        // 如果今天已经完成了评论任务，则不再处理
        if (taskData) return;

        // 获取用户资料
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user_id)
            .single();

        if (profileError) throw profileError;

        // 评论任务奖励：经验值+10，金币+20
        const expReward = 10;
        const coinReward = 20;

        // 更新用户经验值和金币
        const newExp = (profileData.experience || 0) + expReward;
        const newCoins = (profileData.coins || 0) + coinReward;

        // 检查是否升级
        const currentLevel = profileData.level || 1;
        const { newLevel, levelUp } = calculateNewLevel(newExp, currentLevel);

        // 更新用户资料
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                experience: newExp,
                coins: newCoins,
                level: newLevel
            })
            .eq('user_id', user_id);

        if (updateError) throw updateError;

        // 记录任务完成
        const { error: insertError } = await supabase
            .from('user_tasks')
            .insert({
                user_id: user_id,
                task_type: 'comment',
                completed_date: new Date().toISOString().split('T')[0],
                reward_exp: expReward,
                reward_coins: coinReward
            });

        if (insertError) throw insertError;

        // 显示奖励消息
        showMessage(`评论任务完成！获得 ${expReward} 经验和 ${coinReward} 金币`, 'success');

        // 如果升级，显示升级消息
        if (levelUp) {
            showMessage(`恭喜你升级到 ${newLevel} 级！`, 'success');
        }

        // 更新会话中的用户资料
        updateSessionProfile(user_id, newExp, newCoins, newLevel);

    } catch (error) {
        console.error('处理评论任务时出错:', error);
    }
}

// 计算新等级
function calculateNewLevel(experience, currentLevel) {
    // 简单的等级计算公式：每100经验值升一级
    const newLevel = Math.floor(experience / 100) + 1;
    return {
        newLevel: Math.max(newLevel, currentLevel), // 确保等级不会降低
        levelUp: newLevel > currentLevel
    };
}

// 更新会话中的用户资料
function updateSessionProfile(user_id, experience, coins, level) {
    const userProfileStr = sessionStorage.getItem('userProfile');
    if (userProfileStr) {
        const userProfile = JSON.parse(userProfileStr);
        if (userProfile.user_id === user_id) {
            userProfile.experience = experience;
            userProfile.coins = coins;
            userProfile.level = level;
            sessionStorage.setItem('userProfile', JSON.stringify(userProfile));
        }
    }
}

// 导出函数
export {
    updprofileslevel,
    handleLikeTask,
    handleCommentTask,
    calculateNewLevel,
    updateSessionProfile,
    handleLoginRewards
};