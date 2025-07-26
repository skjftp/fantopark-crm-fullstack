// ============================================================================
// PAYABLE MANAGEMENT FUNCTIONS - Define early to avoid reference errors
// ============================================================================

// Function to handle recording payment for a payable
window.handleRecordPaymentClick = function(payable) {
    console.log('Recording payment for payable:', payable);
    
    // If submitPayablePayment function exists, use the custom modal
    if (window.submitPayablePayment) {
        // Get currency and amount info
        const currency = payable.original_currency || payable.currency || 'INR';
        const originalAmount = payable.original_amount || payable.amount || 0;
        const paymentHistory = payable.payment_history || [];
        const totalPaid = paymentHistory.reduce((sum, p) => sum + (p.amount_foreign || 0), 0);
        const remainingAmount = originalAmount - totalPaid;
        
        // Check if already fully paid
        if (remainingAmount <= 0) {
            alert('This payable has already been fully paid.');
            return;
        }
        
        // Create payment modal with full functionality
        const modalHtml = `
            <div id="record-payment-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Record Payment</h3>
                    
                    <div class="mb-4 p-3 bg-gray-50 rounded">
                        <p class="text-sm text-gray-600 mb-1">
                            <strong>Vendor:</strong> ${payable.vendor_name || payable.supplierName || 'Unknown Vendor'}
                        </p>
                        <p class="text-sm text-gray-600 mb-1">
                            <strong>Total Amount:</strong> ${currency} ${originalAmount.toLocaleString()}
                        </p>
                        <p class="text-sm text-gray-600 mb-1">
                            <strong>Already Paid:</strong> ${currency} ${totalPaid.toLocaleString()}
                        </p>
                        <p class="text-sm text-gray-900 font-semibold">
                            <strong>Remaining:</strong> ${currency} ${remainingAmount.toLocaleString()}
                        </p>
                    </div>
                    
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Payment Amount (${currency})
                        </label>
                        <input type="number" id="payment-amount" value="${remainingAmount}" 
                               max="${remainingAmount}" step="0.01"
                               class="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <p class="text-xs text-gray-500 mt-1">Max: ${currency} ${remainingAmount.toLocaleString()}</p>
                    </div>
                    
                    ${currency !== 'INR' ? `
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Current Exchange Rate (1 ${currency} = ? INR)
                        </label>
                        <input type="number" id="exchange-rate" value="${payable.exchange_rate || ''}" 
                               step="0.01" placeholder="Enter current exchange rate"
                               class="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <p class="text-xs text-gray-500 mt-1">
                            Original rate: ₹${payable.creation_exchange_rate || payable.exchange_rate || 'N/A'}
                        </p>
                    </div>
                    ` : ''}
                    
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
                        <input type="date" id="payment-date" value="${new Date().toISOString().split('T')[0]}" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-md">
                    </div>
                    
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Reference Number</label>
                        <input type="text" id="reference-number" placeholder="Transaction ID / Cheque Number" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-md">
                    </div>
                    
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                        <textarea id="payment-notes" rows="2" 
                                  class="w-full px-3 py-2 border border-gray-300 rounded-md"></textarea>
                    </div>
                    
                    <div class="flex justify-end gap-2">
                        <button onclick="document.getElementById('record-payment-modal').remove()" 
                                class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">
                            Cancel
                        </button>
                        <button onclick="window.submitPayablePayment('${payable.id}')" 
                                class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                            Record Payment
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to page
        const modalDiv = document.createElement('div');
        modalDiv.innerHTML = modalHtml;
        document.body.appendChild(modalDiv.firstElementChild);
        return;
    }
    
    // Fallback to handleMarkAsPaid if available
    if (window.handleMarkAsPaid) {
        window.handleMarkAsPaid(payable);
        return;
    }
};
    
// Function to open inventory form for payable payment (legacy support)
window.openInventoryFormForPayable = function(payable) {
    // Redirect to handleMarkAsPaid which handles inventory form opening
    if (window.handleMarkAsPaid) {
        window.handleMarkAsPaid(payable);
    } else {
        console.error('handleMarkAsPaid function not found');
        alert('Payment functionality not available. Please refresh the page.');
    }
};

// Function to submit payment for a payable
window.submitPayablePayment = async function(payableId) {
    console.log('submitPayablePayment called with payableId:', payableId);
    
    try {
        const paymentAmount = parseFloat(document.getElementById('payment-amount').value);
        const paymentDate = document.getElementById('payment-date').value;
        const referenceNumber = document.getElementById('reference-number').value;
        const paymentNotes = document.getElementById('payment-notes').value;
        
        console.log('Payment data collected:', {
            paymentAmount,
            paymentDate,
            referenceNumber,
            paymentNotes
        });
        
        // Validate payment amount
        if (!paymentAmount || paymentAmount <= 0) {
            alert('Please enter a valid payment amount');
            return;
        }
        
        // Get exchange rate if applicable
        const exchangeRateInput = document.getElementById('exchange-rate');
        const exchangeRate = exchangeRateInput ? parseFloat(exchangeRateInput.value) : null;
        
        // Use the partial-payment endpoint
        const paymentData = {
            payment_amount: paymentAmount,
            payment_date: paymentDate,
            payment_reference: referenceNumber,
            payment_notes: paymentNotes
        };
        
        // Add exchange rate if foreign currency
        if (exchangeRate) {
            paymentData.payment_exchange_rate = exchangeRate;
        }
        
        console.log('Sending payment data:', paymentData);
        console.log('API URL:', `${window.API_CONFIG.API_URL}/payables/${payableId}/partial-payment`);
        
        const response = await fetch(`${window.API_CONFIG.API_URL}/payables/${payableId}/partial-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('crm_auth_token')}`
            },
            body: JSON.stringify(paymentData)
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to record payment');
        }
        
        const result = await response.json();
        console.log('Payment response result:', result);
        
        // Close modal and show success message
        document.getElementById('record-payment-modal').remove();
        
        // Show detailed payment result
        let message = 'Payment recorded successfully!\n\n';
        
        if (result.data) {
            const { remaining_amount, status, exchange_impact } = result.data;
            
            if (status === 'paid') {
                message += '✅ Payable is now fully paid!\n';
            } else {
                message += `Remaining amount: ${remaining_amount.toFixed(2)}\n`;
            }
            
            if (exchange_impact) {
                message += `\nExchange ${exchange_impact.type}: ₹${exchange_impact.amount.toFixed(2)}`;
                message += `\n(Creation rate: ₹${exchange_impact.creation_rate}, Payment rate: ₹${exchange_impact.payment_rate})`;
            }
        }
        
        alert(message);
        
        // Refresh financial data
        if (window.fetchFinancialData) {
            window.fetchFinancialData();
        }
        
        // Also refresh payment history modal if open
        if (window.showPaymentHistoryModal && window.appState?.financialData?.payables) {
            const updatedPayable = window.appState.financialData.payables.find(p => p.id === payableId);
            if (updatedPayable) {
                // Re-fetch the payable data to get updated payment history
                window.fetchFinancialData().then(() => {
                    const refreshedPayable = window.appState.financialData.payables.find(p => p.id === payableId);
                    if (refreshedPayable) {
                        window.showPaymentHistoryModal(refreshedPayable);
                    }
                });
            }
        }
        
    } catch (error) {
        console.error('Error recording payment:', error);
        alert('Error recording payment: ' + error.message);
    }
};

// Function to delete a payable
window.deletePayable = async function(payableId) {
    if (!confirm('Are you sure you want to delete this payable?')) {
        return;
    }
    
    try {
        const response = await fetch(`${window.API_CONFIG.API_URL}/payables/${payableId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('crm_auth_token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete payable');
        }
        
        alert('Payable deleted successfully');
        
        // Refresh financial data
        if (window.fetchFinancialData) {
            window.fetchFinancialData();
        }
        
    } catch (error) {
        console.error('Error deleting payable:', error);
        alert('Error deleting payable: ' + error.message);
    }
};

// ============================================================================
// RECEIVABLE MANAGEMENT FUNCTIONS
// ============================================================================

// Function to delete a receivable
window.deleteReceivable = async function(receivableId) {
    if (!confirm('Are you sure you want to delete this receivable?')) {
        return;
    }
    
    try {
        const response = await fetch(`${window.API_CONFIG.API_URL}/receivables/${receivableId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('crm_auth_token')}`
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete receivable');
        }
        
        alert('Receivable deleted successfully');
        
        // Refresh financial data
        if (window.fetchFinancialData) {
            window.fetchFinancialData();
        }
        
    } catch (error) {
        console.error('Error deleting receivable:', error);
        alert('Error deleting receivable: ' + error.message);
    }
};

// Function to handle marking payment from receivable
window.handleMarkPaymentFromReceivable = async function(receivable) {
    // Check if there's already a recordPayment function
    if (window.recordPayment) {
        window.recordPayment(receivable.id);
    } else {
        // Fallback implementation
        console.error('recordPayment function not found');
        alert('Payment recording functionality not available. Please refresh the page.');
    }
};

// Override renderFinancials to ensure data is loaded first

