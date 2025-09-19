const express = require('express');
const axios = require('axios');
const router = express.Router();
const { validateAiTryonParams, isValidTaskId } = require('../utils/validator');
const { 
  handleDashscopeError, 
  createSuccessResponse, 
  formatErrorResponse,
  getTaskStatusDescription 
} = require('../utils/errorHandler');
const { processImageUrl, isLocalUrl } = require('../utils/imageProxy');
const { TryonService, UserService } = require('../services');

// 配置信息
const config = {
  dashscope: {
    apiKey: process.env.DASHSCOPE_API_KEY,
    baseUrl: 'https://dashscope.aliyuncs.com',
    model: 'aitryon-plus'
  }
};

/**
 * 创建AI试衣任务
 * POST /api/aitryon/create-task
 */
router.post('/create-task', async (req, res) => {
  try {
    const {
      person_image_url,
      top_garment_url,
      bottom_garment_url,
      resolution = -1,
      restore_face = true
    } = req.body;

    // 参数验证
    const validation = validateAiTryonParams(req.body);
    if (!validation.valid) {
      const errorResponse = formatErrorResponse('InvalidParameter', validation.error);
      return res.status(errorResponse.status).json(errorResponse);
    }

    if (!config.dashscope.apiKey) {
      const errorResponse = formatErrorResponse('ConfigError', 'DASHSCOPE_API_KEY 未配置');
      return res.status(errorResponse.status).json(errorResponse);
    }

    // 处理图片URL（本地URL转换为Base64）
    let processedPersonUrl = person_image_url;
    let processedTopGarmentUrl = top_garment_url;
    let processedBottomGarmentUrl = bottom_garment_url;

    try {
      // 检查并处理本地图片URL
      if (isLocalUrl(person_image_url)) {
        console.log('处理模特图片本地URL:', person_image_url);
        processedPersonUrl = processImageUrl(person_image_url);
      }
      
      if (top_garment_url && isLocalUrl(top_garment_url)) {
        console.log('处理上装图片本地URL:', top_garment_url);
        processedTopGarmentUrl = processImageUrl(top_garment_url);
      }
      
      if (bottom_garment_url && isLocalUrl(bottom_garment_url)) {
        console.log('处理下装图片本地URL:', bottom_garment_url);
        processedBottomGarmentUrl = processImageUrl(bottom_garment_url);
      }
    } catch (imageError) {
      console.error('图片处理失败:', imageError);
      const errorResponse = formatErrorResponse('InvalidParameter', `图片处理失败: ${imageError.message}`);
      return res.status(errorResponse.status).json(errorResponse);
    }

    // 构建请求数据
    const requestData = {
      model: config.dashscope.model,
      input: {
        person_image_url: processedPersonUrl
      },
      parameters: {
        resolution,
        restore_face
      }
    };

    // 添加服装图片URL
    if (processedTopGarmentUrl) {
      requestData.input.top_garment_url = processedTopGarmentUrl;
    }
    if (processedBottomGarmentUrl) {
      requestData.input.bottom_garment_url = processedBottomGarmentUrl;
    }

    // 调用阿里云百炼API
    const response = await axios.post(
      `${config.dashscope.baseUrl}/api/v1/services/aigc/image2image/image-synthesis`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.dashscope.apiKey}`,
          'X-DashScope-Async': 'enable'
        },
        timeout: 30000 // 30秒超时
      }
    );

    // 保存任务到数据库
    try {
      // 确定试衣模式
      let tryonMode = 'top'; // 默认
      if (top_garment_url && bottom_garment_url) {
        tryonMode = 'outfit';
      } else if (top_garment_url && !bottom_garment_url) {
        tryonMode = 'top';
      } else if (!top_garment_url && bottom_garment_url) {
        tryonMode = 'bottom';
      }
      
      // 如果只有上装且没有下装，可能是连衣裙（这里简化处理）
      if (top_garment_url && !bottom_garment_url) {
        // 可以通过其他方式判断是否为连衣裙，这里保持为top
        tryonMode = 'top';
      }
      
      const taskData = {
        task_id: response.data.output.task_id,
        user_id: req.body.user_id || null, // 从请求中获取用户ID
        person_image_url,
        top_garment_url,
        bottom_garment_url,
        tryon_mode: tryonMode,
        resolution,
        restore_face,
        request_id: response.data.request_id
      };
      
      await TryonService.createTask(taskData);
      console.log('✅ 任务已保存到数据库');
    } catch (dbError) {
      console.warn('保存任务到数据库失败:', dbError.message);
      // 数据库保存失败不影响API响应
    }

    // 返回成功结果
    const successResponse = createSuccessResponse({
      task_id: response.data.output.task_id,
      task_status: response.data.output.task_status,
      task_status_description: getTaskStatusDescription(response.data.output.task_status),
      request_id: response.data.request_id
    }, '试衣任务创建成功');
    
    res.json(successResponse);

  } catch (error) {
    console.error('AI试衣任务创建失败:', error);

    // 处理API错误响应
    const errorResponse = handleDashscopeError(error);
    res.status(errorResponse.status).json(errorResponse);
  }
});

/**
 * 查询AI试衣任务状态
 * GET /api/aitryon/task-status/:taskId
 */
router.get('/task-status/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!taskId) {
      return res.status(400).json({
        success: false,
        error: 'InvalidParameter',
        message: '任务ID是必需的'
      });
    }

    if (!config.dashscope.apiKey) {
      return res.status(500).json({
        success: false,
        error: 'ConfigError',
        message: 'DASHSCOPE_API_KEY 未配置'
      });
    }

    // 调用阿里云百炼API查询任务状态
    const response = await axios.get(
      `${config.dashscope.baseUrl}/api/v1/tasks/${taskId}`,
      {
        headers: {
          'Authorization': `Bearer ${config.dashscope.apiKey}`
        },
        timeout: 10000 // 10秒超时
      }
    );

    const result = response.data.output;

    // 更新数据库中的任务状态
    try {
      const updateData = {
        task_status: result.task_status,
        task_status_description: getTaskStatusDescription(result.task_status),
        submit_time: result.submit_time ? new Date(result.submit_time.replace(' ', 'T')) : null,
        scheduled_time: result.scheduled_time ? new Date(result.scheduled_time.replace(' ', 'T')) : null,
        end_time: result.end_time ? new Date(result.end_time.replace(' ', 'T')) : null,
        result_image_url: result.image_url || null,
        image_count: response.data.usage ? response.data.usage.image_count : 0,
        error_code: result.code || null,
        error_message: result.message || null
      };
      
      await TryonService.updateTaskStatus(taskId, updateData);
      console.log('✅ 任务状态已更新到数据库');
    } catch (dbError) {
      console.warn('更新任务状态到数据库失败:', dbError.message);
      // 数据库更新失败不影响API响应
    }

    // 返回结果
    res.json({
      success: true,
      data: {
        task_id: result.task_id,
        task_status: result.task_status,
        image_url: result.image_url || null,
        submit_time: result.submit_time,
        scheduled_time: result.scheduled_time,
        end_time: result.end_time,
        code: result.code || null,
        message: result.message || null
      },
      usage: response.data.usage || null,
      request_id: response.data.request_id
    });

  } catch (error) {
    console.error('查询AI试衣任务状态失败:', error);

    // 处理API错误响应
    if (error.response && error.response.data) {
      const { code, message } = error.response.data;
      return res.status(error.response.status || 500).json({
        success: false,
        error: code || 'APIError',
        message: message || '查询任务状态失败'
      });
    }

    // 处理其他错误
    res.status(500).json({
      success: false,
      error: 'InternalError',
      message: error.message || '服务器内部错误'
    });
  }
});

/**
 * 轮询查询任务状态直到完成
 * GET /api/aitryon/poll-task/:taskId
 */
router.get('/poll-task/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const maxAttempts = 20; // 最大轮询次数
    const interval = 3000; // 轮询间隔3秒

    if (!taskId) {
      return res.status(400).json({
        success: false,
        error: 'InvalidParameter',
        message: '任务ID是必需的'
      });
    }

    let attempts = 0;
    
    const pollTask = async () => {
      try {
        const response = await axios.get(
          `${config.dashscope.baseUrl}/api/v1/tasks/${taskId}`,
          {
            headers: {
              'Authorization': `Bearer ${config.dashscope.apiKey}`
            },
            timeout: 10000
          }
        );

        const result = response.data.output;
        const status = result.task_status;

        // 如果任务完成（成功或失败）
        if (status === 'SUCCEEDED' || status === 'FAILED') {
          return res.json({
            success: status === 'SUCCEEDED',
            data: {
              task_id: result.task_id,
              task_status: result.task_status,
              image_url: result.image_url || null,
              submit_time: result.submit_time,
              scheduled_time: result.scheduled_time,
              end_time: result.end_time,
              code: result.code || null,
              message: result.message || null
            },
            usage: response.data.usage || null,
            request_id: response.data.request_id
          });
        }

        // 如果还在处理中且未超过最大轮询次数
        if (attempts < maxAttempts && ['PENDING', 'PRE-PROCESSING', 'RUNNING', 'POST-PROCESSING'].includes(status)) {
          attempts++;
          setTimeout(pollTask, interval);
        } else {
          // 超时或未知状态
          res.json({
            success: false,
            error: 'Timeout',
            message: '任务轮询超时，请稍后手动查询',
            data: {
              task_id: result.task_id,
              task_status: result.task_status,
              attempts
            }
          });
        }
      } catch (error) {
        console.error('轮询任务状态失败:', error);
        res.status(500).json({
          success: false,
          error: 'PollError',
          message: '轮询任务状态失败'
        });
      }
    };

    // 开始轮询
    pollTask();

  } catch (error) {
    console.error('轮询任务初始化失败:', error);
    res.status(500).json({
      success: false,
      error: 'InternalError',
      message: error.message || '服务器内部错误'
    });
  }
});

/**
 * 获取试衣模型支持的功能说明
 * GET /api/aitryon/capabilities
 */
router.get('/capabilities', (req, res) => {
  res.json({
    success: true,
    data: {
      model: 'aitryon-plus',
      capabilities: [
        {
          type: '单件上装试穿',
          description: '传入上装图片，模型随机生成下装或保留模特原有下装',
          required_params: ['person_image_url', 'top_garment_url']
        },
        {
          type: '单件下装试穿',
          description: '传入下装图片，模型随机生成上装或保留模特原有上装',
          required_params: ['person_image_url', 'bottom_garment_url']
        },
        {
          type: '上下装组合试穿',
          description: '传入上装和下装图片，完整替换全身套装',
          required_params: ['person_image_url', 'top_garment_url', 'bottom_garment_url']
        },
        {
          type: '连衣裙/连体衣试穿',
          description: '传入连衣裙或连体衣图片',
          required_params: ['person_image_url', 'top_garment_url']
        }
      ],
      parameters: {
        resolution: {
          description: '输出图片分辨率',
          options: [-1, 1024, 1280],
          default: -1
        },
        restore_face: {
          description: '是否保留模特原有人脸',
          type: 'boolean',
          default: true
        }
      },
      pricing: '0.50 元/张',
      limits: {
        rps: 10,
        concurrent_tasks: 5
      }
    }
  });
});

/**
 * 获取用户试衣历史
 * GET /api/aitryon/user-tasks/:userId
 */
router.get('/user-tasks/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, status, mode } = req.query;
    
    if (!userId) {
      const errorResponse = formatErrorResponse('InvalidParameter', '用户ID是必需的');
      return res.status(errorResponse.status).json(errorResponse);
    }
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      mode
    };
    
    const result = await TryonService.getUserTasks(parseInt(userId), options);
    
    const successResponse = createSuccessResponse(result, '获取用户任务列表成功');
    res.json(successResponse);
    
  } catch (error) {
    console.error('获取用户任务列表失败:', error);
    const errorResponse = handleDashscopeError(error);
    res.status(errorResponse.status).json(errorResponse);
  }
});

/**
 * 获取任务统计信息
 * GET /api/aitryon/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const { userId } = req.query;
    
    const stats = await TryonService.getTaskStats(userId ? parseInt(userId) : null);
    
    const successResponse = createSuccessResponse(stats, '获取统计信息成功');
    res.json(successResponse);
    
  } catch (error) {
    console.error('获取统计信息失败:', error);
    const errorResponse = handleDashscopeError(error);
    res.status(errorResponse.status).json(errorResponse);
  }
});

/**
 * 获取用户信息
 * GET /api/aitryon/user/:userId
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      const errorResponse = formatErrorResponse('InvalidParameter', '用户ID是必需的');
      return res.status(errorResponse.status).json(errorResponse);
    }
    
    const user = await UserService.getUserById(parseInt(userId));
    const stats = await UserService.getUserStats(parseInt(userId));
    
    const successResponse = createSuccessResponse({
      user,
      stats
    }, '获取用户信息成功');
    res.json(successResponse);
    
  } catch (error) {
    console.error('获取用户信息失败:', error);
    const errorResponse = handleDashscopeError(error);
    res.status(errorResponse.status).json(errorResponse);
  }
});

/**
 * 创建或更新用户信息
 * POST /api/aitryon/user
 */
router.post('/user', async (req, res) => {
  try {
    const userInfo = req.body;
    
    if (!userInfo.openid) {
      const errorResponse = formatErrorResponse('InvalidParameter', 'openid是必需的');
      return res.status(errorResponse.status).json(errorResponse);
    }
    
    const user = await UserService.findOrCreateUser(userInfo);
    
    const successResponse = createSuccessResponse(user, '用户信息保存成功');
    res.json(successResponse);
    
  } catch (error) {
    console.error('保存用户信息失败:', error);
    const errorResponse = handleDashscopeError(error);
    res.status(errorResponse.status).json(errorResponse);
  }
});

/**
 * 删除试衣任务
 * DELETE /api/aitryon/task/:taskId
 */
router.delete('/task/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId } = req.body;
    
    if (!taskId) {
      const errorResponse = formatErrorResponse('InvalidParameter', '任务ID是必需的');
      return res.status(errorResponse.status).json(errorResponse);
    }
    
    if (!userId) {
      const errorResponse = formatErrorResponse('InvalidParameter', '用户ID是必需的');
      return res.status(errorResponse.status).json(errorResponse);
    }
    
    const result = await TryonService.deleteTask(taskId, parseInt(userId));
    
    const successResponse = createSuccessResponse(
      { deleted: result }, 
      '任务删除成功'
    );
    res.json(successResponse);
    
  } catch (error) {
    console.error('删除任务失败:', error);
    const errorResponse = handleDashscopeError(error);
    res.status(errorResponse.status).json(errorResponse);
  }
});

/**
 * 批量删除试衣任务
 * DELETE /api/aitryon/tasks
 */
router.delete('/tasks', async (req, res) => {
  try {
    const { taskIds, userId } = req.body;
    
    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      const errorResponse = formatErrorResponse('InvalidParameter', '任务ID列表不能为空');
      return res.status(errorResponse.status).json(errorResponse);
    }
    
    if (!userId) {
      const errorResponse = formatErrorResponse('InvalidParameter', '用户ID是必需的');
      return res.status(errorResponse.status).json(errorResponse);
    }
    
    const result = await TryonService.deleteTasks(taskIds, parseInt(userId));
    
    const successResponse = createSuccessResponse(result, '任务批量删除完成');
    res.json(successResponse);
    
  } catch (error) {
    console.error('批量删除任务失败:', error);
    const errorResponse = handleDashscopeError(error);
    res.status(errorResponse.status).json(errorResponse);
  }
});

module.exports = router;
