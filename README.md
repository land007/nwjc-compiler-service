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
# 默认端口 3001
nwjc-service

# 指定端口
nwjc-service 4000

# 或使用环境变量
NWJC_SERVICE_PORT=4000 nwjc-service
```

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
  "compileTime": 123
}
```

#### 2. 健康检查

```bash
curl http://localhost:3001/health
```

#### 3. 获取平台信息

```bash
curl http://localhost:3001/platform
```

## 环境要求

- Node.js 16+
- NW.js SDK（nwjc 工具）
- 环境变量 `NWJC_PATH`（可选，指定 nwjc 路径）

## 配置

### 查找 nwjc

服务会按以下顺序查找 nwjc：

1. 当前项目 `node_modules/.bin/nwjc`
2. 当前项目 `sdk/nwjs-sdk-*/nwjc`
3. 全局 npm 安装路径
4. 环境变量 `NWJC_PATH`

### 防火墙

确保端口可被外部访问：
- macOS: 系统偏好设置 → 安全性与隐私 → 防火墙
- Linux: `sudo ufw allow 3001`
- Windows: Windows Defender 防火墙

## 开发

```bash
# 克隆仓库
git clone <repository-url>
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
