'use client';

import dynamic from 'next/dynamic';

// 在客户端组件中使用 ssr: false
const StatusMessages = dynamic(() => import('@/components/StatusMessages'), {
  ssr: false, // 禁用服务端渲染，因为状态消息是客户端功能
  loading: () => null // 加载时不显示任何内容
});

export default function ClientStatusMessages() {
  return <StatusMessages />;
}
