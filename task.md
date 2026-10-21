# BSW Web 前端 — 实施任务清单

> 项目目录：`/home/momo/Projects/shcool/BSW`
> 更新时间：2026-10-21
> 当前状态：**W1–W3 已完成，停在 W3 确认门；等你验收后进入 W4**
> 输入文档：`前端交接.md`（对应后端 `bs-chat` 0.1.0）
> 范围：**仅 Web 单页应用（SPA）**；Flutter / 移动端本期不做
> 配套记忆：`memory.md`（环境、约定、接口速查、踩坑）

---

## 0. 怎么用这份清单

1. 阶段内任务是唯一执行依据；**出口条件不满足，不进入下一阶段**。
2. 每个任务完成后勾选，并在 `memory.md` 的「进度 / 踩坑 / 决策」里同步记录。
3. 对后端行为的任何假设，一律以 `前端交接.md` 和 `/home/momo/Projects/shcool/BS/docs/*.md` 为准；文档没写的，先联调验证再写代码。
4. 遇到需要后端补接口的缺口，记到第 6 节，**不在前端硬编码绕过后端权限/规则**。
5. 只使用 `前端交接.md` 列出的后端能力；缺口用第 6 节的临时方案隔离，便于后续替换。
6. **确认门（Gate）**：W3（API / 单飞刷新）、W6（WS 实时）、W8（重连补拉）完成后**暂停**，等你在浏览器验收确认后再继续下一阶段。

---

## 1. 目标与范围

### 1.1 目标（Web MVP）

在浏览器里完整跑通聊天主链路：

- 注册 / 登录 / 登出 / 刷新令牌（含单飞刷新、401 重放）
- 会话列表（私聊 + 群聊、最后一条消息、未读数、对方昵称/头像占位）
- 聊天页（历史分页、乐观发送、失败重试、删除自己的消息）
- WebSocket 实时收发、发送方去重、typing、已读、在线状态
- 断线重连 + `sync.request` 补拉，不丢消息
- 群成员管理（加人 / 移除 / 退群，按角色控制入口）
- 新建私聊 / 群聊（当前用 UUID 临时方案，后端搜索就绪后替换）

### 1.2 本期做

- [ ] 桌面优先、移动端可用（响应式）
- [ ] 生产构建可静态部署（SPA fallback）
- [ ] **Podman 容器镜像 + 一键部署脚本 + Quadlet 常驻（最终交付形态）**
- [ ] 关键逻辑单测 + 至少一条双用户端到端用例
- [ ] 错误提示包含 `requestId`，便于对照后端日志

### 1.3 本期不做（明确排除）

- Flutter / 移动 App / 桌面壳
- 推送通知（APNs / FCM / Web Push）
- 附件、图片、音视频、语音消息
- 消息编辑 / reaction / @提及 / 全文搜索
- 头像上传、资料修改（后端未实现）
- refreshToken httpOnly Cookie（后端未实现，Web 先用 localStorage）
- 管理后台、计费、多语言、主题市场
- 暗色模式（只做浅色 + 响应式）

### 1.4 完成定义（DoD）

- [ ] `npm run typecheck`、`npm run lint`、`npm test`、`npm run build` 全绿
- [ ] 第 8 节验收清单全部通过（双浏览器手动 + Playwright 关键路径）
- [ ] 断开网络 30 秒后恢复，消息不丢、不重、顺序正确
- [ ] 15 分钟以上不操作后继续发消息，只触发 **一次** refresh
- [ ] README 能从零启动（含后端地址、账号、代理说明）

---

## 2. 技术选型（已确认 React 方案）

> 依据 `前端交接.md` §9.1 的推荐 + 2026-10-21 决策：**React 19 + Tailwind CSS 4 + shadcn/ui**。
> 版本号为 2026-10-21 通过 `npm view` 实测的最新版，实际安装时锁定并回填 `memory.md`。

| 层 | 拟采用 | 版本（实测） | 备选 | 状态 |
| --- | --- | --- | --- | --- |
| 构建 | Vite | 8.3.4 | — | 已确认 |
| 语言 | TypeScript | 6.0.3（Vite 8 模板默认） | — | 已确认 |
| 框架 | React | 19.3.1 | — | **✅ 已确认（Q1）** |
| 路由 | react-router | 7.18.4 | — | 已确认 |
| 服务端状态 | TanStack Query | 5.104.5 | 纯自研 store | 已确认 |
| 本地状态 | Zustand | 5.0.15 | Context + reducer | 已确认 |
| 表单/校验 | react-hook-form + zod | 7.90.0 / 4.6.7 | 受控表单 + 手写校验 | 已确认 |
| 样式 | Tailwind CSS 4 | 4.3.3 | — | **✅ 已确认（Q2）** |
| 组件 | shadcn/ui（按需拷贝） | CLI 4.22.1（base-nova） | — | **✅ 已确认（Q2）** |
| 实时 | socket.io-client | 4.8.4（必须 4.8.x） | — | 已确定 |
| 测试 | Vitest + Testing Library | 5.0.5 / 16.3.3 | — | 已确认 |
| E2E | Playwright | 1.64.1（系统 Chromium） | 手动验收 | 已确认 |
| Lint/格式 | oxlint + Prettier | 1.89.0 / 3.9.10 | — | 已确认 |
| 包管理 | npm | 11.19.0 | pnpm 12.14.0 | 已确认 |
| 部署 | Podman + nginx-unprivileged + Quadlet | Podman 6.1.2 / nginx-unprivileged alpine | 静态托管 | **✅ 已确认** |
| 镜像仓库 | GHCR（复用后端模式） | — | 本地镜像 | 待 Q4（需 git 远程） |

约束：

- `socket.io-client` **必须是 4.8.x**，与服务端 Socket.IO 4.8 对齐；不要用 3.x。
- 不引入 Flutter 相关依赖；不引入与后端重复的校验库之外的重量级框架。
- 组件库选择必须支持 Tailwind 4（若选 shadcn/ui）或自带样式（若选 Ant Design），不要混用两套主题体系。

---

## 3. 环境基线（2026-10-21 实测）

