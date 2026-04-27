/* ════════════════════════════════════════════════
   ZENITH — Personal Productivity Dashboard
   JavaScript — ES6+
   ════════════════════════════════════════════════ */

/* ══════════════════════════════════
   CONSTANTS & QUOTES
══════════════════════════════════ */
const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it is done.", author: "Nelson Mandela" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Excellence is not a destination but a continuous journey.", author: "Brian Tracy" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Your limitation — it's only your imagination.", author: "Anonymous" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Anonymous" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { text: "The key is not to prioritize what's on your schedule, but to schedule your priorities.", author: "Stephen Covey" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Productivity is never an accident. It is always the result of a commitment to excellence.", author: "Paul J. Meyer" },
];

const CAT_COLORS = {
  personal: '#a78bfa',
  work:     '#60a5fa',
  health:   '#34d399',
  learning: '#fbbf24',
  other:    '#94a3b8',
};

const SECTIONS = ['dashboard', 'todo', 'notes', 'habits', 'settings'];
const SECTION_TITLES = {
  dashboard: 'Dashboard',
  todo: 'Tasks',
  notes: 'Notes',
  habits: 'Habits',
  settings: 'Settings',
};

/* ══════════════════════════════════
   STATE
══════════════════════════════════ */
let state = {
  theme: 'dark',
  accent: '#f59e0b',
  userName: '',
  tasks: [],
  notes: [],
  habits: {},        // { id: { name, color, completions: ['2024-01-01', ...] } }
  currentSection: 'dashboard',
  currentNote: null,
  taskFilter: 'all',
  editingTaskId: null,
  confirmCallback: null,
};

let autosaveTimer = null;
let dragSrcEl = null;

/* ══════════════════════════════════
   STORAGE HELPERS
══════════════════════════════════ */
function saveState() {
  try {
    localStorage.setItem('zenith_state', JSON.stringify({
      theme: state.theme,
      accent: state.accent,
      userName: state.userName,
      tasks: state.tasks,
      notes: state.notes,
      habits: state.habits,
    }));
  } catch (e) {
    console.warn('Storage save failed:', e);
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem('zenith_state');
    if (raw) {
      const saved = JSON.parse(raw);
      Object.assign(state, saved);
    }
  } catch (e) {
    console.warn('Storage load failed:', e);
  }
}

/* ══════════════════════════════════
   UTILITIES
══════════════════════════════════ */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  return dateStr < todayStr();
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `${r}, ${g}, ${b}`;
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

/* Simple markdown renderer */
function renderMarkdown(text) {
  if (!text) return '';
  let html = text
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Code blocks
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Headings
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold / italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Blockquote
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // Unordered list
    .replace(/^\* (.+)$/gm, '<li>$1</li>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Ordered list
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // HR
    .replace(/^---$/gm, '<hr>')
    // Links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    // Line breaks → paragraphs
    .split('\n\n')
    .map(para => {
      para = para.trim();
      if (!para) return '';
      if (/^<(h[1-3]|hr|pre|blockquote|ul|ol|li)/.test(para)) return para;
      // Wrap list items
      if (para.includes('<li>')) return '<ul>' + para + '</ul>';
      return '<p>' + para.replace(/\n/g, '<br>') + '</p>';
    })
    .join('');
  return html;
}

/* ══════════════════════════════════
   TOAST
══════════════════════════════════ */
function toast(message, type = 'info') {
  const icons = { success: '✓', error: '✕', info: '◈' };
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span>${message}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.classList.add('exit');
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

/* ══════════════════════════════════
   CONFIRM MODAL
══════════════════════════════════ */
function showConfirm(title, body, onConfirm) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').textContent = body;
  document.getElementById('modalOverlay').classList.add('active');
  state.confirmCallback = onConfirm;
}

function closeConfirm() {
  document.getElementById('modalOverlay').classList.remove('active');
  state.confirmCallback = null;
}

/* ══════════════════════════════════
   THEME & ACCENT
══════════════════════════════════ */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  state.theme = theme;
  const btn = document.getElementById('settingsThemeBtn');
  if (btn) btn.textContent = theme === 'dark' ? 'Dark Mode' : 'Light Mode';
  // Mobile toggle icon
  const mob = document.getElementById('themeToggleMobile');
  if (mob) mob.textContent = theme === 'dark' ? '☀' : '☽';
}

