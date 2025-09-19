/**
 * 服务模块统一导出
 */

const UserService = require('./UserService');
const ImageService = require('./ImageService');
const TryonService = require('./TryonService');
const OSSService = require('./OSSService');

module.exports = {
  UserService,
  ImageService,
  TryonService,
  OSSService
};
