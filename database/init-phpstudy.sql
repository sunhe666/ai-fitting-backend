-- AI试衣项目数据库初始化脚本（phpStudy版本）
-- 数据库名：ai_tryClothes
-- 字符集：utf8mb4
-- 排序规则：utf8mb4_unicode_ci

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS ai_tryClothes 
DEFAULT CHARACTER SET utf8mb4 
DEFAULT COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE ai_tryClothes;

-- 1. 用户表
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
  openid VARCHAR(64) NOT NULL UNIQUE COMMENT '微信用户唯一标识',
  unionid VARCHAR(64) COMMENT '微信开放平台唯一标识',
  nickname VARCHAR(100) COMMENT '用户昵称',
  avatar_url TEXT COMMENT '头像URL',
  gender TINYINT DEFAULT 0 COMMENT '性别：0-未知，1-男，2-女',
  city VARCHAR(50) COMMENT '城市',
  province VARCHAR(50) COMMENT '省份',
  country VARCHAR(50) COMMENT '国家',
  language VARCHAR(20) DEFAULT 'zh_CN' COMMENT '语言',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
  status TINYINT DEFAULT 1 COMMENT '状态：1-正常，0-禁用',
  
  INDEX idx_openid (openid),
  INDEX idx_unionid (unionid),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户信息表';

