// ==========================================
// ULTIMATE FABULOUS FEATURES SCRIPT - AFGHAN TURK EDITION
// ==========================================

let currentTab = 'dictionary';
let currentGrade = 'all';
let currentLetter = 'all';
let bookmarkedWords = JSON.parse(localStorage.getItem('bookmarks')) || [];

let customWords = JSON.parse(localStorage.getItem('customVocab')) || [];
if (typeof vocabularyData !== 'undefined') {
  vocabularyData.unshift(...customWords);
}

let flashcardList = [];
let currentFlashIndex = 0;
let flashcardMode = 'standard';
let selectedFlashGrade = 'all';

let quizConfig = { grade: 'all', difficulty: 'medium', questionCount: 10 };
let quizQuestions = [];
let currentQuizIdx = 0;
let quizScore = 0;
let userAnswersLog = [];

// Writing Exam State
let writeQuestions = [];
let currentWriteIdx = 0;
let writeScore = 0;

document.addEventListener('DOMContentLoaded', () => {
  initApp();
  checkDailyStreak();
});

function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'click') {
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.start(); osc.stop(ctx.currentTime + 0.04);
    } else if (type === 'correct') {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'wrong') {
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(150, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    }
  } catch(e) {}
}

function triggerConfetti() {
  for (let i = 0; i < 70; i++) {
    const conf = document.createElement('div');
    conf.className = 'confetti-piece';
    conf.style.left = Math.random() * 100 + 'vw';
    conf.style.backgroundColor = ['#16a34a', '#0066cc', '#f59e0b', '#dc2626', '#8b5cf6'][Math.floor(Math.random() * 5)];
    conf.style.animationDuration = (Math.random() * 2 + 1) + 's';
    document.body.appendChild(conf);
    setTimeout(() => conf.remove(), 3000);
  }
}

function checkDailyStreak() {
  const today = new Date().toDateString();
  let streakData = JSON.parse(localStorage.getItem('vocabStreak')) || { lastDate: '', count: 0 };
  if (streakData.lastDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (streakData.lastDate === yesterday) {
      streakData.count++;
    } else if (streakData.lastDate !== today) {
      streakData.count = 1;
    }
    streakData.lastDate = today;
    localStorage.setItem('vocabStreak', JSON.stringify(streakData));
  }
  return streakData.count;
}

function initApp() {
  const filterContainer = document.getElementById('filterContainer');
  const alphabetBar = document.getElementById('alphabetBar');
  const searchBox = document.getElementById('searchInput');

  if (filterContainer) filterContainer.style.display = 'flex';
  if (alphabetBar) alphabetBar.style.display = 'flex';
  if (searchBox) searchBox.style.display = 'block';

  setupTabs();
  setupDarkMode();
  setupWordOfTheDay();
  setupCustomizers();
  
  if (typeof vocabularyData !== 'undefined') {
    renderDictionary(vocabularyData);
  }

  if (searchBox) {
    searchBox.addEventListener('input', filterAndSearch);
  }
  
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      playSound('click');
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentGrade = this.getAttribute('data-grade');
      filterAndSearch();
    });
  });

  document.querySelectorAll('.alpha-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      playSound('click');
      document.querySelectorAll('.alpha-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentLetter = this.getAttribute('data-letter');
      filterAndSearch();
    });
  });
}

function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('click');
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.getAttribute('data-tab');
      
      const filterContainer = document.getElementById('filterContainer');
      const alphabetBar = document.getElementById('alphabetBar');
      const searchBox = document.getElementById('searchInput');
      
      document.removeEventListener('keydown', handleFlashcardKeyboard);
      stopMatchTimer();
      stopSpeedGameTimer();

      if (currentTab === 'dictionary') {
        filterContainer.style.display = 'flex';
        alphabetBar.style.display = 'flex';
        searchBox.style.display = 'block';
        filterAndSearch();
      } else if (currentTab === 'bookmarks') {
        filterContainer.style.display = 'none';
        alphabetBar.style.display = 'none';
        searchBox.style.display = 'none';
        renderBookmarks();
      } else if (currentTab === 'quiz') {
        filterContainer.style.display = 'none';
        alphabetBar.style.display = 'none';
        searchBox.style.display = 'none';
        startMultipleChoiceQuiz();
      } else if (currentTab === 'writeExam') {
        filterContainer.style.display = 'none';
        alphabetBar.style.display = 'none';
        searchBox.style.display = 'none';
        startWritingExam();
      } else if (currentTab === 'flashcards') {
        filterContainer.style.display = 'none';
        alphabetBar.style.display = 'none';
        searchBox.style.display = 'none';
        startFlashcards();
      } else if (currentTab === 'progress') {
        filterContainer.style.display = 'none';
        alphabetBar.style.display = 'none';
        searchBox.style.display = 'none';
        renderProgressDashboard();
      } else if (currentTab === 'random') {
        filterContainer.style.display = 'none';
        alphabetBar.style.display = 'none';
        searchBox.style.display = 'none';
        renderRandomWord();
      } else if (currentTab === 'match') {
        filterContainer.style.display = 'none';
        alphabetBar.style.display = 'none';
        searchBox.style.display = 'none';
        startMatchingGame();
      } else if (currentTab === 'speedgame') {
        filterContainer.style.display = 'none';
        alphabetBar.style.display = 'none';
        searchBox.style.display = 'none';
        startSpeedGame();
      } else if (currentTab === 'ai') {
        filterContainer.style.display = 'none';
        alphabetBar.style.display = 'none';
        searchBox.style.display = 'none';
        renderAiTutor();
      } else if (currentTab === 'custom') {
        filterContainer.style.display = 'none';
        alphabetBar.style.display = 'none';
        searchBox.style.display = 'none';
        renderCustomWordForm();
      }
    });
  });
}

