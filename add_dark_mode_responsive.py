#!/usr/bin/env python3
import re

print("Adding dark mode and responsive design...")

with open('frontend/public/index.html', 'r') as f:
    content = f.read()

# 1. Add dark mode toggle button in header
print("1. Adding dark mode toggle...")

# Find the header section with user info
header_pattern = r'(React\.createElement\(\'div\', { className: \'w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center\' },\s*React\.createElement\(\'span\', { className: \'text-white text-sm\' }, \(user\?\.name \|\| \'A\'\)\[0\]\)\s*\))'

# Add dark mode toggle before the user avatar
dark_toggle = r'''React.createElement('button', {
                        onClick: () => {
                            setDarkMode(!darkMode);
                            document.documentElement.classList.toggle('dark');
                            localStorage.setItem('crm_dark_mode', !darkMode);
                        },
                        className: 'p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors'
                    }, darkMode ? '☀️' : '🌙'),
                    \1'''

content = re.sub(header_pattern, dark_toggle, content)

# 2. Apply dark mode on mount
print("2. Adding dark mode initialization...")

# Find where to add the dark mode useEffect
effect_pattern = r"(useEffect\(\(\) => {\s*if \(darkMode\) {\s*document\.documentElement\.classList\.add\('dark'\);\s*}\s*}, \[darkMode\]\);)"

# If it doesn't exist, add it after other useEffects
if not re.search(effect_pattern, content):
    pattern = r"(}, \[activeTab, isLoggedIn\]\);)"
    addition = r"""\1

    // Apply dark mode on mount
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        }
    }, [darkMode]);"""
    content = re.sub(pattern, addition, content)

# 3. Make sidebar responsive
print("3. Making sidebar responsive...")

# Add mobile menu state
state_pattern = r"(const \[darkMode, setDarkMode\] = useState\(\(\) => {[^}]+}\);)"
mobile_state = r"""\1
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);"""
content = re.sub(state_pattern, mobile_state, content)

# Update sidebar to be responsive
sidebar_pattern = r"const renderSidebar = \(\) => {\s*return React\.createElement\('div', { className: 'w-64 bg-gray-900 text-white flex flex-col' },"

responsive_sidebar = r"""const renderSidebar = () => {
        return React.createElement(React.Fragment, null,
            // Mobile menu button
            React.createElement('button', {
                className: 'lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-lg',
                onClick: () => setMobileMenuOpen(!mobileMenuOpen)
            }, mobileMenuOpen ? '✕' : '☰'),
            
            // Backdrop for mobile
            mobileMenuOpen && React.createElement('div', {
                className: 'lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40',
                onClick: () => setMobileMenuOpen(false)
            }),
            
            // Sidebar
            React.createElement('div', { 
                className: `${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 w-64 bg-gray-900 dark:bg-gray-950 text-white flex flex-col transition-transform duration-300 z-40` 
            },"""

content = re.sub(sidebar_pattern, responsive_sidebar, content)

# Close mobile menu on navigation
nav_pattern = r"(onClick: \(\) => setActiveTab\('[\w]+'\))"
nav_replacement = r"""\1,
                            onClick: () => {
                                setActiveTab('\1');
                                setMobileMenuOpen(false);
                            }"""

# 4. Make tables responsive
print("4. Making tables responsive...")

# Update table containers to be scrollable on mobile
table_pattern = r"React\.createElement\('div', { className: 'overflow-x-auto' },"
# Already has overflow-x-auto, good!

# 5. Make modals responsive
print("5. Making modals responsive...")

# Update modal max widths for mobile
modal_pattern = r"className: 'bg-white rounded-lg w-full max-w-(\w+)"
modal_replacement = r"className: 'bg-white dark:bg-gray-800 rounded-lg w-full max-w-\1 mx-4 lg:mx-0"

content = re.sub(modal_pattern, modal_replacement, content)

# 6. Update main layout for mobile
print("6. Updating main layout...")

# Update main container
main_pattern = r"React\.createElement\('div', { className: 'flex h-screen bg-gray-100' },"
main_replacement = r"React.createElement('div', { className: 'flex h-screen bg-gray-100 dark:bg-gray-900' },"
content = re.sub(main_pattern, main_replacement, content)

# Update header for mobile
header_class_pattern = r"React\.createElement\('header', { className: 'bg-white shadow-sm border-b px-6 py-4' },"
header_class_replacement = r"React.createElement('header', { className: 'bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 px-4 lg:px-6 py-4 ml-0 lg:ml-0' },"
content = re.sub(header_class_pattern, header_class_replacement, content)

# Update main content area
main_content_pattern = r"React\.createElement\('main', { className: 'flex-1 overflow-y-auto p-6' },"
main_content_replacement = r"React.createElement('main', { className: 'flex-1 overflow-y-auto p-4 lg:p-6' },"
content = re.sub(main_content_pattern, main_content_replacement, content)

# 7. Add responsive grid layouts
print("7. Adding responsive grids...")

# Update dashboard cards
grid_pattern = r"className: 'grid grid-cols-4 gap-6 mb-8'"
grid_replacement = r"className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8'"
content = re.sub(grid_pattern, grid_replacement, content)

# Update form grids
form_grid_pattern = r"className: 'grid grid-cols-2 gap-4'"
form_grid_replacement = r"className: 'grid grid-cols-1 md:grid-cols-2 gap-4'"
content = re.sub(form_grid_pattern, form_grid_replacement, content)

# 8. Add viewport meta tag if not present
print("8. Ensuring viewport meta tag...")

if 'viewport' not in content:
    head_pattern = r"(<head>)"
    viewport_meta = r"""\1
    <meta name="viewport" content="width=device-width, initial-scale=1.0">"""
    content = re.sub(head_pattern, viewport_meta, content)

# Save
with open('frontend/public/index.html', 'w') as f:
    f.write(content)

print("✅ Dark mode and responsive design added!")