function applyAccent(hex) {
  state.accent = hex;
  const root = document.documentElement;
  root.style.setProperty('--accent', hex);
  root.style.setProperty('--accent-rgb', hexToRgb(hex));
  // Dim version (darken by ~10%)
  const dim = darkenHex(hex, 20);
  root.style.setProperty('--accent-dim', dim);
}

function darkenHex(hex, amount) {
  let r = parseInt(hex.slice(1,3),16);
  let g = parseInt(hex.slice(3,5),16);
  let b = parseInt(hex.slice(5,7),16);
  r = Math.max(0, r - amount);
  g = Math.max(0, g - amount);
  b = Math.max(0, b - amount);
  return '#' + [r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
}

/* ══════════════════════════════════
   NAVIGATION
══════════════════════════════════ */
function switchSection(id) {
  if (!SECTIONS.includes(id)) return;
  state.currentSection = id;

  // Sections
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(`section-${id}`);
  if (target) target.classList.add('active');

  // Sidebar nav
  document.querySelectorAll('.nav-item').forEach(b => {
    b.classList.toggle('active', b.dataset.section === id);
  });

  // Bottom nav
  document.querySelectorAll('.bottom-nav-item').forEach(b => {
    b.classList.toggle('active', b.dataset.section === id);
  });

  // Topbar title
  document.getElementById('topbarTitle').textContent = SECTION_TITLES[id] || id;

  // Section-specific init
  if (id === 'dashboard') renderDashboard();
  if (id === 'todo') renderTodoList();
  if (id === 'notes') renderNotesList();
  if (id === 'habits') renderHabits();

  // Close sidebar on mobile
  closeSidebar();
}

function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('overlay').classList.add('active');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('active');
}

/* ══════════════════════════════════
   CLOCK & GREETING
══════════════════════════════════ */
function startClock() {
  function tick() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2,'0');
    const m = String(now.getMinutes()).padStart(2,'0');
    const s = String(now.getSeconds()).padStart(2,'0');
    const el = document.getElementById('liveClock');
    if (el) el.textContent = `${h}:${m}:${s}`;
  }
  tick();
  setInterval(tick, 1000);
}

function updateGreeting() {
  const hour = new Date().getHours();
  let g = 'Good evening';
  if (hour < 12) g = 'Good morning';
  else if (hour < 17) g = 'Good afternoon';
  const greetEl = document.getElementById('greeting');
  if (greetEl) greetEl.textContent = g;
  const nameEl = document.getElementById('heroName');
  if (nameEl) nameEl.textContent = state.userName ? `Welcome back, ${state.userName}` : 'Welcome back';
}

function renderQuote() {
  const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  const tEl = document.getElementById('quoteText');
  const aEl = document.getElementById('quoteAuthor');
  if (tEl) tEl.textContent = q.text;
  if (aEl) aEl.textContent = `— ${q.author}`;
}

/* ══════════════════════════════════
   DASHBOARD
══════════════════════════════════ */
function renderDashboard() {
  updateGreeting();

  const total = state.tasks.length;
  const done = state.tasks.filter(t => t.done).length;
  const activeHabits = Object.keys(state.habits).length;
  const notesCount = state.notes.length;

  document.getElementById('statTotalVal').textContent = total;
  document.getElementById('statDoneVal').textContent = done;
  document.getElementById('statHabitsVal').textContent = activeHabits;
  document.getElementById('statNotesVal').textContent = notesCount;

  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  document.getElementById('progressPct').textContent = `${pct}%`;
  document.getElementById('progressBarFill').style.width = `${pct}%`;

  // Pending badge
  const pending = state.tasks.filter(t => !t.done).length;
  const badge = document.getElementById('pendingBadge');
  if (badge) {
    badge.textContent = pending > 0 ? pending : '';
    badge.style.display = pending > 0 ? 'inline-block' : 'none';
  }

  // Recent tasks (last 5)
  const list = document.getElementById('recentTasksList');
  if (list) {
    const recent = [...state.tasks].reverse().slice(0, 5);
    if (recent.length === 0) {
      list.innerHTML = `<div class="empty-state"><span class="empty-icon">◻</span><p>No tasks yet — add one above</p></div>`;
    } else {
      list.innerHTML = recent.map(t => `
        <div class="recent-task-item ${t.done ? 'done' : ''}">
          <span class="recent-task-dot" style="background:${CAT_COLORS[t.category] || '#888'}"></span>
          <span class="recent-task-text">${escHtml(t.text)}</span>
          ${t.due ? `<span style="font-size:12px;color:var(--text-muted)">${formatDate(t.due)}</span>` : ''}
        </div>
      `).join('');
    }
  }
}

