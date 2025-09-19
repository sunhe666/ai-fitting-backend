# AI 试衣模型（aitryon-plus）使用文档

## 一、模型能力



| 功能类别   | 具体说明                                                                                      |
| ------ | ----------------------------------------------------------------------------------------- |
| 多种服饰试穿 | 1. 单件上装试穿：模型随机生成下装，或保留模特原有下装2. 单件下装试穿：模型随机生成上装，或保留模特原有上装3. 上下装组合试穿：完整替换全身套装4. 连衣裙 / 连体衣试穿 |
| 精细化控制  | 1. 人脸策略：可选择保留模特原有人脸，或生成一张全新的随机人脸2. 指定分辨率：可指定输出图片的尺寸，或保持与原图一致                              |

## 二、模型概览

### （一）模型简介



| 模型名称         | 计费单价       | 限流（主账号与 RAM 子账号共用）- 任务下发接口 RPS 限制 | 限流（主账号与 RAM 子账号共用）- 同时处理中任务数量 | 免费额度（查看） |
| ------------ | ---------- | --------------------------------- | ----------------------------- | -------- |
| aitryon-plus | 0.50 元 / 张 | 10                                | 5                             | 400 张    |

### （二）说明



1.  **API 兼容性**：aitryon-plus 模型完全兼容 aitryon 模型的调用方式。若已集成 aitryon，只需将请求参数中的 model 字段值修改为 aitryon-plus 即可升级。

2.  **计费与限流**：aitryon-plus 与 aitryon 模型的计费标准和调用频率限制不同，详情请参见 AI 试衣模型计量计费。

### （三）模型效果示意



| 输入模特的全身正面照                                             | 输入服装平铺图                                                     | 生成的试衣效果图                                               |
| ------------------------------------------------------ | ----------------------------------------------------------- | ------------------------------------------------------ |
| ![img](tmp/150672864770_docx.datword_media_image1.png) | 上装平铺图![img](tmp/150672864770_docx.datword_media_image2.png) | ![img](tmp/150672864770_docx.datword_media_image3.png) |
|                                                        | 下装平铺图![img](tmp/150672864770_docx.datword_media_image4.png) |                                                        |

## 三、输入图片要求

高质量的输入是高质量输出的保障。在调用 API 前，请务必确保图片符合以下规范。

### （一）模特图要求



| 要求类别   | 详细说明                                                                                                                            |
| ------ | ------------------------------------------------------------------------------------------------------------------------------- |
| 图片要求   | 1. 文件大小：5KB～5MB 之间2. 分辨率：图片宽度和高度均需在 150px～4096px 范围内3. 图片格式：支持 JPG、JPEG、PNG、BMP、HEIC4. 链接要求：上传图片必须为公网可访问的 HTTP/HTTPS 地址，不支持本地路径 |
| 模特人物要求 | 1. 人群要求：支持不同性别、肤色、年龄（6 岁以上）的人物图2. 姿势要求：人物全身正面照，光照良好。人物手部展示完整，避免手臂交叉遮挡等情况3. 人物要求：保持图片中有且仅有一个完整的人                                 |

#### 1. 正确的人物图示例



| ![img](tmp/150672864770_docx.datword_media_image5.png) | ![img](tmp/150672864770_docx.datword_media_image6.png) | ![img](tmp/150672864770_docx.datword_media_image7.png) | ![img](tmp/150672864770_docx.datword_media_image8.png) |
| ------------------------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------ |

#### 2. 错误的人物图示例



| 错误类型         | 说明                | 示例图                                                     |
| ------------ | ----------------- | ------------------------------------------------------- |
| ❌多人照片        | 图片中包含多个人物         | ![img](tmp/150672864770_docx.datword_media_image9.png)  |
| ❌非正面全身照      | 避免上传侧身、坐姿、躺姿、半身照片 | !\[img]\(1Ⓡ%S -)                                        |
| ❌人物服装遮挡      | 避免手持物、包等遮挡服装      | ![img](心)                                               |
| ❌光线过暗 / 模糊不清 | 图片光线不足或画面模糊       | ![img](tmp/150672864770_docx.datword_media_image12.png) |

### （二）服饰图要求



