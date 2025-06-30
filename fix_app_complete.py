#!/usr/bin/env python3

with open('index.html', 'r') as f:
    content = f.read()

# Check if App function exists anywhere
if 'const App = () => {' not in content and 'function App()' not in content:
    print("App function is missing! Adding it...")
    
    # Add a basic App function before ReactDOM.render
    app_function = '''
const App = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    
    if (!isLoggedIn) {
        return React.createElement('div', { className: 'min-h-screen bg-gray-100 flex items-center justify-center' },
            React.createElement('div', { className: 'bg-white p-8 rounded-lg shadow-md' },
                React.createElement('h1', { className: 'text-2xl font-bold mb-4' }, 'FanToPark CRM'),
                React.createElement('p', null, 'App function was missing. Please restore from backup.'),
                React.createElement('button', {
                    onClick: () => setIsLoggedIn(true),
                    className: 'mt-4 bg-blue-500 text-white px-4 py-2 rounded'
                }, 'Click to Continue')
            )
        );
    }
    
    return React.createElement('div', null, 'Main app content here...');
};

'''
    
    # Insert before ReactDOM.render
    content = content.replace('ReactDOM.render(React.createElement(App)', app_function + 'ReactDOM.render(React.createElement(App)')
    
    with open('index.html', 'w') as f:
        f.write(content)
    
    print("Basic App function added. Page should load now.")
else:
    print("App function found in file")
    # Show where it is
    index = content.find('const App = ')
    if index > 0:
        print(f"Found at character position: {index}")
        print("First 100 chars:", content[index:index+100])

