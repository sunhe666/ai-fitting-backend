/**
 * 参数验证工具函数
 */

/**
 * 验证URL格式
 * @param {string} url - 要验证的URL
 * @returns {boolean} - 是否为有效的HTTP/HTTPS URL
 */
function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

/**
 * 验证图片URL格式
 * @param {string} url - 图片URL
 * @returns {boolean} - 是否为有效的图片URL
 */
function isValidImageUrl(url) {
  if (!isValidUrl(url)) return false;
  
  const supportedFormats = ['.jpg', '.jpeg', '.png', '.bmp', '.heic', '.webp'];
  const urlLower = url.toLowerCase();
  
  // 检查是否包含支持的图片格式
  return supportedFormats.some(format => 
    urlLower.includes(format) || urlLower.includes(format.replace('.', ''))
  );
}

/**
 * 验证分辨率参数
 * @param {number} resolution - 分辨率参数
 * @returns {boolean} - 是否为有效的分辨率值
 */
function isValidResolution(resolution) {
  const validResolutions = [-1, 1024, 1280];
  return validResolutions.includes(resolution);
}

/**
 * 验证AI试衣请求参数
 * @param {object} params - 请求参数
 * @returns {object} - 验证结果 {valid: boolean, error?: string}
 */
function validateAiTryonParams(params) {
  const {
    person_image_url,
    top_garment_url,
    bottom_garment_url,
    resolution = -1,
    restore_face = true
  } = params;

  // 验证模特图片URL
  if (!person_image_url) {
    return { valid: false, error: '模特图片URL是必需的' };
  }
  if (!isValidImageUrl(person_image_url)) {
    return { valid: false, error: '模特图片URL格式无效' };
  }

  // 验证服装图片URL（至少需要一个）
  if (!top_garment_url && !bottom_garment_url) {
    return { valid: false, error: '至少需要提供一张上装或下装图片' };
  }

  // 验证上装图片URL
  if (top_garment_url && !isValidImageUrl(top_garment_url)) {
    return { valid: false, error: '上装图片URL格式无效' };
  }

  // 验证下装图片URL
  if (bottom_garment_url && !isValidImageUrl(bottom_garment_url)) {
    return { valid: false, error: '下装图片URL格式无效' };
  }

  // 验证分辨率参数
  if (!isValidResolution(resolution)) {
    return { valid: false, error: '分辨率参数无效，支持的值：-1, 1024, 1280' };
  }

  // 验证人脸还原参数
  if (typeof restore_face !== 'boolean') {
    return { valid: false, error: 'restore_face参数必须是布尔值' };
  }

  return { valid: true };
}

/**
 * 验证任务ID格式
 * @param {string} taskId - 任务ID
 * @returns {boolean} - 是否为有效的任务ID
 */
function isValidTaskId(taskId) {
  if (!taskId || typeof taskId !== 'string') return false;
  
  // 通常任务ID是UUID格式或类似的字符串
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(taskId) || (taskId.length > 10 && taskId.length < 100);
}

module.exports = {
  isValidUrl,
  isValidImageUrl,
  isValidResolution,
  validateAiTryonParams,
  isValidTaskId
};
