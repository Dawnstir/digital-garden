/**
 * 日记 API - Step 1 占位版
 * GET  /api/diaries   -> 返回最近 20 篇日记
 * POST /api/diaries   -> 发布日记（后续实现）
 */
export async function onRequestGet(context) {
  const { env } = context;
  
  const { results } = await env.DB.prepare(
    "SELECT * FROM diaries ORDER BY created_at DESC LIMIT 20"
  ).all();
  
  return new Response(JSON.stringify(results), {
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

export async function onRequestPost(context) {
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}