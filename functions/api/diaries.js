/**
 * diaries.js
 * GET  /api/diaries?limit=N&date=YYYY-MM-DD  -> 支持按日期筛选
 * POST /api/diaries                         -> 新建日记
 */

import { verifyToken, jsonError, jsonOk } from './_utils.js';

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit'), 10) || 20;
  const date = url.searchParams.get('date');  // 可选：按创建日期筛选
  
  let sql = "SELECT * FROM diaries";
  const params = [];
  
  if (date) {
    sql += " WHERE date(created_at) = ?";
    params.push(date);
  }
  
  sql += " ORDER BY created_at DESC LIMIT ?";
  params.push(limit);
  
  const { results } = await env.DB.prepare(sql).bind(...params).all();
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