/* ══════════════════════════════════
   TO-DO
══════════════════════════════════ */
function addTask(text, category, due) {
  text = text.trim();
  if (!text) { toast('Please enter a task', 'error'); return false; }
  const task = { id: uid(), text, category: category || 'personal', due: due || '', done: false, createdAt: Date.now() };
  state.tasks.push(task);
  saveState();
  renderTodoList();
  renderDashboard();
  toast('Task added', 'success');
  return true;
}

function deleteTask(id) {
  state.tasks = state.tasks.filter(t => t.id !== id);
  saveState();
  renderTodoList();
  renderDashboard();
  toast('Task deleted', 'info');
}

function toggleTask(id) {
  const t = state.tasks.find(t => t.id === id);
  if (t) {
    t.done = !t.done;
    saveState();
    renderTodoList();
    renderDashboard();
  }
}

function openEditTask(id) {
  const t = state.tasks.find(t => t.id === id);
  if (!t) return;
  state.editingTaskId = id;
  document.getElementById('editTaskInput').value = t.text;
  document.getElementById('editTaskCategory').value = t.category;
  document.getElementById('editTaskDue').value = t.due || '';
  document.getElementById('editModalOverlay').classList.add('active');
}

function saveEditTask() {
  const id = state.editingTaskId;
  const t = state.tasks.find(t => t.id === id);
  if (!t) return;
  const newText = document.getElementById('editTaskInput').value.trim();
  if (!newText) { toast('Task text cannot be empty', 'error'); return; }
  t.text = newText;
  t.category = document.getElementById('editTaskCategory').value;
  t.due = document.getElementById('editTaskDue').value;
  saveState();
  renderTodoList();
  renderDashboard();
  document.getElementById('editModalOverlay').classList.remove('active');
  toast('Task updated', 'success');
}

function getFilteredTasks() {
  switch (state.taskFilter) {
    case 'pending':   return state.tasks.filter(t => !t.done);
    case 'completed': return state.tasks.filter(t => t.done);
    default:          return state.tasks;
  }
}

function renderTodoList() {
  const list = document.getElementById('todoList');
  if (!list) return;
  const tasks = getFilteredTasks();

  if (tasks.length === 0) {
    list.innerHTML = `<div class="empty-state"><span class="empty-icon">◻</span><p>${state.taskFilter === 'all' ? 'No tasks yet' : 'No ' + state.taskFilter + ' tasks'}</p></div>`;
    return;
  }

  list.innerHTML = tasks.map(t => `
    <div class="todo-item ${t.done ? 'done' : ''}" draggable="true" data-id="${t.id}">
      <button class="todo-check" data-id="${t.id}" aria-label="Toggle complete">
        ${t.done ? '✓' : ''}
      </button>
      <div class="todo-content">
        <div class="todo-text">${escHtml(t.text)}</div>
        <div class="todo-meta">
          <span class="todo-cat cat-${t.category}">${t.category}</span>
          ${t.due ? `<span class="todo-due ${isOverdue(t.due) && !t.done ? 'overdue' : ''}">${isOverdue(t.due) && !t.done ? '⚠ ' : ''}${formatDate(t.due)}</span>` : ''}
        </div>
      </div>
      <div class="todo-actions">
        <button class="todo-action-btn" data-edit="${t.id}" title="Edit">✎</button>
        <button class="todo-action-btn del" data-del="${t.id}" title="Delete">✕</button>
      </div>
    </div>
  `).join('');

  // Attach drag-and-drop
  list.querySelectorAll('.todo-item').forEach(el => {
    el.addEventListener('dragstart', onDragStart);
    el.addEventListener('dragover', onDragOver);
    el.addEventListener('drop', onDrop);
    el.addEventListener('dragend', onDragEnd);
  });

  // Update pending badge
  const pending = state.tasks.filter(t => !t.done).length;
  const badge = document.getElementById('pendingBadge');
  if (badge) {
    badge.textContent = pending > 0 ? pending : '';
    badge.style.display = pending > 0 ? 'inline-block' : 'none';
  }
}

