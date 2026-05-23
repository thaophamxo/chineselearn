/* ═══════════════════════════════════════════════════════════════
   CHINESE LEARNING TRACKER — app.js
   Vanilla JS SPA: LocalStorage, Hanzii API, HanziWriter, Flashcards
   ═══════════════════════════════════════════════════════════════ */

'use strict';

// ─────────────────────────────────────────────
// CONSTANTS & STATE
// ─────────────────────────────────────────────
const LS_KEY = 'chineseTracker_v1';

let state = {
  words: [],          // Array of word objects
  flashIndex: 0,      // Current flashcard index
  flashOrder: [],     // Shuffled/ordered indices for flashcard
  isFlipped: false,
  currentDetailId: null,
  previewWriter: null,
  modalWriter: null,
};

// ─────────────────────────────────────────────
// STORAGE
// ─────────────────────────────────────────────
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) state.words = JSON.parse(raw);
  } catch (e) {
    state.words = [];
  }
}

function saveToStorage() {
  localStorage.setItem(LS_KEY, JSON.stringify(state.words));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ─────────────────────────────────────────────
// CHALK DUST PARTICLE CANVAS
// ─────────────────────────────────────────────
function initChalkCanvas() {
  const canvas = document.getElementById('chalkCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() { this.reset(true); }
    reset(init = false) {
      this.x    = Math.random() * canvas.width;
      this.y    = init ? Math.random() * canvas.height : -10;
      this.size = Math.random() * 1.8 + 0.3;
      this.vx   = (Math.random() - 0.5) * 0.3;
      this.vy   = Math.random() * 0.4 + 0.1;
      this.alpha= Math.random() * 0.35 + 0.05;
      this.life = Math.random() * 200 + 100;
      this.age  = init ? Math.random() * this.life : 0;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.age++;
      if (this.age > this.life || this.y > canvas.height + 10) this.reset();
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha * Math.sin((this.age / this.life) * Math.PI);
      ctx.fillStyle = '#f0ece4';
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, this.size, this.size * 0.5, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  for (let i = 0; i < 80; i++) particles.push(new Particle());

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
  }
  animate();
}

// ─────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────
let toastTimer = null;
function showToast(msg, type = 'info', duration = 3000) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `chalk-toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.className = 'chalk-toast hidden';
  }, duration);
}

// ─────────────────────────────────────────────
// TAB NAVIGATION
// ─────────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.chalk-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.chalk-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${tab}`).classList.add('active');

      if (tab === 'mylist') renderWordList();
      if (tab === 'flashcard') initFlashcard();
    });
  });
}

// ─────────────────────────────────────────────
// DASHBOARD STATS
// ─────────────────────────────────────────────
function updateStats() {
  const today = new Date().toDateString();
  const total = state.words.length;
  const todayCount = state.words.filter(w => new Date(w.addedAt).toDateString() === today).length;
  document.getElementById('totalCount').textContent = total;
  document.getElementById('todayCount').textContent = todayCount;
}

// ─────────────────────────────────────────────
// HANZII API FETCH
// ─────────────────────────────────────────────
const CORS_PROXIES = [
  'https://api.allorigins.win/get?url=',
  'https://corsproxy.io/?',
];

async function fetchHanzii(query) {
  const encodedQuery = encodeURIComponent(query.trim());
  const targetUrl = `https://hanzii.net/api/search/${encodedQuery}?type=word&page=1&lang=vi`;

  for (const proxy of CORS_PROXIES) {
    try {
      const url = proxy + (proxy.includes('allorigins') ? encodeURIComponent(targetUrl) : targetUrl);
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);

      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timer);

      if (!res.ok) continue;
      let json = await res.json();

      // allorigins wraps in {contents: "..."}
      if (json.contents) {
        try { json = JSON.parse(json.contents); } catch { continue; }
      }

      return parseHanziiResponse(json, query);
    } catch (e) {
      // Try next proxy
      continue;
    }
  }
  return null; // All proxies failed
}

