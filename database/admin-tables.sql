-- AI试衣项目后台管理系统数据库扩展
-- 在现有数据库基础上添加后台管理所需的表

USE ai_tryClothes;

-- 1. 管理员表
DROP TABLE IF EXISTS admins;
CREATE TABLE admins (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '管理员ID',
  username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
  password VARCHAR(255) NOT NULL COMMENT '密码（加密）',
  real_name VARCHAR(50) COMMENT '真实姓名',
  email VARCHAR(100) COMMENT '邮箱',
  phone VARCHAR(20) COMMENT '手机号',
  avatar_url TEXT COMMENT '头像URL',
  role ENUM('super_admin', 'admin', 'operator') DEFAULT 'operator' COMMENT '角色：超级管理员、管理员、操作员',
  permissions JSON COMMENT '权限配置',
  last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
  last_login_ip VARCHAR(45) COMMENT '最后登录IP',
  status TINYINT DEFAULT 1 COMMENT '状态：1-正常，0-禁用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  created_by INT COMMENT '创建者ID',
  
  INDEX idx_username (username),
  INDEX idx_status (status),
  INDEX idx_role (role),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员表';

-- 2. 操作日志表
DROP TABLE IF EXISTS admin_logs;
CREATE TABLE admin_logs (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '日志ID',
  admin_id INT COMMENT '管理员ID',
  admin_username VARCHAR(50) COMMENT '管理员用户名',
  action VARCHAR(100) NOT NULL COMMENT '操作类型',
  resource VARCHAR(100) COMMENT '操作资源',
  resource_id VARCHAR(100) COMMENT '资源ID',
  method VARCHAR(20) COMMENT 'HTTP方法',
  url VARCHAR(500) COMMENT '请求URL',
  ip_address VARCHAR(45) COMMENT 'IP地址',
  user_agent TEXT COMMENT '用户代理',
  request_data JSON COMMENT '请求数据',
  response_status INT COMMENT '响应状态码',
  response_message TEXT COMMENT '响应消息',
  processing_time INT COMMENT '处理时间（毫秒）',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  
  INDEX idx_admin_id (admin_id),
  INDEX idx_action (action),
  INDEX idx_resource (resource),
  INDEX idx_ip_address (ip_address),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员操作日志表';

-- 3. 系统统计表（缓存统计数据）
DROP TABLE IF EXISTS system_stats;
CREATE TABLE system_stats (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '统计ID',
  stat_date DATE NOT NULL COMMENT '统计日期',
  stat_type ENUM('daily', 'weekly', 'monthly') NOT NULL COMMENT '统计类型',
  
  -- 用户相关统计
  total_users INT DEFAULT 0 COMMENT '总用户数',
  new_users INT DEFAULT 0 COMMENT '新增用户数',
  active_users INT DEFAULT 0 COMMENT '活跃用户数',
  
  -- 任务相关统计
  total_tasks INT DEFAULT 0 COMMENT '总任务数',
  new_tasks INT DEFAULT 0 COMMENT '新增任务数',
  completed_tasks INT DEFAULT 0 COMMENT '完成任务数',
  failed_tasks INT DEFAULT 0 COMMENT '失败任务数',
  
  -- 试衣模式统计
  top_tasks INT DEFAULT 0 COMMENT '上装试衣任务数',
  bottom_tasks INT DEFAULT 0 COMMENT '下装试衣任务数',
  outfit_tasks INT DEFAULT 0 COMMENT '套装试衣任务数',
  dress_tasks INT DEFAULT 0 COMMENT '连衣裙试衣任务数',
  
  -- 图片相关统计
  total_images INT DEFAULT 0 COMMENT '总图片数',
  new_images INT DEFAULT 0 COMMENT '新增图片数',
  
  -- 系统性能统计
  avg_processing_time DECIMAL(10,2) COMMENT '平均处理时间（秒）',
  success_rate DECIMAL(5,2) COMMENT '成功率（%）',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  UNIQUE KEY uk_date_type (stat_date, stat_type),
  INDEX idx_stat_date (stat_date),
  INDEX idx_stat_type (stat_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统统计表';

-- 4. 系统公告表
DROP TABLE IF EXISTS system_announcements;
CREATE TABLE system_announcements (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '公告ID',
  title VARCHAR(200) NOT NULL COMMENT '公告标题',
  content TEXT COMMENT '公告内容',
  type ENUM('info', 'warning', 'error', 'success') DEFAULT 'info' COMMENT '公告类型',
  priority TINYINT DEFAULT 1 COMMENT '优先级：1-低，2-中，3-高',
  target_users ENUM('all', 'new', 'active') DEFAULT 'all' COMMENT '目标用户',
  start_time TIMESTAMP NULL COMMENT '开始时间',
  end_time TIMESTAMP NULL COMMENT '结束时间',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否激活',
  created_by INT COMMENT '创建者ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  INDEX idx_type (type),
  INDEX idx_is_active (is_active),
  INDEX idx_start_time (start_time),
  INDEX idx_end_time (end_time),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统公告表';

-- 插入默认管理员账号（用户名：admin，密码：123456，需要在实际使用时修改）
-- 注意：这里的密码是明文，实际应用中需要使用bcrypt等方式加密
INSERT INTO admins (username, password, real_name, role, permissions, status) VALUES
('admin', '$2b$10$N9qo8uLOickgx2ZMRZoMye.IKT.Qj.FhZm2Lx1sOcVvKQZ8h6k9O2', '系统管理员', 'super_admin', 
'{"users": {"view": true, "create": true, "edit": true, "delete": true}, 
  "tasks": {"view": true, "create": true, "edit": true, "delete": true}, 
  "images": {"view": true, "create": true, "edit": true, "delete": true}, 
  "admins": {"view": true, "create": true, "edit": true, "delete": true}, 
  "logs": {"view": true}, 
  "stats": {"view": true}, 
  "system": {"view": true, "config": true}}', 1);

-- 插入一些系统配置
INSERT INTO system_config (config_key, config_value, config_type, description, is_system) VALUES
('admin_session_timeout', '3600', 'number', '管理员会话超时时间（秒）', TRUE),
('max_login_attempts', '5', 'number', '最大登录尝试次数', TRUE),
('login_lockout_time', '300', 'number', '登录锁定时间（秒）', TRUE),
('enable_operation_log', 'true', 'boolean', '是否启用操作日志', TRUE),
('log_retention_days', '90', 'number', '日志保留天数', TRUE),
('enable_stats_cache', 'true', 'boolean', '是否启用统计缓存', TRUE),
('stats_update_interval', '3600', 'number', '统计数据更新间隔（秒）', TRUE);

-- 显示创建结果
SELECT '✅ 后台管理系统数据库表创建成功！' as message;

-- 显示新增的表
SELECT 
    TABLE_NAME as '新增表名', 
    TABLE_COMMENT as '说明',
    TABLE_ROWS as '记录数'
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'ai_tryClothes' 
AND TABLE_NAME IN ('admins', 'admin_logs', 'system_stats', 'system_announcements')
ORDER BY TABLE_NAME;
