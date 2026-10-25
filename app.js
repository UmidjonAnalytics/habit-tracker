/**
 * HABIT TRACKER APP - MAIN LOGIC
 */

// --- INITIAL STATE & STORAGE KEYS ---
const STORAGE_KEYS = {
  HABITS: 'habits_list_v1',
  LOGS: 'habits_logs_v1',
  SHEETS_URL: 'habits_sheets_url',
  REMINDER: 'habits_reminder_config',
  OFFLINE_QUEUE: 'habits_offline_queue'
};

const DEFAULT_HABITS = [
  { id: 'h_1', name: 'Ertalabki badantarbiya', type: 'boolean', target: 1, unit: 'marta', icon: '🏃', color: '#10b981', active: true },
  { id: 'h_2', name: 'Suv ichish', type: 'number', target: 2.5, unit: 'litr', icon: '💧', color: '#3b82f6', active: true },
  { id: 'h_3', name: 'Kitob o\'qish', type: 'number', target: 20, unit: 'sahifa', icon: '📚', color: '#8b5cf6', active: true },
  { id: 'h_4', name: 'Dasturlash / O\'rganish', type: 'number', target: 45, unit: 'daqiqa', icon: '💻', color: '#f59e0b', active: true },
  { id: 'h_5', name: 'Kechki sayr & Uyqu rejimi', type: 'boolean', target: 1, unit: 'marta', icon: '🌙', color: '#ec4899', active: true }
];

// App State
let state = {
  habits: [],
  logs: {}, // { "YYYY-MM-DD": { "habitId": { value: 1, status: "completed" } } }
  currentDate: getTodayString(),
  sheetsUrl: '',
  reminderConfig: { enabled: false, time: '21:00' },
  offlineQueue: [],
  activeNumberEdit: null // { habitId, date }
};

// --- DOM ELEMENTS ---
const elements = {
  todayContainer: document.getElementById('habits-list-container'),
  currentDateTitle: document.getElementById('current-date-title'),
  currentDateSub: document.getElementById('current-date-sub'),
  btnPrevDay: document.getElementById('btn-prev-day'),
  btnNextDay: document.getElementById('btn-next-day'),
  btnTodayReset: document.getElementById('btn-today-reset'),
  
  // Stats
  statCompletedCount: document.getElementById('stat-completed-count'),
  statTotalCount: document.getElementById('stat-total-count'),
  dailyProgressBar: document.getElementById('daily-progress-bar'),
  dailyProgressPercent: document.getElementById('daily-progress-percent'),
  dailyMotivationText: document.getElementById('daily-motivation-text'),
  heroStreakCount: document.getElementById('hero-streak-count'),
  
  // Navigation
  navButtons: document.querySelectorAll('.nav-btn'),
  tabContents: document.querySelectorAll('.tab-content'),
  
  // Sync & Status
  connectionBadge: document.getElementById('connection-status-badge'),
  btnSync: document.getElementById('btn-sync'),
  syncIcon: document.getElementById('sync-icon'),
  
  // Analytics
  weeklyChartBars: document.getElementById('weekly-chart-bars'),
  habitsAnalyticsList: document.getElementById('habits-analytics-list'),
  
  // Management
  manageHabitsList: document.getElementById('manage-habits-list'),
  btnOpenAdd: document.getElementById('btn-open-add'),
  btnAddHabitSecondary: document.getElementById('btn-add-habit-secondary'),
  
  // Add/Edit Modal
  modalHabit: document.getElementById('modal-habit'),
  modalHabitTitle: document.getElementById('modal-habit-title'),
  modalHabitClose: document.getElementById('modal-habit-close'),
  formHabit: document.getElementById('form-habit'),
  habitFormId: document.getElementById('habit-form-id'),
  habitName: document.getElementById('habit-name'),
  habitIcon: document.getElementById('habit-icon'),
  habitTarget: document.getElementById('habit-target'),
  habitUnit: document.getElementById('habit-unit'),
  numericSettings: document.getElementById('numeric-settings'),
  
  // Number input modal
  modalNumberInput: document.getElementById('modal-number-input'),
  modalNumTitle: document.getElementById('modal-num-title'),
  modalNumValue: document.getElementById('modal-num-value'),
  modalNumUnit: document.getElementById('modal-num-unit'),
  modalNumCancel: document.getElementById('modal-num-cancel'),
  modalNumSave: document.getElementById('modal-num-save'),
  
  // Settings
  inputSheetsUrl: document.getElementById('input-sheets-url'),
  btnSaveSheetsUrl: document.getElementById('btn-save-sheets-url'),
  btnTestConnection: document.getElementById('btn-test-connection'),
  connectionTestResult: document.getElementById('connection-test-result'),
  toggleNotifications: document.getElementById('toggle-notifications'),
  reminderTimeInput: document.getElementById('reminder-time-input'),
  btnResetDemo: document.getElementById('btn-reset-demo'),
  
  // Toast
  toast: document.getElementById('toast'),
  toastText: document.getElementById('toast-text'),
  toastIcon: document.getElementById('toast-icon')
};

