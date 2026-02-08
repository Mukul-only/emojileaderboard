// Analytics Logic

function updateAnalytics(teams) {
    const avgEl = document.getElementById('avgScore');
    const medEl = document.getElementById('medianScore');
    const maxEl = document.getElementById('highestRank');
    const partEl = document.getElementById('totalParticipants');
    
    // Handle empty data
    if (!teams || teams.length === 0) {
        if (avgEl) avgEl.innerText = '0';
        if (medEl) medEl.innerText = '0';
        if (maxEl) maxEl.innerText = '0';
        if (partEl) partEl.innerText = '0';
        
        // Show empty state in charts
        renderEmptyChart('topTeamsChart', 'No team data available');
        renderEmptyChart('distributionChart', 'No score data available');
        return;
    }

    // 1. Calculate KPIs
    const scores = teams.map(t => t.score || 0).sort((a, b) => a - b);
    const totalScore = scores.reduce((a, b) => a + b, 0);
    const avg = Math.round(totalScore / teams.length);
    
    const mid = Math.floor(scores.length / 2);
    const median = scores.length % 2 !== 0 ? scores[mid] : (scores[mid - 1] + scores[mid]) / 2;
    
    const max = scores[scores.length - 1];
    const participants = teams.reduce((acc, t) => acc + (t.members ? t.members.length : 0), 0);

    if (avgEl) avgEl.innerText = avg;
    if (medEl) medEl.innerText = median;
    if (maxEl) maxEl.innerText = max;
    if (partEl) partEl.innerText = participants;

    // 2. Render Top 5 Chart
    const top5 = [...teams].sort((a, b) => b.score - a.score).slice(0, 5);
    renderBarChart('topTeamsChart', top5.map(t => ({
        label: t.teamName,
        value: t.score,
        color: 'var(--accent-color)' // Use CSS variable
    })), max);

    // 3. Render Distribution Chart (Histogramish)
    // Bins: 0-50, 51-100, 101-150, 150+ (Dynamic based on max score)
    const binSize = Math.max(50, Math.ceil(max / 5));
    const bins = {};
    scores.forEach(s => {
        const binIndex = Math.floor(s / binSize);
        const binLabel = `${binIndex * binSize}-${(binIndex + 1) * binSize}`;
        bins[binLabel] = (bins[binLabel] || 0) + 1;
    });

    const distData = Object.keys(bins).map(k => ({
        label: k,
        value: bins[k],
        color: '#3b82f6' // Blue
    }));
    
    // Find max frequency for scaling
    const maxFreq = Math.max(...Object.values(bins));
    renderBarChart('distributionChart', distData, maxFreq);
}

function renderEmptyChart(containerId, message) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = `
        <div class="chart-empty-state">
            <i data-lucide="bar-chart-2"></i>
            <span>${message}</span>
        </div>
    `;
    if (window.lucide) lucide.createIcons();
}

function renderBarChart(containerId, data, maxValue) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = data.map(d => {
        const heightPct = maxValue > 0 ? (d.value / maxValue) * 100 : 0;
        return `
            <div class="bar-group">
                <div class="bar" style="height: ${heightPct}%; background-color: ${d.color}">
                    <div class="bar-value">${d.value}</div>
                </div>
                <div class="bar-label" title="${d.label}">${d.label}</div>
            </div>
        `;
    }).join('');
}
