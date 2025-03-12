import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getFirestore, collection, addDoc, Timestamp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// 初始化 Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCuXDfNvLwiISoMwzcUIwUbaPTl69uRnao",
    authDomain: "slwen-45838.firebaseapp.com",
    projectId: "slwen-45838",
    storageBucket: "slwen-45838.appspot.com",
    messagingSenderId: "734137620659",
    appId: "1:734137620659:web:81ce8b971dce766d67b8c6",
    measurementId: "G-WEBZLW3S59"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 添加测试文章
async function addTestPost() {
    try {
        const testPost = {
            title: '测试文章',
            content: '这是一篇测试文章的内容',
            author: '测试作者',
            tags: ['测试', 'Firebase'],
            createdAt: Timestamp.fromDate(new Date()),
            updatedAt: Timestamp.fromDate(new Date())
        };

        const docRef = await addDoc(collection(db, "posts"), testPost);
        console.log('测试文章添加成功，ID:', docRef.id);
        
        // 添加成功后刷新页面
        window.location.reload();
    } catch (error) {
        console.error('添加测试文章失败:', error);
    }
}

// 添加一个按钮来触发添加文章
const button = document.createElement('button');
button.textContent = '添加测试文章';
button.onclick = addTestPost;
document.body.insertBefore(button, document.getElementById('posts')); 