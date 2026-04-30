const STORAGE_KEY = "zenith_app_state_v1";
const PRO_CODE = "ZNTX-9F4K-7Q2P-LM81";
const FREE_TASK_LIMIT = 15;
const FREE_NOTE_LIMIT = 5;
const BASIC_THEMES = ["light", "dark", "minimal"];
const quotes = [
  "Small progress is still progress.",
  "Consistency beats intensity.",
  "Clarity creates momentum.",
  "Focus on what moves the needle.",
  "Done is better than perfect."
];

const state = loadState();
let selectedSection = "dashboardSection";
let currentTaskFilter = "all";
let selectedNoteId = null;
let focusInterval = null;
let focusSecondsLeft = 0;

const el = {};
const byId = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", init);

function init() {
  cacheDom();
  bindEvents();
  setQuoteOfDay();
  setInterval(updateClock, 1000);
  updateClock();
  applyTheme(state.theme);
  enforceLandingState();
  renderAll();
  requestNotificationPermissionIfWanted();
}

function cacheDom() {
  [
    "landingSection","appShell","startFreeBtn","landingUpgradeBtn","openUpgradeBtn","proBadge","sectionTitle",
    "clockText","quoteText","greetingText","greetingSubtext","totalTasksStat","completedTasksStat","activeHabitsStat","notesCountStat",
    "taskProgressBar","dailyStreakText","weeklyReportCard","weeklyTasksDone","weeklyHabitConsistency","weeklyScore",
    "taskForm","taskTitleInput","taskCategoryInput","taskDueDateInput","taskList","taskLimitNote",
    "newNoteBtn","exportNoteBtn","notesList","noteTitleInput","noteContentInput","notePreviewContent","noteLimitNote",
    "habitForm","habitNameInput","habitColorInput","habitList","focusTaskSelect","focusMinutesInput","startFocusBtn",
    "stopFocusBtn","focusModeOverlay","focusTaskText","focusTimerText","exitFocusBtn","userNameInput","themeSelect",
    "setPinBtn","changePinBtn","disablePinBtn","exportDataBtn","importDataInput","upgradeModal","havePaidBtn",
    "proCodeBlock","proCodeInput","validateProBtn","upgradeMessage","closeUpgradeBtn","pinLockOverlay","pinInput",
    "unlockBtn","pinError","mobileMenuBtn","sidebar","quickTaskInput","quickTaskAddBtn","dashboardRecentTasks"
  ].forEach((id) => (el[id] = byId(id)));
}

function bindEvents() {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => setSection(btn.dataset.section, btn.textContent.trim()));
  });
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentTaskFilter = btn.dataset.filter;
      document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderTasks();
    });
  });
  document.querySelectorAll(".template-btn").forEach((btn) => {
    btn.addEventListener("click", () => applyTemplate(btn.dataset.template));
  });

  el.startFreeBtn.addEventListener("click", startFreeExperience);
  el.landingUpgradeBtn.addEventListener("click", openUpgradeModal);
  el.openUpgradeBtn.addEventListener("click", openUpgradeModal);
  el.closeUpgradeBtn.addEventListener("click", closeUpgradeModal);
  el.havePaidBtn.addEventListener("click", () => el.proCodeBlock.classList.remove("hidden"));
  el.validateProBtn.addEventListener("click", validateProCode);
  el.taskForm.addEventListener("submit", onAddTask);
  el.newNoteBtn.addEventListener("click", createNote);
  el.exportNoteBtn.addEventListener("click", exportSelectedNote);
  el.noteTitleInput.addEventListener("input", updateSelectedNote);
  el.noteContentInput.addEventListener("input", updateSelectedNote);
  el.habitForm.addEventListener("submit", onAddHabit);
  el.startFocusBtn.addEventListener("click", startFocusMode);
  el.stopFocusBtn.addEventListener("click", stopFocusMode);
  el.exitFocusBtn.addEventListener("click", stopFocusMode);
  el.userNameInput.addEventListener("change", (e) => {
    state.userName = e.target.value.trim() || "Friend";
    saveState();
    renderDashboard();
  });
  el.themeSelect.addEventListener("change", onThemeChange);
  el.setPinBtn.addEventListener("click", () => pinAction("set"));
  el.changePinBtn.addEventListener("click", () => pinAction("change"));
  el.disablePinBtn.addEventListener("click", () => pinAction("disable"));
  el.exportDataBtn.addEventListener("click", exportAllData);
  el.importDataInput.addEventListener("change", importAllData);
  el.unlockBtn.addEventListener("click", tryUnlockPin);
  el.mobileMenuBtn.addEventListener("click", () => el.sidebar.classList.toggle("open"));
  el.quickTaskAddBtn.addEventListener("click", onQuickAddTask);
  el.quickTaskInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onQuickAddTask();
    }
  });
}

