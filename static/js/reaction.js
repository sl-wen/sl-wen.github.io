// 导入supabase客户端
import { supabase } from './supabase-config.js';
import { showMessage } from './common.js';

document.addEventListener('DOMContentLoaded', () => {

    const urlParams = new URLSearchParams(window.location.search);
    const post_id = urlParams.get('post_id');
    const likeButton = document.getElementById('likeButton');
    const dislikeButton = document.getElementById('dislikeButton');
    // 获取当前用户
    const userSessionStr = sessionStorage.getItem('userSession');
    const userProfileStr = sessionStorage.getItem('userProfile');
    // 解析 JSON 字符串
    const userSession = userSessionStr ? JSON.parse(userSessionStr) : null;
    const userProfile = userProfileStr ? JSON.parse(userProfileStr) : null;
    if (likeButton && dislikeButton) {
        console.log('post_id:', post_id);
        let post_reaction = await fetchReactions(userProfile, post_id);
        console.log('post_reaction:', post_reaction);
        updateUI(post_reaction);
        // 添加事件监听器
        if (userSession) {
            likeButton.addEventListener('click', await handleReaction(post_reaction, 'like'));
            dislikeButton.addEventListener('click', await handleReaction(post_reaction, 'dislike'));
        }
    }
});

async function fetchReactions(userProfile, post_id) {

    try {
        // 获取文章的点赞/踩计数
        const { data: postData, error: postError } = await supabase
            .from('posts')
            .select('likes_count, dislikes_count')
            .eq('post_id', post_id)
            .single();

        if (postError) throw postError;
        console.log('likes_count:', postData.likes_count);
        console.log('dislikes_count:', postData.dislikes_count);
        console.log('获取文章的点赞/踩计数成功');
        let reaction = {};
        // 如果用户已登录，获取用户对该文章的反应
        if (userProfile) {
            const { data: reactionData, error: reactionError } = await supabase
                .from('post_reactions')
                .select('user_id, post_id, type')
                .eq('user_id', userProfile.user_id)
                .eq('post_id', post_id)
                .maybeSingle();

            if (reactionError) throw reactionError;
            if (reactionData) {
                reaction = {
                    likes_count: postData.likes_count || 0,
                    dislikes_count: postData.dislikes_count || 0,
                    user_id: reactionData.user_id,
                    post_id: post_id,
                    type: reactionData.type
                }
            } else {
                reaction = {
                    likes_count: postData.likes_count || 0,
                    dislikes_count: postData.dislikes_count || 0,
                    user_id: userProfile.user_id,
                    post_id: post_id,
                    type: null
                }
            }
        } else {
            reaction = {
                likes_count: postData.likes_count || 0,
                dislikes_count: postData.dislikes_count || 0,
                user_id: null,
                post_id: post_id,
                type: null
            }
        }
        console.log('fetching_reaction:', reaction);

    } catch (error) {
        console.log('Error fetching post_reactions:', error);
    }
    return reaction || {};
}

async function handleReaction(post_reaction, type) {

    const user_post_reaction = post_reaction;

    try {
        // 如果用户已经有相同的反应，则删除反应（取消点赞/踩）
        if (user_post_reaction.type === type) {
            // 删除反应
            const { error: deleteError } = await supabase
                .from('post_reactions')
                .delete()
                .eq('user_id', user_post_reaction.user_id)
                .eq('post_id', user_post_reaction.post_id);

            if (deleteError) throw deleteError;

            // 更新状态
            user_post_reaction.type = null;
            if (type === 'like') {
                user_post_reaction.likes_count = Math.max(0, user_post_reaction.likes_count - 1);
            } else {
                user_post_reaction.dislikes_count = Math.max(0, user_post_reaction.dislikes_count - 1);
            }
        }
        // 如果用户已经有不同的反应，则更新反应
        else if (user_post_reaction.type) {
            const { error } = await supabase
                .from('post_reactions')
                .update({ type })
                .eq('user_id', user_post_reaction.user_id)
                .eq('post_id', user_post_reaction.post_id);

            if (error) throw error;

            if (type === 'like') {
                user_post_reaction.likes_count += 1;
                user_post_reaction.dislikes_count = Math.max(0, user_post_reaction.dislikes_count - 1);
            } else {
                user_post_reaction.dislikes_count += 1;
                user_post_reaction.likes_count = Math.max(0, user_post_reaction.likes_count - 1);
            }
            user_post_reaction.type = type;
        }
        // 如果用户没有反应，则创建新反应
        else {
            // 创建新的反应
            const { error } = await supabase
                .from('post_reactions')
                .insert({
                    user_id: user_post_reaction.user_id,
                    post_id: user_post_reaction.post_id,
                    type
                });

            if (error) throw error;

            // 更新状态
            user_post_reaction.type = type;
            if (type === 'like') {
                user_post_reaction.likes_count += 1;
            } else {
                user_post_reaction.dislikes_count += 1;
            }
        }

        // 更新文章的点赞/踩计数
        const { error: updatePostError } = await supabase
            .from('posts')
            .update({
                likes_count: user_post_reaction.likes_count,
                dislikes_count: user_post_reaction.dislikes_count
            })
            .eq('post_id', user_post_reaction.post_id);

        if (updatePostError) throw updatePostError;

        // 更新UI
        updateUI(user_post_reaction);
        console.log('user_post_reaction:', user_post_reaction);
        
        // 如果是点赞，更新任务完成状态
        // if (type === 'like') {
        //     // 导入评论模块中的更新点赞任务函数
        //     import('./comments.js').then(module => {
        //         if (module.updateLikeTask) {
        //             module.updateLikeTask(reaction.user_id, reaction.post_id);
        //         }
        //     }).catch(err => console.error('无法导入评论模块:', err));
        // }
    } catch (error) {
        console.log('Error handling reaction:', error);
        showMessage('处理反应失败，请稍后重试', 'error');
    }
}

function updateUI(reaction) {
    // 更新计数显示
    const likeButton = document.getElementById('likeButton');
    const dislikeButton = document.getElementById('dislikeButton');
    likeButton.textContent = reaction.likes_count;
    dislikeButton.textContent = reaction.dislikes_count;
    console.log('updateUI');
    console.log('reaction:', reaction);
    console.log('likes_count:', reaction.likes_count);
    console.log('dislikes_count:', reaction.dislikes_count);

    // 更新按钮状态
    likeButton.classList.toggle('active', reaction.type === 'like');
    dislikeButton.classList.toggle('active', reaction.type === 'dislike');
    showMessage('更新计数成功', 'info');
}

