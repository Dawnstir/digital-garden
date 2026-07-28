/**
 * app.js
 * 主页逻辑：加载今日单词 + 日记流 + 弹窗详情。
 */

import { getTodayWords, getDiaries } from './api.js';
import { marked } from './lib/marked.esm.js';   // ESM 直接导入，不依赖 window

// 格式化日期
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

// === 弹窗 DOM 引用 ===
const modal = document.getElementById('diary-modal');
const modalDate = document.getElementById('modal-date');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');

// 打开弹窗
function openModal(diary) {
  modalDate.textContent = formatDate(diary.created_at);
  // 有标题显示标题，没标题显示日期
  modalTitle.textContent = diary.title || formatDate(diary.created_at);
  // ESM 导入的 marked，直接调用，无需轮询
  modalBody.innerHTML = marked.parse(diary.content || '');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// 关闭弹窗
function closeModal() {
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

// 关闭按钮
modalClose.addEventListener('click', closeModal);

// 点击遮罩关闭
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

// ESC 键关闭
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.classList.contains('active')) {
    closeModal();
  }
});

// 加载日记列表
async function loadDiaries() {
  try {
    const diaries = await getDiaries();
    const container = document.getElementById('diary-list');

    if (!diaries || diaries.length === 0) {
      container.innerHTML = '<div class="diary-item"><div class="excerpt">还没有日记，去后台写一篇吧 ✍️</div></div>';
      return;
    }

    container.innerHTML = '';
    diaries.forEach(d => {
      const item = document.createElement('div');
      item.className = 'diary-item';
      item.innerHTML = `
        <div class="date">${formatDate(d.created_at)}</div>
        <div class="title">${d.title || formatDate(d.created_at)}</div>
        <div class="excerpt">${d.content.substring(0, 120)}${d.content.length > 120 ? '...' : ''}</div>
      `;
      item.addEventListener('click', () => openModal(d));
      container.appendChild(item);
    });
  } catch (e) {
    console.error('加载日记失败:', e);
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  loadWords();
  loadDiaries();
});