function setupDarkMode() {
  const darkModeBtn = document.getElementById('darkModeToggle');
  const isDark = localStorage.getItem('darkMode') === 'true';
  if (isDark) {
    document.body.classList.add('dark-mode');
    darkModeBtn.textContent = '☀️ حالت روز';
  }

  darkModeBtn.addEventListener('click', () => {
    playSound('click');
    document.body.classList.toggle('dark-mode');
    const darkModeActive = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', darkModeActive);
    darkModeBtn.textContent = darkModeActive ? '☀️ حالت روز' : '🌙 حالت شب';
  });
}

function setupCustomizers() {
  const headerBanner = document.querySelector('.header-banner');
  if (!headerBanner) return;
  if (document.getElementById('fontSwitcherSelect')) return;

  const fontSelect = document.createElement('select');
  fontSelect.id = 'fontSwitcherSelect';
  fontSelect.className = 'icon-btn';
  fontSelect.style.cursor = 'pointer';
  fontSelect.innerHTML = `
    <option value="font-vazir">فونت وزیر</option>
    <option value="font-shabnam">فونت شبنم</option>
    <option value="font-sahel">فونت ساحل</option>
  `;
  const savedFont = localStorage.getItem('preferredFont') || 'font-vazir';
  document.body.classList.add(savedFont);
  fontSelect.value = savedFont;

  fontSelect.addEventListener('change', (e) => {
    playSound('click');
    document.body.classList.remove('font-vazir', 'font-shabnam', 'font-sahel');
    document.body.classList.add(e.target.value);
    localStorage.setItem('preferredFont', e.target.value);
  });

  const sizeSelect = document.createElement('select');
  sizeSelect.id = 'fontSizeSelect';
  sizeSelect.className = 'icon-btn';
  sizeSelect.style.cursor = 'pointer';
  sizeSelect.innerHTML = `
    <option value="size-small">اندازه: کوچک</option>
    <option value="size-medium" selected>اندازه: متوسط</option>
    <option value="size-large">اندازه: بزرگ</option>
  `;
  const savedSize = localStorage.getItem('preferredSize') || 'size-medium';
  document.body.classList.add(savedSize);
  sizeSelect.value = savedSize;

  sizeSelect.addEventListener('change', (e) => {
    playSound('click');
    document.body.classList.remove('size-small', 'size-medium', 'size-large');
    document.body.classList.add(e.target.value);
    localStorage.setItem('preferredSize', e.target.value);
  });

  const controlsWrapper = document.createElement('div');
  controlsWrapper.style.display = 'flex';
  controlsWrapper.style.gap = '8px';
  controlsWrapper.appendChild(fontSelect);
  controlsWrapper.appendChild(sizeSelect);

  const darkModeToggle = document.getElementById('darkModeToggle');
  if (darkModeToggle) {
    darkModeToggle.before(controlsWrapper);
  }
}

function setupWordOfTheDay() {
  const wotdContainer = document.getElementById('wordOfTheDay');
  if (typeof vocabularyData === 'undefined' || vocabularyData.length === 0) return;
  
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  const wotd = vocabularyData[dayOfYear % vocabularyData.length];
  
  const streakCount = checkDailyStreak();
  wotdContainer.innerHTML = `🌟 <strong>واژه روز:</strong> <span>${wotd.word}</span> - ${wotd.meaning} <span style="float: left; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 8px;">🔥 زنجیره: ${streakCount} روز</span>`;
}

function toggleBookmark(wordItem) {
  playSound('click');
  const index = bookmarkedWords.findIndex(item => item.word === wordItem.word);
  if (index > -1) {
    bookmarkedWords.splice(index, 1);
  } else {
    bookmarkedWords.push(wordItem);
  }
  localStorage.setItem('bookmarks', JSON.stringify(bookmarkedWords));
  
  if (currentTab === 'dictionary') filterAndSearch();
  else if (currentTab === 'bookmarks') renderBookmarks();
}

function renderBookmarks() {
  const listContainer = document.getElementById('wordList');
  const statsContainer = document.getElementById('stats');
  listContainer.innerHTML = '';
  statsContainer.textContent = `تعداد واژه‌های نشان‌شده: ${bookmarkedWords.length}`;

  if (bookmarkedWords.length === 0) {
    listContainer.innerHTML = '<div class="no-results">هیچ واژه‌ای ذخیره نشده است.</div>';
    return;
  }

  bookmarkedWords.forEach(item => {
    appendCard(item, listContainer, true, '');
  });
}

