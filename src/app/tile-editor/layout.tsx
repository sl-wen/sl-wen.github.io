import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '瓦片地图编辑器 - 自由设计农场布局',
  description: '使用直观的瓦片编辑器创建和编辑游戏地图。支持草地、水域、道路、栅栏等多种地形类型。',
  keywords: ['瓦片编辑器', '地图设计', '游戏开发', '农场布局', 'Tile Editor'],
}

export default function TileEditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}