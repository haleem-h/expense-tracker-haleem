# Vault — Expense Tracker

A simple, no-framework expense tracker built with plain HTML, CSS, and JavaScript. Add income or expense transactions, edit or delete them, filter and sort the list, and see your running balance — all saved in the browser's Local Storage, so your data is still there after a refresh.

## Features

- Add a transaction with amount, type (income/expense), category, date, and an optional description
- Edit or delete any transaction
- Live totals: total income, total expenses, and current balance
- Filter transactions by type (income/expense) and by category
- Sort by date or amount
- Data persists across page refreshes using `localStorage`
- Responsive layout — works on desktop and mobile screens
- Basic form validation with inline error messages

## Tech stack

- HTML5
- CSS3 (no framework, fully custom, responsive with media queries)
- Vanilla JavaScript (no libraries, no build step)

There is no backend or database — all data lives in your browser's Local Storage.

## How to run it

No installation or build tools are required.

**Option 1 — just open the file**
1. Download or clone this repository.
2. Double-click `index.html` (or right-click → "Open with" your browser).
3. The app opens directly in your browser and is ready to use.

**Option 2 — using a local server (optional, for a nicer dev experience)**

If you have VS Code, you can use the "Live Server" extension:
1. Open this folder in VS Code.
2. Right-click `index.html` → "Open with Live Server".

Or, using Python (if installed):
```bash
python -m http.server 8000
```
Then open `http://localhost:8000` in your browser.

## Project structure

```
expense-tracker-candidate-name/
├── index.html      # Page structure and form
├── style.css       # Styling and responsive layout
├── script.js       # App logic: add/edit/delete, filtering, localStorage
└── README.md
```

## Notes

- Data is stored per-browser using `localStorage`. Clearing your browser's site data, or opening the app in a different browser/incognito window, will reset the list.
- Currency is displayed in ₹ (INR) by default — this is just a display symbol and can be changed in `script.js` (`formatCurrency` function).