function highlightText(text, searchTerm) {
  if (!searchTerm) return text;
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

function renderDictionary(words, searchTerm = '') {
  const listContainer = document.getElementById('wordList');
  const statsContainer = document.getElementById('stats');
  listContainer.innerHTML = '';
  statsContainer.textContent = `تعداد واژه‌های یافته‌شده: ${words.length}`;

  if (words.length === 0) {
    listContainer.innerHTML = '<div class="no-results">هیچ لغتی یافت نشد.</div>';
    return;
  }

  words.forEach(item => {
    const isBookmarked = bookmarkedWords.some(b => b.word === item.word);
    appendCard(item, listContainer, isBookmarked, searchTerm);
  });
}

function appendCard(item, container, isBookmarked, searchTerm) {
  const card = document.createElement('div');
  card.className = 'word-card';
  
  const heartIcon = isBookmarked ? '❤️' : '🤍';
  const itemJson = JSON.stringify(item).replace(/'/g, "&apos;");

  const pos = item.pos || 'اسم/صفت';
  const example = item.example || `مثال ادبی: ${item.word} در متن درس به کار رفته است.`;

  const highlightedWord = highlightText(item.word, searchTerm);
  const highlightedMeaning = highlightText(item.meaning, searchTerm);

  card.innerHTML = `
    <div class="word-info">
      <div class="word-meta">
        <span class="pos-badge">${pos}</span>
        <span class="grade-badge">صنف ${item.grade}</span>
      </div>
      <h3>${highlightedWord}</h3>
      <p>${highlightedMeaning}</p>
      <span class="example-sentence">${example}</span>
    </div>
    <div class="card-actions">
      <button class="action-icon ${isBookmarked ? 'bookmarked' : ''}" title="نشان کردن" onclick='toggleBookmark(${itemJson})'>${heartIcon}</button>
    </div>
  `;
  container.appendChild(card);
}

function filterAndSearch() {
  const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();

  const filtered = vocabularyData.filter(item => {
    const matchesGrade = (currentGrade === 'all' || item.grade == currentGrade);
    const matchesLetter = (currentLetter === 'all' || item.word.startsWith(currentLetter));
    const matchesSearch = item.word.toLowerCase().includes(searchTerm) || 
                          item.meaning.toLowerCase().includes(searchTerm);
    return matchesGrade && matchesLetter && matchesSearch;
  });

  renderDictionary(filtered, searchTerm);
}

// ==========================================
// WRITING EXAM SECTION (NEW: TYPE THE MEANING)
// ==========================================
function startWritingExam() {
  const listContainer = document.getElementById('wordList');
  const statsContainer = document.getElementById('stats');
  statsContainer.textContent = 'امتحان کتبی (نوشتن معنی واژگان)';

  if (vocabularyData.length < 5) {
    listContainer.innerHTML = '<div class="no-results">واژگان کافی برای امتحان وجود ندارد.</div>';
    return;
  }

  const shuffled = [...vocabularyData].sort(() => 0.5 - Math.random());
  writeQuestions = shuffled.slice(0, 10);
  currentWriteIdx = 0;
  writeScore = 0;

  renderWritingQuestion();
}

function renderWritingQuestion() {
  const listContainer = document.getElementById('wordList');

  if (currentWriteIdx >= writeQuestions.length) {
    const percentage = Math.round((writeScore / writeQuestions.length) * 100);
    if (percentage >= 80) triggerConfetti();

    listContainer.innerHTML = `
      <div class="quiz-box">
        <h2>کارنامه امتحان کتبی</h2>
        <p style="font-size: 1.3rem; margin: 15px 0;">نمره شما: <strong>${writeScore} از ${writeQuestions.length}</strong> (${percentage}%)</p>
        <button class="icon-btn" onclick="startWritingExam()" style="padding: 12px 25px; background: var(--primary); color: white; font-weight: bold;">شروع مجدد امتحان 🔄</button>
      </div>
    `;
    return;
  }

  const q = writeQuestions[currentWriteIdx];

  listContainer.innerHTML = `
    <div class="quiz-box">
      <div style="font-size: 0.9rem; color: var(--btn-color); margin-bottom: 10px;">سوال ${currentWriteIdx + 1} از ${writeQuestions.length}</div>
      <div class="quiz-question">معنی کلمه «<span style="color: var(--accent);">${q.word}</span>» (صنف ${q.grade}) را بنویسید:</div>
      
      <form onsubmit="submitWrittenAnswer(event, '${q.meaning.replace(/'/g, "\\'")}')" style="margin-top: 15px;">
        <input type="text" id="userWrittenInput" class="search-box" required autocomplete="off" placeholder="معنی را اینجا تایپ کنید...">
        <button type="submit" class="icon-btn" style="width: 100%; padding: 12px; background: var(--primary); color: white; font-weight: bold; margin-top: 10px;">تایید پاسخ ✅</button>
      </form>
    </div>
  `;
  document.getElementById('userWrittenInput').focus();
}

function submitWrittenAnswer(e, correctMeaning) {
  e.preventDefault();
  const userVal = document.getElementById('userWrittenInput').value.trim().toLowerCase();
  
  // Check if user answer matches any part of the correct meaning
  const isCorrect = correctMeaning.toLowerCase().includes(userVal) && userVal.length > 1;

  if (isCorrect) {
    playSound('correct');
    writeScore++;
    alert('پاسخ شما صحیح است! آفرین 🌟');
  } else {
    playSound('wrong');
    alert(`پاسخ نادرست. معنی صحیح: ${correctMeaning}`);
  }

  currentWriteIdx++;
  renderWritingQuestion();
}

// ==========================================
// CUSTOM WORD CREATOR
// ==========================================
function renderCustomWordForm() {
  const listContainer = document.getElementById('wordList');
  const statsContainer = document.getElementById('stats');
  statsContainer.textContent = 'افزودن واژه شخصی جدید';

  listContainer.innerHTML = `
    <div class="quiz-box">
      <h2>➕ ثبت واژه جدید در فرهنگ لغت</h2>
      <p style="color: var(--btn-color); margin-bottom: 20px;">واژه‌های دلخواه خود را به مجموعه اضافه کنید:</p>
      
      <form id="customWordForm" onsubmit="saveCustomWord(event)">
        <div style="margin-bottom: 15px; text-align: right;">
          <label style="font-weight: bold; display: block; margin-bottom: 5px;">واژه:</label>
          <input type="text" id="customWordInput" class="search-box" required placeholder="مثلاً: دلیر">
        </div>
        <div style="margin-bottom: 15px; text-align: right;">
          <label style="font-weight: bold; display: block; margin-bottom: 5px;">معنی:</label>
          <input type="text" id="customMeaningInput" class="search-box" required placeholder="مثلاً: شجاع">
        </div>
        <div style="margin-bottom: 15px; text-align: right;">
          <label style="font-weight: bold; display: block; margin-bottom: 5px;">صنف:</label>
          <select id="customGradeInput" class="search-box">
            <option value="7">صنف ۷</option><option value="8">صنف ۸</option><option value="9">صنف ۹</option>
            <option value="10">صنف ۱۰</option><option value="11">صنف ۱۱</option><option value="12">صنف ۱۲</option>
          </select>
        </div>
        <div style="margin-bottom: 20px; text-align: right;">
          <label style="font-weight: bold; display: block; margin-bottom: 5px;">مثال (اختیاری):</label>
          <input type="text" id="customExampleInput" class="search-box" placeholder="مثال کاربرد...">
        </div>
        <button type="submit" class="icon-btn" style="width: 100%; padding: 12px; background: var(--primary); color: white; font-weight: bold;">ذخیره واژه 💾</button>
      </form>
    </div>
  `;
}

function saveCustomWord(e) {
  e.preventDefault();
  playSound('correct');
  const newWord = {
    word: document.getElementById('customWordInput').value.trim(),
    meaning: document.getElementById('customMeaningInput').value.trim(),
    grade: document.getElementById('customGradeInput').value,
    pos: 'شخصی',
    example: document.getElementById('customExampleInput').value.trim() || 'ثبت شده توسط کاربر'
  };

  customWords.push(newWord);
  localStorage.setItem('customVocab', JSON.stringify(customWords));
  vocabularyData.unshift(newWord);

  triggerConfetti();
  alert('واژه جدید با موفقیت افزوده شد!');
  document.getElementById('customWordForm').reset();
}

// ==========================================
// MATCHING GAME (WITH TIMER)
// ==========================================
let firstSelectedMatch = null;
let matchPairsCount = 0;
let matchTimer = null;
let matchSecondsLeft = 45;

function startMatchingGame() {
  const listContainer = document.getElementById('wordList');
  const statsContainer = document.getElementById('stats');
  statsContainer.textContent = 'بازی جفت‌سازی واژگان با زمان‌سنج';

  if (vocabularyData.length < 4) {
    listContainer.innerHTML = '<div class="no-results">واژگان کافی وجود ندارد.</div>';
    return;
  }

  const shuffled = [...vocabularyData].sort(() => 0.5 - Math.random()).slice(0, 4);
  matchPairsCount = shuffled.length;
  firstSelectedMatch = null;
  matchSecondsLeft = 45;

  let gameItems = [];
  shuffled.forEach(item => {
    gameItems.push({ text: item.word, id: item.word, type: 'word' });
    gameItems.push({ text: item.meaning, id: item.word, type: 'meaning' });
  });
  gameItems.sort(() => 0.5 - Math.random());

  listContainer.innerHTML = `
    <div class="quiz-box">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h2>🎮 بازی حافظه و جفت‌سازی</h2>
        <span id="matchTimerDisplay" style="font-weight: bold; color: var(--accent); font-size: 1.1rem;">⏱️ 45 ثانیه</span>
      </div>
      <p style="color: var(--btn-color); margin-bottom: 15px;">هر واژه را به معنی صحیح آن متصل کنید قبل از اتمام زمان!</p>
      <div class="match-grid" id="matchGrid">
        ${gameItems.map((gi, idx) => `<div class="match-card" data-id="${gi.id}" data-type="${gi.type}" onclick="handleMatchClick(this)">${gi.text}</div>`).join('')}
      </div>
    </div>
  `;

  stopMatchTimer();
  matchTimer = setInterval(() => {
    matchSecondsLeft--;
    const display = document.getElementById('matchTimerDisplay');
    if (display) display.textContent = `⏱️ ${matchSecondsLeft} ثانیه`;

    if (matchSecondsLeft <= 0) {
      stopMatchTimer();
      playSound('wrong');
      alert('زمان شما به پایان رسید! دوباره تلاش کنید.');
      startMatchingGame();
    }
  }, 1000);
}

function stopMatchTimer() {
  if (matchTimer) {
    clearInterval(matchTimer);
    matchTimer = null;
  }
}

function handleMatchClick(cardElement) {
  playSound('click');
  if (cardElement.classList.contains('matched') || cardElement.classList.contains('selected')) return;

  if (!firstSelectedMatch) {
    firstSelectedMatch = cardElement;
    cardElement.classList.add('selected');
  } else {
    const firstId = firstSelectedMatch.getAttribute('data-id');
    const firstType = firstSelectedMatch.getAttribute('data-type');
    const secondId = cardElement.getAttribute('data-id');
    const secondType = cardElement.getAttribute('data-type');

    if (firstType !== secondType && firstId === secondId) {
      playSound('correct');
      firstSelectedMatch.classList.remove('selected');
      firstSelectedMatch.classList.add('matched');
      cardElement.classList.add('matched');
      firstSelectedMatch = null;
      matchPairsCount--;

      if (matchPairsCount === 0) {
        stopMatchTimer();
        triggerConfetti();
        setTimeout(() => {
          alert(`تبریک! شما برنده شدید با ${matchSecondsLeft} ثانیه زمان اضافه! 🌟`);
          startMatchingGame();
        }, 400);
      }
    } else {
      playSound('wrong');
      firstSelectedMatch.classList.add('wrong');
      cardElement.classList.add('wrong');
      const prevSelected = firstSelectedMatch;
      setTimeout(() => {
        prevSelected.classList.remove('selected', 'wrong');
        cardElement.classList.remove('wrong');
        firstSelectedMatch = null;
      }, 500);
    }
  }
}

// ==========================================
// SPEED SPELLING MINI-GAME
// ==========================================
let speedGameScore = 0;
let speedGameWord = null;
let speedGameTimer = null;
let speedGameSeconds = 15;

function startSpeedGame() {
  const listContainer = document.getElementById('wordList');
  const statsContainer = document.getElementById('stats');
  statsContainer.textContent = 'مسابقه سرعت املا و واژگان';
  speedGameScore = 0;
  nextSpeedQuestion();
}

function nextSpeedQuestion() {
  if (vocabularyData.length === 0) return;
  speedGameWord = vocabularyData[Math.floor(Math.random() * vocabularyData.length)];
  speedGameSeconds = 15;

  const listContainer = document.getElementById('wordList');
  listContainer.innerHTML = `
    <div class="quiz-box">
      <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
        <span>امتیاز شما: <strong>${speedGameScore}</strong></span>
        <span id="speedTimer" style="color: var(--danger); font-weight: bold;">⏱️ 15 ثانیه</span>
      </div>
      <h3 style="color: var(--heading-color); margin-bottom: 10px;">معنی این کلمه را انتخاب کنید:</h3>
      <div style="font-size: 2rem; font-weight: bold; color: var(--accent); margin-bottom: 20px;">${speedGameWord.word}</div>
      
      <div class="quiz-options" id="speedOptions"></div>
    </div>
  `;

  const wrongOptions = vocabularyData.filter(item => item.meaning !== speedGameWord.meaning).sort(() => 0.5 - Math.random()).slice(0, 3).map(i => i.meaning);
  const options = [...wrongOptions, speedGameWord.meaning].sort(() => 0.5 - Math.random());

  const optContainer = document.getElementById('speedOptions');
  optContainer.innerHTML = options.map(opt => `<button class="quiz-option-btn" onclick="checkSpeedAnswer(this, '${opt.replace(/'/g, "\\'")}', '${speedGameWord.meaning.replace(/'/g, "\\'")}')">${opt}</button>`).join('');

  stopSpeedGameTimer();
  speedGameTimer = setInterval(() => {
    speedGameSeconds--;
    const tEl = document.getElementById('speedTimer');
    if (tEl) tEl.textContent = `⏱️ ${speedGameSeconds} ثانیه`;
    if (speedGameSeconds <= 0) {
      stopSpeedGameTimer();
      playSound('wrong');
      alert(`زمان تمام شد! امتیاز نهایی شما: ${speedGameScore}`);
      startSpeedGame();
    }
  }, 1000);
}

function stopSpeedGameTimer() {
  if (speedGameTimer) {
    clearInterval(speedGameTimer);
    speedGameTimer = null;
  }
}

function checkSpeedAnswer(btn, selected, correct) {
  stopSpeedGameTimer();
  const buttons = document.querySelectorAll('.quiz-option-btn');
  buttons.forEach(b => b.style.pointerEvents = 'none');

  if (selected === correct) {
    playSound('correct');
    speedGameScore += 10;
    btn.classList.add('correct');
    setTimeout(() => nextSpeedQuestion(), 1000);
  } else {
    playSound('wrong');
    btn.classList.add('wrong');
    buttons.forEach(b => { if (b.textContent === correct) b.classList.add('correct'); });
    setTimeout(() => {
      alert(`پاسخ اشتباه! امتیاز نهایی شما: ${speedGameScore}`);
      startSpeedGame();
    }, 1200);
  }
}

// ==========================================
// AI TUTOR SECTION
// ==========================================
function renderAiTutor() {
  const listContainer = document.getElementById('wordList');
  const statsContainer = document.getElementById('stats');
  statsContainer.textContent = 'دستیار هوش مصنوعی صنف و ادبیات دری';

  listContainer.innerHTML = `
    <div class="ai-chat-box">
      <div style="background: var(--primary); color: white; padding: 12px 18px; font-weight: bold; display: flex; align-items: center; gap: 10px;">
        <span>🤖 مشاور هوشمند زبان و ادبیات دری (لیسه افغان ترک)</span>
      </div>
      <div class="ai-messages" id="aiMessages">
        <div class="ai-msg bot">سلام دانش‌آموز عزیز! من دستیار هوش مصنوعی شما هستم. می‌توانید درباره واژگان، دستور زبان دری، ساخت جمله، یا موضوعات درسی صنوف ۷ الی ۱۲ از من بپرسید.</div>
      </div>
      <div class="ai-input-area">
        <input type="text" id="aiUserInput" class="search-box" style="margin-bottom: 0;" placeholder="سوال خود را درباره زبان دری بنویسید...">
        <button class="icon-btn" onclick="sendAiMessage()" style="background: var(--primary); color: white; font-weight: bold; padding: 0 20px;">ارسال 📤</button>
      </div>
    </div>
  `;

  document.getElementById('aiUserInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendAiMessage();
  });
}

// ==========================================
// ADVANCED DYNAMIC AI TUTOR ENGINE
// ==========================================
// ==========================================
// TRUE CHATGPT AI ENGINE (NO IF STATEMENTS / NO CORS BLOCK)
// ==========================================

function renderAiTutor() {
  const listContainer = document.getElementById('wordList');
  const statsContainer = document.getElementById('stats');
  statsContainer.textContent = 'دستیار هوش مصنوعی صنف و ادبیات دری';

  listContainer.innerHTML = `
    <div class="ai-chat-box">
      <div style="background: var(--primary); color: white; padding: 12px 18px; font-weight: bold; display: flex; align-items: center; gap: 10px;">
        <span>🤖 مشاور هوشمند زبان و ادبیات دری (ChatGPT Live AI)</span>
      </div>
      <div class="ai-messages" id="aiMessages">
        <div class="ai-msg bot">سلام! من هوش مصنوعی لیسه افغان ترک هستم. هر سوالی درباره کلمات، جمله‌سازی، شعر، تاریخ یا هر موضوع دیگری دارید از من بپرسید تا مستقیماً به شما پاسخ دهم.</div>
      </div>
      <div class="ai-input-area">
        <input type="text" id="aiUserInput" class="search-box" style="margin-bottom: 0;" placeholder="هر سوالی دارید اینجا بنویسید...">
        <button class="icon-btn" onclick="sendAiMessage()" style="background: var(--primary); color: white; font-weight: bold; padding: 0 20px;">ارسال 📤</button>
      </div>
    </div>
  `;

  const inputEl = document.getElementById('aiUserInput');
  if (inputEl) {
    inputEl.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendAiMessage();
    });
  }
}

