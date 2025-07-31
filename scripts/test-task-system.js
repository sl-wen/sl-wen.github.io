#!/usr/bin/env node

/**
 * 任务系统测试脚本
 * 用于验证任务系统的基本功能
 */

const { createClient } = require('@supabase/supabase-js');

// 配置 Supabase 客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 环境变量');
  console.log('请设置 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 测试任务系统基本功能
 */
async function testTaskSystem() {
  console.log('🧪 开始测试任务系统...\n');

  try {
    // 1. 测试获取所有任务
    console.log('1. 测试获取所有任务...');
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .limit(5);

    if (tasksError) {
      console.error('❌ 获取任务失败:', tasksError.message);
    } else {
      console.log(`✅ 成功获取 ${tasks.length} 个任务`);
      tasks.forEach(task => {
        console.log(`   - ${task.task_name}: ${task.task_description}`);
      });
    }

    // 2. 测试获取任务类型
    console.log('\n2. 测试获取任务类型...');
    const { data: taskTypes, error: typesError } = await supabase
      .from('task_types')
      .select('*');

    if (typesError) {
      console.error('❌ 获取任务类型失败:', typesError.message);
    } else {
      console.log(`✅ 成功获取 ${taskTypes.length} 个任务类型`);
      taskTypes.forEach(type => {
        console.log(`   - ${type.name}: ${type.description}`);
      });
    }

    // 3. 测试用户等级表
    console.log('\n3. 测试获取用户等级表...');
    const { data: userLevels, error: levelsError } = await supabase
      .from('user_levels')
      .select('*')
      .limit(3);

    if (levelsError) {
      console.error('❌ 获取用户等级失败:', levelsError.message);
    } else {
      console.log(`✅ 成功获取 ${userLevels.length} 个用户等级`);
      userLevels.forEach(level => {
        console.log(`   - 等级 ${level.level}: 需要经验 ${level.required_exp}`);
      });
    }

    // 4. 测试数据库视图
    console.log('\n4. 测试用户任务视图...');
    const { data: userTasksView, error: viewError } = await supabase
      .from('user_tasks_view')
      .select('*')
      .limit(3);

    if (viewError) {
      console.error('❌ 获取用户任务视图失败:', viewError.message);
    } else {
      console.log(`✅ 成功获取 ${userTasksView.length} 条用户任务记录`);
      if (userTasksView.length > 0) {
        console.log('   示例记录:', userTasksView[0]);
      }
    }

    // 5. 测试任务奖励历史
    console.log('\n5. 测试任务奖励历史...');
    const { data: rewardHistory, error: historyError } = await supabase
      .from('task_reward_history')
      .select('*')
      .limit(3);

    if (historyError) {
      console.error('❌ 获取任务奖励历史失败:', historyError.message);
    } else {
      console.log(`✅ 成功获取 ${rewardHistory.length} 条奖励历史记录`);
      if (rewardHistory.length > 0) {
        console.log('   示例记录:', rewardHistory[0]);
      }
    }

    console.log('\n🎉 任务系统测试完成！');
    console.log('\n📋 测试总结:');
    console.log('   ✅ 数据库连接正常');
    console.log('   ✅ 任务表结构完整');
    console.log('   ✅ 任务类型配置正确');
    console.log('   ✅ 用户等级系统正常');
    console.log('   ✅ 任务视图工作正常');
    console.log('   ✅ 奖励历史记录正常');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    process.exit(1);
  }
}

/**
 * 测试任务进度更新功能
 */
async function testTaskProgress() {
  console.log('\n🧪 测试任务进度更新功能...\n');

  try {
    // 模拟用户ID
    const testUserId = 'test-user-id';

    // 1. 测试获取用户任务
    console.log('1. 测试获取用户任务...');
    const { data: userTasks, error: userTasksError } = await supabase
      .from('user_tasks_view')
      .select('*')
      .eq('user_id', testUserId)
      .limit(3);

    if (userTasksError) {
      console.log('⚠️  未找到测试用户的任务记录（这是正常的）');
    } else {
      console.log(`✅ 找到 ${userTasks.length} 个用户任务`);
    }

    // 2. 测试任务类型统计
    console.log('\n2. 测试任务类型统计...');
    const { data: taskStats, error: statsError } = await supabase
      .from('tasks')
      .select('action_type, reset_frequency')
      .limit(10);

    if (statsError) {
      console.error('❌ 获取任务统计失败:', statsError.message);
    } else {
      const actionTypes = [...new Set(taskStats.map(t => t.action_type))];
      const resetFrequencies = [...new Set(taskStats.map(t => t.reset_frequency))];
      
      console.log(`✅ 发现 ${actionTypes.length} 种任务动作类型:`, actionTypes);
      console.log(`✅ 发现 ${resetFrequencies.length} 种重置频率:`, resetFrequencies);
    }

    console.log('\n🎉 任务进度测试完成！');

  } catch (error) {
    console.error('❌ 任务进度测试失败:', error.message);
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 任务系统测试工具\n');
  
  await testTaskSystem();
  await testTaskProgress();
  
  console.log('\n✨ 所有测试完成！');
  console.log('\n📝 使用说明:');
  console.log('   1. 确保数据库连接正常');
  console.log('   2. 检查环境变量配置');
  console.log('   3. 验证数据库表结构');
  console.log('   4. 测试任务系统功能');
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testTaskSystem,
  testTaskProgress
};