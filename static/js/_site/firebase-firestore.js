// 简化版的Firebase Firestore模块

// 模拟数据
const mockPosts = [
  {
    id: 'post1',
    data: function() {
      return {
        title: '测试文章1',
        content: '# 这是一个测试文章\n\n这是正文内容，支持Markdown格式。',
        author: '测试用户',
        createdAt: {
          toDate: function() { return new Date('2024-03-12T10:00:00'); }
        },
        tags: ['测试', 'Markdown']
      };
    }
  },
  {
    id: 'post2',
    data: function() {
      return {
        title: '测试文章2',
        content: '## 第二篇测试文章\n\n- 项目1\n- 项目2\n- 项目3',
        author: '测试用户',
        createdAt: {
          toDate: function() { return new Date('2024-03-11T15:30:00'); }
        },
        tags: ['测试', '列表']
      };
    }
  }
];

// 返回Firestore实例
export function getFirestore(app) {
  console.log('获取Firestore实例', app);
  return {
    app: app,
    type: 'firestore',
    toJSON: () => JSON.stringify({ name: app.name })
  };
}

// 返回集合引用
export function collection(db, collectionPath) {
  console.log('获取集合', collectionPath);
  return {
    id: collectionPath,
    path: collectionPath
  };
}

// 执行查询并返回结果
export async function getDocs(collectionRef) {
  console.log('获取文档', collectionRef);
  
  // 返回模拟数据
  return {
    size: mockPosts.length,
    empty: mockPosts.length === 0,
    docs: mockPosts,
    forEach: (callback) => {
      mockPosts.forEach(doc => callback(doc));
    }
  };
}

// Timestamp类
export const Timestamp = {
  fromDate: (date) => {
    return {
      toDate: () => date,
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: (date.getTime() % 1000) * 1000000
    };
  }
};

// 添加文档
export async function addDoc(collectionRef, data) {
  console.log('添加文档', collectionRef, data);
  const id = 'doc_' + Date.now();
  return { id: id };
} 