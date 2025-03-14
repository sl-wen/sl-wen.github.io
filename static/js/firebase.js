import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
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

// 初始化 Firestore，并配置缓存
const db = getFirestore(app);

// 设置 Firestore 缓存配置
const settings = {
  cacheSizeBytes: 40 * 1024 * 1024, // 40MB
  experimentalForceLongPolling: true, // 强制使用长轮询
  ignoreUndefinedProperties: true, // 忽略未定义的属性
  cache: 'persistent' // 启用持久化缓存
};

// 应用设置
db.settings(settings);

// 初始化 Auth
const auth = getAuth(app);

export { db, auth }; 