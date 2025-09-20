# 后台管理系统API文档

## 概述

这是AI试衣项目后台管理系统的API文档，提供了完整的管理员操作接口。

### 基础信息

- **基础URL**: `http://localhost:3000/api/admin`
- **认证方式**: JWT Bearer Token
- **响应格式**: JSON

### 通用响应格式

```json
{
  "success": true,
  "message": "操作成功",
  "data": {}, // 响应数据
  "timestamp": "2023-12-01T10:00:00.000Z"
}
```

错误响应：
```json
{
  "success": false,
  "error": "ErrorCode",
  "message": "错误描述",
  "timestamp": "2023-12-01T10:00:00.000Z"
}
```

## 认证相关接口

### 1. 管理员登录

**接口**: `POST /auth/login`

**请求参数**:
```json
{
  "username": "admin",
  "password": "123456"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "admin": {
      "id": 1,
      "username": "admin",
      "real_name": "系统管理员",
      "role": "super_admin",
      "permissions": {...},
      "last_login_at": "2023-12-01T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. 获取当前管理员信息

**接口**: `GET /auth/me`

**请求头**: `Authorization: Bearer {token}`

**响应示例**:
```json
{
  "success": true,
  "message": "获取用户信息成功",
  "data": {
    "id": 1,
    "username": "admin",
    "real_name": "系统管理员",
    "role": "super_admin",
    "permissions": {...}
  }
}
```

### 3. 管理员登出

**接口**: `POST /auth/logout`

**请求头**: `Authorization: Bearer {token}`

## 仪表盘统计接口

### 1. 获取概览数据

**接口**: `GET /dashboard/overview`

**请求头**: `Authorization: Bearer {token}`

**响应示例**:
```json
{
  "success": true,
  "message": "获取概览数据成功",
  "data": {
    "overview": {
      "totalUsers": 1500,
      "totalTasks": 5200,
      "totalImages": 8900,
      "successRate": 85.6
    },
    "users": {
      "total": 1500,
      "today": 25,
      "thisWeek": 180,
      "thisMonth": 720
    },
    "tasks": {
      "total": 5200,
      "today": 89,
      "thisWeek": 650,
      "thisMonth": 2100,
      "statusStats": {
        "pending": 15,
        "processing": 8,
        "succeeded": 4890,
        "failed": 287
      },
      "modeStats": {
        "top": 2100,
        "bottom": 1800,
        "outfit": 1200,
        "dress": 100
      }
    },
    "images": {
      "total": 8900,
      "today": 156
    },
    "recentTasks": [...]
  }
}
```

### 2. 获取历史统计数据

**接口**: `GET /dashboard/history`

**请求参数**:
- `stat_type`: 统计类型 (daily/weekly/monthly)
- `start_date`: 开始日期 (YYYY-MM-DD)
- `end_date`: 结束日期 (YYYY-MM-DD)
- `limit`: 限制数量

**请求头**: `Authorization: Bearer {token}`

## 用户管理接口

### 1. 获取用户列表

**接口**: `GET /users`

**请求参数**:
- `page`: 页码 (默认1)
- `limit`: 每页数量 (默认20)
- `status`: 用户状态 (0/1)
- `keyword`: 搜索关键词

**请求头**: `Authorization: Bearer {token}`

**响应示例**:
```json
{
  "success": true,
  "message": "获取用户列表成功",
  "data": {
    "users": [
      {
        "id": 1,
        "openid": "wx123456789",
        "nickname": "用户1",
        "avatar_url": "https://example.com/avatar.jpg",
        "status": 1,
        "created_at": "2023-12-01T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 1500,
      "page": 1,
      "limit": 20,
      "pages": 75
    }
  }
}
```

### 2. 获取用户详情

**接口**: `GET /users/:id`

**请求头**: `Authorization: Bearer {token}`

### 3. 更新用户状态

**接口**: `PUT /users/:id/status`

**请求参数**:
```json
{
  "status": 0  // 0-禁用，1-正常
}
```

**请求头**: `Authorization: Bearer {token}`

## 任务管理接口

### 1. 获取任务列表

**接口**: `GET /tasks`

**请求参数**:
- `page`: 页码
- `limit`: 每页数量
- `status`: 任务状态
- `mode`: 试衣模式
- `user_id`: 用户ID
- `start_date`: 开始日期
- `end_date`: 结束日期

**请求头**: `Authorization: Bearer {token}`

### 2. 获取任务详情

**接口**: `GET /tasks/:taskId`

**请求头**: `Authorization: Bearer {token}`

### 3. 删除任务

**接口**: `DELETE /tasks/:taskId`

**请求头**: `Authorization: Bearer {token}`

## 管理员管理接口

### 1. 获取管理员列表

**接口**: `GET /admins`

**请求参数**:
- `page`: 页码
- `limit`: 每页数量
- `role`: 角色 (super_admin/admin/operator)
- `status`: 状态 (0/1)
- `keyword`: 搜索关键词

**请求头**: `Authorization: Bearer {token}`

### 2. 创建管理员

**接口**: `POST /admins`

**请求参数**:
```json
{
  "username": "newadmin",
  "password": "password123",
  "real_name": "新管理员",
  "email": "admin@example.com",
  "phone": "13800138000",
  "role": "operator",
  "permissions": {
    "users": {"view": true, "edit": false},
    "tasks": {"view": true, "delete": false}
  }
}
```

**请求头**: `Authorization: Bearer {token}`

### 3. 获取管理员详情

**接口**: `GET /admins/:id`

**请求头**: `Authorization: Bearer {token}`

### 4. 更新管理员信息

**接口**: `PUT /admins/:id`

**请求头**: `Authorization: Bearer {token}`

### 5. 删除管理员

**接口**: `DELETE /admins/:id`

**请求头**: `Authorization: Bearer {token}`

## 操作日志接口

### 1. 获取操作日志

**接口**: `GET /logs`

**请求参数**:
- `page`: 页码
- `limit`: 每页数量
- `admin_id`: 管理员ID
- `action`: 操作类型
- `resource`: 资源类型
- `start_date`: 开始日期
- `end_date`: 结束日期

**请求头**: `Authorization: Bearer {token}`

**响应示例**:
```json
{
  "success": true,
  "message": "获取操作日志成功",
  "data": {
    "logs": [
      {
        "id": 1,
        "admin_username": "admin",
        "action": "LOGIN_SUCCESS",
        "resource": "auth",
        "ip_address": "127.0.0.1",
        "created_at": "2023-12-01T10:00:00.000Z",
        "admin": {
          "id": 1,
          "username": "admin",
          "real_name": "系统管理员"
        }
      }
    ],
    "pagination": {...}
  }
}
```

## 系统管理接口

### 1. 生成统计数据

**接口**: `POST /system/generate-stats`

**请求参数**:
```json
{
  "stat_type": "daily",  // daily/weekly/monthly
  "stat_date": "2023-12-01"
}
```

**请求头**: `Authorization: Bearer {token}`

### 2. 清理过期数据

**接口**: `POST /system/cleanup`

**请求参数**:
```json
{
  "type": "tasks",  // tasks/stats/all
  "days": 7  // 保留天数
}
```

**请求头**: `Authorization: Bearer {token}`

## 权限系统

### 角色说明

1. **super_admin (超级管理员)**
   - 拥有所有权限
   - 可以管理其他管理员

2. **admin (管理员)**
   - 拥有大部分权限
   - 不能管理超级管理员

3. **operator (操作员)**
   - 基础操作权限
   - 只能查看和基础操作

### 权限配置示例

```json
{
  "users": {
    "view": true,
    "create": false,
    "edit": true,
    "delete": false
  },
  "tasks": {
    "view": true,
    "create": false,
    "edit": false,
    "delete": true
  },
  "images": {
    "view": true,
    "create": false,
    "edit": false,
    "delete": false
  },
  "admins": {
    "view": false,
    "create": false,
    "edit": false,
    "delete": false
  },
  "logs": {
    "view": true
  },
  "stats": {
    "view": true
  },
  "system": {
    "view": false,
    "config": false
  }
}
```

## 错误码说明

- `Unauthorized`: 未授权，需要登录
- `Forbidden`: 权限不足
- `InvalidParameter`: 参数无效
- `InternalError`: 服务器内部错误
- `LoginFailed`: 登录失败

## 使用示例

### JavaScript 示例

```javascript
// 登录
const loginResponse = await fetch('/api/admin/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'admin',
    password: '123456'
  })
});

const loginData = await loginResponse.json();
const token = loginData.data.token;

// 获取用户列表
const usersResponse = await fetch('/api/admin/users?page=1&limit=20', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const usersData = await usersResponse.json();
console.log(usersData.data.users);
```

## 注意事项

1. 所有接口都需要有效的JWT token
2. 权限检查在每个接口中进行
3. 操作日志会自动记录管理员的所有操作
4. 密码在数据库中使用bcrypt加密存储
5. 建议在生产环境中修改默认管理员密码
