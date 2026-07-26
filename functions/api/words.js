/**
 * 单词 API - Step 1 占位版
 * GET  /api/words     -> 返回今日单词数据
 * POST /api/words     -> 保存今日单词（后续实现）
 */
export async function onRequestGet(context) {
  const { env } = context;
  
  // 查询最新一天的记录
  const { results } = await env.DB.prepare(
    "SELECT * FROM daily_words ORDER BY date DESC LIMIT 1"
  ).all();
  
  // 如果没数据，返回默认值，避免前端报错
  const data = results[0] || { date: '', count: 0, streak: 0 };
  
  return new Response(JSON.stringify(data), {
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

export async function onRequestPost(context) {
  // Step 4 再实现写入
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}