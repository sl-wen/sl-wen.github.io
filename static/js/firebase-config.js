// 导入 Firebase 核心功能
import { initializeApp } from 'firebase/app';      // 导入 Firebase 应用初始化函数
import { getFirestore } from 'firebase/firestore'; // 导入 Firestore 数据库功能
import { getAuth } from 'firebase/auth';           // 导入身份验证功能

// Firebase 项目配置信息
const firebaseConfig = {
    apiKey: "AIzaSyCuXDfNvLwiISoMwzcUIwUbaPTl69uRnao",        // API 密钥
    authDomain: "slwen-45838.firebaseapp.com",                  // 认证域名
    projectId: "slwen-45838",                                   // 项目 ID
    storageBucket: "slwen-45838.appspot.com",                  // 存储桶地址
    messagingSenderId: "734137620659",                         // 消息发送者 ID
    appId: "1:734137620659:web:81ce8b971dce766d67b8c6",       // 应用 ID
    measurementId: "G-WEBZLW3S59"                              // 统计测量 ID
};

// 初始化 Firebase 应用实例
const app = initializeApp(firebaseConfig);

// 初始化 Firestore 数据库服务
const db = getFirestore(app);

// 初始化身份验证服务
const auth = getAuth(app);

// 将数据库和身份验证实例添加到全局对象中，方便其他模块使用
window.db = db;
window.auth = auth;

// 导出数据库和身份验证实例，供其他模块导入使用
export { db, auth, app };
export default app; 