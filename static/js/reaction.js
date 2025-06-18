// 导入supabase客户端
import { supabase } from './supabase-config.js';
import { showMessage } from './common.js';

document.addEventListener('DOMContentLoaded', async () => {

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
    // 状态锁变量声明
    if (likeButton && dislikeButton) {
        try {
            let reactiontype = null;
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
            // 如果用户已登录，获取用户对该文章的反应

            if (userProfile) {
                const { data: reactionData } = await supabase
                    .from('post_reactions')
                    .select('user_id, post_id, type')
                    .eq('user_id', userProfile.user_id)
                    .eq('post_id', post_id)
                    .maybeSingle();
                reactiontype = reactionData ? reactionData.type : null;
            }
            // 更新文章的点赞/踩计数
            updatepostUI(reactiontype, postData.likes_count, postData.dislikes_count);

            likeButton.addEventListener('click', async function () {
                if (!userProfile) {
                    showMessage('请先登录后再点赞', 'error');
                    return;
                }
                await handlepostReaction(post_id, 'like', postData.likes_count, postData.dislikes_count, userProfile.user_id, reactiontype);
            });
            dislikeButton.addEventListener('click', async function () {
                if (!userProfile) {
                    showMessage('请先登录后再点赞', 'error');
                    return;
                }
                await handlepostReaction(post_id, 'dislike', postData.likes_count, postData.dislikes_count, userProfile.user_id, reactiontype);
            });
        } catch (error) {
            console.log('Error fetching reactions:', error);
        }
    }
    document.addEventListener('click', async (e) => {
        // 评论点赞按钮点击事件
        if (e.target.closest('.like-action')) {
            if (!userProfile) {
                showMessage('请先登录后再点赞', 'error');
                return;
            }

            const commentElement = e.target.closest('.comment, .reply');
            const comment_id = commentElement.id.replace('comment-', '').replace('reply-', '');
            console.log('comment_id:', comment_id);
            await handleCommentReaction(comment_id, 'like', userProfile.user_id);
        }

        // 评论踩按钮点击事件
        if (e.target.closest('.dislike-action')) {
            if (!userProfile) {
                showMessage('请先登录后再踩', 'error');
                return;
            }

            const commentElement = e.target.closest('.comment, .reply');
            const comment_id = commentElement.id.replace('comment-', '').replace('reply-', '');
            console.log('comment_id:', comment_id);
            await handleCommentReaction(comment_id, 'dislike', userProfile.user_id);
        }
    });
});


