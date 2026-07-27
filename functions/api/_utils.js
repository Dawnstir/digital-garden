/**
 * _utils.js
 * 公共工具：CORS 头、Token 验证。
 * 被其他 API 文件引用。
 */

// 允许跨域（同项目内其实不需要，但预留未来分域名）
export function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
}

// 验证管理员 Token（从 KV 查）
export async function verifyToken(context) {
  const auth = context.request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token) return false;
  
  const session = await context.env.SESSIONS.get(token);
  return !!session;  // KV 里有就是有效
}

// 统一错误响应
export function jsonError(msg, status = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: corsHeaders()
  });
}

// 统一成功响应
export function jsonOk(data = {}) {
  return new Response(JSON.stringify(data), {
    headers: corsHeaders()
  });
}

// 获取今天和昨天的日期字符串（本地时区 YYYY-MM-DD）
export function getTodayYesterday() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  
  const yest = new Date(now.getTime() - 86400000);
  const yesterday = `${yest.getFullYear()}-${pad(yest.getMonth() + 1)}-${pad(yest.getDate())}`;
  
  return { today, yesterday };
}