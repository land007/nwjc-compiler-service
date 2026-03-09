#!/usr/bin/env node
/**
 * nwjc 编译服务
 *
 * 启动方式：
 *   npx nwjc-compiler-service
 *   npx nwjc-compiler-service --nwjc-path C:\path\to\nwjc
 *   npx nwjc-compiler-service --port 4000
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

// 解析命令行参数
const args = process.argv.slice(2);
const options = {
  port: DEFAULT_PORT,
  host: DEFAULT_HOST,
  nwjcPath: null
};

// 解析参数
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--port' || arg === '-p') {
    options.port = parseInt(args[++i]) || DEFAULT_PORT;
  } else if (arg === '--host' || arg === '-h') {
    options.host = args[++i] || DEFAULT_HOST;
  } else if (arg === '--nwjc-path' || arg === '-n') {
    options.nwjcPath = args[++i] || null;
  } else if (!arg.startsWith('-')) {
    // 位置参数（向后兼容）
    if (!options.portChanged) {
      options.port = parseInt(arg) || DEFAULT_PORT;
      options.portChanged = true;
    } else {
      options.host = arg || DEFAULT_HOST;
    }
  }
}

// 环境变量优先级更高
options.port = process.env.NWJC_SERVICE_PORT || options.port;
options.host = process.env.NWJC_SERVICE_HOST || options.host;
options.nwjcPath = process.env.NWJC_PATH || options.nwjcPath;

// 设置 nwjc 路径到环境变量，供 compiler 使用
if (options.nwjcPath) {
  process.env.NWJC_PATH = options.nwjcPath;
}

// 检测平台信息
const platformInfo = PLATFORM.detect();
console.log('='.repeat(60));
console.log('  nwjc 编译服务');
console.log('='.repeat(60));
console.log(`  平台: ${platformInfo.platform}`);
console.log(`  架构: ${platformInfo.arch}`);
console.log(`  Node: ${process.version}`);
console.log(`  监听: ${options.host}:${options.port}`);
if (options.nwjcPath) {
  console.log(`  nwjc: ${options.nwjcPath}`);
}
console.log('='.repeat(60));
console.log('');

// 启动服务器
const app = SERVER.createApp(platformInfo, options);

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
