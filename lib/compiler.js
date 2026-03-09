/**
 * nwjc 编译器
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

/**
 * 编译 JavaScript 为 .bin
 */
async function compile(sourceCode, filename, requestId = 'compile') {
  const startTime = Date.now();

  // 创建临时目录
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nwjc-compile-'));
  const sourceFile = path.join(tmpDir, filename);
  const binFile = path.join(tmpDir, filename.replace(/\.js$/, '.bin'));

  console.log(`[${requestId}] 📁 临时目录: ${tmpDir}`);
  console.log(`[${requestId}] 📄 源文件: ${sourceFile}`);

  try {
    // 写入源代码
    fs.writeFileSync(sourceFile, sourceCode, 'utf8');
    console.log(`[${requestId}] ✅ 源代码已写入 (${sourceCode.length} 字节)`);

    // 查找 nwjc
    console.log(`[${requestId}] 🔍 查找 nwjc 工具...`);
    const nwjcPath = findNwjc(requestId);

    if (!nwjcPath) {
      throw new Error('nwjc 工具未找到。\n\n请使用以下方式之一指定 nwjc 路径：\n' +
        '1. CLI 参数: npx nwjc-compiler-service --nwjc-path C:\\path\\to\\nwjc.exe\n' +
        '2. 环境变量: set NWJC_PATH=C:\\path\\to\\nwjc.exe\n' +
        '3. 安装 NW.js SDK: npm install nw\n\n' +
        '下载地址: https://nwjs.io/downloads/');
    }

    console.log(`[${requestId}] ✅ 找到 nwjc: ${nwjcPath}`);

    // 执行编译
    console.log(`[${requestId}] 🔨 执行编译: nwjc "${sourceFile}" "${binFile}"`);
    const compileStartTime = Date.now();

    try {
      execSync(`"${nwjcPath}" "${sourceFile}" "${binFile}"`, {
        stdio: 'pipe',  // 改为 pipe 以便控制输出
        timeout: 30000  // 30 秒超时
      });

      const compileTime = Date.now() - compileStartTime;
      console.log(`[${requestId}] ✅ nwjc 执行成功 (${compileTime}ms)`);

    } catch (error) {
      const compileTime = Date.now() - compileStartTime;
      console.error(`[${requestId}] ❌ nwjc 执行失败 (${compileTime}ms)`);

      // 输出错误详情
      if (error.stdout) {
        console.error(`[${requestId}]    stdout: ${error.stdout.toString()}`);
      }
      if (error.stderr) {
        console.error(`[${requestId}]    stderr: ${error.stderr.toString()}`);
      }

      throw new Error(`nwjc 编译失败: ${error.message}`);
    }

    // 读取编译后的 .bin 文件
    if (!fs.existsSync(binFile)) {
      throw new Error('编译失败：未生成 .bin 文件');
    }

    const binBuffer = fs.readFileSync(binFile);
    const binData = binBuffer.toString('base64');

    console.log(`[${requestId}] ✅ 编译产物: ${binFile} (${binBuffer.length} bytes)`);

    // 清理临时文件
    fs.rmSync(tmpDir, { recursive: true, force: true });
    console.log(`[${requestId}] 🧹 临时文件已清理`);

    const compileTime = Date.now() - startTime;

    return {
      binFilename: path.basename(binFile),
      binData: binData,
      sourceSize: Buffer.byteLength(sourceCode, 'utf8'),
      binSize: binBuffer.length,
      compileTime: compileTime
    };

  } catch (error) {
    // 清理临时文件
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      console.log(`[${requestId}] 🧹 临时文件已清理 (清理后)`);
    }
    throw error;
  }
}

/**
 * 查找 nwjc 工具
 */
function findNwjc(requestId = 'findNwjc') {
  const platform = process.platform;
  const arch = process.arch;

  // 可能的 nwjc 路径
  const possiblePaths = [
    // 0. 用户指定路径（环境变量）- 优先级最高
    process.env.NWJC_PATH,

    // 1. 当前项目 node_modules
    path.join(process.cwd(), 'node_modules', '.bin', 'nwjc'),
    path.join(process.cwd(), 'node_modules', 'nw', 'bin', 'nwjc'),
    path.join(process.cwd(), 'sdk', `nwjs-sdk-v*-osx-${arch}`, 'nwjc'),
    path.join(process.cwd(), 'sdk', `nwjs-sdk-v*-linux-${arch}`, 'nwjc'),
    path.join(process.cwd(), 'sdk', `nwjs-sdk-v*-win-${arch}`, 'nwjc.exe'),

    // 2. 全局安装
    path.join(process.env.HOME || process.env.USERPROFILE, '.npm-global', 'bin', 'nwjc'),
  ].filter(Boolean);

  console.log(`[${requestId}] 🔍 搜索路径 (${possiblePaths.length} 个):`);

  for (let i = 0; i < possiblePaths.length; i++) {
    const nwjcPath = possiblePaths[i];
    try {
      // 处理通配符
      const expandedPath = expandPath(nwjcPath);

      if (nwjcPath === process.env.NWJC_PATH) {
        console.log(`[${requestId}]    [${i + 1}] ${nwjcPath} (环境变量)`);
      } else {
        console.log(`[${requestId}]    [${i + 1}] ${nwjcPath}`);
      }

      if (fs.existsSync(expandedPath)) {
        console.log(`[${requestId}]    ✅ 找到!`);
        return expandedPath;
      }
    } catch (error) {
      console.log(`[${requestId}]    [${i + 1}] ${nwjcPath} (无效路径)`);
    }
  }

  console.log(`[${requestId}]    ❌ 未找到 nwjc`);
  return null;
}

/**
 * 展开路径通配符（简化版）
 */
function expandPath(pattern) {
  // 简化实现：直接返回第一个匹配的文件
  const dir = path.dirname(pattern);
  const base = path.basename(pattern);

  if (!base.includes('*')) {
    return pattern;
  }

  try {
    const files = fs.readdirSync(dir);
    const matched = files.find(f => f.match(base.replace(/\*/g, '.*')));
    return matched ? path.join(dir, matched) : pattern;
  } catch (error) {
    return pattern;
  }
}

module.exports = { compile, findNwjc };
