<<<<<<< HEAD
export function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
    } else {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
    }
}

// Make applyTheme globally available
window.applyTheme = applyTheme;

// Apply theme on load
document.addEventListener('DOMContentLoaded', () => {
    applyTheme(localStorage.getItem('theme') || 'default');
=======
export function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
    } else {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
    }
}

// Make applyTheme globally available
window.applyTheme = applyTheme;

// Apply theme on load
document.addEventListener('DOMContentLoaded', () => {
    applyTheme(localStorage.getItem('theme') || 'default');
>>>>>>> 58afe73bc799a44fad7f9cc6e3f1e7079ea65410
}); 