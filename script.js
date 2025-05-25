// Main JavaScript for Lending Tracker

// DOM Elements
const balanceCircle = document.getElementById('balance-circle');
const netBalanceEl = document.getElementById('net-balance');
const balanceStatusEl = document.getElementById('balance-status');
const totalOwedEl = document.getElementById('total-owed');
const totalOweEl = document.getElementById('total-owe');
const transactionsTable = document.getElementById('transactions-table');
const transactionsBody = document.getElementById('transactions-body');
const noTransactionsMessage = document.getElementById('no-transactions-message');
const filterSelect = document.getElementById('filter-select');
const searchInput = document.getElementById('search-input');
const addTransactionBtn = document.getElementById('add-transaction-btn');
const transactionModal = document.getElementById('transaction-modal');
const confirmModal = document.getElementById('confirm-modal');
const transactionForm = document.getElementById('transaction-form');
const modalTitle = document.getElementById('modal-title');
const cancelTransactionBtn = document.getElementById('cancel-transaction');
const closeModalBtns = document.querySelectorAll('.close-modal');
const cancelConfirmBtn = document.getElementById('cancel-confirm');
const confirmActionBtn = document.getElementById('confirm-action');

// Global variables
let transactions = [];
let currentTransactionId = null;
let currentAction = null;
let sortConfig = {
    column: 'date',
    direction: 'desc'
};

// Initialize the application
function init() {
    loadTransactions();
    renderTransactions();
    updateSummary();
    setupEventListeners();
}

// Load transactions from localStorage
function loadTransactions() {
    const savedTransactions = localStorage.getItem('lendingTransactions');
    if (savedTransactions) {
        transactions = JSON.parse(savedTransactions);
    }
}

// Save transactions to localStorage
function saveTransactions() {
    localStorage.setItem('lendingTransactions', JSON.stringify(transactions));
}

// Update the summary section
function updateSummary() {
    let totalOwed = 0;
    let totalOwe = 0;
    
    transactions.forEach(transaction => {
        if (transaction.status !== 'paid') {
            if (transaction.type === 'owed') {
                totalOwed += parseFloat(transaction.amount);
            } else {
                totalOwe += parseFloat(transaction.amount);
            }
        }
    });
    
    const netBalance = totalOwed - totalOwe;
    
    // Update text elements
    netBalanceEl.textContent = formatCurrency(netBalance);
    totalOwedEl.textContent = formatCurrency(totalOwed);
    totalOweEl.textContent = formatCurrency(totalOwe);
    
    // Update balance status text
    if (netBalance > 0) {
        balanceStatusEl.textContent = 'Net Positive';
        netBalanceEl.className = 'positive';
    } else if (netBalance < 0) {
        balanceStatusEl.textContent = 'Net Negative';
        netBalanceEl.className = 'negative';
    } else {
        balanceStatusEl.textContent = 'Balanced';
        netBalanceEl.className = '';
    }
    
    // Draw the balance circle
    drawBalanceCircle(totalOwed, totalOwe);
}

// Draw the balance circle visualization
function drawBalanceCircle(totalOwed, totalOwe) {
    const ctx = balanceCircle.getContext('2d');
    const centerX = balanceCircle.width / 2;
    const centerY = balanceCircle.height / 2;
    const radius = 80;
    
    // Clear the canvas
    ctx.clearRect(0, 0, balanceCircle.width, balanceCircle.height);
    
    // If both values are 0, draw a neutral circle
    if (totalOwed === 0 && totalOwe === 0) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.lineWidth = 15;
        ctx.strokeStyle = '#424242'; // Neutral color
        ctx.stroke();
        return;
    }
    
    // Calculate the total and percentages
    const total = totalOwed + totalOwe;
    const owedPercentage = totalOwed / total;
    const owePercentage = totalOwe / total;
    
    // Draw the "owed to me" portion (green)
    if (totalOwed > 0) {
        const owedEndAngle = (2 * Math.PI * owedPercentage) - (Math.PI / 2);
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, -Math.PI / 2, owedEndAngle);
        ctx.lineWidth = 15;
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--positive');
        ctx.stroke();
    }
    
    // Draw the "I owe" portion (red)
    if (totalOwe > 0) {
        const startAngle = totalOwed > 0 ? 
            (2 * Math.PI * owedPercentage) - (Math.PI / 2) : 
            -Math.PI / 2;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, 1.5 * Math.PI);
        ctx.lineWidth = 15;
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--negative');
        ctx.stroke();
    }
    
    // Add inner circle for better aesthetics
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 20, 0, 2 * Math.PI);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-card');
    ctx.fill();
    
    // Add outer circle for better aesthetics
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 5, 0, 2 * Math.PI);
    ctx.lineWidth = 1;
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-color');
    ctx.stroke();
}

