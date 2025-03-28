/**
 * 小说爬虫功能实现
 */

// API基础URL
const API_BASE_URL = 'https://autoapi-six.vercel.app';

// DOM元素
const urlInput = document.getElementById('novel-url');
const fetchInfoBtn = document.getElementById('fetch-info-btn');
const startDownloadBtn = document.getElementById('start-download-btn');
const novelInfoDiv = document.getElementById('novel-info');
const novelTitle = document.getElementById('novel-title');
const novelAuthor = document.getElementById('novel-author');
const chapterCount = document.getElementById('chapter-count');
const novelIntro = document.getElementById('novel-intro');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const statusMessage = document.getElementById('status-message');
const downloadCompleteDiv = document.getElementById('download-complete');
const downloadLink = document.getElementById('download-link');

// 小说数据存储
let novelData = {
    title: '',
    author: '',
    intro: '',
    chapters: [],
    chapterContents: []
};

// 事件监听
document.addEventListener('DOMContentLoaded', function() {
    fetchInfoBtn.addEventListener('click', fetchNovelInfo);
    startDownloadBtn.addEventListener('click', startDownload);
});

/**
 * 获取小说信息
 */
async function fetchNovelInfo() {
    const url = urlInput.value.trim();
    
    if (!url) {
        alert('请输入小说网址');
        return;
    }
    
    if (!url.includes('xs5200.net')) {
        alert('目前仅支持xs5200.net网站的小说');
        return;
    }
    
    try {
        fetchInfoBtn.disabled = true;
        fetchInfoBtn.textContent = '获取中...';
        
        // 调用API获取小说信息
        const response = await fetch(`${API_BASE_URL}/api/novel/info`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url })
        });
        
        if (!response.ok) {
            throw new Error(`获取小说信息失败 (${response.status})`);
        }
        
        const data = await response.json();
        
        // 如果没有找到小说信息
        if (!data.title || !data.chapters || data.chapters.length === 0) {
            throw new Error('未找到小说信息，请检查URL是否正确');
        }
        
        // 存储小说信息
        novelData = data;
        
        // 显示小说信息
        novelTitle.textContent = data.title;
        novelAuthor.textContent = data.author || '未知';
        chapterCount.textContent = `${data.chapters.length}章`;
        novelIntro.textContent = data.intro || '暂无简介';
        
        // 显示小说信息区域并启用下载按钮
        novelInfoDiv.style.display = 'block';
        startDownloadBtn.disabled = false;
        
    } catch (error) {
        console.error('获取小说信息失败:', error);
        // 如果API不可用，使用前端爬虫方式
        alert(`API服务请求失败: ${error.message}\n将尝试使用前端爬虫方式获取信息`);
        fetchNovelInfoFallback(url);
    } finally {
        fetchInfoBtn.disabled = false;
        fetchInfoBtn.textContent = '获取小说信息';
    }
}

/**
 * 前端爬虫获取小说信息（备用方案）
 */
async function fetchNovelInfoFallback(url) {
    try {
        // 使用跨域代理
        const proxyUrl = `https://cors-anywhere.herokuapp.com/${url}`;
        
        // 获取小说目录页
        const response = await fetch(proxyUrl);
        const html = await response.text();
        
        // 创建一个DOM解析器
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // 提取小说信息
        const title = doc.querySelector('h1').textContent.trim();
        const authorElement = doc.querySelector('div.info-row:contains("作者")');
        const author = authorElement ? authorElement.querySelector('span').textContent.trim() : '未知';
        const introElement = doc.querySelector('div.intro, div.description');
        const intro = introElement ? introElement.textContent.trim() : '暂无简介';
        
        // 提取章节列表
        const chapterLinks = Array.from(doc.querySelectorAll('div.list-group a, div.chapter-list a, div#list a'));
        const chapters = chapterLinks.map((link, index) => ({
            id: index + 1,
            title: link.textContent.trim(),
            url: new URL(link.href, url).href
        }));
        
        if (chapters.length === 0) {
            throw new Error('未找到章节列表');
        }
        
        // 存储小说信息
        novelData = {
            title,
            author,
            intro,
            chapters,
            chapterContents: []
        };
        
        // 显示小说信息
        novelTitle.textContent = title;
        novelAuthor.textContent = author;
        chapterCount.textContent = `${chapters.length}章`;
        novelIntro.textContent = intro;
        
        // 显示小说信息区域并启用下载按钮
        novelInfoDiv.style.display = 'block';
        startDownloadBtn.disabled = false;
        
    } catch (error) {
        console.error('前端爬虫获取小说信息失败:', error);
        alert(`获取小说信息失败: ${error.message}\n您可能需要允许跨域请求或尝试使用其他浏览器。`);
    }
}

/**
 * 开始下载小说
 */
