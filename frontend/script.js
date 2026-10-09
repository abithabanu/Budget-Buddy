
/* ---------------- LOGIN CHECK ---------------- */
if (localStorage.getItem("loggedIn") !== "true") {
    window.location.href = "login.html";
}

const userEmail = localStorage.getItem("userEmail");

if (document.getElementById("userEmail")) {
    document.getElementById("userEmail").textContent =
        "👤 " + (userEmail || "");
}

let expenseChart;
let barChart;
let transactions = [];

/* ---------------- DATE FORMAT ---------------- */
function formatDate(value) {
    if (!value) return "";

    const date = new Date(value);

    if (isNaN(date.getTime())) {
        return String(value).split("T")[0];
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

/* ---------------- INITIALIZE ---------------- */
window.onload = function () {
    loadTransactions();
};

/* ---------------- ADD TRANSACTION ---------------- */
function addTransaction() {
    const type = document.getElementById("type").value;
    const category = document.getElementById("category").value.trim();
    const amount = Number(document.getElementById("amount").value);
    const date = document.getElementById("date").value;
    const userId = localStorage.getItem("userId");

    if (!userId) {
        alert("Please log in again.");
        logout();
        return;
    }

    if (!type || !category || !date || !Number.isFinite(amount) || amount <= 0) {
        alert("Please enter valid transaction details.");
        return;
    }

    fetch("http://localhost:5000/addTransaction", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            user_id: Number(userId),
            type: type,
            category: category,
            amount: amount,
            transaction_date: date
        })
    })
    .then(async response => {
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to add transaction.");
        }

        return data;
    })
    .then(data => {
        alert(data.message || "Transaction added successfully.");

        document.getElementById("type").value = "";
        document.getElementById("category").value = "";
        document.getElementById("amount").value = "";
        document.getElementById("date").value = "";

        loadTransactions();
    })
    .catch(error => {
        console.error("Add transaction error:", error);
        alert(error.message || "Could not connect to the backend.");
    });
}

/* ---------------- LOAD TRANSACTIONS ---------------- */
function loadTransactions() {
    const userId = localStorage.getItem("userId");

    if (!userId) {
        transactions = [];
        logout();
        return;
    }

    fetch(`http://localhost:5000/getTransactions/${encodeURIComponent(userId)}`)
    .then(async response => {
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load transactions.");
        }

        if (!Array.isArray(data)) {
            throw new Error("Unexpected transaction data received.");
        }

        return data;
    })
    .then(data => {
        transactions = data.map(t => ({
            id: Number(t.id),
            user_id: Number(t.user_id),
            type: t.type,
            category: t.category,
            amount: Number(t.amount),
            date: formatDate(t.transaction_date)
        }));

        displayTransactions();
        calculateSummary();
        updateChart();
        updateBarChart();
    })
    .catch(error => {
        console.error("Load transactions error:", error);
        alert("Unable to load transactions. Check whether the backend is running.");
    });
}

