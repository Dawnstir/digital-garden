/**
 * api.js
 * 所有后端通信集中在这里。
 * 前端其他文件只调用这里的函数，不直接写 fetch。
 */

const API_BASE = '/api';

// GET 请求封装
async function get(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

// POST 请求封装（自动带认证 token）
async function post(path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('admin_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json();
}

// === 单词 API ===
export async function getTodayWords() {
  return get('/words');
}

export async function saveWords(count) {
  return post('/words', { count });
}

// === 日记 API ===
export async function getDiaries(limit = 20) {
  return get(`/diaries?limit=${limit}`);
}

export async function saveDiary(title, content) {
  return post('/diaries', { title, content });
}

// === 认证 API ===
export async function login(pin) {
  const data = await post('/auth', { pin });
  if (data.token) {
    localStorage.setItem('admin_token', data.token);
  }
  return data;
}

export function logout() {
  localStorage.removeItem('admin_token');
}

export function isLoggedIn() {
  return !!localStorage.getItem('admin_token');
}