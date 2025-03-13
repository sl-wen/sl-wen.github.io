import { db } from './firebase.js';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

// 获取单篇文章
export async function getArticle(id) {
  try {
    console.log('开始获取文章:', id);
    const docRef = doc(db, 'articles', id);
    console.log('文档引用创建成功');
    
    const docSnap = await getDoc(docRef);
    console.log('文档快照获取成功:', docSnap.exists());
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('文章数据:', data);
      return {
        id: docSnap.id,
        ...data
      };
    } else {
      console.warn('文章不存在:', id);
      throw new Error('文章不存在');
    }
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
    const articlesRef = collection(db, 'articles');
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
    const articlesRef = collection(db, 'articles');
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