// --- INITIALIZATION ---
function initApp() {
  loadFromStorage();
  setupEventListeners();
  registerServiceWorker();
  setupReminderChecker();
  
  renderApp();
  
  // Agar Sheets URL mavjud bo'lsa, ma'lumotlarni Sheets'dan yuklash
  if (state.sheetsUrl) {
    syncWithSheets(false);
  }
}

// --- STORAGE HANDLING ---
function loadFromStorage() {
  const storedHabits = localStorage.getItem(STORAGE_KEYS.HABITS);
  state.habits = storedHabits ? JSON.parse(storedHabits) : DEFAULT_HABITS;
  
  const storedLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
  state.logs = storedLogs ? JSON.parse(storedLogs) : {};
  
  state.sheetsUrl = localStorage.getItem(STORAGE_KEYS.SHEETS_URL) || '';
  
  const storedReminder = localStorage.getItem(STORAGE_KEYS.REMINDER);
  if (storedReminder) {
    state.reminderConfig = JSON.parse(storedReminder);
  }
  
  const storedQueue = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
  state.offlineQueue = storedQueue ? JSON.parse(storedQueue) : [];
  
  // Settings inputs update
  if (elements.inputSheetsUrl) elements.inputSheetsUrl.value = state.sheetsUrl;
  if (elements.toggleNotifications) elements.toggleNotifications.checked = state.reminderConfig.enabled;
  if (elements.reminderTimeInput) elements.reminderTimeInput.value = state.reminderConfig.time;
  
  updateConnectionBadge();
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(state.habits));
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(state.logs));
  localStorage.setItem(STORAGE_KEYS.SHEETS_URL, state.sheetsUrl);
  localStorage.setItem(STORAGE_KEYS.REMINDER, JSON.stringify(state.reminderConfig));
  localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(state.offlineQueue));
}

// --- RENDER FUNCTIONS ---
function renderApp() {
  renderDateBar();
  renderDailySummary();
  renderHabitsList();
  renderAnalytics();
  renderManagementList();
}

function renderDateBar() {
  const isToday = state.currentDate === getTodayString();
  const d = parseDateKey(state.currentDate);
  
  const uzbekDays = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
  const uzbekMonths = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
  
  elements.currentDateTitle.textContent = isToday ? 'Bugun' : `${d.getDate()}-${uzbekMonths[d.getMonth()]}`;
  elements.currentDateSub.textContent = `${d.getDate()}-${uzbekMonths[d.getMonth()]}, ${uzbekDays[d.getDay()]}`;
}

function renderDailySummary() {
  const activeHabits = state.habits.filter(h => h.active !== false);
  const total = activeHabits.length;
  const dayLogs = state.logs[state.currentDate] || {};
  
  let completed = 0;
  activeHabits.forEach(h => {
    const log = dayLogs[h.id];
    if (log && log.status === 'completed') {
      completed++;
    }
  });
  
  elements.statCompletedCount.textContent = completed;
  elements.statTotalCount.textContent = `/ ${total} bajarildi`;
  
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  elements.dailyProgressBar.style.width = `${percent}%`;
  elements.dailyProgressPercent.textContent = `${percent}% yakunlandi`;
  
  // Motivational copy
  if (percent === 100) {
    elements.dailyMotivationText.textContent = 'Ajoyib natija! Barchasi bajarildi! 🏆';
  } else if (percent >= 50) {
    elements.dailyMotivationText.textContent = 'Yarmi ortda qoldi, davom eting! 💪';
  } else if (percent > 0) {
    elements.dailyMotivationText.textContent = 'Boshlanishi yaxshi, to\'xtamang! 🚀';
  } else {
    elements.dailyMotivationText.textContent = 'Boshlaymizmi? ✨';
  }
  
  // Calculate Hero Streak (overall max current streak)
  let maxStreak = 0;
  activeHabits.forEach(h => {
    const s = getHabitStreak(h.id);
    if (s > maxStreak) maxStreak = s;
  });
  elements.heroStreakCount.textContent = `${maxStreak} kun`;
}