async function sendAiMessage() {
  const input = document.getElementById('aiUserInput');
  const msgContainer = document.getElementById('aiMessages');
  const userText = input.value.trim();
  if (!userText) return;

  playSound('click');
  msgContainer.innerHTML += `<div class="ai-msg user">${userText}</div>`;
  input.value = '';
  msgContainer.scrollTop = msgContainer.scrollHeight;

  // Show live thinking message
  const loadingId = 'ai-loading-' + Date.now();
  msgContainer.innerHTML += `<div class="ai-msg bot" id="${loadingId}">در حال تایپ پاسخ... ✍️</div>`;
  msgContainer.scrollTop = msgContainer.scrollHeight;

  try {
    // Send prompt directly to live AI server (Bypasses CORS restrictions)
    const prompt = encodeURIComponent(`شما یک دستیار هوش مصنوعی هوشمند برای زبان و ادبیات دری هستید. به سوال زیر به زبان دری/فارسی پاسخ کامل، دقیق و آموزنده بدهید: ${userText}`);
    const response = await fetch(`https://text.pollinations.ai/${prompt}`);
    
    const botReply = await response.text();

    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) loadingEl.remove();

    // Display direct AI reply
    msgContainer.innerHTML += `<div class="ai-msg bot">${botReply.replace(/\n/g, '<br>')}</div>`;
    playSound('correct');
    msgContainer.scrollTop = msgContainer.scrollHeight;

  } catch (err) {
    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) loadingEl.remove();

    msgContainer.innerHTML += `<div class="ai-msg bot">خطا در اتصال به هوش مصنوعی. لطفاً اتصال اینترنت خود را بررسی کنید.</div>`;
    msgContainer.scrollTop = msgContainer.scrollHeight;
  }
}

