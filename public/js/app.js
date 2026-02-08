// Main App Logic

let allTeams = []; // Source of truth
let currentFilter = 'all';
let currentSort = 'score_desc'; // Default sort
let previousRanks = {}; // Store { teamName: rank }

async function fetchLeaderboard() {
    try {
        const response = await fetch("/api/leaderboard");
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server Error Response:', errorText);
            try {
                const errorJson = JSON.parse(errorText);
                console.error('Server Error JSON:', errorJson);
            } catch (e) {
                // Ignore parse error
            }
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        
        // Handle empty data
        if (!data || !Array.isArray(data) || data.length === 0) {
            allTeams = [];
            renderLeaderboard([]);
            updateStats([]);
            if (typeof updateAnalytics === 'function') {
                updateAnalytics([]);
            }
            return;
        }
        
        // Calculate static rank based on score (descending)
        const ranked = [...data].sort((a, b) => b.score - a.score);
        
        // Update Trend Data *before* assigning new ranks
        // We need to snapshot the previous rank map only on data updates
        // However, if we do it here, we need to know if data *changed*
        // For simplicity in this demo, we assume every fetch is a potential update.
        // But we want to compare against what was *previously* rendered.
        
        // 1. Create a NEW rank map from this fetch
        const newRankMap = {};
        ranked.forEach((t, i) => {
            t._rank = i + 1;
            newRankMap[t.teamName] = i + 1;
        });

        // 2. If this is the FIRST fetch, init previousRanks to match so diff is 0
        if (Object.keys(previousRanks).length === 0) {
            previousRanks = { ...newRankMap };
        }

        // 3. Update allTeams
        allTeams = ranked; 

        applyCurrentFilters(); // Re-apply filters/sort on new data
        updateStats(data);
        if (typeof updateAnalytics === 'function') {
            updateAnalytics(data); 
        }
        
        // 4. Update previousRanks for the NEXT fetch
        previousRanks = newRankMap;

    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        // Show error state
        renderLeaderboard(null, error);
        updateStats([]);
    }
}

function updateStats(teams) {
    const totalEl = document.getElementById('totalTeams');
    if (totalEl) totalEl.innerText = teams.length;
    
    const maxScore = teams.length > 0 ? Math.max(...teams.map(t => t.score || 0)) : 0;
    const topScoreEl = document.getElementById('topScore');
    if (topScoreEl && parseInt(topScoreEl.innerText) !== maxScore) {
        topScoreEl.innerText = maxScore; 
    }

    const players = teams.reduce((acc, t) => acc + (t.members ? t.members.length : 0), 0);
    const activePlayersEl = document.getElementById('activePlayers');
    if (activePlayersEl) activePlayersEl.innerText = players;
}

// --- Mobile Sidebar Logic ---
function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobileModalOverlay');
    
    sidebar.classList.toggle('mobile-open');
    
    if (sidebar.classList.contains('mobile-open')) {
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    } else {
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// --- View Navigation ---
function navigateTo(viewName) {
    // Update Nav Active State (Sidebar)
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const activeNav = document.getElementById('nav-' + (viewName === 'dashboard' ? 'leaderboard' : viewName));
    if(activeNav) activeNav.classList.add('active');
    
    // Update Bottom Nav Active State
    document.querySelectorAll('.bottom-nav-item').forEach(el => el.classList.remove('active'));
    const activeBottomNav = document.getElementById('bottom-nav-' + (viewName === 'dashboard' ? 'leaderboard' : viewName));
    if(activeBottomNav) activeBottomNav.classList.add('active');

    // Hide all views
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));

    // Show selected view
    // Dashboard maps to leaderboard view for simplicity in this demo
    const targetId = viewName === 'dashboard' ? 'view-leaderboard' : 'view-' + viewName;
    const targetView = document.getElementById(targetId);
    if(targetView) targetView.classList.add('active');
    
    // Mobile: Close sidebar after navigation
    const sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('mobile-open')) {
        toggleMobileSidebar();
    }
    
    // Update Header Title based on View
    const titles = {
        'dashboard': 'Leaderboard',
        'leaderboard': 'Leaderboard',
        'analytics': 'Analytics',
        'settings': 'Settings'
    };
    const headerTitle = document.getElementById('headerTitle');
    if (headerTitle) headerTitle.innerText = titles[viewName] || 'Dashboard';

    // Show/Hide Top Search and Export Button based on view
    const isLeaderboard = viewName === 'dashboard' || viewName === 'leaderboard';
    const topSearchBar = document.getElementById('topSearchBar');
    const headerExportBtn = document.getElementById('headerExportBtn');
    
    if (topSearchBar) topSearchBar.style.display = isLeaderboard ? 'block' : 'none';
    if (headerExportBtn) headerExportBtn.style.display = isLeaderboard ? 'flex' : 'none';

    // Refresh icons
    if(window.lucide) lucide.createIcons();
}

