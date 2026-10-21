# memory.md — BSW Web 前端 项目记忆 / 速查

> 最后更新：2026-10-21
> 用途：记录环境、版本、接口约定、实测结果和踩过的坑，避免重复排查。**不要写生产密钥。**
> 任务清单见 `task.md`；后端交接原文见 `前端交接.md`。
> 密码类信息只记录开发种子账号，生产凭据一律不入库。

---

## 1. 项目状态

| 项 | 值 |
| --- | --- |
| 名称 | `bsw-web`（暂定，Web 聊天前端） |
| 目录 | `/home/momo/Projects/shcool/BSW` |
| 当前进度 | **W1–W3 已完成，停在 W3 确认门**（骨架 / 认证 / API 客户端 + 单飞刷新） |
| git | `main` 分支，remote `git@github.com:momoi-gh/BSW.git`；W1–W3 改动待提交 |
| 本期范围 | 仅 Web SPA；Flutter 不做；只做响应式，无暗色/多语言 |
| 后端项目 | `/home/momo/Projects/shcool/BS`（`bs-chat` 0.1.0） |
| 下一步 | 你确认 W3 后进入 W4（会话列表 + 私聊对方信息解析） |

---

## 2. 文档索引与事实源

优先级从高到低（冲突时以实测为准，并回写本文件）：

1. 实测后端行为（`curl` / 浏览器 / 数据库查询）
2. `/home/momo/Projects/shcool/BS/docs/api.md`、`ws.md`、`errors.md`、`schema.md`
3. `/home/momo/Projects/shcool/BSW/前端交接.md`
4. 本文件与 `task.md`

| 内容 | 位置 |
| --- | --- |
| 交接总览、开发顺序、验收清单 | `前端交接.md` §0、§9、§12 |
| REST 接口与限制 | `前端交接.md` §3–§4；`BS/docs/api.md` |
| WS 事件与重连 | `前端交接.md` §5；`BS/docs/ws.md` |
| 错误码 | `BS/docs/errors.md` |
| 数据库表结构 | `BS/docs/schema.md` |
| 后端种子账号 | `BS/src/db/seed.ts` |
| 后端运维/部署 | `BS/docs/operations.md`、`BS/README.md` |
| 后端记忆（环境/踩坑） | `/home/momo/Projects/shcool/BS/memory.md` |

---

## 3. 环境基线（2026-10-21 实测）

| 项 | 值 | 备注 |
| --- | --- | --- |
| OS | Linux（Arch，内核 7.2.7-zen1） | 与后端同一台机器 |
| Node | **v24.20.0** | fnm 管理；非交互 shell 注意 PATH |
| npm | **11.19.0** | 默认包管理器 |
| pnpm / yarn | 12.14.0 / 4.18.0（已安装） | 备选 |
| 前端端口 | **5173** | 与后端 `CORS_ORIGIN` 一致 |
| 后端开发 | `http://127.0.0.1:3000` | ❌ 未启动，**本项目不使用** |
| 后端生产 | `http://127.0.0.1:3100` | ✅ 运行中（rootless 容器 `bs-chat-api`） |
| 联调目标 | **`127.0.0.1:3100`（已确认 Q3）** | 只用种子账号写测试数据 |
| PostgreSQL | 容器 `bs-postgres`，healthy | `podman exec bs-postgres psql -U bs -d bs_chat` |
| 后端 CORS | `http://localhost:5173` | 开发/生产都走同源代理，实际不受 CORS 限制 |
| 3100 监听 | `127.0.0.1:3100` only | 不监听 `::1`，浏览器用 `localhost:3100` 可能解析失败 |
| web 容器端口（规划） | `127.0.0.1:3200` → 容器 `8080` | W12 发布；Caddy 上游改为 3200 |

### 3.1 实测记录

| 检查 | 命令 | 结果 |
| --- | --- | --- |
| 存活 | `curl -s http://127.0.0.1:3100/healthz` | `{"status":"ok","uptime":1025}` |
| 就绪 | `curl -s http://127.0.0.1:3100/readyz` | `{"status":"ready","database":"up"}` |
| 登录 | `POST /auth/login` alice | `200`，返回 user + accessToken + refreshToken |
| 端口 | `ss -ltnp \| grep -E ':(5173\|3000\|3100)'` | 仅 `127.0.0.1:3100` |
| 容器 | `podman ps` | `bs-postgres`、`bs-chat-api` 均 Up |

### 3.2 开发期地址方案（已确认）

```
浏览器 → Vite dev server (localhost:5173)
           ├── /api/*     → http://127.0.0.1:3100/*      （rewrite 去掉 /api）
           └── /socket.io → http://127.0.0.1:3100        （ws: true，不 rewrite）
```

好处：同源，无 CORS 问题，避开 `localhost` 与 `127.0.0.1` / IPv6 的解析差异。

环境变量：

```dotenv
VITE_API_BASE_URL=/api
VITE_PROXY_TARGET=http://127.0.0.1:3100
VITE_SOCKET_PATH=/socket.io
```

> 目标固定为 3100（已确认）；3000 不使用。换端口只改 `VITE_PROXY_TARGET`。

### 3.3 后端部署事实（W12 需要）

