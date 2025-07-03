import re

with open('index.html', 'r') as f:
    content = f.read()

# Check if charts already exist
if 'chart1' in content or 'leadSplitChart' in content:
    print("Charts seem to already exist")
    exit(0)

# Find the dashboard header "Welcome back"
welcome_pos = content.find("'Welcome back, '")
if welcome_pos == -1:
    print("Could not find Welcome back text")
    exit(1)

# Go back to find the parent div with space-y-6
space_start = content.rfind("'space-y-6'", 0, welcome_pos)
if space_start == -1:
    print("Could not find space-y-6 class")
    exit(1)

# Find the closing of the className object
brace_end = content.find('}', space_start)
comma_after = content.find(',', brace_end)

# Insert our charts
charts_code = '''
        // Three Pie Charts
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-6 mb-6' },
            React.createElement('div', { className: 'bg-white p-6 rounded-lg shadow' },
                React.createElement('h3', { className: 'text-lg font-semibold mb-4' }, 'Lead Split'),
                React.createElement('canvas', { id: 'pieChart1', width: '200', height: '200' })
            ),
            React.createElement('div', { className: 'bg-white p-6 rounded-lg shadow' },
                React.createElement('h3', { className: 'text-lg font-semibold mb-4' }, 'Lead Temperature (Count)'),
                React.createElement('canvas', { id: 'pieChart2', width: '200', height: '200' })
            ),
            React.createElement('div', { className: 'bg-white p-6 rounded-lg shadow' },
                React.createElement('h3', { className: 'text-lg font-semibold mb-4' }, 'Lead Temperature (Value)'),
                React.createElement('canvas', { id: 'pieChart3', width: '200', height: '200' })
            )
        ),'''

# Insert the charts
new_content = content[:comma_after+1] + '\n' + charts_code + '\n        ' + content[comma_after+1:]

# Now add a simple initialization in the existing useEffect for dashboard
dashboard_effect = content.find("activeTab === 'dashboard' && isLoggedIn")
if dashboard_effect > -1:
    # Find the closing of this useEffect
    effect_end = content.find('});', dashboard_effect)
    
    # Add chart initialization before the closing
    chart_init = '''
            // Initialize pie charts
            if (typeof Chart !== 'undefined') {
                const ctx1 = document.getElementById('pieChart1');
                const ctx2 = document.getElementById('pieChart2');
                const ctx3 = document.getElementById('pieChart3');
                
                if (ctx1) {
                    new Chart(ctx1.getContext('2d'), {
                        type: 'pie',
                        data: {
                            labels: ['Qualified', 'Junk'],
                            datasets: [{
                                data: [
                                    leads.filter(l => l.status !== 'junk').length || 1,
                                    leads.filter(l => l.status === 'junk').length || 1
                                ],
                                backgroundColor: ['#10B981', '#EF4444']
                            }]
                        },
                        options: { responsive: false }
                    });
                }
                
                if (ctx2) {
                    new Chart(ctx2.getContext('2d'), {
                        type: 'pie',
                        data: {
                            labels: ['Hot', 'Warm', 'Cold'],
                            datasets: [{
                                data: [
                                    leads.filter(l => l.status === 'hot').length || 1,
                                    leads.filter(l => l.status === 'warm').length || 1,
                                    leads.filter(l => l.status === 'cold').length || 1
                                ],
                                backgroundColor: ['#EF4444', '#F97316', '#3B82F6']
                            }]
                        },
                        options: { responsive: false }
                    });
                }
                
                if (ctx3) {
                    const hotVal = leads.filter(l => l.status === 'hot').reduce((s,l) => s + (parseFloat(l.potential_value)||0), 0) || 1;
                    const warmVal = leads.filter(l => l.status === 'warm').reduce((s,l) => s + (parseFloat(l.potential_value)||0), 0) || 1;
                    const coldVal = leads.filter(l => l.status === 'cold').reduce((s,l) => s + (parseFloat(l.potential_value)||0), 0) || 1;
                    
                    new Chart(ctx3.getContext('2d'), {
                        type: 'pie',
                        data: {
                            labels: ['Hot', 'Warm', 'Cold'],
                            datasets: [{
                                data: [hotVal, warmVal, coldVal],
                                backgroundColor: ['#EF4444', '#F97316', '#3B82F6']
                            }]
                        },
                        options: { responsive: false }
                    });
                }
            }
    '''
    
    new_content = new_content[:effect_end] + chart_init + '\n        ' + new_content[effect_end:]

with open('index.html', 'w') as f:
    f.write(new_content)

print("Charts added successfully!")