function loadState() {
  const fallback = {
    hasStarted: false,
    userName: "Friend",
    isProUser: false,
    tasks: [],
    notes: [],
    habits: [],
    theme: "light",
    pinEnabled: false,
    pinCode: "",
    lockOnLoad: false,
    completedTaskDates: [],
    selectedQuoteIndex: 0
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function enforceLandingState() {
  if (state.pinEnabled && state.lockOnLoad) {
    el.pinLockOverlay.classList.remove("hidden");
  }
  if (state.hasStarted) {
    el.landingSection.classList.add("hidden");
    el.appShell.classList.remove("hidden");
  }
}

function startFreeExperience() {
  state.hasStarted = true;
  saveState();
  el.landingSection.classList.add("hidden");
  el.appShell.classList.remove("hidden");
}

function openUpgradeModal() {
  el.upgradeModal.classList.remove("hidden");
  el.upgradeMessage.textContent = state.isProUser ? "You are already a Pro user." : "";
}

function closeUpgradeModal() {
  el.upgradeModal.classList.add("hidden");
  el.proCodeBlock.classList.add("hidden");
  el.proCodeInput.value = "";
}

function validateProCode() {
  const code = el.proCodeInput.value.trim();
  if (code === PRO_CODE) {
    state.isProUser = true;
    saveState();
    el.upgradeMessage.textContent = "Pro unlocked successfully.";
    renderAll();
  } else {
    el.upgradeMessage.textContent = "Invalid Pro code.";
  }
}

function setSection(id, label) {
  selectedSection = id;
  document.querySelectorAll(".section").forEach((sec) => sec.classList.remove("active"));
  document.querySelector(`#${id}`).classList.add("active");
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
  document.querySelector(`.nav-btn[data-section="${id}"]`).classList.add("active");
  el.sectionTitle.textContent = label;
  el.sidebar.classList.remove("open");
}

function updateClock() {
  const now = new Date();
  el.clockText.textContent = now.toLocaleTimeString();
}

function setQuoteOfDay() {
  const prevIndex = Number.isInteger(state.selectedQuoteIndex) ? state.selectedQuoteIndex : -1;
  let nextIndex = Math.floor(Math.random() * quotes.length);
  if (quotes.length > 1 && nextIndex === prevIndex) {
    nextIndex = (nextIndex + 1) % quotes.length;
  }
  state.selectedQuoteIndex = nextIndex;
  saveState();
  el.quoteText.textContent = quotes[state.selectedQuoteIndex];
}

function onAddTask(e) {
  e.preventDefault();
  if (!canAddTask()) return;
  const task = {
    id: cryptoRandomId(),
    title: el.taskTitleInput.value.trim(),
    category: el.taskCategoryInput.value,
    dueDate: el.taskDueDateInput.value || "",
    completed: false,
    createdAt: Date.now()
  };
  if (!task.title) return;
  state.tasks.push(task);
  saveState();
  e.target.reset();
  renderAll();
}

function onQuickAddTask() {
  if (!canAddTask()) return;
  const title = el.quickTaskInput.value.trim();
  if (!title) return;
  state.tasks.unshift({
    id: cryptoRandomId(),
    title,
    category: "other",
    dueDate: "",
    completed: false,
    createdAt: Date.now()
  });
  el.quickTaskInput.value = "";
  saveState();
  renderAll();
}

function renderTasks() {
  el.taskLimitNote.textContent = state.isProUser ? "Pro: Unlimited tasks" : `Free: ${state.tasks.length}/${FREE_TASK_LIMIT} tasks`;
  let tasks = [...state.tasks];
  if (currentTaskFilter === "pending") tasks = tasks.filter((t) => !t.completed);
  if (currentTaskFilter === "completed") tasks = tasks.filter((t) => t.completed);
  el.taskList.innerHTML = "";
  tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = "list-item";
    li.draggable = true;
    li.dataset.id = task.id;
    const dueState = getDueState(task.dueDate, task.completed);
    if (dueState === "overdue") li.classList.add("overdue");
    if (dueState === "today") li.classList.add("due-today");
    li.innerHTML = `
      <div class="task-main">
        <strong>${escapeHtml(task.title)}</strong>
        <span class="meta">${task.category} ${task.dueDate ? "• Due " + task.dueDate : ""}</span>
      </div>
      <div class="task-actions">
        <input type="checkbox" ${task.completed ? "checked" : ""} data-action="toggle" />
        <button class="btn btn-secondary" data-action="edit">Edit</button>
        <button class="btn btn-secondary" data-action="delete">Delete</button>
      </div>
    `;
    li.addEventListener("dragstart", () => li.classList.add("dragging"));
    li.addEventListener("dragend", () => li.classList.remove("dragging"));
    li.addEventListener("click", (event) => onTaskAction(task.id, event));
    el.taskList.appendChild(li);
  });
  enableTaskDnD();
  renderFocusTaskOptions();
  notifyDueTasks();
}