| 项 | 值 |
| --- | --- |
| Quadlet 单元 | `~/.config/containers/systemd/bs-chat-api.container`（源：`BS/deploy/bs-chat-api.container`） |
| 容器名 | `bs-chat-api`（web 容器用它做 DNS：`bs-chat-api:3000`） |
| 网络 | `bs_default`（由 `BS/compose.yaml` 创建；`podman network inspect bs_default`） |
| 发布端口 | `127.0.0.1:3100:3000`（**仅宿主机**） |
| 环境 | `HOST=0.0.0.0`、`PORT=3000`、`NODE_ENV=production`、`CORS_ORIGIN=http://localhost:5173` |
| Caddy | `BS/deploy/Caddyfile` 当前 `reverse_proxy 127.0.0.1:3100`；W12 改成 `127.0.0.1:3200` |
| 数据库 | 容器 `bs-postgres`，`DATABASE_URL` 用 `bs-postgres:5432` |
| 部署脚本 | `BS/deploy/deploy.sh`（本项目 W12 参考其回滚/Quadlet 安装方式） |

---

## 4. 种子数据（开发用，2026-10-21 实测）

> 种子密码：`password123`（来自 `BS/src/db/seed.ts`，**仅开发**）。
> UUID 与 `last_seq` 是当前数据库实例的快照，重建库后需重新查询。

| 用户名 | 邮箱 | 密码 | UUID |
| --- | --- | --- | --- |
| alice | alice@example.com | password123 | `74eba981-d530-4f7a-95c7-27d400e4ac41` |
| bob | bob@example.com | password123 | `fa8d7629-c899-49ca-bf53-13ae0c8c2c4d` |
| carol | carol@example.com | password123 | `c931a0ee-a5c0-42d1-a664-2dddc8d94f48` |

现有会话：

| 会话 ID | 类型 | 标题 | last_seq |
| --- | --- | --- | --- |
| `bb607ede-9ae4-4d94-85b3-c8c37b55372e` | direct | —（alice ↔ bob） | 9 |
| `0ee8fbb7-d411-4fc8-83eb-e738674a6441` | group | `Seed Group` | 1 |

常用查询：

```bash
podman exec bs-postgres psql -U bs -d bs_chat \
  -c "select id, username, display_name from users order by username;"

podman exec bs-postgres psql -U bs -d bs_chat \
  -c "select id, type, title, last_seq from conversations order by created_at;"
```

登录取 token：

```bash
curl -s -X POST http://127.0.0.1:3100/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"alice@example.com","password":"password123"}'
```

> ⚠️ 3100 是生产/Quadlet 实例，测试消息会落库。已确认直接使用；只用 `alice / bob / carol`，需要洁净环境时另起独立数据库，不动 3100。

---

## 5. 版本矩阵（已安装，2026-10-21）

> 以 `package.json` / `package-lock.json` 为准。

### 运行时依赖

| 包 | 版本 | 备注 |
| --- | --- | --- |
| react / react-dom | 19.3.1 | |
| react-router-dom | 7.18.4 | `createBrowserRouter` |
| @tanstack/react-query | 5.104.5 | QueryClient 已接，queryKey 在 W4/W5 落地 |
| zustand | 5.0.15 | authStore 已用 |
| socket.io-client | **4.8.4** | 必须 4.8.x，W6 接入 |
| zod | 4.6.7 | 与后端一致 |
| react-hook-form | 7.90.0 | |
| @hookform/resolvers | **5.9.2** | 6.x 与 `effect` 可选 peer 冲突，固定 5.9.2 |
| @base-ui/react | 1.9.0 | shadcn `base-nova` 风格底层 |
| class-variance-authority | 0.7.1 | |
| cn | 0.5.0 | shadcn 新版 `cn()` 来源 |
| clsx / tailwind-merge | 2.1.1 / 3.7.0 | 备用 |
| lucide-react | 1.60.0 | 图标（注意 major 已是 1.x） |
| sonner | 2.0.8 | toast |
| tw-animate-css | 1.4.0 | Tailwind 动画 |
| @fontsource-variable/geist | 5.3.0 | shadcn 默认字体 |

### 开发依赖

| 包 | 版本 | 备注 |
| --- | --- | --- |
| vite | 8.3.4 | |
| @vitejs/plugin-react | 6.1.2 | |
| typescript | **6.0.3** | Vite 8 模板默认；`baseUrl` 已废弃，用 `paths` 即可 |
| tailwindcss | 4.3.3 | `@tailwindcss/vite` |
| shadcn | 4.22.1 | CLI；已移入 devDependencies（避免生产 audit 告警） |
| oxlint | 1.89.0 | Vite 8 模板默认 lint，替代 ESLint |
| prettier | 3.9.10 | 配置对齐后端 |
| vitest / @vitest/coverage-v8 | 5.0.5 | |
| jsdom | 30.1.3 | |
| @testing-library/react | 16.3.3 | |
| @testing-library/jest-dom | 7.0.1 | |
| @testing-library/user-event | 14.6.8 | |
| @playwright/test | 1.64.1 | 用系统 `/usr/bin/chromium`，不下载浏览器 |

### shadcn 配置

- `components.json`：`style: base-nova`、`baseColor: neutral`、`css: src/index.css`、`iconLibrary: lucide`
- **aliases 必须用相对路径**（`src/components`、`src/lib/utils`），否则 CLI 会创建字面 `./@/` 目录
- CLI 生成的 `from "src/components/ui/..."` 需要改写为 `from "@/components/ui/..."`（Vite/TS 只认 `@/*`）


---

## 6. 关键约定

### 6.1 认证与令牌

- `Authorization: Bearer <accessToken>` 请求头。
- access token 有效期 **15 分钟**；refresh token **30 天**，**每次刷新轮换，旧 refresh 立即失效**。
- 存储：
  - access：**仅内存**（不落 localStorage）
  - refresh：`localStorage`（MVP；后端暂不支持 httpOnly Cookie）
- 刷新**必须单飞**：

