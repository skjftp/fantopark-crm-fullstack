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
    
    return React.createElement(BirthdayBalloons, {
        userName: user.name || user.email,
        onClose: () => setShowBirthday(false)
    });
};

// Birthday Balloons Animation Component
window.BirthdayBalloons = function({ userName = "User", onClose }) {
    // ... (full component code from the artifact above)
};
