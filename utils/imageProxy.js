/**
 * 图片代理工具 - 解决阿里云API无法访问localhost的问题
 */
const fs = require('fs');
const path = require('path');

/**
 * 将本地图片转换为Base64格式
 * @param {string} filePath - 本地文件路径
 * @returns {string} - Base64格式的图片数据
 */
function imageToBase64(filePath) {
  try {
    const fullPath = path.resolve(filePath);
    const imageBuffer = fs.readFileSync(fullPath);
    const base64String = imageBuffer.toString('base64');
    
    // 获取文件扩展名来确定MIME类型
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.bmp': 'image/bmp',
      '.webp': 'image/webp'
    };
    
    const mimeType = mimeTypes[ext] || 'image/jpeg';
    return `data:${mimeType};base64,${base64String}`;
  } catch (error) {
    throw new Error(`无法读取图片文件: ${error.message}`);
  }
}

/**
 * 检查URL是否为本地地址
 * @param {string} url - 图片URL
 * @returns {boolean} - 是否为本地地址
 */
function isLocalUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  return url.includes('localhost') || 
         url.includes('127.0.0.1') || 
         url.startsWith('http://192.168.') ||
         url.startsWith('http://10.') ||
         url.startsWith('http://172.');
}

/**
 * 从URL获取本地文件路径
 * @param {string} url - 图片URL
 * @returns {string} - 本地文件路径
 */
function getLocalPathFromUrl(url) {
  try {
    const urlObj = new URL(url);
    // 假设URL格式为 http://localhost:3000/uploads/filename
    const pathname = urlObj.pathname;
    
    if (pathname.startsWith('/uploads/')) {
      return path.join(__dirname, '..', 'uploads', path.basename(pathname));
    }
    
    throw new Error('不支持的URL格式');
  } catch (error) {
    throw new Error(`无法解析URL: ${error.message}`);
  }
}

/**
 * 处理图片URL，将本地URL转换为Base64
 * @param {string} imageUrl - 原始图片URL
 * @returns {string} - 处理后的图片URL或Base64
 */
function processImageUrl(imageUrl) {
  if (!imageUrl) return imageUrl;
  
  if (isLocalUrl(imageUrl)) {
    console.log('检测到本地图片URL，转换为Base64:', imageUrl);
    try {
      const localPath = getLocalPathFromUrl(imageUrl);
      return imageToBase64(localPath);
    } catch (error) {
      console.error('转换Base64失败:', error.message);
      throw error;
    }
  }
  
  return imageUrl;
}

/**
 * 上传图片到临时在线服务（示例实现）
 * 注意：这只是示例，实际使用时需要配置真实的图床服务
 */
async function uploadToImageHost(filePath) {
  // 这里应该实现真实的图床上传逻辑
  // 例如上传到七牛云、阿里云OSS、腾讯云COS等
  
  console.warn('警告：uploadToImageHost 需要实现真实的图床服务');
  
  // 临时返回原URL（实际使用时请替换为真实实现）
  return null;
}

module.exports = {
  imageToBase64,
  isLocalUrl,
  getLocalPathFromUrl,
  processImageUrl,
  uploadToImageHost
};
