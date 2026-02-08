// Settings Logic

const themes = {
    default: { bg: '#0D0D0D', accent: '#ADFF2F', header: 'rgba(15, 15, 15, 0.95)', card: '#141414' },
    cyber: { bg: '#090014', accent: '#FF00FF', header: 'rgba(15, 0, 20, 0.95)', card: '#12001a' },
    aqua: { bg: '#001219', accent: '#00FFFF', header: 'rgba(0, 20, 25, 0.95)', card: '#001821' },
    flame: { bg: '#110500', accent: '#FF4500', header: 'rgba(20, 5, 0, 0.95)', card: '#1a0800' },
    violet: { bg: '#1a0b2e', accent: '#d946ef', header: 'rgba(26, 11, 46, 0.95)', card: '#24103e' },
    toxic: { bg: '#051a05', accent: '#00ff00', header: 'rgba(5, 26, 5, 0.95)', card: '#0a260a' },
    slate: { bg: '#0f172a', accent: '#38bdf8', header: 'rgba(15, 23, 42, 0.95)', card: '#1e293b' },
    gold: { bg: '#1c1917', accent: '#fbbf24', header: 'rgba(28, 25, 23, 0.95)', card: '#292524' }
};

let refreshInterval = 5000;
let refreshTimer = null;
let autoRefresh = true;

function setTheme(themeName, el) {
    const root = document.documentElement;
    const theme = themes[themeName];
    
    if (!theme) return;

    root.style.setProperty('--bg-color', theme.bg);
    root.style.setProperty('--sidebar-bg', theme.bg); // Match sidebar to bg
    root.style.setProperty('--accent-color', theme.accent);
    root.style.setProperty('--header-bg', theme.header);
    root.style.setProperty('--card-bg', theme.card);
    
    // Update UI state
    document.querySelectorAll('.theme-option').forEach(opt => opt.classList.remove('active'));
    if (el) el.classList.add('active');
    
    // Save preference
    localStorage.setItem('theme', themeName);
}

function toggleAutoRefresh(toggle) {
    autoRefresh = toggle.checked;
    if (autoRefresh) {
        // Assuming fetchLeaderboard is globally available or we need to manage this differently
        // For simple splitting, we'll assume global scope or dispatch events
        if (typeof fetchLeaderboard === 'function') {
            refreshTimer = setInterval(fetchLeaderboard, refreshInterval);
        }
    } else {
        clearInterval(refreshTimer);
    }
}

// Custom Dropdown Logic
function toggleSelect(trigger) {
    trigger.parentElement.classList.toggle('open');
}

function selectOption(option, value) {
    // Update UI
    const selectContainer = option.closest('.custom-select');
    const triggerText = selectContainer.querySelector('.selected-value');
    selectContainer.querySelectorAll('.select-option').forEach(opt => opt.classList.remove('selected'));
    
    option.classList.add('selected');
    triggerText.innerText = option.innerText;
    selectContainer.classList.remove('open');

    // Logic
    changeRefreshRate(value);
}

// Close dropdown when clicking outside
window.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-select')) {
        document.querySelectorAll('.custom-select').forEach(sel => sel.classList.remove('open'));
    }
});

function changeRefreshRate(value) {
    refreshInterval = parseInt(value);
    
    // Update the status text in the leaderboard footer
    const statusText = document.getElementById('updateStatusText');
    if (statusText) {
        statusText.innerText = `Updates every ${refreshInterval / 1000} seconds`;
    }

    if (autoRefresh && typeof fetchLeaderboard === 'function') {
        clearInterval(refreshTimer);
        refreshTimer = setInterval(fetchLeaderboard, refreshInterval);
    }
}

function toggleAnimations(toggle) {
    if (toggle.checked) {
        document.body.classList.remove('no-animations');
    } else {
        document.body.classList.add('no-animations');
    }
}

function toggleCompactMode(toggle) {
    if (toggle.checked) {
        document.body.classList.add('compact-mode');
    } else {
        document.body.classList.remove('compact-mode');
    }
}

function togglePresentationMode(toggle) {
    if (toggle.checked) {
        document.body.classList.add('presentation-mode');
        // Force navigation to leaderboard so we don't get stuck on settings
        if (typeof navigateTo === 'function') {
            navigateTo('leaderboard');
        }
    } else {
        document.body.classList.remove('presentation-mode');
    }
}

// Initialize Theme
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && themes[savedTheme]) {
        // Find the element to pass to setTheme (hacky but works for this demo)
        const themeEls = document.querySelectorAll('.theme-option');
        // Simple lookup map for elements could be better, but loop works
        let targetEl = null;
        themeEls.forEach(el => {
            if (el.getAttribute('onclick').includes(`'${savedTheme}'`)) {
                targetEl = el;
            }
        });
        // If not found (e.g. default), might default to first
        setTheme(savedTheme, targetEl);
    }
});
