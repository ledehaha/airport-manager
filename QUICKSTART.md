# 🚀 快速部署指南

本文档将带你一步步完成机场节点管理系统的部署。

---

## 📋 前置准备

### 1. Cloudflare 账号

确保你有一个 [Cloudflare](https://dash.cloudflare.com/) 账号。

### 2. 安装 Node.js 和 Git

```bash
# 检查是否已安装
node --version  # 需要 18+
git --version
```

### 3. 安装 Wrangler

```bash
npm install -g wrangler

# 登录 Cloudflare
wrangler login
```

---

## 🔧 第一步：创建 D1 数据库

### 1. 创建数据库

```bash
cd backend

# 创建数据库
wrangler d1 create airport_db
```

✅ 成功后会输出类似：
```
✅ Successfully created DB 'airport_db'

[[d1_databases]]
binding = "DB"
database_name = "airport_db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 2. 复制 database_id

把上面输出的 `database_id` 复制下来，后面要用。

---

## ⚙️ 第二步：配置后端

### 1. 编辑 `backend/wrangler.toml`

```toml
name = "airport-manager-api"
compatibility_date = "2024-04-05"
compatibility_flags = [ "nodejs_compat" ]
main = "src/index.ts"

[[d1_databases]]
binding = "DB"
database_name = "airport_db"
database_id = "粘贴刚才复制的 database_id"

[vars]
JWT_SECRET = "这里输入一个复杂的随机字符串"
```

> 💡 生成随机字符串的方法：
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 2. 初始化数据库表

```bash
wrangler d1 execute airport_db --file=./schema.sql
```

✅ 成功后会输出：
```
✅ Executed ...
```

---

## 🎨 第三步：配置前端

### 编辑 `frontend/index.html`

找到这一行：
```javascript
const API_BASE = '';
```

修改为：
```javascript
const API_BASE = 'https://airport-manager-api.你的用户名.workers.dev';
```

> 💡 你也可以等后端部署完成后，拿到地址再修改。

---

## 🔐 第四步：获取 Cloudflare API Token

### 1. 创建 API Token

1. 登录 [Cloudflare 控制台](https://dash.cloudflare.com/)
2. 点击右上角头像 → **我的个人资料**
3. 左侧菜单 → **API 令牌**
4. 点击 **创建令牌**
5. 选择 **编辑 Cloudflare Workers** 模板
6. 权限设置（必须包含以下）：
   - ✅ Account - Workers Scripts - Edit
   - ✅ Account - D1 - Edit  
   - ✅ Account - Pages - Edit
7. 点击 **继续以显示摘要** → **创建令牌**

### 2. 复制并保存 Token

⚠️ **Token 只显示一次！立即复制保存好！**

---

## 📦 第五步：上传到 GitHub

### 1. 创建 GitHub 仓库

1. 登录 [GitHub](https://github.com/)
2. 点击 **New repository**
3. 仓库名：`airport-manager`
4. 选择 **Public** 或 **Private**
5. 不要勾选 "Add a README file"
6. 点击 **Create repository**

### 2. 推送代码

```bash
# 在项目根目录执行
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/airport-manager.git
git push -u origin main
```

---

## 🤖 第六步：配置 GitHub Secrets

### 在 GitHub 仓库中设置：

1. 进入你的仓库 → **Settings**
2. 左侧菜单 → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**
4. 添加：

| Name | Value |
|------|-------|
| `CLOUDFLARE_API_TOKEN` | 粘贴你刚才获取的 Cloudflare API Token |

---

## 🚀 第七步：触发自动部署

### 方法一：推送代码自动触发

```bash
# 修改任意文件（比如 README）
git add .
git commit -m "Trigger deploy"
git push
```

### 方法二：手动触发

1. 在 GitHub 仓库点击 **Actions**
2. 左侧选择 **Deploy to Cloudflare**
3. 点击 **Run workflow** → 选择 main 分支 → **Run workflow**

---

## 👀 第八步：查看部署状态

1. 在 GitHub 仓库点击 **Actions** 标签
2. 你会看到正在运行的工作流
3. 点击进去可以查看详细日志
4. 显示 ✅ 就表示部署成功！

---

## 🎉 部署完成！访问你的服务

部署成功后，你会得到：

| 服务 | 地址示例 |
|------|---------|
| 管理页面 | `https://airport-manager.pages.dev` |
| API 后端 | `https://airport-manager-api.xxx.workers.dev` |
| 订阅地址 | `https://airport-manager-api.xxx.workers.dev/sub/mytoken` |

### 首次登录

| 项目 | 默认值 |
|------|--------|
| 用户名 | `admin` |
| 密码 | `admin123` |

> ⚠️ **重要：登录后请立即修改默认密码！**

---

## 🔗 绑定自定义域名（可选）

### 在 Cloudflare 控制台设置：

1. **Workers & Pages** → 你的 Worker → **设置** → **触发器**
2. **添加自定义域**，输入你想用的域名（如 `api.example.com`）

### Pages 同理：
1. Pages → 你的项目 → **设置** → **自定义域**
2. 添加你的域名（如 `manage.example.com`）

---

## ❓ 常见问题

### Q: 部署失败怎么办？

查看 GitHub Actions 的详细日志，通常是：
- API Token 权限不够
- 数据库 ID 填写错误
- 配置文件格式错误

### Q: 数据库初始化失败？

确保：
- 使用的是正确的数据库 ID
- 命令是在 backend 目录下执行的

### Q: 订阅链接怎么用？

复制订阅链接，粘贴到 V2RayN、Clash、Shadowrocket 等客户端即可使用。

### Q: 如何添加更多协议支持？

在 `backend/src/index.ts` 中的订阅生成部分添加新的协议处理逻辑。

---

## 📞 需要帮助？

如果遇到问题：
1. 查看 GitHub Actions 的部署日志
2. 查看 Cloudflare Workers 的实时日志
3. 提交 Issue 到 GitHub 仓库

---

## ✅ 部署清单

- [ ] 创建 Cloudflare 账号
- [ ] 安装 Node.js 和 Wrangler
- [ ] 创建 D1 数据库
- [ ] 填写 wrangler.toml 配置
- [ ] 初始化数据库表
- [ ] 获取 Cloudflare API Token
- [ ] 上传代码到 GitHub
- [ ] 配置 GitHub Secrets
- [ ] 触发自动部署
- [ ] 测试登录和功能
- [ ] 修改默认密码

---

**恭喜！你已经成功部署了自己的机场节点管理系统！ 🎉**
