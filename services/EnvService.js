/**
 * 环境变量管理服务
 * 处理环境变量配置相关的业务逻辑
 */

const fs = require('fs').promises;
const path = require('path');
const { EnvConfig, EnvChangeHistory } = require('../models');
const { Op } = require('sequelize');

class EnvService {
  constructor() {
    this.envFilePath = path.join(__dirname, '../.env');
  }

  /**
   * 获取环境变量配置列表
   * @param {Object} options - 查询选项
   * @returns {Object} 配置列表
   */
  async getEnvConfigs(options = {}) {
    try {
      const {
        category = null,
        is_active = null,
        keyword = null
      } = options;

      const whereClause = {};
      if (category) whereClause.category = category;
      if (is_active !== null) whereClause.is_active = is_active;
      if (keyword) {
        whereClause[Op.or] = [
          { config_key: { [Op.like]: `%${keyword}%` } },
          { description: { [Op.like]: `%${keyword}%` } }
        ];
      }

      const configs = await EnvConfig.findAll({
        where: whereClause,
        order: [['category', 'ASC'], ['sort_order', 'ASC'], ['config_key', 'ASC']]
      });

      // 按分类分组
      const groupedConfigs = {};
      configs.forEach(config => {
        const configData = config.toJSON();
        
        // 敏感信息脱敏
        if (configData.is_sensitive && configData.config_value) {
          configData.config_value_masked = this.maskSensitiveValue(configData.config_value);
          configData.config_value = '***'; // 前端显示
        }
        
        if (!groupedConfigs[configData.category]) {
          groupedConfigs[configData.category] = [];
        }
        groupedConfigs[configData.category].push(configData);
      });

      return {
        configs: groupedConfigs,
        total: configs.length
      };
    } catch (error) {
      console.error('获取环境变量配置失败:', error);
      throw new Error(`获取环境变量配置失败: ${error.message}`);
    }
  }

  /**
   * 获取单个环境变量配置
   * @param {string} configKey - 配置键名
   * @returns {Object} 配置详情
   */
  async getEnvConfig(configKey) {
    try {
      const config = await EnvConfig.findOne({
        where: { config_key: configKey }
      });

      if (!config) {
        throw new Error('配置不存在');
      }

      const configData = config.toJSON();
      
      // 敏感信息脱敏
      if (configData.is_sensitive && configData.config_value) {
        configData.config_value_masked = this.maskSensitiveValue(configData.config_value);
        configData.config_value = '***';
      }

      return configData;
    } catch (error) {
      console.error('获取环境变量配置失败:', error);
      throw new Error(`获取环境变量配置失败: ${error.message}`);
    }
  }

  /**
   * 更新环境变量配置
   * @param {string} configKey - 配置键名
   * @param {string} configValue - 配置值
   * @param {Object} adminInfo - 管理员信息
   * @param {string} changeReason - 变更原因
   * @returns {Object} 更新结果
   */
  async updateEnvConfig(configKey, configValue, adminInfo, changeReason = '') {
    try {
      const config = await EnvConfig.findOne({
        where: { config_key: configKey }
      });

      if (!config) {
        throw new Error('配置不存在');
      }

      const oldValue = config.config_value;

      // 验证配置值
      const validationResult = this.validateConfigValue(config, configValue);
      if (!validationResult.valid) {
        throw new Error(validationResult.error);
      }

      // 更新配置
      await config.update({
        config_value: configValue,
        updated_by: adminInfo.id
      });

      // 记录变更历史
      await this.recordChangeHistory({
        config_key: configKey,
        old_value: oldValue,
        new_value: configValue,
        change_type: 'update',
        change_reason: changeReason,
        admin_id: adminInfo.id,
        admin_username: adminInfo.username,
        ip_address: adminInfo.ip_address
      });

      // 更新.env文件
      await this.updateEnvFile();

      console.log(`✅ 环境变量 ${configKey} 更新成功`);

      return {
        config_key: configKey,
        old_value: config.is_sensitive ? this.maskSensitiveValue(oldValue) : oldValue,
        new_value: config.is_sensitive ? this.maskSensitiveValue(configValue) : configValue,
        updated_at: new Date()
      };
    } catch (error) {
      console.error('更新环境变量配置失败:', error);
      throw new Error(`更新环境变量配置失败: ${error.message}`);
    }
  }

  /**
   * 批量更新环境变量配置
   * @param {Array} updates - 更新数组
   * @param {Object} adminInfo - 管理员信息
   * @param {string} changeReason - 变更原因
   * @returns {Object} 更新结果
   */
  async batchUpdateEnvConfigs(updates, adminInfo, changeReason = '') {
    try {
      const results = [];
      const errors = [];

      for (const update of updates) {
        try {
          const result = await this.updateEnvConfig(
            update.config_key, 
            update.config_value, 
            adminInfo, 
            changeReason
          );
          results.push(result);
        } catch (error) {
          errors.push({
            config_key: update.config_key,
            error: error.message
          });
        }
      }

      return {
        success: results.length,
        failed: errors.length,
        results,
        errors
      };
    } catch (error) {
      console.error('批量更新环境变量配置失败:', error);
      throw new Error(`批量更新环境变量配置失败: ${error.message}`);
    }
  }

