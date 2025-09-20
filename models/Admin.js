/**
 * 管理员模型
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database-init');

const Admin = sequelize.define('Admin', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '管理员ID'
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '用户名'
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '密码（加密）'
  },
  real_name: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '真实姓名'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '邮箱'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '手机号'
  },
  avatar_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '头像URL'
  },
  role: {
    type: DataTypes.ENUM('super_admin', 'admin', 'operator'),
    defaultValue: 'operator',
    comment: '角色：超级管理员、管理员、操作员'
  },
  permissions: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '权限配置'
  },
  last_login_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后登录时间'
  },
  last_login_ip: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: '最后登录IP'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态：1-正常，0-禁用'
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '创建者ID'
  }
}, {
  tableName: 'admins',
  comment: '管理员表',
  indexes: [
    {
      unique: true,
      fields: ['username']
    },
    {
      fields: ['status']
    },
    {
      fields: ['role']
    },
    {
      fields: ['created_at']
    }
  ]
});

module.exports = Admin;
