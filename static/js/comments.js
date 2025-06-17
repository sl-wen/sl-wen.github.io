// 导入 Supabase 客户端和通用函数
import { supabase } from './supabase-config.js';
import { showMessage, formatDate } from './common.js';

// 当页面加载完成时初始化评论功能
// 添加状态锁变量
let isSubmittingComment = false;
let isSubmittingReply = false;

document.addEventListener('DOMContentLoaded', async () => {
    // 获取文章ID
    const urlParams = new URLSearchParams(window.location.search);
    const post_id = urlParams.get('post_id');

    // 获取当前用户信息
    const userSessionStr = sessionStorage.getItem('userSession');
    const userProfileStr = sessionStorage.getItem('userProfile');
    const userSession = userSessionStr ? JSON.parse(userSessionStr) : null;
    const userProfile = userProfileStr ? JSON.parse(userProfileStr) : null;

    // 初始化评论区
    if (post_id) {
        await initComments(post_id, userProfile);
    }

    // 初始化评论表单提交事件
    const commentForm = document.getElementById('main-comment-form');
    if (commentForm) {
        commentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!userSession) {
                showMessage('请先登录后再发表评论', 'error');
                return;
            }

            if (isSubmittingComment) {
                showMessage('评论正在提交中，请稍候...', 'info');
                return;
            }

            const commentContent = document.getElementById('comment-content').value.trim();
            if (commentContent) {
                isSubmittingComment = true;
                try {
                    await addComment(post_id, userProfile.user_id, commentContent);
                } finally {
                    isSubmittingComment = false;
                }
            }
        });
    }

    // 初始化回复按钮点击事件
    document.addEventListener('click', async (e) => {
        // 回复按钮点击事件
        if (e.target.closest('.reply-action')) {
            if (!userProfile) {
                showMessage('请先登录后再回复评论', 'error');
                return;
            }

            const comment_id = e.target.closest('.reply-action').dataset.comment_id;
            toggleReplyForm(comment_id);
        }

        // 取消回复按钮点击事件
        if (e.target.closest('.cancel-reply')) {
            const comment_id = e.target.closest('.cancel-reply').dataset.comment_id;
            hideReplyForm(comment_id);
        }

    });

    // 初始化回复表单提交事件
    document.addEventListener('submit', async (e) => {
        if (e.target.closest('.reply-form form')) {
            e.preventDefault();
            if (!userProfile) {
                showMessage('请先登录后再回复评论', 'error');
                return;
            }

            if (isSubmittingReply) {
                showMessage('回复正在提交中，请稍候...', 'info');
                return;
            }

            const replyForm = e.target;
            const comment_id = replyForm.closest('.reply-form').id.replace('reply-form-', '');
            const replyContent = replyForm.querySelector('textarea').value.trim();

            if (replyContent) {
                isSubmittingReply = true;
                try {
                    await addReply(post_id, comment_id, userProfile.user_id, replyContent);
                    hideReplyForm(comment_id);
                } finally {
                    isSubmittingReply = false;
                }
            }
        }
    });

    // 初始化评论排序下拉框事件
    const sortSelect = document.querySelector('.sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', async () => {
            await initComments(post_id, userProfile, sortSelect.value);
        });
    }
});

/**
 * 初始化评论区，加载评论列表
 * @param {string} post_id - 文章ID
 * @param {object} userProfile - 当前用户信息
 * @param {string} sortBy - 排序方式：newest, oldest, popular
 */
