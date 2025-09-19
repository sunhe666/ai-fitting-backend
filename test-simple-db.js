#!/usr/bin/env node
/**
 * 简化版腾讯云TDSQL-C数据库连接测试
 */

const mysql = require('mysql2/promise');

// 腾讯云TDSQL-C连接配置
const dbConfig = {
  host: 'gz-cynosdbmysql-grp-5efn5g8l.sql.tencentcdb.com',
  port: 21487,
  user: 'root',
  password: 'Sunhe2003',
  database: 'ai_clothes',
  charset: 'utf8mb4',
  timezone: '+08:00'
};

async function testSimpleConnection() {
  console.log('🔗 测试腾讯云TDSQL-C数据库连接...');
  console.log(`📡 主机: ${dbConfig.host}:${dbConfig.port}`);
  console.log(`🗄️ 数据库: ${dbConfig.database}`);
  
  try {
    // 创建连接
    console.log('\n⏳ 正在连接数据库...');
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功！');
    
    // 简单查询测试
    console.log('\n📊 测试基本查询...');
    
    // 检查数据库版本
    const [version] = await connection.query('SELECT VERSION() as version');
    console.log(`📋 MySQL版本: ${version[0].version}`);
    
    // 显示当前数据库
    const [currentDb] = await connection.query('SELECT DATABASE() as current_db');
    console.log(`🗄️ 当前数据库: ${currentDb[0].current_db}`);
    
    // 显示表（如果存在）
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`📋 表数量: ${tables.length}`);
    
    if (tables.length > 0) {
      console.log('📋 现有表:');
      tables.forEach(table => {
        const tableName = Object.values(table)[0];
        console.log(`   - ${tableName}`);
      });
      
      // 如果有用户表，查询用户数量
      const hasUsersTable = tables.some(table => Object.values(table)[0] === 'users');
      if (hasUsersTable) {
        try {
          const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
          console.log(`👥 用户数量: ${users[0].count}`);
        } catch (err) {
          console.log('ℹ️ 用户表查询失败:', err.message);
        }
      }
    } else {
      console.log('ℹ️ 数据库为空，需要导入表结构');
    }
    
    // 关闭连接
    await connection.end();
    
    console.log('\n🎉 数据库连接测试成功！');
    
    if (tables.length === 0) {
      console.log('\n📋 下一步操作:');
      console.log('1. 需要导入 database/init-tencent.sql 文件');
      console.log('2. 配置Vercel环境变量');
      console.log('3. 重新部署应用');
    } else {
      console.log('\n🚀 数据库已准备就绪，可以配置Vercel了！');
    }
    
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 提示: 请检查主机地址和端口是否正确');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 提示: 请检查用户名和密码是否正确');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('💡 提示: 连接超时，请检查网络和防火墙设置');
    }
    
    process.exit(1);
  }
}

// 执行测试
testSimpleConnection();