function onTaskAction(taskId, event) {
  const action = event.target.dataset.action;
  if (!action) return;
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) return;
  if (action === "toggle") {
    task.completed = !task.completed;
    if (task.completed) state.completedTaskDates.push(new Date().toISOString());
  }
  if (action === "edit") {
    const title = prompt("Update task title", task.title);
    if (title !== null && title.trim()) task.title = title.trim();
  }
  if (action === "delete") {
    state.tasks = state.tasks.filter((t) => t.id !== taskId);
  }
  saveState();
  renderAll();
}

function enableTaskDnD() {
  el.taskList.addEventListener("dragover", (e) => {
    e.preventDefault();
    const dragging = document.querySelector(".dragging");
    const after = getDragAfterElement(el.taskList, e.clientY);
    if (!dragging) return;
    if (!after) el.taskList.appendChild(dragging);
    else el.taskList.insertBefore(dragging, after);
  });
  el.taskList.addEventListener("drop", () => {
    const ids = [...el.taskList.querySelectorAll(".list-item")].map((n) => n.dataset.id);
    state.tasks.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
    saveState();
  });
}

function getDragAfterElement(container, y) {
  const els = [...container.querySelectorAll(".list-item:not(.dragging)")];
  return els.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) return { offset, element: child };
      return closest;
    },
    { offset: Number.NEGATIVE_INFINITY, element: null }
  ).element;
}

function createNote() {
  if (!state.isProUser && state.notes.length >= FREE_NOTE_LIMIT) {
    showLockedMessage(`Free plan supports up to ${FREE_NOTE_LIMIT} notes.`);
    return;
  }
  const note = { id: cryptoRandomId(), title: "Untitled Note", content: "", updatedAt: Date.now() };
  state.notes.unshift(note);
  selectedNoteId = note.id;
  saveState();
  renderNotes();
}

function renderNotes() {
  el.noteLimitNote.textContent = state.isProUser ? "Pro: Unlimited notes + export" : `Free: ${state.notes.length}/${FREE_NOTE_LIMIT} notes`;
  el.notesList.innerHTML = "";
  state.notes.forEach((note) => {
    const li = document.createElement("li");
    li.className = "list-item";
    li.innerHTML = `
      <div>
        <strong>${escapeHtml(note.title)}</strong>
        <div class="meta">${new Date(note.updatedAt).toLocaleString()}</div>
      </div>
      <div class="task-actions">
        <button class="btn btn-secondary" data-action="open">Open</button>
        <button class="btn btn-secondary" data-action="delete">Delete</button>
      </div>
    `;
    li.addEventListener("click", (e) => {
      const action = e.target.dataset.action;
      if (action === "open") {
        selectedNoteId = note.id;
        fillNoteEditor(note);
      }
      if (action === "delete") {
        state.notes = state.notes.filter((n) => n.id !== note.id);
        if (selectedNoteId === note.id) selectedNoteId = null;
        saveState();
        renderNotes();
      }
    });
    el.notesList.appendChild(li);
  });
  const selected = state.notes.find((n) => n.id === selectedNoteId) || state.notes[0];
  if (selected) {
    selectedNoteId = selected.id;
    fillNoteEditor(selected);
  } else {
    el.noteTitleInput.value = "";
    el.noteContentInput.value = "";
    renderMarkdownPreview("");
  }
}