| 项目 | 值 | 说明 |
| --- | --- | --- |
| 工作目录 | `/home/momo/Projects/shcool/BSW` | 目前只有 `前端交接.md`，**未初始化 git** |
| Node | v24.20.0 | 满足 Vite 8 要求（≥ 20.19 / 22.12） |
| npm | 11.19.0 | 默认包管理器 |
| 后端（开发） | `http://127.0.0.1:3000` | ❌ 未启动，**本项目不使用** |
| 后端（生产/Quadlet） | `http://127.0.0.1:3100` | ✅ 运行中，`/readyz` 返回 ready，登录可用；**开发联调目标（已确认）** |
| WebSocket | 与前端同源，路径 `/socket.io` | dev 走 Vite 代理；prod 走 web 容器 nginx 代理 |
| CORS | `http://localhost:5173` | 开发走代理后不受 CORS 限制；生产同源也不需要改 CORS |
| 种子账号 | `alice@ / bob@ / carol@example.com` | 密码见 `memory.md`（仅开发） |
| 容器 | `bs-postgres`、`bs-chat-api` 运行中 | `podman ps` 可见；API 在 `bs_default` 网络内 |

### 3.1 开发期联调方式（已确认：3100）

- Vite dev server 端口固定 `5173`。
- 通过 Vite 代理访问后端，**避免 CORS 与 `localhost` / `127.0.0.1` / IPv6 解析差异**：
  - `/api/*` → `http://127.0.0.1:3100/*`（重写去掉 `/api`）
  - `/socket.io` → `http://127.0.0.1:3100`（`ws: true`，不重写）
- 前端环境变量：
  - `VITE_API_BASE_URL=/api`
  - `VITE_PROXY_TARGET=http://127.0.0.1:3100`（仅 dev 使用）
  - `VITE_SOCKET_PATH=/socket.io`
- **联调目标已确认：3100 生产/Quadlet 实例**。3000 不启动、不使用。
- ⚠️ 3100 是真实实例，测试消息会落库：只用 `alice / bob / carol` 测试账号，不删他人数据；如需干净环境，另起独立数据库，不动 3100。
- 后续若后端换端口，只改 `VITE_PROXY_TARGET`，前端代码不动。

### 3.2 生产部署拓扑（已确认：Podman 容器）

```text
浏览器
  │ HTTPS
  ▼
宿主机 Caddy :443
  │ reverse_proxy 127.0.0.1:3200
  ▼
bs-web 容器（nginx-unprivileged :8080，发布 127.0.0.1:3200）
  ├── /            → /usr/share/nginx/html（SPA fallback）
  ├── /api/*       → http://bs-chat-api:3000/*   （同一 podman 网络 bs_default）
  └── /socket.io/* → http://bs-chat-api:3000     （WebSocket upgrade）

bs-chat-api 容器（Quadlet，网络 bs_default，内部 :3000）
  └── bs-postgres:5432
```

- 前端产物**不含后端地址**：浏览器只访问同源 `/api` 与 `/socket.io`。
- 前后端都在 `bs_default` 网络内，web 容器通过容器名 `bs-chat-api` 访问 API。
- 3100 继续保留，仅用于宿主机直连调试；生产 Caddy 入口改为指向 web 容器。
- rootless 不能绑 80/443，TLS 由宿主机 Caddy 负责。

---

## 4. 阶段总览

| 阶段 | 内容 | 交接对应 | 预估 | 出口条件 |
| --- | --- | --- | --- | --- |
| W0 | 决策、基线、git 初始化 | — | 0.5h | 决策已确认；后端 `/readyz` 200 |
| W1 | 工程骨架、路由、样式、代理 | §9.3 W1 | 0.5d | 页面能跑，`/api/healthz` 代理通，`build` 通过 |
| W2 | 认证：登录/注册/登出/恢复会话 | §2、§9.3 W2 | 1d | 能登录并访问 `/users/me`；刷新页面保持登录 |
| W3 | API 客户端、单飞刷新、错误归一 ⛳ | §2.5、§2.7、§9.3 W3 | 1d | 并发 401 只刷新一次；刷新失败回登录页 |
| W4 | 会话列表 + 对方信息解析 + 新建会话 | §4.1、§4.2、§8.2、W4 | 1d | 列表显示标题/最后消息/未读；私聊幂等 |
| W5 | 聊天页：历史分页、乐观发送、删除 | §4.4–§4.6、W5 | 1.5d | 分页不重不漏；失败可重试且不重复 |
| W6 | WebSocket：ready、实时收发、去重 ⛳ | §5、§7.1、W6 | 1.5d | 双浏览器实时；发送方只看到一条 |
| W7 | 已读/未读、typing、在线状态 | §7.2、§7.4、§7.5、W7 | 1d | 未读归零；typing 自动消失 |
| W8 | 重连 + `sync.request` 补拉 ⛳ | §5.5、§8.4、W8 | 1d | 断网 30s 恢复后不丢不重 |
| W9 | 群成员管理 | §4.3、§7.6、W9 | 1d | 权限入口正确；退群/移除生效 |
| W10 | 用户搜索缺口隔离、群创建完善 | §8.1、W4 | 0.5d | 搜索实现可替换；建群成功 |
| W11 | 打磨、单测、E2E、构建、README | §12、W10 | 1.5d | DoD 全部满足 |
| W12 | **容器化 + 一键部署 + Quadlet** | §11、本文 §3.2 | 1d | 容器内页面/WS 正常，一键脚本可回滚 |

> ⛳ = **确认门**：该阶段完成后暂停，等你验收确认再继续。
> 估算合计约 **12 人日**（不含等待后端补接口的时间）；W12 的镜像发布依赖 git 远程仓库（Q4）。

---

## 5. 详细任务

### W0 — 决策与基线（0.5h）

