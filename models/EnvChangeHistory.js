/**
 * 环境变量变更历史模型
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database-init');

const EnvChangeHistory = sequelize.define('EnvChangeHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '历史记录ID'
  },
  config_key: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '配置键名'
  },
  old_value: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '旧值'
  },
  new_value: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '新值'
  },
  change_type: {
    type: DataTypes.ENUM('create', 'update', 'delete'),
    allowNull: false,
    comment: '变更类型'
  },
  change_reason: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '变更原因'
  },
  admin_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '操作管理员ID'
  },
  admin_username: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '操作管理员用户名'
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: '操作IP地址'
  }
}, {
  tableName: 'env_change_history',
  comment: '环境变量变更历史表',
  updatedAt: false, // 历史表不需要更新时间
  indexes: [
    {
      fields: ['config_key']
    },
    {
      fields: ['change_type']
    },
    {
      fields: ['admin_id']
    },
    {
      fields: ['created_at']
    }
  ]
});

module.exports = EnvChangeHistory;