function fillNoteEditor(note) {
  el.noteTitleInput.value = note.title;
  el.noteContentInput.value = note.content;
  renderMarkdownPreview(note.content);
}

function updateSelectedNote() {
  const note = state.notes.find((n) => n.id === selectedNoteId);
  if (!note) return;
  note.title = el.noteTitleInput.value.trim() || "Untitled Note";
  note.content = el.noteContentInput.value;
  note.updatedAt = Date.now();
  renderMarkdownPreview(note.content);
  saveState();
  renderNotesListOnly();
}

function renderNotesListOnly() {
  el.notesList.innerHTML = "";
  state.notes.forEach((note) => {
    const li = document.createElement("li");
    li.className = "list-item";
    li.innerHTML = `<strong>${escapeHtml(note.title)}</strong><div class="meta">${new Date(note.updatedAt).toLocaleString()}</div>`;
    li.addEventListener("click", () => {
      selectedNoteId = note.id;
      fillNoteEditor(note);
    });
    el.notesList.appendChild(li);
  });
}

function renderMarkdownPreview(md) {
  const html = md
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    .replace(/\*\*(.*)\*\*/gim, "<b>$1</b>")
    .replace(/\*(.*)\*/gim, "<i>$1</i>")
    .replace(/`(.*?)`/gim, "<code>$1</code>")
    .replace(/\n/g, "<br>");
  el.notePreviewContent.innerHTML = html;
}

function exportSelectedNote() {
  if (!state.isProUser) {
    showLockedMessage("Upgrade to Pro to unlock this feature");
    return;
  }
  const note = state.notes.find((n) => n.id === selectedNoteId);
  if (!note) return;
  const blob = new Blob([`${note.title}\n\n${note.content}`], { type: "text/plain" });
  downloadBlob(blob, `${safeFileName(note.title)}.txt`);
}

function onAddHabit(e) {
  e.preventDefault();
  const name = el.habitNameInput.value.trim();
  if (!name) return;
  const habit = { id: cryptoRandomId(), name, color: el.habitColorInput.value, completions: [] };
  state.habits.push(habit);
  saveState();
  e.target.reset();
  renderHabits();
}

function renderHabits() {
  el.habitList.innerHTML = "";
  state.habits.forEach((habit) => {
    const streak = calculateHabitStreak(habit.completions);
    const consistency = calculateConsistency(habit.completions);
    const doneToday = isDateInArray(todayISO(), habit.completions);
    const li = document.createElement("li");
    li.className = "list-item";
    li.innerHTML = `
      <div>
        <strong><span style="color:${habit.color}">●</span> ${escapeHtml(habit.name)}</strong>
        <div class="meta">Streak: ${streak} days • Consistency: ${consistency}%</div>
      </div>
      <div class="habit-actions">
        <button class="btn btn-secondary" data-action="toggle">${doneToday ? "Unmark Today" : "Mark Today"}</button>
        <button class="btn btn-secondary" data-action="delete">Delete</button>
      </div>
    `;
    li.addEventListener("click", (e) => {
      const action = e.target.dataset.action;
      if (action === "toggle") {
        if (doneToday) habit.completions = habit.completions.filter((d) => d !== todayISO());
        else habit.completions.push(todayISO());
      }
      if (action === "delete") state.habits = state.habits.filter((h) => h.id !== habit.id);
      saveState();
      renderAll();
    });
    el.habitList.appendChild(li);
  });
}

function renderFocusTaskOptions() {
  const pending = state.tasks.filter((t) => !t.completed);
  el.focusTaskSelect.innerHTML = pending.map((t) => `<option value="${t.id}">${escapeHtml(t.title)}</option>`).join("");
}

function startFocusMode() {
  const taskId = el.focusTaskSelect.value;
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) return alert("Please create a pending task first.");
  let minutes = 25;
  const requested = Number(el.focusMinutesInput.value || 25);
  if (state.isProUser) minutes = Math.max(1, Math.min(180, requested));
  if (!state.isProUser && requested !== 25) showLockedMessage("Free timer is fixed at 25 minutes.");
  focusSecondsLeft = minutes * 60;
  el.focusTaskText.textContent = `Working on: ${task.title}`;
  el.focusModeOverlay.classList.remove("hidden");
  document.body.classList.add("focus-active");
  updateFocusTimerUI();
  clearInterval(focusInterval);
  focusInterval = setInterval(() => {
    focusSecondsLeft -= 1;
    updateFocusTimerUI();
    if (focusSecondsLeft <= 0) {
      stopFocusMode();
      alert("Focus session complete.");
    }
  }, 1000);
}

