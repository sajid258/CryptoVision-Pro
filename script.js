// CryptoVision Pro - Main Script
// Market Data and UI Management

function initializeMarketData() {
    const mockData = {
        globalStats: {
            marketCap: '$1.23T',
            volume: '$45.67B',
            btcDominance: '48.5%',
            fearGreed: '72 (Greed)'
        },
        ticker: [
            { symbol: 'BTC', price: '$45,234.67', change: '+2.34%', positive: true },
            { symbol: 'ETH', price: '$3,187.45', change: '+1.87%', positive: true },
            { symbol: 'ADA', price: '$0.4567', change: '-0.56%', positive: false },
            { symbol: 'SOL', price: '$89.23', change: '+5.67%', positive: true },
            { symbol: 'DOT', price: '$6.78', change: '+3.45%', positive: true }
        ]
    };

    updateGlobalStats(mockData.globalStats);
    updateMarketTicker(mockData.ticker);
}

function updateGlobalStats(stats) {
    const elements = {
        marketCap: document.getElementById('globalMarketCap'),
        volume: document.getElementById('globalVolume'),
        btcDominance: document.getElementById('btcDominance'),
        fearGreed: document.getElementById('headerFearGreed')
    };

    if (elements.marketCap) elements.marketCap.textContent = stats.marketCap;
    if (elements.volume) elements.volume.textContent = stats.volume;
    if (elements.btcDominance) elements.btcDominance.textContent = stats.btcDominance;
    if (elements.fearGreed) elements.fearGreed.textContent = stats.fearGreed;
}

function updateMarketTicker(tickerData) {
    const ticker = document.getElementById('marketTicker');
    if (!ticker) return;

    ticker.innerHTML = tickerData.map(item => `
        <div class="ticker-item ${item.positive ? 'positive' : 'negative'}">
            <span class="ticker-symbol">${item.symbol}</span>
            <span class="ticker-price">${item.price}</span>
            <span class="ticker-change">${item.change}</span>
        </div>
    `).join('');
}

function initializeMobileOptimizations() {
    // Optimize touch targets for mobile
    if ('ontouchstart' in window) {
        document.body.classList.add('touch-device');

        // Add touch feedback to interactive elements
        const touchElements = document.querySelectorAll('button, .card, .nav-menu li, .ticker-item');
        touchElements.forEach(element => {
            element.addEventListener('touchstart', function() {
                this.style.opacity = '0.8';
            }, { passive: true });

            element.addEventListener('touchend', function() {
                setTimeout(() => {
                    this.style.opacity = '';
                }, 100);
            }, { passive: true });

            element.addEventListener('touchcancel', function() {
                this.style.opacity = '';
            }, { passive: true });
        });
    }

    // Handle orientation change with better timing
    window.addEventListener('orientationchange', function() {
        setTimeout(function() {
            // Force layout recalculation and close mobile nav if needed
            window.dispatchEvent(new Event('resize'));
            if (window.innerWidth > 768) {
                closeMobileNav();
            }
        }, 300);
    });

    // Optimize scrolling on mobile with better touch handling
    const marketTicker = document.getElementById('marketTicker');
    if (marketTicker) {
        let isScrolling = false;
        let startX, scrollLeft;

        marketTicker.addEventListener('touchstart', function(e) {
            isScrolling = true;
            startX = e.touches[0].pageX - marketTicker.offsetLeft;
            scrollLeft = marketTicker.scrollLeft;
            marketTicker.style.scrollBehavior = 'auto';
        }, { passive: true });

        marketTicker.addEventListener('touchmove', function(e) {
            if (!isScrolling) return;
            const x = e.touches[0].pageX - marketTicker.offsetLeft;
            const walk = (x - startX) * 1.5;
            marketTicker.scrollLeft = scrollLeft - walk;
        }, { passive: true });

        marketTicker.addEventListener('touchend', function() {
            isScrolling = false;
            marketTicker.style.scrollBehavior = 'smooth';
        });
    }
}

function closeMobileNav() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('mobileOverlay');

    if (sidebar) sidebar.classList.remove('mobile-open');
    if (overlay) overlay.classList.remove('active');
    document.body.classList.remove('mobile-nav-open');
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeMarketData();
    initializeMobileOptimizations();

    // Initialize mobile navigation
    const mobileNavToggle = document.getElementById('mobileNavToggle');
    if (mobileNavToggle) {
        mobileNavToggle.addEventListener('click', function() {
            const sidebar = document.querySelector('.sidebar');
            const overlay = document.getElementById('mobileOverlay');

            if (sidebar) {
                sidebar.classList.toggle('mobile-open');
                document.body.classList.toggle('mobile-nav-open');
            }
            if (overlay) {
                overlay.classList.toggle('active');
            }
        });
    }

    // Close mobile nav when clicking overlay
    const mobileOverlay = document.getElementById('mobileOverlay');
    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', closeMobileNav);
    }
});

// Real-time data simulation
function simulateRealTimeData() {
    setInterval(() => {
        // Update prices with small random changes
        const tickerItems = document.querySelectorAll('.ticker-item');
        tickerItems.forEach(item => {
            const priceElement = item.querySelector('.ticker-price');
            const changeElement = item.querySelector('.ticker-change');

            if (priceElement && changeElement) {
                // Simulate small price movements
                const currentPrice = parseFloat(priceElement.textContent.replace(/[$,]/g, ''));
                const changePercent = (Math.random() - 0.5) * 2; // -1% to +1% change
                const newPrice = currentPrice * (1 + changePercent / 100);

                priceElement.textContent = `$${newPrice.toFixed(2)}`;
                changeElement.textContent = `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`;

                // Update color based on change
                item.className = `ticker-item ${changePercent >= 0 ? 'positive' : 'negative'}`;

                // Add flash animation
                item.classList.add('price-update');
                setTimeout(() => item.classList.remove('price-update'), 600);
            }
        });
    }, 5000); // Update every 5 seconds
}

// Start real-time simulation
simulateRealTimeData();

// Export functions for use in other scripts
window.CryptoScript = {
    initializeMarketData,
    updateGlobalStats,
    updateMarketTicker,
    initializeMobileOptimizations,
    closeMobileNav
};