// Render transactions in the table
function renderTransactions() {
    // Clear the table body
    transactionsBody.innerHTML = '';
    
    // Get filter and search values
    const filterValue = filterSelect.value;
    const searchValue = searchInput.value.toLowerCase();
    
    // Filter and sort transactions
    let filteredTransactions = transactions.filter(transaction => {
        // Apply type filter
        if (filterValue !== 'all' && transaction.type !== filterValue) {
            return false;
        }
        
        // Apply search filter
        if (searchValue && !transaction.name.toLowerCase().includes(searchValue)) {
            return false;
        }
        
        return true;
    });
    
    // Sort transactions
    filteredTransactions.sort((a, b) => {
        const aValue = a[sortConfig.column];
        const bValue = b[sortConfig.column];
        
        if (sortConfig.column === 'amount') {
            return sortConfig.direction === 'asc' ? 
                parseFloat(aValue) - parseFloat(bValue) : 
                parseFloat(bValue) - parseFloat(aValue);
        } else if (sortConfig.column === 'date') {
            return sortConfig.direction === 'asc' ? 
                new Date(aValue) - new Date(bValue) : 
                new Date(bValue) - new Date(aValue);
        } else {
            return sortConfig.direction === 'asc' ? 
                aValue.localeCompare(bValue) : 
                bValue.localeCompare(aValue);
        }
    });
    
    // Show/hide no transactions message
    if (filteredTransactions.length === 0) {
        noTransactionsMessage.classList.remove('hidden');
        transactionsTable.classList.add('hidden');
    } else {
        noTransactionsMessage.classList.add('hidden');
        transactionsTable.classList.remove('hidden');
        
        // Render each transaction
        filteredTransactions.forEach(transaction => {
            const row = document.createElement('tr');
            
            // Determine amount class based on transaction type
            const amountClass = transaction.type === 'owed' ? 'positive' : 'negative';
            const amountPrefix = transaction.type === 'owed' ? '+' : '-';
            
            // Format the date
            const date = new Date(transaction.date);
            const formattedDate = date.toLocaleDateString('en-GB');
            
            row.innerHTML = `
                <td>${transaction.name}</td>
                <td class="${amountClass}">${amountPrefix}${formatCurrency(transaction.amount)}</td>
                <td>${formattedDate}</td>
                <td>${transaction.description || '-'}</td>
                <td>
                    <span class="status-badge ${transaction.status}">
                        ${transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </span>
                </td>
                <td>
                    <button class="action-btn edit" data-id="${transaction.id}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${transaction.status === 'pending' ? `
                        <button class="action-btn mark-paid" data-id="${transaction.id}" title="Mark as Paid">
                            <i class="fas fa-check-circle"></i>
                        </button>
                    ` : ''}
                    <button class="action-btn delete" data-id="${transaction.id}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            transactionsBody.appendChild(row);
        });
    }
}

// Set up event listeners
function setupEventListeners() {
    // Add transaction button
    addTransactionBtn.addEventListener('click', () => {
        openTransactionModal();
    });
    
    // Close modal buttons
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            transactionModal.style.display = 'none';
            confirmModal.style.display = 'none';
        });
    });
    
    // Cancel transaction button
    cancelTransactionBtn.addEventListener('click', () => {
        transactionModal.style.display = 'none';
    });
    
    // Cancel confirm button
    cancelConfirmBtn.addEventListener('click', () => {
        confirmModal.style.display = 'none';
    });
    
    // Transaction form submission
    transactionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveTransactionFromForm();
    });
    
    // Filter change
    filterSelect.addEventListener('change', renderTransactions);
    
    // Search input
    searchInput.addEventListener('input', renderTransactions);
    
    // Table header sorting
    document.querySelectorAll('th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.getAttribute('data-sort');
            
            // Toggle direction if same column, otherwise set to asc
            if (sortConfig.column === column) {
                sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
            } else {
                sortConfig.column = column;
                sortConfig.direction = 'asc';
            }
            
            renderTransactions();
        });
    });
    
    // Table action buttons (using event delegation)
    transactionsBody.addEventListener('click', (e) => {
        const target = e.target.closest('.action-btn');
        if (!target) return;
        
        const id = target.getAttribute('data-id');
        
        if (target.classList.contains('edit')) {
            openTransactionModal(id);
        } else if (target.classList.contains('delete')) {
            openConfirmModal('delete', id);
        } else if (target.classList.contains('mark-paid')) {
            openConfirmModal('markPaid', id);
        }
    });
    
    // Confirm action button
    confirmActionBtn.addEventListener('click', () => {
        if (currentAction === 'delete') {
            deleteTransaction(currentTransactionId);
        } else if (currentAction === 'markPaid') {
            markTransactionAsPaid(currentTransactionId);
        }
        
        confirmModal.style.display = 'none';
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === transactionModal) {
            transactionModal.style.display = 'none';
        } else if (e.target === confirmModal) {
            confirmModal.style.display = 'none';
        }
    });
}

// Open the transaction modal (for add or edit)
function openTransactionModal(id = null) {
    // Reset the form
    transactionForm.reset();
    
    // Set current date as default
    document.getElementById('transaction-date').valueAsDate = new Date();
    
    if (id) {
        // Edit mode
        const transaction = transactions.find(t => t.id === id);
        if (!transaction) return;
        
        currentTransactionId = id;
        modalTitle.textContent = 'Edit Transaction';
        
        // Fill the form with transaction data
        document.querySelector(`input[name="transaction-type"][value="${transaction.type}"]`).checked = true;
        document.getElementById('person-name').value = transaction.name;
        document.getElementById('amount').value = transaction.amount;
        document.getElementById('transaction-date').value = transaction.date;
        document.getElementById('description').value = transaction.description || '';
        document.getElementById('status').value = transaction.status;
        document.getElementById('transaction-id').value = id;
    } else {
        // Add mode
        currentTransactionId = null;
        modalTitle.textContent = 'Add New Transaction';
        document.getElementById('transaction-id').value = '';
    }
    
    // Show the modal
    transactionModal.style.display = 'block';
}

// Open the confirmation modal
function openConfirmModal(action, id) {
    currentAction = action;
    currentTransactionId = id;
    
    const message = action === 'delete' ? 
        'Are you sure you want to delete this transaction?' : 
        'Are you sure you want to mark this transaction as paid?';
    
    document.getElementById('confirm-message').textContent = message;
    
    // Update button text
    confirmActionBtn.textContent = action === 'delete' ? 'Delete' : 'Mark as Paid';
    confirmActionBtn.className = action === 'delete' ? 'btn danger' : 'btn primary';
    
    // Show the modal
    confirmModal.style.display = 'block';
}

// Save transaction from form data
function saveTransactionFromForm() {
    const type = document.querySelector('input[name="transaction-type"]:checked').value;
    const name = document.getElementById('person-name').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const date = document.getElementById('transaction-date').value;
    const description = document.getElementById('description').value.trim();
    const status = document.getElementById('status').value;
    const id = document.getElementById('transaction-id').value || generateId();
    
    if (!name || isNaN(amount) || amount <= 0 || !date) {
        alert('Please fill in all required fields correctly.');
        return;
    }
    
    const transaction = {
        id,
        type,
        name,
        amount: amount.toFixed(2),
        date,
        description,
        status
    };
    
    if (currentTransactionId) {
        // Update existing transaction
        const index = transactions.findIndex(t => t.id === currentTransactionId);
        if (index !== -1) {
            transactions[index] = transaction;
        }
    } else {
        // Add new transaction
        transactions.push(transaction);
    }
    
    // Save, update UI, and close modal
    saveTransactions();
    renderTransactions();
    updateSummary();
    transactionModal.style.display = 'none';
}

// Delete a transaction
function deleteTransaction(id) {
    const index = transactions.findIndex(t => t.id === id);
    if (index !== -1) {
        transactions.splice(index, 1);
        saveTransactions();
        renderTransactions();
        updateSummary();
    }
}

// Mark a transaction as paid
function markTransactionAsPaid(id) {
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
        transaction.status = 'paid';
        saveTransactions();
        renderTransactions();
        updateSummary();
    }
}

// Helper function to format currency
function formatCurrency(amount) {
    return '£' + parseFloat(amount).toFixed(2);
}

// Helper function to generate a unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
