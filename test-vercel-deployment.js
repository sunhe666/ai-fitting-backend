#!/usr/bin/env node
/**
 * 测试Vercel部署的API接口
 */

const axios = require('axios');

// Vercel部署URL
const BASE_URL = 'https://ai-fitting-backend-rvv5.vercel.app';

// 测试配置
const TEST_CONFIG = {
  timeout: 30000, // 30秒超时
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'AI-Fitting-Test-Client/1.0'
  }
};

// 颜色输出
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
};

// 测试结果
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  details: []
};

async function runTest(testName, testFn) {
  testResults.total++;
  console.log(colors.cyan(`\n🧪 测试: ${testName}`));
  
  try {
    const result = await testFn();
    testResults.passed++;
    testResults.details.push({ name: testName, status: 'PASS', result });
    console.log(colors.green(`✅ ${testName} - 通过`));
    return result;
  } catch (error) {
    testResults.failed++;
    testResults.details.push({ name: testName, status: 'FAIL', error: error.message });
    console.log(colors.red(`❌ ${testName} - 失败`));
    console.log(colors.red(`   错误: ${error.message}`));
    if (error.response?.status) {
      console.log(colors.yellow(`   状态码: ${error.response.status}`));
    }
    if (error.response?.data) {
      console.log(colors.yellow(`   响应: ${JSON.stringify(error.response.data, null, 2)}`));
    }
    return null;
  }
}

// 测试用例
async function testHealthCheck() {
  const response = await axios.get(`${BASE_URL}/api/health`, TEST_CONFIG);
  
  if (response.status !== 200) {
    throw new Error(`状态码错误: ${response.status}`);
  }
  
  console.log(colors.blue(`   状态: ${response.data.status || '未知'}`));
  console.log(colors.blue(`   API配置: ${response.data.dashscope_configured ? '已配置' : '未配置'}`));
  console.log(colors.blue(`   数据库: ${response.data.database_connected ? '已连接' : '未连接'}`));
  
  return response.data;
}

async function testDatabaseConnection() {
  const response = await axios.get(`${BASE_URL}/api/aitryon/stats`, TEST_CONFIG);
  
  if (response.status !== 200) {
    throw new Error(`状态码错误: ${response.status}`);
  }
  
  if (!response.data.success) {
    throw new Error(`获取失败: ${response.data.message}`);
  }
  
  const stats = response.data.data;
  console.log(colors.blue(`   总任务数: ${stats.total || 0}`));
  console.log(colors.blue(`   成功任务: ${stats.succeeded || 0}`));
  console.log(colors.blue(`   失败任务: ${stats.failed || 0}`));
  
  return stats;
}

async function testCreateUser() {
  const userData = {
    openid: `vercel_test_${Date.now()}`,
    nickname: 'Vercel测试用户',
    avatar_url: 'https://example.com/avatar.jpg'
  };
  
  const response = await axios.post(`${BASE_URL}/api/aitryon/user`, userData, TEST_CONFIG);
  
  if (response.status !== 200) {
    throw new Error(`状态码错误: ${response.status}`);
  }
  
  if (!response.data.success) {
    throw new Error(`创建失败: ${response.data.message}`);
  }
  
  console.log(colors.blue(`   用户ID: ${response.data.data.id}`));
  console.log(colors.blue(`   昵称: ${response.data.data.nickname}`));
  
  // 保存用户ID供其他测试使用
  global.testUserId = response.data.data.id;
  
  return response.data.data;
}

async function testGetCapabilities() {
  const response = await axios.get(`${BASE_URL}/api/aitryon/capabilities`, TEST_CONFIG);
  
  if (response.status !== 200) {
    throw new Error(`状态码错误: ${response.status}`);
  }
  
  if (!response.data.success) {
    throw new Error(`获取失败: ${response.data.message}`);
  }
  
  const capabilities = response.data.data;
  console.log(colors.blue(`   支持模式: ${capabilities.supported_modes.join(', ')}`));
  console.log(colors.blue(`   最大分辨率: ${capabilities.max_resolution}`));
  
  return capabilities;
}

async function testGetUserTasks() {
  if (!global.testUserId) {
    throw new Error('需要先创建用户');
  }
  
  const response = await axios.get(`${BASE_URL}/api/aitryon/user-tasks/${global.testUserId}`, TEST_CONFIG);
  
  if (response.status !== 200) {
    throw new Error(`状态码错误: ${response.status}`);
  }
  
  if (!response.data.success) {
    throw new Error(`获取失败: ${response.data.message}`);
  }
  
  const tasks = response.data.data.tasks;
  console.log(colors.blue(`   用户任务数: ${tasks.length}`));
  
  return tasks;
}

// 主测试函数
async function runAllTests() {
  console.log(colors.bold(colors.cyan('🚀 开始测试Vercel部署的API接口\n')));
  console.log(colors.yellow(`📡 测试URL: ${BASE_URL}`));
  console.log(colors.yellow(`⏰ 超时时间: ${TEST_CONFIG.timeout / 1000}秒\n`));
  
  // 运行所有测试
  await runTest('健康检查', testHealthCheck);
  await runTest('数据库连接', testDatabaseConnection);
  await runTest('创建用户', testCreateUser);
  await runTest('获取API能力', testGetCapabilities);
  await runTest('获取用户任务', testGetUserTasks);
  
  // 输出测试结果
  console.log(colors.bold(colors.cyan('\n📊 测试结果统计:')));
  console.log(colors.green(`✅ 通过: ${testResults.passed}/${testResults.total}`));
  console.log(colors.red(`❌ 失败: ${testResults.failed}/${testResults.total}`));
  
  if (testResults.failed === 0) {
    console.log(colors.bold(colors.green('\n🎉 所有测试通过！您的API部署成功！')));
    console.log(colors.cyan('\n📱 现在可以更新小程序配置:'));
    console.log(colors.yellow(`   baseUrl: '${BASE_URL}/api'`));
    console.log(colors.cyan('\n🔗 有用的链接:'));
    console.log(colors.blue(`   - API根路径: ${BASE_URL}`));
    console.log(colors.blue(`   - 健康检查: ${BASE_URL}/api/health`));
    console.log(colors.blue(`   - Vercel控制台: https://vercel.com/dashboard`));
  } else {
    console.log(colors.bold(colors.red('\n❌ 部分测试失败，请检查配置')));
    console.log(colors.yellow('\n🔍 失败的测试:'));
    testResults.details.filter(t => t.status === 'FAIL').forEach(test => {
      console.log(colors.red(`   - ${test.name}: ${test.error}`));
    });
    
    console.log(colors.cyan('\n💡 排查建议:'));
    console.log(colors.yellow('1. 检查Vercel环境变量是否正确设置'));
    console.log(colors.yellow('2. 检查数据库连接是否正常'));
    console.log(colors.yellow('3. 查看Vercel部署日志'));
    console.log(colors.yellow('4. 确认API密钥是否有效'));
  }
}

// 执行测试
if (require.main === module) {
  runAllTests().catch(error => {
    console.error(colors.red('\n💥 测试执行失败:'), error.message);
    process.exit(1);
  });
}

module.exports = { runAllTests, BASE_URL };
