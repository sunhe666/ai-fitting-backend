/**
 * 用户服务
 * 处理用户相关的业务逻辑
 */

const { User } = require('../models');
const { Op } = require('sequelize');

class UserService {
  /**
   * 根据openid获取或创建用户
   * @param {Object} userInfo - 用户信息
   * @returns {Object} 用户数据
   */
  async findOrCreateUser(userInfo) {
    try {
      const { openid, unionid, nickname, avatar_url, gender, city, province, country, language } = userInfo;
      
      // 查找现有用户
      let user = await User.findOne({
        where: { openid }
      });
      
      if (user) {
        // 更新用户信息和最后登录时间
        await user.update({
          nickname: nickname || user.nickname,
          avatar_url: avatar_url || user.avatar_url,
          gender: gender !== undefined ? gender : user.gender,
          city: city || user.city,
          province: province || user.province,
          country: country || user.country,
          language: language || user.language,
          last_login_at: new Date()
        });
      } else {
        // 创建新用户
        user = await User.create({
          openid,
          unionid,
          nickname,
          avatar_url,
          gender: gender || 0,
          city,
          province,
          country,
          language: language || 'zh_CN',
          last_login_at: new Date(),
          status: 1
        });
      }
      
      return user;
    } catch (error) {
      console.error('用户服务错误:', error);
      throw new Error(`用户操作失败: ${error.message}`);
    }
  }
  
  /**
   * 根据ID获取用户
   * @param {number} userId - 用户ID
   * @returns {Object} 用户数据
   */
  async getUserById(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('用户不存在');
      }
      return user;
    } catch (error) {
      console.error('获取用户失败:', error);
      throw new Error(`获取用户失败: ${error.message}`);
    }
  }
  
  /**
   * 根据openid获取用户
   * @param {string} openid - 微信openid
   * @returns {Object} 用户数据
   */
  async getUserByOpenid(openid) {
    try {
      const user = await User.findOne({
        where: { openid }
      });
      return user;
    } catch (error) {
      console.error('获取用户失败:', error);
      throw new Error(`获取用户失败: ${error.message}`);
    }
  }
  
  /**
   * 更新用户信息
   * @param {number} userId - 用户ID
   * @param {Object} updateData - 更新数据
   * @returns {Object} 更新后的用户数据
   */
  async updateUser(userId, updateData) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('用户不存在');
      }
      
      await user.update(updateData);
      return user;
    } catch (error) {
      console.error('更新用户失败:', error);
      throw new Error(`更新用户失败: ${error.message}`);
    }
  }
  
  /**
   * 获取用户统计信息
   * @param {number} userId - 用户ID
   * @returns {Object} 统计信息
   */
  async getUserStats(userId) {
    try {
      const { TryonTask } = require('../models');
      
      const stats = await TryonTask.findAll({
        where: { user_id: userId },
        attributes: [
          'task_status',
          [require('sequelize').fn('COUNT', '*'), 'count']
        ],
        group: ['task_status']
      });
      
      const result = {
        total: 0,
        successful: 0,
        failed: 0,
        pending: 0
      };
      
      stats.forEach(stat => {
        const count = parseInt(stat.dataValues.count);
        result.total += count;
        
        if (stat.task_status === 'SUCCEEDED') {
          result.successful += count;
        } else if (stat.task_status === 'FAILED') {
          result.failed += count;
        } else if (['PENDING', 'RUNNING', 'PRE-PROCESSING', 'POST-PROCESSING'].includes(stat.task_status)) {
          result.pending += count;
        }
      });
      
      return result;
    } catch (error) {
      console.error('获取用户统计失败:', error);
      throw new Error(`获取用户统计失败: ${error.message}`);
    }
  }

  /**
   * 获取用户列表（管理员功能）
   * @param {Object} options - 查询选项
   * @returns {Object} 用户列表
   */
  async getUserList(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        status = null,
        keyword = null
      } = options;
      const offset = (page - 1) * limit;

      const whereClause = {};
      if (status !== null) whereClause.status = status;
      if (keyword) {
        whereClause[Op.or] = [
          { nickname: { [Op.like]: `%${keyword}%` } },
          { openid: { [Op.like]: `%${keyword}%` } }
        ];
      }

      const { rows: users, count: total } = await User.findAndCountAll({
        where: whereClause,
        order: [['created_at', 'DESC']],
        limit,
        offset
      });

      return {
        users,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('获取用户列表失败:', error);
      throw new Error(`获取用户列表失败: ${error.message}`);
    }
  }

  /**
   * 更新用户状态
   * @param {number} userId - 用户ID
   * @param {number} status - 状态
   * @returns {Object} 更新后的用户
   */
  async updateUserStatus(userId, status) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      await user.update({ status });
      return user;
    } catch (error) {
      console.error('更新用户状态失败:', error);
      throw new Error(`更新用户状态失败: ${error.message}`);
    }
  }
}

module.exports = new UserService();