- [x] Q1 技术框架：React 19
- [x] Q2 UI 方案：Tailwind CSS 4 + shadcn/ui
- [x] Q3 联调目标：`3100`（生产/Quadlet 实例），允许写测试消息（仅用种子账号）
- [x] Q6 确认门：W3 / W6 / W8 完成后暂停验收
- [x] Q7 只做响应式；不做暗色模式、多语言
- [x] 最终交付：**Podman 容器镜像 + 一键部署 + Quadlet 常驻**
- [x] Q4 git：远程仓库 `momoi-gh/BSW` 已存在；每阶段一次提交（W1–W3 已提交 `8bdadd4`）
- [ ] Q5 用户搜索：默认先用手动 UUID 临时方案，等后端补 `/users/search`（不阻塞）
- [x] 验证后端：`curl -s http://127.0.0.1:3100/readyz`、登录 alice 成功
- [x] 记录基线到 `memory.md`（Node、npm、后端、端口、CORS、种子账号）

**出口**：决策已确认；后端可用；W1 可开工。

---

### W1 — 工程骨架、路由、样式、代理（0.5d）

- [x] `npm create vite@latest . -- --template react-ts`（若选 Vue 则换模板）
- [x] 安装并锁定依赖，回填 `memory.md` 版本矩阵
- [x] 配置 `@/` → `src/` 别名（`tsconfig` + `vite.config.ts` + Vitest）
- [x] Tailwind CSS 4 接入（`@tailwindcss/vite` 插件 + 全局样式）
- [x] shadcn/ui 初始化：`npx shadcn@latest init`，生成 `components.json` 与 `src/lib/utils.ts`（`cn()`）
- [x] 按需添加首批组件（复制到 `src/components/ui/`，可改）：
  `button`、`input`、`textarea`、`dialog`、`dropdown-menu`、`avatar`、`badge`、`tabs`、`skeleton`、`tooltip`、`separator`、`scroll-area`、`sheet`（移动端抽屉）、`sonner`（toast）
- [x] oxlint + Prettier（Vite 8 模板默认 oxlint；Prettier 配置对齐后端）
- [x] `npm scripts`：`dev` / `build` / `preview` / `typecheck` / `lint` / `format` / `test` / `test:e2e`
- [x] 环境变量：`.env.example`、`.env.development.local`（不提交），见 §3.1
- [x] Vite 代理：`/api` 重写到后端、`/socket.io` 开启 `ws: true`
- [x] 路由骨架：
  - `/login`、`/register`（无外壳）
  - `/chat`（应用外壳）、`/chat/:conversationId`
  - `/settings`
  - `*` → 404
- [x] 页面占位 + 全局布局（侧栏 + 主区域）、加载/空状态基础组件
- [x] `AuthGuard` / `GuestGuard` 占位（W2 接真实状态）

**验收**
- `npm run dev` 打开 `http://localhost:5173` 正常
- `curl http://localhost:5173/api/healthz` 经代理返回后端结果
- `npm run typecheck && npm run lint && npm run build` 通过

---

### W2 — 认证：登录 / 注册 / 登出 / 恢复会话（1d）

- [x] `src/types/auth.ts`：`User`、`AuthResponse`（严格按交接 §2.1 / §6.1）
- [x] `src/api/auth.ts`：`register`、`login`、`refresh`、`logout`、`me`
- [x] `src/lib/tokenStorage.ts`
  - access token：**仅内存**
  - refresh token：`localStorage`（key 加前缀，如 `bsw.refreshToken`）
  - 提供 `get/set/clear`，禁止在日志里打印 token
- [x] `authStore`：`{ user, accessToken, status: 'idle'|'loading'|'authenticated'|'anonymous' }`
  - 启动时：有 refresh token → 单飞 refresh → `GET /users/me` → 进入 `authenticated`
  - 无 refresh token → `anonymous`
- [x] 登录页：email + password、zod 校验、提交 loading、错误提示（`INVALID_CREDENTIALS` / 429 / 网络错误）
- [x] 注册页：email、username（3–32 位字母/数字/下划线）、password（8–128）、displayName 可选；`USER_EXISTS` 定位到字段
- [x] 登录/注册成功后跳转：有 `redirect` 参数回原地址，否则 `/chat`
- [x] 登出：`POST /auth/logout`（失败也继续本地清理）→ 清 token、清缓存、跳 `/login`
- [ ] 登出/换账号时断开 socket（W6 随 socket 生命周期接入）
- [x] 路由守卫接真实状态；`status === 'idle'` 时显示启动加载页
- [x] 认证接口 **不做** 401 自动刷新（交接 §2.7.4）

**验收**
- 用种子账号登录成功，`/users/me` 返回一致
- 错误密码显示可读提示，且不跳页
- 刷新浏览器仍保持登录（refresh 轮换后 localStorage 更新）
- 登出后 localStorage 无 refresh token，直接访问 `/chat` 被重定向

---

### W3 — API 客户端、单飞刷新、错误归一（1d）

- [x] `src/api/client.ts`
  - `baseURL = import.meta.env.VITE_API_BASE_URL`
  - 统一 JSON、`Authorization: Bearer`
  - 超时（默认 15s）+ `AbortController`
  - 解析 `{ error: { code, message, requestId } }` → `ApiError`
  - 无 body 的 204 正确处理
- [x] `ApiError`：`{ status, code, message, requestId }` + `isApiError()` 类型守卫
- [x] **单飞刷新**（交接 §2.5）
  ```ts
  let refreshing: Promise<string> | null = null;
  function refreshOnce(): Promise<string> { ... }
  ```
  - 401 → 刷新 → **只重放一次**原请求
  - `/auth/login`、`/auth/register`、`/auth/refresh` 排除自动刷新
  - 刷新失败：清空登录态 → 跳登录页，返回 `ApiError`
- [x] 429 处理：仅对幂等 GET 做指数退避（1s / 2s / 4s，最多 3 次）；写操作直接提示，避免重复发送
- [x] 5xx：不直接展示后端 message，统一“服务器内部错误”，附 `requestId`
- [x] TanStack Query 接入（若采用）
  - 全局 `retry`：4xx 不重试；401 交给 client；429/5xx 最多 1 次
  - [ ] `queryKey` 规范：`['conversations']`、`['members', id]`、`['messages', id]`（W4/W5 落地）