```ts
let refreshing: Promise<string> | null = null;

export function refreshOnce(): Promise<string> {
  refreshing ??= doRefresh().finally(() => {
    refreshing = null;
  });
  return refreshing;
}
```

- 401 处理：刷新 → **只重放一次**原请求；刷新失败 → 清登录态 → 跳 `/login`。
- **不要**对 `/auth/login`、`/auth/register`、`/auth/refresh` 做自动刷新。
- 刷新请求体：`{ "refreshToken": "<token>" }`；登出同样用 body（交接 §2.4）。
- 登录/注册响应：`{ user, accessToken, refreshToken, expiresIn: 900 }`。

### 6.2 API 客户端

- Base URL 用 `VITE_API_BASE_URL`（dev 为 `/api`）。
- 所有非 2xx 转成 `ApiError { status, code, message, requestId }`。
- 错误体固定：`{ "error": { "code", "message", "requestId" } }`；`requestId` 也在响应头 `x-request-id`。
- 5xx 不展示后端 `message`，统一“服务器内部错误”。
- 204 无 body，不要调 `res.json()`。
- 超时 15s；GET 可重试，POST/DELETE 不自动重试（幂等键兜底）。

### 6.3 消息与分页

- 历史接口按 `seq` **倒序**返回；前端按 `seq` **升序**渲染。
- 首屏不传 `before`；翻页传 `nextBefore`；`nextBefore === null` 表示到底。
- 禁止 offset 分页。
- 新消息通过 WS 追加，不重拉整个列表。
- 消息唯一性：按 `id` 去重；临时消息按 `clientMsgId` 合并。
- `clientMsgId`：同一发送者全局唯一，用 `crypto.randomUUID()`；**重试必须复用**；跨会话复用会 `409 CLIENT_MSG_ID_CONFLICT`。

### 6.4 未读与已读

- 未读数来自 `GET /conversations` 的 `unreadCount`：`seq > lastReadSeq && senderId !== me`。
- 上报已读：进入会话 / 聚焦 / 滚到底 / 当前会话收到新消息。
- 服务端 `greatest` 只前进不后退，重复上报安全。
- 本地可先乐观清零，以响应 `{ lastReadSeq }` 为准。
- “谁已读”只能用成员 `lastReadSeq` 推算，没有逐条已读表。

### 6.5 typing / presence

- 输入中每 2–3s 发 `typing.start`（本项目取 2.5s）；停止 2s 发 `typing.stop`。
- 收到 `typing` 后 3s 无新事件自动隐藏；服务端不做超时清理。
- presence 只有事件、**无首屏快照**；首屏显示“未知”，收到 `presence.update` 再更新。
- 多端登录：第一端上线发 `online=true`，最后一端断开才发 `false`。

### 6.6 限流

| 范围 | 限制 | 表现 |
| --- | --- | --- |
| 全局 REST | 300 次/分钟/IP | 429 `TOO_MANY_REQUESTS` |
| `/auth/*` | 10 次/分钟/IP | 429，登录失败不要狂点 |
| REST 发消息 | 60 次/分钟 | 429 |
| WS 发消息 | 30 条/10 秒/连接 | ack `{ ok:false, error:{ code:'TOO_MANY_REQUESTS' } }` |

退避：指数退避 + 抖动；写操作不自动无限重试。

### 6.7 时间与 ID

- 时间统一 UTC ISO 8601，展示时转本地时区。
- `seq` 在 JS 安全整数内，JSON 里是 number；解析时仍建议 `Number(...)` 兜底。
- UUID：`crypto.randomUUID()`（需安全上下文；localhost 满足）。

### 6.8 UI 约定（React 19 + Tailwind 4 + shadcn/ui）

- shadcn/ui 初始化：`npx shadcn@latest init`，生成 `components.json` + `src/lib/utils.ts`（`cn()`）。
- 组件放 `src/components/ui/`，属于项目源码，可按需修改；业务组件不要直接改 shadcn 原语语义。
- 首批组件：`button`、`input`、`textarea`、`dialog`、`dropdown-menu`、`avatar`、`badge`、`tabs`、`skeleton`、`tooltip`、`separator`、`scroll-area`、`sheet`、`sonner`。
- 主题走 CSS 变量（`src/index.css`），MVP 只做浅色；不做暗色切换（Q7）。
- 文案中文；时间相对显示；未读 >99 显示 `99+`。
- 不在 UI 展示 `email`。
- 头像用首字母 + 稳定色占位（后端无上传）。
- 错误 toast 必须可复制 `requestId`；统一用 `sonner`。

### 6.9 认证实现（W2–W3，已验证）

- `tokenStorage`：access 只存内存；refresh 存 `localStorage['bsw.refreshToken']`。
- `authStore.bootstrap()`：无 refresh → `anonymous`；有则 `refreshSession()` → `GET /users/me` → `authenticated`。
  - StrictMode 双执行用模块级 `bootstrapPromise` 单飞。
  - 只有 401 才清 refresh token；网络错误保留，下次再试。
- 路由：
  - `AuthGuard`：`idle/loading` 显示 LoadingScreen；未登录跳 `/login?redirect=...`。
  - `GuestGuard`：已登录访问 `/login` 跳回 `redirect` 或 `/chat`。
- 登录/注册成功后写入 token + `queryClient.clear()`；表单错误显示 `code` + `requestId`。
- `USER_EXISTS` 同时映射到 email/username 字段。
- 登出：先调 `/auth/logout`（失败忽略），再清 token/cache；Guard 自动回登录页。
- `refreshSession()` 单飞：并发 401 只发 1 次 refresh，成功后原请求只重放 1 次。
- 429：默认仅 GET 按 `Retry-After` / 指数退避（1s/2s/4s，最多 3 次）；POST/DELETE 不自动重试。
- `GET /users/me` **返回 `{ user }`**，`authApi.me()` 已解包。
- 认证接口（login/register/refresh/logout）`skipRefresh`，不会递归刷新。

