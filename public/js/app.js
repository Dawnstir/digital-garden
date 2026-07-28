/**
 * app.js
 * 主页：今日单词 + 日记分组（Today/Yesterday/日期）+ 弹窗详情 + 骨架屏。
 */

import { getTodayWords, getDiaries } from './api.js';
import { marked } from './lib/marked.esm.js';

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function getGroupLabel(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yest = new Date(today.getTime() - 86400000);
  const itemDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  
  if (itemDate.getTime() === today.getTime()) return 'Today';
  if (itemDate.getTime() === yest.getTime()) return 'Yesterday';
  return formatDate(dateStr);
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

// === 弹窗 ===
const modal = document.getElementById('diary-modal');
const modalDate = document.getElementById('modal-date');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');

function openModal(diary) {
  modalDate.textContent = formatDate(diary.created_at);
  modalTitle.textContent = diary.title || formatDate(diary.created_at);
  modalBody.innerHTML = marked.parse(diary.content || '');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.classList.contains('active')) {
    closeModal();
  }
});

// === 骨架屏 ===
function showSkeleton() {
  document.getElementById('diary-list').innerHTML = `
    <div class="diary-group">
      <div class="diary-group-label skeleton skeleton-date" style="width:50px;"></div>
      <div class="diary-item" style="pointer-events:none;">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text" style="width:75%;"></div>
      </div>
    </div>
  `;
}

// === 加载日记（按日期分组）===
async function loadDiaries() {
  const container = document.getElementById('diary-list');
  showSkeleton();
  
  try {
    const diaries = await getDiaries();
    
    if (!diaries || diaries.length === 0) {
      container.innerHTML = '<div class="diary-item"><div class="excerpt">还没有日记，去后台写一篇吧 ✍️</div></div>';
      return;
    }
    
    // 按日期分组
    const groups = {};
    diaries.forEach(d => {
      const label = getGroupLabel(d.created_at);
      if (!groups[label]) groups[label] = [];
      groups[label].push(d);
    });
    
    // 渲染分组
    container.innerHTML = '';
    Object.entries(groups).forEach(([label, items]) => {
      const groupEl = document.createElement('div');
      groupEl.className = 'diary-group';
      
      const labelEl = document.createElement('div');
      labelEl.className = 'diary-group-label';
      labelEl.textContent = label;
      groupEl.appendChild(labelEl);
      
      items.forEach(d => {
        const item = document.createElement('div');
        item.className = 'diary-item';
        item.innerHTML = `
          <div class="title">${d.title || formatDate(d.created_at)}</div>
          <div class="excerpt">${d.content.substring(0, 120)}${d.content.length > 120 ? '...' : ''}</div>
        `;
        item.addEventListener('click', () => openModal(d));
        groupEl.appendChild(item);
      });
      
      container.appendChild(groupEl);
    });
  } catch (e) {
    console.error('加载日记失败:', e);
    container.innerHTML = '<div class="diary-item"><div class="excerpt">加载失败，请刷新重试</div></div>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadWords();
  loadDiaries();
});