- [x] 单测（mock `fetch`）：
  - 3 个并发请求同时 401 → 只调用 1 次 `/auth/refresh`
  - 刷新成功 → 原请求带新 token 重放；只重放一次
  - 刷新失败 → 登录态清空、抛错、不无限循环
  - 错误体解析出 `requestId`

**验收**
- 单测全绿（15 个：单飞刷新、刷新失败、429 退避、204、requestId、tokenStorage、redirect）
- E2E：登录 → 刷新页面 → refresh 轮换 + `/users/me` 恢复 → 登出清理（真实 3100）
- 并发 401 只触发 1 次 refresh（单测 3 并发）
- 429 时 GET 退避、写操作直接失败，不会风暴重试

> ⛳ **确认门 W3（已到达 2026-10-21）**：已完成并通过 15 个单测 + 2 个 Playwright 用例；请验收「登录 → 刷新页面恢复 → 登出」「并发 401 只刷新一次」，确认后再进入 W4。

---

### W4 — 会话列表 + 对方信息 + 新建会话（1d）

- [ ] `src/types/conversation.ts`、`src/api/conversations.ts`
  - `listConversations()`、`createConversation()`、`listMembers()`、`addMembers()`、`removeMember()`
- [ ] `conversationStore` / Query：会话列表、最后消息、未读数、排序
- [ ] 私聊对方信息解析（缺口 §8.2 的临时方案）
  - `GET /conversations/:id/members` → 取 `userId !== me` 的成员
  - 缓存 `Map<conversationId, Member[]>`，TTL 5 分钟；同一会话并发请求合并
  - 并发上限 3–5，避免 N+1 风暴
  - 群聊不需要额外请求，直接用 `title`
  - 封装为 `useConversationPeer(conversation)`，**后端补 `peer` 后只改这一处**
- [ ] 会话列表 UI
  - 私聊：对方 `displayName ?? username` + 头像占位（首字母 + 固定色）
  - 群聊：`title` + 群头像占位
  - 最后一条消息（发送者前缀可选）、相对时间（今天显示 HH:mm，更早显示日期）
  - 未读 badge（>99 显示 99+）
  - 当前会话高亮；空列表状态；加载骨架；错误重试
  - 排序：`lastMessage.createdAt` 降序，缺失按 `updatedAt`
- [ ] 移动端：列表/聊天两栏切换（返回按钮）
- [ ] 新建会话对话框（临时方案，见 W10）
  - direct：输入对方 UUID（提供种子 UUID 快捷键）
  - group：标题（1–100）+ 多个 UUID（最多 100）
  - 提交成功（201/200）→ 刷新列表 → 跳转会话；`created === false` 时提示“已存在，已跳转”
- [ ] 单测：peer 解析（自己/对方/群聊）、未读显示、排序

**验收**
- alice 登录能看到 `Seed Group` 和与 bob 的私聊（标题为 Bob）
- 未读数与后端 `unreadCount` 一致
- 重复创建同一私聊不产生新会话（`created:false`，跳同一 id）

---

### W5 — 聊天页：历史分页、乐观发送、删除（1.5d）

- [ ] `src/types/message.ts`、`src/api/messages.ts`
  - `listMessages({ before?, limit=30 })`、`sendMessage()`、`markRead()`、`deleteMessage()`
- [ ] 消息规范化 store
  - `byId: Record<id, UIMessage>`、`idsByConversation: Record<convId, id[]>`
  - 始终按 `seq` 升序维护；`upsert` 按 `id` 去重
  - `UIMessage = Message & { status: 'sending'|'sent'|'failed'; tempId?: string }`
- [ ] 历史分页
  - 首屏不传 `before`；`nextBefore === null` 表示没有更早
  - 向上滚动到顶部附近加载 `before=nextBefore`，加载中显示顶部 spinner
  - 合并时分页返回与 WS 新消息，不重不漏；保持滚动位置（记录 `scrollHeight` 差）
  - 同一 `nextBefore` 不重复请求（in-flight 去重）
- [ ] 消息列表渲染
  - 自己 / 他人气泡，群聊显示发送者名
  - 时间分组（间隔 > 5 分钟显示时间分隔）
  - 系统消息（`type === 'system'`）居中弱化
  - 空会话状态；消息加载失败重试
- [ ] Composer
  - Enter 发送、Shift+Enter 换行；输入法 `compositionend` 保护
  - 1–4000 字符；空白禁止；超长提示
  - 发送中禁用重复提交（或允许排队但复用 `clientMsgId`）
- [ ] 乐观发送（先用 REST 打通，W6 切 WS）
  1. 生成 `clientMsgId = crypto.randomUUID()`，插入 `sending` 临时消息
  2. `POST /conversations/:id/messages`
  3. 成功：按 `message.id` upsert，删除临时消息；失败：标记 `failed`，显示重试
  4. 重试**复用同一个 `clientMsgId`**，成功后按 id 去重
- [ ] 删除自己的消息：`DELETE /messages/:id`，确认弹窗，成功即从列表移除（软删）
- [ ] 滚动策略：首屏、自己发送、且原本在底部时滚到底；不在底部时显示“有新消息”按钮
- [ ] 长列表：先用普通列表 + 分页；单会话 > 500 条再引入虚拟列表（不提前优化）

**验收**
- 用 9 条消息的私聊，`limit=2` 反复上翻：不重不漏、顺序正确、滚动不跳
- 发送后本地立即出现，服务端返回后不出现第二条
- 断网发送失败，恢复后点重试只产生一条（`clientMsgId` 幂等）
- 删除后刷新页面消息不再出现

---

### W6 — WebSocket：ready、实时收发、去重（1.5d）

- [ ] `src/realtime/socket.ts`
  - `io(baseURL, { auth: { token }, transports: ['websocket'], path: '/socket.io', reconnection: true })`
  - 登录后连接；登出/切账号前 `disconnect()` 并清空所有监听器
  - 连接状态：`connecting` / `online` / `offline`，用于头部提示
- [ ] **必须等 `ready`**（交接 §5.2）
  - `connect` 时**不发消息**；`ready` 后置 `isReady = true` 并 flush 待发队列
  - `disconnect` / `connect_error` 时置 `isReady = false`
  - `connect_error.message === 'UNAUTHORIZED'` → 先刷新 token，再更新 `socket.auth` 重连（与 W8 合并实现）