-- 2. 图片文件表
DROP TABLE IF EXISTS images;
CREATE TABLE images (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '图片ID',
  user_id INT COMMENT '上传用户ID',
  filename VARCHAR(255) NOT NULL COMMENT '文件名',
  original_name VARCHAR(255) COMMENT '原始文件名',
  file_path VARCHAR(500) NOT NULL COMMENT '文件路径',
  file_url VARCHAR(500) COMMENT '访问URL',
  file_size INT COMMENT '文件大小（字节）',
  mime_type VARCHAR(100) COMMENT 'MIME类型',
  width INT COMMENT '图片宽度',
  height INT COMMENT '图片高度',
  image_type ENUM('person', 'top_garment', 'bottom_garment', 'result') NOT NULL COMMENT '图片类型',
  upload_source VARCHAR(50) DEFAULT 'miniprogram' COMMENT '上传来源',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
  status TINYINT DEFAULT 1 COMMENT '状态：1-正常，0-删除',
  
  INDEX idx_user_id (user_id),
  INDEX idx_image_type (image_type),
  INDEX idx_created_at (created_at),
  INDEX idx_filename (filename)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='图片文件表';

-- 3. 试衣任务表
DROP TABLE IF EXISTS tryon_tasks;
CREATE TABLE tryon_tasks (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '任务ID',
  task_id VARCHAR(100) NOT NULL UNIQUE COMMENT 'AI服务返回的任务ID',
  user_id INT COMMENT '用户ID',
  
  -- 输入参数
  person_image_id INT COMMENT '模特图片ID',
  person_image_url TEXT COMMENT '模特图片URL',
  top_garment_image_id INT COMMENT '上装图片ID',
  top_garment_url TEXT COMMENT '上装图片URL',
  bottom_garment_image_id INT COMMENT '下装图片ID',
  bottom_garment_url TEXT COMMENT '下装图片URL',
  
  -- 任务配置
  tryon_mode ENUM('top', 'bottom', 'outfit', 'dress') NOT NULL COMMENT '试衣模式',
  resolution INT DEFAULT -1 COMMENT '输出分辨率：-1=原图，1024，1280',
  restore_face BOOLEAN DEFAULT TRUE COMMENT '是否保留原人脸',
  
  -- 任务状态
  task_status VARCHAR(50) NOT NULL DEFAULT 'PENDING' COMMENT '任务状态',
  task_status_description VARCHAR(200) COMMENT '状态描述',
  
  -- 时间信息
  submit_time TIMESTAMP NULL COMMENT '提交时间',
  scheduled_time TIMESTAMP NULL COMMENT '调度时间',
  start_time TIMESTAMP NULL COMMENT '开始处理时间',
  end_time TIMESTAMP NULL COMMENT '完成时间',
  
  -- 结果信息
  result_image_url TEXT COMMENT '结果图片URL',
  result_image_id INT COMMENT '结果图片ID',
  image_count INT DEFAULT 0 COMMENT '生成图片数量',
  
  -- API相关
  request_id VARCHAR(100) COMMENT 'API请求ID',
  error_code VARCHAR(100) COMMENT '错误码',
  error_message TEXT COMMENT '错误信息',
  
  -- 元数据
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  INDEX idx_task_id (task_id),
  INDEX idx_user_id (user_id),
  INDEX idx_task_status (task_status),
  INDEX idx_tryon_mode (tryon_mode),
  INDEX idx_created_at (created_at),
  INDEX idx_submit_time (submit_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='试衣任务表';

-- 4. 用户试衣历史表
DROP TABLE IF EXISTS user_tryon_history;
CREATE TABLE user_tryon_history (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '历史记录ID',
  user_id INT NOT NULL COMMENT '用户ID',
  task_id INT NOT NULL COMMENT '任务ID',
  tryon_mode ENUM('top', 'bottom', 'outfit', 'dress') NOT NULL COMMENT '试衣模式',
  
  -- 快照数据（避免关联查询）
  person_image_url TEXT COMMENT '模特图片URL',
  garment_image_url TEXT COMMENT '服装图片URL',
  result_image_url TEXT COMMENT '结果图片URL',
  
  -- 状态信息
  is_successful BOOLEAN DEFAULT FALSE COMMENT '是否成功',
  processing_time INT COMMENT '处理耗时（秒）',
  
  -- 用户操作
  is_saved BOOLEAN DEFAULT FALSE COMMENT '是否保存到相册',
  is_shared BOOLEAN DEFAULT FALSE COMMENT '是否分享过',
  is_favorited BOOLEAN DEFAULT FALSE COMMENT '是否收藏',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  
  INDEX idx_user_id (user_id),
  INDEX idx_task_id (task_id),
  INDEX idx_created_at (created_at),
  INDEX idx_is_successful (is_successful)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户试衣历史表';

-- 5. 系统配置表
DROP TABLE IF EXISTS system_config;
CREATE TABLE system_config (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '配置ID',
  config_key VARCHAR(100) NOT NULL UNIQUE COMMENT '配置键',
  config_value TEXT COMMENT '配置值',
  config_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string' COMMENT '配置类型',
  description VARCHAR(500) COMMENT '配置描述',
  is_system BOOLEAN DEFAULT FALSE COMMENT '是否系统配置',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  INDEX idx_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- 初始化系统配置数据
INSERT INTO system_config (config_key, config_value, config_type, description, is_system) VALUES
('max_file_size', '5242880', 'number', '最大文件大小（字节）5MB', TRUE),
('allowed_image_types', '["jpg","jpeg","png","bmp","heic","webp"]', 'json', '允许的图片格式', TRUE),
('max_history_records', '50', 'number', '用户最大历史记录数', TRUE),
('default_resolution', '-1', 'number', '默认输出分辨率', TRUE),
('enable_face_restore', 'true', 'boolean', '默认启用人脸还原', TRUE),
('api_timeout', '30000', 'number', 'API超时时间（毫秒）', TRUE),
('max_concurrent_tasks', '5', 'number', '最大并发任务数', TRUE),
('image_url_expire_hours', '24', 'number', '图片URL有效期（小时）', TRUE);

-- 创建测试用户（可选）
INSERT INTO users (openid, nickname, avatar_url, status) VALUES
('test_openid_001', '测试用户1', 'https://example.com/avatar1.jpg', 1);

-- 显示创建结果
SELECT '✅ 数据库 ai_tryClothes 初始化成功！' as message;

-- 显示所有表
SELECT 
    TABLE_NAME as '表名', 
    TABLE_COMMENT as '说明',
    TABLE_ROWS as '记录数'
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'ai_tryClothes' 
ORDER BY TABLE_NAME;
