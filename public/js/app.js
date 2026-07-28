/**
 * app.js
 * 路由主控 + 仪表盘（今日单词 + 日历热力图 + 日记流）
 * 扩展方式：在 routes 对象新增 '/xxx': renderXxx，导航栏自动显示
 */

import { getTodayWords, getDiaries } from './api.js';
import { marked } from './lib/marked.esm.js';

// ==================== 路由系统 ====================
const routes = {
  '/': renderHome,
  // 未来扩展：'/lab': renderLab, '/reading': renderReading ...
};

function initRouter() {
  const nav = document.getElementById('nav-links');
  Object.keys(routes).forEach(path => {
    if (path === '/') return;
    const a = document.createElement('a');
    a.href = `#${path}`;
    a.textContent = path.replace('/', '').charAt(0).toUpperCase() + path.slice(2);
    a.dataset.path = path;
    nav.appendChild(a);
  });

  window.addEventListener('hashchange', () => render(location.hash.slice(1) || '/'));
  render(location.hash.slice(1) || '/');
}

function render(path) {
  const app = document.getElementById('app');
  const fn = routes[path] || routes['/'];
  app.innerHTML = fn();

  // 高亮当前导航
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('active', a.dataset.path === path);
  });

  // 执行页面初始化（如果页面返回 {html, init}）
  if (fn.init) fn.init();
}

// ==================== 工具函数 ====================
const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2, '0');

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function getGroupLabel(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yest = new Date(today.getTime() - 86400000);
  const item = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (item.getTime() === today.getTime()) return 'Today';
  if (item.getTime() === yest.getTime()) return 'Yesterday';
  return formatDate(dateStr);
}

// ==================== 日历热力图 ====================
let calYear, calMonth;

async function renderCalendar() {
  const now = new Date();
  calYear = now.getFullYear();
  calMonth = now.getMonth() + 1;
  await loadCalendar();
}

async function loadCalendar() {
  const res = await fetch(`/api/words/calendar?year=${calYear}&month=${calMonth}`);
  const data = await res.json(); // { "2026-07-01": 50, ... }

  const grid = $('calendar-grid');
  const title = $('calendar-title');
  if (!grid) return;

  title.textContent = `${calYear}年 ${calMonth}月`;

  const firstDay = new Date(calYear, calMonth - 1, 1).getDay(); // 0=周日
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  const todayStr = `${nowY()}-${pad(nowM())}-${pad(nowD())}`;

  const dayLabels = ['日', '一', '二', '三', '四', '五', '六'];
  let html = dayLabels.map(d => `<div class="calendar-day-label">${d}</div>`).join('');

  // 空白填充
  for (let i = 0; i < firstDay; i++) {
    html += '<div class="calendar-day" style="visibility:hidden;"></div>';
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear}-${pad(calMonth)}-${pad(d)}`;
    const count = data[dateStr] || 0;
    const level = count === 0 ? 0 : count < 20 ? 1 : count < 50 ? 2 : count < 100 ? 3 : 4;
    const isToday = dateStr === todayStr;
    html += `<div class="calendar-day day-l${level} ${isToday ? 'today' : ''}" title="${dateStr}: ${count} words">${d}</div>`;
  }

  grid.innerHTML = html;
}

function nowY() { return new Date().getFullYear(); }
function nowM() { return new Date().getMonth() + 1; }
function nowD() { return new Date().getDate(); }

function prevMonth() {
  calMonth--;
  if (calMonth < 1) { calMonth = 12; calYear--; }
  loadCalendar();
}

function nextMonth() {
  calMonth++;
  if (calMonth > 12) { calMonth = 1; calYear++; }
  loadCalendar();
}

// ==================== 日记流 ====================
async function loadDiaries() {
  const container = $('diary-list');
  if (!container) return;

  try {
    const diaries = await getDiaries();
    if (!diaries || diaries.length === 0) {
      container.innerHTML = '<div class="diary-item"><div class="excerpt">还没有日记，去后台写一篇吧 ✍️</div></div>';
      return;
    }

    const groups = {};
    diaries.forEach(d => {
      const label = getGroupLabel(d.created_at);
      if (!groups[label]) groups[label] = [];
      groups[label].push(d);
    });

    container.innerHTML = '';
    Object.entries(groups).forEach(([label, items]) => {
      const g = document.createElement('div');
      g.className = 'diary-group';
      g.innerHTML = `<div class="diary-group-label">${label}</div>`;
      items.forEach(d => {
        const item = document.createElement('div');
        item.className = 'diary-item';
        item.innerHTML = `
          <div class="date">${formatDate(d.created_at)}</div>
          <div class="title">${d.title || formatDate(d.created_at)}</div>
          <div class="excerpt">${d.content.substring(0, 120)}${d.content.length > 120 ? '...' : ''}</div>
        `;
        item.addEventListener('click', () => openModal(d));
        g.appendChild(item);
      });
      container.appendChild(g);
    });
  } catch (e) {
    console.error(e);
  }
}

// ==================== 弹窗 ====================
function openModal(diary) {
  $('modal-date').textContent = formatDate(diary.created_at);
  $('modal-title').textContent = diary.title || formatDate(diary.created_at);
  $('modal-body').innerHTML = marked.parse(diary.content || '');
  $('diary-modal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  $('diary-modal').classList.remove('active');
  document.body.style.overflow = '';
}

// ==================== 今日单词 ====================
async function loadWords() {
  try {
    const data = await getTodayWords();
    const num = $('word-count');
    const streak = $('word-streak');
    if (num) num.textContent = data.count || 0;
    if (streak) streak.textContent = `连续打卡 ${data.streak || 0} 天`;
  } catch (e) {
    console.error(e);
  }
}

// ==================== 主页渲染 ====================
function renderHome() {
  return `
    <div class="dashboard">
      <!-- 今日单词 -->
      <section class="word-card">
        <div class="label">Today</div>
        <div class="number" id="word-count">0</div>
        <div class="unit">words</div>
        <div class="streak" id="word-streak">连续打卡 0 天</div>
      </section>

      <!-- 日历热力图 -->
      <section class="calendar-section">
        <div class="calendar-header">
          <h3 id="calendar-title">日历</h3>
          <div class="calendar-nav">
            <button onclick="window._calPrev()">◀</button>
            <button onclick="window._calNext()">▶</button>
          </div>
        </div>
        <div class="calendar-grid" id="calendar-grid">
          <div style="padding:40px;text-align:center;color:var(--color-text-muted);">加载中...</div>
        </div>
        <div class="calendar-legend">
          <span>少</span>
          <div class="legend-box day-l0"></div>
          <div class="legend-box day-l1"></div>
          <div class="legend-box day-l2"></div>
          <div class="legend-box day-l3"></div>
          <div class="legend-box day-l4"></div>
          <span>多</span>
        </div>
      </section>

      <!-- 日记流 -->
      <section class="diary-section">
        <h3>Recent Entries</h3>
        <div id="diary-list">
          <div class="diary-item"><div class="excerpt" style="color:var(--color-text-muted);">加载中...</div></div>
        </div>
      </section>
    </div>
  `;
}

renderHome.init = function() {
  loadWords();
  renderCalendar();
  loadDiaries();
};

// 暴露给 HTML 内联事件
window._calPrev = prevMonth;
window._calNext = nextMonth;

// ==================== 启动 ====================
document.addEventListener('DOMContentLoaded', () => {
  $('modal-close').addEventListener('click', closeModal);
  $('diary-modal').addEventListener('click', e => {
    if (e.target === $('diary-modal')) closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && $('diary-modal').classList.contains('active')) closeModal();
  });
  initRouter();
});