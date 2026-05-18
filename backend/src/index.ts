import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt, sign } from 'hono/jwt';
import { sha256 } from 'hono/utils/crypto';
import { createMiddleware } from 'hono/factory';

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
};

type Node = {
  id?: number;
  name: string;
  type: string;
  server: string;
  port: number;
  uuid?: string;
  password?: string;
  encryption?: string;
  network?: string;
  tls?: string;
  sni?: string;
  host?: string;
  path?: string;
  alpn?: string;
  remarks?: string;
  enabled?: number;
  sort_order?: number;
};

const app = new Hono<{ Bindings: Bindings }>();

// ==========================================
// CORS 配置
// ==========================================
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// ==========================================
// 认证中间件
// ==========================================
const authMiddleware = createMiddleware<{ Bindings: Bindings }>(async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return c.json({ error: '未授权访问', code: 401 }, 401);
  }
  
  try {
    await jwt({ secret: c.env.JWT_SECRET })(c, next);
  } catch (e) {
    return c.json({ error: 'Token 无效或已过期', code: 401 }, 401);
  }
});

// ==========================================
// 健康检查
// ==========================================
app.get('/health', (c) => {
  return c.json({ status: 'ok', message: '机场节点管理系统运行正常' });
});

// ==========================================
// 登录接口
// ==========================================
app.post('/api/login', async (c) => {
  try {
    const { username, password } = await c.req.json();
    
    if (!username || !password) {
      return c.json({ error: '用户名和密码不能为空', code: 400 }, 400);
    }

    const hashedPwd = await sha256(password) as string;
    
    const user = await c.env.DB
      .prepare('SELECT id, username FROM users WHERE username = ? AND password = ?')
      .bind(username, hashedPwd)
      .first();
    
    if (!user) {
      return c.json({ error: '用户名或密码错误', code: 401 }, 401);
    }
    
    const token = await sign(
      { id: user.id, username, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 },
      c.env.JWT_SECRET
    );
    
    return c.json({ 
      success: true, 
      token,
      user: { id: user.id, username: user.username }
    });
  } catch (e: any) {
    return c.json({ error: '登录失败: ' + e.message, code: 500 }, 500);
  }
});

// ==========================================
// 修改密码接口
// ==========================================
app.post('/api/change-password', authMiddleware, async (c) => {
  try {
    const { oldPassword, newPassword } = await c.req.json();
    const payload = c.get('jwtPayload') as { id: number; username: string };
    
    if (!oldPassword || !newPassword) {
      return c.json({ error: '旧密码和新密码不能为空', code: 400 }, 400);
    }

    if (newPassword.length < 6) {
      return c.json({ error: '新密码长度不能少于6位', code: 400 }, 400);
    }

    const oldHashed = await sha256(oldPassword) as string;
    const newHashed = await sha256(newPassword) as string;
    
    // 验证旧密码
    const user = await c.env.DB
      .prepare('SELECT id FROM users WHERE id = ? AND password = ?')
      .bind(payload.id, oldHashed)
      .first();
    
    if (!user) {
      return c.json({ error: '旧密码错误', code: 401 }, 401);
    }
    
    // 更新密码
    await c.env.DB
      .prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(newHashed, payload.id)
      .run();
    
    return c.json({ success: true, message: '密码修改成功' });
  } catch (e: any) {
    return c.json({ error: '修改密码失败: ' + e.message, code: 500 }, 500);
  }
});

// ==========================================
// 节点管理接口
// ==========================================

// 获取所有节点
app.get('/api/nodes', authMiddleware, async (c) => {
  try {
    const nodes = await c.env.DB
      .prepare('SELECT * FROM nodes ORDER BY sort_order ASC, id ASC')
      .all();
    
    return c.json({ success: true, data: nodes.results });
  } catch (e: any) {
    return c.json({ error: '获取节点列表失败: ' + e.message, code: 500 }, 500);
  }
});

