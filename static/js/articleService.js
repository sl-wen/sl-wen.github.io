import { collection, doc, getDoc, getDocs, query, where, increment, updateDoc } from '@firebase/firestore';

// 重试函数
async function retry(fn, retries = 3, delay = 1000) {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay);
  }
}

// 获取单篇文章
export async function getArticle(id) {
  try {
    console.log('开始获取文章:', id);
    
    // 使用重试逻辑获取文章
    const article = await retry(async () => {
      const docRef = doc(db, 'posts', id);
      console.log('文档引用创建成功');
      
      const docSnap = await getDoc(docRef);
      console.log('文档快照获取成功:', docSnap.exists());
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('文章数据:', data);

        // 增加访问量
        await updateDoc(docRef, {
          views: increment(1)
        });

        return {
          id: docSnap.id,
          ...data,
          views: (data.views || 0) + 1 // 立即更新显示的访问量
        };
      } else {
        console.warn('文章不存在:', id);
        throw new Error('文章不存在');
      }
    });

    return article;
  } catch (error) {
    console.error('获取文章失败:', error);
    if (error.code === 'unavailable') {
      console.error('Firestore 服务不可用，可能是网络问题或 CSP 限制');
    }
    throw error;
  }
}

// 获取所有文章
export async function getAllArticles() {
  try {
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