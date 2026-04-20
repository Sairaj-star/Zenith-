# Zenith — Personal Productivity Dashboard

A modern, fully offline personal productivity web app built with pure HTML, CSS, and Vanilla JavaScript. No frameworks, no APIs, no backend — just open and use.

**[Live Demo →](https://your-username.github.io/zenith)**

---

## Features

### Dashboard
- Live clock updating every second
- Time-aware greeting (morning / afternoon / evening)
- Summary cards — total tasks, completed, active habits, notes
- Task completion progress bar
- Quick-add task input
- Random motivational quotes

### Tasks
- Add, edit, delete tasks
- Mark complete / incomplete
- Drag-and-drop reordering
- 5 color-coded categories — Personal, Work, Health, Learning, Other
- Optional due dates with overdue warnings
- Filter by All / Pending / Completed

### Notes
- Create, edit, delete notes
- Side-by-side Markdown editor with live preview
- Autosave (1-second debounce)
- Export notes as `.txt`

### Habits
- Add habits with a custom color
- One-click daily check-in
- Streak counter
- Monthly calendar view showing completed days

### Settings
- Light / Dark mode toggle
- Custom accent color picker
- Set your name for the dashboard greeting
- Export all data as JSON
- Import data from JSON backup
- Clear all data

---

## Getting Started

### Run locally
Just open `index.html` in any modern browser. No build step, no server needed.

### Deploy to GitHub Pages

1. Create a new GitHub repository
2. Upload `index.html`, `style.css`, and `script.js` to the root
3. Go to **Settings → Pages**
4. Set source to `main` branch, `/ (root)`
5. Your app will be live at `https://your-username.github.io/repo-name`

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Alt + 1` | Dashboard |
| `Alt + 2` | Tasks |
| `Alt + 3` | Notes |
| `Alt + 4` | Habits |
| `Alt + 5` | Settings |
| `Ctrl + Enter` | Add task (while in Tasks) |
| `Escape` | Close modal / sidebar |

---

## Tech Stack

| | |
|---|---|
| HTML | Semantic structure, SPA layout |
| CSS | Custom properties, Glassmorphism, Grid/Flexbox, animations |
| JavaScript | ES6+, localStorage, Drag and Drop API |
| Fonts | DM Serif Display + DM Sans via Google Fonts |

No frameworks. No libraries. No build tools.

---

## Data & Privacy

All data is stored locally in your browser via `localStorage`. Nothing is sent to any server. Exporting a JSON backup is recommended if you clear your browser storage regularly.

---

## File Structure

```
zenith/
├── index.html   — App structure and markup
├── style.css    — All styles, themes, responsive layout
├── script.js    — All logic, state, and storage
└── README.md
```

---

## Screenshots

> Add your own screenshots here after deploying.

---

## License

MIT — free to use, modify, and distribute.
