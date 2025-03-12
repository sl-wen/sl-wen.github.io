// 简化版的Marked模块

// 简单的Markdown转HTML函数
export function marked(markdown) {
  if (!markdown) return '';
  
  // 处理标题
  let html = markdown
    .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
    .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
    .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
    .replace(/^#### (.*?)$/gm, '<h4>$1</h4>');
  
  // 处理段落
  html = html.replace(/^([^<\n].*?)$/gm, '<p>$1</p>');
  
  // 处理加粗
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // 处理斜体
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // 处理列表
  html = html.replace(/^- (.*?)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*?<\/li>\n?)+/g, '<ul>$&</ul>');
  
  // 处理代码
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');
  
  // 处理链接
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
  
  return html;
} 