function parseHanziiResponse(json, originalQuery) {
  try {
    // Hanzii response structure (may vary; we handle common shapes)
    const data = json?.data || json;
    const results = Array.isArray(data) ? data : (data?.result || data?.words || []);

    if (!results || results.length === 0) return null;

    const item = results[0];

    // Extract pinyin
    const pinyin = item?.pinyin
      || item?.pinyins?.[0]
      || item?.pronunciation
      || '';

    // Vietnamese meaning
    const meanings = item?.means || item?.meanings || item?.definitions || [];
    let meaning = '';
    let wordType = '其他';
    let hanViet = item?.hanviet || item?.han_viet || item?.sinovi || '';

    if (Array.isArray(meanings) && meanings.length > 0) {
      const first = meanings[0];
      if (typeof first === 'string') {
        meaning = first;
      } else if (first?.mean) {
        meaning = Array.isArray(first.mean) ? first.mean.join(', ') : first.mean;
        wordType = mapWordType(first?.kind || first?.type || '');
      } else if (first?.vi) {
        meaning = first.vi;
      }
    }

    const hanzi = item?.word || item?.hanzi || item?.simplified || originalQuery;

    return {
      hanzi:   hanzi.trim(),
      pinyin:  pinyin.trim(),
      meaning: meaning.trim() || '(Không tìm thấy nghĩa)',
      hanViet: hanViet.trim(),
      type:    wordType,
    };
  } catch (e) {
    return null;
  }
}

function mapWordType(raw) {
  if (!raw) return '其他';
  const r = raw.toLowerCase();
  if (r.includes('noun') || r.includes('名'))         return '名词';
  if (r.includes('verb') || r.includes('动'))         return '动词';
  if (r.includes('adj')  || r.includes('形'))         return '形容词';
  if (r.includes('adv')  || r.includes('副'))         return '副词';
  if (r.includes('prep') || r.includes('介'))         return '介词';
  if (r.includes('conj') || r.includes('连'))         return '连词';
  if (r.includes('num')  || r.includes('数'))         return '数词';
  if (r.includes('meas') || r.includes('量'))         return '量词';
  return '其他';
}

// ─────────────────────────────────────────────
// SEARCH / ADD WORD TAB
// ─────────────────────────────────────────────
let pendingWordData = null;

async function handleSearch() {
  const query = document.getElementById('searchInput').value.trim();
  if (!query) { showToast('Vui lòng nhập từ cần tra!', 'error'); return; }

  // Show loading
  document.getElementById('resultCard').classList.add('hidden');
  document.getElementById('searchLoading').classList.remove('hidden');

  // Clear old preview
  clearPreviewWriter();

  const result = await fetchHanzii(query);

  document.getElementById('searchLoading').classList.add('hidden');

  if (result) {
    pendingWordData = result;
    displayResult(result);
    initPreviewWriter(result.hanzi);
  } else {
    showToast('Không tìm thấy qua API. Vui lòng nhập thủ công.', 'error');
    openManualModal(query);
  }
}

function displayResult(data) {
  document.getElementById('resultHanzi').textContent  = data.hanzi   || '—';
  document.getElementById('resultPinyin').textContent  = data.pinyin  || '—';
  document.getElementById('resultMeaning').textContent = data.meaning || '—';
  document.getElementById('resultHanViet').textContent = data.hanViet || '—';
  document.getElementById('resultType').textContent    = data.type    || '—';
  document.getElementById('resultCard').classList.remove('hidden');
}

function addPendingToList() {
  if (!pendingWordData) return;
  addWordToList(pendingWordData);
  document.getElementById('resultCard').classList.add('hidden');
  document.getElementById('searchInput').value = '';
  pendingWordData = null;
}