// --- Filter Logic ---
function openFilterModal() {
    const overlay = document.getElementById('mobileModalOverlay');
    const filterCard = document.getElementById('filterModalCard');
    const sortCard = document.getElementById('sortModalCard');
    
    // Hide sort card if visible
    if (sortCard) sortCard.classList.remove('show');
    
    // Show overlay and filter card
    if (overlay) overlay.classList.add('show');
    if (filterCard) filterCard.classList.add('show');
    
    document.body.style.overflow = 'hidden';
}

function openSortModal() {
    const overlay = document.getElementById('mobileModalOverlay');
    const filterCard = document.getElementById('filterModalCard');
    const sortCard = document.getElementById('sortModalCard');
    
    // Hide filter card if visible
    if (filterCard) filterCard.classList.remove('show');
    
    // Show overlay and sort card
    if (overlay) overlay.classList.add('show');
    if (sortCard) sortCard.classList.add('show');
    
    document.body.style.overflow = 'hidden';
}

function toggleFilterMenu() {
    openFilterModal();
}

// --- Notification Logic ---
function toggleNotifications() {
    const menu = document.getElementById('notificationMenu');
    const overlay = document.getElementById('mobileModalOverlay');
    
    if (menu) {
        menu.classList.toggle('show');
        
        // Show/hide overlay on mobile
        if (window.innerWidth <= 768 && overlay) {
            if (menu.classList.contains('show')) {
                overlay.classList.add('show');
                document.body.style.overflow = 'hidden';
            } else {
                overlay.classList.remove('show');
                document.body.style.overflow = '';
            }
        }
    }
    
    if (window.event) window.event.stopPropagation();
}

// --- Close Mobile Modal ---
function closeMobileModal() {
    const overlay = document.getElementById('mobileModalOverlay');
    const filterCard = document.getElementById('filterModalCard');
    const sortCard = document.getElementById('sortModalCard');
    const sidebar = document.getElementById('sidebar');
    
    // Hide modal cards
    if (filterCard) filterCard.classList.remove('show');
    if (sortCard) sortCard.classList.remove('show');
    
    // Hide overlay
    if (overlay) overlay.classList.remove('show');
    
    // Close sidebar if open
    if (sidebar) sidebar.classList.remove('mobile-open');
    
    document.body.style.overflow = '';
}

// --- Handle Modal Backdrop Click (close when clicking outside card) ---
function handleModalBackdropClick(event) {
    // Only close if clicking directly on the backdrop, not the card
    if (event.target === event.currentTarget) {
        closeMobileModal();
    }
}

function clearNotifications() {
    const list = document.getElementById('notifList');
    if (list) {
        list.innerHTML = '<div style="padding:2rem; text-align:center; color:#666; font-size:0.8rem;">No new notifications</div>';
    }
    const badge = document.querySelector('.nav-badge-dot');
    if (badge) badge.style.display = 'none';
}

// Close filter menu when clicking outside (desktop only)
window.addEventListener('click', (e) => {
    // Skip on mobile - we use the overlay and close button instead
    if (window.innerWidth <= 768) return;
    
    const fMenu = document.getElementById('filterMenu');
    const sMenu = document.getElementById('sortMenu');
    const nMenu = document.getElementById('notificationMenu');
    
    // Check if click is inside the menu or on the specific toggle button
    const clickInFilter = e.target.closest('#filterMenu') || e.target.closest('#filterBtn');
    const clickInSort = e.target.closest('#sortMenu') || e.target.closest('#sortBtn');
    const clickInNotif = e.target.closest('#notificationMenu') || e.target.closest('#notifBtn');

    if (!clickInFilter && fMenu) fMenu.classList.remove('show');
    if (!clickInSort && sMenu) sMenu.classList.remove('show');
    if (!clickInNotif && nMenu) nMenu.classList.remove('show');
});