  /**
   * 获取变更历史
   * @param {Object} options - 查询选项
   * @returns {Object} 变更历史列表
   */
  async getChangeHistory(options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        config_key = null,
        change_type = null,
        admin_id = null,
        start_date = null,
        end_date = null
      } = options;
      const offset = (page - 1) * limit;

      const whereClause = {};
      if (config_key) whereClause.config_key = config_key;
      if (change_type) whereClause.change_type = change_type;
      if (admin_id) whereClause.admin_id = admin_id;
      if (start_date && end_date) {
        whereClause.created_at = {
          [Op.between]: [new Date(start_date), new Date(end_date)]
        };
      }

      const { rows: history, count: total } = await EnvChangeHistory.findAndCountAll({
        where: whereClause,
        order: [['created_at', 'DESC']],
        limit,
        offset
      });

      // 脱敏处理
      const maskedHistory = history.map(record => {
        const data = record.toJSON();
        if (data.old_value && this.isSensitiveKey(data.config_key)) {
          data.old_value = this.maskSensitiveValue(data.old_value);
        }
        if (data.new_value && this.isSensitiveKey(data.config_key)) {
          data.new_value = this.maskSensitiveValue(data.new_value);
        }
        return data;
      });

      return {
        history: maskedHistory,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('获取变更历史失败:', error);
      throw new Error(`获取变更历史失败: ${error.message}`);
    }
  }

  /**
   * 验证配置值
   * @param {Object} config - 配置对象
   * @param {string} value - 配置值
   * @returns {Object} 验证结果
   */
  validateConfigValue(config, value) {
    try {
      // 必需字段检查
      if (config.is_required && (!value || value.trim() === '')) {
        return { valid: false, error: '该配置项为必需项，不能为空' };
      }

      // 类型验证
      switch (config.config_type) {
        case 'number':
          if (value && isNaN(Number(value))) {
            return { valid: false, error: '必须是有效的数字' };
          }
          break;
        case 'boolean':
          if (value && !['true', 'false', '1', '0'].includes(value.toLowerCase())) {
            return { valid: false, error: '必须是布尔值 (true/false)' };
          }
          break;
        case 'json':
          if (value) {
            try {
              JSON.parse(value);
            } catch (e) {
              return { valid: false, error: '必须是有效的JSON格式' };
            }
          }
          break;
      }

      // 正则验证
      if (config.validation_rule && value) {
        try {
          const regex = new RegExp(config.validation_rule);
          if (!regex.test(value)) {
            return { valid: false, error: '配置值格式不正确' };
          }
        } catch (e) {
          console.warn('正则表达式验证失败:', e.message);
        }
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: '验证过程中发生错误' };
    }
  }

  /**
   * 记录变更历史
   * @param {Object} historyData - 历史数据
   * @returns {Object} 历史记录
   */
  async recordChangeHistory(historyData) {
    try {
      return await EnvChangeHistory.create(historyData);
    } catch (error) {
      console.error('记录变更历史失败:', error);
      // 历史记录失败不应该影响主要业务流程
      return null;
    }
  }

  /**
   * 更新.env文件
   * @returns {boolean} 更新结果
   */
  async updateEnvFile() {
    try {
      // 获取所有活跃的配置
      const configs = await EnvConfig.findAll({
        where: { is_active: true },
        order: [['category', 'ASC'], ['sort_order', 'ASC']]
      });

      // 生成.env文件内容
      let envContent = '# 环境变量配置文件\n';
      envContent += '# 此文件由后台管理系统自动生成，请勿手动修改\n';
      envContent += `# 最后更新时间: ${new Date().toLocaleString('zh-CN')}\n\n`;

      let currentCategory = '';
      configs.forEach(config => {
        // 添加分类注释
        if (config.category !== currentCategory) {
          currentCategory = config.category;
          envContent += `\n# ${this.getCategoryName(currentCategory)}\n`;
        }

        // 添加配置项
        const value = config.config_value || '';
        envContent += `${config.config_key}=${value}`;
        
        if (config.description) {
          envContent += ` # ${config.description}`;
        }
        envContent += '\n';
      });

      // 写入文件
      await fs.writeFile(this.envFilePath, envContent, 'utf8');
      console.log('✅ .env文件更新成功');

      return true;
    } catch (error) {
      console.error('更新.env文件失败:', error);
      throw new Error(`更新.env文件失败: ${error.message}`);
    }
  }

  /**
   * 从.env文件导入配置
   * @param {Object} adminInfo - 管理员信息
   * @returns {Object} 导入结果
   */
  async importFromEnvFile(adminInfo) {
    try {
      // 读取.env文件
      const envContent = await fs.readFile(this.envFilePath, 'utf8');
      
      // 解析环境变量
      const envVars = {};
      const lines = envContent.split('\n');
      
      lines.forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').replace(/^["']|["']$/g, '');
            envVars[key.trim()] = value;
          }
        }
      });

      // 更新数据库中的配置
      const results = [];
      const errors = [];

      for (const [key, value] of Object.entries(envVars)) {
        try {
          const config = await EnvConfig.findOne({
            where: { config_key: key }
          });

          if (config && config.config_value !== value) {
            await config.update({
              config_value: value,
              updated_by: adminInfo.id
            });

            // 记录变更历史
            await this.recordChangeHistory({
              config_key: key,
              old_value: config.config_value,
              new_value: value,
              change_type: 'update',
              change_reason: '从.env文件导入',
              admin_id: adminInfo.id,
              admin_username: adminInfo.username,
              ip_address: adminInfo.ip_address
            });

            results.push({ key, updated: true });
          } else if (config) {
            results.push({ key, updated: false, reason: '值未变更' });
          } else {
            results.push({ key, updated: false, reason: '配置项不存在' });
          }
        } catch (error) {
          errors.push({ key, error: error.message });
        }
      }

      return {
        success: results.filter(r => r.updated).length,
        skipped: results.filter(r => !r.updated).length,
        failed: errors.length,
        results,
        errors
      };
    } catch (error) {
      console.error('从.env文件导入配置失败:', error);
      throw new Error(`从.env文件导入配置失败: ${error.message}`);
    }
  }

  /**
   * 重置配置为默认值
   * @param {string} configKey - 配置键名
   * @param {Object} adminInfo - 管理员信息
   * @returns {Object} 重置结果
   */
  async resetToDefault(configKey, adminInfo) {
    try {
      const config = await EnvConfig.findOne({
        where: { config_key: configKey }
      });

      if (!config) {
        throw new Error('配置不存在');
      }

      const oldValue = config.config_value;
      const newValue = config.default_value || '';

      await config.update({
        config_value: newValue,
        updated_by: adminInfo.id
      });

      // 记录变更历史
      await this.recordChangeHistory({
        config_key: configKey,
        old_value: oldValue,
        new_value: newValue,
        change_type: 'update',
        change_reason: '重置为默认值',
        admin_id: adminInfo.id,
        admin_username: adminInfo.username,
        ip_address: adminInfo.ip_address
      });

      // 更新.env文件
      await this.updateEnvFile();

      return {
        config_key: configKey,
        old_value: config.is_sensitive ? this.maskSensitiveValue(oldValue) : oldValue,
        new_value: config.is_sensitive ? this.maskSensitiveValue(newValue) : newValue
      };
    } catch (error) {
      console.error('重置配置失败:', error);
      throw new Error(`重置配置失败: ${error.message}`);
    }
  }

  /**
   * 获取配置分类列表
   * @returns {Array} 分类列表
   */
  async getCategories() {
    try {
      const categories = await EnvConfig.findAll({
        attributes: ['category'],
        group: ['category'],
        order: [['category', 'ASC']]
      });

      return categories.map(cat => ({
        value: cat.category,
        label: this.getCategoryName(cat.category)
      }));
    } catch (error) {
      console.error('获取配置分类失败:', error);
      throw new Error(`获取配置分类失败: ${error.message}`);
    }
  }

  /**
   * 脱敏敏感信息
   * @param {string} value - 原始值
   * @returns {string} 脱敏后的值
   */
  maskSensitiveValue(value) {
    if (!value || value.length <= 6) {
      return '***';
    }
    return value.substring(0, 3) + '*'.repeat(value.length - 6) + value.substring(value.length - 3);
  }

  /**
   * 检查是否为敏感配置键
   * @param {string} key - 配置键
   * @returns {boolean} 是否敏感
   */
  isSensitiveKey(key) {
    const sensitiveKeys = [
      'PASSWORD', 'SECRET', 'KEY', 'TOKEN', 'API_KEY'
    ];
    return sensitiveKeys.some(keyword => key.toUpperCase().includes(keyword));
  }

  /**
   * 获取分类名称
   * @param {string} category - 分类值
   * @returns {string} 分类名称
   */
  getCategoryName(category) {
    const categoryNames = {
      'database': '数据库配置',
      'api': 'API配置',
      'oss': '对象存储配置',
      'server': '服务器配置',
      'business': '业务配置'
    };
    return categoryNames[category] || category;
  }
}

module.exports = new EnvService();
