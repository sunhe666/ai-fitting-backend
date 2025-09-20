/**
 * 服务模块统一导出
 */

const UserService = require('./UserService');
const ImageService = require('./ImageService');
const TryonService = require('./TryonService');
const OSSService = require('./OSSService');
const AdminService = require('./AdminService');
const StatsService = require('./StatsService');
const EnvService = require('./EnvService');

module.exports = {
  UserService,
  ImageService,
  TryonService,
  OSSService,
  AdminService,
  StatsService,
  EnvService
};