---

## 7. REST 速查

### 7.1 接口表

| 方法 | 路径 | 鉴权 | 成功 | 说明 |
| --- | --- | --- | --- | --- |
| POST | `/auth/register` | 否 | 201 | 注册即登录 |
| POST | `/auth/login` | 否 | 200 | 登录 |
| POST | `/auth/refresh` | 否 | 200 | 轮换 access + refresh |
| POST | `/auth/logout` | 否 | 204 | body 带 refreshToken，幂等 |
| GET | `/users/me` | 是 | 200 | 当前用户 |
| GET | `/conversations` | 是 | 200 | 会话列表 + 未读 |
| POST | `/conversations` | 是 | 201/200 | 创建私聊/群聊，已存在返回 200 |
| GET | `/conversations/:id/members` | 是 | 200 | 成员列表 |
| POST | `/conversations/:id/members` | 是 | 201 | 加人（群主/管理员） |
| DELETE | `/conversations/:id/members/:userId` | 是 | 204 | 移除/退群 |
| GET | `/conversations/:id/messages?before=&limit=` | 是 | 200 | 历史分页（seq 倒序） |
| POST | `/conversations/:id/messages` | 是 | 201 | REST 发送（备用） |
| POST | `/conversations/:id/read` | 是 | 200 | 上报已读 |
| DELETE | `/messages/:id` | 是 | 204 | 软删除自己的消息 |
| GET | `/healthz` `/readyz` `/metrics` | 否 | 200/503 | 运维用 |

### 7.2 请求 / 响应要点

注册：

```json
{ "email": "user@example.com", "username": "user_name", "password": "password123", "displayName": "昵称（可选）" }
```

创建会话：

```json
{ "type": "direct", "memberIds": ["<对方 user id>"] }
{ "type": "group", "title": "项目群", "memberIds": ["uuid"] }
→ { "conversationId": "uuid", "created": true }
```

- direct 的 `memberIds` 必须正好 1 个，且不能是自己。
- group 必须有 `title`；自己由后端加入，`memberIds` 只传他人。
- 同一对用户私聊幂等：`created: false`。

消息分页响应：

```json
{
  "messages": [{ "id": "...", "seq": 12, "clientMsgId": "...", "type": "text", "body": "你好", "senderId": "...", "replyToId": null, "editedAt": null, "deletedAt": null, "createdAt": "..." }],
  "nextBefore": 10
}
```

- 倒序返回；`nextBefore === null` 表示没有更早。
- 软删除消息不返回。

REST 发送 / 已读：

```json
POST /conversations/:id/messages
{ "body": "你好", "clientMsgId": "uuid", "replyToId": "uuid（可选）" }
→ 201 { "message": { ... } }

POST /conversations/:id/read
{ "seq": 13 }
→ { "lastReadSeq": 13 }
```

成员响应：

```json
{
  "members": [
    { "userId": "uuid", "role": "owner", "joinedAt": "...", "lastReadSeq": 8,
      "username": "alice", "displayName": "Alice", "email": "alice@example.com" }
  ]
}
```

- `role`: `owner` / `admin` / `member`
- `email` 不展示
- `lastReadSeq` 用于“谁已读”

会话列表项：

```json
{
  "id": "uuid", "type": "direct", "title": null, "createdBy": "uuid",
  "lastSeq": 12, "lastReadSeq": 10, "unreadCount": 2,
  "createdAt": "...", "updatedAt": "...",
  "lastMessage": { "id": "uuid", "body": "你好", "seq": 12, "senderId": "uuid", "createdAt": "..." }
}
```

- 私聊 `title` 为 `null`，且**没有对方信息**（G2）。
- 只返回未退出的会话。

### 7.3 校验与限制

| 项 | 限制 |
| --- | --- |
| 用户名 | 3–32 位字母/数字/下划线 |
| 密码 | 8–128 |
| 消息正文 | 1–4000 字符 |
| `clientMsgId` | 1–100 字符 |
| 群标题 | 1–100 字符 |
| 分页 `limit` | 1–100，默认 30 |
| 单次加人 | ≤ 100 |

### 7.4 错误码（`BS/docs/errors.md`）

| HTTP | code | 场景 |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | zod 校验失败 |
| 400 | `INVALID_MEMBERS` | 成员为空/无效/私聊人数不为 1 |
| 400 | `TITLE_REQUIRED` | 群聊缺标题 |
| 400 | `INVALID_OPERATION` | 私聊加人/退群 |
| 400 | `INVALID_REPLY` | replyToId 不属于该会话 |
| 401 | `UNAUTHORIZED` | 缺少/无效/过期 access |
| 401 | `INVALID_CREDENTIALS` | 邮箱或密码错误 |
| 401 | `INVALID_REFRESH_TOKEN` | refresh 无效/过期/已用 |
| 403 | `NOT_A_MEMBER` | 非会话成员 |
| 403 | `FORBIDDEN` | 权限不足（非群主/管理员、删他人消息） |
| 404 | `NOT_FOUND` / `USER_NOT_FOUND` / `MEMBER_NOT_FOUND` / `MESSAGE_NOT_FOUND` | 资源不存在 |
| 409 | `USER_EXISTS` | 邮箱或用户名已注册 |
| 409 | `CLIENT_MSG_ID_CONFLICT` | clientMsgId 被其他会话使用 |
| 429 | `TOO_MANY_REQUESTS` | 限流 |
| 500 | `INTERNAL_ERROR` | 未处理异常 |

