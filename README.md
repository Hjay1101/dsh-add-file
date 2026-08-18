# dsh-add-file

DSH（DeepSeek Harness）客户端插件：把「文件上传」整合进输入框左侧的 `+` 菜单，参考 Codex 的设计。

点击 `+` 弹出菜单，包含：

- **命令** — 打开 DSH 原生的 `/` 命令面板
- **文件** — 选择本地文件上传到 dsh-files 的会话隔离存储，并把带引号的路径引用**拼接注入输入框光标处**

## 安装

在 DSH profile 的 `package.json` 中加入依赖并注册 bundle：

```json
{
  "dependencies": {
    "dsh-add-file": "github:Hjay1101/dsh-add-file"
  },
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "dsh-files",
        "dsh-add-file"
      ]
    }
  }
}
```

## 依赖

- **dsh-files** — 必需。其服务端提供 `/api/upload` 上传端点（会话隔离存储、去重、TTL）与 `read_document` 工具；本插件会在界面上隐藏 dsh-files 的回形针按钮（上传入口由 `+` 菜单的「文件」取代）。
- `@deepseek-ai/dsh-client-runtime`（客户端运行时）

## 工作方式

- 客户端 bundle 通过 `window.__ModuleLoader__.load({ id, factory })` 自注册（DSH 客户端模块系统要求）。
- 包元数据：`package.json` 的 `dsh.client`（`platform: "web"` + `inject`）与 `exports["./client"]`；`exports` 必须包含 `"./package.json"`，否则 DSH 的客户端扫描器会因 `ERR_PACKAGE_PATH_NOT_EXPORTED` 将该包静默判为「非客户端包」。
- UI：`conversation.input.left` 插槽注入自定义 `+` 按钮（`order: -1` 排最左）；CSS 隐藏原生 `+`（`button[aria-haspopup="listbox"]`）与回形针；菜单以 portal 挂在 `document.body`（fixed 定位），避免 React 重渲染清掉菜单。
- 「命令」项通过 `inputTriggers.sessionOf(session).toggleSource("command", …)` 打开原生命令面板。

## 开发

```bash
# 修改 client.js 后由 DSH 的客户端 HMR 热更新（500ms 轮询），浏览器内即时生效
```

## License

MIT