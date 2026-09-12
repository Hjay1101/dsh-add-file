# dsh-add-file

DSH（DeepSeek Harness）客户端插件：把「文件上传」整合进输入框左侧的 `+` 菜单，参考 Codex 的设计。

点击 `+` 弹出菜单，包含：

- **命令** — 打开 DSH 原生的 `/` 命令面板
- **文件** — 选择本地文件，通过 DSH **原生附件管线**上传（会话隔离存储、后台上传、随消息发送），文件以附件卡片拼接到输入区

> 需要 **DSH ≥ 0.1.3**。旧版本（0.1.0）依赖的 `/api/upload` 端点已被官方移除，1.1.0 起改用 `conversation.createDrafts()` + `inputActions.addAttachments()`。

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

- **dsh-files**（可选，推荐）— 提供 `read_document` 工具（PDF/DOCX/XLSX 读取）；本插件会隐藏它的回形针按钮，上传入口统一由 `+` 菜单的「文件」承担。
- `@deepseek-ai/dsh-client-runtime`（客户端运行时）

## 工作方式

- 客户端 bundle 通过 `window.__ModuleLoader__.load({ id, factory })` 自注册（DSH 客户端模块系统要求）。
- 包元数据：`package.json` 的 `dsh.client`（`platform: "web"` + `inject`）与 `exports["./client"]`；`exports` 必须包含 `"./package.json"`，否则 DSH 的客户端扫描器会因 `ERR_PACKAGE_PATH_NOT_EXPORTED` 将该包静默判为「非客户端包」。
- UI：`conversation.input.left` 插槽注入自定义 `+` 按钮（`order: -1` 排最左）；CSS 隐藏原生的 `+`（`button[aria-haspopup="listbox"]`）、原生「添加附件」按钮与 dsh-files 回形针；菜单以 portal 挂在 `document.body`（fixed 定位），避免 React 重渲染清掉菜单。
- 「命令」项通过 `inputTriggers.sessionOf(session).toggleSource("command", …)` 打开原生命令面板（hit 需带 `quoted: false`，0.1.3+ 字段）。
- 「文件」项通过 `ctx.sessions.scope(sessionId).get("conversation").createDrafts(sessionId, files)` 创建草稿附件，再用会话标准套件注入的 `inputActions.addAttachments(ids)` 送入输入区。

## 开发提示

- **用 `file:` 依赖时务必保持符号链接**：`npm install` 可能把本地依赖**拷贝**成快照（而不是软链），此后源文件改动不会生效，且客户端 HMR 监视的是那份拷贝、永远不会触发。检查：
  ```bash
  ls -la ~/.dsh/profiles/web/node_modules/dsh-add-file   # 应为 -> 源码目录
  ```
  已变成目录就删掉重建软链：`rm -rf <dir> && ln -s <源码目录> <dir>`，然后重启 DSH。
- DSH 在启动时把客户端 bundle 读进内存；改完 bundle 需要**重启 DSH**（HMR 只在符号链接有效时才轮询到变化）。

## License

MIT