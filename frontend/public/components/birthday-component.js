// Birthday Component for Fantopark CRM
window.BirthdayCheck = function({ user }) {
    const [showBirthday, setShowBirthday] = React.useState(false);
    
    React.useEffect(() => {
        if (!user || !user.birthday) return;
        
        const today = new Date();
        const birthday = new Date(user.birthday);
        
        if (today.getMonth() === birthday.getMonth() && 
            today.getDate() === birthday.getDate()) {
            
            const storageKey = `birthday_dismissed_${today.getFullYear()}_${user.email || user.name}`;
            const isDismissed = localStorage.getItem(storageKey);
            
            if (!isDismissed) {
                setShowBirthday(true);
            }
        }
    }, [user]);
    
    if (!showBirthday) return null;
    
    return React.createElement(window.BirthdayBalloons, {
        userName: user.name || user.email,
        onClose: () => setShowBirthday(false)
    });
};

// Birthday Balloons Animation Component - FIXED VERSION
window.BirthdayBalloons = function({ userName = "User", onClose }) {
    const [visible, setVisible] = React.useState(true);
    
    const handleClose = () => {
        setVisible(false);
        if (onClose) {
            setTimeout(onClose, 300);
        }
    };
    
    const handleDontShowAgain = () => {
        const storageKey = `birthday_dismissed_${new Date().getFullYear()}_${userName}`;
        localStorage.setItem(storageKey, 'true');
        handleClose();
    };
    
    React.useEffect(() => {
        // Add styles to document
        const styleId = 'birthday-animations-style';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                .birthday-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .birthday-message {
                    background: white;
                    padding: 40px 60px;
                    border-radius: 20px;
                    text-align: center;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
                }
                .birthday-message h1 {
                    font-size: 3em;
                    margin: 0 0 20px 0;
                    color: #333;
                }
                .birthday-message p {
                    font-size: 1.2em;
                    color: #666;
                    margin: 0 0 30px 0;
                }
                .birthday-actions {
                    display: flex;
                    gap: 15px;
                    justify-content: center;
                }
                .birthday-btn {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 8px;
                    font-size: 1em;
                    cursor: pointer;
                    font-weight: 500;
                }
                .birthday-btn-primary {
                    background: #4ecdc4;
                    color: white;
                }
                .birthday-btn-secondary {
                    background: #f0f0f0;
                    color: #666;
                }
            `;
            document.head.appendChild(style);
        }
        
        return () => {
            // Cleanup if needed
        };
    }, []);
    
    if (!visible) return null;
    
    return React.createElement('div', { className: 'birthday-overlay' },
        React.createElement('div', { className: 'birthday-message' },
            React.createElement('h1', null, '🎉 Happy Birthday! 🎂'),
            React.createElement('p', null, `Wishing you a fantastic day, ${userName}!`),
            React.createElement('div', { className: 'birthday-actions' },
                React.createElement('button', {
                    className: 'birthday-btn birthday-btn-primary',
                    onClick: handleClose
                }, 'Thank You! 🎈'),
                React.createElement('button', {
                    className: 'birthday-btn birthday-btn-secondary',
                    onClick: handleDontShowAgain
                }, "Don't show me again")
            )
        )
    );
};
