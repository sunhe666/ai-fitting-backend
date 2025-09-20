/**
 * 后台管理系统路由
 * 提供管理员相关的API接口
 */

const express = require('express');
const router = express.Router();
const { AdminService, StatsService, TryonService, UserService, EnvService } = require('../services');
const { formatErrorResponse, createSuccessResponse } = require('../utils/errorHandler');

// 中间件：验证管理员身份
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json(formatErrorResponse('Unauthorized', '请先登录'));
    }

    const admin = await AdminService.verifyToken(token);
    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json(formatErrorResponse('Unauthorized', error.message));
  }
};

// 中间件：检查权限
const checkPermission = (resource, action) => {
  return (req, res, next) => {
    if (!AdminService.hasPermission(req.admin, resource, action)) {
      return res.status(403).json(formatErrorResponse('Forbidden', '权限不足'));
    }
    next();
  };
};

// 中间件：记录操作日志
const logOperation = (action, resource) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    
    // 保存原始的 json 方法
    const originalJson = res.json;
    
    // 重写 json 方法以记录响应
    res.json = function(data) {
      const processingTime = Date.now() - startTime;
      
      // 记录操作日志
      AdminService.createLog({
        admin_id: req.admin?.id,
        admin_username: req.admin?.username,
        action,
        resource,
        resource_id: req.params.id || req.params.userId || req.params.taskId,
        method: req.method,
        url: req.originalUrl,
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('User-Agent'),
        request_data: req.method !== 'GET' ? req.body : null,
        response_status: res.statusCode,
        response_message: data.message || (data.success ? '操作成功' : '操作失败'),
        processing_time: processingTime
      });
      
      // 调用原始的 json 方法
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// ==================== 认证相关接口 ====================

/**
 * 管理员登录
 * POST /api/admin/auth/login
 */
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      const errorResponse = formatErrorResponse('InvalidParameter', '用户名和密码不能为空');
      return res.status(errorResponse.status).json(errorResponse);
    }
    
    const result = await AdminService.login(username, password, req.ip);
    const successResponse = createSuccessResponse(result, '登录成功');
    res.json(successResponse);
  } catch (error) {
    console.error('管理员登录失败:', error);
    const errorResponse = formatErrorResponse('LoginFailed', error.message);
    res.status(errorResponse.status).json(errorResponse);
  }
});

/**
 * 获取当前管理员信息
 * GET /api/admin/auth/me
 */
router.get('/auth/me', authenticateAdmin, async (req, res) => {
  try {
    const successResponse = createSuccessResponse(req.admin, '获取用户信息成功');
    res.json(successResponse);
  } catch (error) {
    console.error('获取管理员信息失败:', error);
    const errorResponse = formatErrorResponse('InternalError', error.message);
    res.status(errorResponse.status).json(errorResponse);
  }
});

/**
 * 管理员登出
 * POST /api/admin/auth/logout
 */
router.post('/auth/logout', authenticateAdmin, logOperation('LOGOUT', 'auth'), (req, res) => {
  const successResponse = createSuccessResponse(null, '登出成功');
  res.json(successResponse);
});

// ==================== 仪表盘统计接口 ====================

/**
 * 获取仪表盘概览数据
 * GET /api/admin/dashboard/overview
 */
router.get('/dashboard/overview', 
  authenticateAdmin, 
  checkPermission('stats', 'view'),
  logOperation('VIEW_DASHBOARD', 'dashboard'),
  async (req, res) => {
    try {
      const stats = await StatsService.getRealTimeStats();
      const successResponse = createSuccessResponse(stats, '获取概览数据成功');
      res.json(successResponse);
    } catch (error) {
      console.error('获取概览数据失败:', error);
      const errorResponse = formatErrorResponse('InternalError', error.message);
      res.status(errorResponse.status).json(errorResponse);
    }
  }
);

/**
 * 获取历史统计数据
 * GET /api/admin/dashboard/history
 */
router.get('/dashboard/history',
  authenticateAdmin,
  checkPermission('stats', 'view'),
  async (req, res) => {
    try {
      const { stat_type, start_date, end_date, limit } = req.query;
      const options = { stat_type, start_date, end_date, limit };
      
      const stats = await StatsService.getHistoryStats(options);
      const successResponse = createSuccessResponse(stats, '获取历史统计成功');
      res.json(successResponse);
    } catch (error) {
      console.error('获取历史统计失败:', error);
      const errorResponse = formatErrorResponse('InternalError', error.message);
      res.status(errorResponse.status).json(errorResponse);
    }
  }
);