| 要求类别 | 详细说明                                                                                                                                                                                                                     |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 图片要求 | 1. 文件大小：5KB～5MB 之间2. 分辨率：图片宽度和高度均需在 150px～4096px 范围内3. 图片格式：支持 JPG、JPEG、PNG、BMP、HEIC4. 链接要求：上传图片必须为公网可访问的 HTTP/HTTPS 地址，不支持本地路径                                                                                          |
| 服饰要求 | 1. 服饰类型：支持单件上装、下装、连衣裙；支持套装、上下装组合2. 服装类目：支持常见服饰品类。不支持内衣、婚纱礼服、特色民族服饰等3. 服饰要求：  - 单件服饰：服饰平铺拍摄，仅含单件服装  - 服饰无折叠 / 遮挡：衣服应舒展、平整，无褶皱或折叠遮挡  - 背景简约干净：图片背景简洁干净、色彩统一，保持服饰主体清晰，无复杂的光照阴影  - 服饰占比大：服饰的画面占比尽可能大，四周不宜留白过多，过多的背景留白会降低试衣效果 |

#### 1. 正确的服饰图示例



| 服饰类型      | 示例图 1                                                    | 示例图 2                                                    | 示例图 3                                                    |
| --------- | -------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------- |
| 上装        | ![img](tmp/150672864770_docx.datword_media_image13.jpeg) | ![img](tmp/150672864770_docx.datword_media_image14.jpeg) | ![img](1小4)                                              |
| 下装        | ![img](tmp/150672864770_docx.datword_media_image16.jpeg) | ![img](tmp/150672864770_docx.datword_media_image17.jpeg) | ![img](tmp/150672864770_docx.datword_media_image18.webp) |
| 连衣裙 / 连体服 | ![img](饰)                                                | ![img](tmp/150672864770_docx.datword_media_image20.webp) | ![img](tmp/150672864770_docx.datword_media_image21.jpeg) |

#### 2. 错误的服饰图示例



| 错误类型  | 示例图                                                     |
| ----- | ------------------------------------------------------- |
| ❌多件服装 | ![img](M%-\&ENIM)                                       |
| ❌非正面照 | ![img](tmp/150672864770_docx.datword_media_image23.png) |
| ❌折叠遮挡 | ![img](tmp/150672864770_docx.datword_media_image24.png) |
| ❌服装褶皱 | ![img](tmp/150672864770_docx.datword_media_image25.png) |

## 四、前提条件



1.  AI 试衣 Plus API 仅支持通过 HTTP 进行调用。

2.  在调用前，需获取 API Key，再配置 API Key 到环境变量。

## 五、HTTP 调用

API 提供一个异步接口，调用分为两步：



1.  创建任务：创建图片生成任务，获取一个唯一的 task\_id。

2.  查询结果：使用 task\_id 轮询任务状态，直到任务完成并获取结果。

### （一）步骤 1：创建任务

发送 POST 请求创建试衣任务，请求地址：`https://dashscope.aliyuncs.com/api/v1/services/aigc/image2image/image-synthesis`

#### 1. 说明



*   因该模型调用耗时较长，故采用异步调用的方式创建任务。

*   任务创建后，系统会立即返回一个 task\_id。在下一步中，需要使用此 task\_id 在 24 小时内查询任务结果。

#### 2. 入参描述