- [ ] 发送改为 WS 主路径（REST 仅降级）
  - `socket.emit('message.send', payload, ack)`，ack 超时 10s
  - `ack.ok` → 用 `ack.message` 按 id upsert；`ack.ok === false` → 失败 + 错误码提示（`TOO_MANY_REQUESTS` 等）
  - 超时/未连接：标记失败，可切 REST 降级重发（复用 `clientMsgId`）
- [ ] `message.created` 处理
  - 按 `message.id` upsert（**发送方也会收到**，必须去重）
  - 临时消息按 `clientMsgId` 合并：找到同 `clientMsgId` 的 sending 临时项 → 用服务端消息替换
  - 更新会话列表：`lastMessage`、`lastSeq`、排序；非当前会话 `unreadCount + 1`（自己发的除外）
  - 当前会话且窗口聚焦 → 触发已读上报（W7）
- [ ] `message.deleted` → 从列表移除（按 `messageId`）
- [ ] `error` 事件 → toast（带 code/message），不吞掉
- [ ] WS 限流处理：`TOO_MANY_REQUESTS` → 暂停发送 1s 并提示，不自动无限重试
- [ ] 单测：`upsertMessage` 去重（同 id 两次、ack + created 各一次、临时消息合并）

**验收**
- alice / bob 两个浏览器互发：双方实时出现，发送方**只有一条**
- 刷新页面后历史与实时一致，无重复 id
- 未就绪时点发送：消息进入队列，`ready` 后自动发出
- WS 断开时仍可用 REST 发送（降级），重连后不重复

> ⛳ **确认门 W6**：完成后暂停，用 alice/bob 双浏览器演示实时收发与去重，确认后再进入 W7。

---

### W7 — 已读 / 未读、typing、在线状态（1d）

- [ ] 已读上报时机（交接 §7.2）
  - 进入会话、窗口重新聚焦、滚动到底部、收到当前会话新消息
  - WS 已就绪用 `message.read`；否则 `POST /conversations/:id/read`
  - 上报 `{ seq: 当前会话最大 seq }`，本地乐观清零未读
  - 服务端只前进不后退：重复上报安全；失败不回滚未读（下次再报）
- [ ] 未读数
  - 会话列表 badge 与 `document.title`（如 `(3) BSW`）
  - 自己发送的消息不增加未读
  - 收到 `message.read` 时更新成员 `lastReadSeq`，当前用户多端同步时清零对应会话
- [ ] “谁已读”
  - 群聊消息详情可选展示已读人数 = `members.lastReadSeq >= message.seq` 的成员数
  - 不逐条轮询；仅使用已有成员数据 + 实时 `message.read`
- [ ] typing（交接 §7.4）
  - 输入中每 2.5s 发一次 `typing.start`（节流），停止输入 2s 发 `typing.stop`
  - 发送消息、切换会话、失焦、卸载时发 `typing.stop`
  - 收到 `typing` → 显示“X 正在输入…”；3s 无新事件自动隐藏（定时器按 `userId` 管理）
  - 多人输入合并展示；不显示自己
- [ ] `presence.update`
  - 按 `conversationId + userId` 存 `online`；私聊头部、群成员列表显示圆点
  - 首屏无快照 → 显示灰点 + tooltip“在线状态未知”（缺口 §8.3）
  - 不做全局在线列表，不做心跳探测

**验收**
- 打开会话后未读 badge 归零；换一个账号发消息，badge 增加
- typing 3 秒后自动消失；切换会话不会串台
- 在线圆点随另一浏览器关闭/打开更新；首屏为未知态

---

### W8 — 重连 + `sync.request` 补拉（1d）

- [ ] 维护 `lastSeqMap`：每个会话已加载/已收到的最大 `seq`（保存在内存即可，可选 sessionStorage）
- [ ] 重连流程（交接 §5.5）
  1. `disconnect` → UI 显示“连接中…”，发送按钮进入降级/排队
  2. 重连前检查 access token：临近过期或已过期 → **单飞 refresh**（不新增并发刷新）
  3. 更新 `socket.auth = { token: newAccessToken }`，再 `socket.connect()`
  4. 收到 `ready` → 对 `lastSeqMap` 中每个会话发 `sync.request { afterSeq, limit: 100 }`
  5. ack 返回升序消息 → 按 id 合并；返回 100 条则用最后一条 `seq` 继续请求，直到 `< 100` 条
- [ ] 合并规则
  - 已存在 id 跳过；按 `seq` 插入并排序
  - 更新 `lastSeqMap` 和会话列表未读
  - 当前会话补拉后若在底部则滚动，否则显示“有新消息”
- [ ] 重连退避：使用 socket.io 自带 `reconnectionDelay` + `randomizationFactor`，不手写无限重试
- [ ] 断线期间发送：
  - 允许入队（标记 `queued`），`ready` 后按顺序发送；每条复用 `clientMsgId`
  - 也可提示“当前离线，消息将在恢复后发送”
- [ ] HTTP 降级：REST 无法补拉（缺口 §8.4）→ UI 明示“重连后可同步”，不假装已同步
- [ ] 单测：sync 分页合并（99 / 100 / 150 条）、去重、排序
- [ ] 手动验收：DevTools offline 30s，让对方发 3 条，恢复后补齐且不重复

**验收**
- 断网 → 恢复：消息补齐、顺序正确、无重复、未读数正确
- 重连只触发一次 refresh；不会出现 401 循环
- 长时间挂起（标签页休眠）恢复后仍能补拉

> ⛳ **确认门 W8**：完成后暂停，演示断网 30s 后补拉不丢不重，确认后再进入 W9。

---

### W9 — 群与成员管理（1d）

- [ ] `MemberPanel`（群聊专用；私聊不显示入口）
  - 成员列表：`displayName ?? username`、角色 badge（群主/管理员/成员）、在线圆点
  - 按角色排序：owner → admin → member，再按名字
  - 不展示 `email`（隐私字段）
