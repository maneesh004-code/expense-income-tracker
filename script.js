// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Constants and initial data
    const categories = {
        expense: ['Food', 'Transportation', 'Housing', 'Entertainment', 'Utilities', 'Healthcare', 'Education', 'Shopping', 'Personal Care', 'Other'],
        income: ['Salary', 'Freelance', 'Investments', 'Gifts', 'Other']
    };
    
    // DOM Elements
    const transactionForm = document.getElementById('transaction-form');
    const nameInput = document.getElementById('name');
    const amountInput = document.getElementById('amount');
    const typeSelect = document.getElementById('type');
    const categorySelect = document.getElementById('category');
    const dateInput = document.getElementById('date');
    const transactionList = document.getElementById('transaction-list');
    const emptyState = document.getElementById('empty-state');
    const balanceElement = document.getElementById('balance');
    const incomeElement = document.getElementById('income');
    const expensesElement = document.getElementById('expenses');
    const filterTypeSelect = document.getElementById('filter-type');
    const filterCategorySelect = document.getElementById('filter-category');
    const chartElement = document.getElementById('chart');
    const chartTabs = document.querySelectorAll('.chart-tab');
    
    // Set default date to today
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    dateInput.value = formattedDate;
    
    // State
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    let activeChartView = 'category';
    
    // Initialize the app
    function init() {
        populateCategories();
        renderTransactions();
        updateSummary();
        renderChart();
        
        // Set up event listeners
        typeSelect.addEventListener('change', populateCategories);
        transactionForm.addEventListener('submit', addTransaction);
        filterTypeSelect.addEventListener('change', renderTransactions);
        filterCategorySelect.addEventListener('change', renderTransactions);
        
        chartTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                chartTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                activeChartView = this.dataset.chart;
                renderChart();
            });
        });
    }
    
    // Populate category dropdown based on selected type
    function populateCategories() {
        const selectedType = typeSelect.value;
        categorySelect.innerHTML = '<option value="">Select category</option>';
        
        categories[selectedType].forEach(category => {
            const option = document.createElement('option');
            option.value = category.toLowerCase();
            option.textContent = category;
            categorySelect.appendChild(option);
        });
        
        // Also update the filter categories
        updateFilterCategories();
    }
    
    // Update filter categories dropdown
    function updateFilterCategories() {
        const allCategories = [...new Set([...categories.expense, ...categories.income])];
        filterCategorySelect.innerHTML = '<option value="all">All Categories</option>';
        
        allCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.toLowerCase();
            option.textContent = category;
            filterCategorySelect.appendChild(option);
        });
    }
    
    // Add a new transaction
    function addTransaction(e) {
        e.preventDefault();
        
        const transaction = {
            id: generateID(),
            name: nameInput.value,
            amount: parseFloat(amountInput.value),
            type: typeSelect.value,
            category: categorySelect.value,
            date: dateInput.value,
            timestamp: new Date().getTime()
        };
        
        transactions.push(transaction);
        saveTransactions();
        renderTransactions();
        updateSummary();
        renderChart();
        
        // Reset form
        transactionForm.reset();
        dateInput.value = formattedDate;
        populateCategories();
    }
    
    // Delete a transaction
    function deleteTransaction(id) {
        transactions = transactions.filter(transaction => transaction.id !== id);
        saveTransactions();
        renderTransactions();
        updateSummary();
        renderChart();
    }
    
    // Save transactions to localStorage
    function saveTransactions() {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }
    
    // Render transactions in the list
    function renderTransactions() {
        const filterType = filterTypeSelect.value;
        const filterCategory = filterCategorySelect.value;
        
        // Filter transactions
        let filteredTransactions = transactions;
        
        if (filterType !== 'all') {
            filteredTransactions = filteredTransactions.filter(t => t.type === filterType);
        }
        
        if (filterCategory !== 'all') {
            filteredTransactions = filteredTransactions.filter(t => t.category === filterCategory);
        }
        
        // Sort transactions by date (newest first)
        filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Check if there are any transactions
        if (filteredTransactions.length === 0) {
            transactionList.innerHTML = '';
            emptyState.style.display = 'block';
            if (filterType !== 'all' || filterCategory !== 'all') {
                emptyState.innerHTML = '<p>No transactions match your filters.</p>';
            } else {
                emptyState.innerHTML = '<p>No transactions yet. Add your first transaction!</p>';
            }
            transactionList.appendChild(emptyState);
            return;
        }
        
        // Hide empty state
        emptyState.style.display = 'none';
        
        // Clear list and render transactions
        transactionList.innerHTML = '';
        
        filteredTransactions.forEach(transaction => {
            const transactionElement = document.createElement('div');
            transactionElement.classList.add('transaction');
            
            const formattedAmount = formatCurrency(transaction.amount);
            const formattedDate = formatDate(transaction.date);
            
            // First letter of category uppercase
            const categoryDisplayName = transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1);
            
            transactionElement.innerHTML = `
                <div class="transaction-info">
                    <div class="transaction-name">${transaction.name}</div>
                    <div class="transaction-category">${categoryDisplayName}</div>
                    <div class="transaction-date">${formattedDate}</div>
                </div>
                <div class="transaction-amount ${transaction.type}">
                    ${transaction.type === 'income' ? '+' : '-'} ${formattedAmount}
                </div>
                <div class="transaction-actions">
                    <button class="delete-btn">Delete</button>
                </div>
            `;
            
            // Add delete event listener
            const deleteBtn = transactionElement.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => deleteTransaction(transaction.id));
            
            transactionList.appendChild(transactionElement);
        });
    }
    
    // Update summary figures
    function updateSummary() {
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((total, t) => total + t.amount, 0);
        
        const expenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((total, t) => total + t.amount, 0);
        
        const balance = income - expenses;
        
        balanceElement.textContent = formatCurrency(balance);
        incomeElement.textContent = formatCurrency(income);
        expensesElement.textContent = formatCurrency(expenses);
        
        // Change color of balance based on value
        if (balance < 0) {
            balanceElement.style.color = 'var(--danger)';
        } else if (balance > 0) {
            balanceElement.style.color = 'var(--secondary)';
        } else {
            balanceElement.style.color = 'var(--primary)';
        }
    }
    
    // Render chart based on active view
    function renderChart() {
        if (transactions.length === 0) {
            chartElement.innerHTML = '<div class="empty-state"><p>Add transactions to see your spending analysis</p></div>';
            return;
        }
        
        chartElement.innerHTML = '';
        
        if (activeChartView === 'category') {
            renderCategoryChart();
        } else {
            renderMonthlyChart();
        }
    }
    
    // Render category chart
    function renderCategoryChart() {
        // Get expense transactions only
        const expenseTransactions = transactions.filter(t => t.type === 'expense');
        
        if (expenseTransactions.length === 0) {
            chartElement.innerHTML = '<div class="empty-state"><p>Add expense transactions to see category analysis</p></div>';
            return;
        }
        
        // Group by category and sum amounts
        const categoryTotals = {};
        
        expenseTransactions.forEach(transaction => {
            if (!categoryTotals[transaction.category]) {
                categoryTotals[transaction.category] = 0;
            }
            categoryTotals[transaction.category] += transaction.amount;
        });
        
        // Convert to array and sort by amount (highest first)
        const categoryData = Object.entries(categoryTotals)
            .map(([category, amount]) => ({ category, amount }))
            .sort((a, b) => b.amount - a.amount);
        
        // Find the highest amount for scaling
        const maxAmount = Math.max(...categoryData.map(item => item.amount));
        
        // Create chart columns
        categoryData.forEach(item => {
            const heightPercentage = (item.amount / maxAmount) * 100;
            
            // First letter of category uppercase
            const categoryDisplayName = item.category.charAt(0).toUpperCase() + item.category.slice(1);
            
            const column = document.createElement('div');
            column.classList.add('chart-column');
            column.style.height = `${Math.max(heightPercentage, 5)}%`;
            
            column.innerHTML = `
                <div class="chart-value">${formatCurrency(item.amount)}</div>
                <div class="chart-label">${categoryDisplayName}</div>
            `;
            
            chartElement.appendChild(column);
        });
    }
    
    // Render monthly chart
    function renderMonthlyChart() {
        // Get all transactions from the last 6 months
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        
        // Filter transactions within the last 6 months
        const recentTransactions = transactions.filter(t => new Date(t.date) >= sixMonthsAgo);
        
        if (recentTransactions.length === 0) {
            chartElement.innerHTML = '<div class="empty-state"><p>Add transactions to see monthly analysis</p></div>';
            return;
        }
        
        // Group by month and type
        const monthlyData = {};
        
        for (let i = 0; i < 6; i++) {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = `${monthDate.getFullYear()}-${(monthDate.getMonth() + 1).toString().padStart(2, '0')}`;
            const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
            
            monthlyData[monthKey] = {
                month: monthName,
                income: 0,
                expense: 0
            };
        }
        
        recentTransactions.forEach(transaction => {
            const [year, month] = transaction.date.split('-');
            const monthKey = `${year}-${month}`;
            
            if (monthlyData[monthKey]) {
                monthlyData[monthKey][transaction.type] += transaction.amount;
            }
        });
        
        // Convert to array and sort by date (oldest first)
        const sortedMonths = Object.entries(monthlyData)
            .map(([key, data]) => ({ key, ...data }))
            .sort((a, b) => a.key.localeCompare(b.key));
        
        // Find the highest amount for scaling
        const maxAmount = Math.max(
            ...sortedMonths.map(item => Math.max(item.income, item.expense))
        );
        
        // Create chart columns (2 per month - income and expense)
        sortedMonths.forEach(monthData => {
            const monthContainer = document.createElement('div');
            monthContainer.style.display = 'flex';
            monthContainer.style.flexDirection = 'column';
            monthContainer.style.alignItems = 'center';
            monthContainer.style.flex = '1';
            
            // Create income column
            const incomeHeightPercentage = (monthData.income / maxAmount) * 100;
            const incomeColumn = document.createElement('div');
            incomeColumn.classList.add('chart-column');
            incomeColumn.style.height = `${Math.max(incomeHeightPercentage, 5)}%`;
            incomeColumn.style.backgroundColor = 'var(--secondary)';
            incomeColumn.style.width = '45%';
            incomeColumn.style.marginBottom = '10px';
            
            if (monthData.income > 0) {
                incomeColumn.innerHTML = `<div class="chart-value">${formatCurrency(monthData.income)}</div>`;
            }
            
            // Create expense column
            const expenseHeightPercentage = (monthData.expense / maxAmount) * 100;
            const expenseColumn = document.createElement('div');
            expenseColumn.classList.add('chart-column');
            expenseColumn.style.height = `${Math.max(expenseHeightPercentage, 5)}%`;
            expenseColumn.style.backgroundColor = 'var(--danger)';
            expenseColumn.style.width = '45%';
            
            if (monthData.expense > 0) {
                expenseColumn.innerHTML = `<div class="chart-value">${formatCurrency(monthData.expense)}</div>`;
            }
            
            // Month label
            const monthLabel = document.createElement('div');
            monthLabel.classList.add('chart-label');
            monthLabel.textContent = monthData.month;
            monthLabel.style.position = 'static';
            monthLabel.style.marginTop = '5px';
            monthLabel.style.transform = 'none';
            
            // Column container
            const columnContainer = document.createElement('div');
            columnContainer.style.display = 'flex';
            columnContainer.style.justifyContent = 'space-between';
            columnContainer.style.width = '100%';
            columnContainer.appendChild(incomeColumn);
            columnContainer.appendChild(expenseColumn);
            
            monthContainer.appendChild(columnContainer);
            monthContainer.appendChild(monthLabel);
            
            chartElement.appendChild(monthContainer);
        });
        
        // Add legend
        const legend = document.createElement('div');
        legend.style.display = 'flex';
        legend.style.justifyContent = 'center';
        legend.style.gap = '20px';
        legend.style.marginTop = '20px';
        
        const incomeLegend = document.createElement('div');
        incomeLegend.style.display = 'flex';
        incomeLegend.style.alignItems = 'center';
        
        const incomeColor = document.createElement('div');
        incomeColor.style.width = '15px';
        incomeColor.style.height = '15px';
        incomeColor.style.backgroundColor = 'var(--secondary)';
        incomeColor.style.marginRight = '5px';
        
        incomeLegend.appendChild(incomeColor);
        incomeLegend.appendChild(document.createTextNode('Income'));
        
        const expenseLegend = document.createElement('div');
        expenseLegend.style.display = 'flex';
        expenseLegend.style.alignItems = 'center';
        
        const expenseColor = document.createElement('div');
        expenseColor.style.width = '15px';
        expenseColor.style.height = '15px';
        expenseColor.style.backgroundColor = 'var(--danger)';
        expenseColor.style.marginRight = '5px';
        
        expenseLegend.appendChild(expenseColor);
        expenseLegend.appendChild(document.createTextNode('Expense'));
        
        legend.appendChild(incomeLegend);
        legend.appendChild(expenseLegend);
        
        chartElement.appendChild(legend);
    }
    
    // Helper functions
    function generateID() {
        return Math.random().toString(36).substr(2, 9);
    }
    
    function formatCurrency(amount) {
        return '$' + amount.toFixed(2);
    }
    
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }
    
    // Initialize the app
    init();
});