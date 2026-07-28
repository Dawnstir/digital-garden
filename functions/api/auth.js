/**
 * auth.js
 * POST /api/auth -> 验证 PIN，生成 Token 存 KV
 */

import { corsHeaders, jsonError, jsonOk } from './_utils.js';

export async function onRequestPost(context) {
  const { env, request } = context;
  const body = await request.json().catch(() => ({}));
  const { pin = '' } = body;
  
  // PIN 码存在环境变量 ADMIN_PIN 中（在 Cloudflare Dashboard 设置）
  const correctPin = env.ADMIN_PIN;
  if (!correctPin) {
    return jsonError('服务器未配置 PIN', 500);
  }
  
  if (pin !== correctPin) {
    return jsonError('PIN 码错误', 403);
  }
  
  // 生成随机 Token，存入 KV（24 小时过期）
  const token = crypto.randomUUID();
  await env.SESSIONS.put(token, JSON.stringify({ created: Date.now() }), {
    expirationTtl: 86400  // 24 小时
  });
  
  return jsonOk({ token });
}