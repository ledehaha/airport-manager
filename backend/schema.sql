-- ==========================================
-- 机场节点管理系统 - 数据库初始化脚本
-- ==========================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 节点表
CREATE TABLE IF NOT EXISTS nodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- vmess, vless, trojan, ss
  server TEXT NOT NULL,
  port INTEGER NOT NULL,
  uuid TEXT,
  password TEXT,
  encryption TEXT,
  network TEXT DEFAULT 'tcp', -- tcp, ws, http, grpc
  tls TEXT DEFAULT 'none', -- tls, none
  sni TEXT,
  host TEXT,
  path TEXT,
  alpn TEXT,
  remarks TEXT,
  enabled INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 系统配置表
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 插入默认数据
-- ==========================================

-- 默认管理员账号
-- 用户名: admin
-- 密码: admin123 (SHA256: a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3)
INSERT OR IGNORE INTO users (username, password) 
VALUES (
  'admin', 
  'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3'
);

-- 默认系统配置
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('site_name', '机场节点管理系统'),
  ('sub_url_prefix', ''),
  ('enable_registration', 'false'),
  ('max_nodes_per_user', '100');

-- ==========================================
-- 创建索引
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_nodes_enabled ON nodes(enabled);
CREATE INDEX IF NOT EXISTS idx_nodes_sort_order ON nodes(sort_order);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
