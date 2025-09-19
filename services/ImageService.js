/**
 * 图片服务
 * 处理图片相关的业务逻辑
 */

const { Image } = require('../models');
const path = require('path');
const fs = require('fs').promises;

class ImageService {
  /**
   * 保存图片信息到数据库
   * @param {Object} imageData - 图片数据
   * @returns {Object} 图片记录
   */
  async saveImage(imageData) {
    try {
      const {
        user_id,
        filename,
        original_name,
        file_path,
        file_url,
        file_size,
        mime_type,
        width,
        height,
        image_type,
        upload_source = 'miniprogram'
      } = imageData;
      
      const image = await Image.create({
        user_id,
        filename,
        original_name,
        file_path,
        file_url,
        file_size,
        mime_type,
        width,
        height,
        image_type,
        upload_source,
        status: 1
      });
      
      return image;
    } catch (error) {
      console.error('保存图片失败:', error);
      throw new Error(`保存图片失败: ${error.message}`);
    }
  }
  
  /**
   * 根据ID获取图片
   * @param {number} imageId - 图片ID
   * @returns {Object} 图片数据
   */
  async getImageById(imageId) {
    try {
      const image = await Image.findByPk(imageId);
      if (!image || image.status === 0) {
        throw new Error('图片不存在');
      }
      return image;
    } catch (error) {
      console.error('获取图片失败:', error);
      throw new Error(`获取图片失败: ${error.message}`);
    }
  }
  
  /**
   * 根据文件名获取图片
   * @param {string} filename - 文件名
   * @returns {Object} 图片数据
   */
  async getImageByFilename(filename) {
    try {
      const image = await Image.findOne({
        where: { 
          filename,
          status: 1
        }
      });
      return image;
    } catch (error) {
      console.error('获取图片失败:', error);
      throw new Error(`获取图片失败: ${error.message}`);
    }
  }
  
  /**
   * 获取用户的图片列表
   * @param {number} userId - 用户ID
   * @param {string} imageType - 图片类型
   * @param {Object} options - 分页选项
   * @returns {Object} 图片列表
   */
  async getUserImages(userId, imageType = null, options = {}) {
    try {
      const { page = 1, limit = 20 } = options;
      const offset = (page - 1) * limit;
      
      const whereClause = {
        user_id: userId,
        status: 1
      };
      
      if (imageType) {
        whereClause.image_type = imageType;
      }
      
      const { rows: images, count: total } = await Image.findAndCountAll({
        where: whereClause,
        order: [['created_at', 'DESC']],
        limit,
        offset
      });
      
      return {
        images,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('获取用户图片列表失败:', error);
      throw new Error(`获取用户图片列表失败: ${error.message}`);
    }
  }
  
  /**
   * 从URL提取文件名
   * @param {string} imageUrl - 图片URL
   * @returns {string} 文件名
   */
  extractFilenameFromUrl(imageUrl) {
    try {
      if (!imageUrl) return null;
      
      // 处理本地URL: http://localhost:3000/uploads/filename.jpg
      if (imageUrl.includes('/uploads/')) {
        const urlParts = imageUrl.split('/uploads/');
        if (urlParts.length > 1) {
          return urlParts[1];
        }
      }
      
      // 处理其他URL格式
      const url = new URL(imageUrl);
      return path.basename(url.pathname);
    } catch (error) {
      console.error('提取文件名失败:', error);
      return null;
    }
  }
  
  /**
   * 根据URL获取或创建图片记录
   * @param {string} imageUrl - 图片URL
   * @param {string} imageType - 图片类型
   * @param {number} userId - 用户ID
   * @returns {Object} 图片记录
   */
  async findOrCreateImageFromUrl(imageUrl, imageType, userId = null) {
    try {
      const filename = this.extractFilenameFromUrl(imageUrl);
      if (!filename) {
        return null;
      }
      
      // 先尝试查找现有记录
      let image = await this.getImageByFilename(filename);
      
      if (!image) {
        // 如果是本地文件，尝试获取文件信息
        if (imageUrl.includes('/uploads/')) {
          const filePath = path.join(__dirname, '..', 'uploads', filename);
          
          try {
            const stats = await fs.stat(filePath);
            
            image = await this.saveImage({
              user_id: userId,
              filename,
              original_name: filename,
              file_path: filePath,
              file_url: imageUrl,
              file_size: stats.size,
              mime_type: this.getMimeTypeFromExtension(filename),
              image_type: imageType
            });
          } catch (fileError) {
            console.warn('无法获取文件信息:', fileError.message);
          }
        }
      }
      
      return image;
    } catch (error) {
      console.error('查找或创建图片记录失败:', error);
      return null;
    }
  }
  
  /**
   * 根据文件扩展名获取MIME类型
   * @param {string} filename - 文件名
   * @returns {string} MIME类型
   */
  getMimeTypeFromExtension(filename) {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.bmp': 'image/bmp',
      '.webp': 'image/webp',
      '.heic': 'image/heic'
    };
    return mimeTypes[ext] || 'image/jpeg';
  }
  
  /**
   * 软删除图片
   * @param {number} imageId - 图片ID
   * @returns {boolean} 删除结果
   */
  async deleteImage(imageId) {
    try {
      const image = await Image.findByPk(imageId);
      if (!image) {
        throw new Error('图片不存在');
      }
      
      await image.update({ status: 0 });
      return true;
    } catch (error) {
      console.error('删除图片失败:', error);
      throw new Error(`删除图片失败: ${error.message}`);
    }
  }
  
  /**
   * 清理过期图片
   * @param {number} days - 保留天数
   * @returns {number} 清理数量
   */
  async cleanupExpiredImages(days = 30) {
    try {
      const expireDate = new Date();
      expireDate.setDate(expireDate.getDate() - days);
      
      const [affectedRows] = await Image.update(
        { status: 0 },
        {
          where: {
            created_at: {
              [require('sequelize').Op.lt]: expireDate
            },
            status: 1
          }
        }
      );
      
      console.log(`清理了 ${affectedRows} 张过期图片`);
      return affectedRows;
    } catch (error) {
      console.error('清理过期图片失败:', error);
      throw new Error(`清理过期图片失败: ${error.message}`);
    }
  }
}

module.exports = new ImageService();
