/**
 * 配置管理 - 持久化 nwjc 路径等配置
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

/**
 * 获取配置文件路径
 */
function getConfigFilePath() {
  const homeDir = os.homedir();
  return path.join(homeDir, '.nwjc-compiler-service.json');
}

/**
 * 读取配置文件
 */
function readConfig() {
  const configPath = getConfigFilePath();

  if (!fs.existsSync(configPath)) {
    return {};
  }

  try {
    const content = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`⚠️  读取配置文件失败: ${error.message}`);
    return {};
  }
}

/**
 * 写入配置文件
 */
function writeConfig(config) {
  const configPath = getConfigFilePath();

  try {
    // 只保存必要的配置项
    const configToSave = {};
    if (config.nwjcPath) {
      configToSave.nwjcPath = config.nwjcPath;
    }
    if (config.port && config.port !== 3001) {
      configToSave.port = config.port;
    }
    if (config.host && config.host !== '0.0.0.0') {
      configToSave.host = config.host;
    }

    fs.writeFileSync(configPath, JSON.stringify(configToSave, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`❌ 写入配置文件失败: ${error.message}`);
    return false;
  }
}

/**
 * 交互式询问 nwjc 路径
 */
function askNwjcPath() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('');
    console.log('❓ 未找到 nwjc 工具，需要配置 nwjc 路径');
    console.log('');
    console.log('请输入 nwjc.exe 的完整路径:');
    console.log('  Windows 示例: C:\\Users\\YourName\\Desktop\\nwjs-sdk-v0.109.0-win-x64\\nwjc.exe');
    console.log('  macOS 示例: /path/to/nwjs-sdk/nwjc');
    console.log('  Linux 示例: /path/to/nwjs-sdk/nwjc');
    console.log('');
    console.log('💡 提示: 按 Enter 跳过，稍后通过环境变量 NWJC_PATH 指定');
    console.log('');

    rl.question('nwjc 路径: ', (answer) => {
      rl.close();
      resolve(answer.trim() || null);
    });
  });
}

/**
 * 加载配置（合并配置文件、环境变量、CLI 参数）
 */
async function loadConfig(cliOptions) {
  // 1. 从配置文件读取
  const fileConfig = readConfig();

  // 2. 合并环境变量
  const envConfig = {
    nwjcPath: process.env.NWJC_PATH,
    port: process.env.NWJC_SERVICE_PORT ? parseInt(process.env.NWJC_SERVICE_PORT) : undefined,
    host: process.env.NWJC_SERVICE_HOST
  };

  // 3. 合并 CLI 参数（最高优先级）
  let finalConfig = {
    nwjcPath: cliOptions.nwjcPath || envConfig.nwjcPath || fileConfig.nwjcPath || null,
    port: cliOptions.port || envConfig.port || fileConfig.port || 3001,
    host: cliOptions.host || envConfig.host || fileConfig.host || '0.0.0.0'
  };

  // 4. 如果没有 nwjc 路径，交互式询问
  if (!finalConfig.nwjcPath && !cliOptions.skipAsk) {
    const answeredPath = await askNwjcPath();
    if (answeredPath) {
      finalConfig.nwjcPath = answeredPath;
      // 自动保存到配置文件
      writeConfig(finalConfig);
      console.log(`✅ 配置已保存到: ${getConfigFilePath()}`);
      console.log('');
    }
  }

  return {
    config: finalConfig,
    fileConfig,
    envConfig,
    cliOptions
  };
}

/**
 * 保存配置（如果 CLI 参数指定了新值）
 */
function saveConfig(cliOptions, currentConfig) {
  const needsSave = cliOptions.nwjcPath ||
                   (cliOptions.port && cliOptions.port !== 3001) ||
                   (cliOptions.host && cliOptions.host !== '0.0.0.0');

  if (needsSave) {
    const configToSave = {
      nwjcPath: cliOptions.nwjcPath || currentConfig.nwjcPath,
      port: cliOptions.port || currentConfig.port,
      host: cliOptions.host || currentConfig.host
    };

    if (writeConfig(configToSave)) {
      console.log(`✅ 配置已保存到: ${getConfigFilePath()}`);
      return true;
    }
  }

  return false;
}

/**
 * 显示配置信息
 */
function showConfigInfo(loadedConfig) {
  const { config, fileConfig, cliOptions } = loadedConfig;
  const configPath = getConfigFilePath();

  console.log('📋 配置信息:');
  console.log(`   配置文件: ${configPath}`);

  if (Object.keys(fileConfig).length > 0) {
    console.log(`   文件配置: ${JSON.stringify(fileConfig)}`);
  } else {
    console.log(`   文件配置: (不存在)`);
  }

  if (cliOptions.nwjcPath) {
    console.log(`   CLI 参数: nwjcPath=${cliOptions.nwjcPath}`);
  }

  if (process.env.NWJC_PATH) {
    console.log(`   环境变量: NWJC_PATH=${process.env.NWJC_PATH}`);
  }

  console.log(`   最终配置:`);
  console.log(`     nwjcPath: ${config.nwjcPath || '(未设置)'}`);
  console.log(`     port: ${config.port}`);
  console.log(`     host: ${config.host}`);
}

module.exports = {
  getConfigFilePath,
  readConfig,
  writeConfig,
  loadConfig,
  saveConfig,
  showConfigInfo
};
