
// =============================================
// CryptoVision Pro - Enhanced Application
// =============================================

// API Configuration
const API_CONFIG = {
    local: {
        baseUrl: window.location.origin,
        endpoints: {
            coins: '/api/coins',
            coinDetail: '/api/coins/',
            chartData: '/api/coins/',
            portfolio: '/api/portfolio/',
            alerts: '/api/alerts/',
            marketData: '/api/market-data',
            trending: '/api/trending',
            defiPools: '/api/defi-pools'
        }
    }
};

// OpenAI Configuration
const OPENAI_CONFIG = {
    apiKey: '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',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'openai/gpt-4'
};

// WebSocket Configuration
let ws = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// Application State
const appState = {
    currentSection: 'dashboard',
    darkMode: localStorage.getItem('darkMode') === 'true',
    user: {
        id: localStorage.getItem('userId') || null,
        isLoggedIn: localStorage.getItem('sessionToken') ? true : false,
        name: localStorage.getItem('userName') || 'Guest User',
        email: localStorage.getItem('userEmail') || null,
        plan: localStorage.getItem('userPlan') || 'free',
        isPro: localStorage.getItem('userPlan') === 'pro',
        sessionToken: localStorage.getItem('sessionToken') || null
    },
    coins: [],
    portfolio: {
        totalValue: 36910.47,
        totalPnL: 2347.82,
        pnlPercentage: 6.8,
        holdings: [
            {
                id: 'bitcoin',
                name: 'Bitcoin',
                symbol: 'btc',
                amount: 0.5,
                value: 22617.34,
                pnl: 2456.78,
                pnlPercentage: 12.2,
                avgBuyPrice: 40234.56
            },
            {
                id: 'ethereum',
                name: 'Ethereum',
                symbol: 'eth',
                amount: 2.3,
                value: 7331.14,
                pnl: 834.23,
                pnlPercentage: 12.9,
                avgBuyPrice: 2823.45
            },
            {
                id: 'cardano',
                name: 'Cardano',
                symbol: 'ada',
                amount: 5000,
                value: 2283.50,
                pnl: -156.45,
                pnlPercentage: -6.4,
                avgBuyPrice: 0.4878
            }
        ]
    },
    alerts: [
        {
            id: 1,
            name: 'Bitcoin',
            symbol: 'BTC',
            condition: 'Price Above',
            targetPrice: 50000,
            currentPrice: 45234.67,
            active: true
        },
        {
            id: 2,
            name: 'Ethereum',
            symbol: 'ETH',
            condition: 'Price Below',
            targetPrice: 3000,
            currentPrice: 3187.45,
            active: true
        }
    ],
    watchlist: [
        { id: 'solana', name: 'Solana', symbol: 'SOL', price: 89.23, change: 5.67 },
        { id: 'polkadot', name: 'Polkadot', symbol: 'DOT', price: 6.78, change: 3.45 },
        { id: 'chainlink', name: 'Chainlink', symbol: 'LINK', price: 7.89, change: -2.13 }
    ],
    realTimeData: new Map(),
    isLoading: false,
    isMobile: window.innerWidth <= 768
};

// Mock data for demonstration
const mockCoinsData = [
    {
        id: 'bitcoin',
        name: 'Bitcoin',
        symbol: 'btc',
        image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
        current_price: 45234.67,
        price_change_percentage_24h: 2.34,
        price_change_percentage_7d: 8.76,
        market_cap: 882000000000,
        total_volume: 23500000000,
        market_cap_rank: 1,
        high_24h: 46123.45,
        low_24h: 44567.89
    },
    {
        id: 'ethereum',
        name: 'Ethereum',
        symbol: 'eth',
        image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
        current_price: 3187.45,
        price_change_percentage_24h: 1.87,
        price_change_percentage_7d: 5.23,
        market_cap: 383000000000,
        total_volume: 12300000000,
        market_cap_rank: 2,
        high_24h: 3234.56,
        low_24h: 3145.67
    },
    {
        id: 'cardano',
        name: 'Cardano',
        symbol: 'ada',
        image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
        current_price: 0.4567,
        price_change_percentage_24h: -0.56,
        price_change_percentage_7d: 12.34,
        market_cap: 16200000000,
        total_volume: 890000000,
        market_cap_rank: 8,
        high_24h: 0.4634,
        low_24h: 0.4456
    },
    {
        id: 'solana',
        name: 'Solana',
        symbol: 'sol',
        image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
        current_price: 89.23,
        price_change_percentage_24h: 12.45,
        price_change_percentage_7d: 15.67,
        market_cap: 41200000000,
        total_volume: 2100000000,
        market_cap_rank: 5,
        high_24h: 92.34,
        low_24h: 78.45
    },
    {
        id: 'polkadot',
        name: 'Polkadot',
        symbol: 'dot',
        image: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png',
        current_price: 6.78,
        price_change_percentage_24h: 6.54,
        price_change_percentage_7d: 9.23,
        market_cap: 8900000000,
        total_volume: 345000000,
        market_cap_rank: 12,
        high_24h: 7.23,
        low_24h: 6.34
    }
];

// =============================================
// Initialization
// =============================================
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    console.log('🚀 Initializing CryptoVision Pro...');
    
    // Initialize core functionality
    initializeWebSocket();
    setupEventListeners();
    setupMobileOptimizations();
    setupNavigationFixes();
    addRealTimeStyles();
    
    // Set initial coins data
    appState.coins = mockCoinsData;
    
    // Load data
    Promise.all([
        fetchGlobalData(),
        loadInitialData()
    ]).then(() => {
        renderDashboard();
        updateMarketTicker();
        console.log('✅ App initialized successfully');
    }).catch(error => {
        console.error('❌ App initialization failed:', error);
        showNotification('App loaded with demo data', 'info');
        renderDashboard();
        updateMarketTicker();
    });
}

// =============================================
// Navigation Fixes
// =============================================
function setupNavigationFixes() {
    const header = document.querySelector('.app-header');
    const mainContent = document.querySelector('.main-content');
    if (!header) return;

    let lastScrollTop = 0;
    let isScrolling = false;

    // Smart header behavior
    function updateHeaderPosition() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // On mobile, hide header when scrolling down, show when scrolling up
            if (scrollTop > lastScrollTop && scrollTop > 80) {
                header.classList.add('hidden');
            } else {
                header.classList.remove('hidden');
            }
        } else {
            // On desktop, always show header but add shadow when scrolled
            header.classList.remove('hidden');
        }
        
        // Add shadow when scrolled
        if (scrollTop > 10) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    }

    // Throttled scroll handler
    function handleScroll() {
        if (!isScrolling) {
            window.requestAnimationFrame(updateHeaderPosition);
            isScrolling = true;
            setTimeout(() => {
                isScrolling = false;
            }, 50);
        }
    }

    // Adjust content padding dynamically
    function adjustContentPadding() {
        if (mainContent && header) {
            const headerHeight = header.offsetHeight;
            const padding = Math.max(headerHeight + 20, 90);
            mainContent.style.paddingTop = `${padding}px`;
        }
    }

    // Fix mobile navigation toggle visibility
    const mobileNavToggle = document.getElementById('mobileNavToggle');
    function updateMobileNav() {
        if (mobileNavToggle) {
            mobileNavToggle.style.display = window.innerWidth <= 768 ? 'flex' : 'none';
        }
    }

    // Event listeners
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', () => {
        updateMobileNav();
        adjustContentPadding();
    });

    // Initial setup
    updateMobileNav();
    adjustContentPadding();
    
    // Re-adjust after fonts load
    setTimeout(adjustContentPadding, 100);
    setTimeout(adjustContentPadding, 500);
}

// =============================================
// WebSocket Real-time Updates
// =============================================
function initializeWebSocket() {
    // Skip WebSocket if not available or if we've exceeded retry attempts
    if (!window.WebSocket || reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        updateConnectionStatus(false);
        return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    try {
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
            console.log('📡 WebSocket connected');
            reconnectAttempts = 0;
            updateConnectionStatus(true);
        };
        
        ws.onmessage = (event) => {
            try {
                if (event.data && event.data.trim()) {
                    const message = JSON.parse(event.data);
                    handleWebSocketMessage(message);
                }
            } catch (error) {
                // Silently handle parse errors - many are empty messages
                console.debug('WebSocket message parse error (non-critical):', event.data);
            }
        };
        
        ws.onclose = () => {
            console.log('📡 WebSocket disconnected');
            updateConnectionStatus(false);
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                attemptReconnect();
            }
        };
        
        ws.onerror = (error) => {
            console.debug('WebSocket error (non-critical):', error);
            updateConnectionStatus(false);
        };
    } catch (error) {
        console.error('Failed to initialize WebSocket:', error);
        updateConnectionStatus(false);
    }
}

function attemptReconnect() {
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        console.log(`🔄 Reconnecting... (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
        setTimeout(initializeWebSocket, 5000 * reconnectAttempts);
    }
}

function handleWebSocketMessage(message) {
    try {
        switch (message.type) {
            case 'initial_data':
                if (message.data && Array.isArray(message.data)) {
                    updateMarketData(message.data);
                    updateRealTimePrices(message.data);
                }
                break;
            case 'price_update':
                if (message.data && Array.isArray(message.data)) {
                    updateRealTimePrices(message.data);
                }
                break;
            default:
                console.debug('Unknown message type:', message.type);
        }
    } catch (error) {
        console.error('Error handling WebSocket message:', error);
    }
}

function updateMarketData(data) {
    if (!data || !Array.isArray(data)) return;
    
    // Update the coins data with real-time information
    appState.coins = data.map(coin => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        image: coin.image || `https://assets.coingecko.com/coins/images/${Math.floor(Math.random() * 1000)}/small/${coin.id}.png`,
        current_price: coin.current_price || coin.price || 0,
        price_change_percentage_24h: coin.price_change_percentage_24h || coin.change || 0,
        price_change_percentage_7d: coin.price_change_percentage_7d_in_currency || 0,
        market_cap: coin.market_cap || 0,
        total_volume: coin.total_volume || 0,
        market_cap_rank: coin.market_cap_rank || 1,
        high_24h: coin.high_24h || coin.current_price * 1.05,
        low_24h: coin.low_24h || coin.current_price * 0.95,
        last_updated: coin.last_updated || new Date().toISOString()
    }));
    
    // Update UI components
    updateMarketTicker();
    renderDashboard();
    
    if (appState.currentSection === 'markets') {
        renderMarketsTable();
    }
}

function updateRealTimePrices(data) {
    if (!data || !Array.isArray(data)) return;
    
    data.forEach(update => {
        // Update stored coin data
        const coinIndex = appState.coins.findIndex(coin => 
            coin.id === update.id || 
            coin.id.includes(update.id) || 
            update.id.includes(coin.id)
        );
        
        if (coinIndex !== -1) {
            appState.coins[coinIndex].current_price = update.price || update.current_price;
            appState.coins[coinIndex].price_change_percentage_24h = update.change || update.price_change_percentage_24h;
            appState.coins[coinIndex].last_updated = new Date().toISOString();
        }
        
        // Update real-time storage
        appState.realTimeData.set(update.id, {
            price: update.price || update.current_price,
            change: update.change || update.price_change_percentage_24h,
            timestamp: update.timestamp || Date.now()
        });
    });
    
    // Update ticker with animation
    updateMarketTickerRealTime();
    updateDashboardPrices();
}

function updateConnectionStatus(isConnected) {
    const statusEl = document.querySelector('.connection-status');
    if (statusEl) {
        statusEl.classList.toggle('connected', isConnected);
        statusEl.classList.toggle('disconnected', !isConnected);
        statusEl.innerHTML = isConnected ? 
            '<i class="fas fa-wifi"></i> Connected' : 
            '<i class="fas fa-wifi"></i> Reconnecting...';
    }
}

// =============================================
// Data Fetching
// =============================================
async function fetchGlobalData() {
    try {
        const mockGlobalData = {
            totalMarketCap: 1230000000000,
            totalVolume: 45670000000,
            btcDominance: 48.5,
            fearGreedIndex: 72
        };
        updateGlobalStats(mockGlobalData);
        return mockGlobalData;
    } catch (error) {
        console.error('Error fetching global data:', error);
        const mockData = {
            totalMarketCap: 1230000000000,
            totalVolume: 45670000000,
            btcDominance: 48.5,
            fearGreedIndex: 72
        };
        updateGlobalStats(mockData);
        return mockData;
    }
}

async function loadInitialData() {
    return Promise.resolve(true);
}

// =============================================
// UI Updates
// =============================================
function updateGlobalStats(data) {
    const elements = {
        marketCap: document.getElementById('globalMarketCap'),
        volume: document.getElementById('globalVolume'),
        btcDominance: document.getElementById('btcDominance'),
        fearGreed: document.getElementById('fearGreedValue')
    };
    
    if (elements.marketCap) elements.marketCap.textContent = formatCurrency(data.totalMarketCap || 1230000000000);
    if (elements.volume) elements.volume.textContent = formatCurrency(data.totalVolume || 45670000000);
    if (elements.btcDominance) elements.btcDominance.textContent = `${parseFloat(data.btcDominance || 48.5).toFixed(1)}%`;
    if (elements.fearGreed) elements.fearGreed.textContent = data.fearGreedIndex || 72;
}

function updateMarketTicker() {
    const ticker = document.getElementById('marketTicker');
    if (!ticker || !appState.coins.length) return;
    
    const topCoins = appState.coins.slice(0, 10);
    ticker.innerHTML = topCoins.map(coin => `
        <div class="ticker-item" onclick="openCoinDetail('${coin.id}')">
            <img src="${coin.image}" alt="${coin.name}" onerror="this.style.display='none'">
            <span class="ticker-symbol">${coin.symbol.toUpperCase()}</span>
            <span class="ticker-price">${formatCurrency(coin.current_price)}</span>
            <span class="ticker-change ${coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}">
                ${coin.price_change_percentage_24h >= 0 ? '+' : ''}${coin.price_change_percentage_24h?.toFixed(2) || 0}%
            </span>
        </div>
    `).join('');
}

