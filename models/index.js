/**
 * 模型关系定义和导出
 */

const User = require('./User');
const Image = require('./Image');
const TryonTask = require('./TryonTask');

// 定义模型关系
// 用户与图片的关系（一对多）
User.hasMany(Image, {
  foreignKey: 'user_id',
  as: 'images'
});
Image.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// 用户与试衣任务的关系（一对多）
User.hasMany(TryonTask, {
  foreignKey: 'user_id',
  as: 'tryonTasks'
});
TryonTask.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// 试衣任务与图片的关系
// 模特图片
TryonTask.belongsTo(Image, {
  foreignKey: 'person_image_id',
  as: 'personImage'
});

// 上装图片
TryonTask.belongsTo(Image, {
  foreignKey: 'top_garment_image_id',
  as: 'topGarmentImage'
});

// 下装图片
TryonTask.belongsTo(Image, {
  foreignKey: 'bottom_garment_image_id',
  as: 'bottomGarmentImage'
});

// 结果图片
TryonTask.belongsTo(Image, {
  foreignKey: 'result_image_id',
  as: 'resultImage'
});

// 导出所有模型
module.exports = {
  User,
  Image,
  TryonTask
};