| 字段                         | 类型     | 传参方式   | 必选 | 描述                                                                                                                                                                                                                                                                                                   | 示例值              |
| -------------------------- | ------ | ------ | -- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| Content-Type               | String | Header | 是  | 请求类型：application/json                                                                                                                                                                                                                                                                                | application/json |
| Authorization              | String | Header | 是  | API-Key，格式为 Bearer sk-xxxx                                                                                                                                                                                                                                                                           | Bearer sk-xxxx   |
| X-DashScope-Async          | String | Header | 是  | 固定值为 enable，表示使用异步调用方式                                                                                                                                                                                                                                                                               | enable           |
| model                      | String | Body   | 是  | 指明需要调用的模型                                                                                                                                                                                                                                                                                            | aitryon-plus     |
| input.person\_image\_url   | String | Body   | 是  | 模特人物图片的公网 URL，需满足：1. 5KB≤图像文件≤5M2. 150≤图像边长≤40963. 格式支持：jpg、png、jpeg、bmp、heic4. 保持图片中有且仅有一个完整的人5. 仅支持 HTTP/HTTPS 链接，不支持本地路径（模特图示例请参见模特图要求，可点击此处下载提供的模特图）                                                                                                                                             | http://aaa/1.jpg |
| input.top\_garment\_url    | String | Body   | 否  | 上装 / 连衣裙服饰图的公网 URL，需满足：1. 5KB≤图像文件≤5M2. 150≤图像边长≤40963. 格式支持：jpg、png、jpeg、bmp、heic4. 需上传服饰平拍图，保持服饰是单一主体且完整，背景干净，四周不宜留白过多5. 仅支持 HTTP/HTTPS 链接，不支持本地路径（服饰图示例请参见服饰图要求）说明： - top\_garment\_url 和 bottom\_garment\_url 至少提供一个 - 如果不传此字段，模型将随机生成上装 - 对于连衣裙 / 连体衣，请将图片 URL 填入此字段，并将 bottom\_garment\_url 留空 | http://aaa/2.jpg |
| input.bottom\_garment\_url | String | Body   | 否  | 下装服饰图的公网 URL，需满足：1. 5KB≤图像文件≤5M2. 150≤图像边长≤40963. 格式支持：jpg、png、jpeg、bmp、heic4. 需上传服饰平拍图，保持服饰是单一主体且完整，背景干净，四周不宜留白过多5. 仅支持 HTTP/HTTPS 链接，不支持本地路径（服饰图示例请参见服饰图要求）说明： - top\_garment\_url 和 bottom\_garment\_url 至少提供一个 - 如果不传此字段，模型将随机生成下装                                                               | http://aaa/3.jpg |
| parameters.resolution      | Int    | Body   | 否  | 输出图片的分辨率：1. -1：默认值，与原图尺寸保持一致2. 1024：表示 576x1024 分辨率3. 1280：表示 720x1280 分辨率说明：若后续还需调用 AI 试衣 - 图片精修 API，此值必须设为 - 1                                                                                                                                                                                     | -1               |
| parameters.restore\_face   | Bool   | Body   | 否  | 是否还原模特图中的人脸：1. true：默认值，保留原图人脸2. false：随机生成一张新的人脸说明：若后续还需调用 AI 试衣 - 图片精修 API，此值必须设为 true                                                                                                                                                                                                             | true             |

#### 3. 出参描述



| 字段                  | 类型     | 描述         | 示例值                                  |
| ------------------- | ------ | ---------- | ------------------------------------ |
| output.task\_id     | String | 异步任务的唯一 ID | a8532587-fa8c-4ef8-82be-0c46b17950d1 |
| output.task\_status | String | 任务提交后的状态   | PENDING                              |
| request\_id         | String | 本次请求的唯一 ID | 7574ee8f-38a3-4b1e-9280-11c33ab46e51 |

#### 4. 请求示例

##### （1）试穿上装

传入 top\_garment\_url（待试穿的上装），模型将随机生成下装：



```
curl --location 'https://dashscope.aliyuncs.com/api/v1/services/aigc/image2image/image-synthesis/' \\

\--header 'X-DashScope-Async: enable' \\

\--header "Authorization: Bearer \$DASHSCOPE\_API\_KEY" \\

\--header 'Content-Type: application/json' \\

\--data '{

&#x20;   "model": "aitryon-plus",

&#x20;   "input": {

&#x20;       "person\_image\_url": "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20250626/ubznva/model\_person.png",

&#x20;       "top\_garment\_url": "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20250626/epousa/short\_sleeve.jpeg"   &#x20;

&#x20;   },

&#x20;   "parameters": {

&#x20;       "resolution": -1,

&#x20;       "restore\_face": true

&#x20;   }

&#x20;}'
```

##### （2）保留模特原下装

包含两个步骤：



1.  调用 AI 试衣 - 图片分割 API，获取模特下装图像 URL。

2.  调用试衣 API，传入 top\_garment\_url（待试穿的上装）和 bottom\_garment\_url（分割获取的下装 URL）：



```
curl --location 'https://dashscope.aliyuncs.com/api/v1/services/aigc/image2image/image-synthesis/' \\

\--header 'X-DashScope-Async: enable' \\

\--header "Authorization: Bearer \$DASHSCOPE\_API\_KEY" \\

\--header 'Content-Type: application/json' \\

\--data '{

&#x20;   "model": "aitryon-plus",

&#x20;   "input": {

&#x20;       "person\_image\_url": "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20250626/ubznva/model\_person.png",

&#x20;       "top\_garment\_url": "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20250626/epousa/short\_sleeve.jpeg",

&#x20;       "bottom\_garment\_url": "图片分割API输出的图像URL"   &#x20;

&#x20;   },

&#x20;   "parameters": {

&#x20;       "resolution": -1,

&#x20;       "restore\_face": true

&#x20;   }

&#x20;}'
```

