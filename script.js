// ---------- Storage helpers ----------
// All transactions are saved in the browser's Local Storage under this key,
// as a JSON string. Local Storage persists even after the page is refreshed
// or the browser is closed, until it is explicitly cleared.
const STORAGE_KEY = "ledger_transactions";

function loadTransactions() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("Could not read saved transactions, starting fresh.", e);
    return [];
  }
}

function saveTransactions(transactions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

// ---------- App state ----------
let transactions = loadTransactions();
let editingId = null;

// ---------- Element references ----------
const form = document.getElementById("transactionForm");
const typeInput = document.getElementById("type");
const amountInput = document.getElementById("amount");
const dateInput = document.getElementById("date");
const categoryInput = document.getElementById("category");
const descriptionInput = document.getElementById("description");
const transactionIdInput = document.getElementById("transactionId");
const formError = document.getElementById("formError");
const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

const filterTypeSelect = document.getElementById("filterType");
const filterCategorySelect = document.getElementById("filterCategory");
const sortBySelect = document.getElementById("sortBy");

const ledgerBody = document.getElementById("ledgerBody");
const emptyState = document.getElementById("emptyState");

const balanceValue = document.getElementById("balanceValue");
const incomeValue = document.getElementById("incomeValue");
const expenseValue = document.getElementById("expenseValue");

// Default the date field to today, for convenience.
dateInput.valueAsDate = new Date();

// ---------- Currency formatting ----------
function formatCurrency(amount) {
  return "₹" + Math.abs(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(isoDate) {
  const d = new Date(isoDate + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ---------- Validation ----------
function validateForm({ amount, date, category }) {
  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    return "Please enter an amount greater than zero.";
  }
  if (!date) {
    return "Please choose a date.";
  }
  if (!category || category.trim() === "") {
    return "Please enter a category.";
  }
  return "";
}

// ---------- Form submit (add or save edit) ----------
form.addEventListener("submit", function (e) {
  e.preventDefault();

  const payload = {
    type: typeInput.value,
    amount: parseFloat(amountInput.value),
    date: dateInput.value,
    category: categoryInput.value.trim(),
    description: descriptionInput.value.trim(),
  };

  const errorMessage = validateForm(payload);
  if (errorMessage) {
    formError.textContent = errorMessage;
    return;
  }
  formError.textContent = "";

  if (editingId) {
    // Update existing transaction
    transactions = transactions.map((t) =>
      t.id === editingId ? { ...t, ...payload } : t
    );
    exitEditMode();
  } else {
    // Add new transaction
    transactions.push({
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      ...payload,
    });
  }

  saveTransactions(transactions);
  form.reset();
  dateInput.valueAsDate = new Date();
  refreshCategoryFilterOptions();
  render();
});

cancelEditBtn.addEventListener("click", function () {
  exitEditMode();
  form.reset();
  dateInput.valueAsDate = new Date();
  formError.textContent = "";
});

function enterEditMode(transaction) {
  editingId = transaction.id;
  transactionIdInput.value = transaction.id;
  typeInput.value = transaction.type;
  amountInput.value = transaction.amount;
  dateInput.value = transaction.date;
  categoryInput.value = transaction.category;
  descriptionInput.value = transaction.description;

  formTitle.textContent = "Edit transaction";
  submitBtn.textContent = "Save changes";
  cancelEditBtn.hidden = false;
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function exitEditMode() {
  editingId = null;
  transactionIdInput.value = "";
  formTitle.textContent = "Add a transaction";
  submitBtn.textContent = "Add transaction";
  cancelEditBtn.hidden = true;
}

// ---------- Delete ----------
function deleteTransaction(id) {
  const confirmed = confirm("Delete this transaction? This cannot be undone.");
  if (!confirmed) return;

  transactions = transactions.filter((t) => t.id !== id);
  saveTransactions(transactions);

  if (editingId === id) {
    exitEditMode();
    form.reset();
  }

  refreshCategoryFilterOptions();
  render();
}

// ---------- Filtering & sorting ----------
function refreshCategoryFilterOptions() {
  const categories = Array.from(
    new Set(transactions.map((t) => t.category))
  ).sort((a, b) => a.localeCompare(b));

  const currentValue = filterCategorySelect.value;

  filterCategorySelect.innerHTML = '<option value="all">All categories</option>';
  categories.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    filterCategorySelect.appendChild(opt);
  });

  // Preserve the user's selection if it still exists.
  if (categories.includes(currentValue)) {
    filterCategorySelect.value = currentValue;
  }
}

function getFilteredAndSortedTransactions() {
  const typeFilter = filterTypeSelect.value;
  const categoryFilter = filterCategorySelect.value;
  const sortBy = sortBySelect.value;

  let result = transactions.filter((t) => {
    const matchesType = typeFilter === "all" || t.type === typeFilter;
    const matchesCategory =
      categoryFilter === "all" || t.category === categoryFilter;
    return matchesType && matchesCategory;
  });

  result.sort((a, b) => {
    switch (sortBy) {
      case "date-asc":
        return a.date.localeCompare(b.date);
      case "amount-desc":
        return b.amount - a.amount;
      case "amount-asc":
        return a.amount - b.amount;
      case "date-desc":
      default:
        return b.date.localeCompare(a.date);
    }
  });

  return result;
}

[filterTypeSelect, filterCategorySelect, sortBySelect].forEach((el) =>
  el.addEventListener("change", render)
);

// ---------- Rendering ----------
function render() {
  renderSummary();
  renderLedger();
}

function renderSummary() {
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  balanceValue.textContent = (balance < 0 ? "-" : "") + formatCurrency(balance);
  incomeValue.textContent = formatCurrency(totalIncome);
  expenseValue.textContent = formatCurrency(totalExpense);
}

function renderLedger() {
  const visible = getFilteredAndSortedTransactions();

  ledgerBody.innerHTML = "";

  if (visible.length === 0) {
    emptyState.hidden = false;
    emptyState.textContent =
      transactions.length === 0
        ? "No transactions yet. Add your first one above."
        : "No transactions match the current filters.";
    return;
  }

  emptyState.hidden = true;

  visible.forEach((t) => {
    const row = document.createElement("div");
    row.className = "ledger-row " + t.type;

    row.innerHTML = `
      <span class="col col-date">${formatDate(t.date)}</span>
      <span class="col col-category"><span class="tag">${escapeHtml(t.category)}</span></span>
      <span class="col col-description">${escapeHtml(t.description) || "—"}</span>
      <span class="col col-amount">${t.type === "expense" ? "-" : "+"}${formatCurrency(t.amount)}</span>
      <span class="col col-actions">
        <button class="icon-btn" data-action="edit" data-id="${t.id}">Edit</button>
        <button class="icon-btn" data-action="delete" data-id="${t.id}">Delete</button>
      </span>
    `;

    ledgerBody.appendChild(row);
  });
}

// Basic protection against HTML injection when displaying user-entered text.
function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Event delegation for edit/delete buttons.
ledgerBody.addEventListener("click", function (e) {
  const button = e.target.closest("button[data-action]");
  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.action;

  if (action === "delete") {
    deleteTransaction(id);
  } else if (action === "edit") {
    const transaction = transactions.find((t) => t.id === id);
    if (transaction) enterEditMode(transaction);
  }
});

// ---------- Initial load ----------
refreshCategoryFilterOptions();
render();