function stopFocusMode() {
  clearInterval(focusInterval);
  focusInterval = null;
  el.focusModeOverlay.classList.add("hidden");
  document.body.classList.remove("focus-active");
}

function updateFocusTimerUI() {
  const m = String(Math.floor(focusSecondsLeft / 60)).padStart(2, "0");
  const s = String(focusSecondsLeft % 60).padStart(2, "0");
  el.focusTimerText.textContent = `${m}:${s}`;
}

function onThemeChange(e) {
  const theme = e.target.value;
  if (!state.isProUser && !BASIC_THEMES.includes(theme)) {
    showLockedMessage("Upgrade to Pro to unlock this feature");
    el.themeSelect.value = state.theme;
    return;
  }
  state.theme = theme;
  saveState();
  applyTheme(theme);
}

function applyTheme(theme) {
  document.body.classList.remove("theme-light", "theme-dark", "theme-minimal", "theme-neon", "theme-pastel");
  document.body.classList.add(`theme-${theme}`);
  el.themeSelect.value = theme;
}

function pinAction(mode) {
  if (!state.isProUser) {
    showLockedMessage("Upgrade to Pro to unlock this feature");
    return;
  }
  if (mode === "set") {
    const pin = prompt("Set 4-digit PIN");
    if (!isValidPin(pin)) return alert("Invalid PIN format.");
    state.pinEnabled = true;
    state.pinCode = pin;
    state.lockOnLoad = true;
  }
  if (mode === "change") {
    const oldPin = prompt("Enter current PIN");
    if (oldPin !== state.pinCode) return alert("Incorrect PIN.");
    const newPin = prompt("Enter new 4-digit PIN");
    if (!isValidPin(newPin)) return alert("Invalid PIN format.");
    state.pinCode = newPin;
  }
  if (mode === "disable") {
    const pin = prompt("Enter PIN to disable");
    if (pin !== state.pinCode) return alert("Incorrect PIN.");
    state.pinEnabled = false;
    state.pinCode = "";
    state.lockOnLoad = false;
  }
  saveState();
  alert("PIN settings updated.");
}

function tryUnlockPin() {
  if (el.pinInput.value === state.pinCode) {
    el.pinError.classList.add("hidden");
    el.pinLockOverlay.classList.add("hidden");
    state.lockOnLoad = true;
    saveState();
  } else {
    el.pinError.classList.remove("hidden");
  }
}

function exportAllData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  downloadBlob(blob, "zenith-backup.json");
}

function importAllData(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      Object.assign(state, parsed);
      saveState();
      renderAll();
      alert("Backup imported.");
    } catch {
      alert("Invalid backup file.");
    }
  };
  reader.readAsText(file);
}

function applyTemplate(type) {
  const templates = {
    daily: ["Morning planning", "Deep work block", "Evening reflection"],
    study: ["Read chapter", "Practice questions", "Revision session"],
    workout: ["Warm-up", "Strength training", "Cooldown + stretching"]
  };
  const items = templates[type] || [];
  for (const title of items) {
    if (!state.isProUser && state.tasks.length >= FREE_TASK_LIMIT) break;
    state.tasks.push({ id: cryptoRandomId(), title, category: "other", dueDate: "", completed: false, createdAt: Date.now() });
  }
  saveState();
  renderAll();
}

function renderDashboard() {
  const totalTasks = state.tasks.length;
  const completedTasks = state.tasks.filter((t) => t.completed).length;
  const progress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const streak = calculateDailyTaskStreak();

  el.greetingSubtext.textContent = getGreetingByTime();
  el.greetingText.textContent = `Welcome back, ${state.userName}`;
  el.totalTasksStat.textContent = String(totalTasks);
  el.completedTasksStat.textContent = String(completedTasks);
  el.activeHabitsStat.textContent = String(state.habits.length);
  el.notesCountStat.textContent = String(state.notes.length);
  el.taskProgressBar.style.width = `${progress}%`;
  el.dailyStreakText.textContent = `${streak} Day Streak 🔥`;
  el.userNameInput.value = state.userName;
  renderDashboardRecentTasks();
  renderWeeklyReport();
}