##### （3）试穿下装

传入 bottom\_garment\_url（待试穿的下装），模型将随机生成上装：



```
curl --location 'https://dashscope.aliyuncs.com/api/v1/services/aigc/image2image/image-synthesis/' \\

\--header 'X-DashScope-Async: enable' \\

\--header "Authorization: Bearer \$DASHSCOPE\_API\_KEY" \\

\--header 'Content-Type: application/json' \\

\--data '{

&#x20;   "model": "aitryon-plus",

&#x20;   "input": {

&#x20;       "person\_image\_url": "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20250626/ubznva/model\_person.png",

&#x20;       "bottom\_garment\_url": "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20250626/rchumi/pants.jpeg"&#x20;

&#x20;   },

&#x20;   "parameters": {

&#x20;       "resolution": -1,

&#x20;       "restore\_face": true

&#x20;   }

}'
```

##### （4）保留模特原上装

包含两个步骤：



1.  调用 AI 试衣 - 图片分割 API，获取模特上装图像 URL。

2.  调用试衣 API，传入 top\_garment\_url（分割获取的上装 URL）和 bottom\_garment\_url（待试穿的下装）：



```
curl --location 'https://dashscope.aliyuncs.com/api/v1/services/aigc/image2image/image-synthesis/' \\

\--header 'X-DashScope-Async: enable' \\

\--header "Authorization: Bearer \$DASHSCOPE\_API\_KEY" \\

\--header 'Content-Type: application/json' \\

\--data '{

&#x20;   "model": "aitryon-plus",

&#x20;   "input": {

&#x20;       "person\_image\_url": "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20250626/ubznva/model\_person.png",

&#x20;       "top\_garment\_url": "图片分割API输出的图像URL",

&#x20;       "bottom\_garment\_url": "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20250626/rchumi/pants.jpeg"    &#x20;

&#x20;   },

&#x20;   "parameters": {

&#x20;       "resolution": -1,

&#x20;       "restore\_face": true

&#x20;   }

&#x20;}'
```

##### （5）试穿上下装

传入 top\_garment\_url（待试穿的上装）和 bottom\_garment\_url（待试穿的下装）：



```
curl --location 'https://dashscope.aliyuncs.com/api/v1/services/aigc/image2image/image-synthesis/' \\

\--header 'X-DashScope-Async: enable' \\

\--header "Authorization: Bearer \$DASHSCOPE\_API\_KEY" \\

\--header 'Content-Type: application/json' \\

\--data '{

&#x20;   "model": "aitryon-plus",

&#x20;   "input": {

&#x20;       "person\_image\_url": "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20250626/ubznva/model\_person.png",

&#x20;       "top\_garment\_url": "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20250626/epousa/short\_sleeve.jpeg",

&#x20;       "bottom\_garment\_url": "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20250626/rchumi/pants.jpeg"&#x20;

&#x20;   },

&#x20;   "parameters": {

&#x20;       "resolution": -1,

&#x20;       "restore\_face": true

&#x20;   }

}'
```

##### （6）试穿连衣裙 / 连体服

仅传入 top\_garment\_url 即可：



```
curl --location 'https://dashscope.aliyuncs.com/api/v1/services/aigc/image2image/image-synthesis/' \\

\--header 'X-DashScope-Async: enable' \\

\--header "Authorization: Bearer \$DASHSCOPE\_API\_KEY" \\

\--header 'Content-Type: application/json' \\

\--data '{

&#x20;   "model": "aitryon-plus",

&#x20;   "input": {

&#x20;       "person\_image\_url": "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20250626/ubznva/model\_person.png",

&#x20;       "top\_garment\_url": "https://help-static-aliyun-doc.aliyuncs.com/file-manage-files/zh-CN/20250626/odngby/dress.jpg"

&#x20;   },

&#x20;   "parameters": {

&#x20;       "resolution": -1,

&#x20;       "restore\_face": true

&#x20;   }

}'
```

#### 5. 响应示例

##### （1）成功响应



```
{

&#x20;   "output": {

&#x20;       "task\_status": "PENDING",

&#x20;       "task\_id": "0385dc79-5ff8-4d82-bcb6-xxxxxx"

&#x20;   },

&#x20;   "request\_id": "4909100c-7b5a-9f92-bfe5-xxxxxx"

}
```

