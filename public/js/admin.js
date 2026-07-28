/**
 * admin.js
 * PIN 登录 + 自动加载今日数据 + 智能更新（今天已有则覆盖）。
 */

import { getTodayWords, getDiariesByDate, login, saveWords, saveDiary, updateDiary, isLoggedIn } from './api.js';

const $ = id => document.getElementById(id);

function showEditor() {
  $('login-section').style.display = 'none';
  $('editor-section').style.display = 'block';
  loadTodayData();
}

function showLogin() {
  $('login-section').style.display = 'block';
  $('editor-section').style.display = 'none';
}

function showToast(msg = '发布成功 🌿') {
  const toast = $('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

function getTodayStr() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// === 加载今日已有数据 ===
async function loadTodayData() {
  try {
    const words = await getTodayWords();
    if (words.count > 0) {
      $('word-input').value = words.count;
    }
    
    const diaries = await getDiariesByDate(getTodayStr());
    if (diaries && diaries.length > 0) {
      const d = diaries[0];
      $('title-input').value = d.title || '';
      $('diary-input').value = d.content || '';
      $('char-count').textContent = d.content.length;
      diaryInput.dataset.todayId = d.id;
    } else {
      delete diaryInput.dataset.todayId;
    }
  } catch (e) {
    console.error('加载今日数据失败:', e);
  }
}

// === PIN 登录 ===
$('login-btn').addEventListener('click', async () => {
  const pin = $('pin-input').value.trim();
  if (!pin) return alert('请输入 PIN 码');
  
  try {
    await login(pin);
    showEditor();
    $('pin-input').value = '';
  } catch (e) {
    alert('PIN 码错误');
  }
});

// === 字数统计 ===
const diaryInput = $('diary-input');
const charCount = $('char-count');

diaryInput.addEventListener('input', () => {
  charCount.textContent = diaryInput.value.length;
});

// === 发布（今天已有则更新，无则新建）===
$('publish-btn').addEventListener('click', async () => {
  const title = $('title-input').value.trim();
  const count = parseInt($('word-input').value, 10) || 0;
  const content = diaryInput.value.trim();
  const todayDiaryId = diaryInput.dataset.todayId;

  if (!content && count === 0) {
    return alert('至少填写一项内容');
  }

  const btn = $('publish-btn');
  btn.disabled = true;
  btn.textContent = '发布中...';

  try {
    const promises = [];
    if (count > 0) promises.push(saveWords(count));
    
    if (content) {
      if (todayDiaryId) {
        promises.push(updateDiary(todayDiaryId, title, content));
      } else {
        promises.push(saveDiary(title, content));
      }
    }
    
    await Promise.all(promises);
    showToast();
    
    // 清空表单
    $('title-input').value = '';
    $('word-input').value = '';
    diaryInput.value = '';
    charCount.textContent = '0';
    
    // 静默刷新 todayId，不填充表单
    const diaries = await getDiariesByDate(getTodayStr());
    if (diaries && diaries.length > 0) {
      diaryInput.dataset.todayId = diaries[0].id;
    }
  } catch (e) {
    alert('发布失败: ' + e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = '发布';
  }
});

// === 初始化 ===
if (isLoggedIn()) {
  showEditor();
} else {
  showLogin();
}