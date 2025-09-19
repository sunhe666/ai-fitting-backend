// 配置示例文件
module.exports = {
  // 服务器配置
  port: process.env.PORT || 3000,
  
  // 阿里云百炼API配置
  dashscope: {
    apiKey: process.env.DASHSCOPE_API_KEY || 'sk-your-api-key-here',
    baseUrl: process.env.DASHSCOPE_API_BASE || 'https://dashscope.aliyuncs.com',
    model: 'aitryon-plus'
  },
  
  // 数据库配置
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'ai_tryClothes'
  },
  
  // 文件上传配置
  upload: {
    maxFileSize: process.env.MAX_FILE_SIZE || '50mb',
    uploadDir: process.env.UPLOAD_DIR || 'uploads'
  },
  
  // API配置
  api: {
    prefix: process.env.API_PREFIX || '/api'
  }
};