const originalRenderFinancials = window.renderFinancials;
window.renderFinancials = function() {

    console.log('🔍 ENHANCED FINANCIALS COMPONENT DEBUG: Starting render');
    
    // Check if financial data needs loading
    const needsDataLoad = !window.appState?.financialData || 
                         (window.appState.financialData.sales.length === 0 && 
                          window.appState.financialData.activeSales.length === 0);
    
    if (needsDataLoad && window.fetchFinancialData) {
        console.log('Financial data empty on render, loading now...');
        window.fetchFinancialData();
        
        // Return loading state while data loads
        return React.createElement('div', { className: 'p-6 text-center' }, 
            'Loading financial data...'
        );
    }
    
    // Check if financial data is empty but orders exist
    const fd = window.appState?.financialData;
    const needsLoading = fd && 
        fd.sales.length === 0 && 
        fd.activeSales.length === 0 && 
        window.orders && 
        window.orders.length > 0;
    
    if (needsLoading) {
        console.log('Financial data empty, loading before render...');
        
        // Load data first, then render
        window.fetchFinancialData().then(() => {
            console.log('Data loaded, rendering financials...');
            originalRenderFinancials.call(this);
        });
        
        // Return loading state
        return React.createElement('div', { className: 'p-6 text-center' }, 
            'Loading financial data...'
        );
    }
    
    // Data already loaded, render normally
    return originalRenderFinancials.call(this);
};

// Main render function for financials dashboard - ENHANCED WITH FIXED PAGINATION
window.renderFinancials = () => {
    console.log('🔍 ENHANCED FINANCIALS COMPONENT DEBUG: Starting render');
    
    // 1. Extract state with fallbacks - PROVEN PATTERN
    const {
        financialData = window.appState?.financialData || {
            activeSales: [],
            sales: [],
            receivables: [],
            payables: [],
            expiringInventory: []
        },
        financialFilters = window.appState?.financialFilters || {
            clientName: '',
            assignedPerson: '',
            dateFrom: '',
            dateTo: '',
            status: 'all'
        },
        activeFinancialTab = window.appState?.activeFinancialTab || 'activesales',
        financialPagination = window.appState?.financialPagination || {
            activesales: { currentPage: 1, itemsPerPage: 10 },
            sales: { currentPage: 1, itemsPerPage: 10 },
            receivables: { currentPage: 1, itemsPerPage: 10 },
            payables: { currentPage: 1, itemsPerPage: 10 },
            expiring: { currentPage: 1, itemsPerPage: 10 },
            bulkpayment: { currentPage: 1, itemsPerPage: 10 }
        },
        setFinancialFilters = window.setFinancialFilters || (() => {
            console.warn("setFinancialFilters not implemented");
        }),
        setActiveFinancialTab = window.setActiveFinancialTab || (() => {
            console.warn("setActiveFinancialTab not implemented");
        })
    } = window.appState || {};

    // Helper function to format tab names for display
    const formatTabName = (tab) => {
        const names = {
            'activesales': 'Active Sales',
            'sales': 'Sales',
            'receivables': 'Receivables',
            'payables': 'Payables',
            'expiring': 'Expiring',
            'bulkpayment': 'Bulk Payment Upload'
        };
        return names[tab] || tab;
    };

    // 2. Apply filters function - ENHANCED FOR TAB-SPECIFIC FILTERING
    const applyFilters = (data) => {
        if (!data || !Array.isArray(data)) return [];
        
        return data.filter(item => {
            // Client/Supplier name filter (tab-specific)
            if (financialFilters.clientName) {
                const nameField = activeFinancialTab === 'payables' ? 'supplier' : 'client';
                const itemName = (item[nameField] || item[`${nameField}_name`] || '').toLowerCase();
                if (!itemName.includes(financialFilters.clientName.toLowerCase())) {
                    return false;
                }
            }
            
            // Date range filter
            if (financialFilters.dateFrom) {
                const itemDate = new Date(item.date || item.due_date || item.created_date);
                const filterDate = new Date(financialFilters.dateFrom);
                if (itemDate < filterDate) return false;
            }
            
            if (financialFilters.dateTo) {
                const itemDate = new Date(item.date || item.due_date || item.created_date);
                const filterDate = new Date(financialFilters.dateTo);
                if (itemDate > filterDate) return false;
            }
            
            // Status filter
            if (financialFilters.status && financialFilters.status !== 'all') {
                if (item.status !== financialFilters.status) return false;
            }
            
            return true;
        });
    };

    // 3. Get paginated data for current tab - FIXED TO USE REACT STATE
    const getCurrentTabData = window.getCurrentTabData = () => {
        let data = [];
        switch (activeFinancialTab) {
            case 'activesales':
                data = applyFilters(financialData.activeSales || []);
                break;
            case 'sales':
                data = applyFilters(financialData.sales || []);
                break;
            case 'receivables':
                data = applyFilters(financialData.receivables || []);
                break;
            case 'payables':
                data = applyFilters(financialData.payables || []);
                break;
            case 'expiring':
                data = window.getEnhancedExpiringInventory();
                break;
            default:
                data = [];
        }
        
        // Apply pagination using React state
        const pagination = financialPagination[activeFinancialTab];
        if (pagination) {
            const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
            const endIndex = startIndex + pagination.itemsPerPage;
            return {
                data: data.slice(startIndex, endIndex),
                totalItems: data.length
            };
        }
        
        return { data, totalItems: data.length };
    };

    const currentTabData = getCurrentTabData();

    // 4. Main component render - ENHANCED WITH STATS AND FILTERS
    return React.createElement('div', { className: 'space-y-6' },
        // Enhanced Stats Cards
        window.renderEnhancedFinancialStats(),
        // Exchange Impact Summary
window.renderExchangeImpactSummary && window.renderExchangeImpactSummary(financialData),                       

        // Compact Filter System
        React.createElement('div', { className: 'bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border' },
            React.createElement('div', { className: 'flex flex-wrap items-center gap-2' },
                // Client/Supplier Name Filter (tab-specific)
                React.createElement('input', {
                    type: 'text',
                    value: financialFilters.clientName || '',
                    onChange: (e) => setFinancialFilters({...financialFilters, clientName: e.target.value}),
                    placeholder: activeFinancialTab === 'payables' ? 'Search supplier...' : 'Search client...',
                    className: 'w-36 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
                }),
                
                // Date filters inline
                React.createElement('span', { className: 'text-sm text-gray-500 ml-2' }, 'From:'),
                React.createElement('input', {
                    type: 'date',
                    value: financialFilters.dateFrom || '',
                    onChange: (e) => setFinancialFilters({...financialFilters, dateFrom: e.target.value}),
                    className: 'px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
                }),
                
                React.createElement('span', { className: 'text-sm text-gray-500' }, 'To:'),
                React.createElement('input', {
                    type: 'date',
                    value: financialFilters.dateTo || '',
                    onChange: (e) => setFinancialFilters({...financialFilters, dateTo: e.target.value}),
                    className: 'px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
                }),
                
                // Status Filter inline
                React.createElement('select', {
                    value: financialFilters.status || 'all',
                    onChange: (e) => setFinancialFilters({...financialFilters, status: e.target.value}),
                    className: 'ml-2 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
                },
                    React.createElement('option', { value: 'all' }, 'All Status'),
                    React.createElement('option', { value: 'pending' }, 'Pending'),
                    React.createElement('option', { value: 'partially_paid' }, 'Partial'),
                    React.createElement('option', { value: 'paid' }, 'Paid'),
                    React.createElement('option', { value: 'overdue' }, 'Overdue')
                ),
                
                // Clear button inline
                React.createElement('button', {
                    onClick: () => setFinancialFilters({
                        clientName: '',
                        assignedPerson: '',
                        dateFrom: '',
                        dateTo: '',
                        status: 'all'
                    }),
                    className: 'ml-auto px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50'
                }, 'Clear')
            )
        ),

        // Main Content Area with Tabs
        React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow' },
            // Tab Navigation - ENHANCED
            React.createElement('div', { className: 'border-b border-gray-200 dark:border-gray-700' },
                React.createElement('nav', { className: '-mb-px flex space-x-8 px-6' },
                    ['activesales', 'sales', 'receivables', 'payables', 'expiring', 'bulkpayment'].map(tab =>
                        React.createElement('button', {
                            key: tab,
                            onClick: () => setActiveFinancialTab(tab),
                            className: `py-4 px-1 border-b-2 font-medium text-sm ${
                                activeFinancialTab === tab
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`
                        }, tab.charAt(0).toUpperCase() + tab.slice(1).replace('activesales', 'Active Sales'))
                    )
                )
            ),

            // Tab Content - ENHANCED WITH WORKING PAGINATION
            React.createElement('div', { className: 'p-6' },
                activeFinancialTab === 'activesales' && (() => {
                    console.log('🔍 Calling renderActiveSalesTab with data:', currentTabData.data);
                    return React.createElement('div', null,
                        window.renderActiveSalesTab(currentTabData.data),
                        window.renderFinancialPagination('activesales', currentTabData.totalItems)
                    );
                })(),
                activeFinancialTab === 'sales' && (() => {
                    console.log('🔍 Calling renderSalesTab with data:', currentTabData.data);
                    return React.createElement('div', null,
                        window.renderSalesTab(currentTabData.data),
                        window.renderFinancialPagination('sales', currentTabData.totalItems)
                    );
                })(),
                activeFinancialTab === 'receivables' && (() => {
                    console.log('🔍 Calling renderReceivablesTab with data:', currentTabData.data);
                    return React.createElement('div', null,
                        window.renderReceivablesTab(currentTabData.data),
                        window.renderFinancialPagination('receivables', currentTabData.totalItems)
                    );
                })(),
                activeFinancialTab === 'payables' && (() => {
                    console.log('🔍 Calling renderPayablesTab with data:', currentTabData.data);
                    return React.createElement('div', null,
                        window.renderPayablesTab(currentTabData.data),
                        window.renderFinancialPagination('payables', currentTabData.totalItems)
                    );
                })(),
                activeFinancialTab === 'expiring' && (() => {
                    console.log('🔍 Calling renderExpiringTab with data:', currentTabData.data);
                    return React.createElement('div', null,
                        window.renderExpiringTab(currentTabData.data),
                        window.renderFinancialPagination('expiring', currentTabData.totalItems)
                    );
                })(),
                activeFinancialTab === 'bulkpayment' && (() => {
                    console.log('🔍 Rendering Bulk Payment Upload tab');
                    if (window.BulkPaymentUpload) {
                        return React.createElement('div', {
                            dangerouslySetInnerHTML: { __html: window.BulkPaymentUpload() }
                        });
                    } else {
                        return React.createElement('div', { className: 'text-center py-8' }, 
                            'Bulk Payment Upload component not loaded'
                        );
                    }
                })()
            )
        )
    );
};
// Hook into tab switching
if (!window.financialsAutoLoader) {
    window.financialsAutoLoader = true;
    
    const originalSetActiveTab = window.setActiveTab;
    window.setActiveTab = function(tab) {
        if (originalSetActiveTab) {
            originalSetActiveTab(tab);
        }
        
        if (tab === 'finance') {
            console.log('Loading financial data for finance tab...');
            setTimeout(() => {
                // Use fetchFinancialData instead of loadFinancialData
                if (window.fetchFinancialData) {
                    window.fetchFinancialData();
                } else if (window.fetchFinancialData) {
                    window.fetchFinancialData();
                }
            }, 100);
        }
    };
    
    // If already on finance tab, load now
    if (window.appState?.activeTab === 'finance') {
        if (window.fetchFinancialData) {
            window.fetchFinancialData();
        }
    }
}

