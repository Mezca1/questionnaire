# 在线问卷系统实验报告

## 一、实验目的
- 掌握 Web 应用系统的通信实现方法  
- 理解 HTTP/HTTPS 协议在实际项目中的应用  
- 学习前后端分离架构中的通信机制  
- 实现问卷系统的核心功能  

## 二、实验环境
| 组件         | 技术/工具                 |
|--------------|--------------------------|
| 操作系统     | Windows 10               |
| 开发工具     | Visual Studio Code       |
| 运行环境     | Node.js                  |
| 数据库       | MySQL                    |
| 浏览器       | Chrome                   |
| 前端框架     | Vue.js 3.0 + Element Plus |
| 后端框架     | Express                  |

## 三、系统架构设计

### 3.1 整体架构
```plaintext
客户端层（Vue.js）  
↓  
HTTP/HTTPS  
应用服务器层（Node.js + Express）  
↓  
TCP  
数据库层（MySQL）  
```

### 3.2 技术栈详解
**前端技术栈：**  
- Vue.js 3.0：前端框架  
- Element Plus：UI 组件库  
- Axios：HTTP 客户端  
- Vue Router：路由管理  
- Vuex：状态管理  

**后端技术栈：**  
- Node.js：运行环境  
- Express：Web 框架  
- MySQL：关系型数据库  
- JWT：身份认证  

## 四、网络通信实现

### 4.1 网络协议选择
**应用层协议：**  
- HTTP/HTTPS  
- 端口：80/443  
- 特点：无状态、请求-响应模式  

**传输层协议：**  
- TCP  
- 特点：可靠传输、面向连接  
- 端口分配：  
  - 前端：8080  
  - 后端：3000  
  - 数据库：3306  

### 4.2 网络通信流程
**客户端发起请求**  
```javascript
// 建立TCP连接  
const socket = new WebSocket('ws://localhost:3000')  
// 发送HTTP请求  
const response = await axios.get('/api/questionnaires')  
```

**服务器处理请求**  
```javascript
// 监听TCP连接  
app.listen(3000, () => {  
   console.log('服务器监听3000端口')  
})  
// 处理HTTP请求  
app.get('/api/questionnaires', (req, res) => {  
   // 处理请求  
})  
```

### 4.3 通信配置
```javascript
// 前端配置  
const api = axios.create({  
   baseURL: 'http://localhost:3000',  
   timeout: 5000,  
   headers: {  
      'Content-Type': 'application/json'  
   }  
})  

// 后端配置  
const app = express()  
app.listen(3000, () => {  
   console.log('服务器运行在3000端口')  
})  
```

### 4.4 网络性能优化
**连接池管理**  
```javascript
// 数据库连接池  
const pool = mysql.createPool({  
   connectionLimit: 10,  
   host: 'localhost',  
   user: 'root',  
   password: 'password',  
   database: 'questionnaire'  
})  
```

**请求超时处理**  
```javascript
// 设置超时时间  
axios.defaults.timeout = 5000  
// 超时处理  
axios.interceptors.response.use(  
   response => response,  
   error => {  
      if (error.code === 'ECONNABORTED') {  
         console.error('请求超时')  
      }  
      return Promise.reject(error)  
   }  
)  
```

### 4.5 API 接口设计
**问卷管理接口：**  
```http
GET /api/questionnaires      # 获取问卷列表  
POST /api/questionnaires     # 创建新问卷  
GET /api/questionnaires/:id  # 获取单个问卷  
PUT /api/questionnaires/:id  # 更新问卷  
DELETE /api/questionnaires/:id # 删除问卷  
```

**答案管理接口：**  
```http
POST /api/questionnaires/:id/answers # 提交答案  
GET /api/questionnaires/:id/answers  # 获取答案列表  
```

### 4.6 网络安全性
**HTTPS 配置**  
```javascript
const https = require('https')  
const fs = require('fs')  
const options = {  
   key: fs.readFileSync('private.key'),  
   cert: fs.readFileSync('certificate.crt')  
}  
https.createServer(options, app).listen(443)  
```

