#!/usr/bin/env python3
import re

with open('index.html', 'r') as f:
    content = f.read()

# First, add a mobile menu state if not exists
if "mobileMenuOpen, setMobileMenuOpen" not in content:
    pattern = r"(const \[darkMode, setDarkMode\] = useState\(\(\) => \{[^}]+\}\);)"
    addition = r"""\1
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);"""
    content = re.sub(pattern, addition, content)

# Add mobile header with menu
mobile_header = '''
        // Mobile Header (only visible on mobile)
        React.createElement('div', {
            className: 'lg:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-md z-50 px-4 py-3'
        },
            React.createElement('div', { className: 'flex items-center justify-between' },
                React.createElement('h1', { className: 'text-lg font-bold' }, 'FanToPark CRM'),
                React.createElement('div', { className: 'flex items-center space-x-2' },
                    React.createElement('button', {
                        onClick: () => {
                            setDarkMode(!darkMode);
                            document.documentElement.classList.toggle('dark');
                            localStorage.setItem('crm_dark_mode', !darkMode);
                        },
                        className: 'p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded'
                    }, darkMode ? '☀️' : '🌙'),
                    React.createElement('button', {
                        onClick: () => setMobileMenuOpen(!mobileMenuOpen),
                        className: 'p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded'
                    }, '☰')
                )
            )
        ),
        
        // Mobile Menu Dropdown
        mobileMenuOpen && React.createElement('div', {
            className: 'lg:hidden fixed top-14 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg z-50 w-48'
        },
            React.createElement('nav', { className: 'py-2' },
                ['dashboard', 'leads', 'inventory', 'orders', 'delivery'].map(item =>
                    React.createElement('button', {
                        key: item,
                        onClick: () => { setActiveTab(item); setMobileMenuOpen(false); },
                        className: `w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${activeTab === item ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : ''}`
                    }, item.charAt(0).toUpperCase() + item.slice(1))
                ),
                React.createElement('hr', { className: 'my-2 border-gray-200 dark:border-gray-700' }),
                React.createElement('button', {
                    onClick: handleLogout,
                    className: 'w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600'
                }, 'Logout')
            )
        ),
'''

# Insert mobile header before renderSidebar
pattern = r"(renderSidebar\(\),)"
content = re.sub(pattern, mobile_header + r"\1", content)

# Replace existing CSS with better mobile styles
old_css = r'<style>\s*\/\*[^<]*<\/style>'
new_mobile_css = '''    <style>
        /* Mobile-first responsive design */
        @media screen and (max-width: 1023px) {
            /* Hide desktop sidebar on mobile */
            .w-64.bg-gray-900 {
                display: none !important;
            }
            
            /* Remove margin from content */
            .flex-1 {
                margin-left: 0 !important;
            }
            
            /* Add top padding for fixed header */
            main {
                padding-top: 4rem !important;
            }
            
            /* Responsive grids */
            .grid.grid-cols-4 {
                grid-template-columns: repeat(2, 1fr);
                gap: 0.75rem;
            }
            
            .grid.grid-cols-2 {
                grid-template-columns: 1fr;
            }
            
            /* Compact cards */
            .rounded-lg.shadow.p-6 {
                padding: 0.75rem;
            }
            
            /* Mobile-friendly tables */
            .overflow-x-auto {
                margin: 0 -1rem;
                padding: 0 1rem;
            }
            
            table {
                font-size: 0.75rem;
            }
            
            /* Smaller padding */
            .p-6 {
                padding: 0.75rem;
            }
            
            /* Stack some buttons, keep others inline */
            td .flex.flex-wrap.gap-1 {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 0.25rem;
            }
            
            td .flex.flex-wrap.gap-1 button {
                font-size: 0.75rem;
                padding: 0.25rem 0.5rem;
            }
        }
        
        /* Desktop styles */
        @media screen and (min-width: 1024px) {
            /* Hide mobile header on desktop */
            .lg\\:hidden {
                display: none !important;
            }
        }
    </style>'''

content = re.sub(old_css, new_mobile_css, content, flags=re.DOTALL)

with open('index.html', 'w') as f:
    f.write(content)

print("✅ Mobile-first design implemented!")
print("\nMobile features:")
print("- Clean header with app name")
print("- Dropdown menu (hamburger icon)")
print("- No sidebar taking space")
print("- Content-focused layout")
print("- Dark mode toggle in header")