function addWordToList(data) {
  // Check duplicate
  const exists = state.words.find(w => w.hanzi === data.hanzi);
  if (exists) {
    showToast(`"${data.hanzi}" đã có trong danh sách rồi!`, 'error');
    return;
  }
  const word = {
    id:      generateId(),
    hanzi:   data.hanzi,
    pinyin:  data.pinyin,
    meaning: data.meaning,
    hanViet: data.hanViet,
    type:    data.type,
    addedAt: new Date().toISOString(),
  };
  state.words.unshift(word);
  saveToStorage();
  updateStats();
  showToast(`✦ Đã thêm "${data.hanzi}" vào danh sách!`, 'success');
}

// ─────────────────────────────────────────────
// HANZI WRITER — PREVIEW (ADD TAB)
// ─────────────────────────────────────────────
function clearPreviewWriter() {
  const container = document.getElementById('strokePreviewWriter');
  container.innerHTML = '';
  state.previewWriter = null;
  document.getElementById('previewReplayBtn').classList.add('hidden');
}

function initPreviewWriter(char) {
  const firstChar = char.trim()[0];
  if (!firstChar) return;

  const container = document.getElementById('strokePreviewWriter');
  container.innerHTML = '';

  try {
    state.previewWriter = HanziWriter.create('strokePreviewWriter', firstChar, {
      width:             180,
      height:            180,
      padding:           16,
      strokeColor:       '#f0ece4',
      radicalColor:      '#7ec8e3',
      outlineColor:      'rgba(240,236,228,0.12)',
      drawingColor:      '#f5e642',
      highlightColor:    '#f4a0b5',
      showOutline:       true,
      strokeAnimationSpeed: 0.8,
      delayBetweenStrokes: 200,
      renderer:          'svg',
    });
    state.previewWriter.animateCharacter();
    document.getElementById('previewReplayBtn').classList.remove('hidden');
  } catch (e) {
    container.innerHTML = `<div class="chalk-text opacity-30 text-center text-sm mt-8">Không có dữ liệu nét bút<br>cho ký tự này</div>`;
  }
}

// ─────────────────────────────────────────────
// WORD LIST RENDERING
// ─────────────────────────────────────────────
function renderWordList() {
  const grid     = document.getElementById('wordListGrid');
  const empty    = document.getElementById('emptyState');
  const typeFilter = document.getElementById('filterType').value;
  const dateFilter = document.getElementById('filterDate').value;
  const searchFilter = document.getElementById('filterSearch').value.trim().toLowerCase();

  let words = [...state.words];

  // Filter by type
  if (typeFilter) words = words.filter(w => w.type === typeFilter);

  // Filter by search
  if (searchFilter) {
    words = words.filter(w =>
      w.hanzi.includes(searchFilter) ||
      w.pinyin.toLowerCase().includes(searchFilter) ||
      w.meaning.toLowerCase().includes(searchFilter) ||
      (w.hanViet || '').toLowerCase().includes(searchFilter)
    );
  }

  // Filter by date
  const today = new Date();
  if (dateFilter === 'today') {
    words = words.filter(w => new Date(w.addedAt).toDateString() === today.toDateString());
  } else if (dateFilter === 'week') {
    const weekAgo = new Date(today - 7 * 86400000);
    words = words.filter(w => new Date(w.addedAt) >= weekAgo);
  }

  // Sort
  if (dateFilter === 'oldest') {
    words.sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt));
  } else if (dateFilter !== 'today' && dateFilter !== 'week') {
    words.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
  }

  grid.innerHTML = '';

  if (words.length === 0) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  const todayStr = today.toDateString();

  words.forEach(word => {
    const isToday = new Date(word.addedAt).toDateString() === todayStr;
    const card = document.createElement('div');
    card.className = `word-card${isToday ? ' today' : ''}`;
    card.innerHTML = `
      <div class="word-card-type-badge">${word.type}</div>
      <div class="word-card-hanzi">${word.hanzi}</div>
      <div class="word-card-pinyin">${word.pinyin}</div>
      <div class="word-card-meaning">${word.meaning}</div>
      <div class="word-card-date">${formatDate(word.addedAt)}</div>
    `;
    card.addEventListener('click', () => openWordDetail(word.id));
    grid.appendChild(card);
  });
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' });
}