async function initComments(post_id, userProfile, sortBy = 'newest') {
    try {
        const commentsList = document.querySelector('.comments-list');
        if (!commentsList) return;

        // 显示加载中
        commentsList.innerHTML = '<div class="loading">加载评论中...</div>';

        // 获取评论数据
        let query = supabase
            .from('comments')
            .select(`
                comment_id, content, created_at, 
                user_id, parent_id, 
                likes_count, dislikes_count
            `)
            .eq('post_id', post_id)
            .is('parent_id', null); // 只获取顶级评论

        // 根据排序方式设置排序
        switch (sortBy) {
            case 'newest':
                query = query.order('created_at', { ascending: false });
                break;
            case 'oldest':
                query = query.order('created_at', { ascending: true });
                break;
            case 'popular':
                query = query.order('likes_count', { ascending: false });
                break;
        }

        const { data: comments, error } = await query;

        if (error) throw error;

        // 获取评论总数
        const { count, error: countError } = await supabase
            .from('comments')
            .select('comment_id', { count: 'exact' })
            .eq('post_id', post_id);

        if (countError) throw countError;

        // 更新评论数量显示
        const commentsCount = document.querySelector('.comments-count');
        if (commentsCount) {
            commentsCount.textContent = `评论 (${count || 0})`;
        }

        // 如果没有评论
        if (!comments || comments.length === 0) {
            commentsList.innerHTML = '<div class="no-comments">暂无评论，快来发表第一条评论吧！</div>';
            return;
        }

        // 清空评论列表
        commentsList.innerHTML = '';

        // 渲染评论列表
        for (const comment of comments) {
            // 获取该评论的回复
            const { data: replies, error: repliesError } = await supabase
                .from('comments')
                .select(`
                    comment_id, content, created_at, 
                    user_id, parent_id, 
                    likes_count, dislikes_count
                `)
                .eq('post_id', post_id)
                .eq('parent_id', comment.comment_id)
                .order('created_at', { ascending: true });

            if (repliesError) throw repliesError;

            // 获取当前用户对该评论的反应
            let userReaction = null;
            if (userProfile) {
                const { data: reactionData } = await supabase
                    .from('comment_reactions')
                    .select('type')
                    .eq('user_id', userProfile.user_id)
                    .eq('comment_id', comment.comment_id)
                    .maybeSingle();

                userReaction = reactionData ? reactionData.type : null;
            }

            // 渲染评论
            const commentElement = await createCommentElement(comment, replies, userProfile, userReaction);
            commentsList.appendChild(commentElement);
        }
    } catch (error) {
        console.error('加载评论失败:', error);
        showMessage('加载评论失败，请稍后重试', 'error');
    }
}

/**
 * 创建评论元素
 * @param {object} comment - 评论数据
 * @param {array} replies - 回复数据
 * @param {object} comment - 用户数据
 * @param {string} userReaction - 当前用户对该评论的反应类型
 * @returns {HTMLElement} - 评论元素
 */