##### （2）异常响应

模型调用失败，请参见错误信息进行解决：



```
{

&#x20;   "code":"InvalidApiKey",

&#x20;   "message":"Invalid API-key provided.",

&#x20;   "request\_id":"fb53c4ec-1c12-4fc4-a580-xxxxxx"

}
```

### （二）步骤 2：根据任务 ID 查询结果

使用上一步获取的 task\_id，发送 GET 请求查询任务状态和结果，请求地址：`https://dashscope.aliyuncs.com/api/v1/tasks/{task_id}`（需将 {task\_id} 替换为实际任务 ID）

#### 1. 说明



*   AI 试衣任务耗时较长（15～30 秒不等），建议采用轮询机制，并设置合理的查询间隔（如 3-5 秒）来获取结果。

*   任务成功后返回的 image\_url 有效期为 24 小时，请及时下载并保存图片。

*   此查询接口的默认 QPS 为 20。如需更高频次的查询或事件通知，请配置异步任务回调。

*   如需批量查询或取消任务，请参见管理异步任务。

#### 2. 入参描述



| 字段            | 类型     | 传参方式     | 必选 | 描述                        | 示例值                                  |
| ------------- | ------ | -------- | -- | ------------------------- | ------------------------------------ |
| Authorization | String | Header   | 是  | API-Key，格式为 Bearer sk-xxx | Bearer sk-xxx                        |
| task\_id      | String | Url Path | 是  | 需要查询任务的 ID                | a8532587-fa8c-4ef8-82be-0c46b17950d1 |

#### 3. 出参描述



| 字段                     | 类型     | 描述                                                                                                                                                        | 示例值                                                             |
| ---------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| output.task\_id        | String | 查询的任务 ID                                                                                                                                                  | a8532587-fa8c-4ef8-82be-0c46b17950d1                            |
| output.task\_status    | String | 任务状态，可能的值包括：1. PENDING：排队中2. PRE-PROCESSING：前置处理中3. RUNNING：处理中4. POST-PROCESSING：后置处理中5. SUCCEEDED：成功6. FAILED：失败7. UNKNOWN：作业不存在或状态未知8. CANCELED：任务取消成功 | SUCCEEDED                                                       |
| output.image\_url      | String | 生成的试衣效果图地址，有效期为 24 小时，请及时下载                                                                                                                               | https://.../result.jpg?Expires=xxx                              |
| output.submit\_time    | String | 任务提交时间                                                                                                                                                    | 2024-07-30 15:39:39.918                                         |
| output.scheduled\_time | String | 任务执行时间                                                                                                                                                    | 2024-07-30 15:39:39.941                                         |
| output.end\_time       | String | 任务完成时间                                                                                                                                                    | 2024-07-30 15:39:55.080                                         |
| output.code            | String | 错误码，任务失败时返回此参数                                                                                                                                            | InvalidParameter                                                |
| output.message         | String | 错误详情，任务失败时返回此参数                                                                                                                                           | The request is missing required parameters or in a wrong format |
| usage.image\_count     | Int    | 本次请求生成的图片张数                                                                                                                                               | 1                                                               |
| request\_id            | String | 本次请求的唯一 ID                                                                                                                                                | 7574ee8f-38a3-4b1e-9280-11c33ab46e51                            |

#### 4. 请求示例

将 86ecf553-d340-4e21-xxxxxxxxx 替换为真实的 task\_id：



```
curl -X GET https://dashscope.aliyuncs.com/api/v1/tasks/86ecf553-d340-4e21-xxxxxxxxx \\

\--header "Authorization: Bearer \$DASHSCOPE\_API\_KEY"
```

**说明**：task\_id 仅支持在 24 小时内查询任务结果，超时会被系统自动清除。

#### 5. 响应示例

##### （1）成功响应

任务数据（如任务状态、图像 URL 等）仅保留 24 小时，超时后会被自动清除。请及时保存生成的图片：



```
{

&#x20;   "request\_id": "98d46cd0-1f90-9231-9a6c-xxxxxx",

&#x20;   "output": {

&#x20;       "task\_id": "15991992-1487-40d4-ae66-xxxxxx",

&#x20;       "task\_status": "SUCCEEDED",

&#x20;       "submit\_time": "2025-06-30 14:37:53.838",

&#x20;       "scheduled\_time": "2025-06-30 14:37:53.858",

&#x20;       "end\_time": "2025-06-30 14:38:11.472",

&#x20;       "image\_url": "http://dashscope-result-hz.oss-cn-hangzhou.aliyuncs.com/tryon.jpg?Expires=xxx"

&#x20;   },

&#x20;   "usage": {

&#x20;       "image\_count": 1

&#x20;   }

}
```

