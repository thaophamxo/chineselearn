/**
 * SỔ TAY HÁN NGỮ — Chalkboard Edition
 * app.js · Vietnamese Chinese Learner Tracker
 * ─────────────────────────────────────────────
 * Vanilla JS SPA — no framework dependencies.
 * Persists to localStorage. Works fully offline.
 */

'use strict';

/* ══════════════════════════════════════════════
   1. BUILT-IN OFFLINE DICTIONARY
   (prevents CORS / sandbox issues)
══════════════════════════════════════════════ */
const LOCAL_DICT = {
  "学习": { pinyin: "xuéxí",      hanviet: "học tập",     translation: "học tập, nghiên cứu, học hỏi",       type: "Động từ",  notes: "我努力学习。(Tôi nỗ lực học tập.)" },
  "你好": { pinyin: "nǐ hǎo",     hanviet: "nhỉ hảo",     translation: "xin chào, chào bạn",                 type: "Cụm từ",   notes: "你好，很高兴认识你。(Xin chào, rất vui được gặp bạn.)" },
  "谢谢": { pinyin: "xièxie",     hanviet: "tạ tạ",       translation: "cảm ơn",                             type: "Cụm từ",   notes: "谢谢你帮助我。(Cảm ơn bạn đã giúp tôi.)" },
  "中国": { pinyin: "zhōngguó",   hanviet: "trung quốc",  translation: "Trung Quốc",                         type: "Danh từ",  notes: "我去中国旅游。(Tôi đi du lịch Trung Quốc.)" },
  "越南": { pinyin: "yuènán",     hanviet: "việt nam",    translation: "Việt Nam",                           type: "Danh từ",  notes: "我是越南人。(Tôi là người Việt Nam.)" },
  "老师": { pinyin: "lǎoshī",     hanviet: "lão sư",      translation: "giáo viên, thầy cô",                 type: "Danh từ",  notes: "王老师是我们的汉语老师。" },
  "学生": { pinyin: "xuéshēng",   hanviet: "học sinh",    translation: "học sinh, sinh viên",                type: "Danh từ",  notes: "他是一个好学生。(Cậu ấy là học sinh tốt.)" },
  "咖啡": { pinyin: "kāfēi",      hanviet: "ca phê",      translation: "cà phê",                             type: "Danh từ",  notes: "我喜欢喝咖啡。(Tôi thích uống cà phê.)" },
  "苹果": { pinyin: "píngguǒ",    hanviet: "bình quả",    translation: "quả táo; hãng Apple",               type: "Danh từ",  notes: "苹果很好吃。(Táo rất ngon.)" },
  "喜欢": { pinyin: "xǐhuan",     hanviet: "hỷ hoan",     translation: "thích, yêu thích",                  type: "Động từ",  notes: "我喜欢学习汉语。(Tôi thích học tiếng Trung.)" },
  "看书": { pinyin: "kànshū",     hanviet: "khán thư",    translation: "đọc sách",                          type: "Động từ",  notes: "晚上我经常看书。(Tối tôi thường đọc sách.)" },
  "高兴": { pinyin: "gāoxìng",    hanviet: "cao hứng",    translation: "vui mừng, phấn khởi",               type: "Tính từ",  notes: "今天我很高兴。(Hôm nay tôi rất vui.)" },
  "努力": { pinyin: "nǔlì",       hanviet: "nỗ lực",      translation: "nỗ lực, cố gắng",                   type: "Tính từ",  notes: "大家要努力工作。(Mọi người hãy cố gắng.)" },
  "时间": { pinyin: "shíjiān",    hanviet: "thời gian",   translation: "thời gian, giờ giấc",               type: "Danh từ",  notes: "我没有时间。(Tôi không có thời gian.)" },
  "工作": { pinyin: "gōngzuò",    hanviet: "công tác",    translation: "làm việc, công việc",               type: "Động từ",  notes: "他在银行工作。(Anh ấy làm ở ngân hàng.)" },
  "今天": { pinyin: "jīntiān",    hanviet: "kim thiên",   translation: "hôm nay",                           type: "Danh từ",  notes: "今天天气很好。(Hôm nay thời tiết đẹp.)" },
  "明天": { pinyin: "míngtiān",   hanviet: "minh thiên",  translation: "ngày mai",                          type: "Danh từ",  notes: "明天我们去北京。(Ngày mai chúng tôi đi Bắc Kinh.)" },
  "汉语": { pinyin: "hànyǔ",      hanviet: "hán ngữ",     translation: "tiếng Trung, tiếng Hán",            type: "Danh từ",  notes: "汉语不难学习。(Tiếng Trung không khó học.)" },
  "朋友": { pinyin: "péngyou",    hanviet: "bằng hữu",    translation: "bạn bè",                            type: "Danh từ",  notes: "他是我的好朋友。(Cậu ấy là bạn tốt của tôi.)" },
  "吃饭": { pinyin: "chīfàn",     hanviet: "cật phạn",    translation: "ăn cơm, ăn bữa",                   type: "Động từ",  notes: "我们去吃饭吧。(Chúng ta đi ăn cơm thôi.)" },
  "水": {   pinyin: "shuǐ",       hanviet: "thủy",        translation: "nước (uống, nước sông…)",           type: "Danh từ",  notes: "请给我一杯水。(Vui lòng cho tôi một ly nước.)" },
  "大学": { pinyin: "dàxué",      hanviet: "đại học",     translation: "đại học, trường đại học",           type: "Danh từ",  notes: "他在大学学习。(Anh ấy học ở đại học.)" },
  "好": {   pinyin: "hǎo",        hanviet: "hảo",         translation: "tốt, hay, giỏi",                   type: "Tính từ",  notes: "你好！(Bạn tốt! / Xin chào!)" },
};