- [ ] 权限判断（交接 §7.6）
  - `owner` / `admin`：可加人、可移除他人
  - 普通成员：只能退群
  - 任何人不能移除群主；私聊禁止加人/退群（后端会 400 `INVALID_OPERATION`）
  - 入口按权限隐藏，但**仍要处理后端 403**（前端权限判断不可信）
- [ ] 加人
  - 输入 userIds（临时方案；后端搜索就绪后换成搜索选择器，见 W10）
  - 单次最多 100；成功 `201` → 用返回的最新成员列表刷新
  - 已在群内的用户按后端行为处理并提示
- [ ] 移除成员：确认弹窗（说明不可撤销）→ `DELETE /members/:userId` → 刷新
- [ ] 退群：确认 → `DELETE /members/:meId` → 从会话列表移除 → 跳 `/chat` → 断开该会话状态
- [ ] 群标题只读展示（后端无改名接口，不放编辑入口）
- [ ] 错误处理：`FORBIDDEN` / `MEMBER_NOT_FOUND` / `NOT_A_MEMBER` 显示明确文案 + `requestId`

**验收**
- owner 能加人、移除普通成员；不能移除自己（群主）
- 普通成员看不到加人/移除按钮，但直接调接口会得到 403 且提示正确
- 退群后会话从列表消失，刷新不复现
- 私聊会话无成员管理入口

---

### W10 — 用户搜索缺口隔离 + 群创建完善（0.5d）

- [ ] 定义 `userDirectory` 接口（唯一缺口适配层）
  ```ts
  type UserSummary = { id: string; username: string; displayName: string | null; avatarUrl: string | null };
  type UserDirectory = { search(q: string, limit?: number): Promise<UserSummary[]> };
  ```
- [ ] 当前实现 `ManualUserDirectory`
  - 支持粘贴/输入 UUID
  - 内置开发用种子用户快捷项（来自 `memory.md`，仅开发环境）
  - `search()` 直接过滤内置列表；不请求不存在的 `/users/search`
- [ ] 后端补齐 `GET /users/search?q=&limit=` 后：新增 `RemoteUserDirectory`，切换注入即可；页面不改
- [ ] 群创建完善
  - 标题 1–100 字符；成员至少 1 人；自己由后端自动加入，不传自己
  - 错误码：`TITLE_REQUIRED`、`INVALID_MEMBERS` 定位提示
- [ ] 新建入口：会话列表顶部“+”→ 私聊 / 群聊 Tab
- [ ] 单测：`ManualUserDirectory` 解析 UUID / 过滤种子；建群参数构造

**验收**
- 能通过种子 UUID 建立群聊并在列表出现
- 同一对用户重复创建私聊跳同一会话
- 切换到远程搜索实现时不需要改 UI 组件

---

### W11 — 打磨、单测、E2E、构建、README（1.5d）

- [ ] 单测覆盖（Vitest）
  - `api/client`：单飞刷新、401 重放一次、ApiError、204、429 退避
  - message reducer：id 去重、clientMsgId 合并、seq 排序、分页合并
  - conversation：peer 解析、排序、未读计算
  - typing/presence store：超时清理、按会话隔离
- [ ] 组件测试（Testing Library）
  - 登录表单校验与错误提示
  - Composer 字符限制、Enter/Shift+Enter
  - 会话列表未读 badge
- [ ] E2E（Playwright，至少 2 条）
  - 登录 → 打开会话 → 发送 → 消息出现在列表
  - 双上下文（alice/bob）实时互发 → 双方各一条 → 已读后 badge 归零
  - 可标记 `test.slow()`；CI 未接入时本地脚本可跑
- [ ] 体验打磨
  - 加载骨架、空状态、错误边界（`ErrorBoundary` + 重试）
  - Toast 统一：错误显示 code + 可复制的 `requestId`
  - 键盘可达性：Tab 焦点、Esc 关闭弹窗、`aria-live` 新消息
  - 响应式断点（≥1024 双栏；<768 单栏切换）
  - 消息列表自动滚动与“回到底部”按钮
- [ ] 性能
  - 会话列表与消息列表避免无谓重渲染（selector / memo）
  - 不在全局 state 里保存全部历史消息的副本
- [ ] README
  - 环境要求、安装、启动、环境变量、联调账号、验收步骤、已知缺口
- [ ] 最终检查：`typecheck` / `lint` / `test` / `build` 全绿

**验收**
- DoD 全部满足
- 新机器按 README 30 分钟内跑起来（可用当前机器模拟）

---

### W12 — 容器化 + 一键部署 + Quadlet（必做，1d）

**目标**：一条命令在服务器拉起前端容器；页面、REST、WS 全部同源；重启自启、失败可回滚。拓扑见 §3.2。

- [ ] `Containerfile`（多阶段、非 root）
  - build 阶段：`node:24-alpine` → `npm ci` → `npm run build`
  - runtime 阶段：`nginxinc/nginx-unprivileged:1.27-alpine`，只拷贝 `dist/` + nginx 模板
  - 基础镜像若 Docker Hub 拉取失败，改用 `docker.1ms.run/...` 或复制到 GHCR（后端已有同样做法）
- [ ] `deploy/nginx.conf.template`
  - `listen 8080`，`root /usr/share/nginx/html`
  - SPA fallback：`try_files $uri $uri/ /index.html`
  - `/api/` → `proxy_pass http://${API_UPSTREAM}/;`（去掉 `/api` 前缀，**尾斜杠不能少**）
  - `/socket.io/` → 同上游，带 `Upgrade` / `Connection "upgrade"`，`proxy_read_timeout 3600s`
  - 静态资源（带 hash）`Cache-Control: public, max-age=31536000, immutable`；`index.html` `no-store`
  - gzip；`/healthz` 直接返回 200；隐藏 nginx 版本
- [ ] `deploy/compose.prod.yaml`
  - `image: localhost/bs-web:latest`（或 GHCR）
  - `network: bs_default`（external，与后端同一网络）
  - `ports: 127.0.0.1:3200:8080`
  - `environment: API_UPSTREAM=bs-chat-api:3000`
  - `healthcheck`：`wget -qO- http://127.0.0.1:8080/healthz`
  - `restart: unless-stopped`，内存/CPU 限制
