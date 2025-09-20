/**
 * 初始化默认管理员账号
 */

const bcrypt = require('bcrypt');
const { sequelize } = require('../config/database-init');
const { Admin } = require('../models');

async function initDefaultAdmin() {
  try {
    console.log('🔄 开始初始化默认管理员账号...');
    
    // 检查是否已存在管理员
    const existingAdmin = await Admin.findOne({
      where: { username: 'admin' }
    });
    
    if (existingAdmin) {
      console.log('ℹ️  默认管理员账号已存在，跳过创建');
      return;
    }
    
    // 创建默认管理员账号
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const defaultAdmin = await Admin.create({
      username: 'admin',
      password: hashedPassword,
      real_name: '系统管理员',
      role: 'super_admin',
      permissions: {
        users: { view: true, create: true, edit: true, delete: true },
        tasks: { view: true, create: true, edit: true, delete: true },
        images: { view: true, create: true, edit: true, delete: true },
        admins: { view: true, create: true, edit: true, delete: true },
        logs: { view: true },
        stats: { view: true },
        system: { view: true, config: true }
      },
      status: 1
    });
    
    console.log('✅ 默认管理员账号创建成功！');
    console.log(`   用户名: admin`);
    console.log(`   密码: 123456`);
    console.log(`   角色: 超级管理员`);
    console.log('⚠️  请在生产环境中立即修改默认密码！');
    
  } catch (error) {
    console.error('❌ 创建默认管理员失败:', error.message);
    throw error;
  }
}

async function main() {
  try {
    await initDefaultAdmin();
    process.exit(0);
  } catch (error) {
    console.error('初始化失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { initDefaultAdmin };