/* ══════════════════════════════════════════════
   2. DEFAULT SEED DATA
══════════════════════════════════════════════ */
const DEFAULT_WORDS = [
  { id:"d1", hanzi:"学习", pinyin:"xuéxí",   hanviet:"học tập",   translation:"học tập, học hỏi",         type:"Động từ", dateAdded: todayStr(), status:"review",   notes:"我努力学习汉语。(Tôi nỗ lực học tiếng Trung.)" },
  { id:"d2", hanzi:"你好", pinyin:"nǐ hǎo",  hanviet:"nhỉ hảo",   translation:"xin chào",                 type:"Cụm từ",  dateAdded: todayStr(), status:"mastered", notes:"Câu chào hỏi thông thường." },
  { id:"d3", hanzi:"老师", pinyin:"lǎoshī",  hanviet:"lão sư",    translation:"thầy giáo, cô giáo",       type:"Danh từ", dateAdded: yesterday(), status:"review",   notes:"Người dạy học." },
  { id:"d4", hanzi:"越南", pinyin:"yuènán",  hanviet:"việt nam",  translation:"quốc gia Việt Nam",        type:"Danh từ", dateAdded: yesterday(), status:"mastered", notes:"Tôi yêu quê hương Việt Nam!" },
  { id:"d5", hanzi:"喜欢", pinyin:"xǐhuan",  hanviet:"hỷ hoan",   translation:"thích, yêu chuộng",        type:"Động từ", dateAdded: yesterday(), status:"review",   notes:"我喜欢学习汉语。" },
];

/* ══════════════════════════════════════════════
   3. DATE HELPERS
══════════════════════════════════════════════ */
function todayStr() {
  return new Date().toISOString().split('T')[0];
}
function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

/* ══════════════════════════════════════════════
   4. GLOBAL STATE
══════════════════════════════════════════════ */
let words = [];
let hanziWriterInstance = null;
let currentFlashcardIndex = 0;
let isCardFlipped = false;

const STORAGE_KEY = 'chalkboard_hanzinote_v2';

