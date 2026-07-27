/**
 * diaries.js
 * GET  /api/diaries?limit=N  -> 日记列表（时间倒序）
 * POST /api/diaries          -> 发布日记（需登录）
 */

import { corsHeaders, verifyToken, jsonError, jsonOk } from './_utils.js';

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit'), 10) || 20;
  
  const { results } = await env.DB.prepare(
    "SELECT * FROM diaries ORDER BY created_at DESC LIMIT ?"
  ).bind(limit).all();
  
  return jsonOk(results || []);
}

export async function onRequestPost(context) {
  if (!await verifyToken(context)) {
    return jsonError('未授权', 401);
  }
  
  const { env, request } = context;
  const body = await request.json().catch(() => ({}));
  const { title = '', content = '' } = body;
  
  if (!content.trim()) {
    return jsonError('日记内容不能为空');
  }
  
  const { meta } = await env.DB.prepare(
    "INSERT INTO diaries (title, content) VALUES (?, ?)"
  ).bind(title, content).run();
  
  return jsonOk({ id: meta.last_row_id, title, content });
}