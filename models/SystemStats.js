/**
 * 系统统计模型
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database-init');

const SystemStats = sequelize.define('SystemStats', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '统计ID'
  },
  stat_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: '统计日期'
  },
  stat_type: {
    type: DataTypes.ENUM('daily', 'weekly', 'monthly'),
    allowNull: false,
    comment: '统计类型'
  },
  
  // 用户相关统计
  total_users: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '总用户数'
  },
  new_users: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '新增用户数'
  },
  active_users: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '活跃用户数'
  },
  
  // 任务相关统计
  total_tasks: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '总任务数'
  },
  new_tasks: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '新增任务数'
  },
  completed_tasks: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '完成任务数'
  },
  failed_tasks: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '失败任务数'
  },
  
  // 试衣模式统计
  top_tasks: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '上装试衣任务数'
  },
  bottom_tasks: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '下装试衣任务数'
  },
  outfit_tasks: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '套装试衣任务数'
  },
  dress_tasks: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '连衣裙试衣任务数'
  },
  
  // 图片相关统计
  total_images: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '总图片数'
  },
  new_images: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '新增图片数'
  },
  
  // 系统性能统计
  avg_processing_time: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: '平均处理时间（秒）'
  },
  success_rate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: '成功率（%）'
  }
}, {
  tableName: 'system_stats',
  comment: '系统统计表',
  indexes: [
    {
      unique: true,
      fields: ['stat_date', 'stat_type']
    },
    {
      fields: ['stat_date']
    },
    {
      fields: ['stat_type']
    }
  ]
});

module.exports = SystemStats;
