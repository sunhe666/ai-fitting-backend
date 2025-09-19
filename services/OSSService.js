/**
 * 阿里云OSS文件存储服务
 */

const OSS = require('ali-oss');
const path = require('path');
const crypto = require('crypto');
const ossConfig = require('../config/oss');

class OSSService {
  constructor() {
    this.client = new OSS({
      region: ossConfig.region,
      accessKeyId: ossConfig.accessKeyId,
      accessKeySecret: ossConfig.accessKeySecret,
      bucket: ossConfig.bucket,
      secure: ossConfig.secure
    });
  }

  /**
   * 上传文件到OSS
   * @param {Buffer} buffer - 文件Buffer
   * @param {string} originalname - 原始文件名
   * @param {string} mimetype - 文件MIME类型
   * @param {string} imageType - 图片类型（person, top_garment, bottom_garment等）
   * @returns {Object} 上传结果
   */
  async uploadFile(buffer, originalname, mimetype, imageType = 'general') {
    try {
      // 生成唯一文件名
      const timestamp = Date.now();
      const randomStr = crypto.randomBytes(8).toString('hex');
      const ext = path.extname(originalname);
      const filename = `${imageType}_${timestamp}_${randomStr}${ext}`;
      
      // 构建OSS路径
      const ossPath = `${ossConfig.uploadPath}${filename}`;
      
      // 上传到OSS
      const result = await this.client.put(ossPath, buffer, {
        headers: {
          'Content-Type': mimetype,
          'Cache-Control': 'public, max-age=31536000', // 缓存1年
        }
      });
      
      // 构建访问URL
      let fileUrl = result.url;
      
      // 如果配置了CDN域名，使用CDN URL
      if (ossConfig.cdnDomain) {
        fileUrl = `${ossConfig.cdnDomain}/${ossPath}`;
      }
      
      // 确保使用HTTPS
      if (fileUrl.startsWith('http://')) {
        fileUrl = fileUrl.replace('http://', 'https://');
      }
      
      console.log(`✅ 文件上传到OSS成功: ${ossPath}`);
      
      return {
        success: true,
        data: {
          filename: filename,
          originalname: originalname,
          ossPath: ossPath,
          url: fileUrl,
          fullUrl: fileUrl,
          size: buffer.length,
          mimetype: mimetype,
          bucket: ossConfig.bucket,
          region: ossConfig.region
        }
      };
      
    } catch (error) {
      console.error('OSS上传失败:', error);
      throw new Error(`OSS上传失败: ${error.message}`);
    }
  }

  /**
   * 删除OSS文件
   * @param {string} ossPath - OSS文件路径
   * @returns {boolean} 删除结果
   */
  async deleteFile(ossPath) {
    try {
      await this.client.delete(ossPath);
      console.log(`✅ OSS文件删除成功: ${ossPath}`);
      return true;
    } catch (error) {
      console.error('OSS删除失败:', error);
      throw new Error(`OSS删除失败: ${error.message}`);
    }
  }

  /**
   * 批量删除OSS文件
   * @param {Array} ossPaths - OSS文件路径数组
   * @returns {Object} 删除结果
   */
  async deleteFiles(ossPaths) {
    try {
      if (!Array.isArray(ossPaths) || ossPaths.length === 0) {
        throw new Error('文件路径列表不能为空');
      }
      
      const result = await this.client.deleteMulti(ossPaths);
      
      console.log(`✅ 批量删除OSS文件成功: ${ossPaths.length}个文件`);
      
      return {
        deleted: result.deleted ? result.deleted.length : 0,
        errors: result.errors || []
      };
    } catch (error) {
      console.error('OSS批量删除失败:', error);
      throw new Error(`OSS批量删除失败: ${error.message}`);
    }
  }

  /**
   * 获取文件信息
   * @param {string} ossPath - OSS文件路径
   * @returns {Object} 文件信息
   */
  async getFileInfo(ossPath) {
    try {
      const result = await this.client.head(ossPath);
      
      return {
        size: parseInt(result.res.headers['content-length']),
        mimetype: result.res.headers['content-type'],
        lastModified: result.res.headers['last-modified'],
        etag: result.res.headers.etag
      };
    } catch (error) {
      console.error('获取OSS文件信息失败:', error);
      throw new Error(`获取OSS文件信息失败: ${error.message}`);
    }
  }

  /**
   * 生成临时访问URL
   * @param {string} ossPath - OSS文件路径
   * @param {number} expires - 过期时间（秒，默认1小时）
   * @returns {string} 临时URL
   */
  async getSignedUrl(ossPath, expires = 3600) {
    try {
      const url = this.client.signatureUrl(ossPath, {
        expires: expires
      });
      
      return url;
    } catch (error) {
      console.error('生成OSS签名URL失败:', error);
      throw new Error(`生成OSS签名URL失败: ${error.message}`);
    }
  }

  /**
   * 检查OSS连接状态
   * @returns {boolean} 连接状态
   */
  async checkConnection() {
    try {
      await this.client.getBucketInfo();
      console.log('✅ OSS连接正常');
      return true;
    } catch (error) {
      console.error('❌ OSS连接失败:', error.message);
      return false;
    }
  }
}

module.exports = new OSSService();
