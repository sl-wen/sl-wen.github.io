/**
 * 小说爬虫功能实现
 * 支持从特定网站爬取小说内容并下载为 TXT 文件
 */

// 定义 API 服务器的基础 URL
const API_BASE_URL = 'https://autoapi-six.vercel.app';

// 获取页面上的所有相关 DOM 元素
const urlInput = document.getElementById('novel-url');                 // 小说网址输入框
const fetchInfoBtn = document.getElementById('fetch-info-btn');       // 获取信息按钮
const startDownloadBtn = document.getElementById('start-download-btn'); // 开始下载按钮
const novelInfoDiv = document.getElementById('novel-info');           // 小说信息容器
const novelTitle = document.getElementById('novel-title');            // 小说标题显示
const novelAuthor = document.getElementById('novel-author');          // 作者显示
const chapterCount = document.getElementById('chapter-count');        // 章节数显示
const novelIntro = document.getElementById('novel-intro');            // 简介显示
const progressContainer = document.getElementById('progress-container'); // 进度条容器
const progressBar = document.getElementById('progress-bar');          // 进度条
const progressText = document.getElementById('progress-text');        // 进度文本
const statusMessage = document.getElementById('status-message');      // 状态信息
const downloadCompleteDiv = document.getElementById('download-complete'); // 下载完成提示
const downloadLink = document.getElementById('download-link');        // 下载链接

// 小说数据对象，用于存储爬取的信息
let novelData = {
    title: '',      // 小说标题
    author: '',     // 作者
    intro: '',      // 简介
    chapters: [],   // 章节列表
    chapterContents: []  // 章节内容
};

// 当页面加载完成时，添加事件监听器
document.addEventListener('DOMContentLoaded', function() {
    fetchInfoBtn.addEventListener('click', fetchNovelInfo);        // 获取小说信息按钮点击事件
    startDownloadBtn.addEventListener('click', startDownload);     // 开始下载按钮点击事件
});

/**
 * 获取小说基本信息的函数
 * 包括标题、作者、简介和章节列表
 */
async function fetchNovelInfo() {
    const url = urlInput.value.trim();  // 获取并清理输入的 URL
    
    // 输入验证
    if (!url) {
        alert('请输入小说网址');
        return;
    }
    
    // 检查网站是否支持
    if (!url.includes('xs5200.net')) {
        alert('目前仅支持xs5200.net网站的小说');
        return;
    }
    
    try {
        // 禁用按钮并显示加载状态
        fetchInfoBtn.disabled = true;
        fetchInfoBtn.textContent = '获取中...';
        
        // 调用 API 获取小说信息
        const response = await fetch(`${API_BASE_URL}/api/novel/info`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url })
        });
        
        // 检查响应状态
        if (!response.ok) {
            throw new Error(`获取小说信息失败 (${response.status})`);
        }
        
        const data = await response.json();
        
        // 验证返回的数据
        if (!data.title || !data.chapters || data.chapters.length === 0) {
            throw new Error('未找到小说信息，请检查URL是否正确');
        }
        
        // 保存小说信息
        novelData = data;
        
        // 更新页面显示
        novelTitle.textContent = data.title;
        novelAuthor.textContent = data.author || '未知';
        chapterCount.textContent = `${data.chapters.length}章`;
        novelIntro.textContent = data.intro || '暂无简介';
        
        // 显示小说信息区域并启用下载按钮
        novelInfoDiv.style.display = 'block';
        startDownloadBtn.disabled = false;
        
    } catch (error) {
        console.error('获取小说信息失败:', error);
        // API 不可用时，切换到前端爬虫方式
        alert(`API服务请求失败: ${error.message}\n将尝试使用前端爬虫方式获取信息`);
        fetchNovelInfoFallback(url);
    } finally {
        // 恢复按钮状态
        fetchInfoBtn.disabled = false;
        fetchInfoBtn.textContent = '获取小说信息';
    }
}

/**
 * 前端爬虫获取小说信息的备用方案
 * 当 API 不可用时使用此方法直接从网页爬取
 */
