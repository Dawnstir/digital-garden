/**
 * words.js
 * GET  /api/words?date=YYYY-MM-DD  -> 查任意日期（默认今天）
 * POST /api/words                  -> 保存今日单词（自动处理 streak）
 */

import { verifyToken, jsonError, jsonOk, getTodayYesterday } from './_utils.js';

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const date = url.searchParams.get('date');
  const { today } = getTodayYesterday();
  
  const targetDate = date || today;
  
  const { results } = await env.DB.prepare(
    "SELECT * FROM daily_words WHERE date = ?"
  ).bind(targetDate).all();
  
  const data = results[0] || { date: targetDate, count: 0, streak: 0 };
  return jsonOk(data);
}

export async function onRequestPost(context) {
  if (!await verifyToken(context)) {
    return jsonError('未授权', 401);
  }
  
  const { env, request } = context;
  const body = await request.json().catch(() => ({}));
  const count = parseInt(body.count, 10) || 0;
  
  const { today, yesterday } = getTodayYesterday();
  
  // 查今天是否已有记录
  const { results: todayRes } = await env.DB.prepare(
    "SELECT streak FROM daily_words WHERE date = ?"
  ).bind(today).all();
  
  let streak;
  if (todayRes.length > 0 && todayRes[0].streak > 0) {
    // 今天已有有效记录，保持 streak（用户只是修改数量）
    streak = todayRes[0].streak;
  } else {
    // 今天没有或 count=0，查昨天决定 streak
    const { results: yestRes } = await env.DB.prepare(
      "SELECT streak FROM daily_words WHERE date = ? AND count > 0"
    ).bind(yesterday).all();
    streak = yestRes.length > 0 ? (yestRes[0].streak + 1) : (count > 0 ? 1 : 0);
  }
  
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