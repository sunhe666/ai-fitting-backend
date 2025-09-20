/**
 * 重置管理员密码
 */

const bcrypt = require('bcrypt');
const { sequelize } = require('../config/database-init');
const { Admin } = require('../models');

async function resetAdminPassword() {
  try {
    console.log('🔄 开始重置管理员密码...');
    
    // 查找admin用户
    const admin = await Admin.findOne({
      where: { username: 'admin' }
    });
    
    if (!admin) {
      // 如果不存在，创建新的管理员账号
      console.log('📝 管理员账号不存在，创建新账号...');
      
      const hashedPassword = await bcrypt.hash('123456', 10);
      
      const newAdmin = await Admin.create({
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
      
      console.log('✅ 新管理员账号创建成功！');
    } else {
      // 重置现有管理员密码
      console.log('🔄 重置现有管理员密码...');
      
      const hashedPassword = await bcrypt.hash('123456', 10);
      
      await admin.update({
        password: hashedPassword,
        status: 1,
        role: 'super_admin',
        permissions: {
          users: { view: true, create: true, edit: true, delete: true },
          tasks: { view: true, create: true, edit: true, delete: true },
          images: { view: true, create: true, edit: true, delete: true },
          admins: { view: true, create: true, edit: true, delete: true },
          logs: { view: true },
          stats: { view: true },
          system: { view: true, config: true }
        }
      });
      
      console.log('✅ 管理员密码重置成功！');
    }
    
    console.log('');
    console.log('📋 登录信息:');
    console.log('   用户名: admin');
    console.log('   密码: 123456');
    console.log('   角色: 超级管理员');
    console.log('');
    console.log('⚠️  请在生产环境中立即修改默认密码！');
    
  } catch (error) {
    console.error('❌ 重置管理员密码失败:', error.message);
    throw error;
  }
}

async function main() {
  try {
    await resetAdminPassword();
    process.exit(0);
  } catch (error) {
    console.error('操作失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { resetAdminPassword };
