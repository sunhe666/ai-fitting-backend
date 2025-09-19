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

    // 简单的数据库连接测试（不初始化表）
    if (process.env.DATABASE_URL) {
      try {
        const mysql = require('mysql2/promise');
        const connection = await mysql.createConnection(process.env.DATABASE_URL);
        await connection.ping();
        await connection.end();
        healthData.database_connected = true;
      } catch (dbError) {
        console.warn('数据库连接测试失败:', dbError.message);
        healthData.database_connected = false;
        healthData.database_error = dbError.message;
      }
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

// 文件上传路由（简化版）
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'NoFile',
        message: '没有上传文件'
      });
    }

    // 在Vercel环境中，文件存储在内存中
    // 需要上传到云存储服务（如阿里云OSS、腾讯云COS等）
    const fileInfo = {
      filename: `vercel-${Date.now()}-${req.file.originalname}`,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      buffer: req.file.buffer.toString('base64') // 转为base64
    };

    res.json({
      success: true,
      data: {
        file: fileInfo,
        url: `data:${req.file.mimetype};base64,${fileInfo.buffer}` // 临时base64 URL
      },
      message: '文件上传成功（Vercel环境）'
    });

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
