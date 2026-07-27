/**
 * admin.js
 * 后台逻辑：PIN 登录 + 单词/日记发布（新增标题字段+实时字数统计）
 */

import { login, saveWords, saveDiary, isLoggedIn, logout } from './api.js';

// 切换登录/编辑器界面
function showEditor() {
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('editor-section').style.display = 'block';
}

function showLogin() {
  document.getElementById('login-section').style.display = 'block';
  document.getElementById('editor-section').style.display = 'none';
}

// PIN 登录
document.getElementById('login-btn').addEventListener('click', async () => {
  const pin = document.getElementById('pin-input').value;
  if (!pin) return alert('请输入 PIN 码');
  
  try {
    await login(pin);
    showEditor();
  } catch (e) {
    alert('PIN 码错误');
  }
});

// 回车快捷登录
document.getElementById('pin-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('login-btn').click();
});

// 实时字数统计绑定
const diaryInput = document.getElementById('diary-input');
const charCountDom = document.getElementById('char-count');
diaryInput.addEventListener('input', () => {
  charCountDom.textContent = diaryInput.value.length;
});

// 发布按钮
document.getElementById('publish-btn').addEventListener('click', async () => {
  const count = parseInt(document.getElementById('word-input').value) || 0;
  const title = document.getElementById('title-input').value.trim();
  const content = diaryInput.value.trim();
  
  if (!content && count === 0) {
    return alert('至少填写一项');
  }
  
  try {
    // 并行保存
    const promises = [];
    if (count > 0) promises.push(saveWords(count));
    if (content) promises.push(saveDiary(title, content));// 传入填写的标题
    
    await Promise.all(promises);
    
    alert('发布成功！');
    // 清空所有表单
    document.getElementById('word-input').value = '';
    document.getElementById('title-input').value = '';
    diaryInput.value = '';
    charCountDom.textContent = '0';
  } catch (e) {
    alert('发布失败: ' + e.message);
  }
});

// 页面加载：已登录直接进编辑器
if (isLoggedIn()) {
  showEditor();
} else {
  showLogin();
}