// Enhanced pagination render function - FIXED TO USE REACT STATE
window.renderFinancialPagination = (tabName, totalItems) => {
    // Get pagination state from React state (not window globals)
    const { financialPagination, setFinancialPagination } = window.appState || {};
    
    if (!financialPagination || !setFinancialPagination) {
        console.warn('Financial pagination state not available');
        return null;
    }
    
    const pagination = financialPagination[tabName];
    if (!pagination || totalItems <= pagination.itemsPerPage) return null;

    const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);
    const currentPage = pagination.currentPage;

    // FIXED: Use proper React state setter
    const changePage = (newPage) => {
        console.log(`🔍 Changing ${tabName} page to:`, newPage);
        setFinancialPagination(prev => ({
            ...prev,
            [tabName]: {
                ...prev[tabName],
                currentPage: newPage
            }
        }));
    };

    return React.createElement('div', { className: 'px-6 py-4 border-t border-gray-200 dark:border-gray-700' },
        React.createElement('div', { className: 'flex items-center justify-between' },
            React.createElement('div', { className: 'text-sm text-gray-700 dark:text-gray-300' },
                `Showing ${((currentPage - 1) * pagination.itemsPerPage) + 1} to ${Math.min(currentPage * pagination.itemsPerPage, totalItems)} of ${totalItems} results`
            ),
            React.createElement('div', { className: 'flex items-center space-x-1' },
                React.createElement('button', {
                    onClick: () => changePage(Math.max(1, currentPage - 1)),
                    disabled: currentPage === 1,
                    className: 'px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                }, 'Previous'),
                
                // Page numbers
                Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return React.createElement('button', {
                        key: pageNum,
                        onClick: () => changePage(pageNum),
                        className: `px-3 py-2 text-sm font-medium border ${
                            currentPage === pageNum 
                                ? 'bg-blue-600 text-white border-blue-600' 
                                : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
                        }`
                    }, pageNum);
                }),
                
                React.createElement('button', {
                    onClick: () => changePage(Math.min(totalPages, currentPage + 1)),
                    disabled: currentPage === totalPages,
                    className: 'px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                }, 'Next')
            )
        )
    );
};

// Enhanced Sales Chart Creation - FIXED TO WORK WITH EXISTING SYSTEM
window.createFinancialSalesChart = () => {
    // Wait for Chart.js to be available
    if (!window.Chart) {
        console.log('Chart.js not available, will retry...');
        setTimeout(window.createFinancialSalesChart, 500);
        return;
    }

    const canvas = document.getElementById('financialSalesChart');
    if (!canvas) {
        console.log('Sales chart canvas not found');
        return;
    }

    // Destroy existing chart if it exists
    if (window.financialSalesChartInstance) {
        window.financialSalesChartInstance.destroy();
    }

    // Generate sample data based on current financial data
    const financialData = window.appState?.financialData || {};
    const sales = financialData.sales || financialData.activeSales || [];
    
    // Process sales data for chart or use sample data
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
    const revenueData = [850000, 1200000, 980000, 1450000, 1100000, 1680000, 1350000];
    const countData = [45, 62, 38, 71, 54, 83, 67];

    // If we have real sales data, process it
    if (sales.length > 0) {
        const monthlyData = {};
        sales.forEach(sale => {
            const month = new Date(sale.date || sale.created_date).toLocaleDateString('en-US', { month: 'short' });
            if (!monthlyData[month]) {
                monthlyData[month] = { revenue: 0, count: 0 };
            }
            monthlyData[month].revenue += sale.amount || 0;
            monthlyData[month].count += 1;
        });
    }

    const chartData = {
        labels: labels,
        datasets: [{
            label: 'Revenue (₹)',
            data: revenueData,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4,
            yAxisID: 'y'
        }, {
            label: 'Sales Count',
            data: countData,
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4,
            yAxisID: 'y1'
        }]
    };

    try {
        window.financialSalesChartInstance = new Chart(canvas, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Sales Performance Trend'
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        ticks: {
                            callback: function(value) {
                                return '₹' + (value / 100000).toFixed(1) + 'L';
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: {
                            drawOnChartArea: false,
                        },
                        ticks: {
                            callback: function(value) {
                                return value + ' sales';
                            }
                        }
                    }
                }
            }
        });
        console.log('✅ Financial sales chart created successfully');
    } catch (error) {
        console.error('❌ Failed to create financial sales chart:', error);
    }
};

// Cache for financial data (6 hour cache to match backend)
const financialCache = {
    data: {},
    timestamps: {},
    CACHE_DURATION: 6 * 60 * 60 * 1000, // 6 hours to match backend cache
    // Clear cache function
    clear: function() {
        this.data = {};
        this.timestamps = {};
        console.log('📊 Financial cache cleared');
    },
    // Force refresh function
    forceRefresh: function() {
        this.clear();
    }
};

// Make cache available globally for debugging
window.financialCache = financialCache;

// Helper function to check if cache is valid
const isCacheValid = (period) => {
    const timestamp = financialCache.timestamps[period];
    if (!timestamp) return false;
    return (Date.now() - timestamp) < financialCache.CACHE_DURATION;
};

