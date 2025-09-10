# Cloudflare Pages 管理后台（TVBox/MoonTV 链接管理）

本项目包含：
- 前端：`public/index.html`（登录）、`public/admin.html`（管理）
- 后端（Pages Functions）：`functions/api/*`（登录、登出、链接 CRUD，KV 存储、Cookie 会话）

## 一、准备
1. 创建 KV Namespace（Workers & Pages → KV → Create）。
2. 记录该 Namespace 的 ID。

## 二、项目结构
- `public/`：静态资源（`/` 登录，`/admin.html` 管理）
- `functions/`：Functions 自动路由
  - `api/login`：POST 登录 → 设置 `session` Cookie
  - `api/logout`：POST 退出 → 清除 `session`
  - `api/links`：GET/POST/PUT/DELETE/HEAD（需登录）→ 读写 KV 键 `moontv:data`

## 三、环境变量与 KV 绑定
在 Pages 项目设置中：
- 环境变量（Environment Variables）
  - `ADMIN_USER`：管理员用户名
  - `ADMIN_PASS`：管理员密码
  - `SESSION_SECRET`：随机且足够长的密钥
- KV Bindings（KV 绑定）
  - 绑定名：`KV`
  - 选择上面创建的 KV Namespace

`wrangler.toml` 示例：
```
name = "cf-admin"
compatibility_date = "2024-03-20"

[vars]
ADMIN_USER = "admin"
ADMIN_PASS = "change-me"
SESSION_SECRET = "please-change-this-to-a-random-secret"

[[kv_namespaces]]
binding = "KV"
id = "YOUR_KV_NAMESPACE_ID"
```

## 四、部署
- Pages 控制台：
  - Build command：空
  - Build output directory：`public`
  - Functions directory：`functions`
  - 完成环境变量与 KV 绑定后部署。
- 本地调试：
```
npm i -g wrangler
cd cf-admin
wrangler pages dev public --functions ./functions
```

## 五、数据结构
```
{
  "cache_time": 7200,
  "api_site": {
    "key": { "name": "名称", "api": "https://..." }
  }
}
```

## 六、安全建议
- 使用强随机 `SESSION_SECRET` 并定期更换。
- 管理面板可叠加 Cloudflare Access 或 IP 限制。

## 七、常见问题
- 登录后仍回登录页：检查 Cookie、环境变量一致性、客户端时间。
- 保存失败：确认 KV 绑定为 `KV`，`api` 需以 `http/https` 开头。
