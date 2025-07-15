// Change Password Component
window.renderChangePassword = () => {
    const [currentPassword, setCurrentPassword] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [showPasswords, setShowPasswords] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [message, setMessage] = React.useState({ type: '', text: '' });

    const validatePassword = (password) => {
        // Password requirements
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (password.length < minLength) {
            return 'Password must be at least 8 characters long';
        }
        if (!hasUpperCase || !hasLowerCase) {
            return 'Password must contain both uppercase and lowercase letters';
        }
        if (!hasNumbers) {
            return 'Password must contain at least one number';
        }
        if (!hasSpecialChar) {
            return 'Password must contain at least one special character';
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        // Validations
        if (!currentPassword || !newPassword || !confirmPassword) {
            setMessage({ type: 'error', text: 'All fields are required' });
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (currentPassword === newPassword) {
            setMessage({ type: 'error', text: 'New password must be different from current password' });
            return;
        }

        const passwordError = validatePassword(newPassword);
        if (passwordError) {
            setMessage({ type: 'error', text: passwordError });
            return;
        }

        setLoading(true);

        try {
            // Call API to change password
            const response = await window.apiCall('/auth/change-password', 'POST', {
                currentPassword,
                newPassword
            });

            if (response.success) {
                setMessage({ type: 'success', text: 'Password changed successfully!' });
                // Clear form
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setMessage({ type: 'error', text: response.error || 'Failed to change password' });
            }
        } catch (error) {
            console.error('Change password error:', error);
            setMessage({ type: 'error', text: error.message || 'Failed to change password' });
        } finally {
            setLoading(false);
        }
    };

    return React.createElement('div', { className: 'max-w-2xl mx-auto p-6' },
        // Header
        React.createElement('div', { className: 'mb-8' },
            React.createElement('h1', { className: 'text-2xl font-bold text-gray-900 dark:text-white' }, 
                'Change Password'
            ),
            React.createElement('p', { className: 'mt-2 text-sm text-gray-600 dark:text-gray-400' }, 
                'Update your password to keep your account secure'
            )
        ),

        // Form
        React.createElement('div', { className: 'bg-white dark:bg-gray-800 shadow rounded-lg p-6' },
            React.createElement('form', { onSubmit: handleSubmit, className: 'space-y-6' },
                // Current Password
                React.createElement('div', null,
                    React.createElement('label', { 
                        htmlFor: 'current-password',
                        className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' 
                    }, 'Current Password'),
                    React.createElement('div', { className: 'relative' },
                        React.createElement('input', {
                            id: 'current-password',
                            type: showPasswords ? 'text' : 'password',
                            value: currentPassword,
                            onChange: (e) => setCurrentPassword(e.target.value),
                            className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                            placeholder: 'Enter current password',
                            disabled: loading
                        })
                    )
                ),

                // New Password
                React.createElement('div', null,
                    React.createElement('label', { 
                        htmlFor: 'new-password',
                        className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' 
                    }, 'New Password'),
                    React.createElement('input', {
                        id: 'new-password',
                        type: showPasswords ? 'text' : 'password',
                        value: newPassword,
                        onChange: (e) => setNewPassword(e.target.value),
                        className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                        placeholder: 'Enter new password',
                        disabled: loading
                    })
                ),

                // Confirm New Password
                React.createElement('div', null,
                    React.createElement('label', { 
                        htmlFor: 'confirm-password',
                        className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' 
                    }, 'Confirm New Password'),
                    React.createElement('input', {
                        id: 'confirm-password',
                        type: showPasswords ? 'text' : 'password',
                        value: confirmPassword,
                        onChange: (e) => setConfirmPassword(e.target.value),
                        className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                        placeholder: 'Confirm new password',
                        disabled: loading
                    })
                ),

                // Show/Hide Password Toggle
                React.createElement('div', { className: 'flex items-center' },
                    React.createElement('input', {
                        id: 'show-passwords',
                        type: 'checkbox',
                        checked: showPasswords,
                        onChange: (e) => setShowPasswords(e.target.checked),
                        className: 'h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                    }),
                    React.createElement('label', { 
                        htmlFor: 'show-passwords',
                        className: 'ml-2 block text-sm text-gray-700 dark:text-gray-300' 
                    }, 'Show passwords')
                ),

                // Password Requirements
                React.createElement('div', { className: 'bg-gray-50 dark:bg-gray-700 rounded-md p-4' },
                    React.createElement('p', { className: 'text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' }, 
                        'Password Requirements:'
                    ),
                    React.createElement('ul', { className: 'text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside' },
                        React.createElement('li', null, 'At least 8 characters long'),
                        React.createElement('li', null, 'Contains uppercase and lowercase letters'),
                        React.createElement('li', null, 'Contains at least one number'),
                        React.createElement('li', null, 'Contains at least one special character')
                    )
                ),

                // Message Display
                message.text && React.createElement('div', {
                    className: `p-4 rounded-md ${
                        message.type === 'error' 
                            ? 'bg-red-50 text-red-800' 
                            : 'bg-green-50 text-green-800'
                    }`
                }, message.text),

                // Submit Button
                React.createElement('div', { className: 'flex justify-end space-x-3' },
                    React.createElement('button', {
                        type: 'button',
                        onClick: () => {
                            setCurrentPassword('');
                            setNewPassword('');
                            setConfirmPassword('');
                            setMessage({ type: '', text: '' });
                        },
                        className: 'px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50',
                        disabled: loading
                    }, 'Clear'),
                    React.createElement('button', {
                        type: 'submit',
                        className: 'px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed',
                        disabled: loading
                    }, loading ? 'Changing...' : 'Change Password')
                )
            )
        )
    );
};