---

## 8. WebSocket 速查（Socket.IO 4.8）

- 路径：`/socket.io`；客户端 `socket.io-client` **4.8.x**。
- 握手：`auth: { token: accessToken }`；失败 `connect_error`，`message === 'UNAUTHORIZED'`。
- **连接后必须等 `ready` 才能发消息**（服务端要先 join 房间）。
- `ready` 载荷：`{ conversationIds }`。

### 8.1 事件表

C→S：

| 事件 | 载荷 | ack |
| --- | --- | --- |
| `message.send` | `{ conversationId, body, clientMsgId, replyToId? }` | `{ ok:true, message }` / `{ ok:false, error }` |
| `message.read` | `{ conversationId, seq }` | `{ ok:true, lastReadSeq }` |
| `typing.start` | `{ conversationId }` | 无 |
| `typing.stop` | `{ conversationId }` | 无 |
| `sync.request` | `{ conversationId, afterSeq, limit? }` | `{ ok:true, messages }` |

S→C：

| 事件 | 载荷 | 说明 |
| --- | --- | --- |
| `ready` | `{ conversationIds }` | 可以开始收发 |
| `message.created` | `{ message }` | 新消息，**发送者也会收到** |
| `message.read` | `{ conversationId, userId, seq }` | 某成员已读 |
| `typing` | `{ conversationId, userId, typing }` | 输入状态 |
| `presence.update` | `{ conversationId, userId, online }` | 上下线 |
| `message.deleted` | `{ conversationId, messageId }` | REST 删除后广播 |
| `error` | `{ code, message }` | 事件处理失败 |

### 8.2 发送与去重流程

```ts
const clientMsgId = crypto.randomUUID();
// 1) 本地插入临时消息 { id: tempId, clientMsgId, status: 'sending' }
socket.emit('message.send', { conversationId, body, clientMsgId }, (ack) => {
  if (ack.ok) upsertMessage(ack.message); // 按 id 去重
  else markFailed(clientMsgId, ack.error);
});
// 2) message.created 到达：同一 message.id → upsert；同 clientMsgId 临时项 → 替换
```

- ack 与 `message.created` 是**两份相同数据**，必须按 `message.id` 去重。
- 失败重试复用同一个 `clientMsgId`。
- 删除消息只能走 REST，随后服务端广播 `message.deleted`。

### 8.3 重连与补拉

1. 重连前确认 access token 有效（必要时单飞 refresh）。
2. `socket.auth = { token: newAccessToken }` 再 `socket.connect()`。
3. 收到 `ready` 后，对每个有本地消息的会话发 `sync.request { afterSeq: lastSeq, limit: 100 }`。
4. 返回 `seq > afterSeq` 的消息，**升序**，最多 100 条；满 100 条用最后一条 seq 继续。
5. 合并后按 `id` 去重、按 `seq` 排序。

### 8.4 WS 限流

- 每连接 **30 条 / 10 秒**；超限 ack `{ ok:false, error:{ code:'TOO_MANY_REQUESTS' } }`。
- 需要客户端暂停发送并提示，不要无限重试。

---

## 9. 类型定义（以交接 §6.1 为准）

```ts
// src/types/user.ts
export type User = {
  id: string;
  email: string;            // 不在 UI 展示
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
};

// src/types/message.ts
export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  seq: number;
  clientMsgId: string;
  type: 'text' | 'system';
  body: string;
  replyToId: string | null;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
};

export type UIMessage = Message & {
  status: 'sending' | 'queued' | 'sent' | 'failed';
  tempId?: string;
  error?: { code: string; message: string };
};

// src/types/conversation.ts
export type Conversation = {
  id: string;
  type: 'direct' | 'group';
  title: string | null;
  createdBy: string;
  lastSeq: number;
  lastReadSeq: number;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  lastMessage: {
    id: string;
    body: string;
    seq: number;
    senderId: string;
    createdAt: string;
  } | null;
};

export type Member = {
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  lastReadSeq: number;
  username: string;
  displayName: string | null;
  email: string;            // 不展示
};

// 前端派生类型（不来自后端）
export type Peer = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  online: boolean | null;   // null = 未知（无快照）
};
```

> 实测：`seq` 在 JSON 中是 **number**（不是字符串），无需转换。

---

## 10. 目录与命令

### 10.1 目录（实际，W1–W3）

```text
BSW/
├── src/
│   ├── api/
│   │   ├── client.ts        // baseURL、Bearer、单飞刷新、401 重放、429 退避、ApiError
│   │   ├── client.test.ts   // 8 个用例
│   │   └── auth.ts          // login / register / me / logout / refresh
│   ├── stores/
│   │   └── authStore.ts     // user/status/error + bootstrap/login/register/logout
│   ├── components/
│   │   ├── auth/            // AuthGuard / GuestGuard / AuthError
│   │   ├── common/          // EmptyState / LoadingScreen / PhaseBadge
│   │   ├── layout/          // AppShell / AuthLayout
│   │   └── ui/              // shadcn：button/input/label/dialog/sonner/tooltip...
│   ├── pages/               // Login / Register / Chat / Settings / NotFound
│   ├── lib/
│   │   ├── tokenStorage.ts  // access 内存 + refresh localStorage
│   │   ├── queryClient.ts   // retry 规则
│   │   ├── validation.ts    // zod schema
│   │   └── redirect.ts      // 防开放重定向
│   ├── types/auth.ts
│   ├── test/setup.ts
│   ├── routes.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css            // Tailwind + shadcn base-nova 变量
├── tests/e2e/auth.spec.ts   // Playwright：登录/刷新恢复/登出/错误密码
├── playwright.config.ts
├── vitest.config.ts
├── components.json
├── .env.example
├── .env.development.local   // git 忽略
├── vite.config.ts
├── tsconfig*.json
├── package.json
├── task.md / memory.md / 前端交接.md
└── deploy/                  // W12 创建
```

