import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '在线工具箱',
  description: '免费在线工具集合：二维码生成、Base64编码、哈希计算、JSON格式化、颜色转换、加密解密、图片处理、房贷计算、汇率换算等20+实用工具。',
  keywords: ['在线工具', '免费工具', '开发者工具', '二维码', 'Base64', '加密'],
};

export default function ToolLayout({ children }: { children: React.ReactNode }) {
  return children;
}
