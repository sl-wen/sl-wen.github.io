'use client';

import { useEffect, useState } from 'react';

export default function SimpleTestPage() {
  const [status, setStatus] = useState('初始化中...');

  useEffect(() => {
    setStatus('组件已加载');
    
    // 测试Phaser是否可用
    try {
      const Phaser = require('phaser');
      setStatus('Phaser 可用');
      console.log('✅ Phaser 版本:', Phaser.VERSION);
    } catch (error) {
      setStatus('Phaser 不可用: ' + (error as Error).message);
      console.error('❌ Phaser 加载失败:', error);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">简单测试页面</h1>
      
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">状态信息</h2>
        <div className="text-lg">{status}</div>
      </div>

      <div className="mt-8 bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">控制台日志</h2>
        <p className="text-gray-400">请打开浏览器开发者工具查看控制台日志</p>
      </div>
    </div>
  );
}