async function createCommentElement(comment, replies = [], userProfile = null, userReaction = null) {
    const li = document.createElement('li');
    li.className = 'comment';
    li.id = `comment-${comment.comment_id}`;

    let profilesData = null;
    try {
        // 获取评论的用户信息
        profilesData = await supabase
            .from('profiles')
            .select('username,level,avatar_url')
            .eq('user_id', comment.user_id)
            .maybeSingle();
    } catch (error) {
        console.log('创建评论元素获取用户信息失败');
    }

    const username = profilesData ? profilesData.username : '匿名用户';
    const userlevel = profilesData ? profilesData.level : '1';
    const avatarUrl = profilesData && profilesData.avatar_url
        ? profilesData.avatar_url
        : 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 70);

    // 格式化日期
    const formattedDate = formatDate(comment.created_at);

    // 设置评论HTML
    li.innerHTML = `
        <div class="comment-header">
            <div class="comment-author"> 
                <img src="${avatarUrl}" alt="用户头像" class="author-avatar"> 
                <span class="author-name">${username}</span> 
                <span class="author-level">Lv.${userlevel}</span> 
            </div>
            <div class="comment-meta"> 
                <time datetime="${comment.created_at}">${formattedDate}</time>
            </div>
        </div>
        <div class="comment-body">
            <p>${comment.content}</p>
        </div>
        <div class="comment-actions">
            <div class="comment-reaction-actions">
                <button id="comment-${comment.comment_id}" class="commentlike like-action ${userReaction === 'like' ? 'active' : ''}>
                    👍<span role="img" class="like-count" >${comment.likes_count || 0}</span>
                </button>
                <button id="comment-${comment.comment_id}" class="commentdislike dislike-action ${userReaction === 'dislike' ? 'active' : ''}>
                    👎<span role="img" class="dislike-count" >${comment.dislikes_count || 0}</span>
                </button>
            </div> <!-- 评论点赞/踩计数按钮区域 -->
            <div class="comment-action reply-action" data-comment-id="${comment.comment_id}"> 
                <i class="icon-reply">↩️</i>
                <span>回复</span> 
            </div>
        </div>
        <div class="reply-form" id="reply-form-${comment.comment_id}" style="display: none;">
            <form>
                <div class="form-group"> 
                    <label for="reply-content-${comment.comment_id}" class="form-label">回复 @${username}</label>
                    <textarea id="reply-content-${comment.comment_id}" class="form-control" placeholder="写下你的回复..." required></textarea> 
                </div>
                <div class="form-footer">
                    <div class="form-buttons"> 
                        <button type="button" class="btn btn-cancel cancel-reply" data-comment-id="${comment.comment_id}">取消</button> 
                        <button type="submit" class="btn btn-primary">回复</button> 
                    </div>
                </div>
            </form>
        </div>
        <div class="replies"></div>
    `;

    // 添加回复
    if (replies && replies.length > 0) {
        const repliesContainer = li.querySelector('.replies');
        replies.forEach(reply => {
            try {
                // 获取当前用户对该回复的反应
                let replyreaction = null;
                if (userProfile) {
                    const replyreactionData = await supabase
                        .from('comment_reactions')
                        .select('type')
                        .eq('user_id', userProfile.user_id)
                        .eq('comment_id', reply.comment_id)
                        .maybeSingle();

                    replyreaction = replyreactionData ? replyreactionData.type : null;
                }
                repliesContainer.appendChild(createReplyElement(reply, replyreaction));
            } catch (error) {
                console.log('获取当前用户对该回复的反应失败');
            }
        });
    }

    return li;
}

/**
 * 创建回复元素
 * @param {object} reply - 回复数据
 * @param {string} userReaction - 当前用户对该回复的反应类型
 * @returns {HTMLElement} - 回复元素
 */
function createReplyElement(reply, userReaction = null) {
    const div = document.createElement('div');
    div.className = 'reply';
    div.id = `reply-${reply.comment_id}`;

    let replyprofilesData = null;
    try {
        // 获取回复的用户信息
        replyprofilesData = await supabase
            .from('profiles')
            .select('username,level,avatar_url')
            .eq('user_id', reply.user_id)
            .maybeSingle();
    } catch (error) {
        console.log('创建评论元素获取用户信息失败');
    }

    // 获取用户信息
    const username = replyprofilesData ? replyprofilesData.username : '匿名用户';
    const avatarUrl = replyprofilesData && replyprofilesData.avatar_url
        ? replyprofilesData.avatar_url
        : 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 70);

    // 格式化日期
    const formattedDate = formatDate(reply.created_at);

    // 设置回复HTML
    div.innerHTML = `
        <div class="comment-header">
            <div class="comment-author"> 
                <img src="${avatarUrl}" alt="用户头像" class="author-avatar"> 
                <span class="author-name">${username}</span> 
                <span class="author-level">Lv.${userlevel}</span> 
            </div>
            <div class="comment-meta"> 
                <time datetime="${reply.created_at}">${formattedDate}</time> 
            </div>
        </div>
        <div class="comment-body">
            <p>${reply.content}</p>
        </div>
        <div class="comment-actions">
            <div class="reply-reaction-actions">
            <button id="reply-${reply.comment_id}" class="replylike like-action ${userReaction === 'like' ? 'active' : ''}>
                👍<span role="img" class="like-count" >${reply.likes_count || 0}</span>
            </button>
            <button id="reply-${reply.comment_id}" class="replydislike dislike-action ${userReaction === 'dislike' ? 'active' : ''}>
                👎<span role="img" class="dislike-count" >${reply.dislikes_count || 0}</span>
            </button>
            </div> <!-- 评论点赞/踩计数按钮区域 -->
        </div>
    `;

    return div;
}