/* ══════════════════════════════════════════════
   5. INITIALISATION
══════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  initStorage();
  renderWordList();
  updateStats();
  setupInitialWriter();
  setupFlashcardDeck();
});

function initStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    words = raw ? JSON.parse(raw) : [...DEFAULT_WORDS];
  } catch {
    words = [...DEFAULT_WORDS];
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
  updateStats();
}

/* ══════════════════════════════════════════════
   6. STATS
══════════════════════════════════════════════ */
function updateStats() {
  const total    = words.length;
  const mastered = words.filter(w => w.status === 'mastered').length;
  const review   = words.filter(w => w.status === 'review').length;
  const today    = words.filter(w => w.dateAdded === todayStr()).length;
  const pct      = total > 0 ? Math.round((mastered / total) * 100) : 0;

  setText('stat-total',        total);
  setText('stat-today',        today);
  setText('stat-mastered',     mastered);
  setText('stat-review',       review);
  setText('stat-mastered-pct', `${pct}% tỉ lệ hoàn thành`);
  setText('flashcard-count',   `Chưa thuộc: ${review} từ`);
}

/* ══════════════════════════════════════════════
   7. TOAST / CHALK ALERT
══════════════════════════════════════════════ */
let _alertTimer = null;

function showChalkAlert(msg) {
  const el = document.getElementById('chalk-alert');
  document.getElementById('alert-message').textContent = msg;
  el.classList.add('visible');

  clearTimeout(_alertTimer);
  _alertTimer = setTimeout(() => el.classList.remove('visible'), 3200);
}

/* ══════════════════════════════════════════════
   8. FORM HELPERS
══════════════════════════════════════════════ */
function getField(id) {
  return document.getElementById(id)?.value.trim() ?? '';
}
function setField(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val ?? '';
}
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function clearForm() {
  ['input-hanzi','input-pinyin','input-hanviet','input-translation','input-notes'].forEach(id => setField(id, ''));
  setField('input-type',   'Danh từ');
  setField('input-status', 'review');
}

/* ══════════════════════════════════════════════
   9. AUTO FETCH (offline dict → API fallback)
══════════════════════════════════════════════ */
async function handleAutoFetch() {
  const query = getField('input-hanzi');
  if (!query) { showChalkAlert('⚠️ Hãy nhập chữ Hán trước khi tra cứu!'); return; }

  const btn = document.getElementById('btn-search');
  btn.textContent = '⏳ Đang tra…';
  btn.disabled = true;

  // 1) Check offline dict
  if (LOCAL_DICT[query]) {
    const d = LOCAL_DICT[query];
    setField('input-pinyin',      d.pinyin);
    setField('input-hanviet',     d.hanviet);
    setField('input-translation', d.translation);
    setField('input-type',        d.type);
    setField('input-notes',       d.notes);
    showChalkAlert('✨ Tìm thấy trong từ điển tích hợp!');
    loadCharacterToWriter(query[0]);
    resetBtn();
    return;
  }

  // 2) Try external API with timeout
  try {
    const url = `https://hanzi-api.vercel.app/api/lookup?word=${encodeURIComponent(query)}`;
    const res  = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = await res.json();
      if (data?.pinyin) {
        setField('input-pinyin',      data.pinyin);
        setField('input-hanviet',     data.hanviet ?? '');
        setField('input-translation', data.definition ?? '');
        showChalkAlert('✨ Tìm thấy kết quả từ API!');
      } else { throw new Error('No result'); }
    } else { throw new Error('API error'); }
  } catch {
    // 3) Heuristic fallback
    setField('input-hanviet', approximateHanViet(query));
    showChalkAlert('✏️ Mạng bận / Từ mới — hãy nhập nghĩa & Pinyin thủ công!');
  } finally {
    resetBtn();
    if (query.length > 0) loadCharacterToWriter(query[0]);
    document.getElementById('input-translation')?.focus();
  }
}

function resetBtn() {
  const btn = document.getElementById('btn-search');
  btn.innerHTML = '🔍 Tìm';
  btn.disabled  = false;
}

