import { collection, doc, getDoc, getDocs, query, where, increment, updateDoc } from 'firebase/firestore';
import { db } from './firebase-config.js';

// 重试函数
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

// 获取单篇文章
export async function getArticle(id) {
  try {
    console.log('开始获取文章:', id);
    
    if (!db) {
      throw new Error('Firebase未正确初始化');
    }
    
    // 使用重试逻辑获取文章
    const article = await retry(async () => {
      const docRef = doc(db, 'posts', id);
      console.log('创建文档引用');
      
      const docSnap = await getDoc(docRef);
      console.log('获取文档快照, 文档是否存在:', docSnap.exists());
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('获取文章数据成功');
        
        try {
          // 增加访问量
          await updateDoc(docRef, {
            views: increment(1)
          });
          console.log('更新访问量成功');
        } catch (e) {
          console.warn('更新访问量失败:', e);
          // 继续执行，不影响文章显示
        }
        
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
    throw error;
  }
}

// 获取所有文章
export async function getAllArticles() {
  try {
    if (!db) {
      throw new Error('Firebase未初始化');
    }
    
    const articlesRef = collection(db, 'posts');
    const querySnapshot = await getDocs(articlesRef);
    const articles = [];
    
    querySnapshot.forEach((doc) => {
      articles.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return articles;
  } catch (error) {
    console.error('获取文章列表失败:', error);
    throw error;
  }
}

// 按标签获取文章
export async function getArticlesByTag(tag) {
  try {
    if (!db) {
      throw new Error('Firebase未初始化');
    }
    
    const articlesRef = collection(db, 'posts');
    const q = query(articlesRef, where('tags', 'array-contains', tag));
    const querySnapshot = await getDocs(q);
    const articles = [];
    
    querySnapshot.forEach((doc) => {
      articles.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return articles;
  } catch (error) {
    console.error('获取标签文章失败:', error);
    throw error;
  }
} 