import { db } from './firebase-config';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy 
} from 'firebase/firestore';

// 获取所有文章
export async function getAllPosts() {
  try {
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('获取文章失败:', error);
    throw error;
  }
}

// 添加新文章
export async function addPost(postData) {
  try {
    const postsRef = collection(db, 'posts');
    const newPost = {
      ...postData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const docRef = await addDoc(postsRef, newPost);
    return docRef.id;
  } catch (error) {
    console.error('添加文章失败:', error);
    throw error;
  }
}

// 更新文章
export async function updatePost(postId, postData) {
  try {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      ...postData,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('更新文章失败:', error);
    throw error;
  }
}

// 删除文章
export async function deletePost(postId) {
  try {
    const postRef = doc(db, 'posts', postId);
    await deleteDoc(postRef);
  } catch (error) {
    console.error('删除文章失败:', error);
    throw error;
  }
} 