- [ ] `deploy/bs-web.container`（Quadlet）
  - `Image=localhost/bs-web:latest`、`ContainerName=bs-web`
  - `Network=bs_default`、`PublishPort=127.0.0.1:3200:8080`
  - `Environment=API_UPSTREAM=bs-chat-api:3000`
  - `HealthCmd=wget -qO- http://127.0.0.1:8080/healthz`
  - `Restart=always`、`RestartSec=5`、`WantedBy=default.target`
- [ ] `deploy/deploy.sh`（一键部署）
  1. `podman build -t localhost/bs-web:latest .`（或 `podman pull` GHCR 镜像）
  2. 旧镜像 tag 为 `localhost/bs-web:previous`
  3. 校验 `bs_default` 网络存在、`bs-chat-api` 在运行
  4. 安装/刷新 Quadlet unit → `systemctl --user daemon-reload` → `restart bs-web`
  5. 轮询 `http://127.0.0.1:3200/healthz` 与 `http://127.0.0.1:3200/api/readyz`
  6. 失败自动回滚到 `:previous` 并输出诊断（`podman logs bs-web`）
- [ ] `deploy/Caddyfile`
  - 生产入口从 `127.0.0.1:3100` 改为 `127.0.0.1:3200`（web 容器）
  - `encode gzip`；Caddy 自带 WS upgrade，无需额外配置
  - 3100 仍保留给宿主机直连调试，不对外
- [ ] `Makefile`：`image` / `up` / `down` / `logs` / `deploy TAG=...` / `rollback`
- [ ] `.dockerignore`：`node_modules`、`dist`、`.git`、`tests`、`coverage`、`*.md`（保留必要文件）
- [ ] `.github/workflows/publish.yml`：推送 tag → 构建并推送 `ghcr.io/momoi-gh/bsw/web:vX`（远程仓库 `momoi-gh/BSW` 已存在）
- [ ] README 部署章节：服务器准备、镜像源、`make deploy`、回滚、TLS、常见故障
- [ ] 验证：`curl /healthz`、`curl /api/healthz`、登录、历史、WS 实时、深链接刷新
- [ ] 验证：重启容器 / 重启机器（`loginctl enable-linger`）后自动恢复
- [ ] 资源与安全：容器非 root、限制内存、只暴露 3200 到 127.0.0.1、不把 `.env` 打进镜像

**注意**

- 前端产物**不写死后端地址**，浏览器只访问同源 `/api`、`/socket.io`；镜像可跨环境复用。
- `API_UPSTREAM` 依赖容器名 `bs-chat-api`；后端 Quadlet 改名时必须同步。
- rootless 不能绑 80/443，公网 TLS 交给宿主机 Caddy；没有 Caddy 时可直接 `-p 8080:8080` 用 HTTP 验证。
- 本阶段不改后端代码；只改 Caddy 上游指向。

**验收**
- 一台只有 Podman 的服务器，按 README 一条命令拉起页面
- 登录、历史、WS 实时、断线重连、深链接刷新全部正常
- `systemctl --user restart bs-web` 后自动恢复
- 部署失败能自动回滚到上一镜像

---

## 6. 后端缺口与前端临时方案

> 来源：`前端交接.md` §8 / §13。原则：**所有缺口收敛到适配层**，后端补齐后只替换实现，页面组件不动。

| # | 缺口 | 优先级 | 影响 | 前端临时方案 | 替换点 |
| --- | --- | --- | --- | --- | --- |
| G1 | 无用户搜索 `GET /users/search` | P0（找新聊天对象） | 无法按名字找人 | 手动输入 UUID + 种子用户快捷项（仅开发） | `userDirectory.ts` |
| G2 | 会话列表无私聊对方信息 | P0（列表显示名字） | 私聊只能显示 UUID | 对私聊调 `/members`，缓存 + 并发限流 | `useConversationPeer` |
| G3 | 无在线状态快照 | P1 | 首屏在线状态未知 | 显示灰点 +“未知”，收到事件后更新 | `presenceStore` |
| G4 | 无 HTTP `after` 补拉 | P1 | 纯 HTTP 无法补消息 | 重连必须依赖 WS `sync.request`；离线时明确提示 | `sync.ts` |
| G5 | refreshToken 仅 JSON body | P2（安全） | Web 需存 localStorage，XSS 风险 | 先用 localStorage，access 仅内存；不持久化消息正文 | `tokenStorage.ts` |
| G6 | 无资料修改 / 头像上传 | P3 | 头像用首字母占位 | 不提供入口 | — |
| G7 | 无消息编辑 / reaction / @ / 附件 | P3 | 功能缺失 | 不提供入口，不画死按钮 | — |
| G8 | 无推送通知 | P3 | 后台不提醒 | 仅页面内提示 + `document.title` | — |

需要后端配合时，统一在 `memory.md` 的「待后端确认」列出，并附带前端期望的响应结构，例如：

```http
GET /users/search?q=ali&limit=20
→ { "users": [{ "id": "uuid", "username": "alice", "displayName": "Alice", "avatarUrl": null }] }
```

---

## 7. 风险登记

