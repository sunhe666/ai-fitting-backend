/**
 * 数据库管理工具
 * 用于数据库的初始化、清理、备份等操作
 */

require('dotenv').config();
const { sequelize } = require('../config/database-init');
const { User, Image, TryonTask } = require('../models');

class DatabaseManager {
  /**
   * 初始化数据库
   */
  async initDatabase() {
    try {
      console.log('🔧 正在初始化数据库...');
      
      // 测试连接
      await sequelize.authenticate();
      console.log('✅ 数据库连接成功');
      
      // 同步模型到数据库
      await sequelize.sync({ force: false, alter: true });
      console.log('✅ 数据库表同步完成');
      
      return true;
    } catch (error) {
      console.error('❌ 数据库初始化失败:', error);
      return false;
    }
  }
  
  /**
   * 重置数据库（危险操作）
   */
  async resetDatabase() {
    try {
      console.log('⚠️  警告：即将重置数据库，所有数据将被删除！');
      
      // 强制同步，删除所有表并重新创建
      await sequelize.sync({ force: true });
      console.log('✅ 数据库重置完成');
      
      return true;
    } catch (error) {
      console.error('❌ 数据库重置失败:', error);
      return false;
    }
  }
  
  /**
   * 获取数据库状态
   */
  async getDatabaseStatus() {
    try {
      const status = {
        connected: false,
        tables: {},
        totalRecords: 0
      };
      
      // 测试连接
      await sequelize.authenticate();
      status.connected = true;
      
      // 获取各表记录数
      const userCount = await User.count();
      const imageCount = await Image.count({ where: { status: 1 } });
      const taskCount = await TryonTask.count();
      
      status.tables = {
        users: userCount,
        images: imageCount,
        tryon_tasks: taskCount
      };
      
      status.totalRecords = userCount + imageCount + taskCount;
      
      return status;
    } catch (error) {
      console.error('获取数据库状态失败:', error);
      return {
        connected: false,
        error: error.message
      };
    }
  }
  
  /**
   * 清理过期数据
   */
  async cleanupExpiredData() {
    try {
      console.log('🧹 开始清理过期数据...');
      
      const { ImageService, TryonService } = require('../services');
      
      // 清理过期图片（30天前）
      const expiredImages = await ImageService.cleanupExpiredImages(30);
      console.log(`🗑️  清理过期图片: ${expiredImages} 张`);
      
      // 清理过期任务（7天前的失败任务）
      const expiredTasks = await TryonService.cleanupExpiredTasks(7);
      console.log(`🗑️  清理过期任务: ${expiredTasks} 个`);
      
      console.log('✅ 数据清理完成');
      return { expiredImages, expiredTasks };
    } catch (error) {
      console.error('❌ 数据清理失败:', error);
      throw error;
    }
  }
  
  /**
   * 创建测试数据
   */
  async createTestData() {
    try {
      console.log('📝 创建测试数据...');
      
      // 创建测试用户
      const testUser = await User.findOrCreate({
        where: { openid: 'test_openid_demo' },
        defaults: {
          nickname: '测试用户',
          avatar_url: 'https://example.com/avatar.jpg',
          status: 1
        }
      });
      
      console.log('✅ 测试用户创建完成');
      
      // 创建测试图片记录
      const testImage = await Image.findOrCreate({
        where: { filename: 'test-image.jpg' },
        defaults: {
          user_id: testUser[0].id,
          filename: 'test-image.jpg',
          original_name: 'test-image.jpg',
          file_path: '/uploads/test-image.jpg',
          file_url: '/uploads/test-image.jpg',
          file_size: 100000,
          mime_type: 'image/jpeg',
          image_type: 'person'
        }
      });
      
      console.log('✅ 测试图片创建完成');
      
      return { testUser: testUser[0], testImage: testImage[0] };
    } catch (error) {
      console.error('❌ 创建测试数据失败:', error);
      throw error;
    }
  }
  
  /**
   * 备份数据库（简单版本）
   */
  async backupDatabase() {
    try {
      console.log('💾 开始备份数据库...');
      
      const fs = require('fs').promises;
      const path = require('path');
      
      const backupDir = path.join(__dirname, '..', 'backups');
      await fs.mkdir(backupDir, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
      
      // 导出所有数据
      const users = await User.findAll();
      const images = await Image.findAll();
      const tasks = await TryonTask.findAll();
      
      const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        data: {
          users,
          images,
          tasks
        }
      };
      
      await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2));
      
      console.log(`✅ 数据库备份完成: ${backupFile}`);
      return backupFile;
    } catch (error) {
      console.error('❌ 数据库备份失败:', error);
      throw error;
    }
  }
}

// 命令行工具
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const manager = new DatabaseManager();
  
  try {
    switch (command) {
      case 'init':
        await manager.initDatabase();
        break;
        
      case 'reset':
        console.log('⚠️  确认要重置数据库吗？这将删除所有数据！');
        console.log('⚠️  如果确认，请手动执行：node scripts/db-manager.js force-reset');
        break;
        
      case 'force-reset':
        await manager.resetDatabase();
        break;
        
      case 'status':
        const status = await manager.getDatabaseStatus();
        console.log('📊 数据库状态:', JSON.stringify(status, null, 2));
        break;
        
      case 'cleanup':
        await manager.cleanupExpiredData();
        break;
        
      case 'test-data':
        await manager.createTestData();
        break;
        
      case 'backup':
        await manager.backupDatabase();
        break;
        
      default:
        console.log('📖 数据库管理工具使用说明:');
        console.log('  node scripts/db-manager.js init       - 初始化数据库');
        console.log('  node scripts/db-manager.js status     - 查看数据库状态');
        console.log('  node scripts/db-manager.js cleanup    - 清理过期数据');
        console.log('  node scripts/db-manager.js test-data  - 创建测试数据');
        console.log('  node scripts/db-manager.js backup     - 备份数据库');
        console.log('  node scripts/db-manager.js reset      - 重置数据库（危险）');
    }
  } catch (error) {
    console.error('❌ 操作失败:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main();
}

module.exports = DatabaseManager;