/** Very basic heuristic Hán-Việt approximation */
function approximateHanViet(str) {
  const map = {
    "学":"học","习":"tập","老":"lão","师":"sư","国":"quốc","越":"việt","南":"nam",
    "谢":"tạ","你":"nhĩ","好":"hảo","中":"trung","语":"ngữ","大":"đại","学":"học",
    "人":"nhân","时":"thời","间":"gian","工":"công","作":"tác","朋":"bằng","友":"hữu"
  };
  return [...str].map(c => map[c] ?? '...').join(' ');
}

/* ══════════════════════════════════════════════
   10. ADD / EDIT WORD
══════════════════════════════════════════════ */
function handleAddWord() {
  const hanzi       = getField('input-hanzi');
  const pinyin      = getField('input-pinyin');
  const hanviet     = getField('input-hanviet');
  const translation = getField('input-translation');
  const type        = getField('input-type');
  const status      = getField('input-status');
  const notes       = getField('input-notes');

  if (!hanzi || !pinyin || !translation) {
    showChalkAlert('⚠️ Hãy điền đầy đủ Chữ Hán, Pinyin và Nghĩa dịch!');
    return;
  }

  const newWord = {
    id:        `w_${Date.now()}`,
    hanzi, pinyin,
    hanviet:   hanviet  || 'Chưa có',
    translation, type,
    dateAdded: todayStr(),
    status,
    notes:     notes || 'Không có ghi chú'
  };

  words.unshift(newWord);
  saveState();
  renderWordList();
  clearForm();
  showChalkAlert('🎨 Đã ghi thêm 1 từ lên bảng!');
  setupFlashcardDeck();
  loadCharacterToWriter(hanzi[0]);
}

