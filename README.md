# nwjc-compiler-service

分布式 nwjc 编译服务，用于 NW.js 多平台打包。

## 安装

```bash
# 全局安装（推荐）
npm install -g nwjc-compiler-service

# 或使用 npx（无需安装）
npx nwjc-compiler-service
```

## 使用

### 启动服务

```bash
# 默认配置（端口 3001）
npx nwjc-compiler-service

# 指定端口
npx nwjc-compiler-service --port 4000

# 指定 nwjc 路径（Windows 示例）
npx nwjc-compiler-service --nwjc-path "C:\Users\jiayq\Desktop\nwjs-sdk-v0.109.0-win-x64\nwjc.exe"

# 指定 nwjc 路径（macOS/Linux 示例）
npx nwjc-compiler-service --nwjc-path "/path/to/nwjs-sdk/nwjc"

# 组合参数
npx nwjc-compiler-service --port 4000 --nwjc-path "C:\path\to\nwjc.exe"

# 使用环境变量
NWJC_PATH="C:\Users\jiayq\Desktop\nwjs-sdk-v0.109.0-win-x64\nwjc.exe" npx nwjc-compiler-service
```

### CLI 参数

| 参数 | 短参数 | 说明 | 示例 |
|------|--------|------|------|
| `--port` | `-p` | 指定端口号 | `--port 4000` |
| `--host` | `-h` | 指定监听地址 | `--host 127.0.0.1` |
| `--nwjc-path` | `-n` | 指定 nwjc 工具路径 | `--nwjc-path "C:\path\to\nwjc.exe"` |

### API

#### 1. 编译 JavaScript

```bash
curl -X POST http://localhost:3001/compile \
  -H "Content-Type: application/json" \
  -d '{
    "sourceCode": "function test() { return 42; }",
    "filename": "test.js"
  }'
```

响应：
```json
{
  "success": true,
  "platform": {
    "platform": "darwin",
    "arch": "arm64",
    "platformArch": "osx-arm64"
  },
  "binFilename": "test.bin",
  "binData": "base64编码的二进制数据",
  "sourceSize": 1234,
  "binSize": 567,
  "compileTime": 123,
  "requestId": "xxx"
}
```

#### 2. 健康检查

```bash
curl http://localhost:3001/health
```

响应：
```json
{
  "status": "ok",
  "platform": {
    "platformArch": "win-x64"
  },
  "nwjcPath": "C:\\Users\\jiayq\\Desktop\\nwjs-sdk-v0.109.0-win-x64\\nwjc.exe",
  "timestamp": "2026-03-09T12:00:00.000Z"
}
```

#### 3. 获取平台信息

```bash
curl http://localhost:3001/platform
```

## 环境要求

- Node.js 16+
- NW.js SDK（nwjc 工具）

## 配置

### 指定 nwjc 路径

**方式一：CLI 参数（推荐）**
```bash
npx nwjc-compiler-service --nwjc-path "C:\Users\jiayq\Desktop\nwjs-sdk-v0.109.0-win-x64\nwjc.exe"
```

**方式二：环境变量**
```bash
# Windows (CMD)
set NWJC_PATH=C:\Users\jiayq\Desktop\nwjs-sdk-v0.109.0-win-x64\nwjc.exe
npx nwjc-compiler-service

# Windows (PowerShell)
$env:NWJC_PATH="C:\Users\jiayq\Desktop\nwjs-sdk-v0.109.0-win-x64\nwjc.exe"
npx nwjc-compiler-service

# macOS/Linux
export NWJC_PATH=/path/to/nwjc
npx nwjc-compiler-service
```

**方式三：自动查找**
服务会按以下顺序查找 nwjc：

1. 环境变量 `NWJC_PATH`（优先级最高）
2. 当前项目 `node_modules/.bin/nwjc`
3. 当前项目 `node_modules/nw/bin/nwjc`
4. 当前项目 `sdk/nwjs-sdk-*/nwjc`
5. 全局 npm 安装路径

### 防火墙

确保端口可被外部访问：
- macOS: 系统偏好设置 → 安全性与隐私 → 防火墙
- Linux: `sudo ufw allow 3001`
- Windows: Windows Defender 防火墙

## 日志输出

服务提供详细的日志输出，包括：

```
[2026-03-09T12:00:00.000Z] GET /health from ::1
[2026-03-09T12:00:01.000Z] POST /compile from 192.168.1.100
[abc123] 📝 收到编译请求: test.js
[abc123]    源代码长度: 1234 字节
[abc123]    客户端: 192.168.1.100
[abc123] 🔧 开始编译...
[abc123] 📁 临时目录: /tmp/nwjc-compile-xxx
[abc123] 📄 源文件: /tmp/nwjc-compile-xxx/test.js
[abc123] ✅ 源代码已写入 (1234 字节)
[abc123] 🔍 查找 nwjc 工具...
[abc123] 🔍 搜索路径 (5 个):
[abc123]    [1] C:\Users\jiayq\Desktop\nwjs-sdk-v0.109.0-win-x64\nwjc.exe (环境变量)
[abc123]    ✅ 找到!
[abc123] ✅ 找到 nwjc: C:\Users\jiayq\Desktop\nwjs-sdk-v0.109.0-win-x64\nwjc.exe
[abc123] 🔨 执行编译: nwjc "source.js" "source.bin"
[abc123] ✅ nwjc 执行成功 (1234ms)
[abc123] ✅ 编译产物: source.bin (567 bytes)
[abc123] 🧹 临时文件已清理
[abc123] ✅ 编译成功!
[abc123]    输出文件: test.bin
[abc123]    源文件: 1234 bytes
[abc123]    编译后: 567 bytes
[abc123]    耗时: 1234ms
[abc123]    总耗时: 1250ms
```

## 开发

```bash
# 克隆仓库
git clone https://github.com/land007/nwjc-compiler-service.git
cd nwjc-compiler-service

# 安装依赖
npm install

# 开发模式（自动重启）
npm run dev

# 生产模式
npm start

# 全局链接（用于测试）
npm link
nwjc-service
```

## 许可证

MIT