async function fetchNovelInfoFallback(url) {
    try {
        // 使用 CORS 代理服务解决跨域问题
        const proxyUrl = `https://cors-anywhere.herokuapp.com/${url}`;
        
        // 获取小说目录页面内容
        const response = await fetch(proxyUrl);
        const html = await response.text();
        
        // 解析 HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // 提取小说基本信息
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
        
        // 验证章节列表
        if (chapters.length === 0) {
            throw new Error('未找到章节列表');
        }
        
        // 保存小说信息
        novelData = {
            title,
            author,
            intro,
            chapters,
            chapterContents: []
        };
        
        // 更新页面显示
        novelTitle.textContent = title;
        novelAuthor.textContent = author;
        chapterCount.textContent = `${chapters.length}章`;
        novelIntro.textContent = intro;
        
        // 显示小说信息并启用下载
        novelInfoDiv.style.display = 'block';
        startDownloadBtn.disabled = false;
        
    } catch (error) {
        console.error('前端爬虫获取小说信息失败:', error);
        alert(`获取小说信息失败: ${error.message}\n您可能需要允许跨域请求或尝试使用其他浏览器。`);
    }
}

/**
 * 开始下载小说内容
 * 分批下载所有章节并生成 TXT 文件
 */
async function startDownload() {
    // 验证章节信息
    if (!novelData.chapters || novelData.chapters.length === 0) {
        alert('没有找到章节信息，无法下载');
        return;
    }
    
    try {
        // 禁用按钮
        startDownloadBtn.disabled = true;
        fetchInfoBtn.disabled = true;
        
        // 显示和初始化进度条
        progressContainer.style.display = 'block';
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
        statusMessage.textContent = '正在准备下载...';
        
        // 清空之前的下载内容
        novelData.chapterContents = [];
        
        // 设置下载参数
        const totalChapters = novelData.chapters.length;
        let completedChapters = 0;
        
        // 分批下载章节
        const batchSize = 5;  // 每批下载 5 个章节
        const batches = Math.ceil(totalChapters / batchSize);
        
        // 逐批下载
        for (let i = 0; i < batches; i++) {
            const start = i * batchSize;
            const end = Math.min(start + batchSize, totalChapters);
            const batchChapters = novelData.chapters.slice(start, end);
            
            // 并行下载当前批次的章节
            const promises = batchChapters.map(chapter => fetchChapterContent(chapter.url));
            const contents = await Promise.all(promises);
            
            // 保存下载的内容
            contents.forEach((content, index) => {
                const chapterIndex = start + index;
                novelData.chapterContents[chapterIndex] = {
                    title: novelData.chapters[chapterIndex].title,
                    content: content
                };
            });
            
            // 更新下载进度
            completedChapters += batchChapters.length;
            const progress = Math.floor((completedChapters / totalChapters) * 100);
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${progress}%`;
            statusMessage.textContent = `已下载 ${completedChapters}/${totalChapters} 章`;
        }
        
        // 生成并提供下载
        generateTxtFile();
        
    } catch (error) {
        console.error('下载小说失败:', error);
        alert(`下载小说失败: ${error.message}`);
        progressContainer.style.display = 'none';
    } finally {
        // 恢复按钮状态
        startDownloadBtn.disabled = false;
        fetchInfoBtn.disabled = false;
    }
}

/**
 * 获取单个章节的内容
 * 首先尝试使用 API，如果失败则使用前端爬虫方式
 */
async function fetchChapterContent(chapterUrl) {
    try {
        // 尝试使用 API 获取章节内容
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
        console.error('获取章节内容失败:', error);
        // API 失败时尝试使用前端爬虫方式
        return fetchChapterContentFallback(chapterUrl);
    }
}

/**
 * 生成 TXT 文件并提供下载
 */
function generateTxtFile() {
    // 组合所有章节内容
    let content = `${novelData.title}\n作者：${novelData.author}\n\n${novelData.intro}\n\n`;
    
    novelData.chapterContents.forEach(chapter => {
        content += `\n\n${chapter.title}\n\n${formatChapterContent(chapter.content)}`;
    });
    
    // 创建 Blob 对象
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    downloadLink.href = url;
    downloadLink.download = `${novelData.title}.txt`;
    
    // 显示下载完成信息
    downloadCompleteDiv.style.display = 'block';
    statusMessage.textContent = '下载已完成！';
}

/**
 * 格式化章节内容
 * 清理内容中的广告和多余的空白
 */
function formatChapterContent(content) {
    return content
        .replace(/\s+/g, '\n')  // 统一换行符
        .replace(/[【\[].+?[】\]]/g, '')  // 移除广告标记
        .replace(/(https?:\/\/[^\s]+)/g, '')  // 移除链接
        .replace(/\n\s*\n/g, '\n\n')  // 规范化空行
        .trim();  // 移除首尾空白
}