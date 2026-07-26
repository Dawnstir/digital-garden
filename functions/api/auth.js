/**
 * 认证 API - Step 1 占位版
 * POST /api/auth -> 验证 PIN（后续实现）
 */
export async function onRequestPost() {
  return new Response(JSON.stringify({ token: 'placeholder' }), {
    headers: { 'Content-Type': 'application/json' }
  });
}