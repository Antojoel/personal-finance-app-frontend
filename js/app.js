document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("transactionForm");
  const transactionList = document.getElementById("transactionList");
  const balanceAmount = document.getElementById("balanceAmount");
  let balance = 0;
  let chart;

  // Load transactions from the server
  loadTransactions();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const description = document.getElementById("description").value;
    const amount = parseFloat(document.getElementById("amount").value);
    const type = document.getElementById("type").value;

    if (description && amount) {
      const transaction = { description, amount, type };
      const success = await addTransaction(transaction);
      if (success) {
        updateBalance(type === "income" ? amount : -amount);
        addTransactionToList(transaction);
        form.reset();
        updateChart();
      }
    }
  });

  async function loadTransactions() {
    try {
      const response = await fetch(
        "https://personal-finance-app-backend.onrender.com/api/transactions"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }
      const transactions = await response.json();
      transactionList.innerHTML = ""; // Clear existing list
      balance = 0; // Reset balance
      transactions.forEach((transaction) => {
        addTransactionToList(transaction);
        updateBalance(
          transaction.type === "income"
            ? transaction.amount
            : -transaction.amount
        );
      });
      initChart(transactions);
    } catch (error) {
      console.error("Error loading transactions:", error);
      alert("Failed to load transactions. Please try again later.");
    }
  }

  async function addTransaction(transaction) {
    try {
      const response = await fetch("http://localhost:3000/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transaction),
      });
      if (!response.ok) {
        throw new Error("Failed to add transaction");
      }
      return true;
    } catch (error) {
      console.error("Error adding transaction:", error);
      alert("Failed to add transaction. Please try again.");
      return false;
    }
  }

  function addTransactionToList(transaction) {
    const li = document.createElement("li");
    li.classList.add(transaction.type);
    li.textContent = `${transaction.description}: ₹${parseFloat(
      transaction.amount
    ).toFixed(2)}`;
    transactionList.appendChild(li);
  }

  function updateBalance(amount) {
    balance += parseFloat(amount);
    balanceAmount.textContent = balance.toFixed(2);
  }

  function initChart(transactions) {
    const ctx = document.getElementById("expenseChart").getContext("2d");
    const chartData = prepareChartData(transactions);

    if (chart) {
      chart.destroy(); // Destroy existing chart if it exists
    }

    chart = new Chart(ctx, {
      type: "pie",
      data: chartData,
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "top",
          },
          title: {
            display: true,
            text: "Expense Breakdown",
          },
        },
      },
    });
  }

  function updateChart() {
    loadTransactions(); // Reload all transactions and update the chart
  }

  function prepareChartData(transactions) {
    const expenseCategories = {};
    transactions.forEach((transaction) => {
      if (transaction.type === "expense") {
        if (expenseCategories[transaction.description]) {
          expenseCategories[transaction.description] += parseFloat(
            transaction.amount
          );
        } else {
          expenseCategories[transaction.description] = parseFloat(
            transaction.amount
          );
        }
      }
    });

    const labels = Object.keys(expenseCategories);
    const data = Object.values(expenseCategories);
    const backgroundColors = generateColors(labels.length);

    return {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: backgroundColors,
        },
      ],
    };
  }

  function generateColors(count) {
    const colors = [];
    for (let i = 0; i < count; i++) {
      colors.push(`hsl(${(i * 360) / count}, 70%, 60%)`);
    }
    return colors;
  }
});