// ==================== 用户管理接口 ====================

/**
 * 获取用户列表
 * GET /api/admin/users
 */
router.get('/users',
  authenticateAdmin,
  checkPermission('users', 'view'),
  logOperation('VIEW_USERS', 'users'),
  async (req, res) => {
    try {
      const { page, limit, status, keyword } = req.query;
      const options = { 
        page: parseInt(page) || 1, 
        limit: parseInt(limit) || 20, 
        status, 
        keyword 
      };
      
      const result = await UserService.getUserList(options);
      const successResponse = createSuccessResponse(result, '获取用户列表成功');
      res.json(successResponse);
    } catch (error) {
      console.error('获取用户列表失败:', error);
      const errorResponse = formatErrorResponse('InternalError', error.message);
      res.status(errorResponse.status).json(errorResponse);
    }
  }
);

/**
 * 获取用户详情
 * GET /api/admin/users/:id
 */
router.get('/users/:id',
  authenticateAdmin,
  checkPermission('users', 'view'),
  logOperation('VIEW_USER', 'user'),
  async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await UserService.getUserById(userId);
      const stats = await UserService.getUserStats(userId);
      
      const successResponse = createSuccessResponse({
        user,
        stats
      }, '获取用户详情成功');
      res.json(successResponse);
    } catch (error) {
      console.error('获取用户详情失败:', error);
      const errorResponse = formatErrorResponse('InternalError', error.message);
      res.status(errorResponse.status).json(errorResponse);
    }
  }
);

/**
 * 更新用户状态
 * PUT /api/admin/users/:id/status
 */
router.put('/users/:id/status',
  authenticateAdmin,
  checkPermission('users', 'edit'),
  logOperation('UPDATE_USER_STATUS', 'user'),
  async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (![0, 1].includes(status)) {
        const errorResponse = formatErrorResponse('InvalidParameter', '状态值无效');
        return res.status(errorResponse.status).json(errorResponse);
      }
      
      const user = await UserService.updateUserStatus(userId, status);
      const successResponse = createSuccessResponse(user, '更新用户状态成功');
      res.json(successResponse);
    } catch (error) {
      console.error('更新用户状态失败:', error);
      const errorResponse = formatErrorResponse('InternalError', error.message);
      res.status(errorResponse.status).json(errorResponse);
    }
  }
);

// ==================== 任务管理接口 ====================

/**
 * 获取任务列表
 * GET /api/admin/tasks
 */
router.get('/tasks',
  authenticateAdmin,
  checkPermission('tasks', 'view'),
  logOperation('VIEW_TASKS', 'tasks'),
  async (req, res) => {
    try {
      const { page, limit, status, mode, user_id, start_date, end_date } = req.query;
      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        status,
        mode,
        user_id: user_id ? parseInt(user_id) : null,
        start_date,
        end_date
      };
      
      const result = await TryonService.getTaskList(options);
      const successResponse = createSuccessResponse(result, '获取任务列表成功');
      res.json(successResponse);
    } catch (error) {
      console.error('获取任务列表失败:', error);
      const errorResponse = formatErrorResponse('InternalError', error.message);
      res.status(errorResponse.status).json(errorResponse);
    }
  }
);

/**
 * 获取任务详情
 * GET /api/admin/tasks/:taskId
 */
router.get('/tasks/:taskId',
  authenticateAdmin,
  checkPermission('tasks', 'view'),
  logOperation('VIEW_TASK', 'task'),
  async (req, res) => {
    try {
      const { taskId } = req.params;
      const task = await TryonService.getTaskById(taskId);
      
      const successResponse = createSuccessResponse(task, '获取任务详情成功');
      res.json(successResponse);
    } catch (error) {
      console.error('获取任务详情失败:', error);
      const errorResponse = formatErrorResponse('InternalError', error.message);
      res.status(errorResponse.status).json(errorResponse);
    }
  }
);

/**
 * 删除任务（管理员权限）
 * DELETE /api/admin/tasks/:taskId
 */
router.delete('/tasks/:taskId',
  authenticateAdmin,
  checkPermission('tasks', 'delete'),
  logOperation('DELETE_TASK', 'task'),
  async (req, res) => {
    try {
      const { taskId } = req.params;
      const result = await TryonService.deleteTaskByAdmin(taskId);
      
      const successResponse = createSuccessResponse(
        { deleted: result },
        '任务删除成功'
      );
      res.json(successResponse);
    } catch (error) {
      console.error('删除任务失败:', error);
      const errorResponse = formatErrorResponse('InternalError', error.message);
      res.status(errorResponse.status).json(errorResponse);
    }
  }
);

