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
async function compile(sourceCode, filename) {
  const startTime = Date.now();

  // 创建临时目录
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nwjc-compile-'));
  const sourceFile = path.join(tmpDir, filename);
  const binFile = path.join(tmpDir, filename.replace(/\.js$/, '.bin'));

  try {
    // 写入源代码
    fs.writeFileSync(sourceFile, sourceCode, 'utf8');

    // 查找 nwjc
    const nwjcPath = findNwjc();

    if (!nwjcPath) {
      throw new Error('nwjc 工具未找到。请安装 NW.js SDK: https://docs.nwjs.io');
    }

    console.log(`使用 nwjc: ${nwjcPath}`);

    // 执行编译
    try {
      execSync(`"${nwjcPath}" "${sourceFile}" "${binFile}"`, {
        stdio: 'inherit',
        timeout: 30000  // 30 秒超时
      });
    } catch (error) {
      throw new Error(`nwjc 编译失败: ${error.message}`);
    }

    // 读取编译后的 .bin 文件
    if (!fs.existsSync(binFile)) {
      throw new Error('编译失败：未生成 .bin 文件');
    }

    const binBuffer = fs.readFileSync(binFile);
    const binData = binBuffer.toString('base64');

    // 清理临时文件
    fs.rmSync(tmpDir, { recursive: true, force: true });

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
    }
    throw error;
  }
}

/**
 * 查找 nwjc 工具
 */
function findNwjc() {
  const platform = process.platform;
  const arch = process.arch;

  // 可能的 nwjc 路径
  const possiblePaths = [
    // 1. 当前项目 node_modules
    path.join(process.cwd(), 'node_modules', '.bin', 'nwjc'),
    path.join(process.cwd(), 'node_modules', 'nw', 'bin', 'nwjc'),
    path.join(process.cwd(), 'sdk', `nwjs-sdk-v*-osx-${arch}`, 'nwjc'),
    path.join(process.cwd(), 'sdk', `nwjs-sdk-v*-linux-${arch}`, 'nwjc'),
    path.join(process.cwd(), 'sdk', `nwjs-sdk-v*-win-${arch}`, 'nwjc.exe'),

    // 2. 全局安装
    path.join(process.env.HOME || process.env.USERPROFILE, '.npm-global', 'bin', 'nwjc'),

    // 3. 用户指定路径
    process.env.NWJC_PATH,
  ].filter(Boolean);

  for (const nwjcPath of possiblePaths) {
    try {
      // 处理通配符
      const expandedPath = expandPath(nwjcPath);
      if (fs.existsSync(expandedPath)) {
        return expandedPath;
      }
    } catch (error) {
      // 忽略错误，继续查找
    }
  }

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
