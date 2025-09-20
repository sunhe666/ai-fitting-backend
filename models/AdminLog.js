/**
 * 管理员操作日志模型
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database-init');

const AdminLog = sequelize.define('AdminLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '日志ID'
  },
  admin_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '管理员ID'
  },
  admin_username: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '管理员用户名'
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '操作类型'
  },
  resource: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '操作资源'
  },
  resource_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '资源ID'
  },
  method: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'HTTP方法'
  },
  url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '请求URL'
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'IP地址'
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '用户代理'
  },
  request_data: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '请求数据'
  },
  response_status: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '响应状态码'
  },
  response_message: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '响应消息'
  },
  processing_time: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '处理时间（毫秒）'
  }
}, {
  tableName: 'admin_logs',
  comment: '管理员操作日志表',
  updatedAt: false, // 日志表不需要更新时间
  indexes: [
    {
      fields: ['admin_id']
    },
    {
      fields: ['action']
    },
    {
      fields: ['resource']
    },
    {
      fields: ['ip_address']
    },
    {
      fields: ['created_at']
    }
  ]
});

module.exports = AdminLog;
