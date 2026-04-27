# Note.ms 增强（notems-enhance）

这是一个用于 [note.ms](https://note.ms/) 的用户脚本（UserScript），旨在提升阅读与编辑体验，提供暗色模式、字体调整、行宽限制，以及对 Markdown 页面进行 KaTeX 公式渲染、代码块复制等增强能力。

## 功能特性

- **暗色模式**：一键切换明暗主题，且会记住你的选择。
- **字体大小调整**：工具栏提供 `A− / A+` 调整字号，并持久化保存。
- **行宽限制与居中排版**：更适合长文阅读。
- **Markdown（`.md`）增强**
  - KaTeX 自动渲染：支持 `$...$`（行内）与 `$$...$$`（块级）。
  - 代码块复制按钮：悬浮显示复制按钮。
  - 公式点击复制：点击公式即可复制对应 TeX 源码。
  - 部分转义修复：对 `&#039;`、`&quot;` 等常见转义做修复。
- **全文一键复制**：编辑/预览模式均可复制全文。
- **保存状态指示（编辑模式）**：通过拦截 `fetch`/`XMLHttpRequest` 的 POST 请求显示保存中/已保存/失败状态。

## 安装方式

1. 安装用户脚本管理器：
   - Tampermonkey（推荐）/ Violentmonkey / Greasemonkey
2. 打开脚本文件并安装：
   - [`notems-enhance.user.js`](./notems-enhance.user.js)
3. 访问 `https://note.ms/`，右上角会出现工具栏按钮。

## 使用说明

- 右上角工具栏包含：
  - 暗色切换
  - 字体缩小/放大
  - 编辑/预览切换（通过是否带 `.md` 来区分）
  - 复制全文

## 开发与构建

本项目为单文件用户脚本，无需构建步骤。你可以直接编辑 `notems-enhance.user.js`。

## 兼容性与说明

- KaTeX 相关依赖通过 jsDelivr CDN 引入。
- 复制功能依赖 `navigator.clipboard`，在部分浏览器/环境下可能需要 HTTPS 或用户手势触发。

## 许可证

MIT License
