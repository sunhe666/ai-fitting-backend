/**
 * 试衣服务
 * 处理试衣任务相关的业务逻辑
 */

const { TryonTask } = require('../models');
const ImageService = require('./ImageService');
const UserService = require('./UserService');

class TryonService {
  /**
   * 创建试衣任务
   * @param {Object} taskData - 任务数据
   * @returns {Object} 任务记录
   */
  async createTask(taskData) {
    try {
      const {
        task_id,
        user_id,
        person_image_url,
        top_garment_url,
        bottom_garment_url,
        tryon_mode,
        resolution = -1,
        restore_face = true,
        request_id
      } = taskData;
      
      // 尝试关联图片记录
      const person_image_id = await this.findImageIdFromUrl(person_image_url, 'person', user_id);
      const top_garment_image_id = top_garment_url ? 
        await this.findImageIdFromUrl(top_garment_url, 'top_garment', user_id) : null;
      const bottom_garment_image_id = bottom_garment_url ? 
        await this.findImageIdFromUrl(bottom_garment_url, 'bottom_garment', user_id) : null;
      
      const task = await TryonTask.create({
        task_id,
        user_id,
        person_image_id,
        person_image_url,
        top_garment_image_id,
        top_garment_url,
        bottom_garment_image_id,
        bottom_garment_url,
        tryon_mode,
        resolution,
        restore_face,
        task_status: 'PENDING',
        submit_time: new Date(),
        request_id
      });
      
      return task;
    } catch (error) {
      console.error('创建试衣任务失败:', error);
      throw new Error(`创建试衣任务失败: ${error.message}`);
    }
  }
  
  /**
   * 根据任务ID获取任务
   * @param {string} taskId - 任务ID
   * @returns {Object} 任务数据
   */
  async getTaskById(taskId) {
    try {
      const task = await TryonTask.findOne({
        where: { task_id: taskId },
        include: [
          {
            model: require('../models').User,
            as: 'user',
            attributes: ['id', 'nickname', 'avatar_url']
          }
        ]
      });
      
      if (!task) {
        throw new Error('任务不存在');
      }
      
      return task;
    } catch (error) {
      console.error('获取任务失败:', error);
      throw new Error(`获取任务失败: ${error.message}`);
    }
  }
  
  /**
   * 更新任务状态
   * @param {string} taskId - 任务ID
   * @param {Object} updateData - 更新数据
   * @returns {Object} 更新后的任务
   */
  async updateTaskStatus(taskId, updateData) {
    try {
      const task = await TryonTask.findOne({
        where: { task_id: taskId }
      });
      
      if (!task) {
        throw new Error('任务不存在');
      }
      
      // 处理时间字段
      const updates = { ...updateData };
      if (updateData.task_status) {
        switch (updateData.task_status) {
          case 'RUNNING':
            updates.start_time = new Date();
            break;
          case 'SUCCEEDED':
          case 'FAILED':
            updates.end_time = new Date();
            break;
        }
      }
      
      // 如果有结果图片URL，尝试创建图片记录
      if (updateData.result_image_url) {
        const resultImageId = await this.findImageIdFromUrl(
          updateData.result_image_url, 
          'result', 
          task.user_id
        );
        if (resultImageId) {
          updates.result_image_id = resultImageId;
        }
      }
      
      await task.update(updates);
      
      // 如果任务完成，创建历史记录
      if (updates.task_status === 'SUCCEEDED') {
        await this.createHistoryRecord(task);
      }
      
      return task;
    } catch (error) {
      console.error('更新任务状态失败:', error);
      throw new Error(`更新任务状态失败: ${error.message}`);
    }
  }
  
