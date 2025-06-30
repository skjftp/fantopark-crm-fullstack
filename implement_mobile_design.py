#!/usr/bin/env python3
import re

print("Implementing mobile-friendly design...")

with open('index.html', 'r') as f:
    content = f.read()

# 1. Add mobile menu state if not exists
print("1. Adding mobile menu state...")
if "mobileMenuOpen, setMobileMenuOpen" not in content:
    pattern = r"(const \[darkMode, setDarkMode\] = useState\(\(\) => {[^}]+}\);)"
    addition = r"""\1
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);"""
    content = re.sub(pattern, addition, content)

# 2. Update main container to be mobile-friendly
print("2. Updating main container...")
pattern = r"return React\.createElement\('div', { className: 'flex h-screen bg-gray-100 dark:bg-gray-900' },"
replacement = r"return React.createElement('div', { className: 'min-h-screen bg-gray-100 dark:bg-gray-900' },"
content = re.sub(pattern, replacement, content)

# 3. Add mobile header bar
print("3. Adding mobile header...")
# Find where renderSidebar() is called and wrap it
pattern = r"(renderSidebar\(\),)"
replacement = r"""// Mobile header
        React.createElement('div', { 
            className: 'lg:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-md z-50' 
        },
            React.createElement('div', { className: 'flex items-center justify-between p-4' },
                React.createElement('div', { className: 'flex items-center space-x-4' },
                    React.createElement('button', {
                        onClick: () => setMobileMenuOpen(!mobileMenuOpen),
                        className: 'p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg'
                    }, React.createElement('svg', { 
                        className: 'w-6 h-6', 
                        fill: 'none', 
                        stroke: 'currentColor', 
                        viewBox: '0 0 24 24' 
                    },
                        React.createElement('path', {
                            strokeLinecap: 'round',
                            strokeLinejoin: 'round',
                            strokeWidth: 2,
                            d: mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'
                        })
                    )),
                    React.createElement('h1', { className: 'text-lg font-semibold' }, 'FanToPark CRM')
                ),
                React.createElement('button', {
                    onClick: () => {
                        setDarkMode(!darkMode);
                        document.documentElement.classList.toggle('dark');
                        localStorage.setItem('crm_dark_mode', !darkMode);
                    },
                    className: 'p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg'
                }, darkMode ? '☀️' : '🌙')
            )
        ),
        
        // Desktop sidebar
        React.createElement('div', { 
            className: 'hidden lg:block w-64' 
        }, renderSidebar()),
        
        // Mobile sidebar with overlay
        React.createElement('div', {
            className: `lg:hidden fixed inset-0 z-40 ${mobileMenuOpen ? 'block' : 'hidden'}`
        },
            // Backdrop
            React.createElement('div', {
                className: 'fixed inset-0 bg-black bg-opacity-50',
                onClick: () => setMobileMenuOpen(false)
            }),
            // Sidebar
            React.createElement('div', {
                className: 'fixed inset-y-0 left-0 w-64 bg-gray-900 dark:bg-gray-950'
            }, renderSidebar())
        ),
        
        \1"""
content = re.sub(pattern, replacement, content)

# 4. Update main content wrapper
print("4. Updating content wrapper...")
pattern = r"React\.createElement\('div', { className: 'flex-1 flex flex-col overflow-hidden' },"
replacement = r"React.createElement('div', { className: 'flex-1 lg:ml-64 flex flex-col min-h-screen pt-16 lg:pt-0' },"
content = re.sub(pattern, replacement, content)

# 5. Hide desktop header on mobile
print("5. Updating header visibility...")
pattern = r"React\.createElement\('header', { className: 'bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 px-6 py-4' },"
replacement = r"React.createElement('header', { className: 'hidden lg:block bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 px-6 py-4' },"
content = re.sub(pattern, replacement, content)

# 6. Update navigation to close mobile menu
print("6. Updating navigation clicks...")
# Find all setActiveTab calls in sidebar
pattern = r"onClick: \(\) => setActiveTab\('(\w+)'\)"
replacement = r"onClick: () => { setActiveTab('\1'); setMobileMenuOpen(false); }"
content = re.sub(pattern, replacement, content)

# 7. Make grids responsive
print("7. Making grids responsive...")
replacements = [
    (r"className: 'grid grid-cols-4 gap-6 mb-8'", 
     r"className: 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6'"),
    (r"className: 'grid grid-cols-2 gap-4'", 
     r"className: 'grid grid-cols-1 sm:grid-cols-2 gap-4'"),
    (r"className: 'grid grid-cols-3 gap-6'", 
     r"className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'"),
]
for pattern, replacement in replacements:
    content = re.sub(pattern, replacement, content)

# 8. Update padding for mobile
print("8. Updating padding...")
content = re.sub(
    r"className: 'flex-1 overflow-y-auto p-6'",
    r"className: 'flex-1 overflow-y-auto p-4 sm:p-6'",
    content
)

# 9. Make modals mobile-friendly
print("9. Updating modals...")
modal_updates = [
    (r"className: 'bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-\[95vh\]",
     r"className: 'bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] mx-4 my-4 lg:mx-auto'"),
    (r"className: 'bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-\[95vh\]",
     r"className: 'bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] mx-4 my-4 lg:mx-auto'"),
    (r"className: 'bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-\[95vh\]",
     r"className: 'bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] mx-4 my-4 lg:mx-auto'"),
    (r"className: 'bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md'",
     r"className: 'bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-md mx-4 lg:mx-auto'"),
]
for pattern, replacement in modal_updates:
    content = re.sub(pattern, replacement, content)

# 10. Add responsive styles
print("10. Adding responsive styles...")
styles = '''
    <style>
        /* Mobile-first responsive design */
        @media (max-width: 1024px) {
            /* Ensure content doesn't go under mobile header */
            .pt-16 {
                padding-top: 4rem;
            }
        }
        
        /* Improve mobile tables */
        @media (max-width: 640px) {
            /* Make tables scrollable */
            .overflow-x-auto {
                -webkit-overflow-scrolling: touch;
                scrollbar-width: thin;
            }
            
            /* Smaller text in tables */
            table {
                font-size: 0.875rem;
            }
            
            td, th {
                padding: 0.5rem;
            }
            
            /* Stack buttons vertically */
            .flex.flex-wrap.gap-1 {
                flex-direction: column;
            }
            
            .flex.flex-wrap.gap-1 > button {
                width: 100%;
                justify-content: center;
            }
        }
        
        /* Ensure modals are centered on mobile */
        @media (max-width: 640px) {
            .fixed.inset-0 {
                padding: 1rem;
            }
        }
        
        /* Dark mode scrollbar */
        .dark::-webkit-scrollbar {
            background-color: #1f2937;
        }
        
        .dark::-webkit-scrollbar-thumb {
            background-color: #4b5563;
        }
    </style>
'''

# Add styles before </head>
if '</style>' not in content:
    content = content.replace('</head>', styles + '\n</head>')

with open('index.html', 'w') as f:
    f.write(content)

print("✅ Mobile design implemented successfully!")