function renderHabitsList() {
  elements.todayContainer.innerHTML = '';
  const activeHabits = state.habits.filter(h => h.active !== false);
  
  if (activeHabits.length === 0) {
    elements.todayContainer.innerHTML = `
      <div class="text-center py-10 bg-slate-900/40 rounded-3xl border border-slate-800">
        <span class="text-4xl block mb-2">📋</span>
        <p class="text-sm font-semibold text-white">Hozircha odatlar yo'q</p>
        <p class="text-xs text-slate-400 mt-1 mb-4">Birinchi odatingizni qo'shing</p>
        <button onclick="document.getElementById('btn-open-add').click()" class="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs">
          + Odat qo'shish
        </button>
      </div>
    `;
    return;
  }
  
  const dayLogs = state.logs[state.currentDate] || {};
  
  activeHabits.forEach(habit => {
    const log = dayLogs[habit.id] || { value: 0, status: 'pending' };
    const streak = getHabitStreak(habit.id);
    const isCompleted = log.status === 'completed';
    
    const card = document.createElement('div');
    card.className = `p-4 rounded-3xl border transition-all duration-200 ${
      isCompleted 
        ? 'bg-slate-900/90 border-emerald-500/40 shadow-lg shadow-emerald-500/5' 
        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
    }`;
    
    if (habit.type === 'boolean') {
      card.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-2xl flex items-center justify-center text-xl bg-slate-800 border border-slate-700/60 shadow-inner">
              ${habit.icon || '⭐'}
            </div>
            <div>
              <h3 class="text-sm font-bold ${isCompleted ? 'text-emerald-300 line-through decoration-emerald-500/60' : 'text-white'}">
                ${habit.name}
              </h3>
              <div class="flex items-center gap-2 mt-0.5">
                <span class="text-[11px] font-semibold text-amber-400 flex items-center gap-0.5">
                  🔥 ${streak} kun
                </span>
                <span class="text-[10px] text-slate-400">Kunlik odat</span>
              </div>
            </div>
          </div>
          
          <button class="btn-toggle-bool w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 active:scale-90 ${
            isCompleted 
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
              : 'bg-slate-800 border border-slate-700 text-slate-400 hover:border-slate-600'
          }" data-id="${habit.id}">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      `;
    } else {
      // Numeric Habit
      const val = Number(log.value) || 0;
      const target = Number(habit.target) || 1;
      const percent = Math.min(100, Math.round((val / target) * 100));
      
      // Smart quick step values
      let step1 = 1;
      let step2 = 2;
      if (habit.unit.includes('litr')) {
        step1 = 0.25;
        step2 = 0.5;
      } else if (target >= 20) {
        step1 = 5;
        step2 = 10;
      }
      
      card.innerHTML = `
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-2xl flex items-center justify-center text-xl bg-slate-800 border border-slate-700/60 shadow-inner">
                ${habit.icon || '💧'}
              </div>
              <div>
                <h3 class="text-sm font-bold ${isCompleted ? 'text-emerald-300' : 'text-white'}">
                  ${habit.name}
                </h3>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="text-[11px] font-semibold text-amber-400 flex items-center gap-0.5">
                    🔥 ${streak} kun
                  </span>
                  <span class="text-[10px] text-slate-400">Maqsad: ${target} ${habit.unit}</span>
                </div>
              </div>
            </div>
            
            <button class="btn-open-num-input px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 text-right active:scale-95 transition" data-id="${habit.id}">
              <div class="text-xs font-black ${isCompleted ? 'text-emerald-400' : 'text-indigo-400'}">
                ${val} / ${target}
              </div>
              <div class="text-[9px] text-slate-400 uppercase tracking-wider">${habit.unit} ✎</div>
            </button>
          </div>

          <!-- Progress bar -->
          <div class="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-slate-700/30">
            <div class="${isCompleted ? 'bg-emerald-400' : 'bg-indigo-500'} h-full rounded-full transition-all duration-300" style="width: ${percent}%"></div>
          </div>

          <!-- Quick Stepper Buttons -->
          <div class="flex items-center gap-1.5 pt-1">
            <button class="btn-step flex-1 py-1 px-2 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-slate-300 text-xs font-semibold active:scale-95 transition border border-slate-700/40"
                    data-id="${habit.id}" data-delta="${-step1}">
              -${step1}
            </button>
            <button class="btn-step flex-1 py-1 px-2 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-slate-300 text-xs font-semibold active:scale-95 transition border border-slate-700/40"
                    data-id="${habit.id}" data-delta="${step1}">
              +${step1} ${habit.unit}
            </button>
            <button class="btn-step flex-1 py-1 px-2 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-slate-300 text-xs font-semibold active:scale-95 transition border border-slate-700/40"
                    data-id="${habit.id}" data-delta="${step2}">
              +${step2} ${habit.unit}
            </button>
            <button class="btn-step py-1 px-2.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-xs font-semibold active:scale-95 transition border border-emerald-500/30"
                    data-id="${habit.id}" data-set="${target}" title="To'liq bajarish">
              ✓
            </button>
          </div>
        </div>
      `;
    }
    
    elements.todayContainer.appendChild(card);
  });
  
  attachHabitCardEvents();
}

