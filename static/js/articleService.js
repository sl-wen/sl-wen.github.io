// 导入 Supabase 客户端
const { supabase } = require('./supabase-config.js');

// 实现重试机制的通用函数
async function retry(fn, retries = 3, delay = 1000) {
    try {
        return await fn();
    } catch (error) {
        if (retries === 0) throw error;
        console.log(`操作失败，${retries}次重试后重新尝试...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return retry(fn, retries - 1, delay);
    }
}

// 获取单篇文章的函数
async function getArticle(id) {
    try {
        console.log('开始获取文章:', id);
        
        // 使用重试逻辑获取文章
        const article = await retry(async () => {
            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .eq('id', id)
                .single();
                
            if (error) throw error;
            if (!data) throw new Error('文章不存在');
            
            // 增加文章访问量
            const { error: updateError } = await supabase
                .from('posts')
                .update({ views: (data.views || 0) + 1 })
                .eq('id', id);
                
            if (updateError) {
                console.warn('更新访问量失败:', updateError);
            }
            
            return {
                ...data,
                views: (data.views || 0) + 1
            };
        });
        
        return article;
    } catch (error) {
        console.error('获取文章失败:', error);
        throw error;
    }
}

// 获取所有文章的函数
async function getAllArticles() {
    try {
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('获取文章列表失败:', error);
        throw error;
    }
}

// 按标签获取文章的函数
async function getArticlesByTag(tag) {
    try {
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .contains('tags', [tag])
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('获取标签文章失败:', error);
        throw error;
    }
}

// 创建新文章的函数
async function createArticle(article) {
    try {
        const { data, error } = await supabase
            .from('posts')
            .insert([
                {
                    title: article.title,
                    content: article.content,
                    author: article.author,
                    tags: article.tags,
                    views: 0,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ])
            .select()
            .single();
            
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('创建文章失败:', error);
        throw error;
    }
}

// 更新文章的函数
async function updateArticle(id, updates) {
    try {
        const { data, error } = await supabase
            .from('posts')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();
            
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('更新文章失败:', error);
        throw error;
    }
}

// 删除文章的函数
async function deleteArticle(id) {
    try {
        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('删除文章失败:', error);
        throw error;
    }
}

// 导出所有函数
module.exports = {
    getArticle,
    getAllArticles,
    getArticlesByTag,
    createArticle,
    updateArticle,
    deleteArticle
};