/*
* 处理文章点赞/踩
* @param {string} post_id - 文章ID
* @param {string} type - 点击反应类型：like, dislike
* @param {string} user_id - 用户ID
* @param {string} reactiontype - 当前反应类型
*/
async function handlepostReaction(post_id, newtype, likes_count, dislikes_count, user_id, reactiontype) {

    try {
        // 如果用户已经有相同的反应，则删除反应（取消点赞/踩）
        if (newtype === reactiontype) {
            // 删除反应
            const { error: deleteError } = await supabase
                .from('post_reactions')
                .delete()
                .eq('user_id', user_id)
                .eq('post_id', post_id);

            if (deleteError) throw deleteError;

            if (reactiontype === 'like') {
                likes_count = Math.max(0, likes_count - 1);
            } else {
                dislikes_count = Math.max(0, dislikes_count - 1);
            }
            // 更新状态
            reactiontype = null;
        }
        // 如果用户已经有不同的反应，则更新反应
        else if (reactiontype) {
            const { error } = await supabase
                .from('post_reactions')
                .update({ newtype })
                .eq('user_id', user_id)
                .eq('post_id', post_id);

            if (error) throw error;

            if (newtype === 'like') {
                likes_count += 1;
                dislikes_count = Math.max(0, dislikes_count - 1);
            } else {
                dislikes_count += 1;
                likes_count = Math.max(0, likes_count - 1);
            }
            reactiontype = newtype;
        }
        // 如果用户没有反应，则创建新反应
        else {
            // 创建新的反应
            const { error } = await supabase
                .from('post_reactions')
                .insert({
                    user_id: user_id,
                    post_id: post_id,
                    type: newtype
                });

            if (error) throw error;

            if (newtype === 'like') {
                likes_count += 1;
            } else {
                dislikes_count += 1;
            }
            // 更新状态
            reactiontype = newtype;
        }

        // 更新文章的点赞/踩计数
        const { error: updatePostError } = await supabase
            .from('posts')
            .update({
                likes_count: likes_count,
                dislikes_count: dislikes_count
            })
            .eq('post_id', post_id);

        if (updatePostError) throw updatePostError;

        // 更新UI
        updatepostUI(reactiontype, likes_count, dislikes_count);

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

/**
 * 更新post反应UI
 * @param {string} Type - 反应类型
 * @param {number} likesCount - 点赞数
 * @param {number} dislikesCount - 踩数
 */
function updatepostUI(newtype, likesCount, dislikesCount) {
    // 更新计数显示
    console.log('更新计数开始:', newtype);
    const likeButton = document.getElementById('likeButton');
    const dislikeButton = document.getElementById('dislikeButton');

    likeButton.querySelector('.likes-count').textContent = likesCount;
    dislikeButton.querySelector('.dislikes-count').textContent = dislikesCount;
    // 更新按钮状态
    if (newtype === 'like') {
        likeButton.classList.add('active');
        dislikeButton.classList.remove('active');
    } else if (newtype === 'dislike') {
        likeButton.classList.remove('active');
        dislikeButton.classList.add('active');
    } else {
        likeButton.classList.remove('active');
        dislikeButton.classList.remove('active');
    }
    console.log('更新计数成功:', newtype);
}

/**
 * 处理评论点赞/踩
 * @param {string} comment_id - 评论ID
 * @param {string} type - 反应类型：like, dislike
 * @param {string} user_id - 用户ID
 */
// 添加状态锁变量
let commentReactionLocks = {};

async function handleCommentReaction(comment_id, type, user_id) {
    // 检查是否正在处理
    const lockKey = `${comment_id}_${user_id}`;
    console.log('commentReactionLocks:', commentReactionLocks);
    if (commentReactionLocks[lockKey]) {
        showMessage('请等待上一个操作完成', 'info');
        return;
    }

    // 设置状态锁
    commentReactionLocks[lockKey] = true;

    try {
        // 获取当前评论
        const { data: comment, error: commentError } = await supabase
            .from('comments')
            .select('likes_count, dislikes_count')
            .eq('comment_id', comment_id)
            .single();

        if (commentError) throw commentError;

        // 获取用户对该评论的反应
        const { data: reaction, error: reactionError } = await supabase
            .from('comment_reactions')
            .select('type')
            .eq('user_id', user_id)
            .eq('comment_id', comment_id)
            .maybeSingle();

        if (reactionError) throw reactionError;

        let likesCount = comment.likes_count || 0;
        let dislikesCount = comment.dislikes_count || 0;

        // 如果用户已经有相同的反应，则删除反应（取消点赞/踩）
        if (reaction && reaction.type === type) {
            // 删除反应
            const { error: deleteError } = await supabase
                .from('comment_reactions')
                .delete()
                .eq('user_id', user_id)
                .eq('comment_id', comment_id);

            if (deleteError) throw deleteError;

            // 更新计数
            if (type === 'like') {
                likesCount = Math.max(0, likesCount - 1);
            } else {
                dislikesCount = Math.max(0, dislikesCount - 1);
            }
        }
        // 如果用户已经有不同的反应，则更新反应
        else if (reaction) {
            // 更新反应
            const { error: updateError } = await supabase
                .from('comment_reactions')
                .update({ type })
                .eq('user_id', user_id)
                .eq('comment_id', comment_id);

            if (updateError) throw updateError;

            // 更新计数
            if (type === 'like') {
                likesCount += 1;
                dislikesCount = Math.max(0, dislikesCount - 1);
            } else {
                dislikesCount += 1;
                likesCount = Math.max(0, likesCount - 1);
            }
        }
        // 如果用户没有反应，则创建新反应
        else {
            // 创建新的反应
            const { error: insertError } = await supabase
                .from('comment_reactions')
                .insert({
                    user_id: user_id,
                    comment_id: comment_id,
                    type
                });

            if (insertError) throw insertError;

            // 更新计数
            if (type === 'like') {
                likesCount += 1;
            } else {
                dislikesCount += 1;
            }
        }

        // 更新评论的点赞/踩计数
        const { error: updateCountError } = await supabase
            .from('comments')
            .update({
                likes_count: likesCount,
                dislikes_count: dislikesCount
            })
            .eq('comment_id', comment_id);

        if (updateCountError) throw updateCountError;

        // 更新UI
        updateCommentReactionUI(comment_id, type, likesCount, dislikesCount);
    

        // 更新任务完成状态
        if (type === 'like') {
            //updateLikeTask(user_id);
        }
    } catch (error) {
        console.error('处理评论反应失败:', error);
        showMessage('处理评论反应失败，请稍后重试', 'error');
    } finally {
        // 释放状态锁
        commentReactionLocks[lockKey] = false;
    }
}

/**
 * 更新评论反应UI
 * @param {string} comment_id - 评论ID
 * @param {string} Type - 反应类型
 * @param {number} likesCount - 点赞数
 * @param {number} dislikesCount - 踩数
 */
function updateCommentReactionUI(comment_id, Type, likesCount, dislikesCount) {
    // 获取评论元素
    const commentElement = document.getElementById(`comment-${comment_id}`) || document.getElementById(`reply-${comment_id}`);
    if (!commentElement) return;
    console.log('comment_id:', comment_id);
    console.log('Type:', Type);
    console.log('likesCount:', likesCount);
    console.log('dislikesCount:', dislikesCount);

    // 更新点赞/踩计数
    const likeCountElement = commentElement.querySelector('.like-count');
    const dislikeCountElement = commentElement.querySelector('.dislike-count');

    if (likeCountElement) likeCountElement.textContent = likesCount;
    if (dislikeCountElement) dislikeCountElement.textContent = dislikesCount;

    // 更新按钮状态
    const likeButton = commentElement.querySelector('.like-action');
    const dislikeButton = commentElement.querySelector('.dislike-action');

    // 更新按钮状态
    if (Type === 'like') {
        likeButton.classList.add('active');
        dislikeButton.classList.remove('active');
    } else if (Type === 'dislike') {
        likeButton.classList.remove('active');
        dislikeButton.classList.add('active');
    } else {
        likeButton.classList.remove('active');
        dislikeButton.classList.remove('active');
    }
}