// ─────────────────────────────────────────────
// WORD DETAIL MODAL
// ─────────────────────────────────────────────
function openWordDetail(id) {
  const word = state.words.find(w => w.id === id);
  if (!word) return;

  state.currentDetailId = id;

  document.getElementById('modalHanzi').textContent   = word.hanzi;
  document.getElementById('modalPinyin').textContent   = word.pinyin;
  document.getElementById('modalMeaning').textContent  = word.meaning;
  document.getElementById('modalHanViet').textContent  = word.hanViet || '—';
  document.getElementById('modalType').textContent     = word.type;
  document.getElementById('modalDate').textContent     = formatDate(word.addedAt);

  document.getElementById('wordDetailModal').classList.remove('hidden');

  // Init HanziWriter in modal
  initModalWriter(word.hanzi[0]);
}

function initModalWriter(char) {
  const container = document.getElementById('modalStrokeWriter');
  container.innerHTML = '';
  state.modalWriter = null;

  if (!char) return;

  try {
    state.modalWriter = HanziWriter.create('modalStrokeWriter', char, {
      width:            200,
      height:           200,
      padding:          18,
      strokeColor:      '#f0ece4',
      radicalColor:     '#7ec8e3',
      outlineColor:     'rgba(240,236,228,0.1)',
      highlightColor:   '#f4a0b5',
      drawingColor:     '#f5e642',
      showOutline:      true,
      strokeAnimationSpeed: 0.9,
      delayBetweenStrokes: 250,
      renderer:         'svg',
    });
    state.modalWriter.animateCharacter();
  } catch (e) {
    container.innerHTML = `<div class="chalk-text opacity-30 text-center text-sm mt-8">Không có dữ liệu<br>nét bút</div>`;
  }
}

function closeWordDetail() {
  document.getElementById('wordDetailModal').classList.add('hidden');
  state.currentDetailId = null;
  state.modalWriter = null;
}

function deleteCurrentWord() {
  if (!state.currentDetailId) return;
  const word = state.words.find(w => w.id === state.currentDetailId);
  if (!word) return;

  if (!confirm(`Xóa từ "${word.hanzi}" khỏi danh sách?`)) return;
  state.words = state.words.filter(w => w.id !== state.currentDetailId);
  saveToStorage();
  updateStats();
  closeWordDetail();
  renderWordList();
  showToast(`Đã xóa "${word.hanzi}"`, 'info');
}

// ─────────────────────────────────────────────
// MANUAL ENTRY MODAL
// ─────────────────────────────────────────────
function openManualModal(prefill = '') {
  document.getElementById('manualHanzi').value   = prefill;
  document.getElementById('manualPinyin').value  = '';
  document.getElementById('manualMeaning').value = '';
  document.getElementById('manualHanViet').value = '';
  document.getElementById('manualType').value    = '其他';
  document.getElementById('manualModal').classList.remove('hidden');
  setTimeout(() => document.getElementById('manualHanzi').focus(), 100);
}

function closeManualModal() {
  document.getElementById('manualModal').classList.add('hidden');
}

function saveManualWord() {
  const hanzi   = document.getElementById('manualHanzi').value.trim();
  const pinyin  = document.getElementById('manualPinyin').value.trim();
  const meaning = document.getElementById('manualMeaning').value.trim();
  const hanViet = document.getElementById('manualHanViet').value.trim();
  const type    = document.getElementById('manualType').value;

  if (!hanzi || !pinyin || !meaning) {
    showToast('Vui lòng điền Chữ Hán, Pinyin và Nghĩa!', 'error');
    return;
  }

  addWordToList({ hanzi, pinyin, meaning, hanViet, type });
  closeManualModal();

  // Preview writer
  clearPreviewWriter();
  initPreviewWriter(hanzi);

  // Show result
  displayResult({ hanzi, pinyin, meaning, hanViet, type });
  pendingWordData = null;
}