function attachHabitCardEvents() {
  // Boolean toggle click
  document.querySelectorAll('.btn-toggle-bool').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const habitId = btn.getAttribute('data-id');
      const habit = state.habits.find(h => h.id === habitId);
      if (!habit) return;
      
      const dayLogs = state.logs[state.currentDate] || {};
      const currentLog = dayLogs[habitId] || { value: 0 };
      const isCurrentlyDone = currentLog.value >= 1;
      
      const newValue = isCurrentlyDone ? 0 : 1;
      setHabitValue(habit, newValue);
      
      if (!isCurrentlyDone) {
        triggerSuccessFeedback();
      }
    });
  });
  
  // Stepper buttons
  document.querySelectorAll('.btn-step').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const habitId = btn.getAttribute('data-id');
      const habit = state.habits.find(h => h.id === habitId);
      if (!habit) return;
      
      const dayLogs = state.logs[state.currentDate] || {};
      const currentLog = dayLogs[habitId] || { value: 0 };
      let currentVal = Number(currentLog.value) || 0;
      
      if (btn.hasAttribute('data-set')) {
        currentVal = Number(btn.getAttribute('data-set'));
      } else {
        const delta = Number(btn.getAttribute('data-delta')) || 0;
        currentVal = Math.max(0, Math.round((currentVal + delta) * 100) / 100);
      }
      
      const wasCompleted = currentLog.status === 'completed';
      setHabitValue(habit, currentVal);
      
      if (!wasCompleted && currentVal >= habit.target) {
        triggerSuccessFeedback();
      }
    });
  });
  
  // Open numeric edit modal
  document.querySelectorAll('.btn-open-num-input').forEach(btn => {
    btn.addEventListener('click', () => {
      const habitId = btn.getAttribute('data-id');
      const habit = state.habits.find(h => h.id === habitId);
      if (!habit) return;
      
      const dayLogs = state.logs[state.currentDate] || {};
      const currentLog = dayLogs[habitId] || { value: 0 };
      
      state.activeNumberEdit = habitId;
      elements.modalNumTitle.textContent = `${habit.name} miqdori`;
      elements.modalNumValue.value = currentLog.value || 0;
      elements.modalNumUnit.textContent = habit.unit || '';
      elements.modalNumberInput.classList.remove('hidden');
      elements.modalNumValue.focus();
    });
  });
}

function setHabitValue(habit, value) {
  if (!state.logs[state.currentDate]) {
    state.logs[state.currentDate] = {};
  }
  
  const target = Number(habit.target) || 1;
  let status = 'pending';
  if (value >= target) {
    status = 'completed';
  } else if (value > 0) {
    status = 'partial';
  } else {
    status = 'skipped';
  }
  
  const logItem = {
    value: value,
    target: target,
    status: status,
    timestamp: new Date().toISOString()
  };
  
  state.logs[state.currentDate][habit.id] = logItem;
  saveToStorage();
  renderDailySummary();
  renderHabitsList();
  renderAnalytics();
  
  // Google Sheets'ga jo'natish
  queueOrSendLog(state.currentDate, habit, logItem);
}

function triggerSuccessFeedback() {
  // Sound or Haptic Vibration
  if (navigator.vibrate) {
    navigator.vibrate([40, 30, 60]);
  }
  // Confetti
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#6366f1', '#10b981', '#f59e0b']
    });
  }
}