async function startDownload() {
    if (!novelData.chapters || novelData.chapters.length === 0) {
        alert('没有找到章节信息，无法下载');
        return;
    }
    
    try {
        startDownloadBtn.disabled = true;
        fetchInfoBtn.disabled = true;
        
        // 显示进度条
        progressContainer.style.display = 'block';
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
        statusMessage.textContent = '正在准备下载...';
        
        // 如果之前已经下载过，清空章节内容
        novelData.chapterContents = [];
        
        // 计算并更新进度
        const totalChapters = novelData.chapters.length;
        let completedChapters = 0;
        
        // 尝试使用API下载所有章节
        const batchSize = 5; // 每批下载的章节数
        const batches = Math.ceil(totalChapters / batchSize);
        
        for (let i = 0; i < batches; i++) {
            const start = i * batchSize;
            const end = Math.min(start + batchSize, totalChapters);
            const batchChapters = novelData.chapters.slice(start, end);
            
            // 并行下载这一批的章节
            const promises = batchChapters.map(chapter => fetchChapterContent(chapter.url));
            const contents = await Promise.all(promises);
            
            // 将下载的内容添加到小说数据中
            contents.forEach((content, index) => {
                const chapterIndex = start + index;
                novelData.chapterContents[chapterIndex] = {
                    title: novelData.chapters[chapterIndex].title,
                    content: content
                };
            });
            
            // 更新进度
            completedChapters += batchChapters.length;
            const progress = Math.floor((completedChapters / totalChapters) * 100);
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${progress}%`;
            statusMessage.textContent = `已下载 ${completedChapters}/${totalChapters} 章`;
        }
        
        // 生成TXT文件
        generateTxtFile();
        
    } catch (error) {
        console.error('下载小说失败:', error);
        alert(`下载小说失败: ${error.message}`);
        progressContainer.style.display = 'none';
    } finally {
        startDownloadBtn.disabled = false;
        fetchInfoBtn.disabled = false;
    }
}

/**
 * 获取章节内容
 */
async function fetchChapterContent(chapterUrl) {
    try {
        // 首先尝试使用API获取章节内容
        const response = await fetch(`${API_BASE_URL}/api/novel/chapter`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: chapterUrl })
        });
        
        if (!response.ok) {
            throw new Error(`API请求失败 (${response.status})`);
        }
        
        const data = await response.json();
        return data.content || '';
        
    } catch (error) {
        console.error(`使用API获取章节 ${chapterUrl} 内容失败:`, error);
        
        // 备用方案：使用前端爬虫获取章节内容
        try {
            const proxyUrl = `https://cors-anywhere.herokuapp.com/${chapterUrl}`;
            const response = await fetch(proxyUrl);
            const html = await response.text();
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // 尝试几种常见的内容选择器
            const contentSelectors = [
                'div.content', 'div#content', 'div.chapter-content', 
                'div.article-content', 'div.read-content'
            ];
            
            for (const selector of contentSelectors) {
                const contentElement = doc.querySelector(selector);
                if (contentElement) {
                    return contentElement.textContent.trim()
                        .replace(/\s+/g, '\n\n') // 规范化空白字符
                        .replace(/([。！？；：'"】）」』}])\s*\n\s*/g, '$1\n') // 修复断行
                        .replace(/\n{3,}/g, '\n\n'); // 移除多余空行
                }
            }
            
            throw new Error('无法找到章节内容');
        } catch (fallbackError) {
            console.error(`前端爬虫获取章节 ${chapterUrl} 内容失败:`, fallbackError);
            return `[无法获取章节内容: ${fallbackError.message}]`;
        }
    }
}

/**
 * 生成TXT文件并提供下载
 */
function generateTxtFile() {
    // 准备TXT文件内容
    let content = `${novelData.title}\n`;
    content += `作者：${novelData.author || '未知'}\n\n`;
    content += `${novelData.intro || ''}\n\n`;
    content += '='.repeat(50) + '\n\n';
    
    // 添加所有章节
    novelData.chapterContents.forEach((chapter, index) => {
        content += `第${index + 1}章 ${chapter.title}\n\n`;
        content += `${chapter.content}\n\n`;
        content += '='.repeat(30) + '\n\n';
    });
    
    // 创建Blob对象
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    downloadLink.href = url;
    downloadLink.download = `${novelData.title}.txt`;
    
    // 显示下载区域
    downloadCompleteDiv.style.display = 'block';
    progressContainer.style.display = 'none';
    
    // 自动触发下载（可选）
    // downloadLink.click();
}

/**
 * 辅助函数：确保内容均有适当的格式
 */
function formatChapterContent(content) {
    if (!content) return '';
    
    // 清理内容中的广告和多余标记
    return content
        .replace(/<br\s*\/?>/gi, '\n') // 将HTML换行标签转换为文本换行
        .replace(/<\/?[^>]+(>|$)/g, '') // 移除其他HTML标签
        .replace(/(&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;)/g, match => {
            // 替换HTML实体
            const entities = {
                '&nbsp;': ' ',
                '&amp;': '&',
                '&lt;': '<',
                '&gt;': '>',
                '&quot;': '"',
                '&#39;': "'"
            };
            return entities[match] || match;
        })
        .replace(/\s{2,}/g, '\n\n') // 规范化空白
        .replace(/^(.*)(百度搜索|本章结束|广告位|小说网|章节错误|加入书签).*/gm, '$1') // 移除常见广告文本行
        .trim();
} 