后续阶段新增：`api/conversations.ts`、`api/messages.ts`、`realtime/`、`stores/conversationStore.ts`、`stores/messageStore.ts`。

约定：

- 组件文件 PascalCase；hooks `useXxx.ts`；store `xxxStore.ts`；类型文件小写。
- 所有请求经 `api/client.ts`，禁止组件里直接 `fetch`。
- 所有 socket 监听集中在 `realtime/events.ts`，组件只订阅 store。
- 临时方案（用户搜索、peer 解析）只能出现在 `lib/` 适配层。

### 10.2 命令（全部已验证）

| 用途 | 命令 | 状态 |
| --- | --- | --- |
| 安装 | `npm install` | ✅ |
| 开发 | `npm run dev` → `http://localhost:5173` | ✅ 代理 `/api` + `/socket.io` 到 3100 |
| 类型检查 | `npm run typecheck` | ✅ |
| Lint | `npm run lint`（oxlint） | ✅ 0 warning / 0 error |
| 格式化 | `npm run format` / `npm run format:check` | ✅ |
| 单测 | `npm test`（Vitest） | ✅ 4 文件 / 15 用例 |
| E2E | `npm run test:e2e`（Playwright + 系统 Chromium） | ✅ 2 用例 |
| 构建 | `npm run build` | ✅（562 kB，W11 做 code split） |
| 预览 | `npm run preview -- --port 4173` | ✅ SPA fallback / 404 / 守卫正常 |


后端常用：

```bash
curl -s http://127.0.0.1:3100/readyz
curl -s http://127.0.0.1:3100/conversations -H "authorization: Bearer <token>"
podman logs --tail=50 bs-chat-api
```

---

## 11. 踩坑与注意事项

### 11.1 已验证 / 文档明确的坑

| 问题 | 结论 |
| --- | --- |
| 并发 401 各自 refresh | refresh 轮换会吊销旧 token，**必须单飞**，否则用户被踢下线 |
| Socket `connect` 后立刻发送 | 服务端可能还没 join 房间，ack 丢失；**必须等 `ready`** |
| ack 与 `message.created` 都到达 | 同一消息两份数据，**按 `message.id` 去重** |
| 重试换新 `clientMsgId` | 会重复插入；**重试必须复用** |
| 跨会话复用 `clientMsgId` | 返回 `409 CLIENT_MSG_ID_CONFLICT` |
| 用 offset 分页消息 | 删除/插入会导致重复或遗漏；**只用 `seq` 游标** |
| 服务端分页是倒序 | 直接渲染会反；前端要按 `seq` 升序排 |
| 进入会话不上报已读 | 未读数不会归零；前端负责上报，服务端不会自动推 |
| 以为服务端会清理 typing | 不会；前端 3s 超时自行隐藏 |
| 以为 WS 有删除事件 | 没有；删除必须 REST，然后收 `message.deleted` |
| 以为有在线状态快照 | 没有；首屏只能显示未知 |
| 以为 REST 可以 `after` 补拉 | 没有；只能 WS `sync.request` |
| 展示成员 `email` | 隐私字段，禁止展示 |
| 私聊尝试加人/退群 | 后端 400 `INVALID_OPERATION`；UI 不提供入口 |
| 移除群主 | 后端拒绝；UI 不显示移除 owner 的按钮 |
| 5xx 直接展示 message | 后端只返回“服务器内部错误”，但 UI 仍应统一兜底 |
| 用 `localhost` 连 3100 | 3100 只监听 IPv4 `127.0.0.1`，IPv6 解析可能失败；用代理或 `127.0.0.1` |
| 改前端端口 | 后端 `CORS_ORIGIN` 只允许 `http://localhost:5173`，需同步改并重启 |
| `/auth/*` 反复重试 | 10 次/分钟/IP，容易 429；登录失败要提示等待 |
| `204` 调 `res.json()` | 抛异常；按状态码分支处理 |
| `/users/me` 直接当 `User` 用 | 实测返回 `{ user }` 包装，必须解包 |
| `logout` 传 access token 才生效 | 实测不带 access token、只带 body refreshToken 也返回 204 |
| shadcn CLI 写出字面 `@/` 目录 | `components.json` 别名改用 `src/...`；生成文件的 `from "src/..."` 改回 `@/...` |
| TS 6 使用 `baseUrl` | TS 6 报 TS5101 废弃；只保留 `paths` 即可 |
| `@hookform/resolvers@6` 安装失败 | 与 `effect@4` 可选 peer 冲突；固定 5.9.2 |
| 新增依赖后页面 504 `Outdated Optimize Dep` | 重启 Vite 或删 `node_modules/.vite` |
| Vitest 误跑 Playwright 用例 | `vitest.config.ts` 设 `include: src/**`、`exclude: tests/e2e/**` |
| `shadcn` CLI 放 dependencies | 有高危 dev 工具链依赖；移到 devDependencies 后 `npm audit --omit=dev` 为 0 |
| Playwright 下载浏览器失败 | 用 `executablePath: /usr/bin/chromium` + `--no-sandbox` |
| E2E 反复登录 | `/auth/*` 10 次/分钟/IP；单次运行只登录 2 次，串行执行 |

