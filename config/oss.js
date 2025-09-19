/**
 * 阿里云OSS配置文件
 */

require('dotenv').config();

const ossConfig = {
  region: process.env.OSS_REGION || 'oss-cn-beijing',
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  bucket: process.env.OSS_BUCKET || 'sunhe197428',
  // 自定义域名（如果有的话）
  endpoint: process.env.OSS_ENDPOINT || undefined,
  // 是否使用HTTPS
  secure: process.env.OSS_SECURE !== 'false',
  // 上传路径前缀
  uploadPath: process.env.OSS_UPLOAD_PATH || 'ai-fitting/',
  // CDN域名（如果配置了CDN）
  cdnDomain: process.env.OSS_CDN_DOMAIN || undefined
};

module.exports = ossConfig;
