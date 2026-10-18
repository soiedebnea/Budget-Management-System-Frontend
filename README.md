# Budget Manager: Frontend

React (Vite) app with Recharts charts. It needs the backend running (see `../backend/README.md`).

## Setup
```bash
npm install
npm run dev      # http://localhost:5173
```
Open the URL Vite prints. Do not open `index.html` by double-clicking it.

## Environment variables (`.env`)
| Variable | Example | Purpose |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5000/api` | Backend API address |

Restart `npm run dev` after changing `.env`.

## Features
- Create an account and log in
- Set a spending limit per category for any month
- Add, edit and delete expenses, with optional receipt (image or PDF)
- Edit and remove budgets
- Alerts at 80% and 100% of a category budget
- Remaining-balance summary, bar chart (budget vs spent) and donut chart (spending by category)
- Export the selected month to CSV
- Recurring expenses, added automatically once each month

## File structure
```
frontend/
├── src/
│   ├── main.jsx        # Entry point with error boundary
│   ├── App.jsx         # Main screen: summary, charts, alerts, budgets, expenses
│   ├── Auth.jsx        # Login and register screen
│   ├── Recurring.jsx   # Recurring expenses section
│   ├── api.js          # All backend calls and the login token
│   └── styles.css      # Colors, layout, dark mode
├── index.html          # HTML shell and font link
├── vite.config.js      # Dev server port and proxy
├── .env.example        # Template for .env
├── .gitignore          # node_modules/, dist/, .env
├── package.json
└── README.md
```

## File management
| File | Purpose | Edit when you want to... |
|---|---|---|
| `src/App.jsx` | Main UI and state | Change layout, charts or forms |
| `src/Auth.jsx` | Login and register form | Change sign-in fields or wording |
| `src/Recurring.jsx` | Recurring expense form and list | Change recurring options |
| `src/api.js` | Fetch helpers | Add a call after adding a backend route |
| `src/styles.css` | Theme variables in `:root` | Change colors or fonts |
| `dist/` (generated) | Output of `npm run build` | Deploy it; never edit by hand |

`Auth.jsx` and `Recurring.jsx` must stay in `src/` next to `App.jsx`, which imports them.

## Production
```bash
npm run build
```
Upload `dist/` to any static host. Set `VITE_API_URL` to your deployed API (for example `https://api.example.com/api`) before building, and set `CLIENT_ORIGIN` in the backend `.env` to your frontend URL.

## Troubleshooting
| Problem | Fix |
|---|---|
| Blank page | Run `npm run dev` and open `http://localhost:5173`, not the HTML file |
| "Cannot reach the API" or "Unexpected token '<'" | Start the backend and check `VITE_API_URL`, then restart Vite |
| "React is not defined" | Make sure `App.jsx` starts with `import React, { ... } from "react"` |
| Logged out unexpectedly | The login lasts 7 days, or the backend `JWT_SECRET` changed |
| Old data missing after upgrade | Records from before accounts have no owner; see the backend README |