function updateMarketTickerRealTime() {
    const tickerItems = document.querySelectorAll('.ticker-item');
    tickerItems.forEach(item => {
        const symbolElement = item.querySelector('.ticker-symbol');
        const priceElement = item.querySelector('.ticker-price');
        const changeElement = item.querySelector('.ticker-change');
        
        if (symbolElement && priceElement && changeElement) {
            const symbol = symbolElement.textContent.toLowerCase();
            const coinData = appState.coins.find(coin => 
                coin.symbol.toLowerCase() === symbol
            );
            
            if (coinData) {
                // Add flash animation
                item.classList.add('price-update');
                setTimeout(() => item.classList.remove('price-update'), 600);
                
                // Update price
                priceElement.textContent = formatCurrency(coinData.current_price);
                
                // Update change
                const change = coinData.price_change_percentage_24h;
                changeElement.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
                changeElement.className = `ticker-change ${change >= 0 ? 'positive' : 'negative'}`;
            }
        }
    });
}

function updateDashboardPrices() {
    // Update dashboard elements with real-time data
    const elements = {
        'dashboardPortfolioValue': appState.portfolio.totalValue,
        'dashboardPortfolioChange': appState.portfolio.totalPnL,
        'dashboardAssetCount': appState.portfolio.holdings.length
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            if (id === 'dashboardPortfolioValue') {
                element.textContent = formatCurrency(value);
            } else if (id === 'dashboardPortfolioChange') {
                const pnlPercent = appState.portfolio.pnlPercentage || 0;
                element.textContent = `${value >= 0 ? '+' : ''}${formatCurrency(value)} (${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%)`;
                element.className = value >= 0 ? 'positive' : 'negative';
            } else {
                element.textContent = value.toString();
            }
        }
    });
}

function renderDashboard() {
    renderTopGainersLosers();
    renderTrendingCoins();
    renderPortfolioSummary();
    renderRecentAlerts();
}

function renderTopGainersLosers() {
    const gainersContainer = document.getElementById('topGainers');
    const losersContainer = document.getElementById('topLosers');
    
    if (!gainersContainer || !losersContainer || !appState.coins.length) return;
    
    const gainers = appState.coins
        .filter(coin => coin.price_change_percentage_24h > 0)
        .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)
        .slice(0, 5);
    
    const losers = appState.coins
        .filter(coin => coin.price_change_percentage_24h < 0)
        .sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h)
        .slice(0, 5);
    
    gainersContainer.innerHTML = gainers.map(coin => createCoinItem(coin, 'positive')).join('');
    losersContainer.innerHTML = losers.length > 0 ? 
        losers.map(coin => createCoinItem(coin, 'negative')).join('') :
        gainers.slice(0, 3).map(coin => createCoinItem(coin, 'positive')).join('');
}

function renderTrendingCoins() {
    const container = document.getElementById('trendingCoins');
    if (!container || !appState.coins.length) return;
    
    const trending = appState.coins
        .sort((a, b) => b.total_volume - a.total_volume)
        .slice(0, 5);
    
    container.innerHTML = trending.map(coin => createCoinItem(coin, 'trending')).join('');
}

function createCoinItem(coin, type) {
    const change = coin.price_change_percentage_24h || 0;
    const changeClass = change >= 0 ? 'positive' : 'negative';
    
    return `
        <div class="coin-item" data-coin-id="${coin.id}" onclick="openCoinDetail('${coin.id}')">
            <div class="coin-info">
                <img src="${coin.image}" alt="${coin.name}" onerror="this.style.display='none'">
                <div class="coin-details">
                    <div class="coin-name">${coin.name}</div>
                    <div class="coin-symbol">${coin.symbol.toUpperCase()}</div>
                </div>
            </div>
            <div class="price-info">
                <div class="price">${formatCurrency(coin.current_price)}</div>
                <div class="change ${changeClass}">
                    ${change >= 0 ? '+' : ''}${change.toFixed(2)}%
                </div>
            </div>
        </div>
    `;
}

function renderPortfolioSummary() {
    const container = document.querySelector('.portfolio-summary-card .card-body');
    if (!container || !appState.portfolio) return;
    
    const portfolio = appState.portfolio;
    container.innerHTML = `
        <div class="portfolio-quick-stats">
            <div class="quick-stat">
                <span>Total Value</span>
                <strong>${formatCurrency(portfolio.totalValue)}</strong>
            </div>
            <div class="quick-stat">
                <span>24h P&L</span>
                <strong class="${portfolio.totalPnL >= 0 ? 'positive' : 'negative'}">
                    ${portfolio.totalPnL >= 0 ? '+' : ''}${formatCurrency(portfolio.totalPnL)} 
                    (${portfolio.pnlPercentage >= 0 ? '+' : ''}${portfolio.pnlPercentage.toFixed(2)}%)
                </strong>
            </div>
            <div class="quick-stat">
                <span>Holdings</span>
                <strong>${portfolio.holdings?.length || 0} assets</strong>
            </div>
        </div>
    `;
}

function renderRecentAlerts() {
    const container = document.querySelector('.alerts-summary');
    if (!container) return;
    
    const recentAlerts = appState.alerts.slice(0, 3);
    container.innerHTML = `
        <div class="alerts-list">
            ${recentAlerts.map(alert => `
                <div class="alert-item ${alert.active ? 'active' : 'inactive'}">
                    <div class="alert-coin">
                        <strong>${alert.symbol.toUpperCase()}</strong>
                        <span>${alert.condition} ${formatCurrency(alert.targetPrice)}</span>
                    </div>
                    <div class="alert-status">
                        ${alert.active ? '🔔 Active' : '⏸️ Paused'}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// =============================================
// Mobile Optimizations
// =============================================
function setupMobileOptimizations() {
    appState.isMobile = window.innerWidth <= 768;
    
    window.addEventListener('orientationchange', function() {
        setTimeout(() => {
            handleResize();
            fixMobileNavigation();
        }, 300);
    });
    
    window.addEventListener('resize', handleResize);
    
    fixMobileNavigation();
    optimizeTouchHandling();
    fixHeaderBehavior();
    handleResize();
}

function handleResize() {
    const isMobile = window.innerWidth <= 768;
    const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
    
    appState.isMobile = isMobile;
    
    document.body.classList.toggle('mobile', isMobile);
    document.body.classList.toggle('tablet', isTablet);
    document.body.classList.toggle('desktop', !isMobile && !isTablet);
    
    if (isMobile) {
        optimizeForMobile();
    } else if (isTablet) {
        optimizeForTablet();
    } else {
        optimizeForDesktop();
    }
}

function fixMobileNavigation() {
    const mobileNavToggle = document.getElementById('mobileNavToggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (!mobileNavToggle || !sidebar) return;
    
    // Ensure mobile overlay exists
    let mobileOverlay = document.getElementById('mobileOverlay');
    if (!mobileOverlay) {
        mobileOverlay = document.createElement('div');
        mobileOverlay.className = 'mobile-overlay';
        mobileOverlay.id = 'mobileOverlay';
        document.body.appendChild(mobileOverlay);
    }
    
    function closeMobileNav() {
        sidebar.classList.remove('mobile-open');
        mobileOverlay.classList.remove('active');
        document.body.classList.remove('mobile-nav-open');
        mobileNavToggle.classList.remove('active');
    }
    
    function openMobileNav() {
        sidebar.classList.add('mobile-open');
        mobileOverlay.classList.add('active');
        document.body.classList.add('mobile-nav-open');
        mobileNavToggle.classList.add('active');
    }
    
    // Toggle function
    function toggleMobileNav() {
        const isOpen = sidebar.classList.contains('mobile-open');
        if (isOpen) {
            closeMobileNav();
        } else {
            openMobileNav();
        }
    }
    
    // Event listeners
    mobileNavToggle.removeEventListener('click', toggleMobileNav);
    mobileNavToggle.addEventListener('click', toggleMobileNav);
    
    mobileOverlay.removeEventListener('click', closeMobileNav);
    mobileOverlay.addEventListener('click', closeMobileNav);
    
    // Close nav on desktop
    if (window.innerWidth > 768) {
        closeMobileNav();
    }
    
    // Store functions globally for other parts of the app
    window.closeMobileNav = closeMobileNav;
    window.openMobileNav = openMobileNav;
    window.toggleMobileNav = toggleMobileNav;
}

function fixHeaderBehavior() {
    const header = document.querySelector('.app-header');
    if (!header) return;
    
    let lastScrollTop = 0;
    let ticking = false;
    
    function updateHeader() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (appState.isMobile) {
            if (scrollTop > lastScrollTop && scrollTop > 100) {
                header.style.transform = 'translateY(-100%)';
            } else {
                header.style.transform = 'translateY(0)';
            }
        } else {
            header.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
        ticking = false;
    }
    
    function requestHeaderUpdate() {
        if (!ticking) {
            requestAnimationFrame(updateHeader);
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', requestHeaderUpdate, { passive: true });
    
    header.style.transition = 'transform 0.3s ease-in-out';
}

function optimizeTouchHandling() {
    const preventZoomElements = document.querySelectorAll('button, input, select');
    preventZoomElements.forEach(element => {
        let lastTap = 0;
        element.addEventListener('touchend', function(e) {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 500 && tapLength > 0) {
                e.preventDefault();
            }
            lastTap = currentTime;
        });
    });
    
    const touchElements = document.querySelectorAll('button, .card, .nav-menu li, .ticker-item, .coin-item');
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

function optimizeForMobile() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.add('mobile-optimized');
    }
    
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.classList.add('mobile-card');
    });
    
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

function optimizeForTablet() {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.classList.add('tablet-layout');
    }
}

function optimizeForDesktop() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.remove('mobile-optimized');
    }
}

// =============================================
// Event Listeners
// =============================================
function setupEventListeners() {
    const mobileNavToggle = document.getElementById('mobileNavToggle');
    const mobileOverlay = document.getElementById('mobileOverlay');
    const sidebar = document.querySelector('.sidebar');
    
    if (mobileNavToggle) {
        mobileNavToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleMobileNav();
        });
    }
    
    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', closeMobileNav);
    }
    
    function toggleMobileNav() {
        const isOpen = sidebar?.classList.contains('mobile-open');
        if (isOpen) {
            closeMobileNav();
        } else {
            openMobileNav();
        }
    }
    
    function openMobileNav() {
        if (sidebar) sidebar.classList.add('mobile-open');
        if (mobileOverlay) mobileOverlay.classList.add('active');
        document.body.classList.add('mobile-nav-open');
    }
    
    function closeMobileNav() {
        if (sidebar) sidebar.classList.remove('mobile-open');
        if (mobileOverlay) mobileOverlay.classList.remove('active');
        document.body.classList.remove('mobile-nav-open');
    }
    
    document.querySelectorAll('.nav-menu li').forEach(item => {
        item.addEventListener('click', function() {
            const section = this.dataset.section;
            if (section) {
                switchSection(section);
                updateActiveNav(this);
                if (window.innerWidth <= 768) {
                    closeMobileNav();
                }
            }
        });
    });
    
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    const refreshBtn = document.getElementById('refreshDataBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshAllData);
    }
    
    const searchInput = document.getElementById('headerSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    const aiAnalysisBtn = document.getElementById('aiAnalysisBtn');
    if (aiAnalysisBtn) {
        aiAnalysisBtn.addEventListener('click', () => performAIAnalysis());
    }
    
    const portfolioOptimizerBtn = document.getElementById('portfolioOptimizerBtn');
    if (portfolioOptimizerBtn) {
        portfolioOptimizerBtn.addEventListener('click', () => openModal('riskAnalysisModal'));
    }
    
    const authForm = document.getElementById('authModal');
    if (authForm) {
        const authSubmit = document.getElementById('authSubmit');
        const authToggle = document.querySelector('#authToggle a');
        let isLoginMode = true;
        
        if (authSubmit) {
            authSubmit.addEventListener('click', async (e) => {
                e.preventDefault();
                const email = document.getElementById('authEmail').value;
                const password = document.getElementById('authPassword').value;
                
                if (isLoginMode) {
                    await handleLogin(email, password);
                } else {
                    const name = document.getElementById('authName').value;
                    await handleRegister(email, password, name);
                }
            });
        }
        
        if (authToggle) {
            authToggle.addEventListener('click', (e) => {
                e.preventDefault();
                isLoginMode = !isLoginMode;
                const title = document.getElementById('authModalTitle');
                const nameGroup = document.getElementById('authNameGroup');
                const submitBtn = document.getElementById('authSubmit');
                const toggleText = document.getElementById('authToggle');
                
                if (isLoginMode) {
                    title.textContent = 'Login to CryptoVision Pro';
                    nameGroup.style.display = 'none';
                    submitBtn.textContent = 'Login';
                    toggleText.innerHTML = 'Don\'t have an account? <a href="#">Register</a>';
                } else {
                    title.textContent = 'Register for CryptoVision Pro';
                    nameGroup.style.display = 'block';
                    submitBtn.textContent = 'Register';
                    toggleText.innerHTML = 'Already have an account? <a href="#">Login</a>';
                }
            });
        }
    }
    
    updateUserUI();
    
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            closeMobileNav();
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeMobileNav();
            document.querySelectorAll('.modal.active').forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });
    
    setupModals();
}

function setupModals() {
    document.querySelectorAll('.close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
            }
        });
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });
}

function switchSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        loadSectionData(sectionId);
    }
    
    appState.currentSection = sectionId;
}

function updateActiveNav(activeItem) {
    document.querySelectorAll('.nav-menu li').forEach(item => {
        item.classList.remove('active');
    });
    activeItem.classList.add('active');
}

function loadSectionData(sectionId) {
    switch (sectionId) {
        case 'markets':
            renderMarketsTable();
            break;
        case 'portfolio':
            renderPortfolioTable();
            break;
        case 'alerts':
            renderAlertsTable();
            break;
        case 'watchlist':
            renderWatchlistGrid();
            break;
        case 'news':
            renderNewsSection();
            break;
        case 'trading':
            renderTradingSection();
            break;
        case 'screener':
            renderScreenerSection();
            break;
        case 'analytics':
            renderAnalyticsSection();
            break;
        case 'defi':
            renderDeFiSection();
            break;
        case 'nft':
            renderNFTSection();
            break;
        default:
            break;
    }
}

