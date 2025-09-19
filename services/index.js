/**
 * 服务模块统一导出
 */

const UserService = require('./UserService');
const ImageService = require('./ImageService');
const TryonService = require('./TryonService');

module.exports = {
  UserService,
  ImageService,
  TryonService
};
