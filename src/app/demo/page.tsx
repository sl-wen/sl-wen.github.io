'use client';

import React from 'react';
import { TopDownGame } from '@/components/game/TopDownGame';

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col">
      {/* 页面标题 */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white p-6 border-b border-gray-600 shadow-lg">
        <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
          🎮 Top-Down RPG Game Demo
        </h1>
        <p className="text-center text-gray-300 mt-3 text-lg">
          React + TypeScript + Phaser 3 游戏演示
        </p>
      </div>

      {/* 游戏说明 */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white p-6 border-b border-gray-600">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold mb-4 text-center">🎯 游戏功能</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="bg-gray-700 bg-opacity-50 rounded-lg p-4 shadow-lg">
              <h3 className="font-medium text-yellow-400 mb-3 text-lg">✅ 已完成功能</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  游戏场景系统（启动、主菜单、游戏、结束）
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  角色精灵和动画系统
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  UI组件（对话框、菜单、血量、金币）
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  游戏资源加载和管理
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  TypeScript类型安全
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  响应式设计
                </li>
              </ul>
            </div>
            <div className="bg-gray-700 bg-opacity-50 rounded-lg p-4 shadow-lg">
              <h3 className="font-medium text-blue-400 mb-3 text-lg">🚧 开发中功能</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center">
                  <span className="text-blue-400 mr-2">⟳</span>
                  角色移动系统
                </li>
                <li className="flex items-center">
                  <span className="text-blue-400 mr-2">⟳</span>
                  NPC对话系统
                </li>
                <li className="flex items-center">
                  <span className="text-blue-400 mr-2">⟳</span>
                  物品收集系统
                </li>
                <li className="flex items-center">
                  <span className="text-blue-400 mr-2">⟳</span>
                  碰撞检测
                </li>
                <li className="flex items-center">
                  <span className="text-blue-400 mr-2">⟳</span>
                  游戏状态管理
                </li>
                <li className="flex items-center">
                  <span className="text-blue-400 mr-2">⟳</span>
                  音效系统
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 控制说明 */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white p-6 border-b border-gray-600">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold mb-4 text-center">🎮 控制说明</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="bg-gray-700 bg-opacity-50 rounded-lg p-4 shadow-lg">
              <h3 className="font-medium text-green-400 mb-3 text-lg">🖥️ 桌面端控制</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">⌨️</span>
                  方向键 / WASD - 角色移动
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">␣</span>
                  空格键 - 交互/确认
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">⎋</span>
                  ESC键 - 暂停菜单
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">🖱️</span>
                  鼠标点击 - 菜单选择
                </li>
              </ul>
            </div>
            <div className="bg-gray-700 bg-opacity-50 rounded-lg p-4 shadow-lg">
              <h3 className="font-medium text-green-400 mb-3 text-lg">📱 移动端控制</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">👆</span>
                  触摸屏幕 - 角色移动
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">💬</span>
                  点击NPC - 对话交互
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">💰</span>
                  点击物品 - 收集
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">⚙️</span>
                  菜单按钮 - 游戏操作
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 游戏容器 */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl h-[600px] bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-gray-600">
          <TopDownGame width={1280} height={900} />
        </div>
      </div>

      {/* 技术信息 */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white p-6 border-t border-gray-600">
        <div className="max-w-4xl mx-auto text-center text-sm text-gray-400">
          <p className="text-lg">
            技术栈: <span className="text-blue-400 font-semibold">React 19</span> + <span className="text-blue-400 font-semibold">TypeScript</span> + <span className="text-blue-400 font-semibold">Phaser 3</span> + <span className="text-blue-400 font-semibold">GridEngine</span> + <span className="text-blue-400 font-semibold">TailwindCSS</span> + <span className="text-blue-400 font-semibold">Next.js 14</span>
          </p>
          <p className="mt-2">
            基于 <a href="https://github.com/blopa/top-down-react-phaser-game" className="text-yellow-400 hover:text-yellow-300 underline font-semibold">原项目</a> 迁移开发
          </p>
        </div>
      </div>
    </div>
  );
}