// ==========================================
// EXAM SECTION (MULTIPLE CHOICE)
// ==========================================
function startMultipleChoiceQuiz() { renderQuizSetup(); }
function renderQuizSetup() {
  const listContainer = document.getElementById('wordList');
  const statsContainer = document.getElementById('stats');
  statsContainer.textContent = 'تنظیمات آزمون چهارگزینه‌ای واژگان';

  listContainer.innerHTML = `
    <div class="quiz-box">
      <h2>تنظیمات آزمون</h2>
      <div style="margin-bottom: 15px; text-align: right;">
        <label style="display: block; font-weight: bold; margin-bottom: 5px;">انتخاب صنف:</label>
        <select id="quizGrade" class="search-box" style="margin-bottom: 0;">
          <option value="all">تمام صنوف (۷ الی ۱۲)</option>
          <option value="7">صنف ۷</option><option value="8">صنف ۸</option><option value="9">صنف ۹</option>
          <option value="10">صنف ۱۰</option><option value="11">صنف ۱۱</option><option value="12">صنف ۱۲</option>
        </select>
      </div>
      <div style="margin-bottom: 15px; text-align: right;">
        <label style="display: block; font-weight: bold; margin-bottom: 5px;">سطح دشواری:</label>
        <select id="quizDifficulty" class="search-box" style="margin-bottom: 0;">
          <option value="easy">آسان (۴ گزینه ساده)</option>
          <option value="medium" selected>متوسط (ترکیبی)</option>
          <option value="hard">سخت (سوالات صحیح/غلط)</option>
        </select>
      </div>
      <div style="margin-bottom: 25px; text-align: right;">
        <label style="display: block; font-weight: bold; margin-bottom: 5px;">تعداد سوالات:</label>
        <select id="quizCount" class="search-box" style="margin-bottom: 0;">
          <option value="5">۵ سوال</option><option value="10" selected>۱۰ سوال</option><option value="15">۱۵ سوال</option>
        </select>
      </div>
      <button class="icon-btn" onclick="initAdvancedQuiz()" style="width: 100%; padding: 12px; background: var(--primary); color: white; font-weight: bold;">شروع آزمون 🚀</button>
    </div>
  `;
}

