/**
 * 腾讯云TDSQL-C数据库配置文件
 * 兼容MySQL协议，支持读写分离
 */

require('dotenv').config();

const config = {
  development: {
    username: process.env.TDSQL_USER || 'root',
    password: process.env.TDSQL_PASSWORD,
    database: process.env.TDSQL_DATABASE || 'ai_tryClothes',
    host: process.env.TDSQL_HOST,
    port: process.env.TDSQL_PORT || 3306,
    dialect: 'mysql',
    dialectModule: require('mysql2'),
    timezone: '+08:00', // 中国时区
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timestamps: true,
      underscored: false,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    logging: console.log,
    dialectOptions: {
      charset: 'utf8mb4',
      dateStrings: true,
      typeCast: true,
      // TDSQL-C SSL配置
      ssl: process.env.TDSQL_SSL === 'true' ? {
        rejectUnauthorized: false
      } : false
    }
  },
  
  production: {
    username: process.env.TDSQL_USER || 'root',
    password: process.env.TDSQL_PASSWORD,
    database: process.env.TDSQL_DATABASE || 'ai_tryClothes',
    host: process.env.TDSQL_HOST,
    port: process.env.TDSQL_PORT || 3306,
    dialect: 'mysql',
    dialectModule: require('mysql2'),
    timezone: '+08:00',
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timestamps: true,
      underscored: false,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    pool: {
      max: 20,
      min: 5,
      acquire: 60000,
      idle: 10000
    },
    logging: false, // 生产环境关闭日志
    dialectOptions: {
      charset: 'utf8mb4',
      dateStrings: true,
      typeCast: true,
      ssl: process.env.TDSQL_SSL === 'true' ? {
        rejectUnauthorized: false
      } : false,
      // TDSQL-C 特定配置
      connectTimeout: 60000,
      acquireTimeout: 60000,
      timeout: 60000
    },
    // 读写分离配置（如果启用）
    replication: process.env.TDSQL_READ_HOST ? {
      read: [
        {
          host: process.env.TDSQL_READ_HOST,
          username: process.env.TDSQL_USER,
          password: process.env.TDSQL_PASSWORD
        }
      ],
      write: {
        host: process.env.TDSQL_HOST,
        username: process.env.TDSQL_USER,
        password: process.env.TDSQL_PASSWORD
      }
    } : undefined
  }
};

const env = process.env.NODE_ENV || 'development';
module.exports = config[env];
