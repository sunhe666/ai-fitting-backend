/**
 * 试衣任务模型
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database-init');

const TryonTask = sequelize.define('TryonTask', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '任务ID'
  },
  task_id: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: 'AI服务返回的任务ID'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '用户ID'
  },
  
  // 输入参数
  person_image_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '模特图片ID'
  },
  person_image_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '模特图片URL'
  },
  top_garment_image_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '上装图片ID'
  },
  top_garment_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '上装图片URL'
  },
  bottom_garment_image_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '下装图片ID'
  },
  bottom_garment_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '下装图片URL'
  },
  
  // 任务配置
  tryon_mode: {
    type: DataTypes.ENUM('top', 'bottom', 'outfit', 'dress'),
    allowNull: false,
    comment: '试衣模式'
  },
  resolution: {
    type: DataTypes.INTEGER,
    defaultValue: -1,
    comment: '输出分辨率：-1=原图，1024，1280'
  },
  restore_face: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '是否保留原人脸'
  },
  
  // 任务状态
  task_status: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'PENDING',
    comment: '任务状态'
  },
  task_status_description: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: '状态描述'
  },
  
  // 时间信息
  submit_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '提交时间'
  },
  scheduled_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '调度时间'
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '开始处理时间'
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '完成时间'
  },
  
  // 结果信息
  result_image_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '结果图片URL'
  },
  result_image_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '结果图片ID'
  },
  image_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '生成图片数量'
  },
  
  // API相关
  request_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'API请求ID'
  },
  error_code: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '错误码'
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '错误信息'
  }
}, {
  tableName: 'tryon_tasks',
  comment: '试衣任务表',
  indexes: [
    {
      unique: true,
      fields: ['task_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['task_status']
    },
    {
      fields: ['tryon_mode']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['submit_time']
    }
  ]
});

module.exports = TryonTask;
