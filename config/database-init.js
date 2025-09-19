/**
 * 数据库连接初始化
 */

const { Sequelize } = require('sequelize');
const databaseConfig = require('./database');

// 创建Sequelize实例
const sequelize = new Sequelize(databaseConfig);

/**
 * 测试数据库连接
 */
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    console.log(`📍 数据库: ${databaseConfig.database}@${databaseConfig.host}:${databaseConfig.port}`);
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
}

/**
 * 初始化数据库表
 */
async function initDatabase() {
  try {
    // 同步所有模型到数据库
    await sequelize.sync({ alter: true });
    console.log('✅ 数据库表同步完成');
    return true;
  } catch (error) {
    console.error('❌ 数据库表同步失败:', error.message);
    return false;
  }
}

/**
 * 关闭数据库连接
 */
async function closeConnection() {
  try {
    await sequelize.close();
    console.log('✅ 数据库连接已关闭');
  } catch (error) {
    console.error('❌ 关闭数据库连接失败:', error.message);
  }
}

module.exports = {
  sequelize,
  testConnection,
  initDatabase,
  closeConnection
};
