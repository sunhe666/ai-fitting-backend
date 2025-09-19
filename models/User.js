/**
 * 用户模型
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database-init');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '用户ID'
  },
  openid: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true,
    comment: '微信用户唯一标识'
  },
  unionid: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: '微信开放平台唯一标识'
  },
  nickname: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '用户昵称'
  },
  avatar_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '头像URL'
  },
  gender: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '性别：0-未知，1-男，2-女'
  },
  city: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '城市'
  },
  province: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '省份'
  },
  country: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '国家'
  },
  language: {
    type: DataTypes.STRING(20),
    defaultValue: 'zh_CN',
    comment: '语言'
  },
  last_login_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后登录时间'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态：1-正常，0-禁用'
  }
}, {
  tableName: 'users',
  comment: '用户信息表',
  indexes: [
    {
      unique: true,
      fields: ['openid']
    },
    {
      fields: ['unionid']
    },
    {
      fields: ['created_at']
    }
  ]
});

module.exports = User;