**防火墙规则**  
- 80 (HTTP)  
- 443 (HTTPS)  
- 3000 (API)  
- 3306 (MySQL)  

## 五、数据交互实现

### 5.1 数据格式
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

### 5.2 通信流程
1. 客户端发起 HTTP 请求  
2. 服务器接收请求  
3. 中间件处理（认证、日志等）  
4. 业务逻辑处理  
5. 数据库操作  
6. 返回响应  

## 六、安全性实现

### 6.1 身份认证
- JWT（JSON Web Token）认证机制  
  - 生成 token  
  - 验证 token  
  - token 过期处理  

### 6.2 数据加密
- HTTPS 协议  
  - SSL/TLS 加密  
  - 证书验证  
  - 安全套接字层  

### 6.3 跨域处理
```javascript
app.use(cors({  
   origin: 'http://localhost:8080',  
   methods: ['GET', 'POST', 'PUT', 'DELETE'],  
   allowedHeaders: ['Content-Type', 'Authorization']  
}))  
```

## 七、具体功能实现

### 7.1 问卷查看实现
```vue
<script setup>
const viewAnswers = async (id) => {  
      try {  
        const response = await questionnaires.getAnswers(id)  
        currentAnswers.value = response.data.answers  
        answersDialogVisible.value = true  
      } catch (error) {  
        console.error('获取问卷填写情况错误:', error)  
        ElMessage.error(error.response?.data?.message || '获取问卷填写情况失败')  
      }  
    }  
    
const viewMyAnswers = async () => {  
      try {  
        const response = await questionnaires.getMyAnswers()  
        myAnsweredQuestionnaires.value = response.data.questionnaires  
        myAnswersDialogVisible.value = true  
      } catch (error) {  
        console.error('获取我填写的问卷错误:', error)  
        ElMessage.error(error.response?.data?.message || '获取我填写的问卷失败')  
      }  
    }  
</script>
```

### 7.2 数据加载实现
```javascript
const loadQuestionnaire = async () => {  
   try {  
      const response = await questionnaires.get(route.params.id)  
      questionnaire.value = response.data.questionnaire  
   } catch (error) {  
      console.error('加载问卷失败:', error)  
   }  
}  
```

## 八、实验结果

### 8.1 功能测试
**完整的启动命令步骤：**  
1. 先启动 MySQL 数据库  
2. 在项目目录下：  
```bash
# 安装项目依赖  
npm install  
```
3. 启动后端服务器：  
```bash
cd server  
node index.js  
```
4. 启动前端开发服务器（新开终端）：  
```bash
npm run serve  
```

**补充说明：**  
- 前端服务：http://localhost:8080  
- 后端服务：http://localhost:3000  
- 端口占用可在 vue.config.js（前端）或 server/index.js（后端）中修改  

**测试结果：**  
- 注册与登录：✅ 成功  
- 问卷创建：✅ 成功  
- 问卷填写：✅ 成功  
- 答案查看：✅ 成功  

### 8.2 性能测试
- 响应时间：<100ms  
- 并发处理：正常  
- 数据完整性：良好  

## 九、实验结论
1. 系统成功实现了基于 HTTP/HTTPS、TCP 的通信机制  
2. 前后端分离架构运行稳定  
3. 数据交换安全可靠  
4. 错误处理机制完善  
5. 系统具有良好的可扩展性  

## 十、实验心得
1. 深入理解了 Web 通信原理  
2. 掌握了前后端分离开发方法  
3. 提高了网络编程能力  
4. 加深了对 HTTP、TCP 协议的理解  
5. 学会了系统架构设计方法  

## 十一、参考文献
1. HTTP 协议规范  
2. Node.js 官方文档  
3. Vue.js 官方文档  
4. Express.js 官方文档  
5. MySQL 官方文档  