function renderDashboardRecentTasks() {
  if (!el.dashboardRecentTasks) return;
  el.dashboardRecentTasks.innerHTML = "";
  const recentTasks = [...state.tasks].slice(0, 5);
  if (!recentTasks.length) {
    el.dashboardRecentTasks.innerHTML = `<li class="list-item"><span class="meta">No tasks yet. Add your first one.</span></li>`;
    return;
  }
  recentTasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = "list-item";
    li.innerHTML = `
      <div class="task-main">
        <strong>${escapeHtml(task.title)}</strong>
        <span class="meta">${task.category}</span>
      </div>
      <span class="meta">${task.completed ? "Done" : "Pending"}</span>
    `;
    el.dashboardRecentTasks.appendChild(li);
  });
}

function renderWeeklyReport() {
  if (!state.isProUser) {
    el.weeklyReportCard.classList.add("hidden");
    return;
  }
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const weeklyTasks = state.completedTaskDates.filter((d) => new Date(d) >= weekStart).length;
  const habitPct = Math.round(
    state.habits.length
      ? state.habits.reduce((acc, h) => acc + calculateConsistency(h.completions), 0) / state.habits.length
      : 0
  );
  const score = Math.min(100, Math.round(weeklyTasks * 6 + habitPct * 0.4));
  el.weeklyTasksDone.textContent = String(weeklyTasks);
  el.weeklyHabitConsistency.textContent = `${habitPct}%`;
  el.weeklyScore.textContent = String(score);
  el.weeklyReportCard.classList.remove("hidden");
}

function renderProState() {
  el.proBadge.classList.toggle("hidden", !state.isProUser);
}

function renderAll() {
  renderDashboard();
  renderTasks();
  renderNotes();
  renderHabits();
  renderFocusTaskOptions();
  renderProState();
  applyTheme(state.theme);
  if (!state.hasStarted) {
    el.landingSection.classList.remove("hidden");
    el.appShell.classList.add("hidden");
  }
}

function getDueState(dateStr, completed) {
  if (!dateStr || completed) return "none";
  const today = todayISO();
  if (dateStr === today) return "today";
  if (dateStr < today) return "overdue";
  return "none";
}

function notifyDueTasks() {
  if (Notification.permission !== "granted") return;
  state.tasks.forEach((task) => {
    const dueState = getDueState(task.dueDate, task.completed);
    if (dueState === "today") new Notification("Task due today", { body: task.title });
    if (dueState === "overdue") new Notification("Task overdue", { body: task.title });
  });
}

function requestNotificationPermissionIfWanted() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") Notification.requestPermission();
}

function showLockedMessage(message = "Upgrade to Pro to unlock this feature") {
  alert(message);
}

function canAddTask() {
  if (!state.isProUser && state.tasks.length >= FREE_TASK_LIMIT) {
    showLockedMessage(`Free plan supports up to ${FREE_TASK_LIMIT} tasks.`);
    return false;
  }
  return true;
}

function getGreetingByTime() {
  const hour = new Date().getHours();
  if (hour < 12) return "GOOD MORNING";
  if (hour < 17) return "GOOD AFTERNOON";
  if (hour < 21) return "GOOD EVENING";
  return "GOOD NIGHT";
}

function calculateDailyTaskStreak() {
  const dateSet = new Set(state.completedTaskDates.map((d) => d.slice(0, 10)));
  let streak = 0;
  const cursor = new Date();
  while (true) {
    const k = cursor.toISOString().slice(0, 10);
    if (dateSet.has(k)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function calculateHabitStreak(completions) {
  const set = new Set(completions);
  let streak = 0;
  const cursor = new Date();
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (set.has(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function calculateConsistency(completions) {
  const days = 30;
  let done = 0;
  const set = new Set(completions);
  for (let i = 0; i < days; i += 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (set.has(d.toISOString().slice(0, 10))) done += 1;
  }
  return Math.round((done / days) * 100);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function isDateInArray(date, arr) {
  return arr.includes(date);
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function isValidPin(pin) {
  return /^\d{4}$/.test(String(pin || ""));
}

function cryptoRandomId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function safeFileName(name) {
  return name.replace(/[^a-z0-9\-_ ]/gi, "").trim().replace(/\s+/g, "-").toLowerCase() || "note";
}

function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
