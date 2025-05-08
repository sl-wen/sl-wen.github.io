// 导入 Firebase 相关模块
import { db } from './firebase.js';  // 导入数据库实例
import { doc, getDoc, updateDoc, increment, setDoc } from '@firebase/firestore';  // 导入 Firestore 操作函数

// 获取并更新网站总访问量的函数
async function updateTotalViews() {
    try {
        // 获取统计文档的引用
        const statsRef = doc(db, 'stats', 'views');
        // 获取当前统计数据
        const statsDoc = await getDoc(statsRef);
        
        if (!statsDoc.exists()) {
            // 如果统计文档不存在，创建新文档并初始化访问量为 1
            await setDoc(statsRef, {
                total: 1
            });
            return 1;  // 返回初始访问量
        } else {
            // 如果文档存在，增加访问量计数
            await updateDoc(statsRef, {
                total: increment(1)  // 使用 increment 函数增加计数
            });
            // 获取更新后的文档
            const updatedDoc = await getDoc(statsRef);
            return updatedDoc.data().total;  // 返回更新后的总访问量
        }
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