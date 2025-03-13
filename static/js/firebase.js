import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

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

// 使用新的缓存配置初始化 Firestore
const db = initializeFirestore(app, {
    cache: {
        sizeBytes: 100 * 1024 * 1024 // 100MB 缓存大小
    }
});

// 启用离线持久化
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      // 多个标签页同时打开时可能会失败
      console.warn('离线持久化启用失败：多个标签页同时打开');
    } else if (err.code === 'unimplemented') {
      // 当前浏览器不支持
      console.warn('离线持久化启用失败：浏览器不支持');
    } else {
      console.error('离线持久化启用失败：', err);
    }
  });

// 初始化 Auth
const auth = getAuth(app);

export { db, auth }; 