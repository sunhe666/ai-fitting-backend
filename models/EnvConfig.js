/**
 * 环境变量配置模型
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database-init');

const EnvConfig = sequelize.define('EnvConfig', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '配置ID'
  },
  config_key: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: '配置键名'
  },
  config_value: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '配置值'
  },
  config_type: {
    type: DataTypes.ENUM('string', 'number', 'boolean', 'json', 'password'),
    defaultValue: 'string',
    comment: '配置类型'
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '配置分类'
  },
  description: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '配置描述'
  },
  is_required: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否必需'
  },
  is_sensitive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否敏感信息'
  },
  default_value: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '默认值'
  },
  validation_rule: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '验证规则（正则表达式）'
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '排序顺序'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '是否启用'
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '创建者ID'
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '更新者ID'
  }
}, {
  tableName: 'env_configs',
  comment: '环境变量配置表',
  indexes: [
    {
      unique: true,
      fields: ['config_key']
    },
    {
      fields: ['category']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['sort_order']
    }
  ]
});

module.exports = EnvConfig;
