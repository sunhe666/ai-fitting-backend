/**
 * 初始化环境变量配置
 * 从当前.env文件读取配置并导入到数据库
 */

const fs = require('fs').promises;
const path = require('path');
const { sequelize } = require('../config/database-init');
const { EnvConfig } = require('../models');

// 预定义的配置结构
const predefinedConfigs = [
  // 数据库配置
  {
    config_key: 'DATABASE_URL',
    config_type: 'string',
    category: 'database',
    description: '数据库连接字符串',
    is_required: true,
    is_sensitive: true,
    default_value: '',
    sort_order: 1
  },
  {
    config_key: 'DB_HOST',
    config_type: 'string',
    category: 'database',
    description: '数据库主机地址',
    is_required: false,
    is_sensitive: false,
    default_value: 'localhost',
    sort_order: 2
  },
  {
    config_key: 'DB_PORT',
    config_type: 'number',
    category: 'database',
    description: '数据库端口',
    is_required: false,
    is_sensitive: false,
    default_value: '3306',
    sort_order: 3
  },
  {
    config_key: 'DB_USER',
    config_type: 'string',
    category: 'database',
    description: '数据库用户名',
    is_required: false,
    is_sensitive: true,
    default_value: 'root',
    sort_order: 4
  },
  {
    config_key: 'DB_PASSWORD',
    config_type: 'password',
    category: 'database',
    description: '数据库密码',
    is_required: false,
    is_sensitive: true,
    default_value: '',
    sort_order: 5
  },
  {
    config_key: 'DB_NAME',
    config_type: 'string',
    category: 'database',
    description: '数据库名称',
    is_required: false,
    is_sensitive: false,
    default_value: 'ai_tryClothes',
    sort_order: 6
  },

  // API配置
  {
    config_key: 'DASHSCOPE_API_KEY',
    config_type: 'password',
    category: 'api',
    description: '阿里云百炼API密钥',
    is_required: true,
    is_sensitive: true,
    default_value: '',
    sort_order: 10
  },
  {
    config_key: 'JWT_SECRET',
    config_type: 'password',
    category: 'api',
    description: 'JWT密钥',
    is_required: true,
    is_sensitive: true,
    default_value: '',
    sort_order: 11
  },
  {
    config_key: 'JWT_EXPIRES_IN',
    config_type: 'string',
    category: 'api',
    description: 'JWT过期时间',
    is_required: false,
    is_sensitive: false,
    default_value: '24h',
    sort_order: 12
  },

  // OSS配置
  {
    config_key: 'OSS_REGION',
    config_type: 'string',
    category: 'oss',
    description: 'OSS区域',
    is_required: false,
    is_sensitive: false,
    default_value: 'oss-cn-beijing',
    sort_order: 20
  },
  {
    config_key: 'OSS_ACCESS_KEY_ID',
    config_type: 'password',
    category: 'oss',
    description: 'OSS访问密钥ID',
    is_required: false,
    is_sensitive: true,
    default_value: '',
    sort_order: 21
  },
  {
    config_key: 'OSS_ACCESS_KEY_SECRET',
    config_type: 'password',
    category: 'oss',
    description: 'OSS访问密钥Secret',
    is_required: false,
    is_sensitive: true,
    default_value: '',
    sort_order: 22
  },
  {
    config_key: 'OSS_BUCKET',
    config_type: 'string',
    category: 'oss',
    description: 'OSS存储桶名称',
    is_required: false,
    is_sensitive: false,
    default_value: '',
    sort_order: 23
  },
  {
    config_key: 'OSS_UPLOAD_PATH',
    config_type: 'string',
    category: 'oss',
    description: 'OSS上传路径前缀',
    is_required: false,
    is_sensitive: false,
    default_value: 'ai-fitting/',
    sort_order: 24
  },
  {
    config_key: 'OSS_CDN_DOMAIN',
    config_type: 'string',
    category: 'oss',
    description: 'OSS CDN域名',
    is_required: false,
    is_sensitive: false,
    default_value: '',
    sort_order: 25
  },

  // 服务器配置
  {
    config_key: 'PORT',
    config_type: 'number',
    category: 'server',
    description: '服务器端口',
    is_required: false,
    is_sensitive: false,
    default_value: '3000',
    sort_order: 30
  },
  {
    config_key: 'NODE_ENV',
    config_type: 'string',
    category: 'server',
    description: '运行环境',
    is_required: false,
    is_sensitive: false,
    default_value: 'development',
    sort_order: 31
  },
  {
    config_key: 'CORS_ORIGIN',
    config_type: 'string',
    category: 'server',
    description: 'CORS允许的源',
    is_required: false,
    is_sensitive: false,
    default_value: '*',
    sort_order: 32
  }
];

async function readEnvFile() {
  try {
    const envFilePath = path.join(__dirname, '../.env');
    const envContent = await fs.readFile(envFilePath, 'utf8');
    
    const envVars = {};
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          envVars[key.trim()] = value;
        }
      }
    });
    
    return envVars;
  } catch (error) {
    console.warn('读取.env文件失败:', error.message);
    return {};
  }
}

async function initEnvConfigs() {
  try {
    console.log('🔄 开始初始化环境变量配置...');
    
    // 读取当前.env文件
    const currentEnvVars = await readEnvFile();
    
    let created = 0;
    let updated = 0;
    let skipped = 0;
    
    for (const configDef of predefinedConfigs) {
      try {
        // 查找现有配置
        const existingConfig = await EnvConfig.findOne({
          where: { config_key: configDef.config_key }
        });
        
        const currentValue = currentEnvVars[configDef.config_key] || configDef.default_value || '';
        
        if (existingConfig) {
          // 更新现有配置的元数据，但保留当前值
          await existingConfig.update({
            config_type: configDef.config_type,
            category: configDef.category,
            description: configDef.description,
            is_required: configDef.is_required,
            is_sensitive: configDef.is_sensitive,
            default_value: configDef.default_value,
            sort_order: configDef.sort_order,
            is_active: true
          });
          
          // 如果.env文件中有值且与数据库中的值不同，则更新
          if (currentValue && existingConfig.config_value !== currentValue) {
            await existingConfig.update({ config_value: currentValue });
            updated++;
            console.log(`📝 更新配置: ${configDef.config_key}`);
          } else {
            skipped++;
          }
        } else {
          // 创建新配置
          await EnvConfig.create({
            ...configDef,
            config_value: currentValue
          });
          created++;
          console.log(`➕ 创建配置: ${configDef.config_key}`);
        }
      } catch (error) {
        console.error(`❌ 处理配置 ${configDef.config_key} 失败:`, error.message);
      }
    }
    
    console.log('');
    console.log('✅ 环境变量配置初始化完成！');
    console.log(`   创建: ${created} 个`);
    console.log(`   更新: ${updated} 个`);
    console.log(`   跳过: ${skipped} 个`);
    console.log('');
    console.log('💡 你现在可以通过后台管理系统的"环境变量配置"页面来管理这些配置');
    
  } catch (error) {
    console.error('❌ 初始化环境变量配置失败:', error.message);
    throw error;
  }
}

async function main() {
  try {
    await initEnvConfigs();
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

module.exports = { initEnvConfigs };