| 风险 | 影响 | 应对 |
| --- | --- | --- |
| 刷新令牌轮换 + 并发 401 | 旧 refresh 被吊销，用户被踢下线 | 单飞刷新 + 重放一次；单测覆盖并发场景；认证接口排除自动刷新 |
| ack 与 `message.created` 双份数据 | 发送方看到重复消息 | 统一 `upsertMessage` 按 `message.id` 去重；临时消息按 `clientMsgId` 合并 |
| `ready` 前发消息 | ack 丢失/超时 | `isReady` 门禁 + 待发队列；`connect` 不直接发送 |
| CORS + `localhost` / `127.0.0.1` / IPv6 差异 | 浏览器请求被拦或连不上 | 开发用 Vite 代理同源访问；不改后端 CORS 也能跑 |
| 3100 是生产实例 | 测试消息污染数据 | 优先新起 3000 开发实例；否则用专门测试账号并记录清理方式 |
| `/auth/*` 限流 10 次/分钟 | 反复登录失败会 429 | 登录按钮防抖、失败后提示等待；E2E 复用 storageState，不反复登录 |
| 私聊对方信息 N+1 | 列表加载慢、触发全局 300/min 限流 | 缓存 + TTL + 并发上限；只对 direct 拉取 |
| 无 `after` 补拉 | 断线消息永久丢失 | 必须实现 `sync.request` 循环补拉；重连前刷新 token |
| typing 定时器泄漏 | 切会话后误显示/内存增长 | 按 `conversationId + userId` 管理 timer，卸载/切换时清理 |
| 长会话一次性渲染 | 卡顿 | 分页 + 必要时虚拟列表；不在全局存多份消息 |
| localStorage 存 refresh token | XSS 可窃取 | access 仅内存、CSP、不渲染用户 HTML、后续改 httpOnly Cookie |
| 后端 5xx message 不适合展示 | 用户看到内部信息 | 统一“服务器内部错误” + requestId |
| 文档与实现不一致 | 联调返工 | 每次联调把实际行为回写 `memory.md`；以实测为准 |
| 3100 测试数据污染 | 种子会话变乱 | 只用种子账号；需要洁净环境时另起独立库，不动 3100 |
| Docker Hub 基础镜像拉取失败 | 镜像构建/运行失败 | 用 `docker.1ms.run` 镜像源，或像后端一样复制到 GHCR |
| web 容器解析不到 `bs-chat-api` | `/api` 502 | 同一 `bs_default` 网络；用 `podman exec bs-web getent hosts bs-chat-api` 验证 |
| Caddy 仍指向 3100 | 新前端不生效 | 部署时把 Caddy 上游改为 `127.0.0.1:3200` 并 reload |
| nginx 代理路径写错 | `/api` 404 或 WS 失败 | `proxy_pass` 尾斜杠、`/socket.io/` 的 Upgrade 头必须正确 |
| 前端 index.html 被缓存 | 发布后仍是旧页面 | `index.html` no-store，静态资源 hash + immutable |
| 容器内写文件权限 | nginx 启动失败 | 用 nginx-unprivileged（:8080），需要写目录挂 tmpfs |

---

## 8. 验收清单（Web）

> 对应 `前端交接.md` §12，已剔除 Flutter 相关项。

- [x] 注册、登录、登出、刷新令牌正常
- [x] 401 只触发一次刷新，刷新失败回登录页
- [ ] 会话列表显示未读数、最后一条消息
- [ ] 私聊不会重复创建
- [ ] 群聊创建、加人、移除、退群正常
- [ ] 历史消息分页不重不漏
- [ ] 发送消息乐观更新，失败可重试，`clientMsgId` 复用
- [ ] 发送方不会出现重复消息（ack + broadcast 去重）
- [ ] 已读上报后未读数归零
- [ ] typing 能显示并自动消失
- [ ] 在线状态能随事件更新（首屏允许“未知”）
- [ ] 断网重连后 `sync.request` 能补消息
- [ ] 429 有限流提示和退避
- [x] Web 端 CORS / 代理配置正确
- [x] 错误提示带 `requestId` 便于排查
- [ ] 移动端窄屏可用（列表/聊天切换）
- [ ] `typecheck` / `lint` / `test` / `build` 全绿
- [ ] Podman 镜像可构建，容器以非 root 运行
- [ ] 容器内同源代理 `/api` 与 `/socket.io` 正常
- [ ] Quadlet 重启/开机自启正常，部署脚本失败可回滚
- [ ] 深链接（如 `/chat/<id>`）直接刷新不 404

---

## 9. 问题与决策记录（W0 已完成）

| # | 问题 | 推荐默认值 | 影响 |
| --- | --- | --- | --- |
| Q1 | 前端框架用 React 19 还是 Vue 3？ | **✅ 已确认：React 19** | 全部代码与目录结构 |
| Q2 | UI 方案：Tailwind 4 + shadcn/ui / Ant Design / 极简自定义？ | **✅ 已确认：Tailwind 4 + shadcn/ui 按需引入** | 组件写法、体积、主题 |
| Q3 | 联调目标：3100 还是新起 3000？是否允许在 3100 写测试消息？ | **✅ 已确认：直接用 3100**，只用种子账号写测试数据 | 数据安全、CORS、验收 |
| Q4 | 是否 `git init` 并建立远程仓库？提交粒度？ | **远程仓库已存在 `momoi-gh/BSW`**；本地 `main`，每阶段一次提交 | 回滚、CI 与镜像发布 |
| Q5 | 用户搜索缺口：先用 UUID 临时方案，还是等后端补 `/users/search`？ | **默认先用临时方案**（不阻塞主链路） | W4/W10 工作量 |
| Q6 | 交付节奏：每阶段停下验收，还是一次做到 MVP？ | **✅ 已确认：W3 / W6 / W8 停下确认** | 返工成本 |
| Q7 | 是否需要暗色模式 / 多语言？ | **✅ 已确认：只做响应式；暗色、多语言不做** | 样式与工期 |
| Q8 | 最终交付形态？ | **✅ 已确认：Podman 容器 + 一键部署到服务器** | W12 范围与验收 |

---

## 10. 变更记录

| 日期 | 内容 |
| --- | --- |
| 2026-10-21 | 初版：基于 `前端交接.md` 拆解 Web 阶段 W0–W12，明确不做 Flutter；记录环境基线、缺口临时方案与待确认问题 |
| 2026-10-21 | 确认 Q1/Q2：React 19 + Tailwind CSS 4 + shadcn/ui；补充 W1 的 shadcn 初始化与首批组件清单 |
| 2026-10-21 | 确认 Q3/Q6/Q7/Q8：联调 3100、W3/W6/W8 确认门、只做响应式、Podman 容器一键部署；W12 从可选改为必做并补充部署拓扑与脚本清单 |
| 2026-10-21 | W1–W3 完成：Vite 8 + React 19 + Tailwind 4 + shadcn/ui；认证、守卫、API 客户端（单飞刷新/401 重放/429 退避）；15 单测 + 2 E2E 通过；到达 W3 确认门 |
