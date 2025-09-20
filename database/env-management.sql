-- 环境变量管理系统数据库扩展
-- 在现有数据库基础上添加环境变量管理所需的表

USE ai_tryClothes;

-- 1. 环境变量配置表
DROP TABLE IF EXISTS env_configs;
CREATE TABLE env_configs (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '配置ID',
  config_key VARCHAR(100) NOT NULL UNIQUE COMMENT '配置键名',
  config_value TEXT COMMENT '配置值',
  config_type ENUM('string', 'number', 'boolean', 'json', 'password') DEFAULT 'string' COMMENT '配置类型',
  category VARCHAR(50) NOT NULL COMMENT '配置分类',
  description VARCHAR(500) COMMENT '配置描述',
  is_required BOOLEAN DEFAULT FALSE COMMENT '是否必需',
  is_sensitive BOOLEAN DEFAULT FALSE COMMENT '是否敏感信息',
  default_value TEXT COMMENT '默认值',
  validation_rule TEXT COMMENT '验证规则（正则表达式）',
  sort_order INT DEFAULT 0 COMMENT '排序顺序',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
  created_by INT COMMENT '创建者ID',
  updated_by INT COMMENT '更新者ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  INDEX idx_config_key (config_key),
  INDEX idx_category (category),
  INDEX idx_is_active (is_active),
  INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='环境变量配置表';

-- 2. 环境变量变更历史表
DROP TABLE IF EXISTS env_change_history;
CREATE TABLE env_change_history (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '历史记录ID',
  config_key VARCHAR(100) NOT NULL COMMENT '配置键名',
  old_value TEXT COMMENT '旧值',
  new_value TEXT COMMENT '新值',
  change_type ENUM('create', 'update', 'delete') NOT NULL COMMENT '变更类型',
  change_reason VARCHAR(500) COMMENT '变更原因',
  admin_id INT COMMENT '操作管理员ID',
  admin_username VARCHAR(50) COMMENT '操作管理员用户名',
  ip_address VARCHAR(45) COMMENT '操作IP地址',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '变更时间',
  
  INDEX idx_config_key (config_key),
  INDEX idx_change_type (change_type),
  INDEX idx_admin_id (admin_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='环境变量变更历史表';

-- 初始化环境变量配置数据
INSERT INTO env_configs (config_key, config_value, config_type, category, description, is_required, is_sensitive, default_value, sort_order) VALUES

-- 数据库配置
('DATABASE_URL', '', 'string', 'database', '数据库连接字符串', TRUE, TRUE, '', 1),
('DB_HOST', 'localhost', 'string', 'database', '数据库主机地址', FALSE, FALSE, 'localhost', 2),
('DB_PORT', '3306', 'number', 'database', '数据库端口', FALSE, FALSE, '3306', 3),
('DB_USER', 'root', 'string', 'database', '数据库用户名', FALSE, TRUE, 'root', 4),
('DB_PASSWORD', '', 'password', 'database', '数据库密码', FALSE, TRUE, '', 5),
('DB_NAME', 'ai_tryClothes', 'string', 'database', '数据库名称', FALSE, FALSE, 'ai_tryClothes', 6),

-- API配置
('DASHSCOPE_API_KEY', '', 'password', 'api', '阿里云百炼API密钥', TRUE, TRUE, '', 10),
('JWT_SECRET', '', 'password', 'api', 'JWT密钥', TRUE, TRUE, '', 11),
('JWT_EXPIRES_IN', '24h', 'string', 'api', 'JWT过期时间', FALSE, FALSE, '24h', 12),

-- OSS配置
('OSS_REGION', 'oss-cn-beijing', 'string', 'oss', 'OSS区域', FALSE, FALSE, 'oss-cn-beijing', 20),
('OSS_ACCESS_KEY_ID', '', 'password', 'oss', 'OSS访问密钥ID', FALSE, TRUE, '', 21),
('OSS_ACCESS_KEY_SECRET', '', 'password', 'oss', 'OSS访问密钥Secret', FALSE, TRUE, '', 22),
('OSS_BUCKET', '', 'string', 'oss', 'OSS存储桶名称', FALSE, FALSE, '', 23),
('OSS_UPLOAD_PATH', 'ai-fitting/', 'string', 'oss', 'OSS上传路径前缀', FALSE, FALSE, 'ai-fitting/', 24),
('OSS_CDN_DOMAIN', '', 'string', 'oss', 'OSS CDN域名', FALSE, FALSE, '', 25),

-- 服务器配置
('PORT', '3000', 'number', 'server', '服务器端口', FALSE, FALSE, '3000', 30),
('NODE_ENV', 'development', 'string', 'server', '运行环境', FALSE, FALSE, 'development', 31),
('CORS_ORIGIN', '*', 'string', 'server', 'CORS允许的源', FALSE, FALSE, '*', 32),

-- 业务配置
('MAX_FILE_SIZE', '5242880', 'number', 'business', '最大文件大小（字节）', FALSE, FALSE, '5242880', 40),
('ALLOWED_IMAGE_TYPES', '["jpg","jpeg","png","bmp","heic","webp"]', 'json', 'business', '允许的图片格式', FALSE, FALSE, '["jpg","jpeg","png","bmp","heic","webp"]', 41),
('MAX_CONCURRENT_TASKS', '5', 'number', 'business', '最大并发任务数', FALSE, FALSE, '5', 42),
('API_TIMEOUT', '30000', 'number', 'business', 'API超时时间（毫秒）', FALSE, FALSE, '30000', 43);

-- 显示创建结果
SELECT '✅ 环境变量管理系统数据库表创建成功！' as message;

-- 显示新增的表
SELECT 
    TABLE_NAME as '新增表名', 
    TABLE_COMMENT as '说明',
    TABLE_ROWS as '记录数'
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'ai_tryClothes' 
AND TABLE_NAME IN ('env_configs', 'env_change_history')
ORDER BY TABLE_NAME;