/* Drag and drop */
function onDragStart(e) {
  dragSrcEl = this;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', this.dataset.id);
  setTimeout(() => this.classList.add('dragging'), 0);
}

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  document.querySelectorAll('.todo-item').forEach(el => el.classList.remove('drag-over'));
  this.classList.add('drag-over');
}

function onDrop(e) {
  e.preventDefault();
  if (dragSrcEl === this) return;
  const srcId = e.dataTransfer.getData('text/plain');
  const dstId = this.dataset.id;
  const srcIdx = state.tasks.findIndex(t => t.id === srcId);
  const dstIdx = state.tasks.findIndex(t => t.id === dstId);
  if (srcIdx < 0 || dstIdx < 0) return;
  const [removed] = state.tasks.splice(srcIdx, 1);
  state.tasks.splice(dstIdx, 0, removed);
  saveState();
  renderTodoList();
}

function onDragEnd() {
  document.querySelectorAll('.todo-item').forEach(el => {
    el.classList.remove('dragging', 'drag-over');
  });
}

/* ══════════════════════════════════
   NOTES
══════════════════════════════════ */
function createNote() {
  const note = {
    id: uid(),
    title: 'Untitled Note',
    content: '',
    updatedAt: Date.now(),
  };
  state.notes.unshift(note);
  saveState();
  renderNotesList();
  openNote(note.id);
  toast('New note created', 'success');
}

function openNote(id) {
  const note = state.notes.find(n => n.id === id);
  if (!note) return;
  state.currentNote = id;

  document.getElementById('notesPlaceholder').classList.add('hidden');
  document.getElementById('notesEditorPane').classList.remove('hidden');

  document.getElementById('noteTitleInput').value = note.title;
  document.getElementById('noteEditor').value = note.content;
  document.getElementById('notePreview').innerHTML = renderMarkdown(note.content);

  // Active highlight in list
  document.querySelectorAll('.note-list-item').forEach(el => {
    el.classList.toggle('active', el.dataset.id === id);
  });

  document.getElementById('autosaveIndicator').textContent = 'Saved';
}

function saveCurrentNote() {
  if (!state.currentNote) return;
  const note = state.notes.find(n => n.id === state.currentNote);
  if (!note) return;
  note.title = document.getElementById('noteTitleInput').value.trim() || 'Untitled Note';
  note.content = document.getElementById('noteEditor').value;
  note.updatedAt = Date.now();
  // Move to top
  const idx = state.notes.findIndex(n => n.id === note.id);
  if (idx > 0) { state.notes.splice(idx, 1); state.notes.unshift(note); }
  saveState();
  renderNotesList();
  // Re-select active
  document.querySelectorAll('.note-list-item').forEach(el => {
    el.classList.toggle('active', el.dataset.id === note.id);
  });
  const ind = document.getElementById('autosaveIndicator');
  ind.textContent = 'Saved ✓';
  ind.classList.remove('saving');
}

function deleteCurrentNote() {
  if (!state.currentNote) return;
  showConfirm('Delete Note', 'Are you sure you want to delete this note?', () => {
    state.notes = state.notes.filter(n => n.id !== state.currentNote);
    state.currentNote = null;
    saveState();
    renderNotesList();
    document.getElementById('notesEditorPane').classList.add('hidden');
    document.getElementById('notesPlaceholder').classList.remove('hidden');
    toast('Note deleted', 'info');
  });
}

