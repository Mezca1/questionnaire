

# 在线问卷系统网络协议与技术实现实验报告

## 1. 网络协议架构

### 1.1 应用层协议
- HTTP/HTTPS协议
  - 使用RESTful API设计规范
  - 支持GET、POST、PUT、DELETE等HTTP方法
  - 采用JSON格式进行数据交换
  - 状态码规范使用（200、201、400、401、403、404、500等）

### 1.2 传输层协议
- TCP协议
  - 确保数据传输的可靠性
  - 实现全双工通信
  - 保证数据包的顺序性

## 2. 网络通信实现

### 2.1 客户端请求实现
```javascript
// 使用Axios进行HTTP请求
const loadQuestionnaire = async () => {
  try {
    const response = await questionnaires.get(route.params.id)
    // 处理响应数据
  } catch (error) {
    // 错误处理
  }
}
```

### 2.2 服务器响应处理
```javascript
// 服务器端路由处理
app.get('/api/questionnaires/:id', async (req, res) => {
  try {
    const questionnaire = await db.getQuestionnaire(req.params.id)
    res.json({
      status: 'success',
      data: { questionnaire }
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    })
  }
})
```

## 3. 数据交互流程

### 3.1 请求-响应模型
1. 客户端发起HTTP请求
   - 请求头包含认证信息
   - 请求体包含JSON格式数据

2. 服务器处理请求
   - 解析请求头
   - 验证用户身份
   - 处理业务逻辑
   - 访问数据库

3. 返回响应
   - 设置响应头
   - 返回JSON格式数据
   - 包含状态码和消息

### 3.2 数据格式规范
```json
// 请求格式
{
  "method": "POST",
  "url": "/api/questionnaires",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer <token>"
  },
  "body": {
    "title": "问卷标题",
    "questions": [...]
  }
}

// 响应格式
{
  "status": "success",
  "data": {
    "questionnaire": {...}
  }
}
```

## 4. 网络安全性实现

### 4.1 身份认证
- JWT（JSON Web Token）认证机制
  - 生成token
  - 验证token
  - token过期处理

### 4.2 数据加密
- HTTPS协议
  - SSL/TLS加密
  - 证书验证
  - 安全套接字层

## 5. 具体网络功能实现

### 5.1 问卷数据获取
```javascript
// 前端实现
const loadQuestionnaire = async () => {
  try {
    const response = await questionnaires.get(route.params.id)
    if (!response.data || !response.data.questionnaire) {
      ElMessage.error('问卷数据格式错误')
      return
    }
    questionnaire.value = response.data.questionnaire
  } catch (error) {
    // 网络错误处理
  }
}
```

### 5.2 答案提交
```javascript
// 前端实现
const submitAnswer = async (answerData) => {
  try {
    const response = await questionnaires.submitAnswer(questionnaireId, answerData)
    // 处理响应
  } catch (error) {
    // 错误处理
  }
}
```

## 6. 网络错误处理

### 6.1 客户端错误处理
```javascript
try {
  const response = await api.getData()
} catch (error) {
  if (error.response) {
    // 服务器响应错误
    switch (error.response.status) {
      case 404:
        // 资源不存在
        break
      case 401:
        // 未授权
        break
      case 500:
        // 服务器错误
        break
    }
  } else if (error.request) {
    // 请求发送失败
  } else {
    // 其他错误
  }
}
```

### 6.2 服务器错误处理
```javascript
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    status: 'error',
    message: '服务器内部错误'
  })
})
```

## 7. 网络通信特点

1. 采用RESTful API设计
   - 资源导向
   - 无状态通信
   - 统一的接口规范

2. 异步通信
   - Promise异步处理
   - async/await语法
   - 错误处理机制

3. 数据格式统一
   - JSON数据交换
   - 统一的响应格式
   - 规范的错误信息

## 8. 总结

本项目在网络协议实现方面主要特点：

1. 采用HTTP/HTTPS作为主要通信协议
2. 实现RESTful API设计规范
3. 使用JWT进行身份认证
4. 统一的错误处理机制
5. 规范的数据交换格式

通过合理的网络协议选择和实现，确保了系统的可靠性和安全性，为问卷系统提供了稳定的网络通信基础。

这份报告主要聚焦于网络协议的具体实现和技术细节，如果您需要某个具体方面的更详细说明，请告诉我。