function initAdvancedQuiz() {
  playSound('click');
  quizConfig.grade = document.getElementById('quizGrade').value;
  quizConfig.difficulty = document.getElementById('quizDifficulty').value;
  quizConfig.questionCount = parseInt(document.getElementById('quizCount').value);

  let pool = vocabularyData;
  if (quizConfig.grade !== 'all') {
    pool = vocabularyData.filter(item => String(item.grade) === String(quizConfig.grade));
  }

  if (pool.length < 4) {
    alert('تعداد واژگان این صنف کافی نیست.');
    return;
  }

  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  quizQuestions = shuffled.slice(0, Math.min(quizConfig.questionCount, shuffled.length));
  currentQuizIdx = 0;
  quizScore = 0;
  userAnswersLog = [];

  renderAdvancedQuizQuestion();
}

function renderAdvancedQuizQuestion() {
  const statsContainer = document.getElementById('stats');
  statsContainer.textContent = `آزمون (سوال ${currentQuizIdx + 1} از ${quizQuestions.length})`;

  if (currentQuizIdx >= quizQuestions.length) {
    renderQuizResults();
    return;
  }

  const q = quizQuestions[currentQuizIdx];
  let isTrueFalse = quizConfig.difficulty === 'hard' && Math.random() > 0.5;
  if (isTrueFalse) renderTrueFalseQuestion(q);
  else renderMultipleChoiceQuestion(q);
}

