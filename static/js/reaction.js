// 导入supabase客户端
import { supabase } from './supabase-config.js';
import { showMessage } from './common.js';

document.addEventListener('DOMContentLoaded', () => {

    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    const likeButton = document.getElementById('likeButton');
    const dislikeButton = document.getElementById('dislikeButton');
    // 获取当前用户
    const userSessionStr = sessionStorage.getItem('userSession');
    const userProfileStr = sessionStorage.getItem('userProfile');
    // 解析 JSON 字符串
    const userSession = userSessionStr ? JSON.parse(userSessionStr) : null;
    const userProfile = userProfileStr ? JSON.parse(userProfileStr) : null;
    if (likeButton && dislikeButton) {
        const reaction = fetchReactions(userProfile, postId);
        updateUI(reaction);

        // 添加事件监听器
        if (userSession) {
            likeButton.addEventListener('click', handleReaction(reaction, 'like'));
            dislikeButton.addEventListener('click', handleReaction(reaction, 'dislike'));
        }
    }
});

async function fetchReactions(userProfile, postId) {

    try {
        // 获取文章的点赞/踩计数
        const { data: postData, error: postError } = await supabase
            .from('posts')
            .select('likes_count, dislikes_count')
            .eq('id', postId)
            .single();

        if (postError) throw postError;
        showMessage('获取文章的点赞/踩计数成功', 'info');
        const reaction = {};
        // 如果用户已登录，获取用户对该文章的反应
        if (userProfile) {
            const { data: reactionData, error: reactionError } = await supabase
                .from('reactions')
                .select('user_id, post_id, type')
                .eq('user_id', userProfile.id)
                .eq('post_id', postId)
                .maybeSingle();

            if (reactionError) throw reactionError;
            if (reactionData) {
                return reaction = {
                    likes_count: postData.likes_count,
                    dislikes_count: postData.dislikes_count,
                    user_id: userProfile.id,
                    post_id: postId,
                    type: reactionData.type
                }
            } else {
                return reaction = {
                    likes_count: postData.likes_count,
                    dislikes_count: postData.dislikes_count,
                    user_id: userProfile.id,
                    post_id: postId,
                    type: null
                }
            }
        } else {
            return reaction = {
                likes_count: postData.likes_count,
                dislikes_count: postData.dislikes_count,
                user_id: null,
                post_id: postId,
                type: null
            }
        }

    } catch (error) {
        console.error('Error fetching reactions:', error);
    }
}

async function handleReaction(reaction, type) {

    try {
        // 如果用户已经有相同的反应，则删除反应（取消点赞/踩）
        if (reaction.type === type) {

            // 更新状态
            reaction.type = null;
            if (type === 'like') {
                reaction.likes_count = Math.max(0, reaction.likes_count - 1);
            } else {
                reaction.dislikes_count = Math.max(0, reaction.dislikes_count - 1);
            }
        }
        // 如果用户已经有不同的反应，则更新反应
        else if (reaction.type) {
            // 更新用户的反应
            const { error } = await supabase
                .from('reactions')
                .update({ type })
                .eq('user_id', reaction.user_id)
                .eq('post_id', reaction.post_id);

            if (error) throw error;

            if (type === 'like') {
                reaction.likes_count += 1;
                reaction.dislikes_count = Math.max(0, reaction.dislikes_count - 1);
            } else {
                reaction.dislikes_count += 1;
                reaction.likes_count = Math.max(0, reaction.likes_count - 1);
            }
            reaction.type = type;
        }
        // 如果用户没有反应，则创建新反应
        else {
            // 创建新的反应
            const { error } = await supabase
                .from('reactions')
                .insert({
                    user_id: reaction.user_id,
                    post_id: reaction.post_id,
                    type
                });

            if (error) throw error;

            // 更新状态
            reaction.type = type;
            if (type === 'like') {
                reaction.likes_count += 1;
            } else {
                reaction.dislikes_count += 1;
            }
        }

        // 更新UI
        this.updateUI(reaction);
    } catch (error) {
        console.error('Error handling reaction:', error);
    }
}

function updateUI(reaction) {
    // 更新计数显示
    const likeButton = document.getElementById('likeButton');
    const dislikeButton = document.getElementById('dislikeButton');
    likeButton.textContent = reaction.likes_count;
    dislikeButton.textContent = reaction.dislikes_count;

    // 更新按钮状态
    likeButton.classList.toggle('active', reaction.type === 'like');
    dislikeButton.classList.toggle('active', reaction.type === 'dislike');
    showMessage('更新计数成功', 'info');
}

