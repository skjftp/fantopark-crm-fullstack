// Birthday Component for Fantopark CRM
window.BirthdayCheck = function({ user }) {
    const [showBirthday, setShowBirthday] = React.useState(false);
    
    React.useEffect(() => {
        if (!user || !user.birthday) return;
        
        // Check if it's the user's birthday
        const today = new Date();
        const birthday = new Date(user.birthday);
        
        if (today.getMonth() === birthday.getMonth() && 
            today.getDate() === birthday.getDate()) {
            
            // Check if already dismissed for this year
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

// Birthday Balloons Animation Component
window.BirthdayBalloons = function({ userName = "User", onClose }) {
    const [showAnimation, setShowAnimation] = React.useState(true);
    const [balloons, setBalloons] = React.useState([]);
    const [confetti, setConfetti] = React.useState([]);
    const animationRef = React.useRef(null);
    
    React.useEffect(() => {
        // Generate balloons
        const balloonColors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#a8e6cf', '#ff8cc8', '#c7a8ff'];
        const newBalloons = Array.from({ length: 15 }, (_, i) => ({
            id: i,
            color: balloonColors[i % balloonColors.length],
            left: Math.random() * 100,
            animationDuration: 10 + Math.random() * 10,
            animationDelay: Math.random() * 5
        }));
        setBalloons(newBalloons);
        
        // Generate confetti
        const confettiColors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#a8e6cf', '#ff8cc8'];
        const newConfetti = Array.from({ length: 50 }, (_, i) => ({
            id: i,
            color: confettiColors[i % confettiColors.length],
            left: Math.random() * 100,
            animationDuration: 3 + Math.random() * 3,
            animationDelay: Math.random() * 3,
            size: 5 + Math.random() * 10
        }));
        setConfetti(newConfetti);
        
        return () => {
            if (animationRef.current) {
                clearTimeout(animationRef.current);
            }
        };
    }, []);
    
    const handleClose = () => {
        setShowAnimation(false);
        setTimeout(() => onClose(false), 300);
    };
    
    const handleDontShowAgain = () => {
        // Store in localStorage with user identifier
        const storageKey = `birthday_dismissed_${new Date().getFullYear()}_${userName}`;
        localStorage.setItem(storageKey, 'true');
        handleClose();
    };
    
    const popBalloon = (balloonId) => {
        setBalloons(prev => prev.filter(b => b.id !== balloonId));
    };
    
    if (!showAnimation) return null;
    
    // Create style element for animations
    React.useEffect(() => {
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
                    animation: fadeIn 0.5s ease;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                .birthday-container {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                }
                
                .birthday-message {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    text-align: center;
                    z-index: 10;
                    background: rgba(255, 255, 255, 0.95);
                    padding: 40px 60px;
                    border-radius: 20px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
                    animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                
                @keyframes scaleIn {
                    from { transform: translate(-50%, -50%) scale(0.7); }
                    to { transform: translate(-50%, -50%) scale(1); }
                }
                
                .birthday-message h1 {
                    font-size: 3em;
                    margin: 0 0 20px 0;
                    background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #ffe66d, #a8e6cf);
                    background-size: 200% 200%;
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: gradientShift 3s ease infinite;
                }
                
                @keyframes gradientShift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                
                .birthday-message p {
                    font-size: 1.2em;
                    color: #333;
                    margin: 0 0 30px 0;
                }
                
                .birthday-actions {
                    display: flex;
                    gap: 15px;
                    justify-content: center;
                    flex-wrap: wrap;
                }
                
                .birthday-btn {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 8px;
                    font-size: 1em;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-weight: 500;
                }
                
                .birthday-btn-primary {
                    background: linear-gradient(45deg, #4ecdc4, #44a8b3);
                    color: white;
                }
                
                .birthday-btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(78, 205, 196, 0.4);
                }
                
                .birthday-btn-secondary {
                    background: #f0f0f0;
                    color: #666;
                }
                
                .birthday-btn-secondary:hover {
                    background: #e0e0e0;
                }
                
                .balloon {
                    position: absolute;
                    width: 80px;
                    animation: float linear infinite;
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                
                .balloon:hover {
                    transform: scale(1.1);
                }
                
                @keyframes float {
                    from {
                        transform: translateY(100vh) rotate(-20deg);
                    }
                    to {
                        transform: translateY(-150px) rotate(20deg);
                    }
                }
                
                .balloon-string {
                    width: 2px;
                    height: 100px;
                    background: #333;
                    margin: 0 auto;
                    position: relative;
                    top: -5px;
                }
                
                .balloon-body {
                    width: 80px;
                    height: 100px;
                    border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
                    position: relative;
                    box-shadow: inset -10px -10px 0 rgba(0, 0, 0, 0.1);
                }
                
                .confetti {
                    position: absolute;
                    width: 10px;
                    height: 10px;
                    animation: confettiFall linear infinite;
                }
                
                @keyframes confettiFall {
                    from {
                        transform: translateY(-10px) rotate(0deg);
                        opacity: 1;
                    }
                    to {
                        transform: translateY(100vh) rotate(720deg);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }, []);
    
    return React.createElement('div', { className: 'birthday-overlay' },
        React.createElement('div', { className: 'birthday-container' },
            // Confetti
            confetti.map(c =>
                React.createElement('div', {
                    key: c.id,
                    className: 'confetti',
                    style: {
                        left: `${c.left}%`,
                        backgroundColor: c.color,
                        animationDuration: `${c.animationDuration}s`,
                        animationDelay: `${c.animationDelay}s`,
                        width: `${c.size}px`,
                        height: `${c.size}px`,
                        borderRadius: Math.random() > 0.5 ? '50%' : '0'
                    }
                })
            ),
            
            // Balloons
            balloons.map(balloon =>
                React.createElement('div', {
                    key: balloon.id,
                    className: 'balloon',
                    onClick: () => popBalloon(balloon.id),
                    style: {
                        left: `${balloon.left}%`,
                        animationDuration: `${balloon.animationDuration}s`,
                        animationDelay: `${balloon.animationDelay}s`
                    }
                },
                    React.createElement('div', {
                        className: 'balloon-body',
                        style: { backgroundColor: balloon.color }
                    }),
                    React.createElement('div', { className: 'balloon-string' })
                )
            ),
            
            // Birthday Message
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
        )
    );
};