// ─────────────────────────────────────────────
// FLASHCARD SYSTEM
// ─────────────────────────────────────────────
function initFlashcard() {
  if (state.words.length === 0) {
    document.getElementById('flashcardEmpty').classList.remove('hidden');
    document.getElementById('flashcardUI').classList.add('hidden');
    return;
  }

  document.getElementById('flashcardEmpty').classList.add('hidden');
  document.getElementById('flashcardUI').classList.remove('hidden');

  // Build order
  state.flashOrder = state.words.map((_, i) => i);
  state.flashIndex = 0;
  state.isFlipped  = false;

  renderFlashcard();
}

function renderFlashcard() {
  const idx  = state.flashIndex;
  const order= state.flashOrder;
  const word = state.words[order[idx]];

  if (!word) return;

  // Reset flip
  state.isFlipped = false;
  document.getElementById('flashcard').classList.remove('flipped');

  // Front
  document.getElementById('flashFrontHanzi').textContent  = word.hanzi;

  // Back
  document.getElementById('flashBackPinyin').textContent  = word.pinyin  || '—';
  document.getElementById('flashBackMeaning').textContent = word.meaning || '—';
  document.getElementById('flashBackHanViet').textContent = word.hanViet || '—';
  document.getElementById('flashBackType').textContent    = word.type    || '—';

  // Counter & progress
  const total = order.length;
  document.getElementById('flashCounter').textContent = `Thẻ ${idx + 1} / ${total}`;
  document.getElementById('flashProgress').style.width = `${((idx + 1) / total) * 100}%`;
}

function flipCard() {
  state.isFlipped = !state.isFlipped;
  document.getElementById('flashcard').classList.toggle('flipped', state.isFlipped);
}

function nextCard() {
  if (state.flashIndex < state.flashOrder.length - 1) {
    state.flashIndex++;
  } else {
    state.flashIndex = 0;
    showToast('🎉 Đã ôn hết! Bắt đầu lại từ đầu.', 'success');
  }
  renderFlashcard();
}

function prevCard() {
  if (state.flashIndex > 0) {
    state.flashIndex--;
    renderFlashcard();
  }
}

function shuffleCards() {
  for (let i = state.flashOrder.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [state.flashOrder[i], state.flashOrder[j]] = [state.flashOrder[j], state.flashOrder[i]];
  }
  state.flashIndex = 0;
  renderFlashcard();
  showToast('🔀 Đã xáo trộn thẻ!', 'info');
}

