import ArticlePage from '../../../pages/ArticlePage';
import { supabase } from '../../../utils/supabase-config';

// 生成静态参数用于静态导出
export async function generateStaticParams() {
  try {
    // 获取所有文章ID
    const { data: articles } = await supabase
      .from('posts')
      .select('post_id')
      .limit(100); // 限制数量避免构建时间过长

    if (!articles) return [];

    return articles.map((article) => ({
      id: article.post_id.toString(),
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    // 返回一些默认的ID以防止构建失败
    return [
      { id: '1' },
      { id: '2' },
      { id: '3' },
    ];
  }
}

export default function Article() {
  return <ArticlePage />;
} 