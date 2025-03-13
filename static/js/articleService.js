import { db } from './firebase.js';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

// 获取单篇文章
export async function getArticle(id) {
  try {
    const docRef = doc(db, 'articles', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      throw new Error('文章不存在');
    }
  } catch (error) {
    console.error('获取文章失败:', error);
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