// ─────────────────────────────────────────────
// EXPORT / IMPORT
// ─────────────────────────────────────────────
function exportData() {
  const data = {
    version:   1,
    exportedAt: new Date().toISOString(),
    words:     state.words,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `blackboard_backup_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('📦 Đã xuất dữ liệu!', 'success');
}

function importData(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const json = JSON.parse(e.target.result);
      const words = json.words || json; // Support both formats
      if (!Array.isArray(words)) throw new Error('Invalid format');

      // Merge: add only words not already present
      let added = 0;
      words.forEach(w => {
        if (!state.words.find(existing => existing.hanzi === w.hanzi)) {
          state.words.unshift(w);
          added++;
        }
      });

      saveToStorage();
      updateStats();
      renderWordList();
      showToast(`✦ Đã nhập ${added} từ mới!`, 'success');
    } catch (err) {
      showToast('❌ File không hợp lệ!', 'error');
    }
  };
  reader.readAsText(file);
}

// ─────────────────────────────────────────────
// FILTERS (My List tab)
// ─────────────────────────────────────────────
function initFilters() {
  document.getElementById('filterType').addEventListener('change', renderWordList);
  document.getElementById('filterDate').addEventListener('change', renderWordList);
  document.getElementById('filterSearch').addEventListener('input', renderWordList);
}

// ─────────────────────────────────────────────
// EVENT LISTENERS
// ─────────────────────────────────────────────
function initEvents() {
  // Search
  document.getElementById('searchBtn').addEventListener('click', handleSearch);
  document.getElementById('searchInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleSearch();
  });

  // Add to list
  document.getElementById('addToListBtn').addEventListener('click', addPendingToList);

  // Edit result manually
  document.getElementById('editResultBtn').addEventListener('click', () => {
    const data = pendingWordData;
    if (data) {
      openManualModal(data.hanzi);
      // Pre-fill
      setTimeout(() => {
        document.getElementById('manualPinyin').value  = data.pinyin  || '';
        document.getElementById('manualMeaning').value = data.meaning || '';
        document.getElementById('manualHanViet').value = data.hanViet || '';
        document.getElementById('manualType').value    = data.type    || '其他';
      }, 50);
    }
  });

  // Preview replay
  document.getElementById('previewReplayBtn').addEventListener('click', () => {
    if (state.previewWriter) state.previewWriter.animateCharacter();
  });

  // Word detail modal
  document.getElementById('modalCloseBtn').addEventListener('click', closeWordDetail);
  document.getElementById('modalDeleteBtn').addEventListener('click', deleteCurrentWord);
  document.getElementById('modalReplayBtn').addEventListener('click', () => {
    if (state.modalWriter) state.modalWriter.animateCharacter();
  });
  document.getElementById('wordDetailModal').addEventListener('click', e => {
    if (e.target === document.getElementById('wordDetailModal')) closeWordDetail();
  });

  // Manual modal
  document.getElementById('manualCloseBtn').addEventListener('click', closeManualModal);
  document.getElementById('manualCancelBtn').addEventListener('click', closeManualModal);
  document.getElementById('manualSaveBtn').addEventListener('click', saveManualWord);
  document.getElementById('manualModal').addEventListener('click', e => {
    if (e.target === document.getElementById('manualModal')) closeManualModal();
  });

  // Flashcard
  document.getElementById('flashcardScene').addEventListener('click', flipCard);
  document.getElementById('flashFlipBtn').addEventListener('click', flipCard);
  document.getElementById('flashNextBtn').addEventListener('click', nextCard);
  document.getElementById('flashPrevBtn').addEventListener('click', prevCard);
  document.getElementById('flashShuffleBtn').addEventListener('click', shuffleCards);

  // Keyboard shortcuts for flashcard
  document.addEventListener('keydown', e => {
    const activeTab = document.querySelector('.tab-panel.active')?.id;
    if (activeTab !== 'tab-flashcard') return;
    if (e.key === 'ArrowRight' || e.key === 'l') nextCard();
    if (e.key === 'ArrowLeft'  || e.key === 'h') prevCard();
    if (e.key === ' ' || e.key === 'f') { e.preventDefault(); flipCard(); }
  });

  // Export / Import
  document.getElementById('exportBtn').addEventListener('click', exportData);
  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', e => {
    importData(e.target.files[0]);
    e.target.value = '';
  });
}

// ─────────────────────────────────────────────
// KEYBOARD SHORTCUT HINT (optional polish)
// ─────────────────────────────────────────────
function addChalkMarkings() {
  // Subtle chalk line decoration on the board
  const board = document.querySelector('.chalk-board');
  if (!board) return;
  // Already handled via CSS ::before pseudo-element
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
function init() {
  loadFromStorage();
  initChalkCanvas();
  initTabs();
  initFilters();
  initEvents();
  updateStats();
  addChalkMarkings();

  // Default: render word list on load so stats are correct
  // (but don't render grid until that tab is active for performance)

  console.log(
    '%c黑板 Chinese Tracker%c loaded ✦',
    'color:#f0ece4;background:#1e2d24;font-size:16px;padding:4px 8px;font-family:serif',
    'color:#f5e642;font-size:14px'
  );
}

document.addEventListener('DOMContentLoaded', init);