// Enhanced Financial Stats Component - Multiple time periods
const EnhancedFinancialStats = () => {
    // State for storing metrics for all periods
    const [periodMetrics, setPeriodMetrics] = React.useState({
        current_fy: null,
        current_month: null,
        last_month: null
    });
    const [loadingPeriods, setLoadingPeriods] = React.useState({
        current_fy: true,
        current_month: true,
        last_month: true
    });
    const [lastUpdated, setLastUpdated] = React.useState(null);
    const [nextUpdateIn, setNextUpdateIn] = React.useState(null);
    
    // Fetch metrics for all time periods
    React.useEffect(() => {
        // Don't clear cache on every load - let the 6-hour cache work
        // financialCache.clear();
        
        const fetchAllPeriodMetrics = async () => {
            const periods = ['current_fy', 'current_month', 'last_month'];
            
            // First, set all cached data immediately
            periods.forEach(period => {
                if (isCacheValid(period)) {
                    console.log(`📊 Using cached data for ${period}`);
                    setPeriodMetrics(prev => ({
                        ...prev,
                        [period]: financialCache.data[period]
                    }));
                    setLoadingPeriods(prev => ({ ...prev, [period]: false }));
                }
            });
            
            // Check if we need to fetch any data
            const needsFetch = periods.some(period => !isCacheValid(period));
            
            if (!needsFetch) {
                console.log('📊 All periods cached, no fetch needed');
                return;
            }
            
            try {
                console.log('📊 Fetching sales performance data for all periods');
                const token = localStorage.getItem('crm_auth_token');
                
                // Use new performance-stats endpoint for ultra-fast response
                const [salesResponse, receivablesRes, payablesRes, ordersRes] = await Promise.all([
                    fetch(`${window.API_CONFIG.API_URL}/performance-stats/financials`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch(`${window.API_CONFIG.API_URL}/receivables`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch(`${window.API_CONFIG.API_URL}/payables`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch(`${window.API_CONFIG.API_URL}/orders`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);
                
                const salesResult = await salesResponse.json();
                const receivablesData = await receivablesRes.json();
                const payablesData = await payablesRes.json();
                const ordersData = await ordersRes.json();
                
                if (salesResult.success && salesResult.periods) {
                    // Capture timestamps
                    if (salesResult.lastUpdated) {
                        setLastUpdated(salesResult.lastUpdated);
                    }
                    if (salesResult.nextUpdateIn) {
                        setNextUpdateIn(salesResult.nextUpdateIn);
                    }
                    
                    // Calculate common data once
                    const totalReceivables = (receivablesData.data || []).reduce((sum, r) => sum + (r.amount || 0), 0);
                    const totalPayables = (payablesData.data || []).reduce((sum, p) => sum + (p.amount || 0), 0);
                    
                    // Calculate active sales
                    const orders = ordersData.data || [];
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    const activeOrders = orders.filter(order => {
                        if (['cancelled', 'rejected', 'refunded'].includes(order.status)) return false;
                        if (!order.event_date) return true;
                        const eventDate = new Date(order.event_date);
                        eventDate.setHours(0, 0, 0, 0);
                        return eventDate >= today;
                    });
                    
                    const activeSales = activeOrders.reduce((sum, order) => {
                        const amount = order.payment_currency === 'INR' 
                            ? parseFloat(order.total_amount || 0)
                            : parseFloat(order.inr_equivalent || 0);
                        return sum + amount;
                    }, 0);
                    
                    // Process each period from the response
                    for (const period of periods) {
                        if (salesResult.periods[period]) {
                            const periodData = salesResult.periods[period];
                            
                            // New API structure - data is directly in periodData, already in rupees
                            const totalSales = periodData.totalSales || 0;
                            const totalMargin = periodData.totalMargin || 0;
                            const marginPercentage = periodData.marginPercentage || 0;
                            
                            // Debug logging for margin calculation
                            console.log(`📊 Financials ${period} - Sales: ₹${totalSales.toLocaleString()}, Margin: ₹${totalMargin.toLocaleString()}, %: ${marginPercentage.toFixed(2)}%`);
                            
                            // Data is already in rupees from the new API
                            const totalSalesInRupees = totalSales;
                            const totalMarginInRupees = totalMargin;
                            
                            const data = {
                                totalSales: totalSalesInRupees,
                                activeSales: periodData.activeSales || activeSales,
                                totalReceivables: periodData.totalReceivables || totalReceivables,
                                totalPayables: periodData.totalPayables || totalPayables,
                                totalMargin: totalMarginInRupees,
                                marginPercentage: parseFloat(marginPercentage.toFixed(2)),
                                processedOrders: periodData.orderCount || 0
                            };
                            
                            // Store in cache
                            financialCache.data[period] = data;
                            financialCache.timestamps[period] = Date.now();
                            
                            setPeriodMetrics(prev => ({
                                ...prev,
                                [period]: data
                            }));
                            
                            setLoadingPeriods(prev => ({ ...prev, [period]: false }));
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching all periods metrics:', error);
                periods.forEach(period => {
                    setLoadingPeriods(prev => ({ ...prev, [period]: false }));
                });
            }
        };
                    
        
        fetchAllPeriodMetrics();
    }, []);
    
    const periodNames = {
        current_fy: 'Current FY',
        current_month: 'Current Month',
        last_month: 'Last Month'
    };
    
    // Render a single stat card with loader
    const renderStatCard = (title, value, icon, isLoading) => {
        return React.createElement('div', { 
            className: 'bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 relative overflow-hidden',
            style: { minHeight: '80px' }
        },
            isLoading ?
                // FanToPark Logo Loader
                React.createElement('div', {
                    className: 'absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800',
                    style: { zIndex: 10 }
                },
                    React.createElement('div', { className: 'text-center' },
                        React.createElement('div', {
                            className: 'relative w-12 h-12 mx-auto',
                            style: { animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }
                        },
                            React.createElement('img', {
                                src: document.documentElement.classList.contains('dark') ? 'images/logo-dark.png' : 'images/logo.png',
                                alt: 'Loading...',
                                className: 'w-full h-full object-contain',
                                style: {
                                    filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))',
                                    animation: 'float 3s ease-in-out infinite'
                                }
                            })
                        )
                    )
                ) :
                // Normal content
                React.createElement('div', { className: 'flex items-center justify-between h-full' },
                    React.createElement('div', null,
                        React.createElement('p', { className: 'text-xs font-medium text-gray-600 dark:text-gray-400' }, title),
                        React.createElement('p', { className: 'text-lg font-bold text-gray-900 dark:text-white mt-1' }, 
                            typeof value === 'number' ? window.formatCurrency(value) : value
                        )
                    ),
                    React.createElement('div', { className: 'text-xl opacity-50' }, icon)
                )
        );
    };
    
    // Render period section
    const renderPeriodSection = (period, metrics, isLoading) => {
        return React.createElement('div', { className: 'space-y-3' },
            React.createElement('h4', { 
                className: 'text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider' 
            }, periodNames[period]),
            
            React.createElement('div', { className: 'grid grid-cols-2 gap-3' },
                renderStatCard('Total Sales', metrics?.totalSales || 0, '💰', isLoading),
                renderStatCard('Active Sales', metrics?.activeSales || 0, '🎯', isLoading),
                renderStatCard('Receivables', metrics?.totalReceivables || 0, '📥', isLoading),
                renderStatCard('Payables', metrics?.totalPayables || 0, '📤', isLoading),
                renderStatCard('Margin', metrics?.totalMargin || 0, '📊', isLoading),
                renderStatCard('Margin %', 
                    metrics?.marginPercentage ? `${metrics.marginPercentage.toFixed(2)}%` : '0%', 
                    '📈', 
                    isLoading
                )
            )
        );
    };
    
    return React.createElement('div', { className: 'space-y-6' },
        // Stats Section Header
        React.createElement('div', { className: 'flex items-center justify-between mb-4' },
            React.createElement('div', null,
                React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 dark:text-white' }, 
                    'Financial Overview'
                ),
                lastUpdated && React.createElement('p', { className: 'text-sm text-gray-500 dark:text-gray-400 mt-1' }, 
                    `Last updated: ${new Date(lastUpdated).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
                    nextUpdateIn && ` • Next update in: ${nextUpdateIn}`
                )
            ),
            React.createElement('button', {
                onClick: () => window.location.reload(),
                className: 'text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400'
            }, '↻ Refresh')
        ),
        
        // Three Period Sections
        React.createElement('div', { 
            className: 'grid grid-cols-1 lg:grid-cols-3 gap-6 bg-gray-50 dark:bg-gray-900 p-6 rounded-lg' 
        },
            renderPeriodSection('current_fy', periodMetrics.current_fy, loadingPeriods.current_fy),
            renderPeriodSection('current_month', periodMetrics.current_month, loadingPeriods.current_month),
            renderPeriodSection('last_month', periodMetrics.last_month, loadingPeriods.last_month)
        )
    );
};

// Wrapper function to render the Enhanced Financial Stats component
window.renderEnhancedFinancialStats = () => {
    return React.createElement(EnhancedFinancialStats);
};

// Old stats rendering code removed - replaced with new 3-period design

// Synchronous version for immediate display
window.calculateEnhancedFinancialMetricsSync = () => {
    const financialData = window.appState?.financialData || {};
    const inventory = window.inventory || [];
    
    // Get data from financial data
    const activeSales = financialData.activeSales || [];
    const sales = financialData.sales || [];
    const payables = financialData.payables || [];
    const receivables = financialData.receivables || [];
    
    // Debug logging
    console.log('📊 calculateEnhancedFinancialMetricsSync DEBUG:', {
        hasFinancialData: !!financialData,
        hasTotalSales: !!financialData.totalSales,
        hasAllSales: !!financialData.allSales,
        totalSalesValue: financialData.totalSales,
        allSalesLength: financialData.allSales?.length,
        salesLength: sales.length,
        fallbackSum: (financialData.allSales || []).reduce((sum, sale) => sum + (sale.amount || 0), 0),
        oldSum: sales.reduce((sum, sale) => sum + (sale.amount || 0), 0),
        whichFetchFunctionUsed: window.fetchFinancialData?.name || 'anonymous'
    });
    
    // Check if we're using the enhanced system
    if (typeof window.fetchFinancialData === 'function') {
        console.log('🔍 Current fetchFinancialData function:', window.fetchFinancialData.toString().substring(0, 200) + '...');
    }
    
    // Debug: Show sample order fields for margin calculation
    if (financialData.allSales && financialData.allSales.length > 0) {
        const sampleOrder = financialData.allSales[0];
        console.log('📋 Sample order fields for margin calculation:', {
            id: sampleOrder.id,
            hasBaseAmount: !!sampleOrder.base_amount,
            hasFinalAmount: !!sampleOrder.final_amount,
            hasGstAmount: !!sampleOrder.gst_amount,
            hasTcsAmount: !!sampleOrder.tcs_amount,
            hasFinalAmountInr: !!sampleOrder.final_amount_inr,
            paymentCurrency: sampleOrder.payment_currency,
            availableFields: Object.keys(sampleOrder).filter(key => key.includes('amount'))
        });
    }
    
    // Calculate totals - Use the new totalSales from financialData
    const totalActiveSales = activeSales.reduce((sum, sale) => sum + (sale.amount || 0), 0);
    // Use the new totalSales that includes ALL orders (matching sales performance)
    const totalSales = financialData.totalSales || 
                      (financialData.allSales || []).reduce((sum, sale) => sum + (sale.amount || 0), 0) ||
                      0; // Remove fallback to old filtered logic that causes discrepancy
    const totalPayables = payables.reduce((sum, payable) => sum + (payable.amount || 0), 0);
    const totalReceivables = receivables.reduce((sum, receivable) => sum + (receivable.amount || receivable.balance_amount || 0), 0);
    
    console.log('📊 Calculated totals:', {
        totalSales,
        totalSalesFormatted: `₹${(totalSales / 10000000).toFixed(2)} Cr`,
        totalActiveSales,
        totalPayables,
        totalReceivables
    });
    
    // Calculate margin from orders and allocations (enhanced method)
    let totalMargin = 0;
    let marginPercentage = 0;
    
    // Try to use backend margin calculation if available
    if (financialData.allSales && financialData.allSales.length > 0) {
        // Use cached result if available to avoid repeated API calls
        if (window.cachedOrderMargin && Date.now() - window.cachedOrderMargin.timestamp < 60000) {
            totalMargin = window.cachedOrderMargin.totalMargin;
            marginPercentage = window.cachedOrderMargin.marginPercentage;
            console.log('📊 Using cached backend margin:', { totalMargin, marginPercentage });
        } else {
            // Show loading state instead of incorrect fallback values
            console.log('📊 Margin data loading from backend...');
            
            // Set to null to indicate loading state
            totalMargin = null;
            marginPercentage = null;
        }
    } else {
        // No sales data available, show loading state
        console.log('📊 No sales data available for margin calculation');
        totalMargin = null;
        marginPercentage = null;
    }
    
    // Get cached percentages or defaults
    const cachedPercentages = window.financialPercentageCache || {
        sales: 0,
        margin: 15.7
    };
    
    return {
        totalSales: totalSales, // FIXED: Don't add totalActiveSales - it's already included in totalSales
        totalActiveSales,
        totalPayables,
        totalReceivables,
        totalMargin,
        marginPercentage: Math.round(marginPercentage * 100) / 100,
        activeSalesCount: activeSales.length,
        percentageChanges: cachedPercentages
    };
};

// Async version that calculates percentage changes
window.calculateEnhancedFinancialMetrics = async () => {
    // Get base metrics first
    const baseMetrics = window.calculateEnhancedFinancialMetricsSync();
    
    // Get date ranges
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const formatDate = (date) => date.toISOString().split('T')[0];
    
    try {
        // Fetch month-over-month data
        const [currentMonthOrders, previousMonthOrders] = await Promise.all([
            window.apiCall(`/orders?from_date=${formatDate(currentMonthStart)}&to_date=${formatDate(currentMonthEnd)}`),
            window.apiCall(`/orders?from_date=${formatDate(previousMonthStart)}&to_date=${formatDate(previousMonthEnd)}`)
        ]);
        
        const currentOrders = currentMonthOrders.data || [];
        const previousOrders = previousMonthOrders.data || [];
        
        // Calculate sales totals for percentage change
        const currentMonthSales = currentOrders.reduce((sum, order) => sum + (order.final_amount || 0), 0);
        const previousMonthSales = previousOrders.reduce((sum, order) => sum + (order.final_amount || 0), 0);
        
        // Calculate percentage change
        const calculatePercentageChange = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return ((current - previous) / previous * 100);
        };
        
        const salesChange = calculatePercentageChange(currentMonthSales, previousMonthSales);
        
        // TODO: Calculate margin percentage change based on inventory
        // For now, using default value
        const marginChange = 15.7;
        
        // Cache the percentages
        window.financialPercentageCache = {
            sales: salesChange,
            margin: marginChange
        };
        
        return {
            ...baseMetrics,
            percentageChanges: window.financialPercentageCache
        };
        
    } catch (error) {
        console.error('Error calculating percentage changes:', error);
        return baseMetrics;
    }
};
// Now call it immediately
//window.loadFinancialData();
// Enhanced Expiring Inventory Data Processing
window.getEnhancedExpiringInventory = () => {
    if (!window.inventory) return [];
    
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
    
    return window.inventory
        .filter(item => {
            const eventDate = new Date(item.event_date);
            return eventDate <= sevenDaysFromNow && eventDate >= now;
        })
        .map(item => {
            const eventDate = new Date(item.event_date);
            const daysLeft = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 1000));
            const costPrice = item.buying_price || 0;
            const potentialLoss = (item.available_tickets || 0) * costPrice;
            
            return {
                ...item,
                daysLeft: Math.max(0, daysLeft),
                costPrice,
                potentialLoss,
                eventDateFormatted: eventDate.toLocaleDateString(),
                itemName: item.event_name || 'Unknown Event'
            };
        })
        .sort((a, b) => a.daysLeft - b.daysLeft);
};

// Safe date formatting function
window.formatFinancialDate = (dateValue) => {
    if (!dateValue) return 'Invalid Date';
    
    try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleDateString();
    } catch (error) {
        console.warn('Date formatting error:', error);
        return 'Invalid Date';
    }
};

// Fix 1: Update the renderActiveSalesTab function to remove "Post-Service Payment Orders" text
window.renderActiveSalesTab = (activeSales) => {
    console.log('🔍 renderActiveSalesTab called with:', activeSales);
    console.log('🔍 activeSales.length:', activeSales?.length || 0);
    
    return React.createElement('div', { className: 'space-y-4' },
        React.createElement('h4', { className: 'text-lg font-semibold mb-4' }, 'Active Sales'), // Changed from 'Active Sales (Post-Service Payment Orders)'

        React.createElement('div', { className: 'overflow-x-auto' },
            React.createElement('table', { className: 'w-full' },
                React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-700' },
                    React.createElement('tr', null,
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Date'),
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Order Number'),
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Client'),
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Event'),
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Event Date'),
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Amount'),
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Status')
                    )
                ),
                React.createElement('tbody', { className: 'divide-y divide-gray-200 dark:divide-gray-700' },
                    activeSales && activeSales.length > 0 ?
                        activeSales.map(sale =>
                            React.createElement('tr', { key: sale.id, className: 'hover:bg-gray-50 dark:hover:bg-gray-700' },
                                React.createElement('td', { className: 'px-4 py-3 text-sm text-gray-900 dark:text-white' }, 
                                    window.formatFinancialDate(sale.date || sale.created_date)
                                ),
                                React.createElement('td', { className: 'px-4 py-3 text-sm text-gray-900 dark:text-white' }, 
                                    sale.order_number || sale.id || 'N/A'
                                ),
                                React.createElement('td', { className: 'px-4 py-3 text-sm text-gray-900 dark:text-white' }, 
                                    sale.client || sale.clientName || 'N/A'
                                ),
                                React.createElement('td', { className: 'px-4 py-3 text-sm text-gray-900 dark:text-white' }, 
                                    sale.event_name || 'N/A'
                                ),
                                React.createElement('td', { className: 'px-4 py-3 text-sm text-gray-900 dark:text-white' }, 
                                    sale.event_date ? window.formatFinancialDate(sale.event_date) : 'N/A'
                                ),
                                React.createElement('td', { className: 'px-4 py-3 text-sm font-medium text-gray-900 dark:text-white' }, 
                                    `₹${(sale.amount || 0).toLocaleString()}`
                                ),
                                React.createElement('td', { className: 'px-4 py-3' },
                                    React.createElement('span', {
                                        className: `px-2 py-1 text-xs rounded-full ${
                                            sale.status === 'paid' ? 'bg-green-100 text-green-800' :
                                            sale.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            sale.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`
                                    }, sale.status || 'N/A')
                                )
                            )
                        ) : 
                        React.createElement('tr', null,
                            React.createElement('td', { 
                                colSpan: 7, 
                                className: 'px-4 py-8 text-center text-gray-500' 
                            }, 'No active sales')
                        )
                )
            )
        )
    );
};
// Sales Tab Renderer with FIXED Chart Implementation
window.renderSalesTab = (sales) => {
    console.log('🔍 renderSalesTab called with:', sales);
    
    // Try to create chart AFTER the component is rendered
    setTimeout(() => {
        window.createFinancialSalesChart(sales);
    }, 100);
    
    return React.createElement('div', { className: 'space-y-4' },
        // Sales Chart
        React.createElement('div', { className: 'bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6' },
            React.createElement('h4', { className: 'text-lg font-semibold mb-4' }, 'Sales Trend'),
            React.createElement('div', { className: 'h-64 relative mb-4' },
                React.createElement('canvas', { 
                    id: 'financialSalesChart',
                    style: { maxHeight: '250px' }
                })
            )
        ),

        // Sales Table
        React.createElement('div', { className: 'overflow-x-auto' },
            React.createElement('table', { className: 'w-full' },
                React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-700' },
                    React.createElement('tr', null,
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Date'),
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Invoice #'),
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Client'),
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Sales Person'),
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Amount'),
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Status')
                    )
                ),
                React.createElement('tbody', { className: 'divide-y divide-gray-200 dark:divide-gray-700' },
                    sales && sales.length > 0 ? 
                        sales.map(sale =>
                            React.createElement('tr', { key: sale.id, className: 'hover:bg-gray-50 dark:hover:bg-gray-700' },
                                React.createElement('td', { className: 'px-4 py-3 text-sm text-gray-900 dark:text-white' }, 
                                    window.formatFinancialDate(sale.date || sale.created_date)
                                ),
                                React.createElement('td', { className: 'px-4 py-3 text-sm text-gray-900 dark:text-white' }, 
                                    sale.invoice || sale.invoice_number || sale.order_number || 'N/A'
                                ),
                                React.createElement('td', { className: 'px-4 py-3 text-sm text-gray-900 dark:text-white' }, 
                                    sale.client || sale.clientName || 'N/A'
                                ),
                                React.createElement('td', { className: 'px-4 py-3 text-sm text-gray-900 dark:text-white' }, 
                                    sale.assignedTo || 'N/A'
                                ),
                                React.createElement('td', { className: 'px-4 py-3 text-sm font-medium text-gray-900 dark:text-white' }, 
                                    `₹${(sale.amount || 0).toLocaleString()}`
                                ),
                                React.createElement('td', { className: 'px-4 py-3' },
                                    React.createElement('span', {
                                        className: `px-2 py-1 text-xs rounded-full ${
                                            sale.status === 'paid' ? 'bg-green-100 text-green-800' : 
                                            sale.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`
                                    }, sale.status || 'N/A')
                                )
                            )
                        ) : 
                        React.createElement('tr', null,
                            React.createElement('td', { 
                                colSpan: 6, 
                                className: 'px-4 py-8 text-center text-gray-500' 
                            }, 'No sales data found')
                        )
                )
            )
        )
    );
};

// CORRECTED: Receivables Tab with ORIGINAL PAYMENT FORM FUNCTIONALITY
// Modified Receivables Tab with INR column
window.renderReceivablesTab = (receivables) => {
    console.log('🔍 renderReceivablesTab called with:', receivables);
    
    return React.createElement('div', { className: 'space-y-4' },
        React.createElement('h4', { className: 'text-lg font-semibold mb-4' }, 'Receivables'),

        React.createElement('div', { className: 'overflow-x-auto' },
            React.createElement('table', { className: 'w-full' },
                React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-700' },
                    React.createElement('tr', null,
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Due Date'),
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Invoice #'),
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Client'),
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Original Amount'),
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Amount (INR)'),
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Days Overdue'),
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'FX Impact'),
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Actions')
                    )
                ),
                React.createElement('tbody', { className: 'divide-y divide-gray-200 dark:divide-gray-700' },
                    receivables && receivables.length > 0 ?
                        receivables.map(rec => {
                            const dueDate = new Date(rec.due_date || rec.expected_payment_date);
                            const today = new Date();
                            const daysDiff = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
                            const isOverdue = daysDiff > 0 && rec.status !== 'paid';
                            const showCurrency = rec.original_currency && rec.original_currency !== 'INR';
                            
                            return React.createElement('tr', { 
                                key: rec.id,
                                className: isOverdue ? 'bg-red-50 dark:bg-red-900/20' : ''
                            },
                                // Due Date
                                React.createElement('td', { className: 'px-4 py-3 text-sm' }, 
                                    window.formatFinancialDate(rec.due_date || rec.expected_payment_date)
                                ),
                                // Invoice Number
                                React.createElement('td', { className: 'px-4 py-3 text-sm font-medium' }, 
                                    rec.invoice_number || rec.invoice_id || 'N/A'
                                ),
                                // Client Name
                                React.createElement('td', { className: 'px-4 py-3 text-sm' }, 
                                    rec.client_name || 'N/A'
                                ),
                                // Original Amount (with currency)
                                React.createElement('td', { className: 'px-4 py-3 text-sm' }, 
                                    showCurrency ? 
                                        `${rec.original_currency} ${(rec.original_amount || 0).toLocaleString()}` : 
                                        `₹${(rec.original_amount || rec.amount || 0).toLocaleString()}`
                                ),
                                // Amount in INR
                                React.createElement('td', { className: 'px-4 py-3 text-sm font-medium' }, 
                                    `₹${(rec.amount || 0).toLocaleString()}`
                                ),
                                // Days Overdue
                                React.createElement('td', { 
                                    className: `px-4 py-3 text-sm ${isOverdue ? 'text-red-600' : 'text-green-600'}`
                                }, 
                                    isOverdue ? `${Math.abs(daysDiff)} days overdue` : 
                                    daysDiff === 0 ? 'Due today' : 'Not due'
                                ),
                                React.createElement('td', { className: 'px-4 py-3' },
  rec.exchange_difference ? 
    React.createElement('span', {
      className: `font-medium ${rec.exchange_difference_type === 'gain' ? 'text-green-600' : 'text-red-600'}`
    }, 
      `${payable.exchange_difference_type === 'gain' ? '+' : '-'}₹${Math.abs(payable.exchange_difference).toFixed(0)}`
    ) : '-'
),                       
                                // Actions
                                React.createElement('td', { className: 'px-4 py-3' },
                                    React.createElement('div', { className: 'flex space-x-2' },
                                        React.createElement('button', {
                                            className: 'text-blue-600 hover:text-blue-800 font-medium',
                                            onClick: () => handleMarkPaymentFromReceivable(rec),
                                            title: 'Mark Payment Received'
                                        }, 'Mark Payment'),
                                        React.createElement('button', {
                                            onClick: () => window.deleteReceivable(rec.id),
                                            className: 'text-red-600 hover:text-red-800 font-medium',
                                            title: 'Delete Receivable'
                                        }, '🗑️ Delete')
                                    )
                                )
                            );
                        }) : 
                        React.createElement('tr', null,
                            React.createElement('td', { 
                                colSpan: 7, 
                                className: 'px-4 py-8 text-center text-gray-500' 
                            }, 'No receivables found')
                        )
                )
            )
        )
    );
};

// CORRECTED: Payables Tab with ORIGINAL INVENTORY FORM FUNCTIONALITY & FIXED SUPPLIER MAPPING
// Enhanced Payables Tab Component for FanToPark CRM
// Adds event name column and converts action buttons to icons

// Modified Payables Tab with INR column
// Fix for FX Impact display in payables table
// Add this code to update the renderPayablesTab function in financials.js

// Find the payables.map section in renderPayablesTab and update it to include the FX Impact cell
// This should be added after the Status cell and before the Actions cell

window.renderPayablesTab = (payables) => {
    console.log('🔍 renderPayablesTab called with:', payables);
    
    return React.createElement('div', { className: 'overflow-x-auto' },
        React.createElement('table', { className: 'w-full' },
            React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-700' },
                React.createElement('tr', null,
                    React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Due Date'),
                    React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Supplier'),
                    React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Event'),
                    React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Invoice #'),
                    React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Original Amount'),
                    React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Amount (INR)'),
                    React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Status'),
                    React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'FX Impact'),                
                    React.createElement('th', { className: 'px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase' }, 'Actions')
                )
            ),
            React.createElement('tbody', { className: 'divide-y divide-gray-200 dark:divide-gray-700' },
                payables && payables.length > 0 ?
                    payables.map(payable => {
                        const showCurrency = payable.original_currency && payable.original_currency !== 'INR';
                        
                        // Calculate total FX impact from payment history
                        let totalFxImpact = 0;
                        if (payable.payment_history && payable.payment_history.length > 0) {
                            totalFxImpact = payable.payment_history.reduce((sum, payment) => {
                                return sum + (payment.fx_difference || payment.exchange_difference || 0);
                            }, 0);
                        }
                        
                        // Also check for total_exchange_difference field (set when fully paid)
                        if (payable.total_exchange_difference !== undefined) {
                            totalFxImpact = payable.total_exchange_difference;
                        }
                        
                        return React.createElement('tr', { key: payable.id, className: 'hover:bg-gray-50 dark:hover:bg-gray-700' },
                            // Due Date
                            React.createElement('td', { className: 'px-4 py-3 text-sm text-gray-900 dark:text-white' }, 
                                window.formatFinancialDate(payable.dueDate || payable.due_date || payable.created_date)
                            ),
                            // Supplier Name
                            React.createElement('td', { className: 'px-4 py-3 text-sm text-gray-900 dark:text-white' }, 
                                payable.supplierName || payable.supplier_name || payable.supplier || 'N/A'
                            ),
                            // Event Name
                            React.createElement('td', { className: 'px-4 py-3 text-sm text-gray-900 dark:text-white' }, 
                                payable.event_name || payable.eventName || 'N/A'
                            ),
                            // Invoice Number
                            React.createElement('td', { className: 'px-4 py-3 text-sm text-gray-900 dark:text-white' }, 
                                payable.invoiceNumber || payable.supplier_invoice || payable.invoice_number || 'N/A'
                            ),
                            // Original Amount (with currency)
                            React.createElement('td', { className: 'px-4 py-3 text-sm text-gray-900 dark:text-white' }, 
                                showCurrency ? 
                                    `${payable.original_currency} ${(payable.original_amount || 0).toLocaleString()}` : 
                                    `₹${(payable.original_amount || payable.amount || 0).toLocaleString()}`
                            ),
                            // Amount in INR (clickable)
                            React.createElement('td', { className: 'px-4 py-3 text-sm font-medium text-gray-900 dark:text-white' }, 
                                React.createElement('button', {
                                    onClick: () => window.showPaymentHistory(payable),
                                    className: 'text-blue-600 hover:text-blue-800 hover:underline'
                                }, `₹${(payable.amount || 0).toLocaleString()}`)
                            ),
                            // Status
                            React.createElement('td', { className: 'px-4 py-3' },
                                React.createElement('span', {
                                    className: `px-2 py-1 text-xs rounded-full ${
                                        (payable.payment_status || payable.status) === 'paid' ?
                                            'bg-green-100 text-green-800' :
                                        (payable.payment_status || payable.status) === 'partial' ?
                                            'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                    }`
                                }, payable.payment_status || payable.status || 'pending')
                            ),
                            // FX Impact - THIS IS THE NEW CELL THAT WAS MISSING
                            React.createElement('td', { className: 'px-4 py-3 text-sm' },
                                totalFxImpact !== 0 ?
                                    React.createElement('span', {
                                        className: totalFxImpact > 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'
                                    }, 
                                    `${totalFxImpact > 0 ? '-' : '+'}₹${Math.abs(totalFxImpact).toLocaleString()}`
                                    ) :
                                    React.createElement('span', { className: 'text-gray-400' }, '—')
                            ),
                            // Actions (with icons)
                            React.createElement('td', { className: 'px-4 py-3 text-center' },
    React.createElement('div', { className: 'flex justify-center space-x-2' },
        // Eye emoji for view
        React.createElement('button', {
            onClick: () => window.showPaymentHistoryModal(payable),
            className: 'text-blue-600 hover:text-blue-800 text-lg',
            title: 'View Details'
        }, '👁️'),
        
        // Check emoji for mark paid (if not already paid)
        (payable.payment_status || payable.status) !== 'paid' && 
        React.createElement('button', {
            onClick: () => window.handleRecordPaymentClick(payable),
            className: 'text-green-600 hover:text-green-800 text-lg',
            title: 'Record Payment'
        }, '✅'),
        
        // Trash emoji for delete
        React.createElement('button', {
            onClick: () => window.deletePayable(payable.id),
            className: 'text-red-600 hover:text-red-800 text-lg',
            title: 'Delete'
        }, '🗑️')
    )
)
                        );
                    }) : 
                    React.createElement('tr', null,
                        React.createElement('td', { 
                            colSpan: 9, 
                            className: 'px-4 py-8 text-center text-gray-500' 
                        }, 'No payables found')
                    )
            )
        )
    );
};

// Helper function for formatting dates (if not already exists)
if (!window.formatFinancialDate) {
    window.formatFinancialDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).replace(/\//g, '/');
    };
}

// Helper function for formatting dates (if not already exists)
if (!window.formatFinancialDate) {
    window.formatFinancialDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).replace(/\//g, '/');
    };
}

// Expiring Inventory Tab Renderer - FIXED FIELDS
// Modified Expiring Inventory Tab with INR column
window.renderExpiringTab = (expiringInventory) => {
    console.log('🔍 renderExpiringTab called with:', expiringInventory);
    
    // Get enhanced data with proper field mapping
    const enhancedData = window.getEnhancedExpiringInventory();
    
    return React.createElement('div', { className: 'space-y-4' },
        React.createElement('h4', { className: 'text-lg font-semibold mb-4' }, 'Expiring Inventory (Next 7 Days)'),

        React.createElement('div', { className: 'overflow-x-auto' },
            React.createElement('table', { className: 'w-full' },
                React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-700' },
                    React.createElement('tr', null,
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Event Name'),
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Event Date'),
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Days Left'),
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Available Tickets'),
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Original Value'),
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Value (INR)'),
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Potential Loss (INR)')
                    )
                ),
                React.createElement('tbody', { className: 'divide-y divide-gray-200 dark:divide-gray-700' },
                    enhancedData && enhancedData.length > 0 ?
                        enhancedData.map(item => {
                            // Calculate total original value and INR value
                            let totalOriginalValue = 0;
                            let totalINRValue = 0;
                            let originalCurrency = 'INR';
                            
                            if (item.categories && Array.isArray(item.categories)) {
                                // Multi-category inventory
                                item.categories.forEach(cat => {
                                    const price = cat.price || cat.buying_price || 0;
                                    const qty = cat.available_tickets || 0;
                                    const currency = cat.price_currency || 'INR';
                                    const exchangeRate = cat.exchange_rate || 1;
                                    
                                    if (currency && currency !== 'INR' && !originalCurrency) {
                                        originalCurrency = currency;
                                    }
                                    
                                    totalOriginalValue += price * qty;
                                    totalINRValue += (price * exchangeRate) * qty;
                                });
                            } else {
                                // Single category inventory
                                const price = item.buying_price || item.costPrice || 0;
                                const qty = item.available_tickets || 0;
                                const currency = item.price_currency || 'INR';
                                const exchangeRate = item.exchange_rate || 1;
                                
                                originalCurrency = currency;
                                totalOriginalValue = price * qty;
                                totalINRValue = (price * exchangeRate) * qty;
                            }
                            
                            const showCurrency = originalCurrency && originalCurrency !== 'INR';
                            
                            return React.createElement('tr', { key: item.id, className: 'hover:bg-gray-50 dark:hover:bg-gray-700' },
                                // Event Name
                                React.createElement('td', { className: 'px-4 py-3 text-sm text-gray-900 dark:text-white' }, 
                                    item.itemName || item.event_name || 'Unknown Event'
                                ),
                                // Event Date
                                React.createElement('td', { className: 'px-4 py-3 text-sm text-gray-900 dark:text-white' }, 
                                    item.eventDateFormatted || window.formatFinancialDate(item.event_date)
                                ),
                                // Days Left
                                React.createElement('td', { className: 'px-4 py-3 text-sm' },
                                    React.createElement('span', {
                                        className: `px-2 py-1 text-xs rounded-full ${
                                            item.daysLeft === 0 ? 'bg-red-100 text-red-800' :
                                            item.daysLeft <= 1 ? 'bg-orange-100 text-orange-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`
                                    }, `${item.daysLeft || 0} day${item.daysLeft !== 1 ? 's' : ''}`)
                                ),
                                // Available Tickets
                                React.createElement('td', { className: 'px-4 py-3 text-sm text-gray-900 dark:text-white' }, 
                                    item.available_tickets || 0
                                ),
                                // Original Value (with currency)
                                React.createElement('td', { className: 'px-4 py-3 text-sm text-gray-900 dark:text-white' }, 
                                    showCurrency ? 
                                        `${originalCurrency} ${totalOriginalValue.toLocaleString()}` : 
                                        `₹${totalOriginalValue.toLocaleString()}`
                                ),
                                // Value in INR
                                React.createElement('td', { className: 'px-4 py-3 text-sm font-medium text-gray-900 dark:text-white' }, 
                                    `₹${totalINRValue.toLocaleString()}`
                                ),
                                // Potential Loss in INR
                                React.createElement('td', { className: 'px-4 py-3 text-sm font-medium text-red-600' }, 
                                    `₹${(item.potentialLoss || totalINRValue || 0).toLocaleString()}`
                                )
                            );
                        }) : 
                        React.createElement('tr', null,
                            React.createElement('td', { 
                                colSpan: 7, 
                                className: 'px-4 py-8 text-center text-gray-500' 
                            }, 'No expiring inventory in the next 7 days')
                        )
                )
            )
        )
    );
};

