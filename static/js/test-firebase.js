import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp, doc, setDoc } from 'firebase/firestore';

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
            content: '# 这是一篇测试文章\n\n这是文章的正文内容。\n\n## 第二级标题\n\n- 列表项1\n- 列表项2\n- 列表项3\n\n### 代码示例\n\n```javascript\nconsole.log("Hello World!");\n```',
            author: 'Admin',
            tags: ['测试', 'Firebase'],
            createdAt: Timestamp.fromDate(new Date()),
            updatedAt: Timestamp.fromDate(new Date())
        };

        // 使用指定的文档ID
        const docRef = doc(db, "posts", "01C3Klimh4mhder8Kt1W");
        await setDoc(docRef, testPost);
        console.log('测试文章添加成功');
        
        // 添加成功后返回到文章页面
        window.location.href = `/pages/article.html?id=01C3Klimh4mhder8Kt1W`;
    } catch (error) {
        console.error('添加测试文章失败:', error);
        alert('添加测试文章失败: ' + error.message);
    }
}

// 添加一个按钮来触发添加文章
const button = document.createElement('button');
button.textContent = '添加测试文章';
button.onclick = addTestPost;
document.body.insertBefore(button, document.getElementById('posts'));

// 导出函数
window.addTestPost = addTestPost; 