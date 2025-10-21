document.addEventListener('DOMContentLoaded', () => {

    // --- DATA STORE (DATABASE SIMULATION) ---
    const db = {
        bank: {
            totalBalance: 1550000,
            totalLoans: 350000
        },
        customers: [
            { id: 1, name: "Aarav Sharma", accountNumber: "CORP0012345", balance: 75000, transactions: [{ date: "2025-10-20", description: "Initial Deposit", amount: 75000, balanceAfter: 75000 }] },
            { id: 2, name: "Priya Patel", accountNumber: "CORP0054321", balance: 120000, transactions: [{ date: "2025-10-20", description: "Initial Deposit", amount: 120000, balanceAfter: 120000 }] },
            { id: 3, name: "Rohan Kumar", accountNumber: "CORP0098765", balance: 45000, transactions: [
                { date: "2025-10-18", description: "Initial Deposit", amount: 10000, balanceAfter: 10000 },
                { date: "2025-10-20", description: "Loan Disbursal", amount: 50000, balanceAfter: 60000 },
                { date: "2025-10-21", description: "ATM Withdrawal", amount: -15000, balanceAfter: 45000 }
            ]}
        ]
    };

    let activeCustomerId = null;
    let balanceChart = null; // To hold the chart instance

    // --- DOM ELEMENT REFERENCES ---
    const customerListEl = document.getElementById('customer-list');
    const bankTotalBalanceEl = document.getElementById('bank-total-balance');
    const bankTotalLoansEl = document.getElementById('bank-total-loans');
    const customerDetailsSectionEl = document.getElementById('customer-details-section');
    const welcomeMessageEl = document.getElementById('welcome-message');
    const customerNameEl = document.getElementById('customer-name');
    const customerAccountNumberEl = document.getElementById('customer-account-number');
    const customerCurrentBalanceEl = document.getElementById('customer-current-balance');
    const passbookBodyEl = document.getElementById('passbook-body');
    
    // Forms
    const depositForm = document.getElementById('deposit-form');
    const withdrawalForm = document.getElementById('withdrawal-form');
    const loanForm = document.getElementById('loan-form');

    // Modals
    const feedbackModal = document.getElementById('feedback-modal');
    const modalMessage = document.getElementById('modal-message');
    const addCustomerModal = document.getElementById('add-customer-modal');
    const addCustomerForm = document.getElementById('add-customer-form');

    // Buttons
    const addCustomerBtn = document.getElementById('add-customer-btn');
    const closeButtons = document.querySelectorAll('.modal-close-btn');

    // --- UTILITY & FORMATTING FUNCTIONS ---
    const formatCurrency = (amount) => `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const getTodayDate = () => new Date().toISOString().split('T')[0];

    // --- RENDER FUNCTIONS (Updating the UI) ---
    const renderCustomerList = () => {
        customerListEl.innerHTML = '';
        db.customers.forEach(customer => {
            const li = document.createElement('li');
            li.textContent = customer.name;
            li.dataset.customerId = customer.id;
            if (customer.id === activeCustomerId) {
                li.classList.add('active');
            }
            customerListEl.appendChild(li);
        });
    };

    const renderBankStats = () => {
        bankTotalBalanceEl.textContent = formatCurrency(db.bank.totalBalance);
        bankTotalLoansEl.textContent = formatCurrency(db.bank.totalLoans);
    };

    const renderCustomerDetails = () => {
        if (!activeCustomerId) {
            customerDetailsSectionEl.classList.add('hidden');
            welcomeMessageEl.classList.remove('hidden');
            return;
        }

        const customer = db.customers.find(c => c.id === activeCustomerId);
        if (!customer) return;

        customerDetailsSectionEl.classList.remove('hidden');
        welcomeMessageEl.classList.add('hidden');

        customerNameEl.textContent = customer.name;
        customerAccountNumberEl.textContent = `A/C: ${customer.accountNumber}`;
        customerCurrentBalanceEl.textContent = formatCurrency(customer.balance);
        renderPassbook(customer);
        renderBalanceChart(customer);
    };
    
    const renderPassbook = (customer) => {
        passbookBodyEl.innerHTML = '';
        [...customer.transactions].reverse().forEach(tx => {
            const row = document.createElement('tr');
            
            let amountClass = 'transaction-initial';
            if (tx.description.toLowerCase().includes('loan')) amountClass = 'transaction-loan';
            else if (tx.amount > 0) amountClass = 'transaction-deposit';
            else if (tx.amount < 0) amountClass = 'transaction-withdrawal';

            row.innerHTML = `
                <td>${tx.date}</td>
                <td>${tx.description}</td>
                <td class="${amountClass}">${formatCurrency(tx.amount)}</td>
                <td>${formatCurrency(tx.balanceAfter)}</td>
            `;
            passbookBodyEl.appendChild(row);
        });
    };

    const renderBalanceChart = (customer) => {
        const ctx = document.getElementById('balance-history-chart').getContext('2d');
        const labels = customer.transactions.map(tx => tx.date);
        const data = customer.transactions.map(tx => tx.balanceAfter);

        if (balanceChart) {
            balanceChart.destroy();
        }

        balanceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Balance History',
                    data: data,
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#F9FAFB',
                    pointRadius: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: (value) => formatCurrency(value),
                            color: '#9CA3AF'
                        },
                        grid: { color: 'rgba(75, 85, 99, 0.5)' }
                    },
                    x: {
                        ticks: { color: '#9CA3AF' },
                        grid: { display: false }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    };

    // --- TRANSACTION & CUSTOMER LOGIC ---
    const createNewCustomer = (name, initialDeposit) => {
        const newId = db.customers.length > 0 ? Math.max(...db.customers.map(c => c.id)) + 1 : 1;
        const newAccountNumber = `CORP00${10000 + newId}`;
        const newCustomer = {
            id: newId,
            name,
            accountNumber: newAccountNumber,
            balance: initialDeposit,
            transactions: [{
                date: getTodayDate(),
                description: 'Initial Deposit',
                amount: initialDeposit,
                balanceAfter: initialDeposit
            }]
        };
        db.customers.push(newCustomer);
        db.bank.totalBalance += initialDeposit;
        
        activeCustomerId = newId;
        showModal(`Successfully created account for ${name} with A/C No: ${newAccountNumber}.`);
        updateAllUI();
    };

    const performTransaction = (customerId, amount, type) => {
        const customer = db.customers.find(c => c.id === customerId);
        if (!customer) return;

        let description = '', displayAmount = amount;
        
        switch (type) {
            case 'deposit':
                customer.balance += amount;
                db.bank.totalBalance += amount;
                description = 'Deposit via Teller';
                break;
            case 'withdrawal':
                if (amount > customer.balance) {
                    showModal(`Transaction Failed: Insufficient funds for ${customer.name}.`);
                    return;
                }
                customer.balance -= amount;
                db.bank.totalBalance -= amount;
                description = 'ATM Withdrawal';
                displayAmount = -amount;
                break;
            case 'loan':
                customer.balance += amount;
                db.bank.totalLoans += amount;
                description = 'Loan Sanction';
                break;
        }

        customer.transactions.push({
            date: getTodayDate(),
            description: description,
            amount: displayAmount,
            balanceAfter: customer.balance
        });
        
        showModal(`${description} of ${formatCurrency(amount)} successful for ${customer.name}.`);
        updateAllUI();
    };
    
    // --- MODAL LOGIC ---
    const showModal = (message) => {
        modalMessage.textContent = message;
        feedbackModal.classList.remove('hidden');
    };
    
    const hideFeedbackModal = () => feedbackModal.classList.add('hidden');
    const showAddCustomerModal = () => addCustomerModal.classList.remove('hidden');
    const hideAddCustomerModal = () => addCustomerModal.classList.add('hidden');

    // --- EVENT LISTENERS ---
    customerListEl.addEventListener('click', (e) => {
        if (e.target && e.target.nodeName === "LI") {
            activeCustomerId = parseInt(e.target.dataset.customerId);
            updateAllUI();
        }
    });

    depositForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('deposit-amount').value);
        if (amount > 0 && activeCustomerId) {
            performTransaction(activeCustomerId, amount, 'deposit');
            depositForm.reset();
        }
    });

    withdrawalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('withdrawal-amount').value);
        if (amount > 0 && activeCustomerId) {
            performTransaction(activeCustomerId, amount, 'withdrawal');
            withdrawalForm.reset();
        }
    });
    
    loanForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('loan-amount').value);
        if (amount > 0 && activeCustomerId) {
            performTransaction(activeCustomerId, amount, 'loan');
            loanForm.reset();
        }
    });
    
    addCustomerBtn.addEventListener('click', showAddCustomerModal);
    
    addCustomerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('new-customer-name').value;
        const initialDeposit = parseFloat(document.getElementById('initial-deposit').value);
        if (name && initialDeposit >= 0) {
            createNewCustomer(name, initialDeposit);
            addCustomerForm.reset();
            hideAddCustomerModal();
        }
    });
    
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            hideFeedbackModal();
            hideAddCustomerModal();
        });
    });

    // --- INITIALIZATION ---
    const updateAllUI = () => {
        renderBankStats();
        renderCustomerList();
        renderCustomerDetails();
    };

    // Initial load
    updateAllUI();
});