// Mobile Responsive Financials Updates
// Add these responsive modifications to your financials.js

// Update the renderFinancials function with responsive classes
window.renderResponsiveFinancials = () => {
    const { financialData, financialFilters, setFinancialFilters, activeFinancialTab, setActiveFinancialTab } = window.appState;
    
    // Get current tab data with pagination
    const currentTabData = window.getCurrentTabData();
    
    return React.createElement('div', { className: 'space-y-4' },
        // Stats Cards - Responsive Grid
        React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4' },
            window.renderEnhancedFinancialStats()
        ),
        
        // Use the same compact filter system for mobile
        React.createElement('div', { className: 'bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border' },
            React.createElement('div', { className: 'flex flex-wrap items-center gap-2' },
                React.createElement('input', {
                    type: 'text',
                    value: financialFilters.clientName || '',
                    onChange: (e) => setFinancialFilters({...financialFilters, clientName: e.target.value}),
                    placeholder: 'Search client...',
                    className: 'w-36 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
                }),
                
                React.createElement('span', { className: 'text-sm text-gray-500 ml-2' }, 'From:'),
                React.createElement('input', {
                    type: 'date',
                    value: financialFilters.dateFrom || '',
                    onChange: (e) => setFinancialFilters({...financialFilters, dateFrom: e.target.value}),
                    className: 'px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
                }),
                
                React.createElement('span', { className: 'text-sm text-gray-500' }, 'To:'),
                React.createElement('input', {
                    type: 'date',
                    value: financialFilters.dateTo || '',
                    onChange: (e) => setFinancialFilters({...financialFilters, dateTo: e.target.value}),
                    className: 'px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
                }),
                
                // Status Filter inline
                React.createElement('select', {
                    value: financialFilters.status || 'all',
                    onChange: (e) => setFinancialFilters({...financialFilters, status: e.target.value}),
                    className: 'ml-2 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
                },
                    React.createElement('option', { value: 'all' }, 'All Status'),
                    React.createElement('option', { value: 'pending' }, 'Pending'),
                    React.createElement('option', { value: 'paid' }, 'Paid'),
                    React.createElement('option', { value: 'overdue' }, 'Overdue')
                ),
                
                // Clear button inline
                React.createElement('button', {
                    onClick: () => setFinancialFilters({
                        clientName: '',
                        assignedPerson: '',
                        dateFrom: '',
                        dateTo: '',
                        status: 'all'
                    }),
                    className: 'ml-auto px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50'
                }, 'Clear')
            )
        ),

        // Tabs - Horizontally scrollable on mobile
        React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow' },
            React.createElement('div', { className: 'border-b border-gray-200 dark:border-gray-700 overflow-x-auto' },
                React.createElement('nav', { className: 'flex space-x-4 md:space-x-8 px-4 md:px-6 min-w-max' },
                    ['activesales', 'sales', 'receivables', 'payables', 'expiring', 'bulkpayment'].map(tab =>
                        React.createElement('button', {
                            key: tab,
                            onClick: () => setActiveFinancialTab(tab),
                            className: `py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                                activeFinancialTab === tab
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700 border-transparent'
                            }`
                        }, tab.charAt(0).toUpperCase() + tab.slice(1).replace('activesales', 'Active Sales'))
                    )
                )
            ),

            // Tab Content
            React.createElement('div', { className: 'p-4 md:p-6' },
                activeFinancialTab === 'sales' && window.renderResponsiveSalesTab(currentTabData.data)
                // Add other tabs similarly
            )
        )
    );
};