/**
 * 添加评论
 * @param {string} post_id - 文章ID
 * @param {string} user_id - 用户ID
 * @param {string} content - 评论内容
 */
async function addComment(post_id, user_id, content) {
    try {
        // 插入评论
        const { data, error } = await supabase
            .from('comments')
            .insert({
                post_id: post_id,
                user_id: user_id,
                content: content,
                created_at: new Date().toISOString()
            })
            .select();

        if (error) throw error;

        // 清空评论输入框
        document.getElementById('comment-content').value = '';

        // 更新任务完成状态
        //await updateCommentTask(user_id);

        // 重新加载评论列表
        const userProfileStr = sessionStorage.getItem('userProfile');
        const userProfile = userProfileStr ? JSON.parse(userProfileStr) : null;
        const sortSelect = document.querySelector('.sort-select');
        const sortBy = sortSelect ? sortSelect.value : 'newest';

        await initComments(post_id, userProfile, sortBy);

        showMessage('评论发表成功', 'success');
    } catch (error) {
        console.error('添加评论失败:', error);
        showMessage('添加评论失败，请稍后重试', 'error');
    }
}

/**
 * 添加回复
 * @param {string} post_id - 文章ID
 * @param {string} parent_id - 父评论ID
 * @param {string} user_id - 用户ID
 * @param {string} content - 回复内容
 */
async function addReply(post_id, parent_id, user_id, content) {
    try {
        // 插入回复
        const { data, error } = await supabase
            .from('comments')
            .insert({
                post_id: post_id,
                parent_id: parent_id,
                user_id: user_id,
                content: content,
                created_at: new Date().toISOString()
            })
            .select();

        if (error) throw error;

        // 更新任务完成状态
        //updateCommentTask(user_id);

        // 重新加载评论列表
        const userProfileStr = sessionStorage.getItem('userProfile');
        const userProfile = userProfileStr ? JSON.parse(userProfileStr) : null;
        const sortSelect = document.querySelector('.sort-select');
        const sortBy = sortSelect ? sortSelect.value : 'newest';

        await initComments(post_id, userProfile, sortBy);

        showMessage('回复发表成功', 'success');
    } catch (error) {
        console.error('添加回复失败:', error);
        showMessage('添加回复失败，请稍后重试', 'error');
    }
}


/**
 * 显示回复表单
 * @param {string} comment_id - 评论ID
 */
function toggleReplyForm(comment_id) {
    console.log('显示回复表单开始');
    const replyForm = document.getElementById(`reply-form-${comment_id}`);
    if (replyForm) {
        // 隐藏所有其他回复表单
        document.querySelectorAll('.reply-form').forEach(form => {
            if (form.id !== `reply-form-${comment_id}`) {
                form.style.display = 'none';
            }
        });

        // 切换当前回复表单的显示状态
        replyForm.style.display = replyForm.style.display === 'none' ? 'block' : 'none';

        // 如果显示表单，则聚焦到文本框
        if (replyForm.style.display === 'block') {
            const textarea = replyForm.querySelector('textarea');
            if (textarea) textarea.focus();
        }
        console.log('显示回复表单完了');
    }
}

/**
 * 隐藏回复表单
 * @param {string} comment_id - 评论ID
 */
function hideReplyForm(comment_id) {
    const replyForm = document.getElementById(`reply-form-${comment_id}`);
    if (replyForm) {
        replyForm.style.display = 'none';
    }
}

/**
 * 更新评论任务完成状态
 * @param {string} user_id - 用户ID
 */