// 获取单个节点
app.get('/api/nodes/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const node = await c.env.DB
      .prepare('SELECT * FROM nodes WHERE id = ?')
      .bind(id)
      .first();
    
    if (!node) {
      return c.json({ error: '节点不存在', code: 404 }, 404);
    }
    
    return c.json({ success: true, data: node });
  } catch (e: any) {
    return c.json({ error: '获取节点信息失败: ' + e.message, code: 500 }, 500);
  }
});

// 添加节点
app.post('/api/nodes', authMiddleware, async (c) => {
  try {
    const node: Node = await c.req.json();
    
    // 验证必填字段
    if (!node.name || !node.type || !node.server || !node.port) {
      return c.json({ error: '节点名称、类型、服务器地址和端口不能为空', code: 400 }, 400);
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO nodes (
        name, type, server, port, uuid, password, encryption, network, 
        tls, sni, host, path, alpn, remarks, enabled, sort_order, 
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      node.name,
      node.type,
      node.server,
      node.port,
      node.uuid || null,
      node.password || null,
      node.encryption || null,
      node.network || 'tcp',
      node.tls || 'none',
      node.sni || null,
      node.host || null,
      node.path || null,
      node.alpn || null,
      node.remarks || null,
      node.enabled ?? 1,
      node.sort_order || 0
    ).run();
    
    return c.json({ 
      success: true, 
      message: '节点添加成功',
      data: { id: result.meta.last_row_id, ...node }
    });
  } catch (e: any) {
    return c.json({ error: '添加节点失败: ' + e.message, code: 500 }, 500);
  }
});

// 更新节点
app.put('/api/nodes/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const node: Node = await c.req.json();
    
    // 验证必填字段
    if (!node.name || !node.type || !node.server || !node.port) {
      return c.json({ error: '节点名称、类型、服务器地址和端口不能为空', code: 400 }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE nodes SET 
        name = ?, type = ?, server = ?, port = ?, uuid = ?, password = ?,
        encryption = ?, network = ?, tls = ?, sni = ?, host = ?, path = ?,
        alpn = ?, remarks = ?, enabled = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      node.name, node.type, node.server, node.port,
      node.uuid || null, node.password || null, node.encryption || null,
      node.network || 'tcp', node.tls || 'none', node.sni || null,
      node.host || null, node.path || null, node.alpn || null,
      node.remarks || null, node.enabled ?? 1, node.sort_order || 0,
      id
    ).run();
    
    return c.json({ success: true, message: '节点更新成功' });
  } catch (e: any) {
    return c.json({ error: '更新节点失败: ' + e.message, code: 500 }, 500);
  }
});

// 删除节点
app.delete('/api/nodes/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    
    await c.env.DB
      .prepare('DELETE FROM nodes WHERE id = ?')
      .bind(id)
      .run();
    
    return c.json({ success: true, message: '节点删除成功' });
  } catch (e: any) {
    return c.json({ error: '删除节点失败: ' + e.message, code: 500 }, 500);
  }
});

// ==========================================
// 订阅链接相关接口
// ==========================================

// 获取订阅信息
app.get('/api/sub/info', authMiddleware, async (c) => {
  try {
    const result = await c.env.DB
      .prepare('SELECT COUNT(*) as count FROM nodes WHERE enabled = 1')
      .first();
    
    const baseUrl = new URL(c.req.url).origin;
    
    return c.json({
      success: true,
      data: {
        nodeCount: result?.count || 0,
        subUrl: `${baseUrl}/sub/mytoken`
      }
    });
  } catch (e: any) {
    return c.json({ error: '获取订阅信息失败: ' + e.message, code: 500 }, 500);
  }
});