### 11.2 已实测结论

| # | 待验证 | 结论（2026-10-21） |
| --- | --- | --- |
| V1 | `/auth/logout` 是否需要 access token | **不需要**：只带 `{ refreshToken }` 返回 204 |
| V2 | `seq` 是否为 number | **是 number**（conversation / lastMessage 都是） |
| V4 | 私聊 `/members` 内容 | 返回 2 人，均 `role=member`，含 `lastReadSeq` 与 `email`（email 不展示） |
| V12 | `/users/me` 响应结构 | 返回 `{ user: {...} }`，前端已解包 |

### 11.3 待联调验证（仍未确认）

> 这些在文档中未完全明确或存在版本差异，W2–W8 期间用 `curl` / 浏览器实测后回填结论。

| # | 待验证 | 影响 | 验证阶段 |
| --- | --- | --- | --- |
| V3 | 创建会话的 200/201 状态码与 `created` 字段是否稳定 | 提示文案 | W4 |
| V5 | 重复加已存在的群成员，后端是忽略还是报错 | 加人提示 | W9 |
| V6 | `POST /members` 返回的成员列表是否包含新增者 | 刷新方式 | W9 |
| V7 | `message.created` 是否也发给发送者的其他标签页 | 多端已读 | W6、W7 |
| V8 | `message.read` 是否回推给上报者自己（多端同步） | 未读清零 | W7 |
| V9 | `presence.update` 是否对私聊也广播 | 在线圆点 | W7 |
| V10 | `sync.request` 的 `limit` 上限与默认值（文档：最多 100） | 补拉循环 | W8 |
| V11 | 3100 实例的构建版本是否与 `BS/src` 当前代码一致（容器 18 分钟前启动） | 联调基线 | W0 |

---

## 12. 待后端确认 / 希望补的能力

按对前端的影响排序（对应 `task.md` §6）：

1. **`GET /users/search?q=&limit=`** — 没有它无法按名字找人；期望返回 `{ users: [{ id, username, displayName, avatarUrl }] }`。
2. **会话列表返回 `peer` 或 `members` 摘要** — 避免私聊列表 N+1。
3. **`presence.snapshot` 或 `ready` 带在线列表** — 首屏在线状态。
4. **`GET /conversations/:id/messages?after=<seq>`** — 纯 HTTP 补拉，作为 WS 降级。
5. **refreshToken 改 httpOnly Cookie** — Web 安全性。
6. **OpenAPI / TS SDK** — 减少手写类型与接口。

不阻塞 Web MVP 的：资料修改、头像上传、消息编辑、reaction、附件、全文搜索、推送。

---

## 13. 容器化与部署方案（W12）

### 13.1 拓扑

```text
浏览器 ──HTTPS──> 宿主 Caddy :443
                    │ reverse_proxy 127.0.0.1:3200
                    ▼
              bs-web 容器（nginx-unprivileged :8080）
                  ├── /            → SPA 静态文件（try_files → index.html）
                  ├── /api/*       → http://bs-chat-api:3000/*
                  └── /socket.io/* → http://bs-chat-api:3000（Upgrade）
                    │
                    ▼  (podman 网络 bs_default)
              bs-chat-api 容器 :3000 → bs-postgres:5432
```

- 前端镜像**不含后端地址**，浏览器只访问同源 `/api`、`/socket.io`。
- web 容器与 API 同在 `bs_default`，用容器名 `bs-chat-api` 解析。
- 3100 仍只绑 `127.0.0.1`，供宿主机调试；公网入口是 Caddy → 3200。

### 13.2 交付文件（计划）

| 文件 | 作用 |
| --- | --- |
| `Containerfile` | 多阶段：`node:24-alpine` 构建 → `nginxinc/nginx-unprivileged` 运行 |
| `deploy/nginx.conf.template` | SPA fallback、`/api` 反代、WS upgrade、缓存与 gzip、`/healthz` |
| `deploy/compose.prod.yaml` | web 服务，`bs_default` external 网络，`127.0.0.1:3200:8080` |
| `deploy/bs-web.container` | Quadlet：开机自启、`Restart=always`、健康检查 |
| `deploy/deploy.sh` | 构建/拉取 → 备份旧镜像 → 安装 unit → 重启 → 健康轮询 → 失败回滚 |
| `deploy/Caddyfile` | 域名 → `127.0.0.1:3200`（替换原来的 3100 上游） |
| `Makefile` | `image` / `up` / `logs` / `deploy` / `rollback` |
| `.github/workflows/publish.yml` | tag → GHCR 镜像（需 git 远程仓库） |

### 13.3 nginx 关键点

```nginx
# /api/ → 后端根路径（尾斜杠必须保留）
location /api/ {
    proxy_pass http://${API_UPSTREAM}/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

# Socket.IO 需要 Upgrade
location /socket.io/ {
    proxy_pass http://${API_UPSTREAM};
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 3600s;
}

location /healthz { access_log off; return 200 "ok\n"; }
location / { try_files $uri $uri/ /index.html; }
```

- `API_UPSTREAM` 默认 `bs-chat-api:3000`，通过环境变量注入。
- nginx-unprivileged 监听 **8080**，容器以非 root 运行。
- `/assets/*` 长缓存；`index.html` `no-store`，避免发布后仍旧页面。
- 官方 nginx 镜像会自动对 `/etc/nginx/templates/*.template` 做 envsubst，`$uri` 等 nginx 变量不会被替换。

### 13.4 一键部署流程

