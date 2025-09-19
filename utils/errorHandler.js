/**
 * 错误处理工具函数
 */

/**
 * AI试衣API错误码映射
 */
const ERROR_CODES = {
  InvalidParameter: {
    status: 400,
    message: '请求参数缺失或格式错误'
  },
  InvalidURL: {
    status: 400,
    message: '图片URL无效'
  },
  InvalidPerson: {
    status: 400,
    message: '模特图不合规，请确保输入图片中有且仅有一个完整的人'
  },
  InvalidGarment: {
    status: 400,
    message: '缺少服饰图片，请至少提供一张上装或下装的图片'
  },
  InvalidInputLength: {
    status: 400,
    message: '图片尺寸或文件大小不符合要求'
  },
  InvalidApiKey: {
    status: 401,
    message: 'API密钥无效'
  },
  RateLimitExceeded: {
    status: 429,
    message: '请求频率超限'
  },
  InternalError: {
    status: 500,
    message: '服务器内部错误'
  },
  APIError: {
    status: 500,
    message: '调用AI试衣API失败'
  },
  ConfigError: {
    status: 500,
    message: '服务配置错误'
  },
  Timeout: {
    status: 408,
    message: '请求超时'
  }
};

/**
 * 格式化错误响应
 * @param {string} errorCode - 错误码
 * @param {string} customMessage - 自定义错误消息
 * @returns {object} - 格式化的错误响应
 */
function formatErrorResponse(errorCode, customMessage = null) {
  const errorInfo = ERROR_CODES[errorCode] || ERROR_CODES.InternalError;
  
  return {
    success: false,
    error: errorCode,
    message: customMessage || errorInfo.message,
    status: errorInfo.status,
    timestamp: new Date().toISOString()
  };
}

/**
 * 处理阿里云API错误响应
 * @param {object} error - Axios错误对象
 * @returns {object} - 格式化的错误响应
 */
function handleDashscopeError(error) {
  if (error.response && error.response.data) {
    const { code, message } = error.response.data;
    const status = error.response.status;
    
    return {
      success: false,
      error: code || 'APIError',
      message: message || '调用AI试衣API失败',
      status: status || 500,
      timestamp: new Date().toISOString()
    };
  }
  
  // 处理网络错误或其他错误
  if (error.code === 'ECONNABORTED') {
    return formatErrorResponse('Timeout', '请求超时，请稍后重试');
  }
  
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    return formatErrorResponse('APIError', '无法连接到AI试衣服务');
  }
  
  return formatErrorResponse('InternalError', error.message);
}

/**
 * 任务状态描述映射
 */
const TASK_STATUS_DESCRIPTIONS = {
  PENDING: '排队中',
  'PRE-PROCESSING': '前置处理中',
  RUNNING: '处理中',
  'POST-PROCESSING': '后置处理中',
  SUCCEEDED: '成功',
  FAILED: '失败',
  UNKNOWN: '作业不存在或状态未知',
  CANCELED: '任务取消成功'
};

/**
 * 获取任务状态描述
 * @param {string} status - 任务状态
 * @returns {string} - 状态描述
 */
function getTaskStatusDescription(status) {
  return TASK_STATUS_DESCRIPTIONS[status] || status;
}

/**
 * 验证并处理请求参数
 * @param {object} params - 请求参数
 * @param {object} validator - 验证函数
 * @returns {object} - 验证结果
 */
function validateAndHandle(params, validator) {
  try {
    const validation = validator(params);
    if (!validation.valid) {
      return {
        success: false,
        error: formatErrorResponse('InvalidParameter', validation.error)
      };
    }
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: formatErrorResponse('InternalError', '参数验证失败')
    };
  }
}

/**
 * 创建统一的成功响应
 * @param {any} data - 响应数据
 * @param {string} message - 成功消息
 * @returns {object} - 成功响应
 */
function createSuccessResponse(data, message = '操作成功') {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };
}

/**
 * Express错误处理中间件
 */
function errorMiddleware(err, req, res, next) {
  console.error('错误详情:', err);
  
  // 如果响应已经发送，交给默认错误处理器
  if (res.headersSent) {
    return next(err);
  }
  
  // 处理已知错误
  if (err.code && ERROR_CODES[err.code]) {
    const errorResponse = formatErrorResponse(err.code, err.message);
    return res.status(errorResponse.status).json(errorResponse);
  }
  
  // 处理未知错误
  const errorResponse = formatErrorResponse('InternalError', err.message);
  res.status(errorResponse.status).json(errorResponse);
}

module.exports = {
  ERROR_CODES,
  formatErrorResponse,
  handleDashscopeError,
  getTaskStatusDescription,
  validateAndHandle,
  createSuccessResponse,
  errorMiddleware
};
