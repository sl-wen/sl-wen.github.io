// Firebase文章操作函数
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';

// Firebase 配置
const firebaseConfig = {
    apiKey: "AIzaSyCuXDfNvLwiISoMwzcUIwUbaPTl69uRnao",
    authDomain: "slwen-45838.firebaseapp.com",
    projectId: "slwen-45838",
    storageBucket: "slwen-45838.appspot.com",
    messagingSenderId: "734137620659",
    appId: "1:734137620659:web:81ce8b971dce766d67b8c6",
    measurementId: "G-WEBZLW3S59"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 获取文章详情
export async function getArticle(articleId) {
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
export async function updateArticle(articleId, articleData) {
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
export async function deleteArticle(articleId) {
    try {
        const docRef = doc(db, "posts", articleId);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error("删除文章失败:", error);
        throw error;
    }
}

// 导出为全局变量，使其在非模块脚本中可用
window.firebaseArticleOperations = {
    getArticle,
    updateArticle,
    deleteArticle
}; 