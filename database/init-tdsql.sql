-- 腾讯云TDSQL-C MySQL数据库初始化脚本
-- 兼容MySQL 8.0语法，支持TDSQL-C特性

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
  INDEX idx_created_at (created_at),
  INDEX idx_status (status)
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  INDEX idx_user_id (user_id),
  INDEX idx_image_type (image_type),
  INDEX idx_created_at (created_at),
  CONSTRAINT fk_images_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='图片文件表';

-- 3. 试衣任务表
DROP TABLE IF EXISTS tryon_tasks;
CREATE TABLE tryon_tasks (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '任务ID',
  task_id VARCHAR(100) NOT NULL UNIQUE COMMENT '任务唯一标识',
  user_id INT NOT NULL COMMENT '用户ID',
  
  -- 图片关联
  person_image_id INT COMMENT '人物图片ID',
  person_image_url TEXT COMMENT '人物图片URL',
  top_garment_image_id INT COMMENT '上装图片ID',
  top_garment_url TEXT COMMENT '上装图片URL',
  bottom_garment_image_id INT COMMENT '下装图片ID',
  bottom_garment_url TEXT COMMENT '下装图片URL',
  
  -- 任务参数
  tryon_mode ENUM('top', 'bottom', 'overall', 'dress') NOT NULL COMMENT '试衣模式',
  resolution INT DEFAULT -1 COMMENT '分辨率：-1自动，其他为具体值',
  restore_face BOOLEAN DEFAULT TRUE COMMENT '是否恢复面部特征',
  
  -- 任务状态
  task_status VARCHAR(50) DEFAULT 'PENDING' COMMENT '任务状态',
  task_status_description VARCHAR(200) COMMENT '状态描述',
  submit_time TIMESTAMP COMMENT '提交时间',
  scheduled_time TIMESTAMP COMMENT '调度时间',
  start_time TIMESTAMP COMMENT '开始处理时间',
  end_time TIMESTAMP COMMENT '完成时间',
  
  -- 结果
  result_image_url TEXT COMMENT '结果图片URL',
  result_image_id INT COMMENT '结果图片ID',
  image_count INT DEFAULT 0 COMMENT '生成图片数量',
  
  -- API相关
  request_id VARCHAR(100) COMMENT 'API请求ID',
  error_code VARCHAR(50) COMMENT '错误代码',
  error_message TEXT COMMENT '错误信息',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  INDEX idx_task_id (task_id),
  INDEX idx_user_id (user_id),
  INDEX idx_task_status (task_status),
  INDEX idx_tryon_mode (tryon_mode),
  INDEX idx_created_at (created_at),
  INDEX idx_submit_time (submit_time),
  
  CONSTRAINT fk_tasks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_tasks_person_image FOREIGN KEY (person_image_id) REFERENCES images(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_tasks_top_image FOREIGN KEY (top_garment_image_id) REFERENCES images(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_tasks_bottom_image FOREIGN KEY (bottom_garment_image_id) REFERENCES images(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_tasks_result_image FOREIGN KEY (result_image_id) REFERENCES images(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI试衣任务表';

-- 插入测试数据
INSERT INTO users (openid, nickname, avatar_url) VALUES 
('test_user_001', '测试用户1', 'https://example.com/avatar1.jpg'),
('test_user_002', '测试用户2', 'https://example.com/avatar2.jpg'),
('tencent_test_001', '腾讯云测试用户', 'https://example.com/tencent.jpg');

-- 显示创建结果和统计
SELECT 'TDSQL-C Database Setup Complete!' as status;
SELECT 'Users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'Images' as table_name, COUNT(*) as record_count FROM images
UNION ALL
SELECT 'Tryon_tasks' as table_name, COUNT(*) as record_count FROM tryon_tasks;

-- 显示表结构信息
SELECT 
    TABLE_NAME as '表名',
    TABLE_COMMENT as '表注释',
    TABLE_ROWS as '记录数'
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'ai_tryClothes' 
ORDER BY TABLE_NAME;
