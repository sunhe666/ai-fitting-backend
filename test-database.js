/**
 * 数据库连接测试工具
 * 用于测试phpStudy MySQL连接
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function testDatabaseConnection() {
  console.log('🧪 测试phpStudy MySQL数据库连接\n');
  
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    charset: 'utf8mb4'
  };
  
  console.log('📋 连接配置:');
  console.log(`   主机: ${config.host}:${config.port}`);
  console.log(`   用户: ${config.user}`);
  console.log(`   密码: ${'*'.repeat(config.password.length)}`);
  console.log('');
  
  try {
    // 测试基础连接
    console.log('⏳ 正在连接MySQL服务器...');
    const connection = await mysql.createConnection(config);
    console.log('✅ MySQL服务器连接成功!');
    
    // 检查数据库是否存在
    const dbName = process.env.DB_NAME || 'ai_tryClothes';
    console.log(`\n⏳ 检查数据库 ${dbName} 是否存在...`);
    
    const [databases] = await connection.execute('SHOW DATABASES');
    const dbExists = databases.some(db => db.Database === dbName);
    
    if (dbExists) {
      console.log(`✅ 数据库 ${dbName} 已存在`);
      
      // 连接到指定数据库
      await connection.execute(`USE ${dbName}`);
      
      // 检查表结构
      console.log('\n⏳ 检查数据表...');
      const [tables] = await connection.execute('SHOW TABLES');
      
      if (tables.length > 0) {
        console.log('✅ 发现以下数据表:');
        tables.forEach(table => {
          const tableName = table[`Tables_in_${dbName}`];
          console.log(`   📋 ${tableName}`);
        });
        
        // 检查users表结构（如果存在）
        const userTableExists = tables.some(table => 
          table[`Tables_in_${dbName}`] === 'users'
        );
        
        if (userTableExists) {
          console.log('\n⏳ 检查users表结构...');
          const [columns] = await connection.execute('DESCRIBE users');
          console.log('✅ users表结构:');
          columns.forEach(col => {
            console.log(`   📄 ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
          });
        }
      } else {
        console.log('⚠️  数据库中没有表，请运行初始化SQL脚本');
        console.log('   👉 执行: mysql -u root -p ai_tryClothes < database/init-phpstudy.sql');
      }
      
    } else {
      console.log(`❌ 数据库 ${dbName} 不存在`);
      console.log('📋 请先创建数据库:');
      console.log(`   1. 在phpStudy中打开MySQL管理`);
      console.log(`   2. 执行SQL: CREATE DATABASE ${dbName} DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
      console.log(`   3. 或者运行: mysql -u root -p < database/init-phpstudy.sql`);
    }
    
    await connection.end();
    console.log('\n✅ 数据库连接测试完成');
    
  } catch (error) {
    console.error('❌ 数据库连接失败:');
    console.error(`   错误: ${error.message}`);
    console.error(`   错误码: ${error.code}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 解决建议:');
      console.log('   1. 确保phpStudy已启动');
      console.log('   2. 确保MySQL服务正在运行');
      console.log('   3. 检查端口3306是否被占用');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 解决建议:');
      console.log('   1. 检查用户名和密码是否正确');
      console.log('   2. 确保root用户有访问权限');
      console.log('   3. 尝试在phpStudy中重置MySQL密码');
    }
  }
}

// 运行测试
if (require.main === module) {
  testDatabaseConnection().catch(console.error);
}

module.exports = { testDatabaseConnection };