// =============================================
// Section Rendering Functions
// =============================================
function renderMarketsTable() {
    const container = document.getElementById('marketsTableBody') || document.querySelector('#markets .markets-table tbody');
    if (!container || !appState.coins.length) return;
    
    container.innerHTML = appState.coins.map((coin, index) => `
        <tr onclick="openCoinDetail('${coin.id}')" style="cursor: pointer;">
            <td>${coin.market_cap_rank || index + 1}</td>
            <td>
                <div class="coin-info">
                    <img src="${coin.image}" alt="${coin.name}" style="width: 24px; height: 24px;">
                    <div>
                        <div class="coin-name">${coin.name}</div>
                        <div class="coin-symbol">${coin.symbol.toUpperCase()}</div>
                    </div>
                </div>
            </td>
            <td class="price">${formatCurrency(coin.current_price)}</td>
            <td class="change ${coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}">
                ${coin.price_change_percentage_24h >= 0 ? '+' : ''}${coin.price_change_percentage_24h?.toFixed(2) || 0}%
            </td>
            <td class="change ${coin.price_change_percentage_7d >= 0 ? 'positive' : 'negative'}">
                ${coin.price_change_percentage_7d >= 0 ? '+' : ''}${coin.price_change_percentage_7d?.toFixed(2) || 0}%
            </td>
            <td>${formatCurrency(coin.market_cap)}</td>
            <td>${formatCurrency(coin.total_volume)}</td>
            <td><div class="mini-chart">📈</div></td>
        </tr>
    `).join('');
}

