#!/usr/bin/env node
/**
 * nwjc 编译服务
 *
 * 启动方式：
 *   npx nwjc-compiler-service
 *   或
 *   npm install -g nwjc-compiler-service
 *   nwjc-service
 */

const path = require('path');

const SERVER = require('../lib/server');
const PLATFORM = require('../lib/platform');

// 默认配置
const DEFAULT_PORT = 3001;
const DEFAULT_HOST = '0.0.0.0';

// 从命令行参数读取配置
const args = process.argv.slice(2);
const port = parseInt(args[0]) || process.env.NWJC_SERVICE_PORT || DEFAULT_PORT;
const host = args[1] || process.env.NWJC_SERVICE_HOST || DEFAULT_HOST;

// 检测平台信息
const platformInfo = PLATFORM.detect();
console.log('='.repeat(60));
console.log('  nwjc 编译服务');
console.log('='.repeat(60));
console.log(`  平台: ${platformInfo.platform}`);
console.log(`  架构: ${platformInfo.arch}`);
console.log(`  Node: ${process.version}`);
console.log(`  监听: ${host}:${port}`);
console.log('='.repeat(60));
console.log('');

// 启动服务器
const app = SERVER.createApp(platformInfo);

const server = app.listen(port, host, () => {
  console.log(`✅ 服务已启动: http://${host}:${port}`);
  console.log('');
  console.log('API 端点:');
  console.log(`  POST  /compile          - 编译 JavaScript 为 .bin`);
  console.log(`  GET   /health           - 健康检查`);
  console.log(`  GET   /platform         - 获取平台信息`);
  console.log('');
  console.log('按 Ctrl+C 停止服务');
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在停止服务...');
  server.close(() => {
    console.log('服务已停止');
    process.exit(0);
  });
});