##### （2）失败响应



```
{

&#x20;   "request\_id": "6bf4693b-c6d0-933a-b7b7-xxxxxx",

&#x20;   "output": {

&#x20;       "task\_id": "e32bd911-5a3d-4687-bf53-xxxxxx",

&#x20;       "task\_status": "FAILED",

&#x20;       "code": "InvalidParameter",

&#x20;       "message": "The request is missing required parameters xxxxx"

&#x20; }

}
```

## 六、错误码

大模型服务通用状态码请查阅：错误信息。AI 试衣模型特定错误码如下：



| HTTP 返回码 | 错误码（code）          | 错误信息（message）                                                                                                                                                                                               | 含义说明                                                                                                                                       |
| -------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 400      | InvalidParameter   | The request is missing required parameters or in a wrong format, please check the parameters that you send.                                                                                                 | 请求参数缺失或格式错误。请检查您的请求体是否符合 API 规范。                                                                                                           |
| 400      | InvalidParameter   | Download the media resource timed out during the data inspection process.                                                                                                                                   | 图片下载超时。可能的原因及解决方法如下：1. 网络问题：您的服务器可能与阿里云百炼服务之间的网络不通。请检查网络链接。2. OSS 内网 URL：阿里云百炼服务无法访问内网地址。请改用 OSS 公网 URL。3. 非中国内地资源：跨境网络访问不稳定。请使用中国内地的存储服务。 |
| 400      | InvalidURL         | The request URL is invalid, please check the request URL is available and the request image format is one of the following types: JPEG, JPG, PNG, BMP, and WEBP.                                            | 图片 URL 无效。请检查 URL 是否为公网地址或者图片格式是否符合要求。                                                                                                     |
| 400      | InvalidPerson      | The input image has no human body or multi human bodies. Please upload other image with single person.                                                                                                      | 模特图不合规。请确保输入图片中有且仅有一个完整的人。                                                                                                                 |
| 400      | InvalidGarment     | Missing clothing image.Please input at least one top garment or bottom garment image.                                                                                                                       | 缺少服饰图片。请至少提供一张上装 (top\_garment\_url) 或下装 (bottom\_garment\_url) 的图片。                                                                       |
| 400      | InvalidInputLength | The image resolution is invalid, please make sure that the largest length of image is smaller than 4096, and the smallest length of image is larger than 150. and the size of image ranges from 5KB to 5MB. | 图片尺寸或文件大小不符合要求。请参见输入图片要求。                                                                                                                  |

## 七、常见问题

### （一）如何准备模特图和服饰图



1.  **为什么必须使用服装平铺图？**

    平铺图能最清晰地展示服装的版型、图案和轮廓，帮助 AI 准确理解服装结构，从而生成更贴合、更真实的试穿效果。

2.  **如果没有服装平铺图怎么办？**

    您可以尝试将服装平整地放置在干净的背景上（如地面或墙面）进行俯拍，或者让真人模特 / 人台穿着后拍摄正面照。关键是确保服装完整、平整、无遮挡。

3.  **如何选择合适的模特图？**

    选择正面、清晰、完整的全身照。模特穿着的衣物应尽量简洁修身（如 T 恤 + 短裤），避免穿着长裙、宽袍大袖或有多层叠穿。同时，确保模特的双手双脚清晰可见，无配饰（如包、伞）遮挡。

4.  **如果没有合适的模特图怎么办？**

    我们提供了一批符合规范的模特参考图，您可以点击此处下载使用。

### （二）模型效果不符合预期



1.  **为什么生成的图片效果不佳，缺少细节？**

    主要原因可能是输入的服装图质量不高。请确保服装图高清、完整，没有因折叠或拍摄角度问题导致细节丢失。高质量的输入是高质量输出的保障。

### （三）功能使用咨询



1.  **如何为连衣裙或连体衣生成试衣图？**

    将连衣裙 / 连体衣的图片 URL 填入 input.top\_garment\_url 字段，并将 input.bottom\_garment\_url 字段留空或不传。

> （注：文档部分内容可能由 AI 生成）