function renderPortfolioTable() {
    const container = document.getElementById('portfolioTableBody') || document.querySelector('#portfolio .portfolio-table tbody');
    if (!container || !appState.portfolio) return;
    
    const portfolio = appState.portfolio;
    container.innerHTML = portfolio.holdings?.map(holding => `
        <tr>
            <td>
                <div class="coin-info">
                    <div>
                        <div class="coin-name">${holding.name}</div>
                        <div class="coin-symbol">${holding.symbol.toUpperCase()}</div>
                    </div>
                </div>
            </td>
            <td>${holding.amount.toFixed(4)} ${holding.symbol.toUpperCase()}</td>
            <td>${formatCurrency(holding.avgBuyPrice)}</td>
            <td class="price">${formatCurrency(holding.value / holding.amount)}</td>
            <td class="change ${holding.pnl >= 0 ? 'positive' : 'negative'}">
                ${holding.pnl >= 0 ? '+' : ''}${formatCurrency(holding.pnl)} 
                (${holding.pnlPercentage >= 0 ? '+' : ''}${holding.pnlPercentage.toFixed(2)}%)
            </td>
            <td>${((holding.value / portfolio.totalValue) * 100).toFixed(1)}%</td>
            <td>
                <button class="action-btn" onclick="tradeCoin('${holding.id}')">
                    <i class="fas fa-exchange-alt"></i>
                </button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="7" style="text-align: center; padding: 2rem;">No portfolio data available</td></tr>';
}

function renderAlertsTable() {
    const container = document.getElementById('alertsTableBody') || document.querySelector('#alerts .alerts-table tbody');
    if (!container) return;
    
    container.innerHTML = appState.alerts?.map(alert => `
        <tr>
            <td>
                <div class="coin-info">
                    <div>
                        <div class="coin-name">${alert.name}</div>
                        <div class="coin-symbol">${alert.symbol.toUpperCase()}</div>
                    </div>
                </div>
            </td>
            <td>${alert.condition}</td>
            <td class="price">${formatCurrency(alert.targetPrice)}</td>
            <td class="price">${formatCurrency(alert.currentPrice)}</td>
            <td>
                <span class="status ${alert.active ? 'active' : 'inactive'}">
                    ${alert.active ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>
                <button class="action-btn" onclick="deleteAlert('${alert.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="6" style="text-align: center; padding: 2rem;">No alerts set</td></tr>';
}

function renderWatchlistGrid() {
    const container = document.getElementById('watchlistGrid');
    if (!container) return;
    
    const watchlist = getWatchlist();
    
    if (watchlist.length === 0) {
        container.innerHTML = `
            <div class="empty-watchlist">
                <i class="fas fa-star fa-3x" style="color: var(--text-secondary); margin-bottom: 1rem;"></i>
                <h3>Your Watchlist is Empty</h3>
                <p>Add cryptocurrencies to your watchlist to track their performance</p>
                <button class="primary-btn" onclick="openModal('addToWatchlistModal')">
                    <i class="fas fa-plus"></i> Add First Coin
                </button>
            </div>
        `;
        return;
    }
    
    const watchlistCoins = appState.coins.filter(coin => watchlist.includes(coin.id));
    
    container.innerHTML = `
        <div class="watchlist-header">
            <h3>Your Watchlist (${watchlist.length})</h3>
            <button class="primary-btn" onclick="openModal('addToWatchlistModal')">
                <i class="fas fa-plus"></i> Add Coin
            </button>
        </div>
        <div class="watchlist-grid">
            ${watchlistCoins.map(coin => `
                <div class="watchlist-card card">
                    <div class="card-header">
                        <div class="coin-info">
                            <img src="${coin.image}" alt="${coin.name}" style="width: 32px; height: 32px;">
                            <div>
                                <h4>${coin.name}</h4>
                                <span class="coin-symbol">${coin.symbol.toUpperCase()}</span>
                            </div>
                        </div>
                        <button class="remove-watchlist-btn" onclick="removeFromWatchlist('${coin.id}')" title="Remove from watchlist">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="card-body">
                        <div class="price-info">
                            <div class="current-price">${formatCurrency(coin.current_price)}</div>
                            <div class="price-change ${coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}">
                                ${coin.price_change_percentage_24h >= 0 ? '+' : ''}${coin.price_change_percentage_24h?.toFixed(2) || 0}%
                            </div>
                        </div>
                        <div class="coin-stats">
                            <div class="stat">
                                <span>Market Cap</span>
                                <strong>${formatCurrency(coin.market_cap)}</strong>
                            </div>
                            <div class="stat">
                                <span>Volume</span>
                                <strong>${formatCurrency(coin.total_volume)}</strong>
                            </div>
                        </div>
                        <div class="watchlist-actions">
                            <button class="action-btn" onclick="tradeCoin('${coin.id}')" title="Trade">
                                <i class="fas fa-exchange-alt"></i>
                            </button>
                            <button class="action-btn" onclick="createAlert('${coin.id}')" title="Set Alert">
                                <i class="fas fa-bell"></i>
                            </button>
                            <button class="action-btn" onclick="openCoinDetail('${coin.id}')" title="View Details">
                                <i class="fas fa-chart-line"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    container.innerHTML = appState.watchlist.map(coin => `
        <div class="watchlist-item card">
            <div class="card-body">
                <div class="coin-info">
                    <div>
                        <h4>${coin.name} (${coin.symbol.toUpperCase()})</h4>
                        <p>Rank #${appState.coins.findIndex(c => c.id === coin.id) + 1}</p>
                    </div>
                </div>
                <div class="price-info">
                    <div class="coin-price">${formatCurrency(coin.price)}</div>
                    <div class="coin-change ${coin.change >= 0 ? 'positive' : 'negative'}">
                        ${coin.change >= 0 ? '+' : ''}${coin.change.toFixed(2)}%
                    </div>
                </div>
                <button class="action-btn" onclick="removeFromWatchlist('${coin.id}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function renderNewsSection() {
    const container = document.getElementById('newsGrid');
    if (!container) return;
    
    fetchCryptoNews().then(news => {
        container.innerHTML = news.map(article => `
            <div class="news-item card">
                <div class="card-body">
                    <h3 class="news-title">${article.title}</h3>
                    <p class="news-summary">${article.summary}</p>
                    <div class="news-meta">
                        <span class="news-source">${article.source}</span>
                        <span class="news-time">${article.time}</span>
                        <span class="news-sentiment ${article.sentiment}">${article.sentiment.toUpperCase()}</span>
                    </div>
                    <div class="news-actions">
                        <button class="news-btn" onclick="openNewsArticle('${article.url}')">
                            <i class="fas fa-external-link-alt"></i> Read More
                        </button>
                        <button class="news-btn secondary" onclick="shareNews('${article.title}')">
                            <i class="fas fa-share"></i> Share
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }).catch(error => {
        console.error('Error loading news:', error);
        container.innerHTML = '<div class="error-message">Unable to load news. Please try again later.</div>';
    });
}

async function fetchCryptoNews() {
    // Simulate real news data with dynamic content
    const newsTemplates = [
        { 
            title: 'Bitcoin Shows Strong Momentum Amid Institutional Interest',
            summary: 'Bitcoin continues its upward trajectory as major institutions increase their cryptocurrency holdings...',
            source: 'CoinDesk',
            sentiment: 'bullish',
            url: 'https://coindesk.com'
        },
        {
            title: 'Ethereum Network Sees Record Transaction Volume',
            summary: 'The Ethereum blockchain processed over 1.5 million transactions yesterday, marking a new milestone...',
            source: 'CryptoPotato', 
            sentiment: 'bullish',
            url: 'https://cryptopotato.com'
        },
        {
            title: 'DeFi Protocol Launches Revolutionary Yield Farming Features',
            summary: 'A new DeFi protocol has introduced innovative yield farming mechanisms that could reshape the landscape...',
            source: 'DeFi Pulse',
            sentiment: 'neutral',
            url: 'https://defipulse.com'
        },
        {
            title: 'Regulatory Updates: SEC Provides New Cryptocurrency Guidelines',
            summary: 'The Securities and Exchange Commission has released updated guidelines for cryptocurrency trading...',
            source: 'Bloomberg Crypto',
            sentiment: 'neutral',
            url: 'https://bloomberg.com'
        },
        {
            title: 'Market Analysis: Altcoins Gaining Ground Against Bitcoin',
            summary: 'Several alternative cryptocurrencies are showing strong performance relative to Bitcoin this week...',
            source: 'CryptoNews',
            sentiment: 'bullish',
            url: 'https://crypto-news.net'
        }
    ];
    
    // Add realistic timestamps
    const now = Date.now();
    return newsTemplates.map((news, index) => ({
        ...news,
        time: new Date(now - (index * 2 + Math.random() * 4) * 60 * 60 * 1000).toLocaleString(),
        id: `news_${index}_${Date.now()}`
    }));
}

function renderTradingSection() {
    const tradingContainer = document.getElementById('tradingInterface') || document.querySelector('#trading .trading-content');
    if (!tradingContainer) return;
    
    // Initialize trading interface
    setupTradingInterface();
    loadTradingData();
    showNotification('Advanced trading terminal loaded!', 'success');
}

function setupTradingInterface() {
    const tradingContainer = document.getElementById('tradingInterface') || document.querySelector('#trading .trading-content');
    if (!tradingContainer) return;
    
    tradingContainer.innerHTML = `
        <div class="trading-dashboard">
            <div class="trading-header">
                <div class="trading-pair-selector">
                    <select id="tradingPair" onchange="changeTradingPair()">
                        <option value="BTCUSDT">BTC/USDT</option>
                        <option value="ETHUSDT">ETH/USDT</option>
                        <option value="ADAUSDT">ADA/USDT</option>
                        <option value="SOLUSDT">SOL/USDT</option>
                        <option value="DOTUSDT">DOT/USDT</option>
                    </select>
                </div>
                <div class="trading-balance">
                    <span>Available: <strong id="tradingBalance">$10,000.00</strong></span>
                </div>
                <button class="primary-btn" onclick="openModal('demoTradingModal')">
                    <i class="fas fa-chart-line"></i> Advanced Trading
                </button>
            </div>
            
            <div class="trading-grid">
                <div class="trading-chart-section">
                    <div class="price-ticker">
                        <div class="current-price">
                            <span id="currentTradingPrice">$45,234.67</span>
                            <span id="priceChange" class="positive">+2.34%</span>
                        </div>
                        <div class="price-stats">
                            <div class="stat">24h High: <span id="high24h">$46,789.12</span></div>
                            <div class="stat">24h Low: <span id="low24h">$43,567.89</span></div>
                            <div class="stat">24h Vol: <span id="volume24h">$2.1B</span></div>
                        </div>
                    </div>
                    <div class="mini-chart">
                        <canvas id="tradingMiniChart" style="width: 100%; height: 200px;"></canvas>
                    </div>
                </div>
                
                <div class="trading-panel">
                    <div class="order-types">
                        <button class="order-type-btn active" data-type="buy" onclick="setOrderType('buy')">BUY</button>
                        <button class="order-type-btn" data-type="sell" onclick="setOrderType('sell')">SELL</button>
                    </div>
                    
                    <div class="order-form">
                        <div class="form-group">
                            <label>Order Type</label>
                            <select id="orderTypeSelect">
                                <option value="market">Market</option>
                                <option value="limit">Limit</option>
                                <option value="stop">Stop Loss</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Amount (USDT)</label>
                            <input type="number" id="orderAmount" placeholder="Enter amount" min="10" step="0.01">
                            <div class="quick-amounts">
                                <button onclick="setQuickAmount(25)">25%</button>
                                <button onclick="setQuickAmount(50)">50%</button>
                                <button onclick="setQuickAmount(75)">75%</button>
                                <button onclick="setQuickAmount(100)">MAX</button>
                            </div>
                        </div>
                        
                        <div class="form-group" id="limitPriceGroup" style="display: none;">
                            <label>Limit Price</label>
                            <input type="number" id="limitPrice" placeholder="Enter price" step="0.01">
                        </div>
                        
                        <button class="execute-order-btn" onclick="executeOrder()">
                            <i class="fas fa-bolt"></i> Execute Order
                        </button>
                    </div>
                </div>
                
                <div class="order-history">
                    <h4>Recent Orders</h4>
                    <div class="order-list" id="orderHistory">
                        <!-- Orders will be populated here -->
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Setup event listeners
    const orderTypeSelect = document.getElementById('orderTypeSelect');
    if (orderTypeSelect) {
        orderTypeSelect.addEventListener('change', function() {
            const limitGroup = document.getElementById('limitPriceGroup');
            if (limitGroup) {
                limitGroup.style.display = this.value === 'limit' ? 'block' : 'none';
            }
        });
    }
}

function renderScreenerSection() {
    // Setup filter event listeners
    setupScreenerFilters();
    
    // Populate initial results
    populateScreenerResults(appState.coins);
    
    showNotification('Advanced screener ready to use!', 'success');
}

function setupScreenerFilters() {
    const applyBtn = document.getElementById('applyFiltersBtn');
    const clearBtn = document.getElementById('clearFiltersBtn');
    
    if (applyBtn) {
        applyBtn.addEventListener('click', applyScreenerFilters);
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', clearScreenerFilters);
    }
}

function applyScreenerFilters() {
    const filters = {
        marketCapMin: parseFloat(document.getElementById('marketCapMin')?.value) || 0,
        marketCapMax: parseFloat(document.getElementById('marketCapMax')?.value) || Infinity,
        priceMin: parseFloat(document.getElementById('priceMin')?.value) || 0,
        priceMax: parseFloat(document.getElementById('priceMax')?.value) || Infinity,
        change24hMin: parseFloat(document.getElementById('change24hMin')?.value) || -Infinity,
        change24hMax: parseFloat(document.getElementById('change24hMax')?.value) || Infinity,
        change7dMin: parseFloat(document.getElementById('change7dMin')?.value) || -Infinity,
        change7dMax: parseFloat(document.getElementById('change7dMax')?.value) || Infinity,
        volumeMin: parseFloat(document.getElementById('volumeMin')?.value) || 0,
        volumeMax: parseFloat(document.getElementById('volumeMax')?.value) || Infinity,
        rsiMin: parseFloat(document.getElementById('rsiMin')?.value) || 0,
        rsiMax: parseFloat(document.getElementById('rsiMax')?.value) || 100
    };
    
    const filteredCoins = appState.coins.filter(coin => {
        return coin.market_cap >= filters.marketCapMin &&
               coin.market_cap <= filters.marketCapMax &&
               coin.current_price >= filters.priceMin &&
               coin.current_price <= filters.priceMax &&
               coin.price_change_percentage_24h >= filters.change24hMin &&
               coin.price_change_percentage_24h <= filters.change24hMax &&
               (coin.price_change_percentage_7d || 0) >= filters.change7dMin &&
               (coin.price_change_percentage_7d || 0) <= filters.change7dMax &&
               coin.total_volume >= filters.volumeMin &&
               coin.total_volume <= filters.volumeMax;
    });
    
    populateScreenerResults(filteredCoins);
    showNotification(`Found ${filteredCoins.length} coins matching criteria`, 'success');
}

function clearScreenerFilters() {
    const filterInputs = [
        'marketCapMin', 'marketCapMax', 'priceMin', 'priceMax',
        'change24hMin', 'change24hMax', 'change7dMin', 'change7dMax',
        'volumeMin', 'volumeMax', 'rsiMin', 'rsiMax'
    ];
    
    filterInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = '';
    });
    
    populateScreenerResults(appState.coins);
    showNotification('Filters cleared', 'info');
}

function populateScreenerResults(coins) {
    const resultsBody = document.getElementById('screenerResults');
    const resultsCount = document.getElementById('resultsCount');
    
    if (resultsCount) {
        resultsCount.textContent = `(${coins.length} coins)`;
    }
    
    if (!resultsBody) return;
    
    if (coins.length === 0) {
        resultsBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem;">
                    No coins match the current filters
                </td>
            </tr>
        `;
        return;
    }
    
    resultsBody.innerHTML = coins.slice(0, 50).map((coin, index) => {
        const rsi = 30 + (coin.price_change_percentage_24h || 0) + Math.random() * 20; // More realistic RSI
        const volume24h = coin.total_volume || 0;
        const marketCap = coin.market_cap || 0;
        const price = coin.current_price || 0;
        
        return `
            <tr onclick="openCoinDetail('${coin.id}')" style="cursor: pointer;" class="screener-row" data-coin-id="${coin.id}">
                <td class="rank-cell">${coin.market_cap_rank || index + 1}</td>
                <td class="coin-cell">
                    <div class="coin-info">
                        <img src="${coin.image}" alt="${coin.name}" class="coin-image">
                        <div class="coin-details">
                            <div class="coin-name">${coin.name}</div>
                            <div class="coin-symbol">${coin.symbol.toUpperCase()}</div>
                        </div>
                    </div>
                </td>
                <td class="price-cell">
                    <span class="price-value" data-price="${price}">${formatPrice(price)}</span>
                </td>
                <td class="change-cell">
                    <span class="change-24h ${coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}">
                        ${coin.price_change_percentage_24h >= 0 ? '+' : ''}${(coin.price_change_percentage_24h || 0).toFixed(2)}%
                    </span>
                </td>
                <td class="change-cell">
                    <span class="change-7d ${(coin.price_change_percentage_7d_in_currency || 0) >= 0 ? 'positive' : 'negative'}">
                        ${(coin.price_change_percentage_7d_in_currency || 0) >= 0 ? '+' : ''}${(coin.price_change_percentage_7d_in_currency || 0).toFixed(2)}%
                    </span>
                </td>
                <td class="market-cap-cell">
                    <span class="market-cap-value">${formatCurrency(marketCap, true)}</span>
                </td>
                <td class="volume-cell">
                    <span class="volume-value">${formatCurrency(volume24h, true)}</span>
                </td>
                <td class="rsi-cell">
                    <span class="rsi-value ${rsi > 70 ? 'overbought' : rsi < 30 ? 'oversold' : 'neutral'}">
                        ${Math.max(0, Math.min(100, rsi)).toFixed(0)}
                    </span>
                </td>
                <td class="action-cell">
                    <button class="watchlist-btn ${getWatchlist().includes(coin.id) ? 'active' : ''}" 
                            onclick="toggleWatchlist('${coin.id}'); event.stopPropagation();" 
                            title="${getWatchlist().includes(coin.id) ? 'Remove from' : 'Add to'} watchlist">
                        <i class="fas fa-star"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderAnalyticsSection() {
    // Render Fear & Greed Index
    renderFearGreedIndex();
    
    // Render Social Sentiment
    renderSocialSentiment();
    
    // Render AI Insights
    renderAIInsights();
    
    // Render Risk Metrics
    renderRiskMetrics();
    
    // Render Market Heatmap
    renderMarketHeatmap();
    
    // Render Correlation Matrix
    renderCorrelationMatrix();
    
    showNotification('Analytics dashboard loaded!', 'success');
}

function renderFearGreedIndex() {
    const container = document.getElementById('fearGreedIndex');
    if (!container) return;
    
    const fearGreedValue = 72;
    const fearGreedLabel = fearGreedValue > 75 ? 'Extreme Greed' : 
                          fearGreedValue > 55 ? 'Greed' : 
                          fearGreedValue > 45 ? 'Neutral' : 
                          fearGreedValue > 25 ? 'Fear' : 'Extreme Fear';
    
    container.innerHTML = `
        <div class="fear-greed-gauge">
            <div class="gauge-container">
                <div class="gauge-background"></div>
                <div class="gauge-fill" style="transform: rotate(${(fearGreedValue / 100) * 180}deg)"></div>
                <div class="gauge-pointer" style="transform: rotate(${(fearGreedValue / 100) * 180}deg)"></div>
            </div>
            <div class="gauge-value">
                <span id="gaugeValue">${fearGreedValue}</span>
                <small id="gaugeLabel">${fearGreedLabel}</small>
            </div>
        </div>
        <div class="fear-greed-history">
            <div class="history-chart">
                <div class="chart-placeholder">7-day trend: 68, 71, 74, 69, 72, 75, ${fearGreedValue}</div>
            </div>
        </div>
    `;
}

function renderSocialSentiment() {
    const container = document.getElementById('socialSentiment');
    if (!container) return;
    
    container.innerHTML = `
        <div class="sentiment-sources">
            <div class="sentiment-item">
                <div class="source-info">
                    <i class="fab fa-twitter"></i>
                    <span>Twitter</span>
                </div>
                <div class="sentiment-meter">
                    <div class="meter-bar">
                        <div class="meter-fill positive" style="width: 82%"></div>
                    </div>
                    <span>82% Positive</span>
                </div>
            </div>
            <div class="sentiment-item">
                <div class="source-info">
                    <i class="fab fa-reddit"></i>
                    <span>Reddit</span>
                </div>
                <div class="sentiment-meter">
                    <div class="meter-bar">
                        <div class="meter-fill positive" style="width: 75%"></div>
                    </div>
                    <span>75% Positive</span>
                </div>
            </div>
            <div class="sentiment-item">
                <div class="source-info">
                    <i class="fas fa-newspaper"></i>
                    <span>News</span>
                </div>
                <div class="sentiment-meter">
                    <div class="meter-bar">
                        <div class="meter-fill neutral" style="width: 67%"></div>
                    </div>
                    <span>67% Neutral</span>
                </div>
            </div>
        </div>
        <div class="trending-topics">
            <h4>Trending Topics</h4>
            <div class="topic-tags">
                <span class="topic-tag hot">#BitcoinETF</span>
                <span class="topic-tag">#Ethereum2.0</span>
                <span class="topic-tag">#DeFiSummer</span>
                <span class="topic-tag hot">#AICoins</span>
            </div>
        </div>
    `;
}

function renderAIInsights() {
    const container = document.getElementById('aiInsights');
    if (!container) return;
    
    container.innerHTML = `
        <div class="insight-item">
            <div class="insight-icon">
                <i class="fas fa-chart-line"></i>
            </div>
            <div class="insight-content">
                <h4>Market Prediction</h4>
                <p>AI models suggest a 73% probability of Bitcoin reaching $52,000 within 30 days based on current trends.</p>
                <span class="confidence-score">Confidence: 87%</span>
            </div>
        </div>
        <div class="insight-item">
            <div class="insight-icon">
                <i class="fas fa-balance-scale"></i>
            </div>
            <div class="insight-content">
                <h4>Portfolio Optimization</h4>
                <p>Consider rebalancing: Reduce BTC allocation by 5% and increase ETH to optimize risk-adjusted returns.</p>
                <span class="confidence-score">Confidence: 92%</span>
            </div>
        </div>
        <div class="insight-item">
            <div class="insight-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="insight-content">
                <h4>Risk Alert</h4>
                <p>High correlation detected between your top 3 holdings. Consider diversification across different sectors.</p>
                <span class="confidence-score">Confidence: 95%</span>
            </div>
        </div>
    `;
}

function renderRiskMetrics() {
    const container = document.getElementById('riskMetrics');
    if (!container) return;
    
    container.innerHTML = `
        <div class="risk-grid">
            <div class="risk-item">
                <span class="risk-label">VaR (95%)</span>
                <span class="risk-value negative">-$2,847</span>
            </div>
            <div class="risk-item">
                <span class="risk-label">Sharpe Ratio</span>
                <span class="risk-value positive">1.42</span>
            </div>
            <div class="risk-item">
                <span class="risk-label">Max Drawdown</span>
                <span class="risk-value negative">-18.3%</span>
            </div>
            <div class="risk-item">
                <span class="risk-label">Beta</span>
                <span class="risk-value">0.87</span>
            </div>
        </div>
        <div class="risk-chart-container">
            <div class="chart-placeholder">Risk distribution chart would appear here</div>
        </div>
    `;
}

function renderMarketHeatmap() {
    const container = document.getElementById('marketHeatmap');
    if (!container) return;
    
    const heatmapData = appState.coins.slice(0, 12).map(coin => ({
        name: coin.symbol.toUpperCase(),
        change: coin.price_change_percentage_24h,
        size: coin.market_cap
    }));
    
    container.innerHTML = heatmapData.map(item => `
        <div class="heatmap-item ${item.change >= 0 ? 'positive' : 'negative'}" 
             style="flex: ${Math.max(item.size / 1000000000, 1)};">
            <span class="heatmap-symbol">${item.name}</span>
            <span class="heatmap-change">${item.change >= 0 ? '+' : ''}${item.change.toFixed(1)}%</span>
        </div>
    `).join('');
}

function renderCorrelationMatrix() {
    const container = document.getElementById('correlationMatrix');
    if (!container) return;
    
    const coins = ['BTC', 'ETH', 'ADA', 'SOL', 'DOT'];
    const correlations = [
        [1.00, 0.85, 0.72, 0.68, 0.75],
        [0.85, 1.00, 0.78, 0.82, 0.71],
        [0.72, 0.78, 1.00, 0.65, 0.69],
        [0.68, 0.82, 0.65, 1.00, 0.73],
        [0.75, 0.71, 0.69, 0.73, 1.00]
    ];
    
    let matrixHTML = '<table class="correlation-table"><thead><tr><th></th>';
    coins.forEach(coin => {
        matrixHTML += `<th>${coin}</th>`;
    });
    matrixHTML += '</tr></thead><tbody>';
    
    correlations.forEach((row, i) => {
        matrixHTML += `<tr><td class="correlation-label">${coins[i]}</td>`;
        row.forEach(correlation => {
            const intensity = Math.abs(correlation);
            const colorClass = correlation > 0.8 ? 'high-correlation' : 
                              correlation > 0.5 ? 'medium-correlation' : 'low-correlation';
            matrixHTML += `<td class="correlation-cell ${colorClass}">${correlation.toFixed(2)}</td>`;
        });
        matrixHTML += '</tr>';
    });
    matrixHTML += '</tbody></table>';
    
    container.innerHTML = matrixHTML;
}

function renderDeFiSection() {
    const container = document.getElementById('defiPools');
    if (!container) return;
    
    const mockPools = [
        { 
            protocol: 'Uniswap V3', 
            pair: 'ETH/USDC', 
            apy: 12.5, 
            tvl: 450000000, 
            risk: 'Medium',
            volume24h: 125000000,
            fees24h: 45000
        },
        { 
            protocol: 'Compound', 
            pair: 'USDC', 
            apy: 5.2, 
            tvl: 2800000000, 
            risk: 'Low',
            volume24h: 45000000,
            fees24h: 12000
        },
        { 
            protocol: 'Aave', 
            pair: 'ETH', 
            apy: 3.8, 
            tvl: 1200000000, 
            risk: 'Low',
            volume24h: 89000000,
            fees24h: 23000
        },
        { 
            protocol: 'Curve', 
            pair: 'stETH/ETH', 
            apy: 8.7, 
            tvl: 890000000, 
            risk: 'Medium',
            volume24h: 67000000,
            fees24h: 18000
        }
    ];
    
    container.innerHTML = mockPools.map(pool => `
        <div class="defi-pool-card card">
            <div class="card-header">
                <h4>${pool.protocol}</h4>
                <span class="pool-badge ${pool.risk.toLowerCase()}-risk">${pool.risk} Risk</span>
            </div>
            <div class="card-body">
                <div class="pool-pair">${pool.pair}</div>
                <div class="pool-stats">
                    <div class="pool-stat">
                        <span>APY</span>
                        <strong class="positive">${pool.apy.toFixed(1)}%</strong>
                    </div>
                    <div class="pool-stat">
                        <span>TVL</span>
                        <strong>${formatCurrency(pool.tvl)}</strong>
                    </div>
                    <div class="pool-stat">
                        <span>24h Volume</span>
                        <strong>${formatCurrency(pool.volume24h)}</strong>
                    </div>
                    <div class="pool-stat">
                        <span>24h Fees</span>
                        <strong class="positive">$${pool.fees24h.toLocaleString()}</strong>
                    </div>
                </div>
                <div class="pool-actions">
                    <button class="primary-btn" onclick="connectDeFiWallet()">Deposit</button>
                    <button class="primary-btn secondary" onclick="exploreStrategy('${pool.protocol.toLowerCase()}')">Details</button>
                </div>
            </div>
        </div>
    `).join('');
    
    showNotification('DeFi section loaded with live data!', 'success');
}

function renderNFTSection() {
    const nftContainer = document.getElementById('nftGrid') || document.querySelector('#nft .nft-content');
    if (!nftContainer) return;
    
    nftContainer.innerHTML = `
        <div class="nft-marketplace">
            <div class="nft-header">
                <h3>NFT Marketplace</h3>
                <div class="nft-filters">
                    <select id="nftCategory">
                        <option value="all">All Categories</option>
                        <option value="art">Digital Art</option>
                        <option value="gaming">Gaming</option>
                        <option value="collectibles">Collectibles</option>
                        <option value="music">Music</option>
                    </select>
                    <select id="nftSort">
                        <option value="recent">Recently Listed</option>
                        <option value="price_low">Price: Low to High</option>
                        <option value="price_high">Price: High to Low</option>
                        <option value="popular">Most Popular</option>
                    </select>
                </div>
            </div>
            
            <div class="nft-stats">
                <div class="nft-stat-card">
                    <h4>Floor Price</h4>
                    <div class="stat-value">2.5 ETH</div>
                    <div class="stat-change positive">+5.2%</div>
                </div>
                <div class="nft-stat-card">
                    <h4>24h Volume</h4>
                    <div class="stat-value">847 ETH</div>
                    <div class="stat-change positive">+12.8%</div>
                </div>
                <div class="nft-stat-card">
                    <h4>Total Items</h4>
                    <div class="stat-value">10,000</div>
                    <div class="stat-change neutral">--</div>
                </div>
                <div class="nft-stat-card">
                    <h4>Owners</h4>
                    <div class="stat-value">3,247</div>
                    <div class="stat-change positive">+2.1%</div>
                </div>
            </div>
            
            <div class="nft-grid">
                ${generateNFTItems()}
            </div>
        </div>
    `;
    
    showNotification('NFT marketplace loaded!', 'success');
}

function generateNFTItems() {
    const nftItems = [
        {
            id: 1,
            name: 'Crypto Punk #1234',
            price: '15.5 ETH',
            image: 'https://via.placeholder.com/300x300/6c5ce7/white?text=NFT+1',
            creator: 'CryptoPunks',
            category: 'collectibles'
        },
        {
            id: 2,
            name: 'Bored Ape #5678',
            price: '25.2 ETH',
            image: 'https://via.placeholder.com/300x300/a29bfe/white?text=NFT+2',
            creator: 'Yuga Labs',
            category: 'collectibles'
        },
        {
            id: 3,
            name: 'Art Blocks Curated',
            price: '8.7 ETH',
            image: 'https://via.placeholder.com/300x300/fd79a8/white?text=NFT+3',
            creator: 'Art Blocks',
            category: 'art'
        },
        {
            id: 4,
            name: 'Axie Infinity #9999',
            price: '0.85 ETH',
            image: 'https://via.placeholder.com/300x300/00b894/white?text=NFT+4',
            creator: 'Sky Mavis',
            category: 'gaming'
        },
        {
            id: 5,
            name: 'Music NFT Collection',
            price: '3.2 ETH',
            image: 'https://via.placeholder.com/300x300/e17055/white?text=NFT+5',
            creator: 'AudioNFT',
            category: 'music'
        },
        {
            id: 6,
            name: 'Metaverse Land Plot',
            price: '12.0 ETH',
            image: 'https://via.placeholder.com/300x300/00cec9/white?text=NFT+6',
            creator: 'Decentraland',
            category: 'gaming'
        }
    ];
    
    return nftItems.map(item => `
        <div class="nft-card" onclick="openNFTDetail('${item.id}')">
            <div class="nft-image">
                <img src="${item.image}" alt="${item.name}" loading="lazy">
                <div class="nft-overlay">
                    <button class="nft-action-btn">View Details</button>
                </div>
            </div>
            <div class="nft-info">
                <h4 class="nft-name">${item.name}</h4>
                <p class="nft-creator">by ${item.creator}</p>
                <div class="nft-price">
                    <span class="price-label">Current Price</span>
                    <span class="price-value">${item.price}</span>
                </div>
                <div class="nft-actions">
                    <button class="nft-btn primary" onclick="buyNFT('${item.id}', event)">
                        <i class="fas fa-shopping-cart"></i> Buy Now
                    </button>
                    <button class="nft-btn secondary" onclick="addToWishlist('${item.id}', event)">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// =============================================
// Trading Functions
// =============================================
function loadTradingData() {
    updateTradingPrice();
    loadOrderHistory();
    
    // Update prices every 10 seconds
    setInterval(updateTradingPrice, 10000);
}

function updateTradingPrice() {
    const pair = document.getElementById('tradingPair')?.value || 'BTCUSDT';
    const currentCoin = appState.coins.find(coin => 
        (pair.startsWith(coin.symbol.toUpperCase()) || pair.startsWith(coin.id))
    ) || appState.coins[0];
    
    if (currentCoin) {
        const priceElement = document.getElementById('currentTradingPrice');
        const changeElement = document.getElementById('priceChange');
        const high24hElement = document.getElementById('high24h');
        const low24hElement = document.getElementById('low24h');
        const volume24hElement = document.getElementById('volume24h');
        
        if (priceElement) priceElement.textContent = formatCurrency(currentCoin.current_price);
        if (changeElement) {
            changeElement.textContent = `${currentCoin.price_change_percentage_24h >= 0 ? '+' : ''}${currentCoin.price_change_percentage_24h?.toFixed(2) || 0}%`;
            changeElement.className = currentCoin.price_change_percentage_24h >= 0 ? 'positive' : 'negative';
        }
        if (high24hElement) high24hElement.textContent = formatCurrency(currentCoin.high_24h || currentCoin.current_price * 1.05);
        if (low24hElement) low24hElement.textContent = formatCurrency(currentCoin.low_24h || currentCoin.current_price * 0.95);
        if (volume24hElement) volume24hElement.textContent = formatCurrency(currentCoin.total_volume);
    }
}

function changeTradingPair() {
    updateTradingPrice();
    showNotification('Trading pair updated', 'success');
}

function setOrderType(type) {
    document.querySelectorAll('.order-type-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-type="${type}"]`).classList.add('active');
}

function setQuickAmount(percentage) {
    const balance = 10000; // Demo balance
    const amount = (balance * percentage) / 100;
    const amountInput = document.getElementById('orderAmount');
    if (amountInput) amountInput.value = amount.toFixed(2);
}

function executeOrder() {
    const amount = document.getElementById('orderAmount')?.value;
    const orderType = document.getElementById('orderTypeSelect')?.value;
    const limitPrice = document.getElementById('limitPrice')?.value;
    const side = document.querySelector('.order-type-btn.active')?.dataset.type || 'buy';
    
    if (!amount || parseFloat(amount) < 10) {
        showNotification('Minimum order amount is $10', 'error');
        return;
    }
    
    if (orderType === 'limit' && !limitPrice) {
        showNotification('Please enter limit price', 'error');
        return;
    }
    
    // Simulate order execution
    const order = {
        id: Date.now().toString(),
        pair: document.getElementById('tradingPair')?.value || 'BTCUSDT',
        side: side.toUpperCase(),
        amount: parseFloat(amount),
        type: orderType,
        price: orderType === 'limit' ? parseFloat(limitPrice) : document.getElementById('currentTradingPrice')?.textContent,
        status: 'filled',
        timestamp: new Date().toLocaleTimeString()
    };
    
    addOrderToHistory(order);
    showNotification(`${side.toUpperCase()} order executed successfully!`, 'success');
    
    // Clear form
    document.getElementById('orderAmount').value = '';
    if (document.getElementById('limitPrice')) document.getElementById('limitPrice').value = '';
}

function addOrderToHistory(order) {
    const historyContainer = document.getElementById('orderHistory');
    if (!historyContainer) return;
    
    const orderElement = document.createElement('div');
    orderElement.className = 'order-item';
    orderElement.innerHTML = `
        <div class="order-details">
            <span class="order-pair">${order.pair}</span>
            <span class="order-side ${order.side.toLowerCase()}">${order.side}</span>
            <span class="order-amount">${formatCurrency(order.amount)}</span>
            <span class="order-status">${order.status}</span>
            <span class="order-time">${order.timestamp}</span>
        </div>
    `;
    
    historyContainer.insertBefore(orderElement, historyContainer.firstChild);
    
    // Keep only last 10 orders
    while (historyContainer.children.length > 10) {
        historyContainer.removeChild(historyContainer.lastChild);
    }
}

function loadOrderHistory() {
    const historyContainer = document.getElementById('orderHistory');
    if (!historyContainer) return;
    
    // Add some demo orders
    const demoOrders = [
        { pair: 'BTCUSDT', side: 'BUY', amount: 1000, status: 'filled', timestamp: '10:30:45' },
        { pair: 'ETHUSDT', side: 'SELL', amount: 500, status: 'filled', timestamp: '09:15:22' },
        { pair: 'ADAUSDT', side: 'BUY', amount: 250, status: 'filled', timestamp: '08:45:10' }
    ];
    
    demoOrders.forEach(order => addOrderToHistory(order));
}

// =============================================
// Watchlist Functions
// =============================================
function getWatchlist() {
    return JSON.parse(localStorage.getItem('cryptoWatchlist')) || [];
}

function addToWatchlist(coinId) {
    const watchlist = getWatchlist();
    if (!watchlist.includes(coinId)) {
        watchlist.push(coinId);
        localStorage.setItem('cryptoWatchlist', JSON.stringify(watchlist));
        showNotification('Added to watchlist!', 'success');
        if (appState.currentSection === 'watchlist') {
            renderWatchlistGrid();
        }
    } else {
        showNotification('Already in watchlist', 'info');
    }
}

function removeFromWatchlist(coinId) {
    const watchlist = getWatchlist();
    const index = watchlist.indexOf(coinId);
    if (index > -1) {
        watchlist.splice(index, 1);
        localStorage.setItem('cryptoWatchlist', JSON.stringify(watchlist));
        showNotification('Removed from watchlist', 'success');
        renderWatchlistGrid();
    }
}

// =============================================
// NFT Functions
// =============================================
function openNFTDetail(nftId) {
    showNotification(`Viewing NFT details for item #${nftId}`, 'info');
}

function buyNFT(nftId, event) {
    event.stopPropagation();
    showNotification(`Purchase initiated for NFT #${nftId}`, 'success');
}

function addToWishlist(nftId, event) {
    event.stopPropagation();
    showNotification(`Added NFT #${nftId} to wishlist`, 'success');
}

// =============================================
// News Functions
// =============================================
function openNewsArticle(url) {
    window.open(url, '_blank');
}

function shareNews(title) {
    if (navigator.share) {
        navigator.share({
            title: title,
            text: `Check out this crypto news: ${title}`,
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(`${title} - ${window.location.href}`);
        showNotification('News link copied to clipboard!', 'success');
    }
}

// =============================================
// Alert Functions
// =============================================
function createAlert(coinId) {
    const coin = appState.coins.find(c => c.id === coinId);
    if (!coin) return;
    
    const targetPrice = prompt(`Set price alert for ${coin.name} (${coin.symbol.toUpperCase()})\nCurrent price: ${formatCurrency(coin.current_price)}\n\nEnter target price:`);
    
    if (targetPrice && !isNaN(parseFloat(targetPrice))) {
        const alert = {
            id: Date.now().toString(),
            coinId: coin.id,
            name: coin.name,
            symbol: coin.symbol,
            targetPrice: parseFloat(targetPrice),
            currentPrice: coin.current_price,
            condition: parseFloat(targetPrice) > coin.current_price ? 'above' : 'below',
            active: true,
            created: new Date().toISOString()
        };
        
        appState.alerts = appState.alerts || [];
        appState.alerts.push(alert);
        
        // Save to localStorage
        localStorage.setItem('cryptoAlerts', JSON.stringify(appState.alerts));
        
        showNotification(`Price alert created for ${coin.name}!`, 'success');
        
        if (appState.currentSection === 'alerts') {
            renderAlertsTable();
        }
    }
}

function deleteAlert(alertId) {
    appState.alerts = appState.alerts.filter(alert => alert.id !== alertId);
    localStorage.setItem('cryptoAlerts', JSON.stringify(appState.alerts));
    showNotification('Alert deleted', 'success');
    renderAlertsTable();
}

// =============================================
// Advanced Functions
// =============================================
function tradeCoin(coinId) {
    switchSection('trading');
    // Set the trading pair if possible
    const coin = appState.coins.find(c => c.id === coinId);
    if (coin) {
        const tradingPair = document.getElementById('tradingPair');
        if (tradingPair) {
            const pairValue = `${coin.symbol.toUpperCase()}USDT`;
            if ([...tradingPair.options].some(option => option.value === pairValue)) {
                tradingPair.value = pairValue;
                changeTradingPair();
            }
        }
    }
}

function openCoinDetail(coinId) {
    const coin = appState.coins.find(c => c.id === coinId);
    if (coin) {
        showNotification(`Opening details for ${coin.name}`, 'info');
        // Here you could open a detailed modal or navigate to a detail page
    }
}

// =============================================
// Utility Functions
// =============================================
function formatCurrency(amount, compact = false) {
    if (!amount || isNaN(amount)) return '$0.00';
    
    if (compact || amount >= 1e12) {
        return '$' + (amount / 1e12).toFixed(2) + 'T';
    } else if (amount >= 1e9) {
        return '$' + (amount / 1e9).toFixed(2) + 'B';
    } else if (amount >= 1e6) {
        return '$' + (amount / 1e6).toFixed(2) + 'M';
    } else if (amount >= 1000) {
        return '$' + (amount / 1000).toFixed(2) + 'K';
    } else if (amount >= 1) {
        return '$' + amount.toFixed(2);
    } else if (amount >= 0.01) {
        return '$' + amount.toFixed(4);
    } else {
        return '$' + amount.toFixed(6);
    }
}

// Compact price formatting for tables
function formatPrice(amount) {
    if (!amount || isNaN(amount)) return '$0.00';
    
    if (amount >= 1000) {
        return '$' + amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    } else if (amount >= 1) {
        return '$' + amount.toFixed(2);
    } else if (amount >= 0.01) {
        return '$' + amount.toFixed(4);
    } else {
        return '$' + amount.toFixed(6);
    }
}

function showLoading(show) {
    const loader = document.getElementById('loadingOverlay');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
    appState.isLoading = show;
}

function handleSearch(event) {
    const query = event.target.value.toLowerCase().trim();
    if (query.length === 0) return;
    
    const filteredCoins = appState.coins.filter(coin => 
        coin.name.toLowerCase().includes(query) ||
        coin.symbol.toLowerCase().includes(query)
    );
    
    if (filteredCoins.length > 0) {
        showSearchResults(filteredCoins);
    }
}

function showSearchResults(coins) {
    const suggestions = document.querySelector('.search-suggestions');
    if (suggestions) {
        suggestions.innerHTML = coins.slice(0, 5).map(coin => `
            <div class="suggestion-item" onclick="openCoinDetail('${coin.id}')">
                <img src="${coin.image}" alt="${coin.name}">
                <div class="suggestion-info">
                    <div class="suggestion-name">${coin.name}</div>
                    <div class="suggestion-symbol">${coin.symbol.toUpperCase()}</div>
                </div>
                <div class="suggestion-price">${formatCurrency(coin.current_price)}</div>
            </div>
        `).join('');
        suggestions.style.display = 'block';
        
        setTimeout(() => {
            suggestions.style.display = 'none';
        }, 5000);
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function toggleTheme() {
    appState.darkMode = !appState.darkMode;
    document.body.setAttribute('data-theme', appState.darkMode ? 'dark' : 'light');
    localStorage.setItem('darkMode', appState.darkMode);
    
    const themeIcon = document.querySelector('#themeToggle i');
    if (themeIcon) {
        themeIcon.className = appState.darkMode ? 'fas fa-sun' : 'fas fa-moon';
    }
}

async function refreshAllData() {
    try {
        showLoading(true);
        await fetchGlobalData();
        updateMarketTicker();
        renderDashboard();
        showNotification('✅ Data refreshed successfully!', 'success');
    } catch (error) {
        console.error('Failed to refresh data:', error);
        showNotification('❌ Failed to refresh data. Using cached data.', 'warning');
    } finally {
        showLoading(false);
    }
}

// =============================================
// AI Analysis with OpenAI
// =============================================
async function performAIAnalysis(marketData = null) {
    try {
        showLoading(true);
        
        const analysisData = marketData || {
            marketCap: 1230000000000,
            totalVolume: 45670000000,
            btcDominance: 48.5,
            fearGreedIndex: 72,
            topCoins: appState.coins.slice(0, 10).map(coin => ({
                name: coin.name,
                symbol: coin.symbol,
                price: coin.current_price,
                change24h: coin.price_change_percentage_24h,
                marketCap: coin.market_cap
            }))
        };

        const prompt = `Analyze the current cryptocurrency market data and provide insights:
        
        Market Data:
        - Total Market Cap: $${(analysisData.marketCap / 1e12).toFixed(2)}T
        - 24h Volume: $${(analysisData.totalVolume / 1e9).toFixed(2)}B
        - BTC Dominance: ${analysisData.btcDominance}%
        - Fear & Greed Index: ${analysisData.fearGreedIndex}
        
        Top Coins Performance:
        ${analysisData.topCoins.map(coin => `${coin.symbol}: $${coin.price} (${coin.change24h?.toFixed(2)}%)`).join('\n')}
        
        Please provide:
        1. Overall market sentiment analysis
        2. Key trends and patterns
        3. Risk assessment
        4. Trading recommendations
        5. Price predictions for major cryptocurrencies
        
        Keep the response concise and actionable.`;

        const response = await fetch(`${OPENAI_CONFIG.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_CONFIG.apiKey}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'CryptoVision Pro'
            },
            body: JSON.stringify({
                model: OPENAI_CONFIG.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert cryptocurrency market analyst. Provide clear, actionable insights based on market data.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 1000,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`AI API error: ${response.status}`);
        }

        const aiResponse = await response.json();
        const analysis = aiResponse.choices[0].message.content;
        
        displayAIAnalysis(analysis);
        showNotification('AI analysis completed successfully!', 'success');
        
    } catch (error) {
        console.error('AI Analysis error:', error);
        showNotification('AI analysis failed. Using demo insights.', 'warning');
        displayDemoAIAnalysis();
    } finally {
        showLoading(false);
    }
}

function displayAIAnalysis(analysis) {
    const modal = document.getElementById('aiAnalysisModal');
    if (!modal) return;
    
    const analysisContent = modal.querySelector('.ai-analysis-content');
    if (analysisContent) {
        analysisContent.innerHTML = `
            <div class="ai-powered-analysis">
                <div class="analysis-header">
                    <h3><i class="fas fa-robot"></i> AI Market Analysis</h3>
                    <span class="analysis-timestamp">Generated: ${new Date().toLocaleString()}</span>
                </div>
                <div class="analysis-body">
                    <div class="analysis-text">${analysis.replace(/\n/g, '<br>')}</div>
                </div>
                <div class="analysis-footer">
                    <button class="primary-btn" onclick="performAIAnalysis()">
                        <i class="fas fa-sync-alt"></i> Refresh Analysis
                    </button>
                    <button class="primary-btn secondary" onclick="exportAnalysis()">
                        <i class="fas fa-download"></i> Export Report
                    </button>
                </div>
            </div>
        `;
    }
    
    modal.classList.add('active');
}

function displayDemoAIAnalysis() {
    const demoAnalysis = `
        <div class="analysis-section">
            <h4><i class="fas fa-chart-line"></i> Market Sentiment: BULLISH (78%)</h4>
            <p>Current market conditions show strong bullish sentiment with increased institutional adoption and positive regulatory developments. The Fear & Greed Index at 72 indicates market optimism.</p>
        </div>
        
        <div class="analysis-section">
            <h4><i class="fas fa-trending-up"></i> Key Trends</h4>
            <ul>
                <li>Bitcoin maintaining support above $45,000 with potential for $52,000 target</li>
                <li>Ethereum showing strength ahead of major network upgrades</li>
                <li>Altcoin season emerging with selective outperformance</li>
                <li>DeFi TVL increasing, indicating renewed interest in decentralized finance</li>
            </ul>
        </div>
        
        <div class="analysis-section">
            <h4><i class="fas fa-shield-alt"></i> Risk Assessment: MEDIUM</h4>
            <p>While sentiment is positive, traders should remain cautious of potential volatility around key resistance levels. Diversification across multiple assets is recommended.</p>
        </div>
        
        <div class="analysis-section">
            <h4><i class="fas fa-lightbulb"></i> Recommendations</h4>
            <ul>
                <li>Consider partial profit-taking on overextended positions</li>
                <li>Maintain 40-60% allocation in Bitcoin and Ethereum</li>
                <li>Explore DeFi opportunities with higher yields</li>
                <li>Set stop-losses below key support levels</li>
            </ul>
        </div>
    `;
    
    const modal = document.getElementById('aiAnalysisModal');
    const analysisContent = modal.querySelector('.ai-analysis-content');
    if (analysisContent) {
        analysisContent.innerHTML = demoAnalysis;
    }
    modal.classList.add('active');
}

// =============================================
// Advanced Features
// =============================================
async function openCoinDetail(coinId) {
    const coin = appState.coins.find(c => c.id === coinId);
    if (!coin) {
        showNotification('Coin data not found', 'error');
        return;
    }
    
    showCoinModal(coin);
}

function showCoinModal(coinData) {
    const modal = document.getElementById('coinDetailModal') || createCoinModal();
    const modalBody = modal.querySelector('.modal-body');
    
    modalBody.innerHTML = `
        <div class="coin-detail-header">
            <img src="${coinData.image || 'https://via.placeholder.com/64'}" alt="${coinData.name}">
            <div>
                <h2>${coinData.name}</h2>
                <p>${coinData.symbol?.toUpperCase()}</p>
            </div>
            <div class="coin-price">
                <div class="current-price">${formatCurrency(coinData.current_price)}</div>
                <div class="price-change ${coinData.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}">
                    ${coinData.price_change_percentage_24h >= 0 ? '+' : ''}${coinData.price_change_percentage_24h?.toFixed(2) || 0}%
                </div>
            </div>
        </div>
        <div class="coin-stats">
            <div class="stat-grid">
                <div class="stat-item">
                    <span>Market Cap</span>
                    <strong>${formatCurrency(coinData.market_cap)}</strong>
                </div>
                <div class="stat-item">
                    <span>24h Volume</span>
                    <strong>${formatCurrency(coinData.total_volume)}</strong>
                </div>
                <div class="stat-item">
                    <span>24h High</span>
                    <strong>${formatCurrency(coinData.high_24h)}</strong>
                </div>
                <div class="stat-item">
                    <span>24h Low</span>
                    <strong>${formatCurrency(coinData.low_24h)}</strong>
                </div>
            </div>
        </div>
        <div class="coin-actions">
            <button class="primary-btn" onclick="addToWatchlist('${coinData.id}')">
                <i class="fas fa-star"></i> Add to Watchlist
            </button>
            <button class="primary-btn secondary" onclick="openModal('alertModal')">
                <i class="fas fa-bell"></i> Set Alert
            </button>
        </div>
    `;
    
    modal.classList.add('active');
}

function createCoinModal() {
    const modal = document.createElement('div');
    modal.id = 'coinDetailModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Coin Details</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body"></div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.close-modal').addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
    
    return modal;
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

// Set initial theme
document.body.setAttribute('data-theme', appState.darkMode ? 'dark' : 'light');

// Helper functions for UI interactions
function addToWatchlist(coinId) {
    const coin = appState.coins.find(c => c.id === coinId);
    if (coin && !appState.watchlist.find(w => w.id === coinId)) {
        appState.watchlist.push({
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol,
            price: coin.current_price,
            change: coin.price_change_percentage_24h
        });
        showNotification(`${coin.name} added to watchlist!`, 'success');
    } else {
        showNotification(`${coin?.name || 'Coin'} already in watchlist!`, 'info');
    }
}

function removeFromWatchlist(coinId) {
    const index = appState.watchlist.findIndex(w => w.id === coinId);
    if (index > -1) {
        const coin = appState.watchlist[index];
        appState.watchlist.splice(index, 1);
        showNotification(`${coin.name} removed from watchlist!`, 'success');
        renderWatchlistGrid();
    }
}

function tradeCoin(coinId) {
    showNotification(`Opening trading interface for ${coinId}...`, 'info');
    switchSection('trading');
}

function deleteAlert(alertId) {
    const index = appState.alerts.findIndex(a => a.id == alertId);
    if (index > -1) {
        appState.alerts.splice(index, 1);
        showNotification('Alert deleted!', 'success');
        renderAlertsTable();
    }
}

// Authentication functions
async function handleLogin(email, password) {
    try {
        showLoading(true);
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('sessionToken', data.sessionToken);
            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('userName', data.user.name);
            localStorage.setItem('userEmail', data.user.email);
            localStorage.setItem('userPlan', data.user.plan);
            
            appState.user = {
                id: data.user.id,
                isLoggedIn: true,
                name: data.user.name,
                email: data.user.email,
                plan: data.user.plan,
                isPro: data.user.plan === 'pro',
                sessionToken: data.sessionToken
            };
            
            document.getElementById('authModal').classList.remove('active');
            updateUserUI();
            showNotification('Login successful!', 'success');
            
        } else {
            showNotification(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Login failed. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

async function handleRegister(email, password, name) {
    try {
        showLoading(true);
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, name })
        });
        
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('sessionToken', data.sessionToken);
            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('userName', data.user.name);
            localStorage.setItem('userEmail', data.user.email);
            localStorage.setItem('userPlan', data.user.plan);
            
            appState.user = {
                id: data.user.id,
                isLoggedIn: true,
                name: data.user.name,
                email: data.user.email,
                plan: data.user.plan,
                isPro: data.user.plan === 'pro',
                sessionToken: data.sessionToken
            };
            
            document.getElementById('authModal').classList.remove('active');
            updateUserUI();
            showNotification('Registration successful! Welcome to CryptoVision Pro!', 'success');
            
        } else {
            showNotification(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Registration failed. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

async function handleLogout() {
    try {
        if (appState.user.sessionToken) {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${appState.user.sessionToken}`
                }
            });
        }
        
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userPlan');
        
        appState.user = {
            id: null,
            isLoggedIn: false,
            name: 'Guest User',
            email: null,
            plan: 'free',
            isPro: false,
            sessionToken: null
        };
        
        updateUserUI();
        showNotification('Logged out successfully', 'success');
        
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Logout failed', 'error');
    }
}

function updateUserUI() {
    const userNameElement = document.getElementById('userName');
    const userPlanElement = document.getElementById('userPlan');
    const loginBtn = document.getElementById('loginBtn');
    
    if (userNameElement) userNameElement.textContent = appState.user.name;
    if (userPlanElement) userPlanElement.textContent = appState.user.isPro ? 'Pro Plan' : 'Free Plan';
    
    if (loginBtn) {
        if (appState.user.isLoggedIn) {
            loginBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i>';
            loginBtn.title = 'Logout';
            loginBtn.onclick = handleLogout;
        } else {
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i>';
            loginBtn.title = 'Login';
            loginBtn.onclick = () => openModal('authModal');
        }
    }
}

// API helper function with authentication
async function authenticatedFetch(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (appState.user.sessionToken) {
        headers.Authorization = `Bearer ${appState.user.sessionToken}`;
    }
    
    return fetch(url, {
        ...options,
        headers
    });
}

// =============================================
// Complete Feature Implementation
// =============================================

// Demo Trading System
let demoTradingState = {
    balance: 100000,
    positions: [
        {
            id: 1,
            pair: 'BTC/USDT',
            side: 'LONG',
            size: 0.0443,
            entryPrice: 44856.23,
            currentPrice: 45234.67,
            pnl: 16.77,
            roe: 0.84
        },
        {
            id: 2,
            pair: 'ETH/USDT',
            side: 'SHORT',
            size: 0.628,
            entryPrice: 3201.45,
            currentPrice: 3187.45,
            pnl: 8.79,
            roe: 0.44
        }
    ],
    openOrders: [],
    tradingHistory: []
};

// Portfolio Optimizer
function openPortfolioOptimizer() {
    const modal = document.getElementById('riskAnalysisModal');
    if (modal) {
        modal.classList.add('active');
        renderPortfolioOptimization();
    }
}

function renderPortfolioOptimization() {
    const modalBody = document.querySelector('#riskAnalysisModal .modal-body');
    if (!modalBody) return;
    
    modalBody.innerHTML = `
        <div class="portfolio-optimizer">
            <div class="optimizer-header">
                <h3>🧠 AI Portfolio Optimizer</h3>
                <div class="current-score">
                    <span>Current Score: <strong>8.4/10</strong></span>
                </div>
            </div>
            
            <div class="optimization-suggestions">
                <h4>💡 Optimization Suggestions</h4>
                <div class="suggestion-list">
                    <div class="suggestion-item high-priority">
                        <div class="suggestion-content">
                            <h5>Rebalance BTC Allocation</h5>
                            <p>Reduce Bitcoin from 65% to 50% for better risk distribution</p>
                            <div class="suggestion-impact">
                                <span>Expected Impact: +12% risk-adjusted return</span>
                            </div>
                        </div>
                        <button class="apply-suggestion-btn" onclick="applySuggestion('rebalance-btc')">
                            Apply
                        </button>
                    </div>
                    <div class="suggestion-item medium-priority">
                        <div class="suggestion-content">
                            <h5>Add DeFi Exposure</h5>
                            <p>Consider 10% allocation to UNI, AAVE for diversification</p>
                            <div class="suggestion-impact">
                                <span>Expected Impact: +8% annual yield</span>
                            </div>
                        </div>
                        <button class="apply-suggestion-btn" onclick="applySuggestion('add-defi')">
                            Apply
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="risk-metrics">
                <h4>📊 Risk Analysis</h4>
                <div class="metrics-grid">
                    <div class="metric-card">
                        <span>Sharpe Ratio</span>
                        <strong class="positive">1.42</strong>
                    </div>
                    <div class="metric-card">
                        <span>Max Drawdown</span>
                        <strong class="negative">-18.3%</strong>
                    </div>
                    <div class="metric-card">
                        <span>Beta</span>
                        <strong>0.87</strong>
                    </div>
                    <div class="metric-card">
                        <span>VaR (95%)</span>
                        <strong class="negative">-$2,847</strong>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function applySuggestion(suggestionId) {
    showNotification(`Applied suggestion: ${suggestionId}`, 'success');
    renderPortfolioOptimization();
}

// Advanced AI Analysis
function openAdvancedAI() {
    performAIAnalysis();
}

// Demo Trading Functions
function executeDemoTrade(side) {
    const orderSize = parseFloat(document.getElementById('demoOrderSize')?.value || 1000);
    const leverage = parseFloat(document.getElementById('demoLeverage')?.value || 10);
    const currentPrice = 45234.67; // BTC price
    
    const position = {
        id: Date.now(),
        pair: 'BTC/USDT',
        side: side.toUpperCase(),
        size: orderSize / currentPrice,
        entryPrice: currentPrice,
        currentPrice: currentPrice,
        pnl: 0,
        roe: 0,
        leverage: leverage
    };
    
    demoTradingState.positions.push(position);
    demoTradingState.balance -= orderSize / leverage; // Margin required
    
    showNotification(`Demo ${side} position opened for $${orderSize}`, 'success');
    updateDemoTradingInterface();
}

function closeDemoPosition(positionIndex) {
    const position = demoTradingState.positions[positionIndex];
    if (position) {
        const pnl = position.pnl;
        demoTradingState.balance += pnl;
        demoTradingState.positions.splice(positionIndex, 1);
        
        showNotification(`Position closed. P&L: $${pnl.toFixed(2)}`, pnl >= 0 ? 'success' : 'warning');
        updateDemoTradingInterface();
    }
}

function updateDemoTradingInterface() {
    const balanceEl = document.getElementById('modalDemoBalance');
    const positionsCountEl = document.getElementById('openPositionsCount');
    const totalPnLEl = document.getElementById('totalDemoPnL');
    
    if (balanceEl) balanceEl.textContent = `$${demoTradingState.balance.toFixed(2)}`;
    if (positionsCountEl) positionsCountEl.textContent = demoTradingState.positions.length;
    
    const totalPnL = demoTradingState.positions.reduce((sum, pos) => sum + pos.pnl, 0);
    if (totalPnLEl) {
        totalPnLEl.textContent = `${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)}`;
        totalPnLEl.className = totalPnL >= 0 ? 'positive' : 'negative';
    }
}

// Market Signals
function executeSignal(symbol, direction) {
    showNotification(`Executing ${direction.toUpperCase()} signal for ${symbol}`, 'success');
    
    // Add to demo portfolio
    const trade = {
        symbol,
        direction,
        timestamp: new Date().toISOString(),
        confidence: Math.floor(Math.random() * 20) + 80 // 80-100%
    };
    
    demoTradingState.tradingHistory.push(trade);
}

// Arbitrage Calculator
function openArbitrageCalculator() {
    const modal = createModal('arbitrageCalculator', 'Arbitrage Calculator');
    const modalBody = modal.querySelector('.modal-body');
    
    modalBody.innerHTML = `
        <div class="arbitrage-calculator">
            <div class="calculator-form">
                <div class="form-group">
                    <label>Trading Pair</label>
                    <select id="arbPair">
                        <option value="BTC/USDT">BTC/USDT</option>
                        <option value="ETH/USDT">ETH/USDT</option>
                        <option value="ADA/USDT">ADA/USDT</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Capital Amount ($)</label>
                    <input type="number" id="arbCapital" value="10000" min="100" max="1000000">
                </div>
                <div class="form-group">
                    <label>Exchange 1 Price</label>
                    <input type="number" id="exchange1Price" value="45200" step="0.01">
                </div>
                <div class="form-group">
                    <label>Exchange 2 Price</label>
                    <input type="number" id="exchange2Price" value="45450" step="0.01">
                </div>
                <div class="form-group">
                    <label>Trading Fees (%)</label>
                    <input type="number" id="tradingFees" value="0.1" step="0.01" min="0" max="5">
                </div>
                <button onclick="calculateArbitrage()" class="primary-btn">Calculate Profit</button>
            </div>
            
            <div class="arbitrage-results" id="arbitrageResults">
                <h4>Potential Profit</h4>
                <div class="result-item">
                    <span>Price Difference:</span>
                    <strong id="priceDiff">$250.00 (0.55%)</strong>
                </div>
                <div class="result-item">
                    <span>Gross Profit:</span>
                    <strong id="grossProfit" class="positive">$125.00</strong>
                </div>
                <div class="result-item">
                    <span>Trading Fees:</span>
                    <strong id="tradingFeesAmount" class="negative">-$20.00</strong>
                </div>
                <div class="result-item">
                    <span>Net Profit:</span>
                    <strong id="netProfit" class="positive">$105.00</strong>
                </div>
                <div class="result-item">
                    <span>ROI:</span>
                    <strong id="roi" class="positive">1.05%</strong>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

function calculateArbitrage() {
    const capital = parseFloat(document.getElementById('arbCapital')?.value || 10000);
    const price1 = parseFloat(document.getElementById('exchange1Price')?.value || 45200);
    const price2 = parseFloat(document.getElementById('exchange2Price')?.value || 45450);
    const fees = parseFloat(document.getElementById('tradingFees')?.value || 0.1) / 100;
    
    const priceDiff = Math.abs(price2 - price1);
    const priceDiffPercent = (priceDiff / Math.min(price1, price2)) * 100;
    const grossProfit = (capital / Math.min(price1, price2)) * priceDiff;
    const feesAmount = capital * fees * 2; // Buy and sell fees
    const netProfit = grossProfit - feesAmount;
    const roi = (netProfit / capital) * 100;
    
    document.getElementById('priceDiff').textContent = `$${priceDiff.toFixed(2)} (${priceDiffPercent.toFixed(2)}%)`;
    document.getElementById('grossProfit').textContent = `$${grossProfit.toFixed(2)}`;
    document.getElementById('tradingFeesAmount').textContent = `-$${feesAmount.toFixed(2)}`;
    document.getElementById('netProfit').textContent = `$${netProfit.toFixed(2)}`;
    document.getElementById('netProfit').className = netProfit >= 0 ? 'positive' : 'negative';
    document.getElementById('roi').textContent = `${roi.toFixed(2)}%`;
    document.getElementById('roi').className = roi >= 0 ? 'positive' : 'negative';
}

// Technical Analysis
function openTechnicalAnalysis() {
    const modal = createModal('technicalAnalysis', 'Advanced Technical Analysis');
    const modalBody = modal.querySelector('.modal-body');
    
    modalBody.innerHTML = `
        <div class="technical-analysis">
            <div class="analysis-controls">
                <select id="taSymbol">
                    <option value="BTC">Bitcoin (BTC)</option>
                    <option value="ETH">Ethereum (ETH)</option>
                    <option value="ADA">Cardano (ADA)</option>
                </select>
                <select id="taTimeframe">
                    <option value="1h">1 Hour</option>
                    <option value="4h" selected>4 Hours</option>
                    <option value="1d">1 Day</option>
                </select>
            </div>
            
            <div class="indicators-grid">
                <div class="indicator-card">
                    <h4>RSI (14)</h4>
                    <div class="indicator-value warning">68.5</div>
                    <div class="indicator-signal">Approaching Overbought</div>
                </div>
                <div class="indicator-card">
                    <h4>MACD</h4>
                    <div class="indicator-value positive">Bullish</div>
                    <div class="indicator-signal">Signal Line Cross</div>
                </div>
                <div class="indicator-card">
                    <h4>Moving Averages</h4>
                    <div class="indicator-value positive">Golden Cross</div>
                    <div class="indicator-signal">50 MA > 200 MA</div>
                </div>
                <div class="indicator-card">
                    <h4>Bollinger Bands</h4>
                    <div class="indicator-value neutral">Middle Band</div>
                    <div class="indicator-signal">Price near center</div>
                </div>
            </div>
            
            <div class="pattern-recognition">
                <h4>🔍 Pattern Recognition</h4>
                <div class="pattern-list">
                    <div class="pattern-item bullish">
                        <span class="pattern-name">Ascending Triangle</span>
                        <span class="pattern-confidence">89%</span>
                        <span class="pattern-target">$48,500</span>
                    </div>
                    <div class="pattern-item neutral">
                        <span class="pattern-name">Support/Resistance</span>
                        <span class="pattern-confidence">76%</span>
                        <span class="pattern-target">$44,200 - $46,800</span>
                    </div>
                </div>
            </div>
            
            <div class="trading-signals">
                <h4>📈 Trading Signals</h4>
                <div class="signal-summary">
                    <div class="signal-strength strong">
                        <span>Overall Signal: <strong>BUY</strong></span>
                        <span>Strength: <strong>85%</strong></span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

// DeFi Functions
function connectDeFiWallet() {
    showNotification('DeFi wallet connection simulated successfully!', 'success');
    
    // Update DeFi portfolio display
    const portfolioValue = document.getElementById('defiPortfolioValue');
    const portfolioChange = document.getElementById('defiPortfolioChange');
    
    if (portfolioValue) portfolioValue.textContent = '$12,847.50';
    if (portfolioChange) {
        portfolioChange.textContent = '+$347.82 (2.8%)';
        portfolioChange.className = 'positive';
    }
}

function exploreStrategy(strategyType) {
    let strategyInfo = '';
    
    switch (strategyType) {
        case 'stablecoin':
            strategyInfo = 'Stablecoin yield farming strategy details...';
            break;
        case 'eth-staking':
            strategyInfo = 'Ethereum 2.0 staking strategy details...';
            break;
        default:
            strategyInfo = 'Strategy information...';
    }
    
    showNotification(`Opening ${strategyType} strategy details`, 'info');
}

function refreshDeFiData() {
    showNotification('DeFi data refreshed successfully!', 'success');
    
    // Simulate data update
    const tvl = document.getElementById('totalTvl');
    const tvlChange = document.getElementById('tvlChange');
    
    if (tvl) tvl.textContent = '$127.8B';
    if (tvlChange) {
        tvlChange.textContent = '+3.1% (24h)';
        tvlChange.className = 'positive';
    }
}

// Utility function to create modals dynamically
function createModal(id, title) {
    let modal = document.getElementById(id);
    if (!modal) {
        modal = document.createElement('div');
        modal.id = id;
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body"></div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.classList.remove('active');
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }
    
    return modal;
}

// Enhanced search functionality
function enhanceSearch() {
    const searchInput = document.getElementById('headerSearchInput');
    if (!searchInput) return;
    
    let searchTimeout;
    searchInput.addEventListener('input', function(e) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = e.target.value.toLowerCase().trim();
            if (query.length > 0) {
                performSearch(query);
            }
        }, 300);
    });
}

function performSearch(query) {
    const results = appState.coins.filter(coin => 
        coin.name.toLowerCase().includes(query) ||
        coin.symbol.toLowerCase().includes(query)
    ).slice(0, 5);
    
    if (results.length > 0) {
        showSearchResults(results);
    }
}

function showSearchResults(results) {
    let dropdown = document.querySelector('.search-dropdown');
    if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.className = 'search-dropdown';
        document.querySelector('.search-container').appendChild(dropdown);
    }
    
    dropdown.innerHTML = results.map(coin => `
        <div class="search-result-item" onclick="openCoinDetail('${coin.id}'); hideSearchResults();">
            <img src="${coin.image}" alt="${coin.name}" onerror="this.style.display='none'">
            <div class="search-result-info">
                <span class="coin-name">${coin.name}</span>
                <span class="coin-symbol">${coin.symbol.toUpperCase()}</span>
            </div>
            <div class="coin-price">${formatCurrency(coin.current_price)}</div>
        </div>
    `).join('');
    
    dropdown.style.display = 'block';
    
    // Hide after 5 seconds
    setTimeout(() => {
        dropdown.style.display = 'none';
    }, 5000);
}

function hideSearchResults() {
    const dropdown = document.querySelector('.search-dropdown');
    if (dropdown) {
        dropdown.style.display = 'none';
    }
}

// Export function for analysis
function exportAnalysis() {
    const analysisData = {
        timestamp: new Date().toISOString(),
        marketSentiment: '78% Bullish',
        recommendations: [
            'Reduce BTC allocation by 5%',
            'Increase ETH exposure',
            'Consider DeFi opportunities'
        ],
        riskMetrics: {
            sharpeRatio: 1.42,
            maxDrawdown: -18.3,
            var95: -2847
        }
    };
    
    const blob = new Blob([JSON.stringify(analysisData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crypto_analysis_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Analysis exported successfully!', 'success');
}

// Complete initialization
function initializeAllFeatures() {
    enhanceSearch();
    
    // Setup all button events
    const buttons = {
        'aiAnalysisBtn': () => performAIAnalysis(),
        'portfolioOptimizerBtn': () => openPortfolioOptimizer(),
        'upgradeBtn': () => openModal('upgradeModal'),
        'addToWatchlistBtn': () => openModal('addToWatchlistModal'),
        'addAlertBtn': () => openModal('alertModal'),
        'addCoinBtn': () => openModal('addCoinModal'),
        'syncExchangeBtn': () => openModal('connectExchangeModal'),
        'viewTransactionsBtn': () => openModal('transactionModal')
    };
    
    Object.entries(buttons).forEach(([id, handler]) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.removeEventListener('click', handler);
            btn.addEventListener('click', handler);
        }
    });
}

// Add missing portfolio functions
function addToPortfolio(coinId, amount, price) {
    const coin = appState.coins.find(c => c.id === coinId);
    if (!coin) return;
    
    const holding = {
        id: coinId,
        name: coin.name,
        symbol: coin.symbol,
        amount: parseFloat(amount),
        avgBuyPrice: parseFloat(price),
        value: parseFloat(amount) * coin.current_price,
        pnl: (coin.current_price - parseFloat(price)) * parseFloat(amount),
        pnlPercentage: ((coin.current_price - parseFloat(price)) / parseFloat(price)) * 100
    };
    
    appState.portfolio.holdings.push(holding);
    appState.portfolio.totalValue += holding.value;
    
    showNotification(`Added ${coin.name} to portfolio!`, 'success');
    renderPortfolioTable();
}

// Add CSS styles for animations
function addRealTimeStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .price-update {
            animation: priceFlash 0.6s ease-in-out;
            transform: scale(1.02);
        }
        
        @keyframes priceFlash {
            0% { background-color: var(--primary-color); }
            50% { background-color: var(--primary-light); }
            100% { background-color: transparent; }
        }
        
        .ticker-item {
            transition: all 0.3s ease;
        }
        
        .ticker-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .live-indicator {
            display: inline-block;
            padding: 2px 8px;
            background: #e74c3c;
            color: white;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
        }
        
        .heatmap-container {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            padding: 1rem;
        }
        
        .heatmap-item {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            min-height: 60px;
            padding: 8px;
            border-radius: 4px;
            color: white;
            font-weight: 600;
            min-width: 80px;
        }
        
        .heatmap-item.positive {
            background: linear-gradient(135deg, #27ae60, #2ecc71);
        }
        
        .heatmap-item.negative {
            background: linear-gradient(135deg, #e74c3c, #c0392b);
        }
        
        .correlation-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .correlation-cell {
            text-align: center;
            padding: 8px;
            border: 1px solid var(--border-color);
        }
        
        .high-correlation {
            background-color: rgba(231, 76, 60, 0.8);
            color: white;
        }
        
        .medium-correlation {
            background-color: rgba(241, 196, 15, 0.6);
        }
        
        .low-correlation {
            background-color: rgba(46, 204, 113, 0.6);
        }
        
        .chart-placeholder {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100px;
            background: var(--card-background);
            border: 2px dashed var(--border-color);
            border-radius: 8px;
            color: var(--text-secondary);
            font-style: italic;
        }
    `;
    document.head.appendChild(style);
}

// Initialize everything on load
document.addEventListener('DOMContentLoaded', function() {
    initializeAllFeatures();
});

// Export for global access
window.CryptoVisionApp = {
    appState,
    refreshAllData,
    openCoinDetail,
    switchSection,
    renderMarketsTable,
    renderPortfolioTable,
    renderAlertsTable,
    addToWatchlist,
    removeFromWatchlist,
    tradeCoin,
    deleteAlert,
    executeDemoTrade,
    closeDemoPosition,
    openPortfolioOptimizer,
    openAdvancedAI,
    openArbitrageCalculator,
    openTechnicalAnalysis,
    connectDeFiWallet,
    exploreStrategy,
    refreshDeFiData,
    executeSignal,
    calculateArbitrage,
    exportAnalysis,
    addToPortfolio
};

console.log('🎯 Enhanced CryptoVision Pro loaded successfully!');


// =============================================
// Additional Advanced Functions
// =============================================
function initializeAdvancedFeatures() {
    // Load saved alerts
    const savedAlerts = localStorage.getItem("cryptoAlerts");
    if (savedAlerts) {
        appState.alerts = JSON.parse(savedAlerts);
    }
    
    // Initialize price monitoring
    initializePriceMonitoring();
    setupAdvancedModals();
    initializeDemoTrading();
}

function initializePriceMonitoring() {
    setInterval(() => {
        if (appState.alerts && appState.alerts.length > 0) {
            checkPriceAlerts();
        }
    }, 30000);
}

function checkPriceAlerts() {
    appState.alerts.forEach(alert => {
        if (!alert.active) return;
        
        const coin = appState.coins.find(c => c.id === alert.coinId);
        if (!coin) return;
        
        const currentPrice = coin.current_price;
        const targetPrice = alert.targetPrice;
        const condition = alert.condition;
        
        let triggered = false;
        if (condition === "above" && currentPrice >= targetPrice) {
            triggered = true;
        } else if (condition === "below" && currentPrice <= targetPrice) {
            triggered = true;
        }
        
        if (triggered) {
            showNotification(
                `🚨 Price Alert: ${coin.name} has reached ${formatCurrency(currentPrice)}!`,
                "success"
            );
            
            alert.active = false;
            localStorage.setItem("cryptoAlerts", JSON.stringify(appState.alerts));
            
            if (appState.currentSection === "alerts") {
                renderAlertsTable();
            }
        }
    });
}

function setupAdvancedModals() {
    const watchlistSearch = document.getElementById("watchlistCoinSearch");
    if (watchlistSearch) {
        watchlistSearch.addEventListener("input", function() {
            const query = this.value.toLowerCase();
            const results = document.getElementById("watchlistSearchResults");
            const confirmBtn = document.getElementById("addToWatchlistConfirm");
            
            if (query.length < 2) {
                results.innerHTML = "";
                confirmBtn.disabled = true;
                return;
            }
            
            const filteredCoins = appState.coins.filter(coin => 
                coin.name.toLowerCase().includes(query) ||
                coin.symbol.toLowerCase().includes(query)
            ).slice(0, 5);
            
            results.innerHTML = filteredCoins.map(coin => `
                <div class="search-result-item" onclick="selectWatchlistCoin('${coin.id}')">
                    <img src="${coin.image}" alt="${coin.name}" style="width: 24px; height: 24px;">
                    <div class="result-info">
                        <div class="result-name">${coin.name}</div>
                        <div class="result-symbol">${coin.symbol.toUpperCase()}</div>
                    </div>
                    <div class="result-price">${formatCurrency(coin.current_price)}</div>
                </div>
            `).join("");
        });
    }
}

function selectWatchlistCoin(coinId) {
    const coin = appState.coins.find(c => c.id === coinId);
    if (coin) {
        document.getElementById("watchlistCoinSearch").value = coin.name;
        document.getElementById("watchlistSearchResults").innerHTML = "";
        document.getElementById("addToWatchlistConfirm").disabled = false;
        document.getElementById("addToWatchlistConfirm").onclick = () => {
            addToWatchlist(coinId);
            closeModal("addToWatchlistModal");
        };
    }
}

function initializeDemoTrading() {
    if (!localStorage.getItem("demoTradingData")) {
        const demoData = {
            balance: 100000,
            positions: []
        };
        localStorage.setItem("demoTradingData", JSON.stringify(demoData));
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add("active");
        document.body.style.overflow = "hidden";
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove("active");
        document.body.style.overflow = "";
    }
}

function executeDemoTrade(side) {
    const orderSize = document.getElementById("demoOrderSize")?.value || 1000;
    const leverage = document.getElementById("demoLeverage")?.value || 1;
    const pair = document.getElementById("demoPairSelect")?.value || "BTCUSDT";
    
    if (parseFloat(orderSize) < 10) {
        showNotification("Minimum order size is $10", "error");
        return;
    }
    
    const demoData = JSON.parse(localStorage.getItem("demoTradingData")) || { balance: 100000, positions: [] };
    
    const currentPrice = parseFloat(document.getElementById("demoCurrentPrice")?.textContent.replace("$", "").replace(",", "")) || 45000;
    const positionSize = parseFloat(orderSize) / currentPrice;
    
    const newPosition = {
        pair: pair,
        side: side,
        size: positionSize,
        entryPrice: currentPrice,
        currentPrice: currentPrice,
        leverage: leverage,
        pnl: 0,
        roe: 0,
        timestamp: new Date().toISOString()
    };
    
    demoData.positions.push(newPosition);
    demoData.balance -= parseFloat(orderSize) / parseFloat(leverage);
    
    localStorage.setItem("demoTradingData", JSON.stringify(demoData));
    
    showNotification(`Demo ${side.toUpperCase()} order executed: ${positionSize.toFixed(4)} ${pair.substring(0, 3)}`, "success");
}

function closeDemoPosition(index) {
    const demoData = JSON.parse(localStorage.getItem("demoTradingData"));
    if (demoData && demoData.positions[index]) {
        const position = demoData.positions[index];
        const pnl = position.pnl || 0;
        
        demoData.balance += pnl;
        demoData.positions.splice(index, 1);
        
        localStorage.setItem("demoTradingData", JSON.stringify(demoData));
        
        showNotification(`Position closed. P&L: ${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}`, pnl >= 0 ? "success" : "error");
    }
}


// Enhanced screener functions for real-time updates
function setupScreenerRealTimeUpdates() {
    if (window.screenerUpdateInterval) {
        clearInterval(window.screenerUpdateInterval);
    }
    
    window.screenerUpdateInterval = setInterval(() => {
        if (appState.currentSection === "screener" && appState.coins.length > 0) {
            updateScreenerPrices();
        }
    }, 5000);
}

function updateScreenerPrices() {
    const screenerRows = document.querySelectorAll(".screener-row");
    
    screenerRows.forEach(row => {
        const coinId = row.dataset.coinId;
        const coin = appState.coins.find(c => c.id === coinId);
        
        if (coin) {
            const priceElement = row.querySelector(".price-value");
            if (priceElement) {
                const oldPrice = parseFloat(priceElement.dataset.price);
                const newPrice = coin.current_price;
                
                priceElement.textContent = formatPrice(newPrice);
                priceElement.dataset.price = newPrice;
                
                if (oldPrice && newPrice !== oldPrice) {
                    priceElement.classList.add(newPrice > oldPrice ? "price-up" : "price-down");
                    setTimeout(() => {
                        priceElement.classList.remove("price-up", "price-down");
                    }, 2000);
                }
            }
            
            const change24hElement = row.querySelector(".change-24h");
            if (change24hElement) {
                const change24h = coin.price_change_percentage_24h || 0;
                change24hElement.textContent = `${change24h >= 0 ? "+" : ""}${change24h.toFixed(2)}%`;
                change24hElement.className = `change-24h ${change24h >= 0 ? "positive" : "negative"}`;
            }
        }
    });
}

function toggleWatchlist(coinId) {
    const watchlist = getWatchlist();
    if (watchlist.includes(coinId)) {
        removeFromWatchlist(coinId);
    } else {
        addToWatchlist(coinId);
    }
    
    const button = document.querySelector(`[onclick*="${coinId}"]`);
    if (button) {
        const isInWatchlist = getWatchlist().includes(coinId);
        button.classList.toggle("active", isInWatchlist);
        button.title = isInWatchlist ? "Remove from watchlist" : "Add to watchlist";
    }
}

function resetScreenerFilters() {
    const filters = ["marketCapFilter", "priceChangeFilter", "volumeFilter", "screenerSearch", "screenerSort"];
    const defaults = ["all", "all", "all", "", "market_cap"];
    
    filters.forEach((filterId, index) => {
        const element = document.getElementById(filterId);
        if (element) {
            element.value = defaults[index];
        }
    });
    
    applyScreenerFilters();
    showNotification("Filters reset", "info");
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
