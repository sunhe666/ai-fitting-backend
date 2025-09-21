/**
 * Vercel专用的轻量级应用入口
 * 避免数据库初始化导致的超时问题
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const { errorMiddleware } = require('./utils/errorHandler');
const OSSService = require('./services/OSSService');
require('dotenv').config();

const app = express();

// 生产环境配置
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// 中间件配置
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 文件上传配置（简化版）
const storage = multer.memoryStorage(); // Vercel使用内存存储
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB限制
  }
});

// 基础路由
app.get('/', (req, res) => {
  res.json({
    message: 'AI试衣服项目后端服务',
    version: '1.0.0',
    status: 'running',
    environment: 'vercel',
    features: ['AI试衣功能', '文件上传', '任务状态查询']
  });
});

// 健康检查路由（简化版）
app.get('/api/health', async (req, res) => {
  try {
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: 'vercel',
      dashscope_configured: !!process.env.DASHSCOPE_API_KEY,
      database_configured: !!process.env.DATABASE_URL
    };

    // 数据库连接测试
    if (process.env.DATABASE_URL) {
      try {
        const mysql = require('mysql2/promise');
        const connection = await mysql.createConnection(process.env.DATABASE_URL);
        await connection.ping();
        await connection.end();
        healthData.database_connected = true;
        console.log('✅ 数据库连接测试成功');
      } catch (dbError) {
        console.warn('❌ 数据库连接测试失败:', dbError.message);
        healthData.database_connected = false;
        healthData.database_error = dbError.message;
      }
    } else {
      healthData.database_connected = false;
      healthData.database_error = 'DATABASE_URL未配置';
    }

    res.json(healthData);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API路由
app.use('/api/aitryon', require('./routes/aiTryon'));

// 后台管理路由
app.use('/api/admin', require('./routes/admin'));

// 文件上传路由（OSS版本）
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'NoFile',
        message: '没有上传文件'
      });
    }

    // 获取上传参数
    const imageType = req.body.image_type || 'general';
    const userId = req.body.user_id || 'anonymous';

    console.log(`📤 开始上传文件到OSS: ${req.file.originalname} (${req.file.size} bytes)`);

    // 上传到阿里云OSS
    const ossResult = await OSSService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      imageType
    );

    if (!ossResult.success) {
      throw new Error('OSS上传失败');
    }

    // 兼容原有API格式的响应
    const responseData = {
      success: true,
      data: {
        filename: ossResult.data.filename,
        originalname: ossResult.data.originalname,
        mimetype: ossResult.data.mimetype,
        size: ossResult.data.size,
        url: ossResult.data.url,
        fullUrl: ossResult.data.fullUrl,
        // OSS特有信息
        ossPath: ossResult.data.ossPath,
        bucket: ossResult.data.bucket,
        region: ossResult.data.region,
        // 保持向后兼容
        file: {
          filename: ossResult.data.filename,
          originalname: ossResult.data.originalname,
          mimetype: ossResult.data.mimetype,
          size: ossResult.data.size
        }
      },
      message: '文件上传成功'
    };

    console.log(`✅ 文件上传OSS成功: ${ossResult.data.url}`);
    res.json(responseData);

  } catch (error) {
    console.error('文件上传失败:', error);
    res.status(500).json({
      success: false,
      error: 'UploadError',
      message: error.message
    });
  }
});

// 错误处理中间件
app.use(errorMiddleware);

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'NotFound',
    message: `路径 ${req.originalUrl} 不存在`,
    available_endpoints: [
      'GET /',
      'GET /api/health',
      'POST /api/upload',
      'POST /api/aitryon/create-task',
      'GET /api/aitryon/task-status/:taskId'
    ]
  });
});

module.exports = app;
