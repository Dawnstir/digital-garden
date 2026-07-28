/**
 * api.js
 * 所有后端通信集中在这里。
 */

const API_BASE = '/api';

async function get(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

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

async function put(path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('admin_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status}`);
  return res.json();
}

// === 单词 API ===
export async function getTodayWords() {
  return get('/words');
}

export async function getWordsByDate(date) {
  return get(`/words?date=${date}`);
}

export async function saveWords(count) {
  return post('/words', { count });
}

// === 日记 API ===
export async function getDiaries(limit = 20) {
  return get(`/diaries?limit=${limit}`);
}

export async function getDiariesByDate(date) {
  return get(`/diaries?limit=1&date=${date}`);
}

export async function saveDiary(title, content) {
  return post('/diaries', { title, content });
}

export async function updateDiary(id, title, content) {
  return put(`/diaries/${id}`, { title, content });
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