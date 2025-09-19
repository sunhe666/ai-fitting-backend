-- PlanetScale数据库初始化脚本
-- 注意：PlanetScale不支持外键约束，使用应用层约束

-- 用户表
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  openid VARCHAR(100) NOT NULL UNIQUE COMMENT '微信openid',
  nickname VARCHAR(50) DEFAULT '微信用户' COMMENT '用户昵称',
  avatar_url TEXT COMMENT '头像URL',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  INDEX idx_openid (openid),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 图片表
CREATE TABLE images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '用户ID',
  filename VARCHAR(255) NOT NULL COMMENT '文件名',
  original_name VARCHAR(255) COMMENT '原始文件名',
  file_path VARCHAR(500) NOT NULL COMMENT '文件路径',
  file_url VARCHAR(500) COMMENT '访问URL',
  file_size INT DEFAULT 0 COMMENT '文件大小(字节)',
  mime_type VARCHAR(100) COMMENT 'MIME类型',
  image_type ENUM('person', 'top_garment', 'bottom_garment', 'dress', 'result') NOT NULL COMMENT '图片类型',
  width INT COMMENT '图片宽度',
  height INT COMMENT '图片高度',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  INDEX idx_user_id (user_id),
  INDEX idx_image_type (image_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='图片表';

-- 试衣任务表
CREATE TABLE tryon_tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id VARCHAR(100) NOT NULL UNIQUE COMMENT '任务ID',
  user_id INT NOT NULL COMMENT '用户ID',
  
  -- 图片关联
  person_image_id INT COMMENT '人物图片ID',
  person_image_url TEXT COMMENT '人物图片URL',
  top_garment_image_id INT COMMENT '上装图片ID', 
  top_garment_url TEXT COMMENT '上装图片URL',
  bottom_garment_image_id INT COMMENT '下装图片ID',
  bottom_garment_url TEXT COMMENT '下装图片URL',
  
  -- 任务配置
  tryon_mode ENUM('top', 'bottom', 'overall', 'dress') NOT NULL COMMENT '试衣模式',
  resolution INT DEFAULT -1 COMMENT '分辨率(-1为自动)',
  restore_face BOOLEAN DEFAULT TRUE COMMENT '是否恢复面部',
  
  -- 任务状态
  task_status VARCHAR(50) DEFAULT 'PENDING' COMMENT '任务状态',
  task_status_description VARCHAR(200) COMMENT '状态描述',
  submit_time TIMESTAMP COMMENT '提交时间',
  scheduled_time TIMESTAMP COMMENT '调度时间', 
  start_time TIMESTAMP COMMENT '开始时间',
  end_time TIMESTAMP COMMENT '结束时间',
  
  -- 结果
  result_image_url TEXT COMMENT '结果图片URL',
  result_image_id INT COMMENT '结果图片ID',
  image_count INT DEFAULT 0 COMMENT '生成图片数量',
  
  -- API相关
  request_id VARCHAR(100) COMMENT '请求ID',
  error_code VARCHAR(50) COMMENT '错误代码',
  error_message TEXT COMMENT '错误信息',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  INDEX idx_task_id (task_id),
  INDEX idx_user_id (user_id),
  INDEX idx_task_status (task_status),
  INDEX idx_tryon_mode (tryon_mode),
  INDEX idx_created_at (created_at),
  INDEX idx_submit_time (submit_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='试衣任务表';

-- 插入测试数据（可选）
INSERT INTO users (openid, nickname, avatar_url) VALUES 
('test_user_001', '测试用户1', 'https://example.com/avatar1.jpg'),
('test_user_002', '测试用户2', 'https://example.com/avatar2.jpg');

-- 显示创建结果
SELECT 'Database tables created successfully!' as status;
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as image_count FROM images;  
SELECT COUNT(*) as task_count FROM tryon_tasks;
