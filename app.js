const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const { errorMiddleware } = require('./utils/errorHandler');
const { testConnection, initDatabase } = require('./config/database-init');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

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

// 文件上传配置
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// 引入路由
const aiTryonRoutes = require('./routes/aiTryon');

// 基本路由
app.get('/', (req, res) => {
  res.json({
    message: 'AI试衣服项目后端服务',
    version: '1.0.0',
    status: 'running',
    features: [
      'AI试衣功能',
      '文件上传',
      '任务状态查询'
    ]
  });
});

// API 路由
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    dashscope_configured: !!process.env.DASHSCOPE_API_KEY
  });
});

// AI试衣相关路由
app.use('/api/aitryon', aiTryonRoutes);

// 文件上传接口
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: '没有上传文件' 
      });
    }
    
    // 引入服务（避免循环依赖）
    const { ImageService } = require('./services');
    
    // 构建图片数据
    const imageData = {
      user_id: req.body.user_id || null, // 从请求中获取用户ID
      filename: req.file.filename,
      original_name: req.file.originalname,
      file_path: req.file.path,
      file_url: `/uploads/${req.file.filename}`,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      image_type: req.body.image_type || 'person', // 从请求中获取图片类型
      upload_source: 'miniprogram'
    };
    
    // 保存到数据库
    let imageRecord = null;
    try {
      imageRecord = await ImageService.saveImage(imageData);
    } catch (dbError) {
      console.warn('保存图片到数据库失败:', dbError.message);
      // 数据库保存失败不影响文件上传功能
    }
    
    res.json({
      success: true,
      message: '文件上传成功',
      data: {
        id: imageRecord ? imageRecord.id : null,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: `/uploads/${req.file.filename}`,
        fullUrl: `http://localhost:${PORT}/uploads/${req.file.filename}`
      }
    });
  } catch (error) {
    console.error('文件上传失败:', error);
    res.status(500).json({
      success: false,
      error: '文件上传失败',
      message: error.message
    });
  }
});

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'NotFound',
    message: '接口不存在',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// 统一错误处理中间件
app.use(errorMiddleware);

// 启动服务器
async function startServer() {
  try {
    // 测试数据库连接
    const dbConnected = await testConnection();
    
    if (dbConnected) {
      // 初始化数据库表
      await initDatabase();
    }
    
    // 启动HTTP服务器
    app.listen(PORT, () => {
      console.log('🚀 AI试衣服务启动成功！');
      console.log(`📍 服务地址: http://localhost:${PORT}`);
      console.log(`🏥 健康检查: http://localhost:${PORT}/api/health`);
      console.log(`📚 API文档: 查看 API_DOCS.md`);
      console.log(`🔑 DashScope配置状态: ${process.env.DASHSCOPE_API_KEY ? '✅ 已配置' : '❌ 未配置'}`);
      console.log(`🗄️ 数据库状态: ${dbConnected ? '✅ 已连接' : '❌ 连接失败'}`);
      
      if (!process.env.DASHSCOPE_API_KEY) {
        console.log('⚠️  请配置 DASHSCOPE_API_KEY 环境变量以使用AI试衣功能');
      }
      
      if (!dbConnected) {
        console.log('⚠️  数据库连接失败，部分功能可能无法正常使用');
      }
    });
  } catch (error) {
    console.error('❌ 服务启动失败:', error.message);
    process.exit(1);
  }
}

// 启动服务
startServer();

module.exports = app;