/* ---------------- DISPLAY TRANSACTIONS ---------------- */
function displayTransactions() {
    const table = document.getElementById("transactionTable");

    if (!table) return;

    const searchElement = document.getElementById("search");
    const filterElement = document.getElementById("filter");

    const searchText = searchElement
        ? searchElement.value.toLowerCase().trim()
        : "";

    const filterValue = filterElement
        ? filterElement.value
        : "All";

    table.innerHTML = "";

    const filtered = transactions.filter(t => {
        const matchesSearch =
            t.category.toLowerCase().includes(searchText);

        const matchesType =
            filterValue === "All" || t.type === filterValue;

        return matchesSearch && matchesType;
    });

    if (filtered.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="6">No transactions found.</td>
            </tr>
        `;
        return;
    }

    filtered.forEach(t => {
        const row = document.createElement("tr");

        [t.type, t.category, `₹${t.amount}`, t.date].forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        const actions = document.createElement("td");

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.className = "edit-btn";
        editButton.onclick = () => editTransaction(t.id);

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-btn";
        deleteButton.onclick = () => deleteTransaction(t.id);

        actions.appendChild(editButton);
        actions.appendChild(document.createTextNode(" "));
        actions.appendChild(deleteButton);

        row.appendChild(actions);
        table.appendChild(row);
    });
}

/* ---------------- EDIT TRANSACTION ---------------- */
function editTransaction(transactionId) {
    const transaction = transactions.find(
        t => t.id === Number(transactionId)
    );

    if (!transaction) {
        alert("Transaction not found.");
        return;
    }

    const newType = prompt(
        "Enter type: Income or Expense",
        transaction.type
    );

    if (newType === null) return;

    const type = newType.trim();

    if (type !== "Income" && type !== "Expense") {
        alert("Type must be Income or Expense.");
        return;
    }

    const newCategory = prompt(
        "Enter category:",
        transaction.category
    );

    if (newCategory === null) return;

    const category = newCategory.trim();

    if (!category) {
        alert("Category cannot be empty.");
        return;
    }

    const newAmount = prompt(
        "Enter amount:",
        String(transaction.amount)
    );

    if (newAmount === null) return;

    const amount = Number(newAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Please enter a valid amount greater than zero.");
        return;
    }

    const newDate = prompt(
        "Enter date (YYYY-MM-DD):",
        transaction.date
    );

    if (newDate === null) return;

    const date = newDate.trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        alert("Please enter the date in YYYY-MM-DD format.");
        return;
    }

    fetch(`http://localhost:5000/editTransaction/${transaction.id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            type: type,
            category: category,
            amount: amount,
            transaction_date: date
        })
    })
    .then(async response => {
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to edit transaction.");
        }

        return data;
    })
    .then(data => {
        alert(data.message || "Transaction updated successfully.");
        loadTransactions();
    })
    .catch(error => {
        console.error("Edit transaction error:", error);
        alert(error.message || "Could not connect to the backend.");
    });
}

/* ---------------- DELETE TRANSACTION ---------------- */
function deleteTransaction(transactionId) {
    const transaction = transactions.find(
        t => t.id === Number(transactionId)
    );

    if (!transaction) {
        alert("Transaction not found.");
        return;
    }

    const confirmed = confirm(
        `Delete ${transaction.category} - ₹${transaction.amount}?`
    );

    if (!confirmed) return;

    fetch(`http://localhost:5000/deleteTransaction/${transaction.id}`, {
        method: "DELETE"
    })
    .then(async response => {
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to delete transaction.");
        }

        return data;
    })
    .then(data => {
        alert(data.message || "Transaction deleted successfully.");
        loadTransactions();
    })
    .catch(error => {
        console.error("Delete transaction error:", error);
        alert(error.message || "Could not connect to the backend.");
    });
}

/* ---------------- SUMMARY ---------------- */
function calculateSummary() {
    let income = 0;
    let expense = 0;

    transactions.forEach(t => {
        if (t.type === "Income") {
            income += t.amount;
        } else if (t.type === "Expense") {
            expense += t.amount;
        }
    });

    const balance = income - expense;

    const values = {
        incomeTotal: income,
        expenseTotal: expense,
        balance: balance,
        reportIncome: income,
        reportExpense: expense,
        reportBalance: balance
    };

    Object.entries(values).forEach(([id, value]) => {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = value.toFixed(2);
        }
    });
}

/* ---------------- CLEAR ALL TRANSACTIONS ---------------- */
async function clearAllTransactions() {
    if (transactions.length === 0) {
        alert("There are no transactions to delete.");
        return;
    }

    const confirmed = confirm(
        "Are you sure you want to permanently delete all your transactions?"
    );

    if (!confirmed) return;

    try {
        const results = await Promise.all(
            transactions.map(async t => {
                const response = await fetch(
                    `http://localhost:5000/deleteTransaction/${t.id}`,
                    { method: "DELETE" }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || `Could not delete transaction ${t.id}.`
                    );
                }

                return data;
            })
        );

        alert("Your transactions have been deleted.");
        loadTransactions();
    } catch (error) {
        console.error("Clear transactions error:", error);
        alert(
            "Some transactions may not have been deleted. Refreshing the list."
        );
        loadTransactions();
    }
}