function downloadNote() {
  if (!state.currentNote) return;
  const note = state.notes.find(n => n.id === state.currentNote);
  if (!note) return;
  const blob = new Blob([`${note.title}\n${'='.repeat(note.title.length)}\n\n${note.content}`], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${note.title.replace(/[^a-z0-9]/gi,'_')}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Note downloaded', 'success');
}

function renderNotesList() {
  const list = document.getElementById('notesList');
  if (!list) return;
  if (state.notes.length === 0) {
    list.innerHTML = `<div class="empty-state"><span class="empty-icon">◧</span><p>No notes yet</p></div>`;
    return;
  }
  list.innerHTML = state.notes.map(n => {
    const d = new Date(n.updatedAt);
    const dateLabel = d.toLocaleDateString('en-US', { month:'short', day:'numeric' });
    return `
      <div class="note-list-item ${state.currentNote === n.id ? 'active' : ''}" data-id="${n.id}">
        <div class="note-list-title">${escHtml(n.title)}</div>
        <div class="note-list-date">${dateLabel}</div>
      </div>
    `;
  }).join('');
}

/* ══════════════════════════════════
   HABITS
══════════════════════════════════ */
function addHabit(name, color) {
  name = name.trim();
  if (!name) { toast('Please enter a habit name', 'error'); return; }
  const id = uid();
  state.habits[id] = { name, color, completions: [] };
  saveState();
  renderHabits();
  renderDashboard();
  toast('Habit added', 'success');
}

function deleteHabit(id) {
  showConfirm('Delete Habit', 'Delete this habit and all its tracking data?', () => {
    delete state.habits[id];
    saveState();
    renderHabits();
    renderDashboard();
    toast('Habit deleted', 'info');
  });
}

function toggleHabitToday(id) {
  const habit = state.habits[id];
  if (!habit) return;
  const today = todayStr();
  const idx = habit.completions.indexOf(today);
  if (idx >= 0) {
    habit.completions.splice(idx, 1);
  } else {
    habit.completions.push(today);
  }
  saveState();
  renderHabits();
}

function getHabitStreak(habit) {
  if (!habit.completions.length) return 0;
  const sorted = [...habit.completions].sort().reverse();
  const today = todayStr();
  let streak = 0;
  let check = today;
  for (const d of [today, ...getPastDays(90)]) {
    if (sorted.includes(d)) {
      streak++;
      check = d;
    } else if (d === today) {
      // Allow today to be incomplete and still count yesterday
      continue;
    } else {
      break;
    }
  }
  // Recalculate properly
  streak = 0;
  const sortedAsc = [...habit.completions].sort();
  let currentDate = new Date();
  // Check from today backwards
  for (let i = 0; i < 365; i++) {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    if (habit.completions.includes(ds)) {
      streak++;
    } else if (i === 0) {
      // Today not done - check yesterday
      continue;
    } else {
      break;
    }
  }
  return streak;
}

function getPastDays(n) {
  const days = [];
  for (let i = 1; i <= n; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

function renderHabits() {
  const list = document.getElementById('habitsList');
  if (!list) return;
  const ids = Object.keys(state.habits);
  if (ids.length === 0) {
    list.innerHTML = `<div class="empty-state"><span class="empty-icon">◎</span><p>Add your first habit</p></div>`;
    return;
  }

  list.innerHTML = ids.map(id => {
    const habit = state.habits[id];
    const today = todayStr();
    const doneToday = habit.completions.includes(today);
    const streak = getHabitStreak(habit);
    const calHtml = buildHabitCalendar(habit);
    return `
      <div class="habit-card">
        <div class="habit-header">
          <div class="habit-info">
            <span class="habit-dot" style="background:${habit.color}"></span>
            <div>
              <div class="habit-name">${escHtml(habit.name)}</div>
              <div class="habit-streak">🔥 Streak: <span class="streak-value">${streak}</span> day${streak !== 1 ? 's' : ''}</div>
            </div>
          </div>
          <div class="habit-actions">
            <button class="habit-today-btn ${doneToday ? 'done' : 'not-done'}" data-habit="${id}">
              ${doneToday ? '✓ Done today' : 'Mark today'}
            </button>
            <button class="habit-delete-btn" data-del="${id}" title="Delete habit">✕</button>
          </div>
        </div>
        <div class="habit-calendar">
          ${calHtml}
        </div>
      </div>
    `;
  }).join('');
}

function buildHabitCalendar(habit) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = todayStr();
  const monthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const dayNames = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  let html = `<div class="calendar-month-label">${monthName}</div>`;
  html += `<div class="calendar-grid">`;

  // Day headers
  dayNames.forEach(d => { html += `<div class="cal-day-header">${d}</div>`; });

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    html += `<div class="cal-day empty"></div>`;
  }

  // Days
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isCompleted = habit.completions.includes(ds);
    const isToday = ds === today;
    const isFuture = ds > today;
    let cls = 'cal-day';
    let style = '';
    if (isCompleted) { cls += ' completed'; style = `background:${habit.color};color:#1a1814`; }
    if (isToday) cls += ' today';
    if (isFuture) cls += ' future';
    html += `<div class="${cls}" style="${style}" title="${ds}">${d}</div>`;
  }

  html += `</div>`;
  return html;
}

