#!/usr/bin/env node
/**
 * 测试腾讯云TDSQL-C数据库连接
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
  timezone: '+08:00',
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000
};

async function testTencentDatabase() {
  console.log('🔗 测试腾讯云TDSQL-C数据库连接...');
  console.log(`📡 主机: ${dbConfig.host}:${dbConfig.port}`);
  console.log(`🗄️ 数据库: ${dbConfig.database}`);
  console.log(`👤 用户: ${dbConfig.user}`);
  
  try {
    // 创建连接
    console.log('\n⏳ 正在连接数据库...');
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功！');
    
    // 测试基本查询
    console.log('\n📊 测试基本查询...');
    
    // 检查数据库是否存在
    const [databases] = await connection.execute(
      "SHOW DATABASES LIKE 'ai_clothes'"
    );
    
    if (databases.length === 0) {
      console.log('⚠️ 数据库 ai_clothes 不存在，需要先创建');
      
      // 创建数据库
      await connection.execute(
        "CREATE DATABASE IF NOT EXISTS ai_clothes DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci"
      );
      console.log('✅ 数据库 ai_clothes 创建成功');
      
      // 切换到新数据库
      await connection.execute("USE ai_clothes");
    } else {
      console.log('✅ 数据库 ai_clothes 已存在');
      await connection.execute("USE ai_clothes");
    }
    
    // 检查表是否存在
    const [tables] = await connection.query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'ai_clothes'"
    );
    
    console.log(`📋 当前表数量: ${tables.length}`);
    if (tables.length > 0) {
      console.log('📋 现有表:');
      tables.forEach(table => {
        console.log(`   - ${table.TABLE_NAME}`);
      });
      
      // 测试用户表查询
      try {
        const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
        console.log(`👥 用户数量: ${users[0].count}`);
      } catch (err) {
        console.log('ℹ️ 用户表不存在或为空');
      }
      
      // 测试任务表查询
      try {
        const [tasks] = await connection.execute('SELECT COUNT(*) as count FROM tryon_tasks');
        console.log(`📝 任务数量: ${tasks[0].count}`);
      } catch (err) {
        console.log('ℹ️ 任务表不存在或为空');
      }
    } else {
      console.log('ℹ️ 数据库为空，需要导入表结构');
    }
    
    // 测试写入权限
    console.log('\n🔐 测试写入权限...');
    try {
      await connection.execute(
        "CREATE TEMPORARY TABLE test_temp (id INT PRIMARY KEY, name VARCHAR(50))"
      );
      await connection.execute(
        "INSERT INTO test_temp (id, name) VALUES (1, 'test')"
      );
      await connection.execute("DROP TEMPORARY TABLE test_temp");
      console.log('✅ 写入权限正常');
    } catch (err) {
      console.log('❌ 写入权限测试失败:', err.message);
    }
    
    // 关闭连接
    await connection.end();
    
    console.log('\n🎉 数据库连接测试完成！');
    console.log('\n📋 下一步操作:');
    console.log('1. 如果表不存在，请导入 database/init-tencent.sql');
    console.log('2. 配置Vercel环境变量');
    console.log('3. 重新部署应用');
    
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 提示: 请检查主机地址和端口是否正确');
      console.log('💡 提示: 确认网络连接和防火墙设置');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 提示: 请检查用户名和密码是否正确');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('💡 提示: 数据库不存在，将自动创建');
    }
    
    process.exit(1);
  }
}

// 执行测试
testTencentDatabase();
