# 数据库配置指南

## 🗄️ phpStudy MySQL 配置步骤

### 1. 创建数据库

在phpStudy的MySQL管理界面中执行：

```sql
CREATE DATABASE ai_tryClothes 
DEFAULT CHARACTER SET utf8mb4 
DEFAULT COLLATE utf8mb4_unicode_ci;
```

或者直接导入初始化脚本：
```bash
mysql -u root -p < database/init-phpstudy.sql
```

### 2. 配置环境变量

确保 `.env` 文件包含以下配置：

```env
# phpStudy MySQL数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=ai_tryClothes
```

### 3. 安装数据库依赖

```bash
npm install mysql2 sequelize
```

### 4. 初始化数据库表

```bash
npm run db:init
```

### 5. 检查数据库状态

```bash
npm run db:status
```

## 📋 数据库表结构

### 核心业务表

1. **users** - 用户信息表
   - 存储微信小程序用户数据
   - openid作为唯一标识

2. **images** - 图片文件表
   - 存储上传的图片信息
   - 支持模特图、服装图、结果图分类

3. **tryon_tasks** - 试衣任务表
   - 存储AI试衣任务的完整信息
   - 与API接口参数完全对应

4. **user_tryon_history** - 用户试衣历史表
   - 用户试衣历史记录
   - 快速查询用户操作记录

5. **system_config** - 系统配置表
   - 存储系统参数配置
   - 支持动态配置修改

## 🔗 API接口与数据库对应关系

### 创建任务接口
```javascript
POST /api/aitryon/create-task
// 输入参数 → tryon_tasks表字段
{
  person_image_url → person_image_url
  top_garment_url → top_garment_url
  bottom_garment_url → bottom_garment_url
  resolution → resolution
  restore_face → restore_face
  user_id → user_id (新增)
}
```

### 查询状态接口
```javascript
GET /api/aitryon/task-status/:taskId
// 自动更新数据库中的任务状态
// 包括：task_status, result_image_url, end_time等
```

### 文件上传接口
```javascript
POST /api/upload
// 自动保存到images表
// 支持image_type参数指定图片类型
```

### 新增接口

1. **用户任务历史**
   ```javascript
   GET /api/aitryon/user-tasks/:userId
   // 获取用户的所有试衣任务
   ```

2. **任务统计**
   ```javascript
   GET /api/aitryon/stats
   // 获取任务统计信息
   ```

3. **用户信息管理**
   ```javascript
   POST /api/aitryon/user
   GET /api/aitryon/user/:userId
   // 用户信息的创建和查询
   ```

## 🛠️ 数据库管理命令

```bash
# 初始化数据库
npm run db:init

# 查看数据库状态
npm run db:status

# 清理过期数据
npm run db:cleanup

# 备份数据库
npm run db:backup

# 创建测试数据
npm run db:test-data
```

## 📊 数据库特性

### ✅ 已实现功能
- **自动表结构同步**: Sequelize自动创建和更新表结构
- **数据关联**: 用户、图片、任务之间的完整关联
- **状态同步**: API调用结果自动同步到数据库
- **历史记录**: 自动创建用户试衣历史
- **软删除**: 重要数据标记删除而非物理删除
- **错误处理**: 数据库操作失败不影响API功能

### 🔧 配置选项
- **连接池**: 支持连接池配置，提升性能
- **时区设置**: 自动处理时区转换
- **字符集**: 使用utf8mb4支持emoji等特殊字符
- **索引优化**: 关键字段都有索引，查询性能优秀

### 🚀 扩展功能
- **分页查询**: 支持用户任务列表分页
- **条件筛选**: 支持按状态、模式筛选任务
- **统计分析**: 提供任务成功率、处理时间等统计
- **数据清理**: 自动清理过期数据，节省存储空间

## 🔒 安全考虑

1. **SQL注入防护**: 使用Sequelize ORM，自动防护SQL注入
2. **参数验证**: 所有输入参数都有验证
3. **权限控制**: 用户只能访问自己的数据
4. **数据备份**: 支持定期数据备份

## 💡 使用建议

1. **开发阶段**: 
   - 使用phpStudy本地MySQL
   - 启用SQL日志查看执行情况
   - 定期备份测试数据

2. **生产环境**:
   - 使用云数据库服务
   - 关闭SQL日志提升性能
   - 配置自动备份策略

3. **维护建议**:
   - 定期执行 `npm run db:cleanup` 清理过期数据
   - 监控数据库连接状态
   - 关注慢查询日志

现在数据库已经完全集成到项目中，与API接口保持一致！🎉