// Responsive Sales Tab with mobile-optimized chart and table
window.renderResponsiveSalesTab = (sales) => {
    // Initialize chart after render
    setTimeout(() => {
        window.createFinancialSalesChart();
    }, 100);
    
    return React.createElement('div', { className: 'space-y-6' },
        // Sales Chart - Responsive height
        React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border' },
            React.createElement('h4', { className: 'text-lg font-semibold mb-4 text-gray-900 dark:text-white' }, 'Sales Trend'),
            React.createElement('div', { className: 'h-64 md:h-80 relative' },
                React.createElement('canvas', { 
                    id: 'financialSalesChart',
                    className: 'max-w-full'
                })
            )
        ),

        // Sales Table - Horizontally scrollable on mobile
        React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow-sm border' },
            React.createElement('div', { className: 'overflow-x-auto' },
                React.createElement('table', { className: 'w-full min-w-[640px]' }, // min-width ensures table doesn't get too compressed
                    React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-700' },
                        React.createElement('tr', null,
                            React.createElement('th', { className: 'px-3 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Date'),
                            React.createElement('th', { className: 'px-3 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Invoice #'),
                            React.createElement('th', { className: 'px-3 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Client'),
                            React.createElement('th', { className: 'px-3 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell' }, 'Sales Person'),
                            React.createElement('th', { className: 'px-3 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Amount'),
                            React.createElement('th', { className: 'px-3 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Status')
                        )
                    ),
                    React.createElement('tbody', { className: 'divide-y divide-gray-200 dark:divide-gray-700' },
                        sales && sales.length > 0 ?
                            sales.map((sale, index) => 
                                React.createElement('tr', { key: sale.id || index, className: 'hover:bg-gray-50' },
                                    React.createElement('td', { className: 'px-3 md:px-4 py-4 whitespace-nowrap text-sm' }, 
                                        new Date(sale.date || sale.created_date).toLocaleDateString()
                                    ),
                                    React.createElement('td', { className: 'px-3 md:px-4 py-4 text-sm font-medium' }, 
                                        React.createElement('span', { className: 'block md:hidden' }, 
                                            sale.invoice_number?.substring(0, 8) + '...'
                                        ),
                                        React.createElement('span', { className: 'hidden md:block' }, 
                                            sale.invoice_number || 'N/A'
                                        )
                                    ),
                                    React.createElement('td', { className: 'px-3 md:px-4 py-4 text-sm' }, 
                                        React.createElement('div', { className: 'max-w-[150px] truncate' },
                                            sale.clientName || 'N/A'
                                        )
                                    ),
                                    React.createElement('td', { className: 'px-3 md:px-4 py-4 text-sm hidden md:table-cell' }, 
                                        sale.assignedTo || 'N/A'
                                    ),
                                    React.createElement('td', { className: 'px-3 md:px-4 py-4 whitespace-nowrap text-sm font-medium' }, 
                                        `₹${(sale.amount || 0).toLocaleString('en-IN')}`
                                    ),
                                    React.createElement('td', { className: 'px-3 md:px-4 py-4 whitespace-nowrap' },
                                        React.createElement('span', { 
                                            className: `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                sale.status === 'paid' ? 'bg-green-100 text-green-800' :
                                                sale.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`
                                        }, sale.status || 'N/A')
                                    )
                                )
                            ) : 
                            React.createElement('tr', null,
                                React.createElement('td', { 
                                    colSpan: 6, 
                                    className: 'px-4 py-8 text-center text-gray-500' 
                                }, 'No sales data found')
                            )
                    )
                )
            )
        ),
        
        // Pagination - Mobile optimized
        window.renderFinancialPagination && window.renderFinancialPagination('sales', sales?.length || 0)
    );
};

// Updated renderExchangeImpactSummary function to calculate from payment history
window.renderExchangeImpactSummary = (financialData) => {
  // Calculate total exchange differences from payment history
  let payablesGain = 0, payablesLoss = 0;
  let receivablesGain = 0, receivablesLoss = 0;
  
  // Calculate from payables - check both direct fields and payment history
  financialData.payables?.forEach(p => {
    // First check for total_exchange_difference (set when fully paid)
    if (p.total_exchange_difference !== undefined && p.total_exchange_difference !== 0) {
      if (p.total_exchange_difference_type === 'gain' || p.total_exchange_difference < 0) {
        payablesGain += Math.abs(p.total_exchange_difference);
      } else {
        payablesLoss += Math.abs(p.total_exchange_difference);
      }
    } 
    // Otherwise, sum up from payment history
    else if (p.payment_history && p.payment_history.length > 0) {
      p.payment_history.forEach(payment => {
        const fxDiff = payment.fx_difference || payment.exchange_difference || 0;
        const fxType = payment.fx_type || payment.exchange_difference_type;
        
        if (fxDiff !== 0) {
          if (fxType === 'gain' || fxDiff < 0) {
            payablesGain += Math.abs(fxDiff);
          } else {
            payablesLoss += Math.abs(fxDiff);
          }
        }
      });
    }
    // Fallback to direct exchange_difference field
    else if (p.exchange_difference) {
      if (p.exchange_difference_type === 'gain') {
        payablesGain += Math.abs(p.exchange_difference);
      } else {
        payablesLoss += Math.abs(p.exchange_difference);
      }
    }
  });
  
  // Calculate from receivables - similar logic
  financialData.receivables?.forEach(r => {
    // Check for total_exchange_difference (set when fully paid)
    if (r.total_exchange_difference !== undefined && r.total_exchange_difference !== 0) {
      if (r.total_exchange_difference_type === 'gain' || r.total_exchange_difference > 0) {
        receivablesGain += Math.abs(r.total_exchange_difference);
      } else {
        receivablesLoss += Math.abs(r.total_exchange_difference);
      }
    }
    // Check payment history
    else if (r.payment_history && r.payment_history.length > 0) {
      r.payment_history.forEach(payment => {
        const fxDiff = payment.fx_difference || payment.exchange_difference || 0;
        const fxType = payment.fx_type || payment.exchange_difference_type;
        
        if (fxDiff !== 0) {
          // For receivables, the logic is opposite of payables
          if (fxType === 'gain' || fxDiff > 0) {
            receivablesGain += Math.abs(fxDiff);
          } else {
            receivablesLoss += Math.abs(fxDiff);
          }
        }
      });
    }
    // Fallback to direct exchange_difference field
    else if (r.exchange_difference) {
      if (r.exchange_difference_type === 'gain') {
        receivablesGain += Math.abs(r.exchange_difference);
      } else {
        receivablesLoss += Math.abs(r.exchange_difference);
      }
    }
  });
  
  const totalGain = payablesGain + receivablesGain;
  const totalLoss = payablesLoss + receivablesLoss;
  const netImpact = totalGain - totalLoss;
  
  // Don't show if no exchange differences
  if (totalGain === 0 && totalLoss === 0) {
    return null;
  }
  
  return React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6' },
    React.createElement('h3', { className: 'text-lg font-semibold mb-4 flex items-center text-gray-900 dark:text-white' }, 
      '💱 Exchange Rate Impact Summary'
    ),
    
    React.createElement('div', { className: 'grid grid-cols-3 gap-4 mb-4' },
      // Total Gains
      React.createElement('div', { className: 'text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg' },
        React.createElement('p', { className: 'text-sm text-gray-600 dark:text-gray-400 mb-1' }, 'Total Gains'),
        React.createElement('p', { className: 'text-2xl font-bold text-green-600 dark:text-green-400' }, 
          `+₹${totalGain.toLocaleString()}`
        ),
        React.createElement('p', { className: 'text-xs text-gray-500 dark:text-gray-400 mt-1' }, 
          `Payables: ₹${payablesGain.toLocaleString()} | Receivables: ₹${receivablesGain.toLocaleString()}`
        )
      ),
      
      // Total Losses
      React.createElement('div', { className: 'text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg' },
        React.createElement('p', { className: 'text-sm text-gray-600 dark:text-gray-400 mb-1' }, 'Total Losses'),
        React.createElement('p', { className: 'text-2xl font-bold text-red-600 dark:text-red-400' }, 
          `-₹${totalLoss.toLocaleString()}`
        ),
        React.createElement('p', { className: 'text-xs text-gray-500 dark:text-gray-400 mt-1' }, 
          `Payables: ₹${payablesLoss.toLocaleString()} | Receivables: ₹${receivablesLoss.toLocaleString()}`
        )
      ),
      
      // Net Impact
      React.createElement('div', { 
        className: `text-center p-4 rounded-lg ${netImpact >= 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}` 
      },
        React.createElement('p', { className: 'text-sm text-gray-600 dark:text-gray-400 mb-1' }, 'Net Impact'),
        React.createElement('p', { 
          className: `text-2xl font-bold ${netImpact >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}` 
        }, 
          `${netImpact >= 0 ? '+' : '-'}₹${Math.abs(netImpact).toLocaleString()}`
        ),
        React.createElement('p', { className: 'text-xs text-gray-500 dark:text-gray-400 mt-1' }, 
          netImpact >= 0 ? 'Net Gain' : 'Net Loss'
        )
      )
    )
  );
};
// ============================================================================
// AUTO-LOADING SETUP
// ============================================================================

// Update the auto-loader to check for the correct tab name

window.setActiveTab = function(tab) {
    if (originalSetActiveTab) {
        originalSetActiveTab(tab);
    }
    
    // Check for both 'finance' and 'financials' to be safe
    if (tab === 'finance' || tab === 'financials') {
        console.log('Loading financial data for finance tab...');
        setTimeout(() => {
            window.fetchFinancialData();
        }, 100);
    }
};

// Also check if already on finance tab
if (window.appState?.activeTab === 'finance' || window.appState?.activeTab === 'financials') {
    window.fetchFinancialData();
}

console.log('✅ FIXED PAGINATION Financials Component loaded successfully - All functionality preserved');

console.log('✅ FIXED PAGINATION Financials Component loaded successfully - All functionality preserved');