/* ══════════════════════════════════════════════
   11. RENDER WORD TABLE
══════════════════════════════════════════════ */
function renderWordList() {
  const tbody       = document.getElementById('word-list-tbody');
  const q           = document.getElementById('search-query')?.value.toLowerCase().trim() ?? '';
  const filterType  = document.getElementById('filter-type')?.value  ?? 'all';
  const filterStat  = document.getElementById('filter-status')?.value ?? 'all';

  const filtered = words.filter(w => {
    const matchQ = !q
      || w.hanzi.toLowerCase().includes(q)
      || w.hanviet.toLowerCase().includes(q)
      || w.pinyin.toLowerCase().includes(q)
      || w.translation.toLowerCase().includes(q);
    const matchT = filterType === 'all' || w.type === filterType;
    const matchS = filterStat === 'all' || w.status === filterStat;
    return matchQ && matchT && matchS;
  });

  if (!filtered.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="p-6 text-center text-gray-500 italic text-sm">
          Chưa tìm thấy từ vựng nào phù hợp với bộ lọc.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(w => {
    const pill = w.status === 'mastered'
      ? `<span class="pill pill-mastered">Thuộc làu</span>`
      : `<span class="pill pill-review">Cần ôn</span>`;

    // Escape for inline onclick
    const safeId = w.id.replace(/'/g, "\\'");
    const safeHanzi = w.hanzi[0].replace(/'/g, "\\'");

    return `
      <tr>
        <td class="word-table-td" style="padding:0.6rem 0.85rem">
          <span class="hanzi-cell chinese-font chalk-white"
                onclick="loadCharacterToWriter('${safeHanzi}')"
                title="Xem nét viết chữ này">
            ${w.hanzi}
          </span>
        </td>
        <td style="padding:0.6rem 0.85rem">
          <div class="text-yellow-200 text-sm font-semibold">${w.pinyin}</div>
          <div class="text-xs text-teal-200">Hán Việt: ${w.hanviet}</div>
        </td>
        <td style="padding:0.6rem 0.85rem; max-width:14rem;">
          <div class="text-gray-200 text-xs truncate-2">${w.translation}</div>
          <div class="text-gray-500 text-xs italic mt-0.5 truncate">${w.notes}</div>
        </td>
        <td style="padding:0.6rem 0.85rem">
          <span class="chalk-orange chalk-font text-xs block mb-1">${w.type}</span>
          ${pill}
        </td>
        <td style="padding:0.6rem 0.85rem">
          <div class="action-group">
            <button class="action-btn" title="Sửa từ"           onclick="editWord('${safeId}')">✏️</button>
            <button class="action-btn" title="Đổi trạng thái"   onclick="toggleWordStatus('${safeId}')">🔄</button>
            <button class="action-btn" title="Xóa từ khỏi bảng" onclick="deleteWord('${safeId}', this)">🗑️</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

/* ══════════════════════════════════════════════
   12. WORD CRUD OPERATIONS
══════════════════════════════════════════════ */
function toggleWordStatus(id) {
  const w = words.find(x => x.id === id);
  if (!w) return;
  w.status = w.status === 'mastered' ? 'review' : 'mastered';
  saveState();
  renderWordList();
  showChalkAlert(`🔄 "${w.hanzi}" → ${w.status === 'mastered' ? 'Đã thuộc' : 'Cần ôn tập'}`);
  setupFlashcardDeck();
}

function editWord(id) {
  const w = words.find(x => x.id === id);
  if (!w) return;

  setField('input-hanzi',       w.hanzi);
  setField('input-pinyin',      w.pinyin);
  setField('input-hanviet',     w.hanviet);
  setField('input-translation', w.translation);
  setField('input-type',        w.type);
  setField('input-status',      w.status);
  setField('input-notes',       w.notes);

  // Remove from list so re-save replaces it
  words = words.filter(x => x.id !== id);
  saveState();
  renderWordList();
  showChalkAlert('📝 Đã nạp từ vào khung chỉnh sửa!');
  document.getElementById('input-hanzi')?.focus();
}

function deleteWord(id, el) {
  const tr = el.closest('tr');
  tr?.classList.add('erasing');
  setTimeout(() => {
    words = words.filter(w => w.id !== id);
    saveState();
    renderWordList();
    showChalkAlert('🧹 Đã xóa từ vựng khỏi bảng đen!');
    setupFlashcardDeck();
  }, 700);
}

function resetToDefaults() {
  if (!confirm('Bạn có chắc muốn đặt lại toàn bộ từ vựng về mặc định? Dữ liệu tự tạo sẽ bị xóa.')) return;
  words = [...DEFAULT_WORDS];
  saveState();
  renderWordList();
  showChalkAlert('🔄 Đã khôi phục dữ liệu mặc định!');
  setupInitialWriter();
  setupFlashcardDeck();
}

/* ══════════════════════════════════════════════
   13. IMPORT / EXPORT JSON
══════════════════════════════════════════════ */
function exportData() {
  const blob = new Blob([JSON.stringify(words, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), {
    href: url,
    download: `hanzi_notes_${todayStr()}.json`
  });
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showChalkAlert('⬇️ Đã xuất dữ liệu thành công!');
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) throw new Error('Bad format');
      words = imported;
      saveState();
      renderWordList();
      setupFlashcardDeck();
      showChalkAlert(`⬆️ Đã nhập ${imported.length} từ thành công!`);
    } catch {
      showChalkAlert('❌ File JSON không hợp lệ. Vui lòng kiểm tra lại!');
    }
  };
  reader.readAsText(file);
  // Clear input so same file can be re-imported
  event.target.value = '';
}

/* ══════════════════════════════════════════════
   14. HANZI WRITER
══════════════════════════════════════════════ */
function setupInitialWriter() {
  const char = words.length > 0 ? words[0].hanzi[0] : '学';
  loadCharacterToWriter(char);
}

function loadCharacterToWriter(char) {
  const container = document.getElementById('hanzi-writer-container');
  if (!container) return;

  // Clear previous instance
  container.innerHTML = '';
  setText('writer-char-label', `Đang hiển thị: ${char}`);
  setText('quiz-message', '');

  try {
    hanziWriterInstance = HanziWriter.create('hanzi-writer-container', char, {
      width:                  145,
      height:                 145,
      padding:                6,
      strokeColor:            '#fef08a',
      radicalColor:           '#fbcfe8',
      outlineColor:           'rgba(255,255,255,0.12)',
      drawingColor:           '#ccfbf1',
      showOutline:            true,
      delayBetweenStrokes:    380,
      strokeAnimationSpeed:   1.2,
    });
  } catch (e) {
    container.innerHTML = `
      <div class="text-center p-2">
        <p class="chinese-font text-6xl chalk-white">${char}</p>
        <p class="text-xs text-gray-500 mt-2">Dịch vụ ngoại tuyến</p>
      </div>`;
    console.warn('HanziWriter fallback:', e);
  }
}

function playStroke() {
  if (hanziWriterInstance) hanziWriterInstance.animateCharacter();
}

function resetStroke() {
  if (!hanziWriterInstance) return;
  hanziWriterInstance.cancelQuietly();
  hanziWriterInstance.showOutline();
  setText('quiz-message', 'Đã làm sạch bảng vẽ!');
}

function quizStroke() {
  if (!hanziWriterInstance) return;
  setText('quiz-message', 'Dùng ngón tay / chuột vẽ lên bảng đen…');
  hanziWriterInstance.quiz({
    onMistake:      () => { setText('quiz-message', '❌ Nét vẽ chưa chuẩn! Thử lại nhé.'); },
    onCorrectStroke:() => { setText('quiz-message', '✅ Đúng nét rồi! Tiếp tục…'); },
    onComplete:     () => { setText('quiz-message', '🎉 Xuất sắc! Bạn đã viết đúng chữ này!'); },
  });
}

/* ══════════════════════════════════════════════
   15. FLASHCARD
══════════════════════════════════════════════ */
function setupFlashcardDeck() {
  const reviewWords = words.filter(w => w.status === 'review');

  if (reviewWords.length > 0) {
    currentFlashcardIndex = Math.floor(Math.random() * reviewWords.length);
    fillFlashcard(reviewWords[currentFlashcardIndex]);
  } else if (words.length > 0) {
    currentFlashcardIndex = Math.floor(Math.random() * words.length);
    fillFlashcard(words[currentFlashcardIndex]);
  } else {
    fillFlashcard({
      hanzi: '学', pinyin: 'xué', hanviet: 'học',
      translation: 'Học tập, tiếp thu kiến thức',
      notes: 'Hãy thêm từ mới ở bên trái nhé!'
    });
  }
}

function fillFlashcard(word) {
  isCardFlipped = false;
  document.getElementById('flashcard-inner')?.classList.remove('flashcard-flipped');

  setText('card-front-hanzi',    word.hanzi);
  setText('card-back-hanzi',     word.hanzi);
  setText('card-back-pinyin',    word.pinyin);
  setText('card-back-hanviet',   word.hanviet ?? '...');
  setText('card-back-translation', word.translation);
  setText('card-back-notes',     word.notes ?? 'Không có ghi chú thêm');
}

function toggleCardFlip() {
  isCardFlipped = !isCardFlipped;
  document.getElementById('flashcard-inner')?.classList.toggle('flashcard-flipped', isCardFlipped);
}

function markCardMastered(event) {
  event.stopPropagation();
  const reviewWords = words.filter(w => w.status === 'review');
  if (reviewWords.length > 0) {
    const target = reviewWords[currentFlashcardIndex % reviewWords.length];
    if (target) {
      const w = words.find(x => x.id === target.id);
      if (w) {
        w.status = 'mastered';
        saveState();
        renderWordList();
        showChalkAlert('👍 Đã chuyển sang: Đã thuộc làu!');
      }
    }
  } else {
    showChalkAlert('✨ Tất cả từ vựng đã được thông thuộc!');
  }
  setupFlashcardDeck();
}

function markCardReview(event) {
  event.stopPropagation();
  showChalkAlert('🔄 Từ này sẽ tiếp tục được ôn luyện!');
  setupFlashcardDeck();
}

function nextCard(event) {
  event.stopPropagation();
  setupFlashcardDeck();
}
