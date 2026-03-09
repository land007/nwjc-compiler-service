/**
 * 平台检测
 */

function detect() {
  const platform = process.platform;  // 'darwin', 'win32', 'linux'
  const arch = process.arch;          // 'arm64', 'x64', 'ia32'

  // 转换为 NW.js 格式
  let nwPlatform;
  if (platform === 'darwin') {
    nwPlatform = 'osx';
  } else if (platform === 'win32') {
    nwPlatform = 'win';
  } else {
    nwPlatform = platform;
  }

  let nwArch;
  if (arch === 'x64' || arch === 'ia32') {
    nwArch = 'x64';
  } else {
    nwArch = arch;
  }

  return {
    platform: platform,      // Node.js 格式: darwin, win32, linux
    arch: arch,              // Node.js 格式: arm64, x64
    nwPlatform: nwPlatform,  // NW.js 格式: osx, win, linux
    nwArch: nwArch,          // NW.js 格式: arm64, x64
    platformArch: `${nwPlatform}-${nwArch}`,  // osx-arm64, win-x64, linux-x64
    nodeVersion: process.version,
    hostname: require('os').hostname()
  };
}

module.exports = { detect };