// --- ANALYTICS TAB ---
function renderAnalytics() {
  const activeHabits = state.habits.filter(h => h.active !== false);
  
  // 1. Weekly 7-day mini chart
  elements.weeklyChartBars.innerHTML = '';
  const uzbekDaysShort = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Juma', 'Shan'];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dKey = formatDateKey(d);
    const dayOfWeek = uzbekDaysShort[d.getDay()];
    const isToday = dKey === getTodayString();
    
    const dayLogs = state.logs[dKey] || {};
    let completedInDay = 0;
    activeHabits.forEach(h => {
      if (dayLogs[h.id] && dayLogs[h.id].status === 'completed') {
        completedInDay++;
      }
    });
    
    const percent = activeHabits.length > 0 ? Math.round((completedInDay / activeHabits.length) * 100) : 0;
    
    const col = document.createElement('div');
    col.className = 'flex-1 flex flex-col items-center gap-1.5 h-full justify-end cursor-pointer group';
    col.onclick = () => {
      state.currentDate = dKey;
      switchTab('tab-today');
      renderApp();
    };
    
    col.innerHTML = `
      <span class="text-[9px] font-bold ${percent > 0 ? 'text-indigo-400' : 'text-slate-500'} group-hover:text-white transition">
        ${percent}%
      </span>
      <div class="w-full bg-slate-800/80 rounded-t-lg h-24 flex items-end p-0.5">
        <div class="w-full ${isToday ? 'bg-gradient-to-t from-indigo-600 to-emerald-400' : 'bg-indigo-500/70'} rounded-t-md transition-all duration-500" style="height: ${percent}%"></div>
      </div>
      <span class="text-[10px] font-semibold ${isToday ? 'text-emerald-400 font-bold' : 'text-slate-400'}">
        ${dayOfWeek}
      </span>
    `;
    elements.weeklyChartBars.appendChild(col);
  }
  
  // 2. Performance breakdown per habit
  elements.habitsAnalyticsList.innerHTML = '';
  const totalDays = Object.keys(state.logs).length || 1;
  
  activeHabits.forEach(habit => {
    let completedCount = 0;
    Object.keys(state.logs).forEach(dateKey => {
      const log = state.logs[dateKey][habit.id];
      if (log && log.status === 'completed') {
        completedCount++;
      }
    });
    
    const streak = getHabitStreak(habit.id);
    const rate = Math.round((completedCount / totalDays) * 100);
    
    const row = document.createElement('div');
    row.className = 'p-3 bg-slate-950/50 rounded-2xl border border-slate-800/80 flex items-center justify-between';
    row.innerHTML = `
      <div class="flex items-center gap-2.5">
        <span class="text-xl">${habit.icon || '⭐'}</span>
        <div>
          <div class="text-xs font-bold text-white">${habit.name}</div>
          <div class="text-[10px] text-amber-400 font-semibold">🔥 ${streak} kunlik streak</div>
        </div>
      </div>
      <div class="text-right">
        <div class="text-xs font-black text-indigo-400">${rate}%</div>
        <div class="text-[10px] text-slate-400">${completedCount} kun bajarildi</div>
      </div>
    `;
    elements.habitsAnalyticsList.appendChild(row);
  });
}

