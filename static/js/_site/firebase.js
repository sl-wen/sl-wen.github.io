import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

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

// 初始化 Firestore
const db = getFirestore(app);

// 初始化 Auth
const auth = getAuth(app);

// 将 db 和 auth 添加到全局变量
window.db = db;
window.auth = auth;

export { db, auth }; 