/**
 * diaries/[id].js
 * PUT /api/diaries/123  -> 更新指定日记（用于后台覆盖今日日记）
 */

import { verifyToken, jsonError, jsonOk } from '../../_utils.js';

export async function onRequestPut(context) {
  if (!await verifyToken(context)) {
    return jsonError('未授权', 401);
  }
  
  const id = context.params.id;
  const { env, request } = context;
  const body = await request.json().catch(() => ({}));
  const { title = '', content = '' } = body;
  
  if (!content.trim()) {
    return jsonError('日记内容不能为空');
  }
  
  await env.DB.prepare(
    "UPDATE diaries SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(title, content, id).run();
  
  return jsonOk({ id, title, content });
}