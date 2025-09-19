/**
 * AI试衣API测试示例
 * 运行: node examples/test-api.js
 */

const axios = require('axios');

// 配置
const API_BASE = 'http://localhost:3000/api';

// 测试图片URL（示例，请替换为实际的公网可访问的图片URL）
const TEST_IMAGES = {
  person: 'https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20250626/ubznva/model_person.png',
  shirt: 'https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20250626/epousa/short_sleeve.jpeg',
  pants: 'https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20250626/rchumi/pants.jpeg',
  dress: 'https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20250626/odngby/dress.jpg'
};

/**
 * 测试健康检查接口
 */
async function testHealthCheck() {
  console.log('\n=== 测试健康检查接口 ===');
  try {
    const response = await axios.get(`${API_BASE}/health`);
    console.log('✅ 健康检查成功:', response.data);
    return true;
  } catch (error) {
    console.error('❌ 健康检查失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试模型能力查询接口
 */
async function testCapabilities() {
  console.log('\n=== 测试模型能力查询接口 ===');
  try {
    const response = await axios.get(`${API_BASE}/aitryon/capabilities`);
    console.log('✅ 模型能力查询成功:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ 模型能力查询失败:', error.response?.data || error.message);
    return false;
  }
}

/**
 * 测试创建试衣任务
 */
async function testCreateTask(testType = 'shirt') {
  console.log(`\n=== 测试创建试衣任务 (${testType}) ===`);
  
  let requestData = {
    person_image_url: TEST_IMAGES.person,
    resolution: -1,
    restore_face: true
  };

  // 根据测试类型设置不同的参数
  switch (testType) {
    case 'shirt':
      requestData.top_garment_url = TEST_IMAGES.shirt;
      console.log('测试类型: 试穿上装');
      break;
    case 'pants':
      requestData.bottom_garment_url = TEST_IMAGES.pants;
      console.log('测试类型: 试穿下装');
      break;
    case 'outfit':
      requestData.top_garment_url = TEST_IMAGES.shirt;
      requestData.bottom_garment_url = TEST_IMAGES.pants;
      console.log('测试类型: 试穿上下装组合');
      break;
    case 'dress':
      requestData.top_garment_url = TEST_IMAGES.dress;
      console.log('测试类型: 试穿连衣裙');
      break;
    default:
      requestData.top_garment_url = TEST_IMAGES.shirt;
  }

  try {
    console.log('请求参数:', JSON.stringify(requestData, null, 2));
    
    const response = await axios.post(`${API_BASE}/aitryon/create-task`, requestData);
    console.log('✅ 任务创建成功:', response.data);
    
    return response.data.data.task_id;
  } catch (error) {
    console.error('❌ 任务创建失败:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 测试查询任务状态
 */
async function testQueryTaskStatus(taskId) {
  console.log('\n=== 测试查询任务状态 ===');
  
  if (!taskId) {
    console.error('❌ 任务ID为空，跳过测试');
    return false;
  }

  try {
    const response = await axios.get(`${API_BASE}/aitryon/task-status/${taskId}`);
    console.log('✅ 任务状态查询成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 任务状态查询失败:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 测试轮询查询任务状态
 */
async function testPollTaskStatus(taskId) {
  console.log('\n=== 测试轮询查询任务状态 ===');
  
  if (!taskId) {
    console.error('❌ 任务ID为空，跳过测试');
    return false;
  }

  try {
    console.log('开始轮询查询，请耐心等待...');
    const response = await axios.get(`${API_BASE}/aitryon/poll-task/${taskId}`, {
      timeout: 120000 // 2分钟超时
    });
    
    console.log('✅ 轮询查询完成:', response.data);
    
    if (response.data.success && response.data.data.image_url) {
      console.log('🎉 试衣成功！结果图片URL:', response.data.data.image_url);
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ 轮询查询失败:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 测试参数验证
 */
async function testValidation() {
  console.log('\n=== 测试参数验证 ===');
  
  // 测试缺少必需参数
  try {
    const response = await axios.post(`${API_BASE}/aitryon/create-task`, {
      // 缺少 person_image_url
      top_garment_url: TEST_IMAGES.shirt
    });
    console.log('❌ 参数验证失败，应该返回错误');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ 参数验证正常，正确返回400错误:', error.response.data.message);
    } else {
      console.error('❌ 参数验证异常:', error.response?.data || error.message);
    }
  }

  // 测试无效URL
  try {
    const response = await axios.post(`${API_BASE}/aitryon/create-task`, {
      person_image_url: 'invalid-url',
      top_garment_url: TEST_IMAGES.shirt
    });
    console.log('❌ URL验证失败，应该返回错误');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ URL验证正常，正确返回400错误:', error.response.data.message);
    } else {
      console.error('❌ URL验证异常:', error.response?.data || error.message);
    }
  }
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log('🚀 开始AI试衣API测试');
  console.log('请确保服务已启动并配置了DASHSCOPE_API_KEY');
  
  // 1. 健康检查
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.error('❌ 服务不可用，停止测试');
    return;
  }

  // 2. 模型能力查询
  await testCapabilities();

  // 3. 参数验证测试
  await testValidation();

  // 4. 创建任务测试
  const taskId = await testCreateTask('shirt');
  
  if (taskId) {
    // 5. 查询任务状态
    await testQueryTaskStatus(taskId);
    
    // 6. 轮询查询任务状态（可选，耗时较长）
    const shouldPoll = process.argv.includes('--poll');
    if (shouldPoll) {
      await testPollTaskStatus(taskId);
    } else {
      console.log('\n💡 提示: 使用 --poll 参数可以测试轮询查询功能');
      console.log('   例如: node examples/test-api.js --poll');
    }
  }

  console.log('\n🎉 测试完成！');
}

// 运行测试
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testHealthCheck,
  testCapabilities,
  testCreateTask,
  testQueryTaskStatus,
  testPollTaskStatus,
  testValidation
};
