import { db } from './firebase.js';
import { doc, getDoc, updateDoc, increment, setDoc } from '@firebase/firestore';

// 获取并更新总访问量
async function updateTotalViews() {
    try {
        const statsRef = doc(db, 'stats', 'views');
        const statsDoc = await getDoc(statsRef);
        
        if (!statsDoc.exists()) {
            // 如果统计文档不存在，创建它
            await setDoc(statsRef, {
                total: 1
            });
            return 1;
        } else {
            // 增加访问量
            await updateDoc(statsRef, {
                total: increment(1)
            });
            const updatedDoc = await getDoc(statsRef);
            return updatedDoc.data().total;
        }
    } catch (error) {
        console.error('更新总访问量失败:', error);
        return null;
    }
}

// 更新页脚的访问量显示
async function updateFooterStats() {
    try {
        const totalViews = await updateTotalViews();
        const statsElement = document.querySelector('.footer-stats');
        if (statsElement && totalViews !== null) {
            statsElement.textContent = `总访问量：${totalViews}`;
        }
    } catch (error) {
        console.error('更新页脚统计失败:', error);
    }
}

// 当页面加载完成时更新统计
document.addEventListener('DOMContentLoaded', updateFooterStats); 