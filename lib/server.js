/**
 * Express 服务器 - 提供 nwjc 编译 API
 */

const express = require('express');
const cors = require('cors');
const COMPILER = require('./compiler');

/**
 * 创建 Express 应用
 */
function createApp(platformInfo, options = {}) {
  const app = express();

  // 请求日志中间件
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const clientIP = req.ip || req.connection.remoteAddress;
    console.log(`[${timestamp}] ${req.method} ${req.path} from ${clientIP}`);
    next();
  });

  // 中间件
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // 健康检查
  app.get('/health', (req, res) => {
    const healthInfo = {
      status: 'ok',
      platform: platformInfo,
      timestamp: new Date().toISOString()
    };

    // 添加 nwjc 路径信息
    if (process.env.NWJC_PATH) {
      healthInfo.nwjcPath = process.env.NWJC_PATH;
    }

    res.json(healthInfo);
  });

  // 获取平台信息
  app.get('/platform', (req, res) => {
    const platformInfoWithExtras = { ...platformInfo };

    // 添加 nwjc 路径信息
    if (process.env.NWJC_PATH) {
      platformInfoWithExtras.nwjcPath = process.env.NWJC_PATH;
    }

    res.json(platformInfoWithExtras);
  });

  // 编译 API
  app.post('/compile', async (req, res) => {
    const requestId = Date.now().toString(36);
    const startTime = Date.now();

    try {
      const { sourceCode, filename = 'source.js' } = req.body;

      if (!sourceCode) {
        console.log(`[${requestId}] ❌ 错误: 缺少 sourceCode`);
        return res.status(400).json({
          success: false,
          error: 'Missing sourceCode in request body'
        });
      }

      console.log(`[${requestId}] 📝 收到编译请求: ${filename}`);
      console.log(`[${requestId}]    源代码长度: ${sourceCode.length} 字节`);
      console.log(`[${requestId}]    客户端: ${req.ip || req.connection.remoteAddress}`);

      // 调用编译器
      console.log(`[${requestId}] 🔧 开始编译...`);
      const result = await COMPILER.compile(sourceCode, filename, requestId);

      const elapsedTime = Date.now() - startTime;

      console.log(`[${requestId}] ✅ 编译成功!`);
      console.log(`[${requestId}]    输出文件: ${result.binFilename}`);
      console.log(`[${requestId}]    源文件: ${result.sourceSize} bytes`);
      console.log(`[${requestId}]    编译后: ${result.binSize} bytes`);
      console.log(`[${requestId}]    耗时: ${result.compileTime}ms`);
      console.log(`[${requestId}]    总耗时: ${elapsedTime}ms`);

      res.json({
        success: true,
        platform: platformInfo,
        binFilename: result.binFilename,
        binData: result.binData,  // Base64 编码的二进制数据
        sourceSize: result.sourceSize,
        binSize: result.binSize,
        compileTime: result.compileTime,
        requestId: requestId
      });

    } catch (error) {
      const elapsedTime = Date.now() - startTime;

      console.error(`[${requestId}] ❌ 编译失败:`, error.message);
      console.error(`[${requestId}]    错误类型: ${error.name}`);
      console.error(`[${requestId}]    耗时: ${elapsedTime}ms`);

      if (process.env.NODE_ENV === 'development') {
        console.error(`[${requestId}]    堆栈:`, error.stack);
      }

      res.status(500).json({
        success: false,
        error: error.message,
        errorType: error.name,
        requestId: requestId,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  return app;
}

module.exports = { createApp };
