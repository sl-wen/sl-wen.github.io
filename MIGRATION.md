# Firebase 到 Supabase 迁移指南

本文档指导如何将博客系统从 Firebase 迁移到 Supabase 数据库。

## 准备工作

1. 安装依赖
```bash
npm install @supabase/supabase-js
```

2. 配置 Supabase
- 在 `static/js/supabase-config.js` 中设置你的 Supabase URL 和 anon key
- 将连接字符串保存在环境变量中：`SUPABASE_URL` 和 `SUPABASE_KEY`

## 数据库初始化

1. 在 Supabase 中创建数据库表
- 使用 `sql/init.sql` 中的 SQL 脚本创建必要的表和函数
- 在 Supabase 的 SQL 编辑器中执行脚本

## 数据迁移

1. 运行迁移脚本
```bash
node static/js/migrate-to-supabase.js
```

2. 验证数据
- 检查 Supabase 中的文章数据是否完整
- 确认访问统计是否正确迁移

## 代码更新

已更新的文件：
- `static/js/supabase-config.js`
- `static/js/migrate-to-supabase.js`

需要修改的导入语句：
```javascript
// 将
import { ... } from './firebase-config.js';
// 改为
import { ... } from './supabase-config.js';
```

## 注意事项

1. 数据库连接
- 确保 Supabase 连接字符串正确配置
- 检查数据库权限设置

2. 数据迁移
- 建议先在测试环境进行迁移
- 保留 Firebase 数据作为备份

3. 性能优化
- 考虑添加适当的数据库索引
- 监控数据库查询性能

## 回滚计划

如果迁移过程中出现问题：
1. 保留原有的 Firebase 配置文件
2. 还原代码到使用 Firebase 的版本
3. 确保 Firebase 服务仍然可用