// ==================== 管理员管理接口 ====================

/**
 * 获取管理员列表
 * GET /api/admin/admins
 */
router.get('/admins',
  authenticateAdmin,
  checkPermission('admins', 'view'),
  logOperation('VIEW_ADMINS', 'admins'),
  async (req, res) => {
    try {
      const { page, limit, role, status, keyword } = req.query;
      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        role,
        status: status !== undefined ? parseInt(status) : null,
        keyword
      };
      
      const result = await AdminService.getAdminList(options);
      const successResponse = createSuccessResponse(result, '获取管理员列表成功');
      res.json(successResponse);
    } catch (error) {
      console.error('获取管理员列表失败:', error);
      const errorResponse = formatErrorResponse('InternalError', error.message);
      res.status(errorResponse.status).json(errorResponse);
    }
  }
);

/**
 * 创建管理员
 * POST /api/admin/admins
 */
router.post('/admins',
  authenticateAdmin,
  checkPermission('admins', 'create'),
  logOperation('CREATE_ADMIN', 'admin'),
  async (req, res) => {
    try {
      const adminData = req.body;
      const result = await AdminService.createAdmin(adminData, req.admin.id);
      
      const successResponse = createSuccessResponse(result, '创建管理员成功');
      res.json(successResponse);
    } catch (error) {
      console.error('创建管理员失败:', error);
      const errorResponse = formatErrorResponse('InternalError', error.message);
      res.status(errorResponse.status).json(errorResponse);
    }
  }
);

/**
 * 获取管理员详情
 * GET /api/admin/admins/:id
 */
router.get('/admins/:id',
  authenticateAdmin,
  checkPermission('admins', 'view'),
  logOperation('VIEW_ADMIN', 'admin'),
  async (req, res) => {
    try {
      const adminId = parseInt(req.params.id);
      const admin = await AdminService.getAdminById(adminId);
      
      const successResponse = createSuccessResponse(admin, '获取管理员详情成功');
      res.json(successResponse);
    } catch (error) {
      console.error('获取管理员详情失败:', error);
      const errorResponse = formatErrorResponse('InternalError', error.message);
      res.status(errorResponse.status).json(errorResponse);
    }
  }
);

/**
 * 更新管理员信息
 * PUT /api/admin/admins/:id
 */
router.put('/admins/:id',
  authenticateAdmin,
  checkPermission('admins', 'edit'),
  logOperation('UPDATE_ADMIN', 'admin'),
  async (req, res) => {
    try {
      const adminId = parseInt(req.params.id);
      const updateData = req.body;
      
      const result = await AdminService.updateAdmin(adminId, updateData, req.admin.id);
      const successResponse = createSuccessResponse(result, '更新管理员信息成功');
      res.json(successResponse);
    } catch (error) {
      console.error('更新管理员信息失败:', error);
      const errorResponse = formatErrorResponse('InternalError', error.message);
      res.status(errorResponse.status).json(errorResponse);
    }
  }
);

/**
 * 删除管理员
 * DELETE /api/admin/admins/:id
 */
router.delete('/admins/:id',
  authenticateAdmin,
  checkPermission('admins', 'delete'),
  logOperation('DELETE_ADMIN', 'admin'),
  async (req, res) => {
    try {
      const adminId = parseInt(req.params.id);
      const result = await AdminService.deleteAdmin(adminId, req.admin.id);
      
      const successResponse = createSuccessResponse(
        { deleted: result },
        '删除管理员成功'
      );
      res.json(successResponse);
    } catch (error) {
      console.error('删除管理员失败:', error);
      const errorResponse = formatErrorResponse('InternalError', error.message);
      res.status(errorResponse.status).json(errorResponse);
    }
  }
);

// ==================== 操作日志接口 ====================

/**
 * 获取操作日志
 * GET /api/admin/logs
 */
router.get('/logs',
  authenticateAdmin,
  checkPermission('logs', 'view'),
  async (req, res) => {
    try {
      const { page, limit, admin_id, action, resource, start_date, end_date } = req.query;
      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 50,
        admin_id: admin_id ? parseInt(admin_id) : null,
        action,
        resource,
        start_date,
        end_date
      };
      
      const result = await AdminService.getAdminLogs(options);
      const successResponse = createSuccessResponse(result, '获取操作日志成功');
      res.json(successResponse);
    } catch (error) {
      console.error('获取操作日志失败:', error);
      const errorResponse = formatErrorResponse('InternalError', error.message);
      res.status(errorResponse.status).json(errorResponse);
    }
  }
);

