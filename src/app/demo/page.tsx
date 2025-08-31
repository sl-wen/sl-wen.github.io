'use client';

import React from 'react';
import { TopDownGame } from '@/components/game/TopDownGame';

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* 页面标题 */}
      <div className="bg-gray-800 text-white p-4 border-b border-gray-700">
        <h1 className="text-2xl font-bold text-center">🎮 Top-Down RPG Game Demo</h1>
        <p className="text-center text-gray-300 mt-2">
          React + TypeScript + Phaser 3 游戏演示
        </p>
      </div>

      {/* 游戏说明 */}
      <div className="bg-gray-800 text-white p-4 border-b border-gray-700">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg font-semibold mb-2">🎯 游戏功能</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-medium text-yellow-400 mb-1">✅ 已完成功能</h3>
              <ul className="space-y-1 text-gray-300">
                <li>• 游戏场景系统（启动、主菜单、游戏、结束）</li>
                <li>• 角色精灵和动画系统</li>
                <li>• UI组件（对话框、菜单、血量、金币）</li>
                <li>• 游戏资源加载和管理</li>
                <li>• TypeScript类型安全</li>
                <li>• 响应式设计</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-blue-400 mb-1">🚧 开发中功能</h3>
              <ul className="space-y-1 text-gray-300">
                <li>• 角色移动系统</li>
                <li>• NPC对话系统</li>
                <li>• 物品收集系统</li>
                <li>• 碰撞检测</li>
                <li>• 游戏状态管理</li>
                <li>• 音效系统</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 控制说明 */}
      <div className="bg-gray-800 text-white p-4 border-b border-gray-700">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg font-semibold mb-2">🎮 控制说明</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-medium text-green-400 mb-1">桌面端控制</h3>
              <ul className="space-y-1 text-gray-300">
                <li>• 方向键 / WASD - 角色移动</li>
                <li>• 空格键 - 交互/确认</li>
                <li>• ESC键 - 暂停菜单</li>
                <li>• 鼠标点击 - 菜单选择</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-green-400 mb-1">移动端控制</h3>
              <ul className="space-y-1 text-gray-300">
                <li>• 触摸屏幕 - 角色移动</li>
                <li>• 点击NPC - 对话交互</li>
                <li>• 点击物品 - 收集</li>
                <li>• 菜单按钮 - 游戏操作</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 游戏容器 */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl h-[600px] bg-black rounded-lg overflow-hidden shadow-2xl">
          <TopDownGame width={1280} height={900} />
        </div>
      </div>

      {/* 技术信息 */}
      <div className="bg-gray-800 text-white p-4 border-t border-gray-700">
        <div className="max-w-4xl mx-auto text-center text-sm text-gray-400">
          <p>
            技术栈: React 19 + TypeScript + Phaser 3 + GridEngine + TailwindCSS + Next.js 14
          </p>
          <p className="mt-1">
            基于 <a href="https://github.com/blopa/top-down-react-phaser-game" className="text-blue-400 hover:underline">原项目</a> 迁移开发
          </p>
        </div>
      </div>
    </div>
  );
}