// 简化版的Marked模块

// 简单的Markdown转HTML函数
export function marked(markdown) {
  if (!markdown) return '';
  
  // 先处理表格，避免被其他规则干扰
  let html = processTable(markdown);
  
  // 处理标题
  html = html
    .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
    .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
    .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
    .replace(/^#### (.*?)$/gm, '<h4>$1</h4>');
  
  // 处理段落，但排除已处理的HTML标签
  html = html.replace(/^(?!<h|<table|<ul|<li|<p|$)(.+)$/gm, '<p>$1</p>');
  
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

// 处理Markdown表格
function processTable(text) {
  // 匹配表格的正则表达式
  const tableRegex = /^\|(.*\|)+\n\|([-:]+\|)+\n(\|.*\|\n?)+/gm;
  
  return text.replace(tableRegex, function(match) {
    const lines = match.trim().split('\n');
    
    if (lines.length < 3) return match; // 表格至少需要3行
    
    const headerRow = lines[0];
    const separatorRow = lines[1];
    const bodyRows = lines.slice(2);
    
    // 解析表头
    const headers = headerRow.split('|').slice(1, -1);
    
    // 构建表格HTML
    let tableHtml = '<table border="1">\n<thead>\n<tr>\n';
    
    headers.forEach(header => {
      tableHtml += `<th>${header.trim()}</th>\n`;
    });
    
    tableHtml += '</tr>\n</thead>\n<tbody>\n';
    
    // 处理表格内容
    bodyRows.forEach(row => {
      const cells = row.split('|').slice(1, -1);
      
      tableHtml += '<tr>\n';
      cells.forEach(cell => {
        tableHtml += `<td>${cell.trim()}</td>\n`;
      });
      tableHtml += '</tr>\n';
    });
    
    tableHtml += '</tbody>\n</table>';
    
    return tableHtml;
  });
} 