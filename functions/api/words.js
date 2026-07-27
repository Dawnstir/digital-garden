/**
 * words.js
 * GET  /api/words     -> 返回今日单词（含连续打卡）
 * POST /api/words     -> 保存今日单词数量（需登录）
 */

import { corsHeaders, verifyToken, jsonError, jsonOk, getTodayYesterday } from './_utils.js';

export async function onRequestGet(context) {
  const { env } = context;
  const { today } = getTodayYesterday();
  
  // 查今天记录，没有则返回默认值
  const { results } = await env.DB.prepare(
    "SELECT * FROM daily_words WHERE date = ?"
  ).bind(today).all();
  
  const data = results[0] || { date: today, count: 0, streak: 0 };
  return jsonOk(data);
}

export async function onRequestPost(context) {
  // 验证登录
  if (!await verifyToken(context)) {
    return jsonError('未授权', 401);
  }
  
  const { env, request } = context;
  const body = await request.json().catch(() => ({}));
  const count = parseInt(body.count, 10) || 0;
  
  const { today, yesterday } = getTodayYesterday();
  
  // 查昨天记录，决定连续天数
  const { results: yestRes } = await env.DB.prepare(
    "SELECT streak FROM daily_words WHERE date = ? AND count > 0"
  ).bind(yesterday).all();
  
  const streak = yestRes.length > 0 ? (yestRes[0].streak + 1) : 1;
  
  // 插入或更新今天记录
  await env.DB.prepare(`
    INSERT INTO daily_words (date, count, streak, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(date) DO UPDATE SET
      count = excluded.count,
      streak = excluded.streak,
      updated_at = CURRENT_TIMESTAMP
  `).bind(today, count, streak).run();
  
  return jsonOk({ date: today, count, streak });
}