// ==================== 系统管理接口 ====================

/**
 * 生成统计数据
 * POST /api/admin/system/generate-stats
 */
router.post('/system/generate-stats',
  authenticateAdmin,
  checkPermission('system', 'config'),
  logOperation('GENERATE_STATS', 'system'),
  async (req, res) => {
    try {
      const { stat_type, stat_date } = req.body;
      const result = await StatsService.generateStats(stat_type, stat_date);
      
      const successResponse = createSuccessResponse(result, '生成统计数据成功');
      res.json(successResponse);
    } catch (error) {
      console.error('生成统计数据失败:', error);
      const errorResponse = formatErrorResponse('InternalError', error.message);
      res.status(errorResponse.status).json(errorResponse);
    }
  }
);

/**
 * 清理过期数据
 * POST /api/admin/system/cleanup
 */
router.post('/system/cleanup',
  authenticateAdmin,
  checkPermission('system', 'config'),
  logOperation('CLEANUP_DATA', 'system'),
  async (req, res) => {
    try {
      const { type, days } = req.body;
      let result = {};
      
      if (type === 'tasks' || !type) {
        result.tasks = await TryonService.cleanupExpiredTasks(days || 7);
      }
      
      if (type === 'stats' || !type) {
        result.stats = await StatsService.cleanupExpiredStats(days || 90);
      }
      
      const successResponse = createSuccessResponse(result, '清理过期数据成功');
      res.json(successResponse);
    } catch (error) {
      console.error('清理过期数据失败:', error);
      const errorResponse = formatErrorResponse('InternalError', error.message);
      res.status(errorResponse.status).json(errorResponse);
    }
  }
);

// ==================== 环境变量管理接口 ====================

/**
 * 获取环境变量配置列表
 * GET /api/admin/env/configs
 */
router.get('/env/configs',
  authenticateAdmin,
  checkPermission('system', 'view'),
  logOperation('VIEW_ENV_CONFIGS', 'env'),
  async (req, res) => {
    try {
      const { category, is_active, keyword } = req.query;
      const options = { category, is_active, keyword };
      
      const result = await EnvService.getEnvConfigs(options);
      const successResponse = createSuccessResponse(result, '获取环境变量配置成功');
      res.json(successResponse);
    } catch (error) {
      console.error('获取环境变量配置失败:', error);
      const errorResponse = formatErrorResponse('InternalError', error.message);
      res.status(errorResponse.status).json(errorResponse);
    }
  }
);

/**
 * 获取单个环境变量配置
 * GET /api/admin/env/configs/:key
 */
router.get('/env/configs/:key',
  authenticateAdmin,
  checkPermission('system', 'view'),
  async (req, res) => {
    try {
      const { key } = req.params;
      const result = await EnvService.getEnvConfig(key);
      
      const successResponse = createSuccessResponse(result, '获取配置详情成功');
      res.json(successResponse);
    } catch (error) {
      console.error('获取配置详情失败:', error);
      const errorResponse = formatErrorResponse('InternalError', error.message);
      res.status(errorResponse.status).json(errorResponse);
    }
  }
);

/**
 * 更新环境变量配置
 * PUT /api/admin/env/configs/:key
 */
router.put('/env/configs/:key',
  authenticateAdmin,
  checkPermission('system', 'config'),
  logOperation('UPDATE_ENV_CONFIG', 'env'),
  async (req, res) => {
    try {
      const { key } = req.params;
      const { config_value, change_reason } = req.body;
      
      const adminInfo = {
        id: req.admin.id,
        username: req.admin.username,
        ip_address: req.ip
      };
      
      const result = await EnvService.updateEnvConfig(key, config_value, adminInfo, change_reason);
      const successResponse = createSuccessResponse(result, '更新环境变量配置成功');
      res.json(successResponse);
    } catch (error) {
      console.error('更新环境变量配置失败:', error);
      const errorResponse = formatErrorResponse('InternalError', error.message);
      res.status(errorResponse.status).json(errorResponse);
    }
  }
);

/**
 * 批量更新环境变量配置
 * PUT /api/admin/env/configs
 */