async function updateCommentTask(user_id) {
    try {
        // 获取评论任务
        const { data: task, error: taskError } = await supabase
            .from('tasks')
            .select('task_id, rewards_exp, rewards_coins')
            .eq('action_type', 'comment')
            .single();

        if (taskError) return;

        // 获取用户资料
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('experience, coins, level')
            .eq('user_id', user_id)
            .single();

        if (profileError) return;

        // 获取用户等级信息
        const { data: levelInfo, error: levelError } = await supabase
            .from('user_levels')
            .select('required_exp, level_up_reward_coins')
            .eq('level', profile.level)
            .single();

        if (levelError) return;

        // 更新用户经验和金币
        let newExperience = (profile.experience || 0) + (task.rewards_exp || 0);
        let newCoins = (profile.coins || 0) + (task.rewards_coins || 0);
        let newLevel = profile.level;

        // 检查是否升级
        if (newExperience >= levelInfo.required_exp) {
            newLevel += 1;
            newCoins += levelInfo.level_up_reward_coins || 0;
            showMessage(`恭喜升级！到达 ${newLevel} 级，获得 ${levelInfo.level_up_reward_coins} 币`, 'success');
        }

        // 更新用户资料
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                experience: newExperience,
                coins: newCoins,
                level: newLevel,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', user_id);

        if (updateError) return;

        // 更新任务完成记录
        const { error: taskLogError } = await supabase
            .from('task_logs')
            .insert({
                user_id: user_id,
                task_id: task.id,
                completed_at: new Date().toISOString()
            });

        if (!taskLogError) {
            showMessage(`完成评论任务，获得 ${task.rewards_exp} 经验和 ${task.rewards_coins} 币`, 'success');
        }
    } catch (error) {
        console.error('更新评论任务失败:', error);
    }
}

/**
 * 更新点赞任务完成状态
 * @param {string} user_id - 用户ID
 */
async function updateLikeTask(user_id) {
    if (!user_id) return;

    try {
        // 导入任务模块中的点赞任务处理函数
        const { handleLikeTask } = await import('./task.js');
        if (handleLikeTask) {
            // 调用任务模块中的点赞任务处理函数
            // await handleLikeTask(user_id);
        } else {
            console.warn('找不到点赞任务处理函数');

            // 如果导入失败，使用旧的实现方式
            // 获取点赞任务信息
            const { data: task, error: taskError } = await supabase
                .from('tasks')
                .select('task_id, rewards_exp, rewards_coins')
                .eq('action_type', 'like')
                .single();

            if (taskError) return;

            // 检查今天是否已完成该任务
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { data: taskLog, error: taskLogError } = await supabase
                .from('task_logs')
                .select('task_logs_id')
                .eq('user_id', user_id)
                .eq('task_id', task.task_id)
                .gte('completed_at', today.toISOString())
                .maybeSingle();

            if (taskLogError) return;

            // 如果今天已完成任务，则不再奖励
            if (taskLog) return;

            // 获取用户资料
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('experience, coins, level')
                .eq('user_id', user_id)
                .single();

            if (profileError) return;

            // 获取用户等级信息
            const { data: levelInfo, error: levelError } = await supabase
                .from('user_levels')
                .select('required_exp, level_up_reward_coins')
                .eq('level', profile.level)
                .single();

            if (levelError) return;

            // 更新用户经验和金币
            let newExperience = (profile.experience || 0) + (task.rewards_exp || 0);
            let newCoins = (profile.coins || 0) + (task.rewards_coins || 0);
            let newLevel = profile.level;

            // 检查是否升级
            if (newExperience >= levelInfo.required_exp) {
                newLevel += 1;
                newCoins += levelInfo.level_up_reward_coins || 0;
                showMessage(`恭喜升级！到达 ${newLevel} 级，获得 ${levelInfo.level_up_reward_coins} 币`, 'success');
            }

            // 更新用户资料
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    experience: newExperience,
                    coins: newCoins,
                    level: newLevel,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', user_id);

            if (updateError) return;

            // 更新任务完成记录
            const { error: insertError } = await supabase
                .from('task_logs')
                .insert({
                    user_id: user_id,
                    task_id: task.task_id,
                    completed_at: new Date().toISOString()
                });

            if (!insertError) {
                showMessage(`完成点赞任务，获得 ${task.rewards_exp} 经验和 ${task.rewards_coins} 币`, 'success');
            }
        }
    } catch (error) {
        console.error('更新点赞任务失败:', error);
    }
}

// 导出评论功能
export {
    initComments,
    addComment,
    updateCommentTask,
    updateLikeTask
};