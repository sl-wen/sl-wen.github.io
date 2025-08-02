// 增强的调试工具
export const debugSupabase = async () => {
    const { supabase } = await import('./supabase-config');

    console.log('🔍 开始Supabase连接测试...');
    console.log('📊 调试信息:', {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        online: navigator.onLine,
        connection: (navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType || 'unknown'
    });

    try {
        // 测试基本连接
        console.log('1. 测试基本连接...');
        const startTime = performance.now();
        const { error: testError } = await supabase
            .from('posts')
            .select('post_id')
            .limit(1);
        const endTime = performance.now();

        if (testError) {
            console.error('❌ 基本连接失败:', testError);
            console.error('错误详情:', {
                code: testError.code,
                message: testError.message,
                details: testError.details,
                hint: testError.hint
            });
            return false;
        }

        console.log('✅ 基本连接成功');
        console.log('⏱️ 连接耗时:', `${(endTime - startTime).toFixed(2)}ms`);

        // 测试文章查询
        console.log('2. 测试文章查询...');
        const queryStartTime = performance.now();
        const { data: articles, error: articlesError } = await supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
        const queryEndTime = performance.now();

        if (articlesError) {
            console.error('❌ 文章查询失败:', articlesError);
            console.error('查询错误详情:', {
                code: articlesError.code,
                message: articlesError.message,
                details: articlesError.details,
                hint: articlesError.hint
            });
            return false;
        }

        console.log('✅ 文章查询成功，获取到', articles?.length || 0, '篇文章');
        console.log('⏱️ 查询耗时:', `${(queryEndTime - queryStartTime).toFixed(2)}ms`);
        console.log('文章示例:', articles?.[0]);

        // 测试文章数量查询
        console.log('3. 测试文章数量查询...');
        const countStartTime = performance.now();
        const { count, error: countError } = await supabase
            .from('posts')
            .select('*', { count: 'exact', head: true });
        const countEndTime = performance.now();

        if (countError) {
            console.error('❌ 文章数量查询失败:', countError);
            console.error('计数错误详情:', {
                code: countError.code,
                message: countError.message,
                details: countError.details,
                hint: countError.hint
            });
            return false;
        }

        console.log('✅ 文章数量查询成功，总计', count, '篇文章');
        console.log('⏱️ 计数耗时:', `${(countEndTime - countStartTime).toFixed(2)}ms`);

        // 性能分析
        const totalTime = countEndTime - startTime;
        console.log('📈 性能分析:', {
            totalTime: `${totalTime.toFixed(2)}ms`,
            averageTime: `${(totalTime / 3).toFixed(2)}ms`,
            isSlow: totalTime > 3000 ? '是' : '否'
        });

        return true;
    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error);
        console.error('错误堆栈:', (error as Error).stack);
        return false;
    }
};

// 调试文章服务
export const debugArticleService = async () => {
    console.log('🔍 开始调试文章服务...');

    try {
        const { getArticles, getArticlesCount } = await import('./articleService');

        // 测试获取文章列表
        console.log('1. 测试获取文章列表...');
        const articlesStartTime = performance.now();
        const articles = await getArticles(1, 10);
        const articlesEndTime = performance.now();

        console.log('文章列表结果:', {
            count: articles.length,
            time: `${(articlesEndTime - articlesStartTime).toFixed(2)}ms`,
            hasData: articles.length > 0,
            firstArticle: articles[0] ? {
                id: articles[0].post_id,
                title: articles[0].title,
                author: articles[0].author
            } : null
        });

        // 测试获取文章数量
        console.log('2. 测试获取文章数量...');
        const countStartTime = performance.now();
        const count = await getArticlesCount();
        const countEndTime = performance.now();

        console.log('文章数量结果:', {
            count: count,
            time: `${(countEndTime - countStartTime).toFixed(2)}ms`
        });

        return {
            articles: articles.length,
            totalCount: count,
            articlesTime: articlesEndTime - articlesStartTime,
            countTime: countEndTime - countStartTime
        };
    } catch (error) {
        console.error('❌ 文章服务调试失败:', error);
        return null;
    }
};

// 调试网络状态
export const debugNetworkStatus = () => {
    console.log('🌐 网络状态调试:');
    console.log('- 在线状态:', navigator.onLine);
    console.log('- 连接类型:', (navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType || 'unknown');
    console.log('- 下行速度:', (navigator as Navigator & { connection?: { downlink?: number } }).connection?.downlink || 'unknown');
    console.log('- RTT:', (navigator as Navigator & { connection?: { rtt?: number } }).connection?.rtt || 'unknown');

    // 测试网络连接
    fetch('https://pcwbtcsigmjnrigkfixm.supabase.co')
        .then(response => {
            console.log('✅ Supabase域名可访问:', response.status);
        })
        .catch(error => {
            console.error('❌ Supabase域名不可访问:', error);
        });
};

// 在浏览器控制台中可以调用的调试函数
if (typeof window !== 'undefined') {
    (window as Window & { debugSupabase?: typeof debugSupabase }).debugSupabase = debugSupabase;
    (window as Window & { debugArticleService?: typeof debugArticleService }).debugArticleService = debugArticleService;
    (window as Window & { debugNetworkStatus?: typeof debugNetworkStatus }).debugNetworkStatus = debugNetworkStatus;

    // 自动运行调试
    setTimeout(() => {
        console.log('🚀 自动运行调试测试...');
        debugSupabase();
        debugArticleService();
        debugNetworkStatus();
    }, 2000);
} 