// --- MANAGEMENT TAB ---
function renderManagementList() {
  elements.manageHabitsList.innerHTML = '';
  
  state.habits.forEach(habit => {
    const card = document.createElement('div');
    card.className = 'p-3.5 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between';
    
    card.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="text-2xl">${habit.icon || '⭐'}</span>
        <div>
          <div class="text-xs font-bold text-white">${habit.name}</div>
          <div class="text-[10px] text-slate-400">
            ${habit.type === 'boolean' ? 'Oddiy (Ha/Yo\'q)' : `Raqamli: ${habit.target} ${habit.unit}`}
          </div>
        </div>
      </div>
      <div class="flex items-center gap-1.5">
        <button class="btn-edit-habit p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white" data-id="${habit.id}">
          ✎
        </button>
        <button class="btn-delete-habit p-1.5 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/60" data-id="${habit.id}">
          🗑
        </button>
      </div>
    `;
    elements.manageHabitsList.appendChild(card);
  });
  
  // Attach edit & delete events
  document.querySelectorAll('.btn-edit-habit').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const habit = state.habits.find(h => h.id === id);
      if (!habit) return;
      openHabitModal(habit);
    });
  });
  
  document.querySelectorAll('.btn-delete-habit').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      if (confirm('Ushbu odatni o\'chirmoqchimisiz?')) {
        state.habits = state.habits.filter(h => h.id !== id);
        saveToStorage();
        renderApp();
        showToast('Odat o\'chirildi', '🗑️');
      }
    });
  });
}

function openHabitModal(habit = null) {
  elements.formHabit.reset();
  
  if (habit) {
    elements.modalHabitTitle.textContent = 'Odatni tahrirlash';
    elements.habitFormId.value = habit.id;
    elements.habitName.value = habit.name;
    elements.habitIcon.value = habit.icon || '⭐';
    
    const isNum = habit.type === 'number';
    document.querySelector(`input[name="habit-type"][value="${isNum ? 'number' : 'boolean'}"]`).checked = true;
    if (isNum) {
      elements.numericSettings.classList.remove('hidden');
      elements.habitTarget.value = habit.target;
      elements.habitUnit.value = habit.unit;
    } else {
      elements.numericSettings.classList.add('hidden');
    }
  } else {
    elements.modalHabitTitle.textContent = 'Yangi odat qo\'shish';
    elements.habitFormId.value = '';
    elements.habitIcon.value = '⭐';
    document.querySelector('input[name="habit-type"][value="boolean"]').checked = true;
    elements.numericSettings.classList.add('hidden');
  }
  
  elements.modalHabit.classList.remove('hidden');
}

// --- GOOGLE SHEETS INTEGRATION ---
async function queueOrSendLog(dateStr, habit, logItem) {
  const payload = {
    action: 'log_habit',
    date: dateStr,
    habitId: habit.id,
    habitName: habit.name,
    value: logItem.value,
    target: logItem.target
  };
  
  if (!state.sheetsUrl) {
    return; // Lokal rejimda qoladi
  }
  
  try {
    // Google Apps Script CORS cheklovlarini chetlab o'tish uchun text/plain formatida yuboriladi
    const response = await fetch(state.sheetsUrl, {
      method: 'POST',
      mode: 'no-cors', // Apps Script Web App bilan muammosiz ishlash uchun
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    
    showToast('Google Sheets\'ga saqlandi', '🟢');
  } catch (err) {
    console.warn('Sheets aloqa xatosi, navbatga saqlanmoqda:', err);
    state.offlineQueue.push(payload);
    saveToStorage();
    showToast('Offline saqlandi. Keyinroq sinxronlanadi', '🟠');
  }
}

async function syncWithSheets(isManual = true) {
  if (!state.sheetsUrl) {
    if (isManual) showToast('Avval Sozlamalardan Sheets URL kiriting', '⚠️');
    return;
  }
  
  elements.syncIcon.classList.add('animate-spin');
  updateConnectionBadge('loading');
  
  try {
    // 1. Agar oflayn navbatda ma'lumot bo'lsa, avval ularni jo'natish
    if (state.offlineQueue.length > 0) {
      await fetch(state.sheetsUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'batch_sync', logs: state.offlineQueue })
      });
      state.offlineQueue = [];
      saveToStorage();
    }
    
    // 2. Sheets'dan yangi ma'lumotlarni tortib olish
    const res = await fetch(`${state.sheetsUrl}?action=get_all`, {
      method: 'GET'
    });
    const data = await res.json();
    
    if (data.status === 'success') {
      if (data.habits && data.habits.length > 0) {
        state.habits = data.habits;
      }
      if (data.logs) {
        state.logs = Object.assign({}, state.logs, data.logs);
      }
      saveToStorage();
      renderApp();
      updateConnectionBadge('online');
      if (isManual) showToast('Google Sheets bilan muvaffaqiyatli sinxronlandi! 🎉', '✅');
    } else {
      throw new Error(data.message || 'Xato javob');
    }
  } catch (err) {
    console.error('Sinxronlash xatosi:', err);
    updateConnectionBadge('error');
    if (isManual) showToast('Sinxronlashda xatolik yuz berdi', '❌');
  } finally {
    elements.syncIcon.classList.remove('animate-spin');
  }
}

function updateConnectionBadge(forceStatus = null) {
  if (forceStatus === 'loading') {
    elements.connectionBadge.innerHTML = '<span class="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 animate-spin"></span> Bog\'lanmoqda...';
    elements.connectionBadge.className = 'text-[11px] font-medium flex items-center gap-1 text-indigo-400';
    return;
  }
  
  if (state.sheetsUrl) {
    elements.connectionBadge.innerHTML = '<span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Google Sheets ulangan';
    elements.connectionBadge.className = 'text-[11px] font-medium flex items-center gap-1 text-emerald-400';
  } else {
    elements.connectionBadge.innerHTML = '<span class="inline-block w-1.5 h-1.5 rounded-full bg-amber-400"></span> Lokal rejim';
    elements.connectionBadge.className = 'text-[11px] font-medium flex items-center gap-1 text-amber-400';
  }
}

// --- STREAK CALCULATION ---
function getHabitStreak(habitId) {
  let streak = 0;
  const todayKey = getTodayString();
  const todayLog = state.logs[todayKey] && state.logs[todayKey][habitId];
  const isTodayDone = todayLog && todayLog.status === 'completed';
  
  if (isTodayDone) streak++;
  
  let checkDate = new Date();
  checkDate.setDate(checkDate.getDate() - 1);
  
  for (let i = 0; i < 60; i++) {
    const key = formatDateKey(checkDate);
    const log = state.logs[key] && state.logs[key][habitId];
    if (log && log.status === 'completed') {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
  // Navigation Tabs
  elements.navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });
  
  // Date navigator
  elements.btnPrevDay.addEventListener('click', () => {
    const d = parseDateKey(state.currentDate);
    d.setDate(d.getDate() - 1);
    state.currentDate = formatDateKey(d);
    renderApp();
  });
  
  elements.btnNextDay.addEventListener('click', () => {
    const d = parseDateKey(state.currentDate);
    d.setDate(d.getDate() + 1);
    state.currentDate = formatDateKey(d);
    renderApp();
  });
  
  elements.btnTodayReset.addEventListener('click', () => {
    state.currentDate = getTodayString();
    renderApp();
  });
  
  // Sync button
  elements.btnSync.addEventListener('click', () => syncWithSheets(true));
  
  // Add habit triggers
  elements.btnOpenAdd.addEventListener('click', () => openHabitModal());
  elements.btnAddHabitSecondary.addEventListener('click', () => openHabitModal());
  elements.modalHabitClose.addEventListener('click', () => elements.modalHabit.classList.add('hidden'));
  
  // Emoji pickers
  document.querySelectorAll('.emoji-pick').forEach(btn => {
    btn.addEventListener('click', () => {
      elements.habitIcon.value = btn.textContent.trim();
    });
  });
  
  // Type change in modal
  document.querySelectorAll('input[name="habit-type"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'number') {
        elements.numericSettings.classList.remove('hidden');
      } else {
        elements.numericSettings.classList.add('hidden');
      }
    });
  });
  
  // Save Habit Form
  elements.formHabit.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = elements.habitFormId.value || 'h_' + Date.now();
    const name = elements.habitName.value.trim();
    const icon = elements.habitIcon.value.trim() || '⭐';
    const type = document.querySelector('input[name="habit-type"]:checked').value;
    const target = type === 'number' ? Number(elements.habitTarget.value) || 1 : 1;
    const unit = type === 'number' ? elements.habitUnit.value.trim() : 'marta';
    
    const existingIndex = state.habits.findIndex(h => h.id === id);
    const habitObj = { id, name, icon, type, target, unit, active: true };
    
    if (existingIndex >= 0) {
      state.habits[existingIndex] = Object.assign({}, state.habits[existingIndex], habitObj);
    } else {
      state.habits.push(habitObj);
    }
    
    saveToStorage();
    elements.modalHabit.classList.add('hidden');
    renderApp();
    showToast('Odat muvaffaqiyatli saqlandi! 🎉', '✅');
  });
  
  // Number Modal Cancel & Save
  elements.modalNumCancel.addEventListener('click', () => {
    elements.modalNumberInput.classList.add('hidden');
    state.activeNumberEdit = null;
  });
  
  elements.modalNumSave.addEventListener('click', () => {
    if (!state.activeNumberEdit) return;
    const habit = state.habits.find(h => h.id === state.activeNumberEdit);
    const val = Number(elements.modalNumValue.value) || 0;
    if (habit) {
      setHabitValue(habit, val);
      if (val >= habit.target) triggerSuccessFeedback();
    }
    elements.modalNumberInput.classList.add('hidden');
    state.activeNumberEdit = null;
  });
  
  // Settings: Sheets URL save
  elements.btnSaveSheetsUrl.addEventListener('click', () => {
    const url = elements.inputSheetsUrl.value.trim();
    state.sheetsUrl = url;
    saveToStorage();
    updateConnectionBadge();
    showToast('Sheets URL saqlandi', '💾');
    if (url) syncWithSheets(true);
  });
  
  elements.btnTestConnection.addEventListener('click', async () => {
    const url = elements.inputSheetsUrl.value.trim();
    if (!url) {
      showToast('URL bo\'sh bo\'lishi mumkin emas', '⚠️');
      return;
    }
    elements.connectionTestResult.className = 'text-xs text-indigo-400 block';
    elements.connectionTestResult.textContent = 'Aloqa tekshirilmoqda...';
    try {
      const res = await fetch(`${url}?action=ping`);
      const data = await res.json();
      if (data.status === 'success') {
        elements.connectionTestResult.className = 'text-xs text-emerald-400 block';
        elements.connectionTestResult.textContent = '✓ Aloqa a\'lo darajada! Google Sheets muvaffaqiyatli ulandi.';
      } else {
        throw new Error('Noma\'lum javob');
      }
    } catch (err) {
      elements.connectionTestResult.className = 'text-xs text-rose-400 block';
      elements.connectionTestResult.textContent = '✗ Ulanishda xato. URL to\'g'ri deploy qilinganini tekshiring.';
    }
  });
  
  // Settings: Notifications toggle
  elements.toggleNotifications.addEventListener('change', async (e) => {
    if (e.target.checked) {
      if ('Notification' in window) {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          state.reminderConfig.enabled = true;
          showToast('Eslatmalar yoqildi! 🔔', '✅');
        } else {
          e.target.checked = false;
          state.reminderConfig.enabled = false;
          alert('Brauzerda xabarnomalarga ruxsat berilmagan.');
        }
      } else {
        alert('Qurilmangizda xabarnomalar qo\'llab-quvvatlanmaydi.');
        e.target.checked = false;
      }
    } else {
      state.reminderConfig.enabled = false;
      showToast('Eslatmalar o\'chirildi', '🔕');
    }
    saveToStorage();
  });
  
  elements.reminderTimeInput.addEventListener('change', (e) => {
    state.reminderConfig.time = e.target.value;
    saveToStorage();
  });
  
  // Reset demo data
  elements.btnResetDemo.addEventListener('click', () => {
    if (confirm('Barcha namunaviy ma\'lumotlar qayta tiklansinmi?')) {
      state.habits = DEFAULT_HABITS;
      state.logs = {};
      saveToStorage();
      renderApp();
      showToast('Qayta tiklandi', '🔄');
    }
  });
}

function switchTab(tabId) {
  elements.tabContents.forEach(tab => {
    if (tab.id === tabId) {
      tab.classList.remove('hidden');
    } else {
      tab.classList.add('hidden');
    }
  });
  
  elements.navButtons.forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.className = 'nav-btn flex flex-col items-center justify-center py-1 text-indigo-400';
    } else {
      btn.className = 'nav-btn flex flex-col items-center justify-center py-1 text-slate-400 hover:text-white';
    }
  });
}

// --- NOTIFICATION & REMINDER RUNNER ---
function setupReminderChecker() {
  setInterval(() => {
    if (!state.reminderConfig.enabled) return;
    const now = new Date();
    const currentHours = ('0' + now.getHours()).slice(-2);
    const currentMinutes = ('0' + now.getMinutes()).slice(-2);
    const currentTimeStr = `${currentHours}:${currentMinutes}`;
    
    if (currentTimeStr === state.reminderConfig.time && now.getSeconds() < 10) {
      const todayLogs = state.logs[getTodayString()] || {};
      const activeHabits = state.habits.filter(h => h.active !== false);
      let uncompleted = 0;
      activeHabits.forEach(h => {
        if (!todayLogs[h.id] || todayLogs[h.id].status !== 'completed') {
          uncompleted++;
        }
      });
      
      if (uncompleted > 0 && Notification.permission === 'granted') {
        new Notification('Odatlarim eslatmasi 🎯', {
          body: `Bugun hali bajarilmagan ${uncompleted} ta odatingiz bor. Kunni g'alaba bilan yakunlang!`,
          icon: './icons/icon-192.svg'
        });
      }
    }
  }, 10000);
}

// --- UTILS ---
function getTodayString() {
  return formatDateKey(new Date());
}

function formatDateKey(dateObj) {
  const y = dateObj.getFullYear();
  const m = ('0' + (dateObj.getMonth() + 1)).slice(-2);
  const d = ('0' + dateObj.getDate()).slice(-2);
  return `${y}-${m}-${d}`;
}

function parseDateKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function showToast(msg, icon = '✅') {
  elements.toastText.textContent = msg;
  elements.toastIcon.textContent = icon;
  elements.toast.classList.remove('hidden');
  elements.toast.classList.add('flex');
  
  setTimeout(() => {
    elements.toast.classList.add('hidden');
    elements.toast.classList.remove('flex');
  }, 2600);
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(() => console.log('PWA Service Worker faol'))
      .catch((err) => console.log('SW xatosi:', err));
  }
}

// Start
document.addEventListener('DOMContentLoaded', initApp);
