/**
 * 小说爬虫功能实现
 * 支持从特定网站爬取小说内容并下载为 TXT 文件
 */

// 定义 API 服务器的基础 URL
const API_BASE_URL = 'https://slwen.cn/api/optimized/search';

// api url 构造函数
function buildApiUrl(base, params) {
    const usp = new URLSearchParams(params);
    return base + '?' + usp.toString();
}

// 数据格式化函数
function normalizeNovel(novel, idx) {
    return {
        index: idx + 1,
        id: novel.id || '',
        title: novel.title || novel.name || '未知标题',
        author: novel.author || '未知作者',
        chapterCount: novel.chapterCount || novel.chapters?.length || '-', // 根据接口字段兼容
        latestChapter: novel.latestChapter || novel.chapters?.slice(-1)[0]?.title || '-',
        lastUpdate: novel.lastUpdate || novel.updateTime || novel.updated || '-',
        source: (novel.sourceId ? novel.sourceId : '-') + ' ' + (novel.sourceName || novel.source || '-'),
        downloadUrl: novel.downloadUrl || novel.download || '' // 你数据里如有下载链接
    };
}

// 设置展示列表
function setNovels(novels) {
    const tbody = document.querySelector('#novelList tbody');
    tbody.innerHTML = '';
    if (!novels.length) {
        tbody.innerHTML = `<tr><td colspan="8">未找到相关小说。</td></tr>`;
        return;
    }
    novels.forEach((novel, idx) => {
        const n = normalizeNovel(novel, idx);
        // “下载”按钮/链接，如无则只显示'-'
        const downloadCell = n.downloadUrl
            ? `<a href="${n.downloadUrl}" target="_blank">下载</a>`
            : '-';
        tbody.innerHTML += `
        <tr>
          <td>${n.index}</td>
          <td>${n.title}</td>
          <td>${n.author}</td>
          <td>${n.chapterCount}</td>
          <td>${n.latestChapter}</td>
          <td>${n.lastUpdate}</td>
          <td>${n.source}</td>
          <td>${downloadCell}</td>
        </tr>
      `;
    });
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('searchbtn').onclick = async function () {
        const keyword = document.getElementById('keyword').value.trim();
        if (!keyword) return;
        document.getElementById('novelList').textContent = '正在搜索...';
        console.log("search");

        // 构造接口地址（示例）
        const optimizedUrl = buildApiUrl(API_BASE_URL, {
            keyword,
            q: keyword,           // 兼容参数名
            maxResults: 30,
            max_results: 30      // 兼容参数名
        });
        let res, data;
        try {
            res = await fetch(optimizedUrl);

            try {
                data = await res.json();
            } catch (jsonErr) {
                // 如果json解析失败，再尝试text
                data = { raw: await res.text().catch(() => '') };
            }

        } catch (fetchErr) {
            // 如果fetch本身失败，提示网络错误
            data = { raw: '' };
            // 可以额外弹窗、console.error等
        }

        if (res && res.ok && (data.code === 200 || Array.isArray(data.data))) {
            const list = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
            setNovels(list);
        } else {
            setNovels([]);
        }
    };
})