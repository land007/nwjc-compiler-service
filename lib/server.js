/**
 * Express 服务器 - 提供 nwjc 编译 API
 */

const express = require('express');
const cors = require('cors');
const COMPILER = require('./compiler');

/**
 * 创建 Express 应用
 */
function createApp(platformInfo) {
  const app = express();

  // 中间件
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // 健康检查
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      platform: platformInfo,
      timestamp: new Date().toISOString()
    });
  });

  // 获取平台信息
  app.get('/platform', (req, res) => {
    res.json(platformInfo);
  });

  // 编译 API
  app.post('/compile', async (req, res) => {
    try {
      const { sourceCode, filename = 'source.js' } = req.body;

      if (!sourceCode) {
        return res.status(400).json({
          error: 'Missing sourceCode in request body'
        });
      }

      console.log(`[${new Date().toISOString()}] 收到编译请求: ${filename}`);
      console.log(`  源代码长度: ${sourceCode.length} 字节`);

      // 调用编译器
      const result = await COMPILER.compile(sourceCode, filename);

      console.log(`[${new Date().toISOString()}] 编译成功: ${result.binFilename}`);
      console.log(`  源文件: ${result.sourceSize} bytes`);
      console.log(`  编译后: ${result.binSize} bytes`);
      console.log(`  耗时: ${result.compileTime}ms`);

      res.json({
        success: true,
        platform: platformInfo,
        binFilename: result.binFilename,
        binData: result.binData,  // Base64 编码的二进制数据
        sourceSize: result.sourceSize,
        binSize: result.binSize,
        compileTime: result.compileTime
      });

    } catch (error) {
      console.error(`[${new Date().toISOString()}] 编译失败:`, error.message);

      res.status(500).json({
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  return app;
}

module.exports = { createApp };
