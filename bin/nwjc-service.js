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
const CONFIG = require('../lib/config');

// 默认配置
const DEFAULT_PORT = 3001;
const DEFAULT_HOST = '0.0.0.0';

// 解析命令行参数
const args = process.argv.slice(2);
const cliOptions = {
  port: DEFAULT_PORT,
  host: DEFAULT_HOST,
  nwjcPath: null,
  skipAsk: false
};

// 解析参数
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--port' || arg === '-p') {
    cliOptions.port = parseInt(args[++i]) || DEFAULT_PORT;
  } else if (arg === '--host') {
    cliOptions.host = args[++i] || DEFAULT_HOST;
  } else if (arg === '--nwjc-path' || arg === '-n') {
    cliOptions.nwjcPath = args[++i] || null;
  } else if (arg === '--help') {
    console.log(`
nwjc 编译服务

用法:
  nwjc-service [选项]

选项:
  --port <端口>        指定端口号 (默认: 3001)
  --host <地址>        指定监听地址 (默认: 0.0.0.0)
  --nwjc-path, -n <路径>   指定 nwjc 工具路径
  --help               显示帮助信息

示例:
  nwjc-service
  nwjc-service --port 4000
  nwjc-service --nwjc-path "C:\\path\\to\\nwjc.exe"
  nwjc-service --nwjc-path "/path/to/nwjc" --port 4000

配置文件:
  首次运行时会自动询问 nwjc 路径，配置保存到 ~/.nwjc-compiler-service.json
  下次启动时自动使用保存的配置，无需再次输入

环境变量:
  NWJC_PATH                nwjc 工具路径
  NWJC_SERVICE_PORT        服务端口
  NWJC_SERVICE_HOST        监听地址
    `);
    process.exit(0);
  } else if (!arg.startsWith('-')) {
    // 位置参数（向后兼容）
    if (!cliOptions.portChanged) {
      cliOptions.port = parseInt(arg) || DEFAULT_PORT;
      cliOptions.portChanged = true;
    } else {
      cliOptions.host = arg || DEFAULT_HOST;
    }
  }
}

// 主函数（异步）
async function main() {
  // 加载配置（合并配置文件、环境变量、CLI 参数）
  const loadedConfig = await CONFIG.loadConfig(cliOptions);
  const options = loadedConfig.config;

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

  // 显示配置信息
  CONFIG.showConfigInfo(loadedConfig);
  console.log('');

  // 启动服务器
  const app = SERVER.createApp(platformInfo, options);

  const server = app.listen(options.port, options.host, () => {
    console.log(`✅ 服务已启动: http://${options.host}:${options.port}`);
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
}

// 启动
main().catch(error => {
  console.error('❌ 启动失败:', error);
  process.exit(1);
});
