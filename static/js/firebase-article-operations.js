// Firebase文章操作函数
import { doc, getDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase.js';

// 获取文章详情
async function getArticle(articleId) {
    try {
        const docRef = doc(db, "posts", articleId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return {
                id: docSnap.id,
                ...docSnap.data()
            };
        } else {
            throw new Error("文章不存在");
        }
    } catch (error) {
        console.error("获取文章失败:", error);
        throw error;
    }
}

// 更新文章
async function updateArticle(articleId, articleData) {
    try {
        const docRef = doc(db, "posts", articleId);
        await updateDoc(docRef, {
            ...articleData,
            updatedAt: Timestamp.fromDate(new Date())
        });
        return true;
    } catch (error) {
        console.error("更新文章失败:", error);
        throw error;
    }
}

// 删除文章
async function deleteArticle(articleId) {
    try {
        const docRef = doc(db, "posts", articleId);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error("删除文章失败:", error);
        throw error;
    }
}

export { getArticle, updateArticle, deleteArticle }; 