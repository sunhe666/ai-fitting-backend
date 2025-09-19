/**
 * 测试本地图片处理功能
 */
const axios = require('axios');

async function testLocalImageProcessing() {
  console.log('🧪 测试本地图片URL处理功能\n');

  const testData = {
    person_image_url: "http://localhost:3000/uploads/image-1758267385616-671364647.jpg",
    resolution: -1,
    restore_face: true,
    top_garment_url: "http://localhost:3000/uploads/image-1758267385639-799670096.jpg"
  };

  console.log('📤 发送测试请求:');
  console.log('URL:', 'http://localhost:3000/api/aitryon/create-task');
  console.log('参数:', JSON.stringify(testData, null, 2));
  console.log('');

  try {
    console.log('⏳ 正在发送请求...\n');
    
    const response = await axios.post(
      'http://localhost:3000/api/aitryon/create-task',
      testData,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('✅ 请求成功!');
    console.log('响应状态:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));

    if (response.data.success && response.data.data.task_id) {
      console.log('\n🎉 任务创建成功!');
      console.log('任务ID:', response.data.data.task_id);
      console.log('任务状态:', response.data.data.task_status);
      
      // 可选：查询任务状态
      console.log('\n⏳ 查询任务状态...');
      const taskId = response.data.data.task_id;
      
      try {
        const statusResponse = await axios.get(
          `http://localhost:3000/api/aitryon/task-status/${taskId}`
        );
        
        console.log('📊 任务状态查询结果:');
        console.log(JSON.stringify(statusResponse.data, null, 2));
      } catch (statusError) {
        console.error('❌ 查询任务状态失败:', statusError.response?.data || statusError.message);
      }
    }

  } catch (error) {
    console.error('❌ 请求失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.data.error === 'InvalidParameter.DataInspection') {
        console.log('\n💡 建议解决方案:');
        console.log('1. 检查图片文件是否存在且可访问');
        console.log('2. 确保图片格式正确 (JPG, PNG, BMP, HEIC)');
        console.log('3. 确保图片大小在 5KB-5MB 范围内');
        console.log('4. 确保图片分辨率在 150px-4096px 范围内');
        console.log('5. 考虑使用在线图片URL而非本地URL');
      }
    } else {
      console.error('网络错误:', error.message);
    }
  }
}

// 运行测试
if (require.main === module) {
  testLocalImageProcessing().catch(console.error);
}

module.exports = { testLocalImageProcessing };
