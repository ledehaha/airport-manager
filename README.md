# ✈️ 机场节点管理系统

基于 Cloudflare Workers + Pages + D1 数据库的一站式机场订阅管理系统

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/ledeha/airport-manager)

## ✨ 功能特性

| 功能 | 状态 | 说明 |
|------|------|------|
| 🔐 登录认证 | ✅ | JWT Token，有效期7天 |
| 📝 节点增删改查 | ✅ | 完整的CRUD操作 |
| 🔗 多协议支持 | ✅ | VMess/VLESS/Trojan/Shadowsocks |
| 📋 订阅链接生成 | ✅ | 标准 Base64 订阅格式 |
| ↕️ 节点排序 | ✅ | 自定义显示顺序 |
| ✅ 启用/禁用 | ✅ | 临时禁用而不删除 |
| 🎨 现代化UI | ✅ | Tailwind CSS 深色主题 |

## 🚀 快速开始

### 📋 前置要求

- 一个 [Cloudflare](https://dash.cloudflare.com/) 账号
- 已安装 [Node.js](https://nodejs.org/) 18+
- [Git](https://git-scm.com/)

### 👉 查看详细部署教程：[QUICKSTART.md](./QUICKSTART.md)

---

## 📁 项目结构

```
airport-manager/
├── .github/workflows/    # GitHub Actions 自动部署
├── backend/            # Cloudflare Workers 后端 API
│   ├── src/index.ts    # API 主文件
│   └── schema.sql    # 数据库表结构
├── frontend/           # Cloudflare Pages 前端页面
│   └── index.html    # 管理界面
├── README.md
└── QUICKSTART.md     # 详细部署教程
```

---

## 🔧 技术栈

| 组件 | 技术 |
|------|------|
| 后端框架 | [Hono](https://hono.dev/) - 超轻量 Web 框架 |
| 后端部署 | Cloudflare Workers - Serverless |
| 前端部署 | Cloudflare Pages - 静态托管 |
| 数据库 | Cloudflare D1 - SQLite |
| 认证 | JWT (JSON Web Token) |
| UI | Tailwind CSS + Font Awesome |

---

## 📖 使用说明

### 初始账号

| 项目 | 默认值 |
|------|--------|
| 用户名 | `admin` |
| 密码 | `admin123` |

> ⚠️ **重要：首次登录后请立即修改默认密码！

### 管理界面功能

1. **登录** - 使用默认账号登录
2. **添加节点** - 点击「添加节点」按钮，填写节点信息
3. **编辑节点** - 点击节点卡片上的编辑图标
4. **删除节点** - 点击删除图标，确认后删除
5. **复制订阅链接** - 点击「复制订阅链接」按钮

### 支持的协议

| 协议 | 支持状态 |
|------|----------|
| VMess | ✅ |
| VLESS | ✅ |
| Trojan | ✅ |
| Shadowsocks (SS) | ✅ |

---

## 🔒 安全建议

1. ✅ **立即修改默认密码** - 首次登录后第一件事
2. ✅ **开启 Cloudflare Access** - 为管理页面添加额外的身份验证
3. ✅ **定期轮换 JWT_SECRET** - 定期更新配置中的 JWT 密钥
4. ✅ **订阅链接 Token 认证** - 为订阅链接添加访问控制
5. ✅ **启用 2FA** - 为 Cloudflare 账号开启两步验证

---

## 📊 API 接口

### 认证接口
```
POST /api/login          # 登录获取 Token
```

### 节点管理接口（需要认证）
```
GET    /api/nodes        # 获取所有节点
POST   /api/nodes        # 添加节点
PUT    /api/nodes/:id    # 更新节点
DELETE /api/nodes/:id    # 删除节点
```

### 订阅接口（公开）
```
GET /sub/:token           # 获取订阅内容
GET /api/sub/info         # 获取订阅信息（需要认证）
```

---

## 🛠️ 本地开发

```bash
# 克隆仓库
git clone https://github.com/你的用户名/airport-manager.git
cd airport-manager

# 后端开发
cd backend
npm install
npm run dev

# 前端开发（直接用浏览器打开 frontend/index.html
```

---

## 📝 更新日志

### v1.0.0 (2026-05-18)
- ✅ 初始版本发布
- ✅ 支持四种主流协议
- ✅ GitHub Actions 自动部署
- ✅ 完整的管理界面

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE)

---

## ⚠️ 免责声明

本项目仅供学习和研究使用。使用本项目搭建的服务请遵守当地法律法规，不得用于任何非法用途。