function applyFilter(type) {
    currentFilter = type;
    applyCurrentFilters();
    closeMobileModal();
}

function clearFilters() {
    currentFilter = 'all';
    currentSort = 'score_desc';
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    applyCurrentFilters();
}

function filterLeaderboard() {
    // Triggered by search input
    applyCurrentFilters();
}

function applyCurrentFilters() {
    let filtered = [...allTeams];

    // 1. Text Search
    const searchInput = document.getElementById('searchInput');
    const query = searchInput ? searchInput.value.toLowerCase() : '';
    if (query) {
        filtered = filtered.filter(t => 
            t.teamName.toLowerCase().includes(query) ||
            (t.members && t.members.some(m => m.name.toLowerCase().includes(query)))
        );
    }

    // 2. Category Filter
    if (currentFilter === 'top3') {
        filtered = filtered.slice(0, 3);
    } else if (currentFilter === 'top10') {
        filtered = filtered.slice(0, 10);
    } else if (currentFilter === 'top20') {
        filtered = filtered.slice(0, 20);
    } else if (currentFilter === 'active') {
        filtered = filtered.filter(t => t.score > 0);
    } else if (currentFilter === 'zero') {
        filtered = filtered.filter(t => t.score === 0);
    }

    // 3. Sort
    filtered.sort((a, b) => {
        if (currentSort === 'score_desc') return b.score - a.score;
        if (currentSort === 'score_asc') return a.score - b.score;
        if (currentSort === 'name_asc') return a.teamName.localeCompare(b.teamName);
        if (currentSort === 'name_desc') return b.teamName.localeCompare(a.teamName);
        return 0;
    });

    // Pass info about whether this is a filtered result with no matches
    const isFilteredEmpty = filtered.length === 0 && allTeams.length > 0;
    renderLeaderboard(filtered, null, isFilteredEmpty);
}

// --- Sort Logic ---
function toggleSortMenu() {
    openSortModal();
}

function applySort(type) {
    currentSort = type;
    applyCurrentFilters();
    // Close menu and modal
    closeMobileModal();
}

