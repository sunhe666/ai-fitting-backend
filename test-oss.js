#!/usr/bin/env node
/**
 * 测试阿里云OSS连接和上传功能
 */

const OSSService = require('./services/OSSService');
const fs = require('fs');
const path = require('path');

async function testOSS() {
  console.log('🗄️ 测试阿里云OSS连接...\n');
  
  try {
    // 1. 测试OSS连接
    console.log('1. 测试OSS连接...');
    const connected = await OSSService.checkConnection();
    
    if (!connected) {
      throw new Error('OSS连接失败');
    }
    
    // 2. 创建测试文件
    console.log('\n2. 创建测试文件...');
    const testContent = Buffer.from('这是一个OSS上传测试文件 - ' + new Date().toISOString());
    const testFilename = 'test.txt';
    
    // 3. 上传测试文件
    console.log('3. 上传测试文件...');
    const uploadResult = await OSSService.uploadFile(
      testContent,
      testFilename,
      'text/plain',
      'test'
    );
    
    console.log('✅ 文件上传成功！');
    console.log(`📁 文件名: ${uploadResult.data.filename}`);
    console.log(`🔗 访问URL: ${uploadResult.data.url}`);
    console.log(`📍 OSS路径: ${uploadResult.data.ossPath}`);
    console.log(`🪣 存储桶: ${uploadResult.data.bucket}`);
    
    // 4. 获取文件信息
    console.log('\n4. 获取文件信息...');
    const fileInfo = await OSSService.getFileInfo(uploadResult.data.ossPath);
    console.log(`📊 文件大小: ${fileInfo.size} bytes`);
    console.log(`📋 MIME类型: ${fileInfo.mimetype}`);
    
    // 5. 生成临时访问URL
    console.log('\n5. 生成临时访问URL...');
    const signedUrl = await OSSService.getSignedUrl(uploadResult.data.ossPath, 300); // 5分钟有效
    console.log(`🔐 临时URL: ${signedUrl.substring(0, 100)}...`);
    
    // 6. 清理测试文件
    console.log('\n6. 清理测试文件...');
    await OSSService.deleteFile(uploadResult.data.ossPath);
    console.log('✅ 测试文件已删除');
    
    console.log('\n🎉 OSS测试完成！所有功能正常！');
    
  } catch (error) {
    console.error('❌ OSS测试失败:', error.message);
    
    if (error.code === 'InvalidAccessKeyId') {
      console.log('💡 提示: AccessKeyId无效，请检查配置');
    } else if (error.code === 'SignatureDoesNotMatch') {
      console.log('💡 提示: AccessKeySecret错误，请检查配置');
    } else if (error.code === 'NoSuchBucket') {
      console.log('💡 提示: 存储桶不存在，请检查bucket名称');
    }
    
    process.exit(1);
  }
}

// 执行测试
testOSS();