```bash
# 首次
podman network exists bs_default || podman network create bs_default   # 后端 compose 已创建则跳过
make image                         # podman build -t localhost/bs-web:latest .
make deploy                        # 安装 Quadlet、重启、健康检查、失败回滚

# 发布新版本（GHCR，需远程仓库）
make deploy TAG=v0.1.0
```

- 已确认远程仓库：`git@github.com:momoi-gh/BSW.git`
- 计划镜像名：`ghcr.io/momoi-gh/bsw/web:vX`（GitHub 包名小写）

- 部署脚本会校验 `bs-chat-api` 在运行、`bs_default` 存在。
- 健康检查：`http://127.0.0.1:3200/healthz` + `http://127.0.0.1:3200/api/readyz`。
- 失败：回滚 `localhost/bs-web:previous` 并打印 `podman logs bs-web`。
- 服务器只需要 Podman；不需要 Node/npm。

### 13.5 镜像与网络注意

- Docker Hub 直连可能失败：基础镜像用 `docker.1ms.run/library/node:24-alpine`、`docker.1ms.run/nginxinc/nginx-unprivileged:1.27-alpine`，或复制到 GHCR。
- rootless 不能绑 80/443：TLS 交给宿主 Caddy；无 Caddy 时 `-p 8080:8080` 直接 HTTP 验证。
- 容器名变化时同步 `API_UPSTREAM`。
- 容器需要可写 `/tmp`（nginx 临时文件），必要时挂 tmpfs。

### 13.6 验证命令

```bash
podman ps | grep bs-web
curl -s http://127.0.0.1:3200/healthz
curl -s http://127.0.0.1:3200/api/healthz
podman exec bs-web getent hosts bs-chat-api
podman logs --tail=50 bs-web
systemctl --user status bs-web
```

---

## 14. 决策记录

| # | 决策 | 状态 | 理由 |
| --- | --- | --- | --- |
| D1 | 框架用 React 19 | **✅ 已确认（Q1）** | 与交接推荐一致，TS 生态与后端一致 |
| D2 | 包管理用 npm | **✅ 已确认** | 已安装、与后端一致 |
| D3 | dev 用 Vite 代理 `/api` + `/socket.io` → 3100 | **✅ 已确认（Q3）** | 同源避免 CORS 与 IPv4/IPv6 差异 |
| D4 | access 仅内存、refresh 存 localStorage | 拟定 | 后端无 Cookie 模式；接受 MVP XSS 风险 |
| D5 | WS 为发送主路径，REST 保留降级 | 拟定 | 低延迟；REST 用于降级/测试 |
| D6 | 后端缺口收敛到 `lib/` 适配层 | 拟定 | 后端补齐后只替换实现 |
| D7 | 本期不做 Flutter | **✅ 已确认** | 先完成 Web |
| D8 | MVP 不做暗色/多语言，只做响应式 | **✅ 已确认（Q7）** | 控制工期 |
| D9 | 开发端口固定 5173 | **✅ 已确认** | 匹配后端 CORS 默认值 |
| D10 | UI 用 Tailwind CSS 4 + shadcn/ui（按需拷贝） | **✅ 已确认（Q2）** | 交接首选；组件可控、无重型运行时 |
| D11 | 最终交付 Podman 容器 + 一键部署 | **✅ 已确认（Q8）** | 服务器只需 Podman，不需要 Node |
| D12 | web 容器与 `bs-chat-api` 同用 `bs_default` 网络 | 拟定 | 可用容器名访问 API，无需 host 网络 |
| D13 | web 容器基座用 nginx-unprivileged（:8080） | 拟定 | rootless、非 root、官方入口脚本支持模板 |
| D14 | 宿主 Caddy 从 3100 改指向 3200 | 拟定 | 单域名同源；TLS 仍在宿主机 |
| D15 | 部署失败保留 `:previous` 镜像并自动回滚 | 拟定 | 与后端 deploy.sh 的行为一致 |
| D16 | TypeScript 6.0.3 + oxlint（Vite 8 模板默认） | **已采用** | 模板原生组合；typecheck 兜底类型 |
| D17 | shadcn `base-nova` + 相对 aliases | **已采用** | 规避 CLI 写出字面 `@/` 目录 |
| D18 | access 仅内存、refresh `localStorage` | **已实现** | 后端无 Cookie 模式 |
| D19 | `/users/me` 在 API 层解包 `{ user }` | **已实现** | 实测后端结构与交接类型不一致 |
| D20 | bootstrap 单飞 + Guard 驱动跳转 | **已实现** | StrictMode 双执行、刷新恢复不闪屏 |
| D21 | Playwright 用系统 Chromium（不下载浏览器） | **已采用** | 环境已有 `/usr/bin/chromium` |

---

## 15. 变更记录

| 日期 | 内容 |
| --- | --- |
| 2026-10-21 | 初版：记录环境实测（3100 可用、3000 未启动）、种子 UUID、版本矩阵、REST/WS 速查、约定、待验证项与决策 |
| 2026-10-21 | 确认 Q1/Q2：React 19 + Tailwind 4 + shadcn/ui；补充 shadcn 初始化、组件清单与 UI 约定 |
| 2026-10-21 | 确认 Q3/Q6/Q7/Q8：联调 3100；W3/W6/W8 确认门；只做响应式；新增 §13 容器化部署方案（nginx + Quadlet + Caddy + 一键部署/回滚） |
| 2026-10-21 | W1–W3 完成：Vite 8/React 19/Tailwind 4/shadcn 骨架；认证与守卫；API 客户端（单飞刷新、401 重放、429 退避）；15 单测 + 2 Playwright 用例通过；停在 W3 确认门 |
