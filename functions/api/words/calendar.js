/**
 * words/calendar.js
 * GET /api/words/calendar?year=2026&month=7
 * 返回整月单词记录：{"2026-07-01": 50, "2026-07-02": 0, ...}
 */

import { jsonOk } from '../../_utils.js';

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const y = url.searchParams.get('year') || new Date().getFullYear();
  const m = String(url.searchParams.get('month') || new Date().getMonth() + 1).padStart(2, '0');
  
  const { results } = await env.DB.prepare(
    "SELECT date, count FROM daily_words WHERE date LIKE ? ORDER BY date"
  ).bind(`${y}-${m}-%`).all();
  
  const map = {};
  (results || []).forEach(r => map[r.date] = r.count);
  return jsonOk(map);
}