// Firebase 配置
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// 初始化服务
const db = getFirestore();
const auth = getAuth();

// 导出实例
export { db, auth, app };
export default app; 