// ============================================================================
// FINANCIAL CHART ENHANCEMENTS COMPONENT
// ============================================================================
// This component provides enhanced chart functionality for the financials section
// Integrates with your existing chart-system.js

// Financial Chart State Management
window.financialChartState = {
    salesChartInitialized: false,
    salesChartInstance: null,
    chartData: null,
    lastUpdate: 0
};

// Enhanced Sales Data Processing for Charts
window.processFinancialDataForCharts = () => {
    const financialData = window.appState?.financialData || {};
    const sales = financialData.sales || financialData.activeSales || [];
    const inventory = window.inventory || [];
    
    console.log('🔍 Processing financial data for charts:', { salesCount: sales.length, inventoryCount: inventory.length });
    
    // Process sales data by month
    const monthlyData = {};
    const last7Months = [];
    
    // Generate last 7 months
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        last7Months.push(monthKey);
        monthlyData[monthKey] = { revenue: 0, count: 0, margin: 0 };
    }
    
    // Process actual sales data
    sales.forEach(sale => {
        const saleDate = new Date(sale.date || sale.created_date || Date.now());
        const monthKey = saleDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        
        if (monthlyData[monthKey]) {
            monthlyData[monthKey].revenue += sale.amount || 0;
            monthlyData[monthKey].count += 1;
        }
    });
    
    // Calculate margins from inventory
    inventory.forEach(item => {
        const eventDate = new Date(item.event_date || Date.now());
        const monthKey = eventDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        
        if (monthlyData[monthKey]) {
            const soldTickets = (item.total_tickets || 0) - (item.available_tickets || 0);
            const itemMargin = soldTickets * ((item.selling_price || 0) - (item.buying_price || 0));
            monthlyData[monthKey].margin += itemMargin;
        }
    });
    
    // Generate chart datasets
    const chartData = {
        labels: last7Months,
        datasets: [{
            label: 'Revenue (₹)',
            data: last7Months.map(month => monthlyData[month].revenue),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4,
            yAxisID: 'y'
        }, {
            label: 'Sales Count',
            data: last7Months.map(month => monthlyData[month].count),
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4,
            yAxisID: 'y1'
        }, {
            label: 'Margin (₹)',
            data: last7Months.map(month => monthlyData[month].margin),
            borderColor: 'rgb(139, 69, 19)',
            backgroundColor: 'rgba(139, 69, 19, 0.1)',
            fill: false,
            tension: 0.4,
            yAxisID: 'y'
        }]
    };
    
    window.financialChartState.chartData = chartData;
    return chartData;
};

// Enhanced Sales Chart Creation Function
window.createEnhancedFinancialSalesChart = () => {
    const canvas = document.getElementById('financialSalesChart');
    
    if (!canvas) {
        console.warn('🔍 Sales chart canvas not found with ID: financialSalesChart');
        return false;
    }
    
    if (!window.Chart) {
        console.warn('🔍 Chart.js library not available');
        return false;
    }
    
    console.log('🔍 Creating enhanced financial sales chart...');
    
    // Destroy existing chart if it exists
    if (window.financialChartState.salesChartInstance) {
        window.financialChartState.salesChartInstance.destroy();
        window.financialChartState.salesChartInstance = null;
    }
    
    // Get processed chart data
    const chartData = window.processFinancialDataForCharts();
    
    try {
        // Create new chart instance
        window.financialChartState.salesChartInstance = new Chart(canvas, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    title: {
                        display: true,
                        text: 'Sales Performance & Profitability Trend',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.datasetIndex === 1) {
                                    // Sales count
                                    label += context.parsed.y + ' sales';
                                } else {
                                    // Revenue and margin
                                    label += '₹' + context.parsed.y.toLocaleString();
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Amount (₹)'
                        },
                        ticks: {
                            callback: function(value) {
                                if (value >= 100000) {
                                    return '₹' + (value / 100000).toFixed(1) + 'L';
                                } else if (value >= 1000) {
                                    return '₹' + (value / 1000).toFixed(1) + 'K';
                                }
                                return '₹' + value;
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Sales Count'
                        },
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
        
        window.financialChartState.salesChartInitialized = true;
        window.financialChartState.lastUpdate = Date.now();
        
        console.log('✅ Enhanced financial sales chart created successfully');
        return true;
        
    } catch (error) {
        console.error('❌ Failed to create financial sales chart:', error);
        return false;
    }
};

// Chart Auto-Initialization Function
window.initializeFinancialCharts = () => {
    console.log('🔍 Initializing financial charts...');
    
    // Wait for DOM and Chart.js to be ready
    if (document.readyState !== 'complete') {
        console.log('🔍 DOM not ready, waiting...');
        window.addEventListener('load', () => {
            setTimeout(window.initializeFinancialCharts, 500);
        });
        return;
    }
    
    if (!window.Chart) {
        console.log('🔍 Chart.js not ready, waiting...');
        setTimeout(window.initializeFinancialCharts, 500);
        return;
    }
    
    // Try to create the chart
    const success = window.createEnhancedFinancialSalesChart();
    
    if (!success) {
        console.log('🔍 Chart creation failed, will retry when canvas is available');
    }
};

// Chart Update Function (for data changes)
window.updateFinancialCharts = () => {
    if (!window.financialChartState.salesChartInitialized || !window.financialChartState.salesChartInstance) {
        console.log('🔍 Charts not initialized, creating new charts...');
        window.createEnhancedFinancialSalesChart();
        return;
    }
    
    console.log('🔍 Updating financial charts with new data...');
    
    try {
        const newData = window.processFinancialDataForCharts();
        const chart = window.financialChartState.salesChartInstance;
        
        // Update chart data
        chart.data = newData;
        chart.update('active');
        
        console.log('✅ Financial charts updated successfully');
    } catch (error) {
        console.error('❌ Failed to update financial charts:', error);
        // Recreate chart if update fails
        window.createEnhancedFinancialSalesChart();
    }
};

// Enhanced Chart Resize Handler
window.handleFinancialChartResize = () => {
    if (window.financialChartState.salesChartInstance) {
        window.financialChartState.salesChartInstance.resize();
    }
};

// FIXED: Safe variable declaration with unique name
if (!window.financialChartSystemInitialized) {
  window.financialChartSystemInitialized = true;
  
  window._originalSetActiveFinancialTab = window._originalSetActiveFinancialTab || window.setActiveFinancialTab;
  
  if (window._originalSetActiveFinancialTab) {
    window.setActiveFinancialTab = function(tab) {
      window._originalSetActiveFinancialTab(tab);
      
      if (tab === 'sales') {
        setTimeout(() => {
          window.createEnhancedFinancialSalesChart && window.createEnhancedFinancialSalesChart();
        }, 100);
      }
    };
  }
}

// React useEffect hook for chart initialization
window.useFinancialChartEffect = () => {
    React.useEffect(() => {
        // Initialize charts when component mounts
        const timer = setTimeout(() => {
            window.createEnhancedFinancialSalesChart();
        }, 100);
        
        // Cleanup function
        return () => {
            clearTimeout(timer);
            if (window.financialChartState.salesChartInstance) {
                window.financialChartState.salesChartInstance.destroy();
                window.financialChartState.salesChartInstance = null;
                window.financialChartState.salesChartInitialized = false;
            }
        };
    }, []);
};

// Window resize listener
window.addEventListener('resize', () => {
    clearTimeout(window.financialChartResizeTimeout);
    window.financialChartResizeTimeout = setTimeout(() => {
        window.handleFinancialChartResize();
    }, 250);
});


// Manual chart creation function (for debugging)
window.createFinancialSalesChart = window.createEnhancedFinancialSalesChart;