/* ══════════════════════════════════
   SETTINGS
══════════════════════════════════ */
function exportData() {
  const data = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    tasks: state.tasks,
    notes: state.notes,
    habits: state.habits,
    settings: { theme: state.theme, accent: state.accent, userName: state.userName },
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `zenith-backup-${todayStr()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Data exported', 'success');
}

function importData(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.tasks) state.tasks = data.tasks;
      if (data.notes) state.notes = data.notes;
      if (data.habits) state.habits = data.habits;
      if (data.settings) {
        if (data.settings.theme) applyTheme(data.settings.theme);
        if (data.settings.accent) {
          applyAccent(data.settings.accent);
          document.getElementById('accentColorPicker').value = data.settings.accent;
        }
        if (data.settings.userName) {
          state.userName = data.settings.userName;
          document.getElementById('userNameInput').value = data.settings.userName;
        }
      }
      saveState();
      renderDashboard();
      renderTodoList();
      renderNotesList();
      renderHabits();
      toast('Data imported successfully', 'success');
    } catch (err) {
      toast('Invalid JSON file', 'error');
    }
  };
  reader.readAsText(file);
}

function clearAllData() {
  showConfirm('Clear All Data', 'This will permanently delete all tasks, notes, habits, and settings. This cannot be undone.', () => {
    state.tasks = [];
    state.notes = [];
    state.habits = {};
    state.currentNote = null;
    saveState();
    renderDashboard();
    renderTodoList();
    renderNotesList();
    renderHabits();
    // Reset notes UI
    document.getElementById('notesEditorPane').classList.add('hidden');
    document.getElementById('notesPlaceholder').classList.remove('hidden');
    toast('All data cleared', 'info');
  });
}

/* ══════════════════════════════════
   XSS ESCAPE
══════════════════════════════════ */
function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

/* ══════════════════════════════════
   EVENT LISTENERS
══════════════════════════════════ */
function attachEvents() {

  /* ── Navigation ── */
  document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(btn => {
    btn.addEventListener('click', () => switchSection(btn.dataset.section));
  });

  /* ── Sidebar / Mobile ── */
  document.getElementById('menuBtn').addEventListener('click', openSidebar);
  document.getElementById('sidebarClose').addEventListener('click', closeSidebar);
  document.getElementById('overlay').addEventListener('click', closeSidebar);

  /* ── Theme toggles ── */
  document.getElementById('themeToggle').addEventListener('click', () => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    saveState();
  });

  document.getElementById('themeToggleMobile').addEventListener('click', () => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    saveState();
  });

  /* ── Dashboard Quick Add ── */
  document.getElementById('quickAddBtn').addEventListener('click', () => {
    const input = document.getElementById('quickTaskInput');
    if (addTask(input.value, 'personal', '')) input.value = '';
  });

  document.getElementById('quickTaskInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const input = document.getElementById('quickTaskInput');
      if (addTask(input.value, 'personal', '')) input.value = '';
    }
  });

  /* ── To-Do ── */
  document.getElementById('todoAddBtn').addEventListener('click', () => {
    const text = document.getElementById('todoInput').value;
    const cat  = document.getElementById('todoCategorySelect').value;
    const due  = document.getElementById('todoDueDate').value;
    if (addTask(text, cat, due)) {
      document.getElementById('todoInput').value = '';
      document.getElementById('todoDueDate').value = '';
    }
  });

  document.getElementById('todoInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      const text = document.getElementById('todoInput').value;
      const cat  = document.getElementById('todoCategorySelect').value;
      const due  = document.getElementById('todoDueDate').value;
      if (addTask(text, cat, due)) {
        document.getElementById('todoInput').value = '';
        document.getElementById('todoDueDate').value = '';
      }
    }
  });

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.taskFilter = btn.dataset.filter;
      renderTodoList();
    });
  });

  // Todo list delegation
  document.getElementById('todoList').addEventListener('click', (e) => {
    const checkBtn = e.target.closest('.todo-check');
    const editBtn  = e.target.closest('[data-edit]');
    const delBtn   = e.target.closest('[data-del]');
    if (checkBtn) toggleTask(checkBtn.dataset.id);
    if (editBtn)  openEditTask(editBtn.dataset.edit);
    if (delBtn)   {
      showConfirm('Delete Task', 'Delete this task?', () => deleteTask(delBtn.dataset.del));
    }
  });

  // Edit task modal
  document.getElementById('editModalSave').addEventListener('click', saveEditTask);
  document.getElementById('editModalCancel').addEventListener('click', () => {
    document.getElementById('editModalOverlay').classList.remove('active');
  });
  document.getElementById('editModalOverlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('editModalOverlay')) {
      document.getElementById('editModalOverlay').classList.remove('active');
    }
  });

  /* ── Notes ── */
  document.getElementById('newNoteBtn').addEventListener('click', createNote);

  document.getElementById('notesList').addEventListener('click', (e) => {
    const item = e.target.closest('.note-list-item');
    if (item) openNote(item.dataset.id);
  });

  document.getElementById('noteEditor').addEventListener('input', () => {
    // Live preview
    const content = document.getElementById('noteEditor').value;
    document.getElementById('notePreview').innerHTML = renderMarkdown(content);
    // Autosave debounce
    const ind = document.getElementById('autosaveIndicator');
    ind.textContent = 'Saving…';
    ind.classList.add('saving');
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(saveCurrentNote, 1000);
  });

  document.getElementById('noteTitleInput').addEventListener('input', () => {
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(saveCurrentNote, 800);
  });

  document.getElementById('downloadNoteBtn').addEventListener('click', downloadNote);
  document.getElementById('deleteNoteBtn').addEventListener('click', deleteCurrentNote);

  /* ── Habits ── */
  document.getElementById('habitAddBtn').addEventListener('click', () => {
    const name  = document.getElementById('habitInput').value;
    const color = document.getElementById('habitColor').value;
    addHabit(name, color);
    document.getElementById('habitInput').value = '';
  });

  document.getElementById('habitInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const name  = document.getElementById('habitInput').value;
      const color = document.getElementById('habitColor').value;
      addHabit(name, color);
      document.getElementById('habitInput').value = '';
    }
  });

  document.getElementById('habitsList').addEventListener('click', (e) => {
    const todayBtn = e.target.closest('[data-habit]');
    const delBtn   = e.target.closest('[data-del]');
    if (todayBtn) toggleHabitToday(todayBtn.dataset.habit);
    if (delBtn)   deleteHabit(delBtn.dataset.del);
  });

  /* ── Settings ── */
  document.getElementById('settingsThemeBtn').addEventListener('click', () => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    saveState();
  });

  document.getElementById('accentColorPicker').addEventListener('input', (e) => {
    applyAccent(e.target.value);
    saveState();
  });

  document.getElementById('userNameInput').addEventListener('input', (e) => {
    state.userName = e.target.value.trim();
    saveState();
    if (state.currentSection === 'dashboard') updateGreeting();
  });

  document.getElementById('exportDataBtn').addEventListener('click', exportData);

  document.getElementById('importDataBtn').addEventListener('click', () => {
    document.getElementById('importFileInput').click();
  });

  document.getElementById('importFileInput').addEventListener('change', (e) => {
    importData(e.target.files[0]);
    e.target.value = '';
  });

  document.getElementById('clearDataBtn').addEventListener('click', clearAllData);

  /* ── Confirm Modal ── */
  document.getElementById('modalConfirm').addEventListener('click', () => {
    if (state.confirmCallback) state.confirmCallback();
    closeConfirm();
  });

  document.getElementById('modalCancel').addEventListener('click', closeConfirm);

  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modalOverlay')) closeConfirm();
  });

  /* ── Keyboard Shortcuts ── */
  document.addEventListener('keydown', (e) => {
    if (e.altKey) {
      const map = { '1':'dashboard','2':'todo','3':'notes','4':'habits','5':'settings' };
      if (map[e.key]) { e.preventDefault(); switchSection(map[e.key]); }
    }
    if (e.key === 'Escape') {
      document.getElementById('modalOverlay').classList.remove('active');
      document.getElementById('editModalOverlay').classList.remove('active');
      closeSidebar();
    }
  });
}

/* ══════════════════════════════════
   INIT
══════════════════════════════════ */
function init() {
  loadState();

  // Apply persisted theme & accent
  applyTheme(state.theme);
  applyAccent(state.accent);

  // Populate settings fields
  document.getElementById('accentColorPicker').value = state.accent;
  document.getElementById('userNameInput').value = state.userName || '';

  // Clock
  startClock();

  // Quote (rotate daily using date as seed)
  renderQuote();

  // Attach all events
  attachEvents();

  // Initial renders
  renderDashboard();

  // Start on dashboard
  switchSection(state.currentSection || 'dashboard');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
