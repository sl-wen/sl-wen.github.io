// 导入所需的模块
import { db as firebaseDb } from './firebase-config.js';
import { supabase } from './supabase-config.js';
import { collection, getDocs } from 'firebase/firestore';

// 迁移文章数据
async function migratePosts() {
    try {
        const postStartTime = new Date();
        console.log('开始迁移文章数据...');
        console.log('正在从Firebase获取文章数据...');
        
        // 从 Firebase 获取所有文章
        const querySnapshot = await getDocs(collection(firebaseDb, 'posts'));
        const posts = [];
        const errors = [];
        
        querySnapshot.forEach((doc) => {
            try {
                const data = doc.data();
                // 添加字段长度验证
                const MAX_TITLE_LENGTH = 255;
                const MAX_CONTENT_LENGTH = 10000;

                // 验证必需字段
                if (!data.title) {
                    throw new Error('标题不能为空');
                }
                if (!data.content) {
                    throw new Error('内容不能为空');
                }
                if (!data.createdAt || !data.updatedAt) {
                    throw new Error('创建时间和更新时间不能为空');
                }

                const post = {
                    id: crypto.randomUUID(),
                    title: data.title?.slice(0, MAX_TITLE_LENGTH),
                    content: data.content?.slice(0, MAX_CONTENT_LENGTH),
                    author: data.author || 'anonymous',
                    tags: Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []),
                    views: data.views || 0,
                    created_at: new Date(data.createdAt.toDate()).toISOString(),
                    updated_at: new Date(data.updatedAt.toDate()).toISOString()
                };

                // 记录字段截断警告
                if (data.title?.length > MAX_TITLE_LENGTH) {
                    console.warn(`文章ID ${doc.id} 标题长度超过限制，已截断至${MAX_TITLE_LENGTH}字符`);
                }
                if (data.content?.length > MAX_CONTENT_LENGTH) {
                    console.warn(`文章ID ${doc.id} 内容长度超过限制，已截断至${MAX_CONTENT_LENGTH}字符`);
                }

                posts.push(post);
            } catch (err) {
                errors.push(`文章ID ${doc.id} 处理失败: ${err.message}`);
            }
        });
        
        // 如果有处理错误，输出错误信息
        if (errors.length > 0) {
            console.error('部分文章处理失败：\n', errors.join('\n'));
        }

        if (posts.length === 0) {
            throw new Error('没有有效的文章数据可以迁移');
        }
        
        console.log(`获取到 ${posts.length} 篇文章`);
        console.log('正在将文章数据插入Supabase...');
        
        // 将文章数据插入到 Supabase
        const { data, error } = await supabase
            .from('posts')
            .insert(posts);
            
        if (error) {
            console.error('Supabase插入错误:', {
                message: error.message,
                details: error.details,
                code: error.code,
                hint: error.hint,
                validation: error.details?.details?.validation,
                timestamp: new Date().toISOString()
            });
            throw new Error(`Supabase插入失败: ${error.message}`);
        }
        
        console.log('文章数据迁移完成');
        console.log('获取文章数据耗时：', new Date() - postStartTime, 'ms');
        console.log('文章数据迁移总耗时：', new Date() - postStartTime, 'ms');
        return data;
        
    } catch (error) {
        console.error('迁移文章数据失败:', error.message);
        throw error;
    }
}

// 迁移访问统计数据
async function migrateStats() {
    try {
        const statsStartTime = new Date();
        console.log('开始迁移访问统计数据...');
        console.log('正在从Firebase获取访问统计数据...');
        
        // 从 Firebase 获取访问统计
        const statsDoc = await getDocs(collection(firebaseDb, 'stats'));
        const stats = [];
        const errors = [];
        
        statsDoc.forEach((doc) => {
            try {
                const data = doc.data();
                if (!data) {
                    throw new Error('统计数据为空');
                }

                stats.push({
                    id: crypto.randomUUID(),
                    total_views: data.total || 0
                });
            } catch (err) {
                errors.push(`统计ID ${doc.id} 处理失败: ${err.message}`);
            }
        });

        // 如果有处理错误，输出错误信息
        if (errors.length > 0) {
            console.error('部分统计数据处理失败：\n', errors.join('\n'));
        }

        if (stats.length === 0) {
            throw new Error('没有有效的统计数据可以迁移');
        }
        
        // 将统计数据插入到 Supabase
        const { data, error } = await supabase
            .from('stats')
            .insert(stats);
            
        if (error) {
            console.error('Supabase插入错误:', {
                message: error.message,
                details: error.details,
                code: error.code,
                hint: error.hint,
                validation: error.details?.details?.validation,
                timestamp: new Date().toISOString()
            });
            throw new Error(`Supabase插入失败: ${error.message}`);
        }
        
        console.log('访问统计数据迁移完成');
        console.log('获取统计数据耗时：', new Date() - statsStartTime, 'ms');
        console.log('访问统计数据迁移总耗时：', new Date() - statsStartTime, 'ms');
        return data;
        
    } catch (error) {
        console.error('迁移访问统计数据失败:', error.message);
        throw error;
    }
}

// 执行所有迁移任务
async function migrateAll() {
    try {
        const startTime = new Date();
        console.log('开始数据迁移...');
        await migratePosts();
        await migrateStats();
        console.log('所有数据迁移完成');
        console.log('总迁移耗时：', new Date() - startTime, 'ms');
    } catch (error) {
        console.error('数据迁移失败:', error);
        throw error;
    }
}

await migrateAll();

// 导出迁移函数
export { migratePosts, migrateStats, migrateAll };