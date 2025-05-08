// 导入 Firebase Firestore 相关函数
import { collection, doc, getDoc, getDocs, query, where, increment, updateDoc } from 'firebase/firestore';
import { db } from './firebase-config.js';  // 导入 Firebase 数据库配置

// 实现重试机制的通用函数
// fn: 要重试的异步函数
// retries: 重试次数，默认3次
// delay: 重试间隔时间，默认1000毫秒
async function retry(fn, retries = 3, delay = 1000) {
  try {
    return await fn();  // 尝试执行函数
  } catch (error) {
    if (retries === 0) throw error;  // 如果没有剩余重试次数，抛出错误
    console.log(`操作失败，${retries}次重试后重新尝试...`);
    await new Promise(resolve => setTimeout(resolve, delay));  // 等待指定时间
    return retry(fn, retries - 1, delay);  // 递归重试
  }
}

// 获取单篇文章的函数
export async function getArticle(id) {
  try {
    console.log('开始获取文章:', id);
    
    // 检查 Firebase 是否已初始化
    if (!db) {
      throw new Error('Firebase未正确初始化');
    }
    
    // 使用重试逻辑获取文章
    const article = await retry(async () => {
      const docRef = doc(db, 'posts', id);  // 创建文档引用
      console.log('创建文档引用');
      
      const docSnap = await getDoc(docRef);  // 获取文档快照
      console.log('获取文档快照, 文档是否存在:', docSnap.exists());
      
      if (docSnap.exists()) {
        const data = docSnap.data();  // 获取文档数据
        console.log('获取文章数据成功');
        
        try {
          // 增加文章访问量
          await updateDoc(docRef, {
            views: increment(1)
          });
          console.log('更新访问量成功');
        } catch (e) {
          console.warn('更新访问量失败:', e);
          // 继续执行，不影响文章显示
        }
        
        // 返回文章数据，包括ID和更新后的访问量
        return {
          id: docSnap.id,
          ...data,
          views: (data.views || 0) + 1
        };
      } else {
        throw new Error('文章不存在');
      }
    });
    
    return article;
  } catch (error) {
    console.error('获取文章失败:', error);
    throw error;  // 向上传递错误
  }
}

// 获取所有文章的函数
export async function getAllArticles() {
  try {
    // 检查 Firebase 是否已初始化
    if (!db) {
      throw new Error('Firebase未初始化');
    }
    
    // 获取文章集合引用
    const articlesRef = collection(db, 'posts');
    // 获取所有文章的快照
    const querySnapshot = await getDocs(articlesRef);
    const articles = [];
    
    // 遍历快照，提取文章数据
    querySnapshot.forEach((doc) => {
      articles.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return articles;
  } catch (error) {
    console.error('获取文章列表失败:', error);
    throw error;  // 向上传递错误
  }
}

// 按标签获取文章的函数
export async function getArticlesByTag(tag) {
  try {
    // 检查 Firebase 是否已初始化
    if (!db) {
      throw new Error('Firebase未初始化');
    }
    
    // 创建带有标签过滤的查询
    const articlesRef = collection(db, 'posts');
    const q = query(articlesRef, where('tags', 'array-contains', tag));
    // 执行查询获取文章
    const querySnapshot = await getDocs(q);
    const articles = [];
    
    // 遍历快照，提取文章数据
    querySnapshot.forEach((doc) => {
      articles.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return articles;
  } catch (error) {
    console.error('获取标签文章失败:', error);
    throw error;  // 向上传递错误
  }
} 