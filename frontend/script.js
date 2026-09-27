if(
    localStorage.getItem("loggedIn")
    !== "true"
){

    window.location.href =
    "login.html";
}

const userEmail =
localStorage.getItem("userEmail");

if(
    document.getElementById("userEmail")
){

    document.getElementById(
        "userEmail"
    ).innerHTML =
    "👤 " + userEmail;
}

let expenseChart;
let barChart;

let transactions = [];

/* INIT */
window.onload = function () {
    loadTransactions();
};

/* ---------------- ADD TRANSACTION ---------------- */
function addTransaction(){

    let type = document.getElementById("type").value;
    let category = document.getElementById("category").value;
    let amount = document.getElementById("amount").value;
    let date = document.getElementById("date").value;

    if(type === "" || category === "" || amount === "" || date === ""){
        alert("Please fill all fields");
        return;
    }

    let transaction = {
        type,
        category,
        amount: Number(amount),
        date
    };

    const userId =
localStorage.getItem("userId");

fetch("http://localhost:5000/addTransaction",{

    method:"POST",

    headers:{
        "Content-Type":"application/json"
    },

    body:JSON.stringify({

        user_id:userId,
        type:type,
        category:category,
        amount:amount,
        transaction_date:date

    })

})

.then(response => response.json())

.then(data => {

    alert(data.message);

    loadTransactions();

})

.catch(error => {
    console.log(error);
});

    document.getElementById("type").value = "";
    document.getElementById("category").value = "";
    document.getElementById("amount").value = "";
    document.getElementById("date").value = "";
}

/* ---------------- DISPLAY ---------------- */
function displayTransactions(){

    let table = document.getElementById("transactionTable");

    let searchText =
    document.getElementById("search").value.toLowerCase();

    let filterValue =
    document.getElementById("filter").value;

    table.innerHTML = "";

    let filtered = transactions.filter(t => {

        return (
            t.category.toLowerCase().includes(searchText) &&
            (filterValue === "All" || t.type === filterValue)
        );
    });

    filtered.forEach(t => {

        table.innerHTML += `
        <tr>
            <td>${t.type}</td>
            <td>${t.category}</td>
            <td>₹${t.amount}</td>
            <td>${t.date}</td>
            <td>
                <button class="delete-btn"
                onclick="deleteTransaction(${transactions.indexOf(t)})">
                Delete
                </button>
            </td>
        </tr>`;
    });
}

/* ---------------- DELETE ---------------- */
function deleteTransaction(index){

    transactions.splice(index,1);

    saveToLocalStorage();

    displayTransactions();
    calculateSummary();
    updateChart();
    updateBarChart();
}

/* ---------------- SUMMARY ---------------- */
function calculateSummary(){

    let income = 0;
    let expense = 0;

    transactions.forEach(t => {
        if(t.type === "Income") income += t.amount;
        else expense += t.amount;
    });

    let balance = income - expense;

    document.getElementById("incomeTotal").textContent = income;
    document.getElementById("expenseTotal").textContent = expense;
    document.getElementById("balance").textContent = balance;

    document.getElementById("reportIncome").textContent = income;
    document.getElementById("reportExpense").textContent = expense;
    document.getElementById("reportBalance").textContent = balance;
}

/* ---------------- LOCAL STORAGE ---------------- */
/*function saveToLocalStorage(){
    localStorage.setItem("transactions", JSON.stringify(transactions));
}*/

/* ---------------- CLEAR ALL ---------------- */
function clearAllTransactions(){

    if(confirm("Are you sure you want to delete all transactions?")){

        transactions = [];

        saveToLocalStorage();

        displayTransactions();
        calculateSummary();
        updateChart();
        updateBarChart();
    }
}

/* ---------------- PIE CHART ---------------- */
function updateChart(){

    let data = {};

    transactions.forEach(t => {
        if(t.type === "Expense"){
            data[t.category] = (data[t.category] || 0) + t.amount;
        }
    });

    let labels = Object.keys(data);
    let values = Object.values(data);

    let ctx = document.getElementById("expenseChart");
    if(!ctx) return;

    if(expenseChart) expenseChart.destroy();

    expenseChart = new Chart(ctx, {
        type: "pie",
        data: {
            labels,
            datasets: [{
                data: values,
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
function updateBarChart(){

    let income = 0;
    let expense = 0;

    transactions.forEach(t => {
        if(t.type === "Income") income += t.amount;
        else expense += t.amount;
    });

    let ctx = document.getElementById("barChart");
    if(!ctx) return;

    if(barChart) barChart.destroy();

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
                y: { beginAtZero: true }
            }
        }
    });
}

/* ---------------- DARK MODE ---------------- */
const savedTheme = localStorage.getItem("theme");

if(savedTheme === "dark"){
    document.body.classList.add("dark-mode");
}

function toggleTheme(){

    document.body.classList.toggle("dark-mode");

    if(document.body.classList.contains("dark-mode")){
        localStorage.setItem("theme","dark");
    } else {
        localStorage.setItem("theme","light");
    }
}

/* ---------------- CSV EXPORT ---------------- */
function exportCSV(){

    if(transactions.length === 0){
        alert("No transactions to export!");
        return;
    }

    let csv = "Type,Category,Amount,Date\n";

    transactions.forEach(t => {
        csv += `${t.type},${t.category},${t.amount},${t.date}\n`;
    });

    let blob = new Blob([csv], { type: "text/csv" });
    let url = URL.createObjectURL(blob);

    let a = document.createElement("a");
    a.href = url;
    a.download = "BudgetBuddy.csv";
    a.click();
}

/* ---------------- PDF EXPORT ---------------- */
function cleanText(text){
    return String(text)
    .replace(/₹/g, "Rs ")
    .replace(/[^\x00-\x7F]/g, ""); 
}

function exportPDF(){

    if(transactions.length === 0){
        alert("No transactions to export!");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.text("BudgetBuddy Report", 20, 20);

    let y = 40;

    transactions.forEach((t, i) => {

        let line =
        `${i+1}. ${cleanText(t.type)} | ${cleanText(t.category)} | Rs ${t.amount} | ${t.date}`;

        doc.text(line, 20, y);

        y += 10;

        if(y > 270){
            doc.addPage();
            y = 20;
        }
    });

    doc.save("BudgetBuddy_Report.pdf");
}

function loadTransactions(){

    const userId =
    localStorage.getItem("userId");

    fetch(
        `http://localhost:5000/getTransactions/${userId}`
    )

    .then(response => response.json())

    .then(data => {

        transactions = data.map(t => ({

            type: t.type,
            category: t.category,
            amount: Number(t.amount),
            date: t.transaction_date

        }));

        displayTransactions();
        calculateSummary();
        updateChart();
        updateBarChart();

    })

    .catch(error => {
        console.log(error);
    });

}

function logout(){

    localStorage.removeItem(
        "loggedIn"
    );

    localStorage.removeItem(
        "userId"
    );

    localStorage.removeItem(
        "userEmail"
    );

    window.location.href =
    "login.html";
}

function showPage(pageId){


document.getElementById("dashboardPage").style.display = "none";
document.getElementById("transactionPage").style.display = "none";
document.getElementById("chartPage").style.display = "none";
document.getElementById("reportPage").style.display = "none";

document.getElementById(pageId).style.display = "block";

if(pageId === "chartPage"){

    setTimeout(() => {

        updateChart();
        updateBarChart();

    }, 100);

}


}
