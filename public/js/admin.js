/**
 * admin.js
 * 后台逻辑：PIN 登录 + 标题/单词/日记发布 + 字数统计 + 成功反馈。
 */

import { login, saveWords, saveDiary, isLoggedIn, logout } from './api.js';

const $ = id => document.getElementById(id);

// === 界面切换 ===
function showEditor() {
  $('login-section').style.display = 'none';
  $('editor-section').style.display = 'block';
}

function showLogin() {
  $('login-section').style.display = 'block';
  $('editor-section').style.display = 'none';
}

// === 成功提示 ===
function showToast(msg = '发布成功 🌿') {
  const toast = $('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
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

// === 发布 ===
$('publish-btn').addEventListener('click', async () => {
  const title = $('title-input').value.trim();
  const count = parseInt($('word-input').value, 10) || 0;
  const content = diaryInput.value.trim();

  if (!content && count === 0) {
    return alert('至少填写一项内容');
  }

  const btn = $('publish-btn');
  btn.disabled = true;
  btn.textContent = '发布中...';

  try {
    const promises = [];
    if (count > 0) promises.push(saveWords(count));
    if (content) promises.push(saveDiary(title, content));
    
    await Promise.all(promises);
    
    showToast();
    
    // 清空表单
    $('title-input').value = '';
    $('word-input').value = '';
    diaryInput.value = '';
    charCount.textContent = '0';
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