// --- Export CSV ---
function exportToCSV() {
    if (allTeams.length === 0) return;

    let csv = 'Rank,Team Name,Player 1,Player 2,Score\n';
    
    allTeams.forEach((team, index) => {
        const p1 = team.members && team.members[0] ? team.members[0].name : '';
        const p2 = team.members && team.members[1] ? team.members[1].name : '';
        // Escape commas in names
        const safeName = `"${team.teamName.replace(/"/g, '""')}"`;
        
        csv += `${index + 1},${safeName},"${p1}","${p2}",${team.score}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'emoji_leaderboard.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function renderLeaderboard(teams, error = null, isFilteredEmpty = false) {
    const container = document.getElementById("leaderboardRows");
    if (!container) return;
    
    // Error state
    if (error) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon error">
                    <i data-lucide="alert-circle"></i>
                </div>
                <h3 class="empty-state-title">Unable to load data</h3>
                <p class="empty-state-desc">There was a problem fetching the leaderboard. Please try again later.</p>
                <button class="empty-state-btn" onclick="fetchLeaderboard()">
                    <i data-lucide="refresh-cw"></i> Retry
                </button>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }
    
    // Filtered empty state - no matches for search/filter
    if (isFilteredEmpty) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i data-lucide="search-x"></i>
                </div>
                <h3 class="empty-state-title">No matches found</h3>
                <p class="empty-state-desc">No teams match your current search or filter. Try adjusting your criteria.</p>
                <button class="empty-state-btn" onclick="clearFilters()">
                    <i data-lucide="x"></i> Clear Filters
                </button>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }
    
    // Empty state - no teams at all
    if (!teams || teams.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i data-lucide="users"></i>
                </div>
                <h3 class="empty-state-title">No teams yet</h3>
                <p class="empty-state-desc">The competition hasn't started or no teams have registered yet. Check back soon!</p>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }

    container.innerHTML = teams.map((team, index) => {
        const members = team.members || [];
        const p1 = members[0] ? members[0].name : '-';
        const p2 = members[1] ? members[1].name : '-';
        
        // Rank styling using static rank
        const rank = team._rank;
        let rankDisplay = `<span style="opacity:0.5">#${rank}</span>`;
        let rowClass = "";
        
        // Highlight top 3 based on static rank
        if (rank === 1) {
            rankDisplay = '<i data-lucide="trophy" style="color:#FFD700; width:20px;"></i>';
            rowClass = "border-left: 3px solid #FFD700;";
        } else if (rank === 2) {
            rankDisplay = '<i data-lucide="medal" style="color:#C0C0C0; width:20px;"></i>';
        } else if (rank === 3) {
            rankDisplay = '<i data-lucide="medal" style="color:#CD7F32; width:20px;"></i>';
        }

        // Real trend logic
        // Use a hash of name to keep trend consistent for a session if needed, but random is fine for visual demo
        // For real trend, we would need to store previous fetches. 
        // We will simulate "Real" trend by storing previous ranks in a global map
        const teamId = team.teamName; // Assuming unique names
        const prevRank = previousRanks[teamId] || rank;
        
        let trendIcon = '<i data-lucide="minus" class="trend-neutral" style="width:16px"></i>';
        
        if (rank < prevRank) {
            // Rank Improved (Numerical value decreased, e.g. 5 -> 3)
            const diff = prevRank - rank;
            trendIcon = `<i data-lucide="trending-up" class="trend-up" style="width:16px"></i> <span class="trend-up">${diff}</span>`;
        } else if (rank > prevRank) {
            // Rank Dropped
            const diff = rank - prevRank;
            trendIcon = `<i data-lucide="trending-down" class="trend-down" style="width:16px"></i> <span class="trend-down">${diff}</span>`;
        }
        
        // Update previous rank for next render
        // Note: In a real app, update this only on fresh data fetch, not every render. 
        // But since 'render' is called from fetch, it's okay-ish, except sort re-calls render.
        // We should update previousRanks map inside fetchLeaderboard ONLY.
        
        return `
            <div class="table-row" style="${rowClass}">
                <div class="rank-cell">${rankDisplay}</div>
                
                <div class="team-cell">
                    <div style="width:32px; height:32px; background:#222; border-radius:8px; display:flex; align-items:center; justify-content:center; color:var(--accent-color); font-weight:bold; font-size: 0.8rem;">
                        ${team.teamName.substring(0,2).toUpperCase()}
                    </div>
                    ${escapeHtml(team.teamName)}
                </div>
                
                <div class="player-cell" style="display: flex; gap: 1rem;">
                        <div style="display:flex; align-items:center; gap:0.5rem; color:#a1a1aa; font-size:0.95rem;">
                            <div style="width:24px; height:24px; background:#1a1a1a; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:10px; color:#888;">
                                <i data-lucide="user" style="width:12px"></i>
                            </div>
                            ${escapeHtml(p1)}
                        </div>
                        <div style="display:flex; align-items:center; gap:0.5rem; color:#a1a1aa; font-size:0.95rem;">
                            <div style="width:24px; height:24px; background:#1a1a1a; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:10px; color:#888;">
                                <i data-lucide="user" style="width:12px"></i>
                            </div>
                            ${escapeHtml(p2)}
                        </div>
                </div>
                
                <div class="score-cell">${team.score}</div>
                
                <div class="trend-cell">${trendIcon}</div>
            </div>
        `;
    }).join('');
    
    if (window.lucide) lucide.createIcons();
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// Init
window.addEventListener('load', () => {
    fetchLeaderboard();
    // Refresh interval is handled in settings.js, but we start it here as well or rely on settings default
    if (typeof refreshInterval !== 'undefined') {
        setInterval(fetchLeaderboard, refreshInterval);
    }
    
    if (window.lucide) lucide.createIcons();
});
