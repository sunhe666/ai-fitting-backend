/**
 * 数据库配置文件
 * 支持phpStudy MySQL数据库连接
 */

require('dotenv').config();

// 解析DATABASE_URL (通用格式)
function parseDatabaseUrl(databaseUrl) {
  if (!databaseUrl) return null;
  
  try {
    const url = new URL(databaseUrl);
    return {
      username: url.username,
      password: url.password,
      database: url.pathname.substring(1),
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      dialect: 'mysql'
    };
  } catch (error) {
    console.warn('Failed to parse DATABASE_URL:', error.message);
    return null;
  }
}

const databaseUrlConfig = parseDatabaseUrl(process.env.DATABASE_URL);

// 腾讯云TDSQL-C配置
const tencentConfig = {
  username: process.env.TDSQL_USER || 'root',
  password: process.env.TDSQL_PASSWORD || 'Sunhe2003',
  database: process.env.TDSQL_DATABASE || 'ai_clothes',
  host: process.env.TDSQL_HOST || 'gz-cynosdbmysql-grp-5efn5g8l.sql.tencentcdb.com',
  port: process.env.TDSQL_PORT || 21487,
  dialect: 'mysql'
};

const config = {
  development: {
    ...(databaseUrlConfig || {
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'ai_tryClothes',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql'
    }),
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
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    logging: console.log, // 开发环境显示SQL日志
    dialectOptions: {
      charset: 'utf8mb4',
      dateStrings: true,
      typeCast: true
    }
  },
  
  production: {
    ...(databaseUrlConfig || tencentConfig || {
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'ai_tryClothes',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql'
    }),
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
    logging: false, // 生产环境关闭SQL日志
    dialectOptions: {
      charset: 'utf8mb4',
      dateStrings: true,
      typeCast: true,
      ssl: process.env.DATABASE_URL ? {
        rejectUnauthorized: false
      } : undefined
    }
  }
};

const env = process.env.NODE_ENV || 'development';
module.exports = config[env];
