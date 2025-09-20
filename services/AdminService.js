/**
 * 管理员服务
 * 处理管理员相关的业务逻辑
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Admin, AdminLog } = require('../models');
const { Op } = require('sequelize');

class AdminService {
  /**
   * 管理员登录
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @param {string} ipAddress - IP地址
   * @returns {Object} 登录结果
   */
  async login(username, password, ipAddress = null) {
    try {
      // 查找管理员
      const admin = await Admin.findOne({
        where: { 
          username,
          status: 1 // 只查找正常状态的管理员
        }
      });

      if (!admin) {
        throw new Error('用户名或密码错误');
      }

      // 验证密码
      const isValidPassword = await bcrypt.compare(password, admin.password);
      if (!isValidPassword) {
        // 记录登录失败日志
        await this.createLog({
          admin_id: admin.id,
          admin_username: admin.username,
          action: 'LOGIN_FAILED',
          resource: 'auth',
          ip_address: ipAddress,
          response_status: 401,
          response_message: '密码错误'
        });
        
        throw new Error('用户名或密码错误');
      }

      // 更新最后登录时间和IP
      await admin.update({
        last_login_at: new Date(),
        last_login_ip: ipAddress
      });

      // 生成JWT token
      const token = jwt.sign(
        { 
          id: admin.id, 
          username: admin.username, 
          role: admin.role 
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      // 记录登录成功日志
      await this.createLog({
        admin_id: admin.id,
        admin_username: admin.username,
        action: 'LOGIN_SUCCESS',
        resource: 'auth',
        ip_address: ipAddress,
        response_status: 200,
        response_message: '登录成功'
      });

      // 返回用户信息（不包含密码）
      const adminData = admin.toJSON();
      delete adminData.password;

      return {
        admin: adminData,
        token
      };
    } catch (error) {
      console.error('管理员登录失败:', error);
      throw new Error(`登录失败: ${error.message}`);
    }
  }

  /**
   * 创建管理员
   * @param {Object} adminData - 管理员数据
   * @param {number} createdBy - 创建者ID
   * @returns {Object} 创建的管理员
   */
  async createAdmin(adminData, createdBy = null) {
    try {
      const {
        username,
        password,
        real_name,
        email,
        phone,
        role = 'operator',
        permissions = {},
        status = 1
      } = adminData;

      // 检查用户名是否已存在
      const existingAdmin = await Admin.findOne({
        where: { username }
      });

      if (existingAdmin) {
        throw new Error('用户名已存在');
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(password, 10);

      // 创建管理员
      const admin = await Admin.create({
        username,
        password: hashedPassword,
        real_name,
        email,
        phone,
        role,
        permissions,
        status,
        created_by: createdBy
      });

      // 记录创建日志
      if (createdBy) {
        const creator = await Admin.findByPk(createdBy);
        await this.createLog({
          admin_id: createdBy,
          admin_username: creator?.username,
          action: 'CREATE_ADMIN',
          resource: 'admin',
          resource_id: admin.id.toString(),
          response_status: 200,
          response_message: `创建管理员: ${username}`
        });
      }

      // 返回管理员信息（不包含密码）
      const result = admin.toJSON();
      delete result.password;
      return result;
    } catch (error) {
      console.error('创建管理员失败:', error);
      throw new Error(`创建管理员失败: ${error.message}`);
    }
  }

  /**
   * 获取管理员列表
   * @param {Object} options - 查询选项
   * @returns {Object} 管理员列表
   */
  async getAdminList(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        role = null,
        status = null,
        keyword = null
      } = options;
      const offset = (page - 1) * limit;

      const whereClause = {};
      if (role) whereClause.role = role;
      if (status !== null) whereClause.status = status;
      if (keyword) {
        whereClause[Op.or] = [
          { username: { [Op.like]: `%${keyword}%` } },
          { real_name: { [Op.like]: `%${keyword}%` } },
          { email: { [Op.like]: `%${keyword}%` } }
        ];
      }

      const { rows: admins, count: total } = await Admin.findAndCountAll({
        where: whereClause,
        attributes: { exclude: ['password'] }, // 不返回密码字段
        order: [['created_at', 'DESC']],
        limit,
        offset
      });

      return {
        admins,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('获取管理员列表失败:', error);
      throw new Error(`获取管理员列表失败: ${error.message}`);
    }
  }

  /**
   * 获取管理员详情
   * @param {number} adminId - 管理员ID
   * @returns {Object} 管理员详情
   */
  async getAdminById(adminId) {
    try {
      const admin = await Admin.findByPk(adminId, {
        attributes: { exclude: ['password'] },
        include: [
          {
            model: AdminLog,
            as: 'logs',
            limit: 10,
            order: [['created_at', 'DESC']]
          }
        ]
      });

      if (!admin) {
        throw new Error('管理员不存在');
      }

      return admin;
    } catch (error) {
      console.error('获取管理员详情失败:', error);
      throw new Error(`获取管理员详情失败: ${error.message}`);
    }
  }

  /**
   * 更新管理员信息
   * @param {number} adminId - 管理员ID
   * @param {Object} updateData - 更新数据
   * @param {number} updatedBy - 更新者ID
   * @returns {Object} 更新后的管理员
   */
  async updateAdmin(adminId, updateData, updatedBy = null) {
    try {
      const admin = await Admin.findByPk(adminId);
      if (!admin) {
        throw new Error('管理员不存在');
      }

      // 如果更新密码，需要加密
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }

      // 更新管理员信息
      await admin.update(updateData);

      // 记录更新日志
      if (updatedBy) {
        const updater = await Admin.findByPk(updatedBy);
        await this.createLog({
          admin_id: updatedBy,
          admin_username: updater?.username,
          action: 'UPDATE_ADMIN',
          resource: 'admin',
          resource_id: adminId.toString(),
          request_data: { ...updateData, password: updateData.password ? '***' : undefined },
          response_status: 200,
          response_message: `更新管理员: ${admin.username}`
        });
      }

      // 返回更新后的管理员信息（不包含密码）
      const result = admin.toJSON();
      delete result.password;
      return result;
    } catch (error) {
      console.error('更新管理员失败:', error);
      throw new Error(`更新管理员失败: ${error.message}`);
    }
  }

  /**
   * 删除管理员
   * @param {number} adminId - 管理员ID
   * @param {number} deletedBy - 删除者ID
   * @returns {boolean} 删除结果
   */
  async deleteAdmin(adminId, deletedBy = null) {
    try {
      const admin = await Admin.findByPk(adminId);
      if (!admin) {
        throw new Error('管理员不存在');
      }

      // 不能删除超级管理员
      if (admin.role === 'super_admin') {
        throw new Error('不能删除超级管理员');
      }

      // 不能删除自己
      if (adminId === deletedBy) {
        throw new Error('不能删除自己');
      }

      // 软删除：更新状态为禁用
      await admin.update({ status: 0 });

      // 记录删除日志
      if (deletedBy) {
        const deleter = await Admin.findByPk(deletedBy);
        await this.createLog({
          admin_id: deletedBy,
          admin_username: deleter?.username,
          action: 'DELETE_ADMIN',
          resource: 'admin',
          resource_id: adminId.toString(),
          response_status: 200,
          response_message: `删除管理员: ${admin.username}`
        });
      }

      return true;
    } catch (error) {
      console.error('删除管理员失败:', error);
      throw new Error(`删除管理员失败: ${error.message}`);
    }
  }

  /**
   * 创建操作日志
   * @param {Object} logData - 日志数据
   * @returns {Object} 日志记录
   */
  async createLog(logData) {
    try {
      return await AdminLog.create({
        ...logData,
        created_at: new Date()
      });
    } catch (error) {
      console.error('创建操作日志失败:', error);
      // 日志创建失败不应该影响主要业务流程
      return null;
    }
  }

  /**
   * 获取操作日志
   * @param {Object} options - 查询选项
   * @returns {Object} 日志列表
   */
  async getAdminLogs(options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        admin_id = null,
        action = null,
        resource = null,
        start_date = null,
        end_date = null
      } = options;
      const offset = (page - 1) * limit;

      const whereClause = {};
      if (admin_id) whereClause.admin_id = admin_id;
      if (action) whereClause.action = action;
      if (resource) whereClause.resource = resource;
      if (start_date && end_date) {
        whereClause.created_at = {
          [Op.between]: [new Date(start_date), new Date(end_date)]
        };
      }

      const { rows: logs, count: total } = await AdminLog.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Admin,
            as: 'admin',
            attributes: ['id', 'username', 'real_name']
          }
        ],
        order: [['created_at', 'DESC']],
        limit,
        offset
      });

      return {
        logs,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('获取操作日志失败:', error);
      throw new Error(`获取操作日志失败: ${error.message}`);
    }
  }

  /**
   * 验证JWT token
   * @param {string} token - JWT token
   * @returns {Object} 解码后的用户信息
   */
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      // 检查管理员是否还存在且状态正常
      const admin = await Admin.findOne({
        where: { 
          id: decoded.id,
          status: 1
        },
        attributes: { exclude: ['password'] }
      });

      if (!admin) {
        throw new Error('管理员账号不存在或已被禁用');
      }

      return admin;
    } catch (error) {
      console.error('Token验证失败:', error);
      throw new Error(`Token验证失败: ${error.message}`);
    }
  }

  /**
   * 检查权限
   * @param {Object} admin - 管理员对象
   * @param {string} resource - 资源名称
   * @param {string} action - 操作类型
   * @returns {boolean} 是否有权限
   */
  hasPermission(admin, resource, action) {
    try {
      // 超级管理员拥有所有权限
      if (admin.role === 'super_admin') {
        return true;
      }

      // 检查具体权限配置
      if (admin.permissions && admin.permissions[resource]) {
        return admin.permissions[resource][action] === true;
      }

      return false;
    } catch (error) {
      console.error('权限检查失败:', error);
      return false;
    }
  }
}

module.exports = new AdminService();
