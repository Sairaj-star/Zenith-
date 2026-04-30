# Zenith - All-in-One Productivity App

Zenith is a modern, offline-first, frontend-only productivity web app built with pure HTML, CSS, and JavaScript.  
It combines task management, notes, habit tracking, focus tools, insights, backups, and a frontend Pro unlock flow.

## Live Concept

- Works fully in browser (no backend required)
- Stores all data in `localStorage`
- Responsive UI for desktop and mobile
- Free + Pro feature gating for monetization-ready UX

## Features

### Dashboard

- Personalized greeting with user name
- Live clock
- Dynamic motivational quote
- Stats for tasks, habits, and notes
- Task completion progress bar
- Daily streak display
- Weekly report (Pro)

### Task Management

- Add, edit, delete tasks
- Categories: personal, work, health, learning, other
- Due dates with due-today/overdue highlighting
- Filters: all, pending, completed
- Drag-and-drop reordering
- Free limit: 15 tasks
- Pro: unlimited tasks

### Notes (Markdown)

- Create, edit, delete notes
- Markdown editor with live preview
- Auto-save behavior
- Export selected note as `.txt` (Pro)
- Free limit: 5 notes
- Pro: unlimited notes + export

### Habit Tracker

- Add habits with custom color tags
- Mark daily completion
- Habit streak tracking
- Habit consistency percentage

### Focus Mode

- Select a pending task
- Distraction-reduced focus interface
- Pomodoro-style timer
- Free: fixed 25 minutes
- Pro: custom duration

### Themes

- Light, Dark, Minimal, Neon, Soft Pastel
- Free: basic themes
- Pro: advanced themes

### PIN Lock (Pro)

- Set/change/disable 4-digit PIN
- App lock screen on load when enabled

### Backup System

- Export full app data as JSON
- Import backup JSON
- In-app backup reminder
- "Auto backup (Pro)" label UI

### Templates

- One-click templates:
  - Daily routine
  - Study plan
  - Workout plan

### Smart Reminders

- Task urgency highlighting
- Optional browser notification support

### Landing + Pro Upgrade Flow

- Intro section with key benefits
- Upgrade modal with UPI QR code
- "I Have Paid" flow with Pro code validation
- `isProUser` stored in `localStorage` after successful unlock

---

## Tech Stack

- HTML5
- CSS3 (custom design system + responsive layout)
- Vanilla JavaScript (ES6+)
- Browser `localStorage`

No framework. No backend. No external database.

---

## Project Structure

```text
ZENITH/
├── index.html
├── style.css
├── script.js
└── README.md
```

---

## Getting Started

1. Clone or download this repository.
2. Open the project folder.
3. Run `index.html` in your browser.
  - Recommended: use VS Code Live Server (or any static server) for best experience.

That’s it. Zenith works fully offline after load.

---

## Configuration

Main configurable values are in `script.js`:

- `PRO_CODE` - Pro unlock code
- `FREE_TASK_LIMIT` - free task cap
- `FREE_NOTE_LIMIT` - free notes cap
- `STORAGE_KEY` - localStorage namespace

Update these constants if you want different plan rules.

---

## Data Persistence

All app data is saved in browser `localStorage`, including:

- User profile preferences
- Tasks
- Notes
- Habits
- Theme and Pro state
- PIN lock preferences

Use the backup export/import feature to move data between devices/browsers.

---

## Notes for Production Use

- This version is intentionally frontend-only.
- Pro verification is client-side and suitable for MVP/demo/local distribution.
- For strong payment and license security at scale, add server-side verification in a future version.

---

## License

Use this project for learning, personal use, or as a base for your own product.  
Add a custom license file if you plan to distribute commercially.