router.put('/env/configs',
  authenticateAdmin,
  checkPermission('system', 'config'),
  logOperation('BATCH_UPDATE_ENV_CONFIG', 'env'),
  async (req, res) => {
    try {
      const { updates, change_reason } = req.body;
      
      if (!Array.isArray(updates) || updates.length === 0) {
        const errorResponse = formatErrorResponse('InvalidParameter', '更新列表不能为空');
        return res.status(errorResponse.status).json(errorResponse);
      }
      
      const adminInfo = {
        id: req.admin.id,
        username: req.admin.username,
        ip_address: req.ip
      };
      
      const result = await EnvService.batchUpdateEnvConfigs(updates, adminInfo, change_reason);
      const successResponse = createSuccessResponse(result, '批量更新环境变量配置完成');
      res.json(successResponse);
    } catch (error) {
      console.error('批量更新环境变量配置失败:', error);
      const errorResponse = formatErrorResponse('InternalError', error.message);
      res.status(errorResponse.status).json(errorResponse);
    }
  }
);

/**
 * 重置配置为默认值
 * POST /api/admin/env/configs/:key/reset
 */
router.post('/env/configs/:key/reset',
  authenticateAdmin,
  checkPermission('system', 'config'),
  logOperation('RESET_ENV_CONFIG', 'env'),
  async (req, res) => {
    try {
      const { key } = req.params;
      
      const adminInfo = {
        id: req.admin.id,
        username: req.admin.username,
        ip_address: req.ip
      };
      
      const result = await EnvService.resetToDefault(key, adminInfo);
      const successResponse = createSuccessResponse(result, '重置配置成功');
      res.json(successResponse);
    } catch (error) {
      console.error('重置配置失败:', error);
      const errorResponse = formatErrorResponse('InternalError', error.message);
      res.status(errorResponse.status).json(errorResponse);
    }
  }
);

/**
 * 获取环境变量变更历史
 * GET /api/admin/env/history
 */
router.get('/env/history',
  authenticateAdmin,
  checkPermission('system', 'view'),
  async (req, res) => {
    try {
      const { page, limit, config_key, change_type, admin_id, start_date, end_date } = req.query;
      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 50,
        config_key,
        change_type,
        admin_id: admin_id ? parseInt(admin_id) : null,
        start_date,
        end_date
      };
      
      const result = await EnvService.getChangeHistory(options);
      const successResponse = createSuccessResponse(result, '获取变更历史成功');
      res.json(successResponse);
    } catch (error) {
      console.error('获取变更历史失败:', error);
      const errorResponse = formatErrorResponse('InternalError', error.message);
      res.status(errorResponse.status).json(errorResponse);
    }
  }
);

/**
 * 从.env文件导入配置
 * POST /api/admin/env/import
 */
router.post('/env/import',
  authenticateAdmin,
  checkPermission('system', 'config'),
  logOperation('IMPORT_ENV_CONFIG', 'env'),
  async (req, res) => {
    try {
      const adminInfo = {
        id: req.admin.id,
        username: req.admin.username,
        ip_address: req.ip
      };
      
      const result = await EnvService.importFromEnvFile(adminInfo);
      const successResponse = createSuccessResponse(result, '从.env文件导入配置完成');
      res.json(successResponse);
    } catch (error) {
      console.error('导入配置失败:', error);
      const errorResponse = formatErrorResponse('InternalError', error.message);
      res.status(errorResponse.status).json(errorResponse);
    }
  }
);

/**
 * 获取配置分类列表
 * GET /api/admin/env/categories
 */
router.get('/env/categories',
  authenticateAdmin,
  checkPermission('system', 'view'),
  async (req, res) => {
    try {
      const result = await EnvService.getCategories();
      const successResponse = createSuccessResponse(result, '获取配置分类成功');
      res.json(successResponse);
    } catch (error) {
      console.error('获取配置分类失败:', error);
      const errorResponse = formatErrorResponse('InternalError', error.message);
      res.status(errorResponse.status).json(errorResponse);
    }
  }
);

/**
 * 生成新的.env文件
 * POST /api/admin/env/generate
 */
router.post('/env/generate',
  authenticateAdmin,
  checkPermission('system', 'config'),
  logOperation('GENERATE_ENV_FILE', 'env'),
  async (req, res) => {
    try {
      await EnvService.updateEnvFile();
      const successResponse = createSuccessResponse(null, '.env文件生成成功');
      res.json(successResponse);
    } catch (error) {
      console.error('生成.env文件失败:', error);
      const errorResponse = formatErrorResponse('InternalError', error.message);
      res.status(errorResponse.status).json(errorResponse);
    }
  }
);

module.exports = router;
