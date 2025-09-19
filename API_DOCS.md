# AI试衣服务 API 文档

基于阿里云百炼 AI 试衣 Plus API 的后端服务接口文档。

## 目录

- [快速开始](#快速开始)
- [API 接口](#api-接口)
- [错误处理](#错误处理)
- [使用示例](#使用示例)

## 快速开始

### 环境配置

1. 复制配置示例文件：
```bash
cp config.example.js config.js
```

2. 配置环境变量（创建 `.env` 文件）：
```env
DASHSCOPE_API_KEY=sk-your-api-key-here
PORT=3000
```

3. 启动服务：
```bash
npm install
npm run dev
```

### 基础信息

- **服务地址**: `http://localhost:3000`
- **API前缀**: `/api/aitryon`
- **请求格式**: JSON
- **响应格式**: JSON

## API 接口

### 1. 健康检查

检查服务运行状态和配置。

**接口地址**: `GET /api/health`

**响应示例**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "dashscope_configured": true
}
```

### 2. 获取模型能力说明

获取AI试衣模型支持的功能和参数说明。

**接口地址**: `GET /api/aitryon/capabilities`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "model": "aitryon-plus",
    "capabilities": [
      {
        "type": "单件上装试穿",
        "description": "传入上装图片，模型随机生成下装或保留模特原有下装",
        "required_params": ["person_image_url", "top_garment_url"]
      }
    ],
    "parameters": {
      "resolution": {
        "description": "输出图片分辨率",
        "options": [-1, 1024, 1280],
        "default": -1
      },
      "restore_face": {
        "description": "是否保留模特原有人脸",
        "type": "boolean",
        "default": true
      }
    },
    "pricing": "0.50 元/张",
    "limits": {
      "rps": 10,
      "concurrent_tasks": 5
    }
  }
}
```

### 3. 创建试衣任务

创建AI试衣任务，支持多种试衣模式。

**接口地址**: `POST /api/aitryon/create-task`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| person_image_url | String | 是 | 模特人物图片的公网URL |
| top_garment_url | String | 否 | 上装/连衣裙服饰图的公网URL |
| bottom_garment_url | String | 否 | 下装服饰图的公网URL |
| resolution | Integer | 否 | 输出图片分辨率：-1(默认), 1024, 1280 |
| restore_face | Boolean | 否 | 是否保留模特原有人脸，默认true |

**注意**: `top_garment_url` 和 `bottom_garment_url` 至少提供一个。

**请求示例**:
```json
{
  "person_image_url": "https://example.com/person.jpg",
  "top_garment_url": "https://example.com/shirt.jpg",
  "bottom_garment_url": "https://example.com/pants.jpg",
  "resolution": -1,
  "restore_face": true
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "task_id": "a8532587-fa8c-4ef8-82be-0c46b17950d1",
    "task_status": "PENDING",
    "task_status_description": "排队中",
    "request_id": "7574ee8f-38a3-4b1e-9280-11c33ab46e51"
  },
  "message": "试衣任务创建成功",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 4. 查询任务状态

根据任务ID查询试衣任务的状态和结果。

**接口地址**: `GET /api/aitryon/task-status/:taskId`

**路径参数**:
- `taskId`: 任务ID（必填）

**响应示例**:
```json
{
  "success": true,
  "data": {
    "task_id": "a8532587-fa8c-4ef8-82be-0c46b17950d1",
    "task_status": "SUCCEEDED",
    "image_url": "https://result.com/image.jpg",
    "submit_time": "2024-01-01 10:00:00.000",
    "scheduled_time": "2024-01-01 10:00:01.000",
    "end_time": "2024-01-01 10:00:30.000",
    "code": null,
    "message": null
  },
  "usage": {
    "image_count": 1
  },
  "request_id": "7574ee8f-38a3-4b1e-9280-11c33ab46e51"
}
```

### 5. 轮询查询任务状态

自动轮询查询任务状态直到完成，避免手动多次查询。

**接口地址**: `GET /api/aitryon/poll-task/:taskId`

**路径参数**:
- `taskId`: 任务ID（必填）

**说明**:
- 自动轮询间隔：3秒
- 最大轮询次数：20次
- 总超时时间：约60秒

**响应示例**:
```json
{
  "success": true,
  "data": {
    "task_id": "a8532587-fa8c-4ef8-82be-0c46b17950d1",
    "task_status": "SUCCEEDED",
    "image_url": "https://result.com/image.jpg",
    "submit_time": "2024-01-01 10:00:00.000",
    "scheduled_time": "2024-01-01 10:00:01.000",
    "end_time": "2024-01-01 10:00:30.000",
    "code": null,
    "message": null
  },
  "usage": {
    "image_count": 1
  },
  "request_id": "7574ee8f-38a3-4b1e-9280-11c33ab46e51"
}
```

## 错误处理

### 统一错误响应格式

```json
{
  "success": false,
  "error": "错误码",
  "message": "错误描述",
  "status": 400,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 常见错误码

| 错误码 | HTTP状态码 | 说明 |
|--------|------------|------|
| InvalidParameter | 400 | 请求参数缺失或格式错误 |
| InvalidURL | 400 | 图片URL无效 |
| InvalidPerson | 400 | 模特图不合规 |
| InvalidGarment | 400 | 缺少服饰图片 |
| InvalidInputLength | 400 | 图片尺寸或文件大小不符合要求 |
| InvalidApiKey | 401 | API密钥无效 |
| RateLimitExceeded | 429 | 请求频率超限 |
| Timeout | 408 | 请求超时 |
| ConfigError | 500 | 服务配置错误 |
| APIError | 500 | 调用AI试衣API失败 |
| InternalError | 500 | 服务器内部错误 |

### 任务状态说明

| 状态 | 描述 |
|------|------|
| PENDING | 排队中 |
| PRE-PROCESSING | 前置处理中 |
| RUNNING | 处理中 |
| POST-PROCESSING | 后置处理中 |
| SUCCEEDED | 成功 |
| FAILED | 失败 |
| UNKNOWN | 作业不存在或状态未知 |
| CANCELED | 任务取消成功 |

## 使用示例

### 试穿上装示例

```javascript
// 1. 创建试衣任务
const createResponse = await fetch('/api/aitryon/create-task', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    person_image_url: 'https://example.com/model.jpg',
    top_garment_url: 'https://example.com/shirt.jpg',
    resolution: -1,
    restore_face: true
  })
});

const createResult = await createResponse.json();
console.log('任务创建:', createResult);

// 2. 轮询查询结果
if (createResult.success) {
  const taskId = createResult.data.task_id;
  
  const pollResponse = await fetch(`/api/aitryon/poll-task/${taskId}`);
  const pollResult = await pollResponse.json();
  
  if (pollResult.success && pollResult.data.image_url) {
    console.log('试衣完成，结果图片:', pollResult.data.image_url);
  }
}
```

### 试穿连衣裙示例

```javascript
const response = await fetch('/api/aitryon/create-task', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    person_image_url: 'https://example.com/model.jpg',
    top_garment_url: 'https://example.com/dress.jpg'
    // 连衣裙只需要传入 top_garment_url
  })
});
```

### 试穿上下装组合示例

```javascript
const response = await fetch('/api/aitryon/create-task', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    person_image_url: 'https://example.com/model.jpg',
    top_garment_url: 'https://example.com/shirt.jpg',
    bottom_garment_url: 'https://example.com/pants.jpg'
  })
});
```

## 注意事项

1. **图片要求**:
   - 文件大小：5KB～5MB
   - 分辨率：150px～4096px
   - 格式：JPG、JPEG、PNG、BMP、HEIC
   - 必须是公网可访问的HTTP/HTTPS地址

2. **模特图要求**:
   - 有且仅有一个完整的人
   - 全身正面照，光照良好
   - 避免手臂交叉遮挡

3. **服装图要求**:
   - 服装平铺拍摄
   - 背景简约干净
   - 服装占比尽可能大
   - 无折叠或遮挡

4. **任务结果**:
   - 图片URL有效期为24小时
   - 请及时下载保存结果图片
   - 任务处理时间：15～30秒

5. **限制说明**:
   - RPS限制：10次/秒
   - 并发任务数：5个
   - 计费：0.50元/张
