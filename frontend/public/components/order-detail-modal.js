// Order Detail Modal Component for FanToPark CRM
// Updated to EXACTLY match production.html UI from screenshots

window.renderOrderDetailModal = () => {
  // ✅ State extraction with proper fallbacks
  const showOrderDetail = window.showOrderDetail || window.appState?.showOrderDetail;
  const currentOrderDetail = window.currentOrderDetail || window.appState?.currentOrderDetail;
  
  const setShowOrderDetail = window.setShowOrderDetail || (() => {
    window.showOrderDetail = false;
    if (window.appState) window.appState.showOrderDetail = false;
  });
  
  const hasPermission = window.hasPermission || (() => false);
  const handleOrderApproval = window.handleOrderApproval || (() => console.warn("handleOrderApproval not implemented"));

  //console.log('Modal render check:', { showOrderDetail, currentOrderDetail: !!currentOrderDetail });
  
  if (!showOrderDetail || !currentOrderDetail) {
    return null;
  }

  console.log('✅ Rendering EXACT PRODUCTION order detail modal for:', currentOrderDetail.order_number || currentOrderDetail.id);

  return React.createElement('div', { 
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 md:p-0',
    onClick: (e) => e.target === e.currentTarget && setShowOrderDetail(false)
  },
    React.createElement('div', { 
      className: 'bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl mx-auto' 
    },
      // Header with X button
      React.createElement('div', { className: 'flex justify-between items-center p-4 md:p-6 border-b border-gray-200' },
        React.createElement('h2', { className: 'text-lg md:text-xl font-semibold text-gray-900' }, 
          'Order Details: ' + (currentOrderDetail.order_number || currentOrderDetail.id)
        ),
        React.createElement('button', {
          onClick: () => setShowOrderDetail(false),
          className: 'text-gray-400 hover:text-gray-600 text-xl'
        }, '✕')
      ),

      // Main Content
      React.createElement('div', { className: 'p-4 md:p-6 space-y-4 md:space-y-6' },
        
        // 👤 Client Information Section
        React.createElement('div', null,
          React.createElement('div', { className: 'flex items-center mb-4' },
            React.createElement('span', { className: 'text-blue-600 text-lg mr-2' }, '👤'),
            React.createElement('h3', { className: 'text-lg font-semibold text-gray-900' }, 'Client Information')
          ),
          React.createElement('div', { className: 'grid grid-cols-2 gap-4 text-sm' },
            React.createElement('div', null,
              React.createElement('div', { className: 'mb-3' },
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Legal Name: '),
                React.createElement('span', { className: 'text-gray-900' }, currentOrderDetail.legal_name || currentOrderDetail.client_name || 'N/A')
              ),
              React.createElement('div', { className: 'mb-3' },
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Phone: '),
                React.createElement('span', { className: 'text-gray-900' }, currentOrderDetail.client_phone || currentOrderDetail.phone || 'N/A')
              ),
              React.createElement('div', { className: 'mb-3' },
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Category: '),
                React.createElement('span', { className: 'text-gray-900' }, currentOrderDetail.category_of_sale || 'Retail')
              )
            ),
            React.createElement('div', null,
              React.createElement('div', { className: 'mb-3' },
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Email: '),
                React.createElement('span', { className: 'text-gray-900' }, currentOrderDetail.client_email || currentOrderDetail.email || 'N/A')
              ),
              React.createElement('div', { className: 'mb-3' },
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'GSTIN: '),
                React.createElement('span', { className: 'text-gray-900' }, currentOrderDetail.gstin || 'Not Provided')
              ),
              React.createElement('div', { className: 'mb-3' },
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'State: '),
                React.createElement('span', { className: 'text-gray-900' }, currentOrderDetail.indian_state || currentOrderDetail.state || 'N/A')
              )
            )
          ),
          // Address (full width)
          currentOrderDetail.address && React.createElement('div', { className: 'mt-3' },
            React.createElement('span', { className: 'font-medium text-gray-700' }, 'Address: '),
            React.createElement('span', { className: 'text-gray-900' }, currentOrderDetail.address)
          )
        ),

        // 📋 Order Information Section  
        React.createElement('div', null,
          React.createElement('div', { className: 'flex items-center mb-4' },
            React.createElement('span', { className: 'text-blue-600 text-lg mr-2' }, '📋'),
            React.createElement('h3', { className: 'text-lg font-semibold text-gray-900' }, 'Order Information')
          ),
          React.createElement('div', { className: 'grid grid-cols-2 gap-4 text-sm' },
            React.createElement('div', null,
              React.createElement('div', { className: 'mb-3' },
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Event: '),
                React.createElement('span', { className: 'text-gray-900' }, currentOrderDetail.event_name || 'N/A')
              ),
              React.createElement('div', { className: 'mb-3' },
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Tickets: '),
                React.createElement('span', { className: 'text-gray-900' }, 
                  (currentOrderDetail.tickets_allocated || currentOrderDetail.quantity || 0) + 
                  ' - ' + (currentOrderDetail.ticket_category || 'Retail')
                )
              )
            ),
            React.createElement('div', null,
              React.createElement('div', { className: 'mb-3' },
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Event Date: '),
                React.createElement('span', { className: 'text-gray-900' }, 
                  currentOrderDetail.event_date ? 
                    new Date(currentOrderDetail.event_date).toLocaleDateString() : 'N/A'
                )
              ),
              React.createElement('div', { className: 'mb-3' },
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Status: '),
                React.createElement('span', { 
                  className: `inline-flex px-2 py-1 text-xs font-medium rounded ${
                    currentOrderDetail.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                    currentOrderDetail.status === 'approved' ? 'bg-green-100 text-green-800' :
                    currentOrderDetail.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`
                }, currentOrderDetail.status === 'pending_approval' ? 'Pending Approval' : 
                   (currentOrderDetail.status || 'N/A'))
              )
            )
          )
        ),

        // 💰 Financial Details Section
        React.createElement('div', null,
          React.createElement('div', { className: 'flex items-center mb-4' },
            React.createElement('span', { className: 'text-yellow-600 text-lg mr-2' }, '💰'),
            React.createElement('h3', { className: 'text-lg font-semibold text-gray-900' }, 'Financial Details')
          ),
          React.createElement('div', { className: 'grid grid-cols-2 gap-4 text-sm' },
            React.createElement('div', null,
              React.createElement('div', { className: 'mb-3' },
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Total Amount: '),
                React.createElement('span', { className: 'text-gray-900 font-semibold' }, 
                  window.formatCurrency(currentOrderDetail.final_amount || currentOrderDetail.total_amount || currentOrderDetail.amount || 0, currentOrderDetail.payment_currency || currentOrderDetail.currency || 'INR')
                )
              ),
              React.createElement('div', { className: 'mb-3' },
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Balance Due: '),
                React.createElement('span', { className: 'text-red-600 font-semibold' }, 
                  window.formatCurrency((currentOrderDetail.final_amount || currentOrderDetail.total_amount || 0) - 
                         (currentOrderDetail.advance_received || currentOrderDetail.advance_amount || 0), currentOrderDetail.payment_currency || currentOrderDetail.currency || 'INR')
                )
              ),
              React.createElement('div', { className: 'mb-3' },
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Payment Method: '),
                React.createElement('span', { className: 'text-gray-900' }, currentOrderDetail.payment_method || 'Bank Transfer')
              )
            ),
            React.createElement('div', null,
              React.createElement('div', { className: 'mb-3' },
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Advance Received: '),
                React.createElement('span', { className: 'text-green-600 font-semibold' }, 
                  window.formatCurrency(currentOrderDetail.advance_received || currentOrderDetail.advance_amount || 0, currentOrderDetail.payment_currency || currentOrderDetail.currency || 'INR')
                )
              ),
              React.createElement('div', { className: 'mb-3' },
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Total Tax (GST + TCS): '),
                React.createElement('span', { className: 'text-gray-900' }, 
                  window.formatCurrency((currentOrderDetail.gst_amount || 0) + (currentOrderDetail.tcs_amount || 0), currentOrderDetail.payment_currency || currentOrderDetail.currency || 'INR')
                )
              ),
              React.createElement('div', { className: 'mb-3' },
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Transaction ID: '),
                React.createElement('span', { className: 'text-gray-900' }, currentOrderDetail.transaction_id || 'N/A')
              )
            )
          )
        ),

           ),

        // 🔧 Assignment Information Section
        React.createElement('div', null,
          React.createElement('div', { className: 'flex items-center mb-4' },
            React.createElement('span', { className: 'text-gray-600 text-lg mr-2' }, '🔧'),
            React.createElement('h3', { className: 'text-lg font-semibold text-gray-900' }, 'Assignment Information')
          ),
          React.createElement('div', { className: 'grid grid-cols-2 gap-4 text-sm' },
            React.createElement('div', null,
              React.createElement('div', { className: 'mb-3' },
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Created By: '),
                React.createElement('span', { className: 'text-gray-900' }, currentOrderDetail.created_by || 'N/A')
              ),
              React.createElement('div', { className: 'mb-3' },
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Created Date: '),
                React.createElement('span', { className: 'text-gray-900' }, 
                  currentOrderDetail.created_date ? 
                    new Date(currentOrderDetail.created_date).toLocaleDateString() : 'N/A'
                )
              ),
              React.createElement('div', { className: 'mb-3' },
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Sales Person: '),
                React.createElement('span', { className: 'text-gray-900' }, 
                  currentOrderDetail.sales_person || 'Not Assigned'
                ),
                // Show edit button for admin/manager roles
                (hasPermission('orders', 'write') && (window.user?.role === 'super_admin' || window.user?.role === 'supply_sales_service_manager' || window.user?.role === 'finance_manager' || window.user?.role === 'sales_manager')) &&
                React.createElement('button', {
                  className: 'ml-2 text-blue-600 hover:text-blue-800 text-xs',
                  onClick: () => {
                    console.log('Edit Sales Person clicked at', new Date().toISOString());
                    
                    // Try to load the function dynamically if it doesn't exist
                    if (!window.showSalesPersonEditModal) {
                      console.log('Function not found, checking if script loaded...');
                      const scriptTag = document.querySelector('script[src*="sales-person-edit-modal.js"]');
                      console.log('Script tag found:', !!scriptTag);
                      
                      // If render function exists, the script loaded but function was deleted
                      if (window.renderSalesPersonEditModal) {
                        console.error('❌ Script loaded but showSalesPersonEditModal was deleted or overwritten!');
                      }
                      
                      // Try one more time after a delay
                      setTimeout(() => {
                        if (window.showSalesPersonEditModal) {
                          console.log('✅ Function found after delay!');
                          window.showSalesPersonEditModal(currentOrderDetail);
                        } else {
                          console.log('Using fallback prompt - modal function still not found');
                          const salesPerson = prompt('Enter sales person email:', currentOrderDetail.sales_person || '');
                          if (salesPerson !== null) {
                            window.updateOrderSalesPerson(currentOrderDetail.id, salesPerson);
                          }
                        }
                      }, 100);
                    } else {
                      console.log('✅ Function exists, calling it...');
                      window.showSalesPersonEditModal(currentOrderDetail);
                    }
                  }
                }, '✏️ Edit')
              )
            ),
            React.createElement('div', null,
              React.createElement('div', { className: 'mb-3' },
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Assigned To: '),
                React.createElement('span', { className: 'text-gray-900' }, currentOrderDetail.assigned_to || 'N/A')
              ),
              React.createElement('div', { className: 'mb-3' },
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Assigned Team: '),
                React.createElement('span', { className: 'text-gray-900' }, currentOrderDetail.assigned_team || 'N/A')
              ),
              React.createElement('div', { className: 'mb-3' },
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Assignment Date: '),
                React.createElement('span', { className: 'text-gray-900' }, 
                  currentOrderDetail.assignment_date || currentOrderDetail.assigned_date ? 
                    new Date(currentOrderDetail.assignment_date || currentOrderDetail.assigned_date).toLocaleDateString() : 'N/A'
                )
              )
            )
          )
        ),

        // 🎫 Linked Allocations Section
        (() => {
          // Function to fetch available allocations when clicked
          const fetchAvailableAllocations = async () => {
            if (!currentOrderDetail.lead_id || !currentOrderDetail.event_name) {
              console.warn('Missing lead_id or event_name for fetching allocations');
              return;
            }

            try {
              const response = await window.apiCall(`/allocations?lead_id=${currentOrderDetail.lead_id}&event_name=${encodeURIComponent(currentOrderDetail.event_name)}`);
              if (response.data) {
                // Filter to show only unlinked allocations or allocations linked to this order
                const relevantAllocations = response.data.filter(allocation => 
                  !allocation.order_ids || allocation.order_ids.length === 0 || 
                  allocation.order_ids.includes(currentOrderDetail.id)
                );
                
                // Store in window for easy access
                window.orderDetailAllocations = relevantAllocations;
                
                // Force re-render
                if (window.setShowOrderDetail) {
                  window.setShowOrderDetail(true);
                }
              }
            } catch (error) {
              console.error('Error fetching allocations:', error);
            }
          };

          // Initialize state for expanded view
          if (!window.orderDetailAllocationsExpanded) {
            window.orderDetailAllocationsExpanded = false;
          }

          const linkedAllocations = window.orderDetailAllocations?.filter(a => 
            a.order_ids && a.order_ids.includes(currentOrderDetail.id)
          ) || [];
          
          const availableAllocations = window.orderDetailAllocations?.filter(a => 
            !a.order_ids || a.order_ids.length === 0
          ) || [];

          return React.createElement('div', null,
            React.createElement('div', { className: 'flex items-center mb-4' },
              React.createElement('span', { className: 'text-blue-600 text-lg mr-2' }, '🎫'),
              React.createElement('h3', { className: 'text-lg font-semibold text-gray-900' }, 'Allocations'),
              React.createElement('button', {
                className: 'ml-auto text-blue-600 hover:text-blue-800 text-sm',
                onClick: async () => {
                  if (!window.orderDetailAllocations) {
                    await fetchAvailableAllocations();
                  }
                  window.orderDetailAllocationsExpanded = !window.orderDetailAllocationsExpanded;
                  // Force re-render
                  if (window.setShowOrderDetail) {
                    window.setShowOrderDetail(true);
                  }
                }
              }, window.orderDetailAllocationsExpanded ? '−' : '+')
            ),
            
            // Summary view when collapsed
            !window.orderDetailAllocationsExpanded && React.createElement('div', { className: 'text-sm text-gray-600' },
              `${linkedAllocations.length} linked allocation(s) ${availableAllocations.length > 0 ? `• ${availableAllocations.length} available to link` : ''}`
            ),
            
            // Expanded view with allocations
            window.orderDetailAllocationsExpanded && React.createElement('div', { className: 'space-y-4' },
              // Linked allocations
              linkedAllocations.length > 0 && React.createElement('div', null,
                React.createElement('h4', { className: 'font-medium text-gray-700 mb-2' }, 'Linked Allocations'),
                React.createElement('div', { className: 'space-y-2' },
                  linkedAllocations.map(allocation => 
                    React.createElement('div', { 
                      key: allocation.id,
                      className: 'p-2 bg-gray-50 rounded text-sm'
                    },
                      React.createElement('div', { className: 'flex justify-between items-center' },
                        React.createElement('span', null,
                          `${allocation.tickets_allocated} tickets • ${allocation.category_name || 'General'} • ${allocation.lead_details?.name || 'Unknown'}`
                        ),
                        hasPermission('orders', 'write') && React.createElement('button', {
                          className: 'text-red-600 hover:text-red-800 text-xs',
                          onClick: async () => {
                            if (confirm('Unlink this allocation from the order?')) {
                              // Call reassign with null to unlink
                              try {
                                await window.apiCall(`/orders/allocations/${allocation.id}/reassign`, {
                                  method: 'PUT',
                                  body: JSON.stringify({ new_order_id: null })
                                });
                                await fetchAvailableAllocations();
                                alert('Allocation unlinked successfully');
                              } catch (error) {
                                alert('Failed to unlink allocation: ' + error.message);
                              }
                            }
                          }
                        }, 'Unlink')
                      )
                    )
                  )
                )
              ),
              
              // Available allocations to link
              availableAllocations.length > 0 && React.createElement('div', null,
                React.createElement('h4', { className: 'font-medium text-gray-700 mb-2' }, 'Available Allocations to Link'),
                React.createElement('div', { className: 'space-y-2' },
                  availableAllocations.map(allocation => 
                    React.createElement('div', { 
                      key: allocation.id,
                      className: 'p-2 bg-blue-50 rounded text-sm'
                    },
                      React.createElement('div', { className: 'flex justify-between items-center' },
                        React.createElement('span', null,
                          `${allocation.tickets_allocated} tickets • ${allocation.category_name || 'General'} • ${allocation.lead_details?.name || 'Unknown'}`
                        ),
                        hasPermission('orders', 'write') && React.createElement('button', {
                          className: 'bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700',
                          onClick: async () => {
                            try {
                              await window.apiCall(`/orders/allocations/${allocation.id}/reassign`, {
                                method: 'PUT',
                                body: JSON.stringify({ new_order_id: currentOrderDetail.id })
                              });
                              await fetchAvailableAllocations();
                              alert('Allocation linked successfully');
                            } catch (error) {
                              alert('Failed to link allocation: ' + error.message);
                            }
                          }
                        }, 'Link to Order')
                      )
                    )
                  )
                )
              ),
              
              // No allocations message
              linkedAllocations.length === 0 && availableAllocations.length === 0 && 
              React.createElement('p', { className: 'text-sm text-gray-500' }, 'No allocations found for this lead and event')
            )
          );
        })(),

            // 🏷️ Uploaded Documents Section - UPDATED WITH DOWNLOAD FUNCTIONALITY
            React.createElement('div', null,               

            // 🏷️ Uploaded Documents Section - UPDATED WITH DOWNLOAD FUNCTIONALITY
            React.createElement('div', null,
              React.createElement('div', { className: 'flex items-center mb-4' },
                React.createElement('span', { className: 'text-gray-600 text-lg mr-2' }, '🏷️'),
                React.createElement('h3', { className: 'text-lg font-semibold text-gray-900' }, 'Uploaded Documents')
              ),
              React.createElement('div', { className: 'grid grid-cols-2 gap-4 text-sm' },
                React.createElement('div', null,
                  React.createElement('span', { className: 'font-medium text-gray-700' }, 'GST Certificate: '),
                  currentOrderDetail.gst_certificate ? 
                    React.createElement('button', {
                      className: 'text-blue-600 hover:text-blue-800 hover:underline cursor-pointer ml-1',
                      onClick: () => downloadOrderDocument(currentOrderDetail.id, 'gst_certificate', currentOrderDetail.gst_certificate),
                      title: 'Click to download GST Certificate'
                    }, 
                      `📄 ${currentOrderDetail.gst_certificate.originalName || 'GST Certificate'}`
                    ) :
                    React.createElement('span', { className: 'text-orange-600' }, 'Not uploaded')
                ),
                React.createElement('div', null,
                  React.createElement('span', { className: 'font-medium text-gray-700' }, 'PAN Card: '),
                  currentOrderDetail.pan_card ? 
                    React.createElement('button', {
                      className: 'text-blue-600 hover:text-blue-800 hover:underline cursor-pointer ml-1',
                      onClick: () => downloadOrderDocument(currentOrderDetail.id, 'pan_card', currentOrderDetail.pan_card),
                      title: 'Click to download PAN Card'
                    }, 
                      `📄 ${currentOrderDetail.pan_card.originalName || 'PAN Card'}`
                    ) :
                    React.createElement('span', { className: 'text-orange-600' }, 'Not uploaded')
                )
              )
            ),

        // Action Buttons Section
        React.createElement('div', { className: 'flex flex-col sm:flex-row justify-center gap-3 sm:space-x-4 pt-4 md:pt-6 border-t border-gray-200' },
          // Show approval buttons for pending orders
          currentOrderDetail.status === 'pending_approval' && hasPermission('orders', 'approve') ? [
            React.createElement('button', {
              key: 'approve',
              className: 'flex items-center px-4 md:px-6 py-2 md:py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors sm:min-w-[140px] justify-center w-full sm:w-auto',
              onClick: () => {
                handleOrderApproval(currentOrderDetail.id, 'approve');
                setShowOrderDetail(false);
              }
            }, '✓ Approve Order'),
            React.createElement('button', {
              key: 'reject',
              className: 'flex items-center px-4 md:px-6 py-2 md:py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors sm:min-w-[140px] justify-center w-full sm:w-auto',
              onClick: () => {
                const reason = prompt('Please provide a reason for rejection:');
                if (reason) {
                  handleOrderApproval(currentOrderDetail.id, 'reject', reason);
                  setShowOrderDetail(false);
                }
              }
            }, 'Reject Order')
          ] : [
            // For non-pending orders, show Close button
            React.createElement('button', {
              key: 'close',
              className: 'px-4 md:px-6 py-2 md:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors w-full sm:w-auto',
              onClick: () => setShowOrderDetail(false)
            }, 'Close')
          ]
        )
      )
    )
  );
};