function renderMultipleChoiceQuestion(q) {
  const listContainer = document.getElementById('wordList');
  const wrongOptions = vocabularyData.filter(item => item.meaning !== q.meaning).sort(() => 0.5 - Math.random()).slice(0, 3).map(item => item.meaning);
  const options = [...wrongOptions, q.meaning].sort(() => 0.5 - Math.random());

  listContainer.innerHTML = `
    <div class="quiz-box">
      <div style="font-size: 0.9rem; color: var(--btn-color); margin-bottom: 10px;">سوال ${currentQuizIdx + 1} از ${quizQuestions.length}</div>
      <div class="quiz-question">معنی صحیح واژه «<span style="color: var(--accent);">${q.word}</span>» چیست؟</div>
      <div class="quiz-options">
        ${options.map(opt => `<button class="quiz-option-btn" onclick="checkAdvancedAnswer(this, '${opt.replace(/'/g, "\\'")}', '${q.meaning.replace(/'/g, "\\'")}', '${q.word}')">${opt}</button>`).join('')}
      </div>
    </div>
  `;
}

function renderTrueFalseQuestion(q) {
  const listContainer = document.getElementById('wordList');
  const isCorrectPair = Math.random() > 0.5;
  let displayedMeaning = isCorrectPair ? q.meaning : (vocabularyData.find(item => item.meaning !== q.meaning)?.meaning || 'متفرقه');

  listContainer.innerHTML = `
    <div class="quiz-box">
      <div style="font-size: 0.9rem; color: var(--btn-color); margin-bottom: 10px;">سوال ${currentQuizIdx + 1} از ${quizQuestions.length} (صحیح/غلط)</div>
      <div class="quiz-question">آیا معنی واژه «<span style="color: var(--accent);">${q.word}</span>» برابر با «<strong>${displayedMeaning}</strong>» است؟</div>
      <div class="quiz-options" style="display: flex; flex-direction: row; gap: 15px; justify-content: center;">
        <button class="quiz-option-btn" style="flex: 1; text-align: center; background: var(--success); color: white; font-weight: bold;" onclick="checkTrueFalseAnswer(this, ${isCorrectPair}, true, '${q.word}', '${q.meaning}')">صحیح ✅</button>
        <button class="quiz-option-btn" style="flex: 1; text-align: center; background: var(--danger); color: white; font-weight: bold;" onclick="checkTrueFalseAnswer(this, ${isCorrectPair}, false, '${q.word}', '${q.meaning}')">غلط ❌</button>
      </div>
    </div>
  `;
}

function checkAdvancedAnswer(btn, selected, correct, word) {
  const buttons = document.querySelectorAll('.quiz-option-btn');
  buttons.forEach(b => b.style.pointerEvents = 'none');

  const isCorrect = (selected === correct);
  if (isCorrect) {
    playSound('correct');
    quizScore++;
    btn.classList.add('correct');
  } else {
    playSound('wrong');
    btn.classList.add('wrong');
    buttons.forEach(b => { if (b.textContent === correct) b.classList.add('correct'); });
  }

  userAnswersLog.push({ word, selected, correct, isCorrect });
  setTimeout(() => { currentQuizIdx++; renderAdvancedQuizQuestion(); }, 1400);
}

function checkTrueFalseAnswer(btn, isActualCorrect, userChoice, word, correctMeaning) {
  const buttons = document.querySelectorAll('.quiz-option-btn');
  buttons.forEach(b => b.style.pointerEvents = 'none');

  const isCorrect = (userChoice === isActualCorrect);
  if (isCorrect) { playSound('correct'); quizScore++; btn.style.border = '3px solid #fff'; }
  else { playSound('wrong'); btn.style.opacity = '0.6'; }

  userAnswersLog.push({ word, selected: userChoice ? 'صحیح' : 'غلط', correct: correctMeaning, isCorrect });
  setTimeout(() => { currentQuizIdx++; renderAdvancedQuizQuestion(); }, 1400);
}

function renderQuizResults() {
  const listContainer = document.getElementById('wordList');
  const statsContainer = document.getElementById('stats');
  statsContainer.textContent = 'نتیجه نهایی آزمون';

  const percentage = Math.round((quizScore / quizQuestions.length) * 100);
  if (percentage >= 80) triggerConfetti();

  let reviewHtml = userAnswersLog.map((log, idx) => `
    <div style="text-align: right; padding: 8px 12px; margin-bottom: 6px; border-radius: 8px; background: ${log.isCorrect ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)'}; border: 1px solid ${log.isCorrect ? 'var(--success)' : 'var(--danger)'};">
      <strong>${idx + 1}. واژه: ${log.word}</strong> — ${log.isCorrect ? '✅ پاسخ درست' : '❌ پاسخ نادرست'}
      <div style="font-size: 0.85rem; color: var(--btn-color);">معنی صحیح: ${log.correct}</div>
    </div>
  `).join('');

  listContainer.innerHTML = `
    <div class="quiz-box" style="max-height: 80vh; overflow-y: auto;">
      <h2>کارنامه آزمون</h2>
      <p style="font-size: 1.2rem; margin: 10px 0;">نمره شما: <strong>${quizScore} از ${quizQuestions.length}</strong> (${percentage}%)</p>
      <div style="margin-bottom: 20px;">${reviewHtml}</div>
      <button class="icon-btn" onclick="startMultipleChoiceQuiz()" style="padding: 10px 25px; background: var(--primary); color: white; font-weight: bold;">شروع آزمون مجدد 🔄</button>
    </div>
  `;
}

// ==========================================
// FLASHCARDS SECTION
// ==========================================
function startFlashcards() { renderFlashcardSetup(); }
function renderFlashcardSetup() {
  const listContainer = document.getElementById('wordList');
  const statsContainer = document.getElementById('stats');
  statsContainer.textContent = 'تنظیمات فلش‌کارت‌های آموزشی';

  listContainer.innerHTML = `
    <div class="quiz-box">
      <h2>🃏 تنظیمات مطالعه با فلش‌کارت</h2>
      <div style="margin-bottom: 15px; text-align: right;">
        <label style="display: block; font-weight: bold; margin-bottom: 5px;">انتخاب صنف:</label>
        <select id="flashGrade" class="search-box" style="margin-bottom: 0;">
          <option value="all">تمام صنوف (۷ الی ۱۲)</option>
          <option value="7">صنف ۷</option><option value="8">صنف ۸</option><option value="9">صنف ۹</option>
          <option value="10">صنف ۱۰</option><option value="11">صنف ۱۱</option><option value="12">صنف ۱۲</option>
        </select>
      </div>
      <div style="margin-bottom: 20px; text-align: right;">
        <label style="display: block; font-weight: bold; margin-bottom: 5px;">حالت نمایش کارت‌ها:</label>
        <select id="flashMode" class="search-box" style="margin-bottom: 0;">
          <option value="standard">استاندارد (روی کارت: واژه | پشت کارت: معنی)</option>
          <option value="reverse">چالش معکوس (روی کارت: معنی | پشت کارت: واژه)</option>
        </select>
      </div>
      <button class="icon-btn" onclick="initAdvancedFlashcards()" style="width: 100%; padding: 12px; background: var(--primary); color: white; font-weight: bold;">شروع مطالعه 🚀</button>
    </div>
  `;
}

function initAdvancedFlashcards() {
  playSound('click');
  selectedFlashGrade = document.getElementById('flashGrade').value;
  flashcardMode = document.getElementById('flashMode').value;

  let pool = vocabularyData;
  if (selectedFlashGrade !== 'all') {
    pool = vocabularyData.filter(item => String(item.grade) === String(selectedFlashGrade));
  }

  flashcardList = [...pool].sort(() => 0.5 - Math.random());
  currentFlashIndex = 0;

  document.removeEventListener('keydown', handleFlashcardKeyboard);
  document.addEventListener('keydown', handleFlashcardKeyboard);
  renderCurrentFlashcard();
}

function renderCurrentFlashcard() {
  const listContainer = document.getElementById('wordList');
  const statsContainer = document.getElementById('stats');
  
  if (currentFlashIndex >= flashcardList.length) {
    triggerConfetti();
    statsContainer.textContent = 'پایان مجموعه فلش‌کارت';
    listContainer.innerHTML = `
      <div class="quiz-box">
        <h2>🎉 تمام کارت‌های این مجموعه را مرور کردید!</h2>
        <button class="icon-btn" onclick="startFlashcards()" style="padding: 10px 20px; background: var(--primary); color: white; font-weight: bold;">تنظیمات مجدد 🔄</button>
      </div>
    `;
    return;
  }

  const item = flashcardList[currentFlashIndex];
  statsContainer.textContent = `فلش‌کارت (${currentFlashIndex + 1} از ${flashcardList.length})`;

  const frontTitle = flashcardMode === 'standard' ? item.word : item.meaning;
  const backTitle = flashcardMode === 'standard' ? item.meaning : item.word;
  const progressPercent = Math.round(((currentFlashIndex + 1) / flashcardList.length) * 100);

  listContainer.innerHTML = `
    <div class="flashcard-wrapper">
      <div class="flashcard" id="mainFlashcard" onclick="playSound('click'); this.classList.toggle('flipped')">
        <div class="flash-face flash-front">
          <div class="flash-card-top"><span>صنف ${item.grade}</span><span>${currentFlashIndex + 1} / ${flashcardList.length}</span></div>
          <div class="flash-word">${frontTitle}</div>
          <div style="font-size: 0.85rem; opacity: 0.8; margin-top: 15px;">برای دیدن پاسخ کلیک کنید ⟳</div>
        </div>
        <div class="flash-face flash-back">
          <div class="flash-card-top" style="color: var(--btn-color);"><span>${item.pos || 'اسم'}</span><span>صنف ${item.grade}</span></div>
          <div class="flash-meaning">${backTitle}</div>
          <div class="flash-example">${item.example || ''}</div>
        </div>
      </div>
      <div class="flash-controls">
        <button class="learn-btn unknown" onclick="rateFlashcard('unknown')">ناخوانده ❌</button>
        <button class="learn-btn review" onclick="rateFlashcard('review')">نیازمند مرور ⚠️</button>
        <button class="learn-btn known" onclick="rateFlashcard('known')">بلدم ✅</button>
      </div>
      <div class="flash-progress">
        <div class="progress-bar"><div class="progress-fill" style="width: ${progressPercent}%;"></div></div>
      </div>
    </div>
  `;
}

function rateFlashcard(status) {
  playSound('click');
  let progressStats = JSON.parse(localStorage.getItem('vocabProgress')) || { known: 0, review: 0, unknown: 0 };
  if (status === 'known') progressStats.known++;
  else if (status === 'review') progressStats.review++;
  else if (status === 'unknown') progressStats.unknown++;
  
  localStorage.setItem('vocabProgress', JSON.stringify(progressStats));
  currentFlashIndex++;
  renderCurrentFlashcard();
}

function handleFlashcardKeyboard(e) {
  const card = document.getElementById('mainFlashcard');
  if (!card) return;
  if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); card.classList.toggle('flipped'); }
  else if (e.code === 'ArrowLeft') { e.preventDefault(); rateFlashcard('known'); }
  else if (e.code === 'ArrowDown') { e.preventDefault(); rateFlashcard('review'); }
  else if (e.code === 'ArrowRight') { e.preventDefault(); rateFlashcard('unknown'); }
}

// ==========================================
// PROGRESS DASHBOARD & RANDOM WORD
// ==========================================
function renderProgressDashboard() {
  const listContainer = document.getElementById('wordList');
  const statsContainer = document.getElementById('stats');
  statsContainer.textContent = 'داشبورد پیشرفت یادگیری';

  const progressStats = JSON.parse(localStorage.getItem('vocabProgress')) || { known: 0, review: 0, unknown: 0 };
  const bookmarksCount = bookmarkedWords.length;
  const totalVocab = typeof vocabularyData !== 'undefined' ? vocabularyData.length : 0;
  const masteryPercent = totalVocab > 0 ? Math.round((progressStats.known / totalVocab) * 100) : 0;
  const streakCount = checkDailyStreak();

  listContainer.innerHTML = `
    <div class="dashboard">
      <h2>آمار کلی یادگیری شما</h2>
      <div class="stat-card">🔥 زنجیره مطالعه فعلی: <strong>${streakCount} روز متوالی</strong></div>
      <div class="stat-card">📚 کل واژگان موجود: <strong>${totalVocab} واژه</strong></div>
      <div class="stat-card">❤️ علاقه‌مندی‌ها: <strong>${bookmarksCount} واژه</strong></div>
      <div class="stat-card">✅ واژه‌های یادگرفته شده: <strong style="color: var(--success);">${progressStats.known}</strong></div>
      <h3 style="margin-top: 20px;">درصد تسلط کل</h3>
      <div class="progress-bar"><div class="progress-fill" style="width: ${masteryPercent}%;"></div></div>
    </div>
  `;
}

function renderRandomWord() {
  const listContainer = document.getElementById('wordList');
  const statsContainer = document.getElementById('stats');
  statsContainer.textContent = 'واژه تصادفی روز';

  if (typeof vocabularyData === 'undefined' || vocabularyData.length === 0) return;
  const item = vocabularyData[Math.floor(Math.random() * vocabularyData.length)];
  const isBookmarked = bookmarkedWords.some(b => b.word === item.word);

  listContainer.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.style.maxWidth = '650px'; wrapper.style.margin = 'auto'; wrapper.style.width = '100%';
  appendCard(item, wrapper, isBookmarked, '');
  
  wrapper.innerHTML += `<div style="text-align: center; margin-top: 20px;"><button class="icon-btn" onclick="renderRandomWord()" style="padding: 10px 20px; font-weight: bold;">انتخاب واژه دیگر 🎲</button></div>`;
  listContainer.appendChild(wrapper);
}