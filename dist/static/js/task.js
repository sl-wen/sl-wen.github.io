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
            .maybeSingle();

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
        return ;
    } catch (error) {
        showMessage(error.message || '更新用户登录时间失败', 'error');
        return ;
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
 * 检查是否为当周首次登录
 * @param last_login 上次登录时间
 * @returns 是否为当天首次登录
 */
/**
 * 检查当前时间是否与上次登录时间在同一周
 * @param {string|number|Date} last_login - 上次登录时间
 * @returns {boolean} - 如果不在同一周返回true，否则返回false
 */
function isFirstLoginOfWeek(last_login) {
    if (!last_login) {
        return true; // 如果没有上次登录时间，视为首次登录
    }

    const lastLogin = new Date(last_login);
    const now = new Date();

    // 计算两个日期距离1970年1月1日（周四）的天数
    const msPerDay = 24 * 60 * 60 * 1000;
    const lastLoginDays = Math.floor(lastLogin.getTime() / msPerDay);
    const nowDays = Math.floor(now.getTime() / msPerDay);

    // 计算两个日期分别是周几 (0 = 周一, ..., 6 = 周日)
    // 注意：JavaScript中getDay()返回的0是周日，所以需要调整
    const lastLoginDay = (lastLogin.getDay() + 6) % 7;
    const nowDay = (now.getDay() + 6) % 7;

    // 计算两个日期所在周的周一的天数
    const lastLoginMonday = lastLoginDays - lastLoginDay;
    const nowMonday = nowDays - nowDay;

    // 如果两个日期的周一是同一天，则它们在同一周
    return lastLoginMonday !== nowMonday;
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
                console.log(`连续登录 ${consecutiveLogins} 天,获得 ${consecutiveLoginsrewards.exp_reward} 经验和 ${consecutiveLoginsrewards.coins_reward} 币`)
            }

            if ((profile.experience + rewards_experience) > userlevel.required_exp) {
                updlevel = updlevel + 1;
                rewards_coins += userlevel.level_up_reward_coins;
                console.log(`恭喜升级！到达 ${updlevel} 级,获得${userlevel.level_up_reward_coins} 币`)
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
                const { data:updatedProfiles, error } = await supabase
                    .from('profiles')
                    .update(updatedProfile)
                    .eq('user_id', profile.user_id)
                    .select();
                    
                localStorage.setItem('userProfile', JSON.stringify(updatedProfiles));
            } catch (error) {
                console.log(error.message || '更新用户资料失败');
            }

            // 返回结果
            showMessage(`获得 ${rewards_experience} 经验和 ${rewards_experience} 币`, 'info')
        }
    } catch (error) {
        console.log(`error:${error} `, 'error')
    }
}

// 初始化任务处理函数
async function initusertasks(user_id) {
    try {
        console.log('初始化任务开始');
        const usertasksdatas = await getusertasks(user_id);
        console.log('usertasksdatas:',usertasksdatas);
        if (!usertasksdatas  || usertasksdatas.length === 0 ) {
            const tasksdatas = await gettasksALL();
            console.log('tasksdatas:',tasksdatas);
            if (tasksdatas && tasksdatas.length > 0) {
                console.log('首次初始化开始');
                tasksdatas.forEach(async (tasksdata) => {
                    try {
                        const newusertask = {
                            user_id: user_id,
                            task_id: tasksdata.task_id,
                            current_count: 0,
                            is_claimed: false,
                            claimed_at: null,
                        };
                        await insusertasks(newusertask);
                    } catch (error) {
                        console.log('用户任务进度初期追加失败', error);
                    }
                });
            }
        } else {
            usertasksdatas.forEach(async (usertasksdata) => {
                console.log('进度初始化开始');
                try {
                    if (usertasksdata.name === 'daily' && isFirstLoginOfDay(usertasksdata.updated_at)) {
                        await resetusertasks(usertasksdata.usertask_id);
                        console.log('daily任务进度初期化', usertasksdata.usertask_id);
                    }
                    if (usertasksdata.name === 'weekly' && isFirstLoginOfWeek(usertasksdata.updated_at)) {
                        await resetusertasks(usertasksdata.usertask_id);
                    }
                } catch (error) {
                    console.log('用户任务进度初期追加失败', error);
                }
            });

        }
    } catch (error) {
        console.log('初始化任务进度失败', error);
    }
}


// 计算新等级
function calculateNewLevel(experience, rewards_experience, required_exp) {
    return (experience + rewards_experience) > required_exp;
}


async function getusertasks(user_id) {
    try {
        const { data: usertasks, error } = await supabase
            .from('user_tasks_view')
            .select('*')
            .eq('user_id', user_id)
            .order('name', { ascending: true })
            .order('action_type', { ascending: false });
        return usertasks;
    } catch (error) {
        console.log('getusertasks error', error);
        return null;
    }

}

async function insusertasks(newusertask) {
    try {
        const { data, error } = await supabase
            .from('user_tasks')
            .insert([newusertask])
            .select()
            .maybeSingle();
        return;
    } catch (error) {
        console.log('insusertasks error', error);
    }

}

async function resetusertasks(usertask_id) {
    try {
        const { data, error } = await supabase
            .from('user_tasks')
            .update({
                current_count: 0,
                updated_at: new Date().toISOString()
            })
            .eq('usertask_id', usertask_id);
        return;
    } catch (error) {
        console.log('resetusertasks error', error);
        return;
    }

}

async function gettasks(task_id) {
    try {
        const { data: tasks, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('task_id', task_id)
            .maybeSingle();
        return tasks;
    } catch (error) {
        console.log('gettasks error', error);
        return null;
    }

}

async function gettasksALL() {
    try {
        const { data: tasks, error } = await supabase
            .from('tasks')
            .select('*');
        return tasks;
    } catch (error) {
        console.log('gettasksALL error', error);
        return null;
    }
}

async function gettasktypes(tasktype_id) {
    try {
        const { data: tasktypes, error } = await supabase
            .from('task_types')
            .select('*')
            .eq('tasktype_id', tasktype_id)
            .maybeSingle();
        return tasktypes;
    } catch (error) {
        console.log('gettasktypes error', error);
        return null;
    }

}


async function gettaskrewardhistory(user_id) {
    try {
        const { data: taskrewardhistorys, error } = await supabase
            .from('task_reward_history')
            .select('*')
            .eq('user_id', user_id);
        return taskrewardhistorys;
    } catch (error) {
        console.log('gettaskrewardhistory error', error);
        return null;
    }

}

// 导出函数
export {
    updprofileslevel,
    calculateNewLevel,
    handleLoginRewards,
    getusertasks,
    gettasks,
    gettasktypes,
    gettaskrewardhistory,
    initusertasks
};