// ===== DOCUMENT DOWNLOAD FUNCTION =====
window.downloadOrderDocument = async function(orderId, documentType, documentData) {
  console.log(`📄 Starting download for ${documentType} from order ${orderId}`);
  console.log('📄 Document data:', documentData);
  
  if (!documentData) {
    alert(`No ${documentType.replace('_', ' ')} file found for this order.`);
    return;
  }
  
  try {
    // Try to use the existing file view URL function first
    if (documentData.publicUrl) {
      console.log('📄 Using direct public URL');
      const link = document.createElement('a');
      link.href = documentData.publicUrl;
      link.download = documentData.originalName || documentData.filename || `${documentType}.pdf`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    
    // If we have a filePath, try to get a signed URL
    if (documentData.filePath && window.getFileViewUrl) {
      console.log('📄 Getting signed URL for file path:', documentData.filePath);
      const signedUrl = await window.getFileViewUrl(documentData.filePath);
      if (signedUrl) {
        const link = document.createElement('a');
        link.href = signedUrl;
        link.download = documentData.originalName || documentData.filename || `${documentType}.pdf`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
    }
    
    // Fallback: try backend API endpoint
    console.log('📄 Trying backend download endpoint');
    const response = await window.apiCall(`/orders/${orderId}/documents/${documentType}/download`, {
      method: 'GET'
    });
    
    if (response.success && response.downloadUrl) {
      const link = document.createElement('a');
      link.href = response.downloadUrl;
      link.download = documentData.originalName || documentData.filename || `${documentType}.pdf`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (response.fileData) {
      // Handle base64 file data
      const byteCharacters = atob(response.fileData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      
      const filename = documentData.originalName || documentData.filename || `${documentType}.pdf`;
      const extension = filename.split('.').pop().toLowerCase();
      let mimeType = 'application/octet-stream';
      
      switch (extension) {
        case 'pdf':
          mimeType = 'application/pdf';
          break;
        case 'jpg':
        case 'jpeg':
          mimeType = 'image/jpeg';
          break;
        case 'png':
          mimeType = 'image/png';
          break;
      }
      
      const blob = new Blob([byteArray], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      throw new Error('No download method available');
    }
    
    console.log('✅ Document download completed successfully');
    
  } catch (error) {
    console.error(`❌ ${documentType} download error:`, error);
    alert(`Failed to download ${documentType.replace('_', ' ')}: ${error.message}`);
  }
};

console.log('✅ EXACT PRODUCTION order detail modal loaded - matches screenshots!');
