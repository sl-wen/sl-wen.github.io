// 导入 Supabase 客户端
const { createClient } = require('@supabase/supabase-js');

// Supabase 项目配置信息
const supabaseUrl = 'https://pcwbtcsigmjnrigkfixm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjd2J0Y3NpZ21qbnJpZ2tmaXhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1NzE0MDMsImV4cCI6MjA2MzE0NzQwM30.J97Dt4tOwS0bM9vALgBTga-VyCLdHN6wfFrPse6dORg';  // 使用环境变量或替换为你的 anon key

// 创建 Supabase 客户端实例
const supabase = createClient(supabaseUrl, supabaseKey);

// 导出 Supabase 客户端实例，供其他模块使用
module.exports = supabase;
module.exports.supabase = supabase;
export { supabase };
export default supabase;