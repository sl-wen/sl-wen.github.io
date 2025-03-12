import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';
import { readFile } from 'fs/promises';
import { join } from 'path';
import matter from 'gray-matter';
import { glob } from 'glob';

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

async function migrateMarkdownPosts() {
    try {
        // 获取所有 markdown 文件
        const postsDir = join(process.cwd(), '_posts');
        const markdownFiles = await glob('*.md', { cwd: postsDir });

        console.log(`找到 ${markdownFiles.length} 篇文章需要迁移`);

        for (const file of markdownFiles) {
            const filePath = join(postsDir, file);
            const content = await readFile(filePath, 'utf-8');
            const { data, content: markdownContent } = matter(content);

            // 从文件名中提取日期
            const dateMatch = file.match(/^(\d{4}-\d{2}-\d{2})/);
            const postDate = dateMatch ? new Date(dateMatch[1]) : new Date();

            // 创建 Firestore 文档
            const post = {
                title: data.title || '无标题',
                content: markdownContent.trim(),
                author: data.author || 'Admin',
                tags: data.tags || [],
                categories: data.categories || [],
                createdAt: Timestamp.fromDate(postDate),
                updatedAt: Timestamp.fromDate(new Date()),
                originalFile: file
            };

            const docRef = await addDoc(collection(db, "posts"), post);
            console.log(`文章 "${post.title}" 迁移成功，ID: ${docRef.id}`);
        }

        console.log('所有文章迁移完成！');
        process.exit(0);
    } catch (error) {
        console.error('迁移失败:', error);
        process.exit(1);
    }
}

// 执行迁移
migrateMarkdownPosts(); 