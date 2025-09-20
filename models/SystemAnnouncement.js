/**
 * 系统公告模型
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database-init');

const SystemAnnouncement = sequelize.define('SystemAnnouncement', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '公告ID'
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '公告标题'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '公告内容'
  },
  type: {
    type: DataTypes.ENUM('info', 'warning', 'error', 'success'),
    defaultValue: 'info',
    comment: '公告类型'
  },
  priority: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '优先级：1-低，2-中，3-高'
  },
  target_users: {
    type: DataTypes.ENUM('all', 'new', 'active'),
    defaultValue: 'all',
    comment: '目标用户'
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '开始时间'
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '结束时间'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '是否激活'
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '创建者ID'
  }
}, {
  tableName: 'system_announcements',
  comment: '系统公告表',
  indexes: [
    {
      fields: ['type']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['start_time']
    },
    {
      fields: ['end_time']
    },
    {
      fields: ['created_at']
    }
  ]
});

module.exports = SystemAnnouncement;