/* ---------------- PIE CHART ---------------- */
function updateChart() {
    const data = {};

    transactions.forEach(t => {
        if (t.type === "Expense") {
            data[t.category] =
                (data[t.category] || 0) + t.amount;
        }
    });

    const ctx = document.getElementById("expenseChart");

    if (!ctx || typeof Chart === "undefined") return;

    if (expenseChart) expenseChart.destroy();

    expenseChart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: [
                    "#6A1B9A",
                    "#8E24AA",
                    "#AB47BC",
                    "#BA68C8",
                    "#CE93D8",
                    "#E1BEE7"
                ]
            }]
        }
    });
}

/* ---------------- BAR CHART ---------------- */
function updateBarChart() {
    let income = 0;
    let expense = 0;

    transactions.forEach(t => {
        if (t.type === "Income") {
            income += t.amount;
        } else if (t.type === "Expense") {
            expense += t.amount;
        }
    });

    const ctx = document.getElementById("barChart");

    if (!ctx || typeof Chart === "undefined") return;

    if (barChart) barChart.destroy();

    barChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Income", "Expense"],
            datasets: [{
                label: "Amount (₹)",
                data: [income, expense],
                backgroundColor: ["#8E24AA", "#CE93D8"]
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

/* ---------------- DARK MODE ---------------- */
const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
}

function toggleTheme() {
    document.body.classList.toggle("dark-mode");

    const theme = document.body.classList.contains("dark-mode")
        ? "dark"
        : "light";

    localStorage.setItem("theme", theme);
}

/* ---------------- CSV EXPORT ---------------- */
function exportCSV() {
    if (transactions.length === 0) {
        alert("No transactions to export!");
        return;
    }

    const escapeCSV = value =>
        `"${String(value).replace(/"/g, '""')}"`;

    let csv = "Type,Category,Amount,Date\n";

    transactions.forEach(t => {
        csv += [
            escapeCSV(t.type),
            escapeCSV(t.category),
            escapeCSV(t.amount),
            escapeCSV(t.date)
        ].join(",") + "\n";
    });

    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "BudgetBuddy.csv";
    a.click();

    URL.revokeObjectURL(url);
}

/* ---------------- PDF EXPORT ---------------- */
function cleanText(text) {
    return String(text)
        .replace(/₹/g, "Rs ")
        .replace(/[^\x00-\x7F]/g, "");
}

function exportPDF() {
    if (transactions.length === 0) {
        alert("No transactions to export!");
        return;
    }

    if (!window.jspdf) {
        alert("PDF library is not loaded.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.text("BudgetBuddy Report", 20, 20);

    doc.setFont("helvetica", "normal");

    let y = 40;

    transactions.forEach((t, i) => {
        const line =
            `${i + 1}. ${cleanText(t.type)} | ` +
            `${cleanText(t.category)} | Rs ${t.amount} | ${t.date}`;

        const lines = doc.splitTextToSize(line, 170);

        if (y + lines.length * 7 > 280) {
            doc.addPage();
            y = 20;
        }

        doc.text(lines, 20, y);
        y += lines.length * 7 + 3;
    });

    doc.save("BudgetBuddy_Report.pdf");
}

/* ---------------- LOGOUT ---------------- */
function logout() {
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");

    window.location.href = "login.html";
}

/* ---------------- PAGE NAVIGATION ---------------- */
function showPage(pageId) {
    [
        "dashboardPage",
        "transactionPage",
        "chartPage",
        "reportPage"
    ].forEach(id => {
        const page = document.getElementById(id);

        if (page) {
            page.style.display = id === pageId ? "block" : "none";
        }
    });

    if (pageId === "chartPage") {
        setTimeout(() => {
            updateChart();
            updateBarChart();
        }, 100);
    }
}