// 订阅链接生成（公开访问）
app.get('/sub/:token', async (c) => {
  try {
    // TODO: 这里可以添加订阅 token 验证逻辑
    
    const nodes = await c.env.DB
      .prepare('SELECT * FROM nodes WHERE enabled = 1 ORDER BY sort_order ASC, id ASC')
      .all();
    
    const links: string[] = [];
    
    for (const node of nodes.results as Node[]) {
      let link = '';
      
      if (node.type === 'vmess') {
        // VMess 协议
        const vmessObj = {
          v: '2',
          ps: node.name,
          add: node.server,
          port: node.port,
          id: node.uuid,
          aid: '0',
          scy: node.encryption || 'auto',
          net: node.network || 'tcp',
          type: 'none',
          host: node.host || '',
          path: node.path || '',
          tls: node.tls || 'none',
          sni: node.sni || '',
          alpn: node.alpn || ''
        };
        link = 'vmess://' + btoa(JSON.stringify(vmessObj));
      } 
      else if (node.type === 'vless') {
        // VLESS 协议
        let params = `security=${node.encryption || 'none'}`;
        if (node.tls === 'tls') params += `&tls=tls&sni=${encodeURIComponent(node.sni || '')}`;
        if (node.network === 'ws') params += `&type=ws&host=${encodeURIComponent(node.host || '')}&path=${encodeURIComponent(node.path || '')}`;
        if (node.network === 'grpc') params += `&type=grpc&serviceName=${encodeURIComponent(node.path || '')}`;
        link = `vless://${node.uuid}@${node.server}:${node.port}?${params}#${encodeURIComponent(node.name)}`;
      }
      else if (node.type === 'trojan') {
        // Trojan 协议
        let params = `security=tls&sni=${encodeURIComponent(node.sni || '')}`;
        if (node.network === 'ws') params += `&type=ws&host=${encodeURIComponent(node.host || '')}&path=${encodeURIComponent(node.path || '')}`;
        if (node.network === 'grpc') params += `&type=grpc&serviceName=${encodeURIComponent(node.path || '')}`;
        link = `trojan://${node.password}@${node.server}:${node.port}?${params}#${encodeURIComponent(node.name)}`;
      }
      else if (node.type === 'ss' || node.type === 'shadowsocks') {
        // Shadowsocks 协议
        const methodAndPwd = btoa(`${node.encryption}:${node.password}`);
        link = `ss://${methodAndPwd}@${node.server}:${node.port}#${encodeURIComponent(node.name)}`;
      }
      
      if (link) links.push(link);
    }
    
    // Base64 编码输出（标准订阅格式）
    const subContent = links.join('\n');
    const encoded = btoa(subContent);
    
    return new Response(encoded, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Subscription-UserInfo': `upload=0; download=0; total=0; expire=0`,
        'Profile-Update-Interval': '6',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (e: any) {
    return new Response('生成订阅失败: ' + e.message, { status: 500 });
  }
});

// ==========================================
// 批量操作接口
// ==========================================

// 批量导入节点
app.post('/api/nodes/batch', authMiddleware, async (c) => {
  try {
    const { nodes } = await c.req.json();
    
    if (!Array.isArray(nodes) || nodes.length === 0) {
      return c.json({ error: '节点数据不能为空', code: 400 }, 400);
    }

    const stmt = c.env.DB.prepare(`
      INSERT INTO nodes (
        name, type, server, port, uuid, password, encryption, network, 
        tls, sni, host, path, alpn, remarks, enabled, sort_order, 
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    const batch = c.env.DB.batch(
      nodes.map((node: Node) => 
        stmt.bind(
          node.name, node.type, node.server, node.port,
          node.uuid || null, node.password || null, node.encryption || null,
          node.network || 'tcp', node.tls || 'none', node.sni || null,
          node.host || null, node.path || null, node.alpn || null,
          node.remarks || null, node.enabled ?? 1, node.sort_order || 0
        )
      )
    );

    await batch;
    
    return c.json({ 
      success: true, 
      message: `成功导入 ${nodes.length} 个节点`
    });
  } catch (e: any) {
    return c.json({ error: '批量导入失败: ' + e.message, code: 500 }, 500);
  }
});

export default app;
