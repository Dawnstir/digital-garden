/**
 * app.js
 * 主页逻辑：加载今日单词 + 日记流。
 */

import { getTodayWords, getDiaries } from './api.js';

// 格式化日期：2026-07-27 → 2026年7月27日
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

// 加载今日单词
async function loadWords() {
  try {
    const data = await getTodayWords();
    document.getElementById('word-count').textContent = data.count || 0;
    document.getElementById('word-streak').textContent = 
      `连续打卡 ${data.streak || 0} 天`;
  } catch (e) {
    console.error('加载单词失败:', e);
  }
}

// 加载日记列表
async function loadDiaries() {
  try {
    const diaries = await getDiaries();
    const container = document.getElementById('diary-list');
    
    if (!diaries || diaries.length === 0) {
      container.innerHTML = '<div class="diary-item"><div class="excerpt">还没有日记，去后台写一篇吧 ✍️</div></div>';
      return;
    }
    
    container.innerHTML = diaries.map(d => `
      <div class="diary-item">
        <div class="date">${formatDate(d.created_at)}</div>
        <div class="title">${d.title || '无标题'}</div>
        <div class="excerpt">${d.content.substring(0, 120)}${d.content.length > 120 ? '...' : ''}</div>
      </div>
    `).join('');
  } catch (e) {
    console.error('加载日记失败:', e);
  }
}

// 页面加载时执行
document.addEventListener('DOMContentLoaded', () => {
  loadWords();
  loadDiaries();
});