  /**
   * 获取用户的试衣任务列表
   * @param {number} userId - 用户ID
   * @param {Object} options - 查询选项
   * @returns {Object} 任务列表
   */
  async getUserTasks(userId, options = {}) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status = null,
        mode = null 
      } = options;
      const offset = (page - 1) * limit;
      
      const whereClause = { user_id: userId };
      if (status) whereClause.task_status = status;
      if (mode) whereClause.tryon_mode = mode;
      
      const { rows: tasks, count: total } = await TryonTask.findAndCountAll({
        where: whereClause,
        order: [['created_at', 'DESC']],
        limit,
        offset
      });
      
      return {
        tasks,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('获取用户任务列表失败:', error);
      throw new Error(`获取用户任务列表失败: ${error.message}`);
    }
  }
  
  /**
   * 获取任务统计信息
   * @param {number} userId - 用户ID（可选）
   * @returns {Object} 统计信息
   */
  async getTaskStats(userId = null) {
    try {
      const whereClause = userId ? { user_id: userId } : {};
      
      const stats = await TryonTask.findAll({
        where: whereClause,
        attributes: [
          'task_status',
          [require('sequelize').fn('COUNT', '*'), 'count']
        ],
        group: ['task_status']
      });
      
      const result = {
        total: 0,
        pending: 0,
        processing: 0,
        succeeded: 0,
        failed: 0
      };
      
      stats.forEach(stat => {
        const count = parseInt(stat.dataValues.count);
        result.total += count;
        
        switch (stat.task_status) {
          case 'PENDING':
            result.pending += count;
            break;
          case 'PRE-PROCESSING':
          case 'RUNNING':
          case 'POST-PROCESSING':
            result.processing += count;
            break;
          case 'SUCCEEDED':
            result.succeeded += count;
            break;
          case 'FAILED':
            result.failed += count;
            break;
        }
      });
      
      return result;
    } catch (error) {
      console.error('获取任务统计失败:', error);
      throw new Error(`获取任务统计失败: ${error.message}`);
    }
  }
  
  /**
   * 从URL查找图片ID
   * @param {string} imageUrl - 图片URL
   * @param {string} imageType - 图片类型
   * @param {number} userId - 用户ID
   * @returns {number|null} 图片ID
   */
  async findImageIdFromUrl(imageUrl, imageType, userId) {
    try {
      if (!imageUrl) return null;
      
      const image = await ImageService.findOrCreateImageFromUrl(imageUrl, imageType, userId);
      return image ? image.id : null;
    } catch (error) {
      console.warn('查找图片ID失败:', error.message);
      return null;
    }
  }
  
  /**
   * 创建历史记录
   * @param {Object} task - 任务对象
   * @returns {Object} 历史记录
   */
  async createHistoryRecord(task) {
    try {
      const { UserTryonHistory } = require('../models');
      
      // 计算处理时间
      let processingTime = null;
      if (task.submit_time && task.end_time) {
        processingTime = Math.floor((new Date(task.end_time) - new Date(task.submit_time)) / 1000);
      }
      
      // 构建服装图片URL（优先显示第一个）
      let garmentImageUrl = task.top_garment_url || task.bottom_garment_url;
      if (task.top_garment_url && task.bottom_garment_url) {
        // 如果是套装，可以考虑拼接或选择主要的
        garmentImageUrl = task.top_garment_url;
      }
      
      const history = await UserTryonHistory.create({
        user_id: task.user_id,
        task_id: task.id,
        tryon_mode: task.tryon_mode,
        person_image_url: task.person_image_url,
        garment_image_url: garmentImageUrl,
        result_image_url: task.result_image_url,
        is_successful: task.task_status === 'SUCCEEDED',
        processing_time: processingTime
      });
      
      return history;
    } catch (error) {
      console.error('创建历史记录失败:', error);
      // 不抛出错误，避免影响主流程
      return null;
    }
  }
  
  /**
   * 删除试衣任务
   * @param {string} taskId - 任务ID
   * @param {number} userId - 用户ID（用于权限检查）
   * @returns {boolean} 删除结果
   */
  async deleteTask(taskId, userId) {
    try {
      // 首先检查任务是否存在且属于该用户
      const task = await TryonTask.findOne({
        where: {
          task_id: taskId,
          user_id: userId
        }
      });
      
      if (!task) {
        throw new Error('任务不存在或无权限删除');
      }
      
      // 删除任务
      const deletedCount = await TryonTask.destroy({
        where: {
          task_id: taskId,
          user_id: userId
        }
      });
      
      if (deletedCount > 0) {
        console.log(`成功删除任务: ${taskId}`);
        return true;
      } else {
        throw new Error('删除任务失败');
      }
    } catch (error) {
      console.error('删除任务失败:', error);
      throw new Error(`删除任务失败: ${error.message}`);
    }
  }

  /**
   * 批量删除试衣任务
   * @param {Array} taskIds - 任务ID数组
   * @param {number} userId - 用户ID（用于权限检查）
   * @returns {Object} 删除结果统计
   */
  async deleteTasks(taskIds, userId) {
    try {
      if (!Array.isArray(taskIds) || taskIds.length === 0) {
        throw new Error('任务ID列表不能为空');
      }
      
      // 检查所有任务是否都属于该用户
      const tasks = await TryonTask.findAll({
        where: {
          task_id: taskIds,
          user_id: userId
        }
      });
      
      const existingTaskIds = tasks.map(task => task.task_id);
      const notFoundTaskIds = taskIds.filter(id => !existingTaskIds.includes(id));
      
      if (notFoundTaskIds.length > 0) {
        console.warn(`以下任务不存在或无权限删除: ${notFoundTaskIds.join(', ')}`);
      }
      
      // 删除存在的任务
      const deletedCount = await TryonTask.destroy({
        where: {
          task_id: existingTaskIds,
          user_id: userId
        }
      });
      
      console.log(`批量删除了 ${deletedCount} 个任务`);
      
      return {
        deleted: deletedCount,
        notFound: notFoundTaskIds.length,
        notFoundTaskIds
      };
    } catch (error) {
      console.error('批量删除任务失败:', error);
      throw new Error(`批量删除任务失败: ${error.message}`);
    }
  }

  /**
   * 删除过期任务
   * @param {number} days - 保留天数
   * @returns {number} 删除数量
   */
  async cleanupExpiredTasks(days = 7) {
    try {
      const expireDate = new Date();
      expireDate.setDate(expireDate.getDate() - days);
      
      const deletedCount = await TryonTask.destroy({
        where: {
          created_at: {
            [require('sequelize').Op.lt]: expireDate
          },
          task_status: ['FAILED', 'SUCCEEDED']
        }
      });
      
      console.log(`清理了 ${deletedCount} 个过期任务`);
      return deletedCount;
    } catch (error) {
      console.error('清理过期任务失败:', error);
      throw new Error(`清理过期任务失败: ${error.message}`);
    }
  }
}

module.exports = new TryonService();
