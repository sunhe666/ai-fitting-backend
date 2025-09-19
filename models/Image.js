/**
 * 图片文件模型
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database-init');

const Image = sequelize.define('Image', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '图片ID'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '上传用户ID'
  },
  filename: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '文件名'
  },
  original_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '原始文件名'
  },
  file_path: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: '文件路径'
  },
  file_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '访问URL'
  },
  file_size: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '文件大小（字节）'
  },
  mime_type: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'MIME类型'
  },
  width: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '图片宽度'
  },
  height: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '图片高度'
  },
  image_type: {
    type: DataTypes.ENUM('person', 'top_garment', 'bottom_garment', 'result'),
    allowNull: false,
    comment: '图片类型'
  },
  upload_source: {
    type: DataTypes.STRING(50),
    defaultValue: 'miniprogram',
    comment: '上传来源'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态：1-正常，0-删除'
  }
}, {
  tableName: 'images',
  comment: '图片文件表',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['image_type']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['filename']
    }
  ]
});

module.exports = Image;
