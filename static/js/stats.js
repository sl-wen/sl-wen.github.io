// 导入 Supabase 相关模块
import { supabase } from './supabase-config.js';

// 获取并更新网站总访问量的函数
async function updateTotalViews() {
    try {
        // 获取当前统计数据
        const { data: statsData, error: getError } = await supabase
            .from('stats')
            .select('total_views')
            .eq('status_id', 'views')
            .maybeSingle();
        
        if (!statsData) {
            // 如果统计记录不存在，创建新记录
            const { data: newStats, error: insertError } = await supabase
                .from('stats')
                .insert([{ status_id: 'views', total_views: 1 }], {
                    returning: 'representation'
                })
                .select()
                .single();
                
            if (insertError) throw insertError;
            return newStats.total_views;
        }
        
        // 更新访问量
        const { data: updatedStats, error: updateError } = await supabase
            .from('stats')
            .update({ total_views: (statsData.total_views || 0) + 1 }, {
                returning: 'representation'
            })
            .eq('status_id', 'views')
            .select()
            .single();
            
        if (updateError) throw updateError;
        return updatedStats.total_views;
        
    } catch (error) {
        console.error('更新总访问量失败:', error);
        return null;  // 发生错误时返回 null
    }
}

// 更新页脚显示的访问量统计
async function updateFooterStats() {
    try {
        // 获取更新后的总访问量
        const totalViews = await updateTotalViews();
        // 获取页脚统计元素
        const statsElement = document.querySelector('.footer-stats');
        // 如果元素存在且成功获取到访问量，更新显示
        if (statsElement && totalViews !== null) {
            statsElement.textContent = `总访问量：${totalViews}`;
        }
    } catch (error) {
        console.error('更新页脚统计失败:', error);
    }
}

// 当页面加载完成时执行统计更新
document.addEventListener('DOMContentLoaded', updateFooterStats);