# cursor极简 支持页

Cloudflare Pages + D1。线上入口：https://siyuan.ysoft.site  
备用：https://cursorart-donate.pages.dev

本目录从 cursorart 主题仓库拆出，独立维护与发布。主题只负责顶栏爱心跳转到本站。

## 账号

- Cloudflare：`fyuanace@qq.com`
- Pages：`cursorart-donate`
- D1：`cursorart-likes`（`affb3152-f77d-4f97-9b82-7cf4cde47f30`）

## 本地

```bash
npm install
npx wrangler pages dev
```

## 发布

```bash
npx wrangler pages deploy
```

`GET /` 只读人数；`GET /?from=theme` 计一次后把地址改回 `/`。
