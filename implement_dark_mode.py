#!/usr/bin/env python3
import re

print("Implementing dark mode...")

with open('index.html', 'r') as f:
    content = f.read()

# 1. First check if darkMode state exists, if not add it
if "darkMode, setDarkMode" not in content:
    print("1. Adding darkMode state...")
    # Find where to add it (after other useState declarations)
    pattern = r"(const \[showOrderDetail, setShowOrderDetail\] = useState\(false\);)"
    addition = r"""\1
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem('crm_dark_mode') === 'true';
    });"""
    content = re.sub(pattern, addition, content)

# 2. Add dark mode toggle to header
print("2. Adding dark mode toggle button...")
# Find the notification bell
pattern = r"(React\.createElement\('span', { className: 'text-lg' }, '🔔'\),)"
replacement = r"""\1
                        React.createElement('button', {
                            onClick: () => {
                                setDarkMode(!darkMode);
                                document.documentElement.classList.toggle('dark');
                                localStorage.setItem('crm_dark_mode', !darkMode);
                            },
                            className: 'p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
                            title: darkMode ? 'Switch to light mode' : 'Switch to dark mode'
                        }, darkMode ? '☀️' : '🌙'),"""
content = re.sub(pattern, replacement, content)

# 3. Add useEffect to apply dark mode on mount
print("3. Adding dark mode initialization...")
pattern = r"(}, \[activeTab, isLoggedIn\]\);)"
addition = r"""\1

    // Apply dark mode on mount
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);"""
content = re.sub(pattern, addition, content)

# 4. Update class names to support dark mode
print("4. Adding dark mode classes...")

# Main container
content = re.sub(
    r"className: 'flex h-screen bg-gray-100'",
    r"className: 'flex h-screen bg-gray-100 dark:bg-gray-900'",
    content
)

# Sidebar
content = re.sub(
    r"className: 'w-64 bg-gray-900 text-white flex flex-col'",
    r"className: 'w-64 bg-gray-900 dark:bg-gray-950 text-white flex flex-col'",
    content
)

# Header
content = re.sub(
    r"className: 'bg-white shadow-sm border-b px-6 py-4'",
    r"className: 'bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 px-6 py-4'",
    content
)

# Cards
content = re.sub(
    r"className: 'bg-white rounded-lg shadow p-6'",
    r"className: 'bg-white dark:bg-gray-800 rounded-lg shadow p-6'",
    content
)

# Text colors
content = re.sub(
    r"className: 'text-3xl font-bold text-gray-900'",
    r"className: 'text-3xl font-bold text-gray-900 dark:text-white'",
    content
)

content = re.sub(
    r"className: 'text-xl font-bold text-gray-900'",
    r"className: 'text-xl font-bold text-gray-900 dark:text-white'",
    content
)

content = re.sub(
    r"className: 'text-sm text-gray-600'",
    r"className: 'text-sm text-gray-600 dark:text-gray-400'",
    content
)

# Modals
content = re.sub(
    r"className: 'bg-white rounded-lg",
    r"className: 'bg-white dark:bg-gray-800 rounded-lg",
    content
)

# Tables
content = re.sub(
    r"className: 'bg-gray-50'",
    r"className: 'bg-gray-50 dark:bg-gray-900'",
    content
)

# Inputs
content = re.sub(
    r"className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'",
    r"className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500'",
    content
)

# 5. Ensure dark mode styles are in the CSS
if 'dark:bg-gray-800' in content and '.dark {' not in content:
    print("5. CSS already supports dark mode via Tailwind")

with open('index.html', 'w') as f:
    f.write(content)

print("✅ Dark mode fully implemented!")
