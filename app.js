const state = { radius: 500, score: Number(localStorage.getItem('tuxun-score') || 0), startedAt: null, located: false, demoMode: true, target: null };

const targets = [
  { direction: '东北方向', clue: '街角附近有一面醒目的橙色墙面，留意低处的编号。' },
  { direction: '西南方向', clue: '沿着有树荫的人行道寻找，附近会听见持续的车流声。' },
  { direction: '东南方向', clue: '目标靠近一处开阔路口，留意蓝绿色的公共设施。' }
];

const $ = (selector) => document.querySelector(selector);
const screens = [...document.querySelectorAll('.screen')];
function show(name) { screens.forEach(screen => screen.classList.toggle('active', screen.dataset.screen === name)); window.scrollTo(0, 0); }
function toast(message) { const node = $('#toast'); node.textContent = message; node.classList.add('show'); setTimeout(() => node.classList.remove('show'), 2300); }
function formatRadius(value) { return value >= 1000 ? `${value / 1000}km` : `${value}m`; }
function updateScore() { $('#scoreClue').textContent = String(state.score).padStart(3, '0'); $('#totalScore').textContent = state.score; }
function updateProfile() { const score = $('#profileScore'); if (score) score.textContent = state.score; }
function selectRadius(button) { document.querySelectorAll('[data-radius]').forEach(item => item.classList.remove('selected')); button.classList.add('selected'); state.radius = Number(button.dataset.radius); }
function getLocation() {
  if (!navigator.geolocation) { toast('当前浏览器不支持定位，已启用演示模式'); state.located = true; $('#locationText').textContent = '演示出发点 · 城市中心'; return; }
  $('#locationText').textContent = '正在获取当前位置…';
  navigator.geolocation.getCurrentPosition(() => { state.located = true; $('#locationText').textContent = '当前位置已锁定'; $('#locationHint').textContent = '目标将围绕当前位置随机生成'; toast('定位成功，探索范围已准备'); }, () => { state.located = true; $('#locationText').textContent = '演示出发点 · 城市中心'; $('#locationHint').textContent = '定位未授权，当前使用演示模式'; toast('未获得定位权限，继续使用演示模式'); }, { enableHighAccuracy: true, timeout: 6000 });
}
function generateTarget() { state.target = targets[Math.floor(Math.random() * targets.length)]; state.startedAt = Date.now(); $('#directionText').textContent = state.target.direction; $('#clueText').textContent = state.target.clue; $('#distanceHint').textContent = formatRadius(state.radius); updateScore(); show('clue'); }
function updateField() { $('#fieldDirection').textContent = state.target?.direction.replace('方向', '') || '东北'; $('#fieldDistance').textContent = state.demoMode ? '约 80m' : '定位中'; $('#fieldRadius').textContent = formatRadius(state.radius); }
function checkIn() { const elapsed = Math.max(1, Math.round((Date.now() - state.startedAt) / 60000)); state.score += 100; localStorage.setItem('tuxun-score', state.score); $('#earnedScore').textContent = '100'; $('#timeUsed').textContent = `${elapsed} min`; $('#resultRadius').textContent = formatRadius(state.radius); updateScore(); updateProfile(); show('result'); }

document.addEventListener('click', event => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'start') show('setup');
  if (action === 'profile') { updateProfile(); show('profile'); }
  if (action === 'modes') show('modes');
  if (action === 'locked') toast('这个模式正在制作中，先来一局经典图寻吧');
  if (action === 'about') show('about');
  if (action === 'home') show('home');
  if (action === 'locate') getLocation();
  if (action === 'generate') { if (!state.located) getLocation(); generateTarget(); }
  if (action === 'explore') { updateField(); show('explore'); }
  if (action === 'clue') show('clue');
  if (action === 'checkin') { if (state.demoMode) toast('演示模式：已模拟进入目标范围'); setTimeout(checkIn, state.demoMode ? 450 : 0); }
  if (action === 'newgame') show('setup');
  if (action === 'leaderboard') toast('探索记录将在 Supabase 接入后开放');
});
document.querySelectorAll('[data-radius]').forEach(button => button.addEventListener('click', () => selectRadius(button)));
updateScore();
