# glTF Viewer

glTF Viewer 是一个本地文件 glTF/GLB 查看和学习工具。它可以加载本地 `.glb` 或 `.gltf` 文件集，渲染 3D 预览，并按 glTF 顶层模块展示资产结构、缺失项和常见引用关系。

## 功能

- 拖拽或选择本地 `.glb` 文件。
- 拖拽或选择 `.gltf` 及其配套 `.bin`、贴图等资源文件。
- 使用 Three.js 预览模型。
- 展示 glTF 模块覆盖情况，例如 `scenes`、`nodes`、`meshes`、`materials`、`textures`、`buffers`、`accessors` 等。
- 在预览失败或资源缺失时保留 JSON 数据报告，便于排查资源引用问题。
- 提供模块详情和常见引用链，辅助理解 glTF 数据结构。

## 技术栈

- React 19
- TypeScript
- Vite
- Three.js
- Vitest
- Nginx Docker runtime

## 环境要求

- Node.js 22 或兼容版本
- npm
- Docker 可选，仅容器化运行时需要

## 本地开发

安装依赖：

```bash
npm ci
```

启动开发服务器：

```bash
npm run dev
```

默认情况下，Vite 会在终端输出本地访问地址，通常是 `http://localhost:5173`。

## 测试

运行单元测试：

```bash
npm test
```

监听模式：

```bash
npm run test:watch
```

## 构建

生成生产构建：

```bash
npm run build
```

构建产物输出到 `dist/`。

本地预览生产构建：

```bash
npm run preview
```

## Docker

构建镜像：

```bash
docker build -t gltf-viewer .
```

运行容器：

```bash
docker run --rm -p 8080:8080 gltf-viewer
```

然后访问：

```text
http://localhost:8080
```

Docker 镜像使用多阶段构建：

- `node:22-alpine` 安装依赖并执行 Vite 构建。
- `nginx:1.27-alpine` 托管 `dist/` 静态文件。

## CI 镜像

项目包含 GitHub Actions 构建流程。推送到 `main` 或 `master` 后，工作流会构建 Docker 镜像并推送到：

```text
ghcr.io/237676098/gltf-viewer:sha-<commit-sha>
```

## 项目结构

```text
.
├── src/
│   ├── components/       # React UI 组件
│   ├── domain/           # glTF 解析、覆盖分析、资源诊断和引用关系逻辑
│   ├── App.tsx           # 应用主界面
│   └── main.tsx          # React 入口
├── docs/                 # 设计和开发计划文档
├── Dockerfile            # 生产镜像构建定义
├── nginx.conf            # 容器内 Nginx 静态站点配置
├── package.json          # npm 脚本和依赖
└── vite.config.ts        # Vite 配置
```

## 使用说明

1. 打开应用。
2. 将 `.glb` 文件拖入页面，或选择文件。
3. 如果使用 `.gltf`，同时选择主 `.gltf` 文件和它引用的 `.bin`、图片资源。
4. 查看右侧 3D 预览和左侧模块覆盖分析。
5. 点击模块条目查看详细字段摘要和引用关系。
