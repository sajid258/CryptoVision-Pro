// =============================================
// CryptoVision Pro - Advanced Crypto Dashboard
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

// =============================================
// Global State Management
// =============================================
const appState = {
    currentSection: 'dashboard',
    darkMode: localStorage.getItem('darkMode') === 'true',
    user: {
        isLoggedIn: localStorage.getItem('isLoggedIn') === 'true',
        name: localStorage.getItem('userName') || 'Guest User',
        plan: localStorage.getItem('userPlan') || 'Free Plan',
        isPro: localStorage.getItem('isPro') === 'true'
    },
    portfolio: JSON.parse(localStorage.getItem('portfolio')) || [],
    watchlist: JSON.parse(localStorage.getItem('watchlist')) || [],
    alerts: JSON.parse(localStorage.getItem('alerts')) || [],
    transactions: JSON.parse(localStorage.getItem('transactions')) || [],
    coins: [],
    marketData: {},
    news: [],
    currentPage: 1,
    itemsPerPage: 50,
    sortBy: 'market_cap',
    sortOrder: 'desc'
};

// =============================================
// API Configuration
// =============================================
const API_CONFIG = {
    coingecko: {
        baseUrl: 'https://api.coingecko.com/api/v3',
        endpoints: {
            coins: '/coins/markets',
            global: '/global',
            trending: '/search/trending',
            coin: '/coins/',
            news: '/news'
        }
    },
    newsapi: {
        baseUrl: 'https://newsapi.org/v2',
        key: 'demo_key' // Replace with actual API key
    }
};

// =============================================
// Stripe Configuration
// =============================================
let stripe;
let cardElement;
let selectedPlan = null;

const STRIPE_CONFIG = {
    publishableKey: 'pk_test_51234567890abcdef', // Replace with your Stripe publishable key
    plans: {
        monthly: {
            priceId: 'price_monthly_123',
            price: 14.99,
            name: 'Monthly Plan'
        },
        yearly: {
            priceId: 'price_yearly_123',
            price: 119.88,
            name: 'Yearly Plan'
        }
    }
};

// =============================================
// App Initialization
// =============================================
function initApp() {
    setTheme();
    setupEventListeners();
    setupTouchOptimizations();
    fetchGlobalData();
    fetchAllCoins();
    fetchCryptoNews();
    renderPortfolio();
    renderWatchlist();
    renderAlerts();
    renderTransactions();
    setupPriceUpdates();
    checkProFeatures();
    updateUserInterface();
    initializeStripe();
    
    // Initialize advanced features
    renderAdvancedAnalytics();
    initializeTradingTerminal();
    initializeDemoTrading();
    
    // Initialize Web3 features
    addWeb3Section();
    createWeb3Section();
    
    // Enhanced real-time updates
    enhanceRealTimeUpdates();
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Initial mobile optimization
    handleResize();
    
    showNotification('🚀 Welcome to CryptoVision Pro - Now with Web3 & Real-time Features!', 'success');
}

// =============================================
// Theme Management
// =============================================
function setTheme() {
    const container = document.querySelector('.app-container');
    const themeIcon = document.querySelector('#themeToggle i');

    if (appState.darkMode) {
        container.setAttribute('data-theme', 'dark');
        themeIcon.className = 'fas fa-sun';
    } else {
        container.setAttribute('data-theme', 'light');
        themeIcon.className = 'fas fa-moon';
    }

    updateStripeTheme();
}

function updateStripeTheme() {
    if (cardElement) {
        const isDark = appState.darkMode;
        cardElement.update({
            style: {
                base: {
                    fontSize: '16px',
                    color: isDark ? '#ffffff' : '#2d3436',
                    backgroundColor: isDark ? '#334155' : '#dfe6e9',
                    '::placeholder': {
                        color: isDark ? '#d1d5db' : '#636e72',
                    },
                },
            },
        });
    }
}

// =============================================
// Event Listeners Setup
// =============================================
function setupEventListeners() {
    // Mobile navigation
    setupMobileNavigation();
    
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', () => {
        appState.darkMode = !appState.darkMode;
        localStorage.setItem('darkMode', appState.darkMode);
        setTheme();
    });

    // Navigation
    document.querySelectorAll('.nav-menu li').forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;
            if (section) {
                switchSection(section);
            }
        });
    });

    // Search functionality
    document.getElementById('searchBtn').addEventListener('click', performSearch);
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    // Modal controls
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    });

    // Portfolio management
    document.getElementById('addCoinBtn')?.addEventListener('click', () => openModal('addCoinModal'));
    document.getElementById('confirmAddCoin')?.addEventListener('click', addTransaction);
    
    // Watchlist management
    document.getElementById('addToWatchlistBtn')?.addEventListener('click', () => openModal('addCoinModal'));
    
    // Alerts management
    document.getElementById('addAlertBtn')?.addEventListener('click', () => openModal('alertModal'));
    document.getElementById('saveAlert')?.addEventListener('click', saveAlert);

    // Authentication
    document.getElementById('loginBtn')?.addEventListener('click', () => openModal('authModal'));
    document.getElementById('authSubmit')?.addEventListener('click', handleAuth);
    document.getElementById('authToggle')?.addEventListener('click', toggleAuthMode);

    // Upgrade functionality
    document.getElementById('upgradeBtn')?.addEventListener('click', () => openModal('upgradeModal'));
    document.querySelectorAll('[data-plan]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const plan = e.target.dataset.plan;
            selectPlan(plan);
        });
    });

    // Advanced analytics
    document.getElementById('aiInsightsBtn')?.addEventListener('click', openAIAnalysisModal);
    document.getElementById('riskAnalysisBtn')?.addEventListener('click', openRiskAnalysisModal);
    
    // Heatmap controls
    document.getElementById('heatmapMetric')?.addEventListener('change', (e) => {
        // Update heatmap based on selected metric
        renderMarketHeatmap(e.target.value);
    });
    
    // Trading terminal
    document.getElementById('fullscreenChart')?.addEventListener('click', toggleFullscreenChart);
    document.getElementById('cancelAllOrders')?.addEventListener('click', cancelAllOrders);
    
    // Advanced screener
    document.getElementById('marketFiltersBtn')?.addEventListener('click', openAdvancedScreener);

    // Market controls
    document.getElementById('refreshDataBtn')?.addEventListener('click', refreshData);
    document.querySelectorAll('.timeframe-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.timeframe-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            // Update charts based on timeframe
        });
    });

    // Pagination
    document.getElementById('prevPage')?.addEventListener('click', () => changePage(-1));
    document.getElementById('nextPage')?.addEventListener('click', () => changePage(1));
    document.getElementById('itemsPerPage')?.addEventListener('change', (e) => {
        appState.itemsPerPage = parseInt(e.target.value);
        renderMarketsTable();
    });

    // Market sorting
    document.getElementById('marketSort')?.addEventListener('change', (e) => {
        appState.sortBy = e.target.value;
        renderMarketsTable();
    });

    document.getElementById('marketOrder')?.addEventListener('change', (e) => {
        appState.sortOrder = e.target.value;
        renderMarketsTable();
    });

    // Transaction history
    document.getElementById('viewTransactionsBtn')?.addEventListener('click', () => openModal('transactionModal'));

    // Exchange connection
    document.getElementById('syncExchangeBtn')?.addEventListener('click', () => openModal('connectExchangeModal'));
    document.getElementById('connectExchange')?.addEventListener('click', connectExchange);
}

// =============================================
// API Functions
// =============================================
async function fetchGlobalData() {
    try {
        const response = await fetch(`${API_CONFIG.coingecko.baseUrl}${API_CONFIG.coingecko.endpoints.global}`);
        const data = await response.json();
        
        updateGlobalStats(data.data);
    } catch (error) {
        console.error('Error fetching global data:', error);
        // Use mock data for demo
        updateGlobalStats({
            total_market_cap: { usd: 1230000000000 },
            total_volume: { usd: 45670000000 },
            market_cap_percentage: { btc: 48.5 }
        });
    }
}

async function fetchAllCoins() {
    try {
        showLoadingOverlay(true);
        const response = await fetch(
            `${API_CONFIG.coingecko.baseUrl}${API_CONFIG.coingecko.endpoints.coins}?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=1h,24h,7d`
        );
        const data = await response.json();
        
        appState.coins = data;
        renderMarketsTable();
        renderDashboardData();
        populateCoinSelects();
        updateMarketTicker();
    } catch (error) {
        console.error('Error fetching coins:', error);
        // Use mock data for demo
        generateMockData();
    } finally {
        showLoadingOverlay(false);
    }
}

async function fetchCryptoNews() {
    try {
        // Try to fetch real news from CoinGecko or use enhanced mock data
        let newsData = [];
        
        try {
            const response = await fetch(`${API_CONFIG.coingecko.baseUrl}/news`);
            if (response.ok) {
                const data = await response.json();
                newsData = data.data?.slice(0, 20) || [];
            }
        } catch (apiError) {
            console.log('Using enhanced mock news data');
        }
        
        // Enhanced mock news data with Web3 focus
        const mockNews = [
            {
                title: "Bitcoin Layer 2 Solutions Gain Momentum",
                description: "Lightning Network sees record adoption as Bitcoin scales for everyday transactions.",
                urlToImage: "https://via.placeholder.com/400x200?text=Bitcoin+L2",
                publishedAt: new Date(Date.now() - 1800000).toISOString(),
                source: { name: "Bitcoin Magazine" },
                category: "Layer 2"
            },
            {
                title: "Ethereum Dencun Upgrade Reduces Gas Fees",
                description: "Latest Ethereum upgrade significantly lowers transaction costs for L2 solutions.",
                urlToImage: "https://via.placeholder.com/400x200?text=Ethereum+Upgrade",
                publishedAt: new Date(Date.now() - 3600000).toISOString(),
                source: { name: "Ethereum Foundation" },
                category: "Upgrades"
            },
            {
                title: "Web3 Gaming Market Hits $15 Billion",
                description: "Play-to-earn games and NFT integration drive massive growth in blockchain gaming.",
                urlToImage: "https://via.placeholder.com/400x200?text=Web3+Gaming",
                publishedAt: new Date(Date.now() - 7200000).toISOString(),
                source: { name: "GameFi Weekly" },
                category: "Gaming"
            },
            {
                title: "Major Banks Launch Digital Asset Custody",
                description: "Traditional finance institutions embrace crypto with institutional custody solutions.",
                urlToImage: "https://via.placeholder.com/400x200?text=Bank+Custody",
                publishedAt: new Date(Date.now() - 10800000).toISOString(),
                source: { name: "Financial Times" },
                category: "Institutional"
            },
            {
                title: "Solana Mobile Web3 Phone Sells Out",
                description: "Crypto-native smartphone with built-in wallet sees massive demand from Web3 users.",
                urlToImage: "https://via.placeholder.com/400x200?text=Solana+Phone",
                publishedAt: new Date(Date.now() - 14400000).toISOString(),
                source: { name: "Solana Labs" },
                category: "Hardware"
            },
            {
                title: "Real World Assets (RWA) Tokenization Grows",
                description: "Traditional assets like real estate and bonds move onto blockchain platforms.",
                urlToImage: "https://via.placeholder.com/400x200?text=RWA+Tokens",
                publishedAt: new Date(Date.now() - 18000000).toISOString(),
                source: { name: "DeFi Pulse" },
                category: "RWA"
            }
        ];
        
        appState.news = newsData.length > 0 ? newsData : mockNews;
        renderNews();
    } catch (error) {
        console.error('Error fetching news:', error);
    }
}

// =============================================
// Mock Data Generation
// =============================================
function generateMockData() {
    const mockCoins = [
        {
            id: 'bitcoin',
            name: 'Bitcoin',
            symbol: 'btc',
            image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
            current_price: 45000,
            market_cap_rank: 1,
            market_cap: 850000000000,
            total_volume: 25000000000,
            price_change_percentage_24h: 2.5,
            price_change_percentage_7d_in_currency: 8.2
        },
        {
            id: 'ethereum',
            name: 'Ethereum',
            symbol: 'eth',
            image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
            current_price: 3200,
            market_cap_rank: 2,
            market_cap: 380000000000,
            total_volume: 15000000000,
            price_change_percentage_24h: 4.1,
            price_change_percentage_7d_in_currency: 12.5
        },
        {
            id: 'binancecoin',
            name: 'BNB',
            symbol: 'bnb',
            image: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
            current_price: 420,
            market_cap_rank: 3,
            market_cap: 65000000000,
            total_volume: 2000000000,
            price_change_percentage_24h: -1.2,
            price_change_percentage_7d_in_currency: 5.8
        }
    ];
    
    appState.coins = mockCoins;
    renderMarketsTable();
    renderDashboardData();
    populateCoinSelects();
    updateMarketTicker();
}

// =============================================
// UI Rendering Functions
// =============================================
function updateGlobalStats(data) {
    document.getElementById('globalMarketCap').textContent = formatCurrency(data.total_market_cap?.usd || 1230000000000);
    document.getElementById('globalVolume').textContent = formatCurrency(data.total_volume?.usd || 45670000000);
    document.getElementById('btcDominance').textContent = `${(data.market_cap_percentage?.btc || 48.5).toFixed(1)}%`;
}

function updateMarketTicker() {
    const ticker = document.getElementById('marketTicker');
    const topCoins = appState.coins.slice(0, 10);
    
    ticker.innerHTML = topCoins.map(coin => `
        <div class="ticker-item">
            <img src="${coin.image}" alt="${coin.name}">
            <span class="ticker-symbol">${coin.symbol.toUpperCase()}</span>
            <span class="ticker-price">${formatCurrency(coin.current_price)}</span>
            <span class="ticker-change ${coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}">
                ${coin.price_change_percentage_24h >= 0 ? '+' : ''}${coin.price_change_percentage_24h?.toFixed(1) || 0}%
            </span>
        </div>
    `).join('');
}

function renderMarketsTable() {
    const tbody = document.getElementById('marketsTableBody');
    if (!tbody) return;
    
    const startIndex = (appState.currentPage - 1) * appState.itemsPerPage;
    const endIndex = startIndex + appState.itemsPerPage;
    const paginatedCoins = appState.coins.slice(startIndex, endIndex);
    
    tbody.innerHTML = paginatedCoins.map(coin => `
        <tr onclick="openCoinDetail('${coin.id}')">
            <td>${coin.market_cap_rank || 'N/A'}</td>
            <td>
                <div class="coin-info">
                    <img src="${coin.image}" alt="${coin.name}">
                    <div class="coin-details">
                        <div class="coin-name">${coin.name}</div>
                        <div class="coin-symbol">${coin.symbol.toUpperCase()}</div>
                    </div>
                </div>
            </td>
            <td>${formatCurrency(coin.current_price)}</td>
            <td class="${coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}">
                ${coin.price_change_percentage_24h >= 0 ? '+' : ''}${coin.price_change_percentage_24h?.toFixed(2) || 0}%
            </td>
            <td class="${coin.price_change_percentage_7d_in_currency >= 0 ? 'positive' : 'negative'}">
                ${coin.price_change_percentage_7d_in_currency >= 0 ? '+' : ''}${coin.price_change_percentage_7d_in_currency?.toFixed(2) || 0}%
            </td>
            <td>${formatCurrency(coin.market_cap)}</td>
            <td>${formatCurrency(coin.total_volume)}</td>
            <td>
                <canvas width="100" height="30" id="chart-${coin.id}"></canvas>
            </td>
        </tr>
    `).join('');
    
    updatePagination();
}

function renderDashboardData() {
    renderTopGainers();
    renderTopLosers();
    renderTrendingCoins();
    updatePortfolioSummary();
    updateFearGreedIndex();
}

function renderTopGainers() {
    const container = document.getElementById('topGainers');
    if (!container) return;
    
    const gainers = appState.coins
        .filter(coin => coin.price_change_percentage_24h > 0)
        .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)
        .slice(0, 5);
    
    container.innerHTML = gainers.map(coin => `
        <div class="coin-item" onclick="openCoinDetail('${coin.id}')">
            <div class="coin-info">
                <img src="${coin.image}" alt="${coin.name}">
                <div>
                    <div class="coin-name">${coin.name}</div>
                    <div class="coin-symbol">${coin.symbol.toUpperCase()}</div>
                </div>
            </div>
            <div class="price-info">
                <div class="price">${formatCurrency(coin.current_price)}</div>
                <div class="change positive">+${coin.price_change_percentage_24h.toFixed(2)}%</div>
            </div>
        </div>
    `).join('');
}

function renderTopLosers() {
    const container = document.getElementById('topLosers');
    if (!container) return;
    
    const losers = appState.coins
        .filter(coin => coin.price_change_percentage_24h < 0)
        .sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h)
        .slice(0, 5);
    
    container.innerHTML = losers.map(coin => `
        <div class="coin-item" onclick="openCoinDetail('${coin.id}')">
            <div class="coin-info">
                <img src="${coin.image}" alt="${coin.name}">
                <div>
                    <div class="coin-name">${coin.name}</div>
                    <div class="coin-symbol">${coin.symbol.toUpperCase()}</div>
                </div>
            </div>
            <div class="price-info">
                <div class="price">${formatCurrency(coin.current_price)}</div>
                <div class="change negative">${coin.price_change_percentage_24h.toFixed(2)}%</div>
            </div>
        </div>
    `).join('');
}

function renderTrendingCoins() {
    const container = document.getElementById('trendingCoins');
    if (!container) return;
    
    const trending = appState.coins
        .sort((a, b) => b.total_volume - a.total_volume)
        .slice(0, 5);
    
    container.innerHTML = trending.map(coin => `
        <div class="coin-item" onclick="openCoinDetail('${coin.id}')">
            <div class="coin-info">
                <img src="${coin.image}" alt="${coin.name}">
                <div>
                    <div class="coin-name">${coin.name}</div>
                    <div class="coin-symbol">${coin.symbol.toUpperCase()}</div>
                </div>
            </div>
            <div class="price-info">
                <div class="price">${formatCurrency(coin.current_price)}</div>
                <div class="volume">Vol: ${formatCurrency(coin.total_volume)}</div>
            </div>
        </div>
    `).join('');
}

function renderPortfolio() {
    const tbody = document.getElementById('portfolioTableBody');
    if (!tbody) return;
    
    if (appState.portfolio.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    No holdings found. <a href="#" onclick="openModal('addCoinModal')" style="color: var(--primary-color);">Add your first transaction</a>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = appState.portfolio.map(holding => {
        const coin = appState.coins.find(c => c.id === holding.coinId);
        if (!coin) return '';
        
        const currentValue = holding.amount * coin.current_price;
        const totalCost = holding.amount * holding.avgBuyPrice;
        const profitLoss = currentValue - totalCost;
        const profitLossPercent = ((profitLoss / totalCost) * 100);
        
        return `
            <tr>
                <td>
                    <div class="coin-info">
                        <img src="${coin.image}" alt="${coin.name}">
                        <div>
                            <div class="coin-name">${coin.name}</div>
                            <div class="coin-symbol">${coin.symbol.toUpperCase()}</div>
                        </div>
                    </div>
                </td>
                <td>${holding.amount.toFixed(8)} ${coin.symbol.toUpperCase()}</td>
                <td>${formatCurrency(holding.avgBuyPrice)}</td>
                <td>${formatCurrency(coin.current_price)}</td>
                <td class="${profitLoss >= 0 ? 'positive' : 'negative'}">
                    ${formatCurrency(profitLoss)} (${profitLoss >= 0 ? '+' : ''}${profitLossPercent.toFixed(2)}%)
                </td>
                <td>${((currentValue / getTotalPortfolioValue()) * 100).toFixed(1)}%</td>
                <td>
                    <button class="action-btn" onclick="editHolding('${holding.coinId}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn" onclick="removeHolding('${holding.coinId}')" title="Remove">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderWatchlist() {
    const container = document.getElementById('watchlistGrid');
    if (!container) return;
    
    if (appState.watchlist.length === 0) {
        container.innerHTML = `
            <div class="card">
                <div class="card-body" style="text-align: center; padding: 2rem;">
                    <h3>Your Watchlist is Empty</h3>
                    <p style="color: var(--text-secondary); margin: 1rem 0;">Add coins to track their performance</p>
                    <button class="primary-btn" onclick="openModal('addCoinModal')">
                        <i class="fas fa-plus"></i> Add Coin
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = appState.watchlist.map(coinId => {
        const coin = appState.coins.find(c => c.id === coinId);
        if (!coin) return '';
        
        return `
            <div class="watchlist-item">
                <div class="coin-info">
                    <img src="${coin.image}" alt="${coin.name}">
                    <div>
                        <div class="coin-name">${coin.name}</div>
                        <div class="coin-symbol">${coin.symbol.toUpperCase()}</div>
                    </div>
                </div>
                <div class="price-info">
                    <div class="price">${formatCurrency(coin.current_price)}</div>
                    <div class="change ${coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}">
                        ${coin.price_change_percentage_24h >= 0 ? '+' : ''}${coin.price_change_percentage_24h?.toFixed(2) || 0}%
                    </div>
                </div>
                <div class="actions">
                    <button class="action-btn" onclick="removeFromWatchlist('${coinId}')" title="Remove">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function renderAlerts() {
    const tbody = document.getElementById('alertsTableBody');
    if (!tbody) return;
    
    if (appState.alerts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    No alerts set. <a href="#" onclick="openModal('alertModal')" style="color: var(--primary-color);">Create your first alert</a>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = appState.alerts.map((alert, index) => {
        const coin = appState.coins.find(c => c.id === alert.coinId);
        if (!coin) return '';
        
        const isTriggered = (alert.condition === 'above' && coin.current_price >= alert.targetPrice) ||
                           (alert.condition === 'below' && coin.current_price <= alert.targetPrice);
        
        return `
            <tr>
                <td>
                    <div class="coin-info">
                        <img src="${coin.image}" alt="${coin.name}">
                        <div>
                            <div class="coin-name">${coin.name}</div>
                            <div class="coin-symbol">${coin.symbol.toUpperCase()}</div>
                        </div>
                    </div>
                </td>
                <td>Price ${alert.condition}</td>
                <td>${formatCurrency(alert.targetPrice)}</td>
                <td>${formatCurrency(coin.current_price)}</td>
                <td>
                    <span class="status ${isTriggered ? 'triggered' : 'active'}">
                        ${isTriggered ? 'Triggered' : 'Active'}
                    </span>
                </td>
                <td>
                    <button class="action-btn" onclick="removeAlert(${index})" title="Remove">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderTransactions() {
    const tbody = document.getElementById('transactionsTableBody');
    if (!tbody) return;
    
    if (appState.transactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    No transactions found.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = appState.transactions.map((transaction, index) => {
        const coin = appState.coins.find(c => c.id === transaction.coinId);
        if (!coin) return '';
        
        return `
            <tr>
                <td>${new Date(transaction.date).toLocaleDateString()}</td>
                <td>
                    <span class="transaction-type ${transaction.type}">
                        ${transaction.type.toUpperCase()}
                    </span>
                </td>
                <td>
                    <div class="coin-info">
                        <img src="${coin.image}" alt="${coin.name}">
                        <span>${coin.name}</span>
                    </div>
                </td>
                <td>${transaction.amount.toFixed(8)}</td>
                <td>${formatCurrency(transaction.price)}</td>
                <td>${formatCurrency(transaction.amount * transaction.price)}</td>
                <td>
                    <button class="action-btn" onclick="removeTransaction(${index})" title="Remove">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderNews() {
    const container = document.getElementById('newsGrid');
    if (!container) return;
    
    container.innerHTML = appState.news.map(article => `
        <div class="news-item">
            <img src="${article.urlToImage}" alt="${article.title}" class="news-image">
            <div class="news-content">
                <h3 class="news-title">${article.title}</h3>
                <p class="news-summary">${article.description}</p>
                <div class="news-meta">
                    <span>${article.source.name}</span>
                    <span>${new Date(article.publishedAt).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// =============================================
// Navigation Functions
// =============================================
function switchSection(sectionId) {
    // Update active navigation
    document.querySelectorAll('.nav-menu li').forEach(item => {
        item.classList.remove('active');
    });
    
    document.querySelector(`[data-section="${sectionId}"]`)?.classList.add('active');
    
    // Show/hide sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.getElementById(sectionId)?.classList.add('active');
    
    appState.currentSection = sectionId;
    
    // Load section-specific data
    if (sectionId === 'news' && appState.news.length === 0) {
        fetchCryptoNews();
    }
}

// =============================================
// Modal Functions
// =============================================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        
        // Prevent background scrolling on mobile
        if (window.innerWidth <= 768) {
            document.body.style.overflow = 'hidden';
        }
        
        // Special handling for specific modals
        if (modalId === 'addCoinModal') {
            populateCoinSelects();
            document.getElementById('transactionDate').value = new Date().toISOString().slice(0, 16);
        }
        
        // Focus management for accessibility
        const firstInput = modal.querySelector('input, select, button');
        if (firstInput && window.innerWidth > 768) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    
    // Restore background scrolling
    document.body.style.overflow = '';
}

// =============================================
// Portfolio Management
// =============================================
function addTransaction() {
    const type = document.getElementById('transactionType').value;
    const coinId = document.getElementById('coinSelect').value;
    const amount = parseFloat(document.getElementById('coinAmount').value);
    const price = parseFloat(document.getElementById('buyPrice').value);
    const date = document.getElementById('transactionDate').value;
    
    if (!coinId || !amount || !price || amount <= 0 || price <= 0) {
        showNotification('Please fill all fields with valid values', 'error');
        return;
    }
    
    const transaction = {
        id: Date.now(),
        type,
        coinId,
        amount,
        price,
        date: date || new Date().toISOString(),
        timestamp: Date.now()
    };
    
    appState.transactions.push(transaction);
    updatePortfolioFromTransactions();
    saveToStorage('transactions', appState.transactions);
    saveToStorage('portfolio', appState.portfolio);
    
    renderPortfolio();
    renderTransactions();
    updatePortfolioSummary();
    
    closeModal();
    showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} transaction added successfully!`, 'success');
}

function updatePortfolioFromTransactions() {
    const holdings = {};
    
    appState.transactions.forEach(transaction => {
        if (!holdings[transaction.coinId]) {
            holdings[transaction.coinId] = {
                coinId: transaction.coinId,
                amount: 0,
                totalCost: 0
            };
        }
        
        if (transaction.type === 'buy') {
            holdings[transaction.coinId].amount += transaction.amount;
            holdings[transaction.coinId].totalCost += transaction.amount * transaction.price;
        } else if (transaction.type === 'sell') {
            holdings[transaction.coinId].amount -= transaction.amount;
            holdings[transaction.coinId].totalCost -= transaction.amount * transaction.price;
        }
    });
    
    appState.portfolio = Object.values(holdings)
        .filter(holding => holding.amount > 0)
        .map(holding => ({
            ...holding,
            avgBuyPrice: holding.totalCost / holding.amount
        }));
}

function getTotalPortfolioValue() {
    return appState.portfolio.reduce((total, holding) => {
        const coin = appState.coins.find(c => c.id === holding.coinId);
        return total + (coin ? holding.amount * coin.current_price : 0);
    }, 0);
}

function updatePortfolioSummary() {
    const totalValue = getTotalPortfolioValue();
    const totalCost = appState.portfolio.reduce((total, holding) => {
        return total + (holding.amount * holding.avgBuyPrice);
    }, 0);
    
    const profitLoss = totalValue - totalCost;
    const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;
    
    // Update dashboard portfolio summary
    const dashboardValue = document.getElementById('dashboardPortfolioValue');
    const dashboardChange = document.getElementById('dashboardPortfolioChange');
    const dashboardAssets = document.getElementById('dashboardAssetCount');
    
    if (dashboardValue) dashboardValue.textContent = formatCurrency(totalValue);
    if (dashboardChange) {
        dashboardChange.textContent = `${formatCurrency(profitLoss)} (${profitLoss >= 0 ? '+' : ''}${profitLossPercent.toFixed(2)}%)`;
        dashboardChange.className = profitLoss >= 0 ? 'positive' : 'negative';
    }
    if (dashboardAssets) dashboardAssets.textContent = appState.portfolio.length;
    
    // Update portfolio section summary
    const portfolioTotal = document.getElementById('portfolioTotal');
    const portfolioChange = document.getElementById('portfolioChange');
    
    if (portfolioTotal) portfolioTotal.textContent = formatCurrency(totalValue);
    if (portfolioChange) {
        portfolioChange.textContent = `${profitLoss >= 0 ? '+' : ''}${profitLossPercent.toFixed(2)}% (24h)`;
        portfolioChange.className = profitLoss >= 0 ? 'positive' : 'negative';
    }
}

// =============================================
// Watchlist Management
// =============================================
function addToWatchlist(coinId) {
    if (!appState.watchlist.includes(coinId)) {
        appState.watchlist.push(coinId);
        saveToStorage('watchlist', appState.watchlist);
        renderWatchlist();
        showNotification('Added to watchlist!', 'success');
    }
}

function removeFromWatchlist(coinId) {
    appState.watchlist = appState.watchlist.filter(id => id !== coinId);
    saveToStorage('watchlist', appState.watchlist);
    renderWatchlist();
    showNotification('Removed from watchlist', 'success');
}

// =============================================
// Alerts Management
// =============================================
function saveAlert() {
    const coinId = document.getElementById('alertCoinSelect').value;
    const condition = document.getElementById('alertCondition').value;
    const targetPrice = parseFloat(document.getElementById('alertPriceValue').value);
    const repeat = document.getElementById('alertRepeat').value;
    const notificationType = document.getElementById('alertNotificationType').value;
    
    if (!coinId || !targetPrice || targetPrice <= 0) {
        showNotification('Please fill all fields with valid values', 'error');
        return;
    }
    
    const alert = {
        id: Date.now(),
        coinId,
        condition,
        targetPrice,
        repeat: repeat === 'repeat',
        notificationType,
        created: new Date().toISOString(),
        triggered: false
    };
    
    appState.alerts.push(alert);
    saveToStorage('alerts', appState.alerts);
    renderAlerts();
    closeModal();
    showNotification('Price alert created!', 'success');
}

function removeAlert(index) {
    appState.alerts.splice(index, 1);
    saveToStorage('alerts', appState.alerts);
    renderAlerts();
    showNotification('Alert removed', 'success');
}

// =============================================
// Search and Filter Functions
// =============================================
function performSearch() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    if (!query) return;
    
    const filteredCoins = appState.coins.filter(coin => 
        coin.name.toLowerCase().includes(query) || 
        coin.symbol.toLowerCase().includes(query)
    );
    
    if (filteredCoins.length > 0) {
        // Show search results or navigate to coin detail
        if (filteredCoins.length === 1) {
            openCoinDetail(filteredCoins[0].id);
        } else {
            // Update markets table with filtered results
            const originalCoins = [...appState.coins];
            appState.coins = filteredCoins;
            renderMarketsTable();
            
            // Reset after 5 seconds
            setTimeout(() => {
                appState.coins = originalCoins;
                renderMarketsTable();
            }, 5000);
        }
    } else {
        showNotification('No coins found matching your search', 'warning');
    }
}

// =============================================
// Pagination Functions
// =============================================
function changePage(direction) {
    const totalPages = Math.ceil(appState.coins.length / appState.itemsPerPage);
    const newPage = appState.currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        appState.currentPage = newPage;
        renderMarketsTable();
    }
}

function updatePagination() {
    const totalPages = Math.ceil(appState.coins.length / appState.itemsPerPage);
    const currentPageSpan = document.getElementById('currentPage');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (currentPageSpan) {
        currentPageSpan.textContent = `${appState.currentPage} / ${totalPages}`;
    }
    
    if (prevBtn) {
        prevBtn.disabled = appState.currentPage === 1;
    }
    
    if (nextBtn) {
        nextBtn.disabled = appState.currentPage === totalPages;
    }
}

// =============================================
// Utility Functions
// =============================================
function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '$0.00';
    
    if (amount >= 1e12) {
        return `$${(amount / 1e12).toFixed(2)}T`;
    } else if (amount >= 1e9) {
        return `$${(amount / 1e9).toFixed(2)}B`;
    } else if (amount >= 1e6) {
        return `$${(amount / 1e6).toFixed(2)}M`;
    } else if (amount >= 1e3) {
        return `$${(amount / 1e3).toFixed(2)}K`;
    } else {
        return `$${amount.toFixed(2)}`;
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
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
}

function showLoadingOverlay(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

function saveToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function populateCoinSelects() {
    const selects = [
        document.getElementById('coinSelect'),
        document.getElementById('alertCoinSelect')
    ];
    
    const options = appState.coins.slice(0, 100).map(coin => 
        `<option value="${coin.id}">${coin.name} (${coin.symbol.toUpperCase()})</option>`
    ).join('');
    
    selects.forEach(select => {
        if (select) {
            select.innerHTML = '<option value="">Select a coin...</option>' + options;
        }
    });
}

// =============================================
// Authentication Functions
// =============================================
function handleAuth() {
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    const name = document.getElementById('authName').value;
    const isRegister = document.getElementById('authSubmit').textContent === 'Register';
    
    if (!email || !password) {
        showNotification('Please fill all required fields', 'error');
        return;
    }
    
    if (isRegister && !name) {
        showNotification('Please enter your full name', 'error');
        return;
    }
    
    // Simulate authentication
    appState.user.isLoggedIn = true;
    appState.user.name = name || email.split('@')[0];
    appState.user.plan = 'Free Plan';
    
    saveToStorage('isLoggedIn', 'true');
    saveToStorage('userName', appState.user.name);
    saveToStorage('userPlan', appState.user.plan);
    
    updateUserInterface();
    closeModal();
    showNotification(isRegister ? 'Account created successfully!' : 'Logged in successfully!', 'success');
}

function toggleAuthMode() {
    const title = document.getElementById('authModalTitle');
    const submit = document.getElementById('authSubmit');
    const toggle = document.getElementById('authToggle');
    const nameGroup = document.getElementById('authNameGroup');
    
    if (submit.textContent === 'Login') {
        title.textContent = 'Register for CryptoVision Pro';
        submit.textContent = 'Register';
        toggle.innerHTML = 'Already have an account? <a href="#">Login</a>';
        nameGroup.style.display = 'block';
    } else {
        title.textContent = 'Login to CryptoVision Pro';
        submit.textContent = 'Login';
        toggle.innerHTML = "Don't have an account? <a href=\"#\">Register</a>";
        nameGroup.style.display = 'none';
    }
}

function updateUserInterface() {
    const userName = document.getElementById('userName');
    const userPlan = document.getElementById('userPlan');
    const loginBtn = document.getElementById('loginBtn');
    
    if (userName) userName.textContent = appState.user.name;
    if (userPlan) userPlan.textContent = appState.user.plan;
    
    if (loginBtn) {
        if (appState.user.isLoggedIn) {
            loginBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i>';
            loginBtn.title = 'Logout';
            loginBtn.onclick = logout;
        } else {
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i>';
            loginBtn.title = 'Login';
            loginBtn.onclick = () => openModal('authModal');
        }
    }
}

function logout() {
    appState.user.isLoggedIn = false;
    appState.user.name = 'Guest User';
    appState.user.plan = 'Free Plan';
    appState.user.isPro = false;
    
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('userPlan');
    localStorage.removeItem('isPro');
    
    updateUserInterface();
    showNotification('Logged out successfully', 'success');
}

// =============================================
// Stripe Payment Processing
// =============================================
function initializeStripe() {
    if (typeof Stripe !== 'undefined') {
        stripe = Stripe(STRIPE_CONFIG.publishableKey);
        const elements = stripe.elements();
        
        cardElement = elements.create('card', {
            style: {
                base: {
                    fontSize: '16px',
                    color: '#2d3436',
                    backgroundColor: '#dfe6e9',
                    '::placeholder': {
                        color: '#636e72',
                    },
                },
            },
        });
        
        const cardElementDiv = document.getElementById('card-element');
        if (cardElementDiv) {
            cardElement.mount('#card-element');
        }
        
        const form = document.getElementById('payment-form');
        if (form) {
            form.addEventListener('submit', handlePayment);
        }
        
        // Plan selection handlers
        document.getElementById('backToPlanBtn')?.addEventListener('click', () => {
            document.getElementById('planSelection').style.display = 'block';
            document.getElementById('paymentForm').style.display = 'none';
        });
    }
}

function selectPlan(planType) {
    selectedPlan = {
        type: planType,
        ...STRIPE_CONFIG.plans[planType]
    };
    
    document.getElementById('selectedPlanTitle').textContent = selectedPlan.name;
    document.getElementById('selectedPlanPrice').textContent = `$${selectedPlan.price}${planType === 'monthly' ? '/month' : '/year'}`;
    
    document.getElementById('planSelection').style.display = 'none';
    document.getElementById('paymentForm').style.display = 'block';
}

async function handlePayment(event) {
    event.preventDefault();
    
    const submitButton = document.getElementById('submit-payment');
    const spinner = document.getElementById('spinner');
    const buttonText = document.getElementById('button-text');
    
    submitButton.disabled = true;
    spinner.style.display = 'block';
    buttonText.style.display = 'none';
    
    try {
        // Create payment method
        const {error, paymentMethod} = await stripe.createPaymentMethod({
            type: 'card',
            card: cardElement,
            billing_details: {
                email: document.getElementById('email').value,
            },
        });
        
        if (error) {
            showCardError(error);
            return;
        }
        
        // For demo purposes, simulate successful payment
        setTimeout(() => {
            completePayment();
        }, 2000);
        
    } catch (error) {
        console.error('Payment error:', error);
        showNotification('Payment failed. Please try again.', 'error');
    } finally {
        submitButton.disabled = false;
        spinner.style.display = 'none';
        buttonText.style.display = 'block';
    }
}

function showCardError(error) {
    const errorElement = document.getElementById('card-errors');
    errorElement.textContent = error.message;
}

function completePayment() {
    // Update user to Pro
    appState.user.isPro = true;
    appState.user.plan = 'Pro Plan';
    saveToStorage('isPro', 'true');
    saveToStorage('userPlan', appState.user.plan);
    
    // Show success
    document.getElementById('paymentForm').style.display = 'none';
    document.getElementById('paymentSuccess').style.display = 'block';
    
    updateUserInterface();
    trackPaymentSuccess(selectedPlan.type);
}

function trackPaymentSuccess(planType) {
    console.log(`Payment successful for ${planType} plan`);
    showNotification('🎉 Welcome to CryptoVision Pro! All features unlocked!', 'success');
    
    // Track analytics (Google Analytics, Mixpanel, etc.)
    if (typeof gtag !== 'undefined') {
        gtag('event', 'purchase', {
            transaction_id: Date.now().toString(),
            value: selectedPlan.price,
            currency: 'USD',
            items: [{
                item_id: `cryptovision_pro_${planType}`,
                item_name: `CryptoVision Pro ${planType.charAt(0).toUpperCase() + planType.slice(1)}`,
                category: 'Subscription',
                quantity: 1,
                price: selectedPlan.price
            }]
        });
    }
}

// =============================================
// Pro Features Management
// =============================================
function checkProFeatures() {
    const proElements = document.querySelectorAll('.pro-feature');
    const isPro = appState.user.isPro;
    
    proElements.forEach(element => {
        if (!isPro) {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                showNotification('This is a Pro feature. Please upgrade to access it.', 'warning');
                openModal('upgradeModal');
            });
        }
    });
    
    // Update upgrade buttons
    const upgradeButtons = document.querySelectorAll('[id$="UpgradeBtn"], .upgrade-btn');
    upgradeButtons.forEach(btn => {
        if (isPro) {
            btn.style.display = 'none';
        } else {
            btn.style.display = 'inline-flex';
            btn.addEventListener('click', () => openModal('upgradeModal'));
        }
    });
}

// =============================================
// Mobile Navigation
// =============================================
function setupMobileNavigation() {
    // Create mobile navigation elements
    const headerLeft = document.querySelector('.header-left');
    if (headerLeft && !document.querySelector('.mobile-nav-toggle')) {
        const mobileToggle = document.createElement('button');
        mobileToggle.className = 'mobile-nav-toggle';
        mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
        mobileToggle.setAttribute('aria-label', 'Toggle navigation');
        headerLeft.insertBefore(mobileToggle, headerLeft.firstChild);
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'mobile-overlay';
        document.body.appendChild(overlay);
        
        // Add event listeners
        mobileToggle.addEventListener('click', toggleMobileNav);
        overlay.addEventListener('click', closeMobileNav);
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeMobileNav();
            }
        });
        
        // Close when clicking nav items
        document.querySelectorAll('.nav-menu li').forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    closeMobileNav();
                }
            });
        });
    }
}

function toggleMobileNav() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.mobile-overlay');
    const toggle = document.querySelector('.mobile-nav-toggle');
    
    if (sidebar && overlay && toggle) {
        const isOpen = sidebar.classList.contains('mobile-open');
        
        if (isOpen) {
            closeMobileNav();
        } else {
            openMobileNav();
        }
    }
}

function openMobileNav() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.mobile-overlay');
    const toggle = document.querySelector('.mobile-nav-toggle');
    
    if (sidebar && overlay && toggle) {
        sidebar.classList.add('mobile-open');
        overlay.classList.add('active');
        toggle.innerHTML = '<i class="fas fa-times"></i>';
        document.body.style.overflow = 'hidden';
    }
}

function closeMobileNav() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.mobile-overlay');
    const toggle = document.querySelector('.mobile-nav-toggle');
    
    if (sidebar && overlay && toggle) {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('active');
        toggle.innerHTML = '<i class="fas fa-bars"></i>';
        document.body.style.overflow = '';
    }
}

// Handle window resize
function handleResize() {
    if (window.innerWidth > 768) {
        closeMobileNav();
    }
    
    // Optimize table rendering for mobile
    optimizeTablesForMobile();
}

function optimizeTablesForMobile() {
    const tables = document.querySelectorAll('.markets-table, .portfolio-table, .alerts-table');
    
    tables.forEach(table => {
        if (window.innerWidth <= 768) {
            table.classList.add('mobile-optimized');
        } else {
            table.classList.remove('mobile-optimized');
        }
    });
}

// Touch event optimizations
function setupTouchOptimizations() {
    // Prevent double-tap zoom on buttons
    const buttons = document.querySelectorAll('button, .action-btn, .primary-btn');
    buttons.forEach(button => {
        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            button.click();
        });
    });
    
    // Improve scroll performance on iOS
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        document.body.style.webkitOverflowScrolling = 'touch';
    }
}

// =============================================
// Advanced Analytics Features
// =============================================
function renderAdvancedAnalytics() {
    renderFearGreedGauge();
    renderSocialSentiment();
    renderMarketHeatmap();
    renderCorrelationMatrix();
    renderAIInsights();
    renderRiskMetrics();
    renderMarketDominanceChart();
}

function renderMarketDominanceChart() {
    const canvas = document.getElementById('dominanceChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Market dominance data
    const dominanceData = {
        labels: ['Bitcoin', 'Ethereum', 'BNB', 'XRP', 'Solana', 'Others'],
        datasets: [{
            data: [48.5, 18.2, 4.1, 3.8, 2.9, 22.5],
            backgroundColor: [
                '#f7931a', // Bitcoin orange
                '#627eea', // Ethereum blue
                '#f3ba2f', // BNB yellow
                '#23292f', // XRP dark
                '#9945ff', // Solana purple
                '#6c5ce7'  // Others
            ],
            borderWidth: 2,
            borderColor: '#ffffff'
        }]
    };
    
    new Chart(ctx, {
        type: 'doughnut',
        data: dominanceData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.parsed + '%';
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true
            }
        }
    });
}

function renderSocialSentiment() {
    const container = document.getElementById('socialSentiment');
    if (!container) return;
    
    // Mock social sentiment data
    const sentimentData = {
        twitter: { score: 82, label: 'Positive' },
        reddit: { score: 75, label: 'Positive' },
        news: { score: 67, label: 'Neutral' }
    };
    
    const trendingTopics = ['#BitcoinETF', '#Ethereum2.0', '#DeFiSummer', '#AICoins', '#Web3Gaming'];
    
    // Update sentiment meters
    Object.keys(sentimentData).forEach(source => {
        const item = container.querySelector(`.sentiment-item .source-info i.fab.fa-${source === 'news' ? 'newspaper' : source}`);
        if (item) {
            const meterFill = item.closest('.sentiment-item').querySelector('.meter-fill');
            const scoreSpan = item.closest('.sentiment-item').querySelector('.sentiment-meter span:last-child');
            if (meterFill && scoreSpan) {
                meterFill.style.width = `${sentimentData[source].score}%`;
                scoreSpan.textContent = `${sentimentData[source].score}% ${sentimentData[source].label}`;
            }
        }
    });
    
    // Update trending topics
    const topicsContainer = container.querySelector('.topic-tags');
    if (topicsContainer) {
        topicsContainer.innerHTML = trendingTopics.map(topic => 
            `<span class="topic-tag ${Math.random() > 0.5 ? 'hot' : ''}">${topic}</span>`
        ).join('');
    }
    
    console.log('Social sentiment data updated');
}

function renderFearGreedGauge() {
    const canvas = document.getElementById('fearGreedGauge');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height - 10;
    const radius = 80;
    const value = 72; // Mock value
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw gauge background
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, 0);
    ctx.lineWidth = 20;
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-color');
    ctx.stroke();
    
    // Draw gauge fill
    const angle = Math.PI * (value / 100);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, Math.PI + angle);
    ctx.lineWidth = 20;
    ctx.strokeStyle = value > 50 ? '#00b894' : '#e84393';
    ctx.stroke();
    
    // Draw pointer
    const pointerAngle = Math.PI + angle;
    const pointerX = centerX + Math.cos(pointerAngle) * (radius - 10);
    const pointerY = centerY + Math.sin(pointerAngle) * (radius - 10);
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(pointerX, pointerY);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#6c5ce7';
    ctx.stroke();
}

function renderMarketHeatmap() {
    const container = document.getElementById('marketHeatmap');
    if (!container) return;
    
    const topCoins = appState.coins.slice(0, 20);
    
    container.innerHTML = topCoins.map(coin => {
        const change = coin.price_change_percentage_24h || 0;
        const intensity = Math.abs(change) / 10; // Normalize to 0-1
        const color = change >= 0 ? 
            `rgba(0, 184, 148, ${Math.min(intensity, 1)})` : 
            `rgba(232, 67, 147, ${Math.min(intensity, 1)})`;
        
        return `
            <div class="heatmap-item" style="background-color: ${color}; color: white;" onclick="openCoinDetail('${coin.id}')">
                <div class="heatmap-symbol">${coin.symbol.toUpperCase()}</div>
                <div class="heatmap-change">${change >= 0 ? '+' : ''}${change.toFixed(1)}%</div>
            </div>
        `;
    }).join('');
}

function renderCorrelationMatrix() {
    const container = document.getElementById('correlationMatrix');
    if (!container) return;
    
    const topCoins = appState.coins.slice(0, 5);
    const correlations = generateMockCorrelations(topCoins);
    
    let matrixHTML = '<div class="correlation-matrix" style="grid-template-columns: 100px repeat(' + topCoins.length + ', 1fr);">';
    
    // Header row
    matrixHTML += '<div class="correlation-cell correlation-header"></div>';
    topCoins.forEach(coin => {
        matrixHTML += `<div class="correlation-cell correlation-header">${coin.symbol.toUpperCase()}</div>`;
    });
    
    // Data rows
    topCoins.forEach((coin, i) => {
        matrixHTML += `<div class="correlation-cell correlation-header">${coin.symbol.toUpperCase()}</div>`;
        correlations[i].forEach(corr => {
            const intensity = Math.abs(corr);
            const color = corr >= 0 ? 
                `rgba(0, 184, 148, ${intensity})` : 
                `rgba(232, 67, 147, ${intensity})`;
            matrixHTML += `<div class="correlation-cell" style="background-color: ${color}; color: ${intensity > 0.5 ? 'white' : 'inherit'}">${corr.toFixed(2)}</div>`;
        });
    });
    
    matrixHTML += '</div>';
    container.innerHTML = matrixHTML;
}

function generateMockCorrelations(coins) {
    return coins.map(() => 
        coins.map(() => (Math.random() * 2 - 1)) // Random correlation between -1 and 1
    );
}

function renderAIInsights() {
    // AI insights are already rendered in HTML, but we can update them dynamically
    const insights = [
        {
            icon: 'chart-line',
            title: 'Market Prediction',
            content: 'AI models suggest a 73% probability of Bitcoin reaching $52,000 within 30 days based on current trends.',
            confidence: 87
        },
        {
            icon: 'balance-scale',
            title: 'Portfolio Optimization',
            content: 'Consider rebalancing: Reduce BTC allocation by 5% and increase ETH to optimize risk-adjusted returns.',
            confidence: 92
        },
        {
            icon: 'exclamation-triangle',
            title: 'Risk Alert',
            content: 'High correlation detected between your top 3 holdings. Consider diversification across different sectors.',
            confidence: 95
        }
    ];
    
    // Update insights dynamically based on real portfolio data
    updateAIInsightsWithPortfolioData(insights);
}

function updateAIInsightsWithPortfolioData(insights) {
    if (appState.portfolio.length === 0) return;
    
    const totalValue = getTotalPortfolioValue();
    const btcHolding = appState.portfolio.find(h => h.coinId === 'bitcoin');
    
    if (btcHolding && totalValue > 0) {
        const btcAllocation = (btcHolding.amount * (appState.coins.find(c => c.id === 'bitcoin')?.current_price || 0)) / totalValue;
        
        if (btcAllocation > 0.6) {
            insights[1].content = `Your Bitcoin allocation (${(btcAllocation * 100).toFixed(1)}%) is above optimal range. Consider reducing to 45-50% and diversifying into other assets.`;
            insights[1].confidence = 95;
        }
    }
}

function renderRiskMetrics() {
    const canvas = document.getElementById('riskChart');
    if (!canvas) return;
    
    // Mock risk chart data
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(232, 67, 147, 0.3)');
    gradient.addColorStop(1, 'rgba(232, 67, 147, 0.05)');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Portfolio Risk',
                data: [5.2, 6.1, 5.8, 6.4, 6.2, 6.0],
                borderColor: '#e84393',
                backgroundColor: gradient,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    display: false
                },
                y: {
                    display: false
                }
            }
        }
    });
}

// =============================================
// Advanced Trading Terminal
// =============================================
function initializeTradingTerminal() {
    renderTradingChart();
    renderOrderBook();
    renderRecentTrades();
    setupTradingEventListeners();
}

function renderTradingChart() {
    const canvas = document.getElementById('tradingChartCanvas');
    if (!canvas) return;
    
    // Mock candlestick data
    const data = generateMockCandlestickData();
    
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'candlestick',
        data: {
            datasets: [{
                label: 'BTC/USDT',
                data: data,
                borderColor: '#6c5ce7',
                backgroundColor: 'rgba(108, 92, 231, 0.1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'hour'
                    }
                },
                y: {
                    position: 'right'
                }
            }
        }
    });
}

function generateMockCandlestickData() {
    const data = [];
    let price = 45000;
    const now = new Date();
    
    for (let i = 0; i < 100; i++) {
        const timestamp = new Date(now.getTime() - (99 - i) * 60000); // 1 minute intervals
        const open = price;
        const volatility = 0.02;
        const change = (Math.random() - 0.5) * volatility;
        const high = open * (1 + Math.abs(change) + Math.random() * 0.01);
        const low = open * (1 - Math.abs(change) - Math.random() * 0.01);
        const close = open * (1 + change);
        
        data.push({
            x: timestamp,
            o: open,
            h: high,
            l: low,
            c: close
        });
        
        price = close;
    }
    
    return data;
}

function renderOrderBook() {
    const askOrders = document.getElementById('askOrders');
    const bidOrders = document.getElementById('bidOrders');
    
    if (!askOrders || !bidOrders) return;
    
    const currentPrice = 45234.67;
    const spread = 0.02;
    
    // Generate mock asks (sell orders)
    let askPrice = currentPrice + spread;
    let asksHTML = '';
    for (let i = 0; i < 10; i++) {
        const amount = (Math.random() * 2 + 0.1).toFixed(6);
        const total = (askPrice * parseFloat(amount)).toFixed(2);
        asksHTML += `
            <div class="order-row">
                <span>${askPrice.toFixed(2)}</span>
                <span>${amount}</span>
                <span>${total}</span>
            </div>
        `;
        askPrice += Math.random() * 5 + 1;
    }
    askOrders.innerHTML = asksHTML;
    
    // Generate mock bids (buy orders)
    let bidPrice = currentPrice - spread;
    let bidsHTML = '';
    for (let i = 0; i < 10; i++) {
        const amount = (Math.random() * 2 + 0.1).toFixed(6);
        const total = (bidPrice * parseFloat(amount)).toFixed(2);
        bidsHTML += `
            <div class="order-row">
                <span>${bidPrice.toFixed(2)}</span>
                <span>${amount}</span>
                <span>${total}</span>
            </div>
        `;
        bidPrice -= Math.random() * 5 + 1;
    }
    bidOrders.innerHTML = bidsHTML;
}

function renderRecentTrades() {
    const container = document.getElementById('recentTradesList');
    if (!container) return;
    
    const trades = [];
    let price = 45234.67;
    const now = new Date();
    
    for (let i = 0; i < 20; i++) {
        const change = (Math.random() - 0.5) * 0.01;
        price *= (1 + change);
        const amount = (Math.random() * 0.5 + 0.01).toFixed(6);
        const time = new Date(now.getTime() - i * 5000);
        
        trades.push({
            price: price.toFixed(2),
            amount: amount,
            time: time.toLocaleTimeString().slice(0, 5),
            side: change > 0 ? 'buy' : 'sell'
        });
    }
    
    container.innerHTML = trades.map(trade => `
        <div class="trade-row ${trade.side}">
            <span style="color: ${trade.side === 'buy' ? 'var(--positive-color)' : 'var(--negative-color)'}">${trade.price}</span>
            <span>${trade.amount}</span>
            <span>${trade.time}</span>
        </div>
    `).join('');
}

function setupTradingEventListeners() {
    // Trading form calculations
    const priceInput = document.getElementById('tradePrice');
    const amountInput = document.getElementById('tradeAmount');
    const totalInput = document.getElementById('tradeTotal');
    
    if (priceInput && amountInput && totalInput) {
        [priceInput, amountInput].forEach(input => {
            input.addEventListener('input', () => {
                const price = parseFloat(priceInput.value) || 0;
                const amount = parseFloat(amountInput.value) || 0;
                totalInput.value = (price * amount).toFixed(2);
            });
        });
    }
    
    // Percentage buttons
    document.querySelectorAll('.pct-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const percentage = parseInt(btn.dataset.pct);
            const availableBalance = 12345.67; // Mock balance
            const currentPrice = parseFloat(document.getElementById('tradePrice').value) || 45234.67;
            const maxAmount = (availableBalance * percentage / 100) / currentPrice;
            
            document.getElementById('tradeAmount').value = maxAmount.toFixed(8);
            document.getElementById('tradeTotal').value = (maxAmount * currentPrice).toFixed(2);
        });
    });
    
    // Order type selection
    document.querySelectorAll('.order-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.order-type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const priceInput = document.getElementById('tradePrice');
            if (btn.dataset.type === 'market') {
                priceInput.disabled = true;
                priceInput.value = document.getElementById('tradingPrice').textContent.replace('$', '').replace(',', '');
            } else {
                priceInput.disabled = false;
            }
        });
    });
    
    // Trade execution
    document.querySelectorAll('.trade-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const side = btn.classList.contains('buy-btn') ? 'buy' : 'sell';
            const price = document.getElementById('tradePrice').value;
            const amount = document.getElementById('tradeAmount').value;
            
            if (!price || !amount) {
                showNotification('Please enter price and amount', 'error');
                return;
            }
            
            // Mock order placement
            showNotification(`${side.toUpperCase()} order placed successfully!`, 'success');
            
            // Add to open orders (mock)
            addMockOpenOrder(side, price, amount);
        });
    });
}

function addMockOpenOrder(side, price, amount) {
    const tbody = document.getElementById('openOrdersBody');
    if (!tbody) return;
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${new Date().toLocaleTimeString()}</td>
        <td>BTC/USDT</td>
        <td>Limit</td>
        <td class="${side === 'buy' ? 'positive' : 'negative'}">${side.toUpperCase()}</td>
        <td>${amount}</td>
        <td>$${price}</td>
        <td>0%</td>
        <td>$${(parseFloat(price) * parseFloat(amount)).toFixed(2)}</td>
        <td>
            <button class="action-btn" onclick="cancelOrder(this)">
                <i class="fas fa-times"></i>
            </button>
        </td>
    `;
    
    tbody.insertBefore(row, tbody.firstChild);
}

function cancelOrder(button) {
    button.closest('tr').remove();
    showNotification('Order cancelled', 'success');
}

// =============================================
// Advanced Modals
// =============================================
function openAIAnalysisModal() {
    openModal('aiAnalysisModal');
    renderSentimentChart();
    updatePredictions();
}

function openRiskAnalysisModal() {
    openModal('riskAnalysisModal');
    renderVarChart();
    updateRiskScenarios();
}

function openAdvancedScreener() {
    openModal('advancedScreenerModal');
    setupScreenerFilters();
}

function renderSentimentChart() {
    const canvas = document.getElementById('sentimentChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Bullish', 'Bearish', 'Neutral'],
            datasets: [{
                data: [78, 15, 7],
                backgroundColor: ['#00b894', '#e84393', '#fdcb6e'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function renderVarChart() {
    const canvas = document.getElementById('varChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['1D', '7D', '30D'],
            datasets: [{
                label: 'Value at Risk',
                data: [-2847, -8234, -15678],
                backgroundColor: ['rgba(232, 67, 147, 0.8)', 'rgba(232, 67, 147, 0.6)', 'rgba(232, 67, 147, 0.4)'],
                borderColor: '#e84393',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

function setupScreenerFilters() {
    document.getElementById('applyScreener').addEventListener('click', applyScreenerFilters);
    document.getElementById('resetScreener').addEventListener('click', resetScreenerFilters);
    document.getElementById('saveScreener').addEventListener('click', saveScreenerFilters);
}

function applyScreenerFilters() {
    const filters = {
        marketCapMin: parseFloat(document.getElementById('marketCapMin').value) || 0,
        marketCapMax: parseFloat(document.getElementById('marketCapMax').value) || Infinity,
        priceMin: parseFloat(document.getElementById('priceMin').value) || 0,
        priceMax: parseFloat(document.getElementById('priceMax').value) || Infinity,
        change24hMin: parseFloat(document.getElementById('change24hMin').value) || -Infinity,
        change24hMax: parseFloat(document.getElementById('change24hMax').value) || Infinity,
        change7dMin: parseFloat(document.getElementById('change7dMin').value) || -Infinity,
        change7dMax: parseFloat(document.getElementById('change7dMax').value) || Infinity
    };
    
    const filteredCoins = appState.coins.filter(coin => {
        return coin.market_cap >= filters.marketCapMin &&
               coin.market_cap <= filters.marketCapMax &&
               coin.current_price >= filters.priceMin &&
               coin.current_price <= filters.priceMax &&
               (coin.price_change_percentage_24h || 0) >= filters.change24hMin &&
               (coin.price_change_percentage_24h || 0) <= filters.change24hMax &&
               (coin.price_change_percentage_7d_in_currency || 0) >= filters.change7dMin &&
               (coin.price_change_percentage_7d_in_currency || 0) <= filters.change7dMax;
    });
    
    renderScreenerResults(filteredCoins);
}

function renderScreenerResults(coins) {
    const tbody = document.getElementById('screenerResults');
    const countElement = document.getElementById('resultsCount');
    
    if (!tbody || !countElement) return;
    
    countElement.textContent = `(${coins.length} coins)`;
    
    tbody.innerHTML = coins.slice(0, 50).map(coin => `
        <tr>
            <td>
                <div class="coin-info">
                    <img src="${coin.image}" alt="${coin.name}" style="width: 24px; height: 24px; margin-right: 0.5rem;">
                    <span>${coin.name}</span>
                </div>
            </td>
            <td>${formatCurrency(coin.current_price)}</td>
            <td class="${coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}">
                ${coin.price_change_percentage_24h >= 0 ? '+' : ''}${coin.price_change_percentage_24h?.toFixed(2) || 0}%
            </td>
            <td class="${coin.price_change_percentage_7d_in_currency >= 0 ? 'positive' : 'negative'}">
                ${coin.price_change_percentage_7d_in_currency >= 0 ? '+' : ''}${coin.price_change_percentage_7d_in_currency?.toFixed(2) || 0}%
            </td>
            <td>${formatCurrency(coin.market_cap)}</td>
            <td>${Math.floor(Math.random() * 40 + 30)}</td>
            <td>
                <button class="action-btn" onclick="addToWatchlist('${coin.id}')" title="Add to Watchlist">
                    <i class="fas fa-star"></i>
                </button>
                <button class="action-btn" onclick="openCoinDetail('${coin.id}')" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function resetScreenerFilters() {
    document.querySelectorAll('#advancedScreenerModal input, #advancedScreenerModal select').forEach(input => {
        input.value = '';
    });
    document.getElementById('screenerResults').innerHTML = '';
    document.getElementById('resultsCount').textContent = '(0 coins)';
}

function saveScreenerFilters() {
    const filters = {
        marketCapMin: document.getElementById('marketCapMin').value,
        marketCapMax: document.getElementById('marketCapMax').value,
        priceMin: document.getElementById('priceMin').value,
        priceMax: document.getElementById('priceMax').value,
        change24hMin: document.getElementById('change24hMin').value,
        change24hMax: document.getElementById('change24hMax').value,
        change7dMin: document.getElementById('change7dMin').value,
        change7dMax: document.getElementById('change7dMax').value
    };
    
    localStorage.setItem('savedScreenerFilters', JSON.stringify(filters));
    showNotification('Screener filters saved!', 'success');
}

// =============================================
// Additional Features
// =============================================
function refreshData() {
    showLoadingOverlay(true);
    fetchGlobalData();
    fetchAllCoins();
    renderAdvancedAnalytics();
    showNotification('Data refreshed!', 'success');
}

function setupPriceUpdates() {
    // Update prices every 30 seconds
    setInterval(() => {
        if (appState.currentSection === 'dashboard' || appState.currentSection === 'markets') {
            fetchAllCoins();
        }
    }, 30000);
}

function updateFearGreedIndex() {
    // Mock Fear & Greed Index
    const fearGreedValue = Math.floor(Math.random() * 100);
    let label = 'Neutral';
    
    if (fearGreedValue <= 25) label = 'Extreme Fear';
    else if (fearGreedValue <= 45) label = 'Fear';
    else if (fearGreedValue <= 55) label = 'Neutral';
    else if (fearGreedValue <= 75) label = 'Greed';
    else label = 'Extreme Greed';
    
    const valueElement = document.getElementById('fearGreedValue');
    const labelElement = document.getElementById('fearGreedLabel');
    
    if (valueElement) valueElement.textContent = fearGreedValue;
    if (labelElement) labelElement.textContent = label;
}

function openCoinDetail(coinId) {
    const coin = appState.coins.find(c => c.id === coinId);
    if (!coin) return;
    
    // Populate coin detail modal
    document.getElementById('coinDetailTitle').textContent = `${coin.name} (${coin.symbol.toUpperCase()})`;
    document.getElementById('detailCoinImage').src = coin.image;
    document.getElementById('detailCoinName').textContent = coin.name;
    document.getElementById('detailCoinSymbol').textContent = coin.symbol.toUpperCase();
    document.getElementById('detailCoinPrice').textContent = formatCurrency(coin.current_price);
    
    const changeElement = document.getElementById('detailCoinChange');
    changeElement.textContent = `${coin.price_change_percentage_24h >= 0 ? '+' : ''}${coin.price_change_percentage_24h?.toFixed(2) || 0}%`;
    changeElement.className = coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative';
    
    document.getElementById('detailMarketCap').textContent = formatCurrency(coin.market_cap);
    document.getElementById('detailVolume').textContent = formatCurrency(coin.total_volume);
    document.getElementById('detailSupply').textContent = `${coin.circulating_supply?.toLocaleString() || 'N/A'} ${coin.symbol.toUpperCase()}`;
    document.getElementById('detailAth').textContent = formatCurrency(coin.ath || coin.current_price * 1.2);
    
    openModal('coinDetailModal');
}

function connectExchange() {
    const exchange = document.getElementById('exchangeSelect').value;
    const apiKey = document.getElementById('apiKey').value;
    const apiSecret = document.getElementById('apiSecret').value;
    
    if (!exchange || !apiKey || !apiSecret) {
        showNotification('Please fill all required fields', 'error');
        return;
    }
    
    // Simulate exchange connection
    setTimeout(() => {
        showNotification(`Successfully connected to ${exchange}!`, 'success');
        closeModal();
        
        // Add some mock transactions
        const mockTransactions = [
            {
                id: Date.now() + 1,
                type: 'buy',
                coinId: 'bitcoin',
                amount: 0.1,
                price: 45000,
                date: new Date().toISOString(),
                timestamp: Date.now()
            },
            {
                id: Date.now() + 2,
                type: 'buy',
                coinId: 'ethereum',
                amount: 2,
                price: 3200,
                date: new Date().toISOString(),
                timestamp: Date.now()
            }
        ];
        
        appState.transactions.push(...mockTransactions);
        updatePortfolioFromTransactions();
        saveToStorage('transactions', appState.transactions);
        saveToStorage('portfolio', appState.portfolio);
        
        renderPortfolio();
        renderTransactions();
        updatePortfolioSummary();
    }, 2000);
}

function removeTransaction(index) {
    appState.transactions.splice(index, 1);
    updatePortfolioFromTransactions();
    saveToStorage('transactions', appState.transactions);
    saveToStorage('portfolio', appState.portfolio);
    
    renderPortfolio();
    renderTransactions();
    updatePortfolioSummary();
    showNotification('Transaction removed', 'success');
}

function removeHolding(coinId) {
    appState.portfolio = appState.portfolio.filter(holding => holding.coinId !== coinId);
    appState.transactions = appState.transactions.filter(transaction => transaction.coinId !== coinId);
    
    saveToStorage('portfolio', appState.portfolio);
    saveToStorage('transactions', appState.transactions);
    
    renderPortfolio();
    renderTransactions();
    updatePortfolioSummary();
    showNotification('Holding removed', 'success');
}

// =============================================
// Advanced Utility Functions
// =============================================
function toggleFullscreenChart() {
    const chartSection = document.querySelector('.chart-section');
    if (chartSection.classList.contains('fullscreen')) {
        chartSection.classList.remove('fullscreen');
        document.body.style.overflow = '';
    } else {
        chartSection.classList.add('fullscreen');
        document.body.style.overflow = 'hidden';
    }
}

function cancelAllOrders() {
    const tbody = document.getElementById('openOrdersBody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 2rem; color: var(--text-secondary);">No open orders</td></tr>';
        showNotification('All orders cancelled', 'success');
    }
}

function updatePredictions() {
    // Dynamic prediction updates based on real market data
    const btcCoin = appState.coins.find(c => c.id === 'bitcoin');
    const ethCoin = appState.coins.find(c => c.id === 'ethereum');
    
    if (btcCoin) {
        const prediction = btcCoin.current_price * (1 + (Math.random() * 0.3 - 0.1)); // Mock prediction
        document.querySelector('.prediction-card h5').textContent = `Bitcoin (BTC) - Target: $${prediction.toFixed(0)}`;
    }
}

function updateRiskScenarios() {
    const totalValue = getTotalPortfolioValue();
    if (totalValue > 0) {
        document.querySelector('.scenario-card:nth-child(1) .scenario-impact').textContent = `-$${(totalValue * 0.5).toFixed(0)}`;
        document.querySelector('.scenario-card:nth-child(2) .scenario-impact').textContent = `-$${(totalValue * 0.3).toFixed(0)}`;
        document.querySelector('.scenario-card:nth-child(3) .scenario-impact').textContent = `-$${(totalValue * 0.2).toFixed(0)}`;
    }
}

// =============================================
// Demo Trading System
// =============================================
let demoTradingState = {
    balance: 100000,
    positions: [
        {
            pair: 'BTCUSDT',
            side: 'long',
            size: 0.0443,
            entryPrice: 44856.23,
            currentPrice: 45234.67,
            leverage: 10,
            pnl: 16.77
        },
        {
            pair: 'ETHUSDT',
            side: 'short',
            size: 0.628,
            entryPrice: 3201.45,
            currentPrice: 3187.45,
            leverage: 5,
            pnl: 8.79
        }
    ],
    totalPnL: 2347.82,
    isActive: false
};

function initializeDemoTrading() {
    // Advanced AI Analysis
    document.getElementById('aiAnalysisBtn')?.addEventListener('click', openAdvancedAI);
    document.getElementById('portfolioOptimizerBtn')?.addEventListener('click', openPortfolioOptimizer);
    
    document.getElementById('resetDemoBtn')?.addEventListener('click', resetDemoTrading);
    
    // Demo order type selection
    document.querySelectorAll('.demo-order-type').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.demo-order-type').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const type = btn.dataset.type;
            const limitGroup = document.getElementById('limitPriceGroup');
            if (limitGroup) {
                limitGroup.style.display = type === 'limit' ? 'block' : 'none';
            }
        });
    });
    
    // Demo amount buttons
    document.querySelectorAll('.demo-amount-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const amount = btn.dataset.amount;
            document.getElementById('demoOrderSize').value = amount;
            updatePositionCalculations();
        });
    });
    
    // Auto-update calculations
    document.getElementById('demoOrderSize')?.addEventListener('input', updatePositionCalculations);
    document.getElementById('demoLeverage')?.addEventListener('change', updatePositionCalculations);
    document.getElementById('demoPairSelect')?.addEventListener('change', updateDemoPairData);
    
    // Start demo price updates
    setInterval(updateDemoPrices, 2000);
    
    // Update demo display every second
    setInterval(updateDemoDisplay, 1000);
}

function updatePositionCalculations() {
    const orderSize = parseFloat(document.getElementById('demoOrderSize')?.value || 1000);
    const leverage = parseFloat(document.getElementById('demoLeverage')?.value || 10);
    const currentPrice = 45234.67; // This would be dynamic based on selected pair
    
    const positionSize = (orderSize * leverage) / currentPrice;
    const marginRequired = orderSize / leverage;
    
    document.getElementById('positionSize').textContent = `${positionSize.toFixed(6)} BTC`;
    document.getElementById('marginRequired').textContent = `$${marginRequired.toFixed(2)}`;
}

function updateDemoPairData() {
    const pair = document.getElementById('demoPairSelect')?.value;
    let price = 45234.67;
    let change = '+2.34%';
    
    switch(pair) {
        case 'ETHUSDT':
            price = 3187.45;
            change = '+1.87%';
            break;
        case 'ADAUSDT':
            price = 0.4567;
            change = '-0.23%';
            break;
        case 'SOLUSDT':
            price = 89.23;
            change = '+4.56%';
            break;
        case 'DOTUSDT':
            price = 6.78;
            change = '+0.87%';
            break;
    }
    
    document.getElementById('demoCurrentPrice').textContent = `$${price.toLocaleString()}`;
    document.getElementById('demoPriceChange').textContent = change;
    document.getElementById('demoPriceChange').className = `demo-price-change ${change.startsWith('+') ? 'positive' : 'negative'}`;
    
    updatePositionCalculations();
}

function executeDemoTrade(side) {
    const orderSize = parseFloat(document.getElementById('demoOrderSize')?.value || 1000);
    const leverage = parseFloat(document.getElementById('demoLeverage')?.value || 10);
    const pair = document.getElementById('demoPairSelect')?.value || 'BTCUSDT';
    const orderType = document.querySelector('.demo-order-type.active')?.dataset.type || 'market';
    
    if (orderSize > demoTradingState.balance) {
        showNotification('Insufficient demo balance!', 'error');
        return;
    }
    
    // Simulate order execution
    const currentPrice = parseFloat(document.getElementById('demoCurrentPrice').textContent.replace(/[$,]/g, ''));
    const positionSize = (orderSize * leverage) / currentPrice;
    
    const newPosition = {
        pair: pair,
        side: side,
        size: positionSize,
        entryPrice: currentPrice,
        currentPrice: currentPrice,
        leverage: leverage,
        pnl: 0,
        timestamp: Date.now()
    };
    
    demoTradingState.positions.push(newPosition);
    demoTradingState.balance -= orderSize / leverage; // Margin used
    
    updateDemoPositionsTable();
    updateDemoDisplay();
    
    showNotification(`🎯 Demo ${side.toUpperCase()} order executed! Size: ${positionSize.toFixed(6)} ${pair.replace('USDT', '')}`, 'success');
}

function closeDemoPosition(index) {
    const position = demoTradingState.positions[index];
    if (!position) return;
    
    const pnl = position.pnl;
    demoTradingState.balance += pnl;
    demoTradingState.totalPnL += pnl;
    demoTradingState.positions.splice(index, 1);
    
    updateDemoPositionsTable();
    updateDemoDisplay();
    
    showNotification(`Position closed! P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`, pnl >= 0 ? 'success' : 'warning');
}

function updateDemoPrices() {
    // Simulate real-time price updates
    demoTradingState.positions.forEach(position => {
        const volatility = 0.002; // 0.2% volatility
        const change = (Math.random() - 0.5) * volatility;
        position.currentPrice *= (1 + change);
        
        // Calculate P&L
        const sizeFactor = position.size * position.leverage;
        if (position.side === 'long') {
            position.pnl = sizeFactor * (position.currentPrice - position.entryPrice);
        } else {
            position.pnl = sizeFactor * (position.entryPrice - position.currentPrice);
        }
    });
    
    // Update total P&L
    demoTradingState.totalPnL = demoTradingState.positions.reduce((total, pos) => total + pos.pnl, 0);
    
    if (document.getElementById('demoTradingModal')?.classList.contains('active')) {
        updateDemoPositionsTable();
    }
}

function updateDemoDisplay() {
    document.getElementById('demoBalance').textContent = `$${demoTradingState.balance.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    document.getElementById('modalDemoBalance').textContent = `$${demoTradingState.balance.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    
    const pnlElement = document.getElementById('demoPnL');
    const totalPnLElement = document.getElementById('totalDemoPnL');
    const pnlText = `${demoTradingState.totalPnL >= 0 ? '+' : ''}$${demoTradingState.totalPnL.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    
    if (pnlElement) {
        pnlElement.textContent = pnlText;
        pnlElement.className = demoTradingState.totalPnL >= 0 ? 'positive' : 'negative';
    }
    
    if (totalPnLElement) {
        totalPnLElement.textContent = pnlText;
        totalPnLElement.className = demoTradingState.totalPnL >= 0 ? 'positive' : 'negative';
    }
    
    document.getElementById('openPositionsCount').textContent = demoTradingState.positions.length;
    document.getElementById('demoMargin').textContent = `$${(demoTradingState.balance * 0.75).toLocaleString(undefined, {minimumFractionDigits: 2})}`;
}

function updateDemoPositionsTable() {
    const tbody = document.getElementById('demoPositionsTable');
    if (!tbody) return;
    
    tbody.innerHTML = demoTradingState.positions.map((position, index) => {
        const roe = ((position.currentPrice - position.entryPrice) / position.entryPrice * 100 * position.leverage);
        const adjustedRoe = position.side === 'short' ? -roe : roe;
        
        return `
            <tr>
                <td>${position.pair}</td>
                <td><span class="position-side ${position.side}">${position.side.toUpperCase()}</span></td>
                <td>${position.size.toFixed(6)} ${position.pair.replace('USDT', '')}</td>
                <td>$${position.entryPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td>$${position.currentPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td class="${position.pnl >= 0 ? 'positive' : 'negative'}">${position.pnl >= 0 ? '+' : ''}$${position.pnl.toFixed(2)}</td>
                <td class="${adjustedRoe >= 0 ? 'positive' : 'negative'}">${adjustedRoe >= 0 ? '+' : ''}${adjustedRoe.toFixed(2)}%</td>
                <td>
                    <button class="demo-close-btn" onclick="closeDemoPosition(${index})">Close</button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderDemoChart() {
    const canvas = document.getElementById('demoTradingChart');
    if (!canvas) return;
    
    // Generate mock price data
    const data = [];
    let price = 45234.67;
    const now = new Date();
    
    for (let i = 0; i < 50; i++) {
        const timestamp = new Date(now.getTime() - (49 - i) * 60000);
        const change = (Math.random() - 0.5) * 0.02;
        price *= (1 + change);
        data.push({x: timestamp, y: price});
    }
    
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'BTC/USDT',
                data: data,
                borderColor: '#6c5ce7',
                backgroundColor: 'rgba(108, 92, 231, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    type: 'time',
                    time: { unit: 'minute' }
                },
                y: {
                    position: 'right',
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function resetDemoTrading() {
    demoTradingState.balance = 100000;
    demoTradingState.positions = [];
    demoTradingState.totalPnL = 0;
    
    updateDemoDisplay();
    updateDemoPositionsTable();
    
    showNotification('🔄 Demo account reset! Starting fresh with $100,000', 'success');
}

function quickDemoTrade(side) {
    // Quick trade with $1000 and 10x leverage
    document.getElementById('demoOrderSize').value = '1000';
    document.getElementById('demoLeverage').value = '10';
    updatePositionCalculations();
    executeDemoTrade(side);
}

function executeSignal(coin, direction) {
    showNotification(`🎯 Executing ${direction.toUpperCase()} signal for ${coin}! Check your demo positions.`, 'success');
    
    // Auto-fill demo trading form
    document.getElementById('demoOrderSize').value = '2000';
    document.getElementById('demoLeverage').value = '5';
    
    // Select appropriate pair
    const pairSelect = document.getElementById('demoPairSelect');
    if (pairSelect) {
        const targetPair = `${coin}USDT`;
        for (let option of pairSelect.options) {
            if (option.value === targetPair) {
                pairSelect.value = targetPair;
                updateDemoPairData();
                break;
            }
        }
    }
    
    updatePositionCalculations();
    executeDemoTrade(direction === 'long' ? 'long' : 'short');
    closeModal();
}

// =============================================
// Web3 Features
// =============================================
const web3Features = {
    walletConnected: false,
    currentAccount: null,
    chainId: null,
    supportedChains: {
        1: 'Ethereum',
        56: 'BSC',
        137: 'Polygon',
        250: 'Fantom',
        43114: 'Avalanche',
        42161: 'Arbitrum',
        10: 'Optimism'
    }
};

async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            
            web3Features.walletConnected = true;
            web3Features.currentAccount = accounts[0];
            web3Features.chainId = parseInt(chainId, 16);
            
            updateWalletUI();
            fetchWalletBalance();
            showNotification('🦊 Wallet connected successfully!', 'success');
        } catch (error) {
            console.error('Wallet connection failed:', error);
            showNotification('Failed to connect wallet', 'error');
        }
    } else {
        showNotification('Please install MetaMask or another Web3 wallet', 'warning');
    }
}

function updateWalletUI() {
    const walletBtn = document.getElementById('connectWalletBtn');
    if (walletBtn) {
        if (web3Features.walletConnected) {
            walletBtn.innerHTML = `
                <i class="fas fa-wallet"></i>
                ${web3Features.currentAccount.slice(0, 6)}...${web3Features.currentAccount.slice(-4)}
            `;
            walletBtn.classList.add('connected');
        } else {
            walletBtn.innerHTML = '<i class="fas fa-wallet"></i> Connect Wallet';
            walletBtn.classList.remove('connected');
        }
    }
}

async function fetchWalletBalance() {
    if (!web3Features.walletConnected) return;
    
    try {
        const balance = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [web3Features.currentAccount, 'latest']
        });
        
        const ethBalance = parseInt(balance, 16) / Math.pow(10, 18);
        
        // Update wallet balance display
        const balanceElement = document.getElementById('walletBalance');
        if (balanceElement) {
            balanceElement.textContent = `${ethBalance.toFixed(4)} ETH`;
        }
    } catch (error) {
        console.error('Error fetching wallet balance:', error);
    }
}

function addWeb3Section() {
    const sidebar = document.querySelector('.nav-menu');
    if (sidebar && !document.querySelector('[data-section="web3"]')) {
        const web3Item = document.createElement('li');
        web3Item.setAttribute('data-section', 'web3');
        web3Item.innerHTML = `
            <i class="fas fa-cube"></i>
            <span>Web3 Hub</span>
        `;
        sidebar.appendChild(web3Item);
        
        web3Item.addEventListener('click', () => {
            switchSection('web3');
        });
    }
}

function createWeb3Section() {
    const mainContent = document.querySelector('.main-content');
    if (mainContent && !document.getElementById('web3')) {
        const web3Section = document.createElement('section');
        web3Section.className = 'content-section';
        web3Section.id = 'web3';
        web3Section.innerHTML = `
            <div class="section-header">
                <h2>Web3 Hub</h2>
                <div class="web3-controls">
                    <button id="connectWalletBtn" class="primary-btn">
                        <i class="fas fa-wallet"></i> Connect Wallet
                    </button>
                    <div class="wallet-info" id="walletInfo" style="display: none;">
                        <span>Balance: <strong id="walletBalance">0.0000 ETH</strong></span>
                        <span>Network: <strong id="currentNetwork">Ethereum</strong></span>
                    </div>
                </div>
            </div>
            
            <div class="web3-grid">
                <div class="card">
                    <div class="card-header">
                        <h3>🌐 Multi-Chain Portfolio</h3>
                        <div class="chain-selector">
                            <select id="chainSelector">
                                <option value="1">Ethereum</option>
                                <option value="56">BSC</option>
                                <option value="137">Polygon</option>
                                <option value="42161">Arbitrum</option>
                                <option value="10">Optimism</option>
                            </select>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="chain-portfolio" id="chainPortfolio">
                            <div class="portfolio-placeholder">
                                <i class="fas fa-wallet" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                                <p>Connect your wallet to view cross-chain portfolio</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3>🎮 GameFi Tracker</h3>
                    </div>
                    <div class="card-body">
                        <div class="gamefi-stats">
                            <div class="gamefi-stat">
                                <span>Total Gaming TVL</span>
                                <strong>$8.4B</strong>
                                <small class="positive">+12.5% (24h)</small>
                            </div>
                            <div class="gamefi-stat">
                                <span>Active Games</span>
                                <strong>2,847</strong>
                                <small class="positive">+23 (24h)</small>
                            </div>
                            <div class="gamefi-stat">
                                <span>NFT Volume</span>
                                <strong>145.7K ETH</strong>
                                <small class="negative">-5.2% (24h)</small>
                            </div>
                        </div>
                        <div class="top-games">
                            <h4>🏆 Top Gaming Tokens</h4>
                            <div class="game-list">
                                <div class="game-item">
                                    <span class="game-name">Axie Infinity (AXS)</span>
                                    <span class="game-price positive">$8.45 (+5.2%)</span>
                                </div>
                                <div class="game-item">
                                    <span class="game-name">The Sandbox (SAND)</span>
                                    <span class="game-price positive">$0.67 (+3.1%)</span>
                                </div>
                                <div class="game-item">
                                    <span class="game-name">Immutable X (IMX)</span>
                                    <span class="game-price negative">$1.23 (-2.4%)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3>⚡ Layer 2 Tracker</h3>
                    </div>
                    <div class="card-body">
                        <div class="l2-stats">
                            <div class="l2-network">
                                <div class="network-info">
                                    <img src="https://via.placeholder.com/32x32?text=ARB" alt="Arbitrum">
                                    <span>Arbitrum</span>
                                </div>
                                <div class="network-stats">
                                    <span>TVL: $2.8B</span>
                                    <span class="positive">+8.5%</span>
                                </div>
                            </div>
                            <div class="l2-network">
                                <div class="network-info">
                                    <img src="https://via.placeholder.com/32x32?text=OP" alt="Optimism">
                                    <span>Optimism</span>
                                </div>
                                <div class="network-stats">
                                    <span>TVL: $1.2B</span>
                                    <span class="positive">+12.3%</span>
                                </div>
                            </div>
                            <div class="l2-network">
                                <div class="network-info">
                                    <img src="https://via.placeholder.com/32x32?text=MATIC" alt="Polygon">
                                    <span>Polygon</span>
                                </div>
                                <div class="network-stats">
                                    <span>TVL: $956M</span>
                                    <span class="negative">-2.1%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3>🏛️ DAO Governance</h3>
                    </div>
                    <div class="card-body">
                        <div class="dao-overview">
                            <div class="dao-stat">
                                <span>Active Proposals</span>
                                <strong>127</strong>
                            </div>
                            <div class="dao-stat">
                                <span>Total DAOs</span>
                                <strong>4,892</strong>
                            </div>
                            <div class="dao-stat">
                                <span>Governance Tokens</span>
                                <strong>$45.2B</strong>
                            </div>
                        </div>
                        <div class="active-proposals">
                            <h4>🗳️ Recent Proposals</h4>
                            <div class="proposal-item">
                                <span class="proposal-dao">Uniswap</span>
                                <span class="proposal-title">Fee Tier Adjustment</span>
                                <span class="proposal-status voting">Voting</span>
                            </div>
                            <div class="proposal-item">
                                <span class="proposal-dao">Compound</span>
                                <span class="proposal-title">Treasury Allocation</span>
                                <span class="proposal-status passed">Passed</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3>🔗 Cross-Chain Bridge</h3>
                    </div>
                    <div class="card-body">
                        <div class="bridge-interface">
                            <div class="bridge-form">
                                <div class="form-group">
                                    <label>From Network</label>
                                    <select id="fromNetwork">
                                        <option value="ethereum">Ethereum</option>
                                        <option value="polygon">Polygon</option>
                                        <option value="arbitrum">Arbitrum</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>To Network</label>
                                    <select id="toNetwork">
                                        <option value="polygon">Polygon</option>
                                        <option value="ethereum">Ethereum</option>
                                        <option value="arbitrum">Arbitrum</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Amount</label>
                                    <input type="number" id="bridgeAmount" placeholder="0.0" step="0.001">
                                </div>
                                <button class="primary-btn" onclick="initiateBridge()">
                                    <i class="fas fa-exchange-alt"></i> Bridge Assets
                                </button>
                            </div>
                            <div class="bridge-stats">
                                <div class="stat">
                                    <span>Bridge Fee</span>
                                    <strong>~$2.50</strong>
                                </div>
                                <div class="stat">
                                    <span>Est. Time</span>
                                    <strong>2-5 min</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3>🛠️ DeFi Tools</h3>
                    </div>
                    <div class="card-body">
                        <div class="defi-tools">
                            <button class="tool-btn" onclick="openYieldFarming()">
                                <i class="fas fa-seedling"></i>
                                <span>Yield Farming</span>
                            </button>
                            <button class="tool-btn" onclick="openLiquidityPools()">
                                <i class="fas fa-water"></i>
                                <span>Liquidity Pools</span>
                            </button>
                            <button class="tool-btn" onclick="openStaking()">
                                <i class="fas fa-coins"></i>
                                <span>Staking</span>
                            </button>
                            <button class="tool-btn" onclick="openLending()">
                                <i class="fas fa-hand-holding-usd"></i>
                                <span>Lending</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        mainContent.appendChild(web3Section);
        
        // Add event listener for connect wallet button
        document.getElementById('connectWalletBtn')?.addEventListener('click', connectWallet);
    }
}

function initiateBridge() {
    if (!web3Features.walletConnected) {
        showNotification('Please connect your wallet first', 'warning');
        return;
    }
    
    const fromNetwork = document.getElementById('fromNetwork').value;
    const toNetwork = document.getElementById('toNetwork').value;
    const amount = document.getElementById('bridgeAmount').value;
    
    if (!amount || parseFloat(amount) <= 0) {
        showNotification('Please enter a valid amount', 'error');
        return;
    }
    
    // Simulate bridge transaction
    showNotification('🌉 Bridge transaction initiated...', 'success');
    
    setTimeout(() => {
        showNotification(`Successfully bridged ${amount} ETH from ${fromNetwork} to ${toNetwork}`, 'success');
    }, 3000);
}

// DeFi Tools Functions
function openYieldFarming() {
    showNotification('🚜 Yield farming interface coming soon!', 'success');
}

function openLiquidityPools() {
    showNotification('💧 Liquidity pools interface coming soon!', 'success');
}

function openStaking() {
    showNotification('🥩 Staking interface coming soon!', 'success');
}

function openLending() {
    showNotification('🏦 Lending interface coming soon!', 'success');
}

// =============================================
// Real-time Data Updates
// =============================================
function enhanceRealTimeUpdates() {
    // Update prices every 10 seconds
    setInterval(() => {
        if (appState.coins.length > 0) {
            simulatePriceUpdates();
            updateMarketTicker();
            updateDashboardPrices();
            updateAIInsights();
        }
    }, 10000);
    
    // Update charts every 30 seconds
    setInterval(() => {
        if (appState.currentSection === 'dashboard') {
            renderMarketDominanceChart();
            updateFearGreedIndex();
        }
    }, 30000);
    
    // Update news every 5 minutes
    setInterval(() => {
        fetchCryptoNews();
    }, 300000);
}

function simulatePriceUpdates() {
    appState.coins = appState.coins.map(coin => {
        const volatility = 0.02; // 2% max change
        const change = (Math.random() - 0.5) * volatility;
        const newPrice = coin.current_price * (1 + change);
        const priceChange24h = coin.price_change_percentage_24h + change * 100;
        
        return {
            ...coin,
            current_price: newPrice,
            price_change_percentage_24h: priceChange24h
        };
    });
}

function updateDashboardPrices() {
    // Update top gainers/losers
    renderTopGainers();
    renderTopLosers();
    
    // Update portfolio values
    updatePortfolioSummary();
    
    // Update demo trading prices
    updateDemoPrices();
}

// =============================================
// Advanced Dashboard Features
// =============================================
function openAdvancedAI() {
    showNotification('🤖 Opening Advanced AI Market Analysis...', 'success');
    
    // Create advanced AI analysis modal
    const aiModal = document.createElement('div');
    aiModal.className = 'modal';
    aiModal.id = 'advancedAIModal';
    aiModal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h3>🧠 Advanced AI Market Analysis</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="ai-analysis-dashboard">
                    <div class="ai-section">
                        <h4>📊 Multi-Model Consensus</h4>
                        <div class="ai-models">
                            <div class="model-prediction">
                                <span class="model-name">LSTM Neural Network</span>
                                <span class="prediction-value positive">+4.2%</span>
                                <span class="confidence">96% confidence</span>
                            </div>
                            <div class="model-prediction">
                                <span class="model-name">Transformer Model</span>
                                <span class="prediction-value positive">+3.8%</span>
                                <span class="confidence">91% confidence</span>
                            </div>
                            <div class="model-prediction">
                                <span class="model-name">Random Forest</span>
                                <span class="prediction-value positive">+2.9%</span>
                                <span class="confidence">88% confidence</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="ai-section">
                        <h4>🎯 Price Targets & Scenarios</h4>
                        <div class="price-scenarios">
                            <div class="scenario optimistic">
                                <span class="scenario-label">Bull Case</span>
                                <span class="scenario-price">$52,400</span>
                                <span class="scenario-probability">25%</span>
                            </div>
                            <div class="scenario base">
                                <span class="scenario-label">Base Case</span>
                                <span class="scenario-price">$47,200</span>
                                <span class="scenario-probability">50%</span>
                            </div>
                            <div class="scenario pessimistic">
                                <span class="scenario-label">Bear Case</span>
                                <span class="scenario-price">$41,800</span>
                                <span class="scenario-probability">25%</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="ai-section">
                        <h4>🌊 Market Momentum Analysis</h4>
                        <div class="momentum-indicators">
                            <div class="momentum-item">
                                <span>Order Flow</span>
                                <div class="momentum-bar"><div class="momentum-fill bullish" style="width: 78%"></div></div>
                                <span class="momentum-value">78% Bullish</span>
                            </div>
                            <div class="momentum-item">
                                <span>Social Sentiment</span>
                                <div class="momentum-bar"><div class="momentum-fill bullish" style="width: 82%"></div></div>
                                <span class="momentum-value">82% Positive</span>
                            </div>
                            <div class="momentum-item">
                                <span>Whale Activity</span>
                                <div class="momentum-bar"><div class="momentum-fill neutral" style="width: 45%"></div></div>
                                <span class="momentum-value">45% Accumulating</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(aiModal);
    openModal('advancedAIModal');
}

function openPortfolioOptimizer() {
    showNotification('⚡ Launching Smart Portfolio Optimizer...', 'success');
    
    // Create portfolio optimizer modal
    const optimizerModal = document.createElement('div');
    optimizerModal.className = 'modal';
    optimizerModal.id = 'portfolioOptimizerModal';
    optimizerModal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h3>⚡ Smart Portfolio Optimizer</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="optimizer-dashboard">
                    <div class="optimization-settings">
                        <h4>🎛️ Optimization Parameters</h4>
                        <div class="setting-group">
                            <label>Risk Tolerance</label>
                            <select id="riskTolerance">
                                <option value="conservative">Conservative</option>
                                <option value="moderate" selected>Moderate</option>
                                <option value="aggressive">Aggressive</option>
                            </select>
                        </div>
                        <div class="setting-group">
                            <label>Investment Horizon</label>
                            <select id="timeHorizon">
                                <option value="short">Short-term (< 6 months)</option>
                                <option value="medium" selected>Medium-term (6-24 months)</option>
                                <option value="long">Long-term (> 2 years)</option>
                            </select>
                        </div>
                        <div class="setting-group">
                            <label>Rebalancing Frequency</label>
                            <select id="rebalanceFreq">
                                <option value="weekly">Weekly</option>
                                <option value="monthly" selected>Monthly</option>
                                <option value="quarterly">Quarterly</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="optimization-results">
                        <h4>📈 Optimized Allocation</h4>
                        <div class="allocation-chart">
                            <canvas id="optimizedAllocationChart" width="300" height="200"></canvas>
                        </div>
                        <div class="allocation-details">
                            <div class="allocation-item">
                                <span class="asset-name">Bitcoin (BTC)</span>
                                <span class="current-allocation">45%</span>
                                <span class="recommended-allocation">→ 35%</span>
                                <span class="allocation-change negative">-10%</span>
                            </div>
                            <div class="allocation-item">
                                <span class="asset-name">Ethereum (ETH)</span>
                                <span class="current-allocation">25%</span>
                                <span class="recommended-allocation">→ 30%</span>
                                <span class="allocation-change positive">+5%</span>
                            </div>
                            <div class="allocation-item">
                                <span class="asset-name">Solana (SOL)</span>
                                <span class="current-allocation">15%</span>
                                <span class="recommended-allocation">→ 20%</span>
                                <span class="allocation-change positive">+5%</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="optimization-benefits">
                        <h4>💰 Expected Benefits</h4>
                        <div class="benefit-metrics">
                            <div class="benefit-item">
                                <span class="benefit-label">Expected Return</span>
                                <span class="benefit-value positive">+18.2%</span>
                            </div>
                            <div class="benefit-item">
                                <span class="benefit-label">Risk Reduction</span>
                                <span class="benefit-value positive">-12.5%</span>
                            </div>
                            <div class="benefit-item">
                                <span class="benefit-label">Sharpe Ratio</span>
                                <span class="benefit-value positive">+0.34</span>
                            </div>
                        </div>
                        <button class="primary-btn" onclick="applyOptimization()">
                            <i class="fas fa-magic"></i> Apply Optimization
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(optimizerModal);
    openModal('portfolioOptimizerModal');
}

function openArbitrageCalculator() {
    showNotification('💎 Opening Arbitrage Calculator...', 'success');
    
    // Create arbitrage calculator modal
    const arbModal = document.createElement('div');
    arbModal.className = 'modal';
    arbModal.id = 'arbitrageModal';
    arbModal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h3>💎 Advanced Arbitrage Calculator</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="arbitrage-calculator">
                    <div class="calc-inputs">
                        <h4>🔧 Calculator Settings</h4>
                        <div class="input-group">
                            <label>Trading Pair</label>
                            <select id="arbPair">
                                <option value="BTCUSDT">BTC/USDT</option>
                                <option value="ETHUSDT">ETH/USDT</option>
                                <option value="ADAUSDT">ADA/USDT</option>
                            </select>
                        </div>
                        <div class="input-group">
                            <label>Capital Amount ($)</label>
                            <input type="number" id="arbCapital" value="10000" min="100" max="1000000">
                        </div>
                        <div class="input-group">
                            <label>Max Slippage (%)</label>
                            <input type="number" id="arbSlippage" value="0.5" min="0.1" max="5" step="0.1">
                        </div>
                    </div>
                    
                    <div class="calc-results">
                        <h4>📊 Arbitrage Analysis</h4>
                        <div class="arb-opportunity">
                            <div class="exchange-prices">
                                <div class="exchange-price">
                                    <span class="exchange-name">Binance</span>
                                    <span class="price-value">$45,234.67</span>
                                    <span class="price-status sell">SELL</span>
                                </div>
                                <div class="arbitrage-arrow">
                                    <i class="fas fa-arrow-right"></i>
                                    <span class="profit-estimate">+$1,247</span>
                                </div>
                                <div class="exchange-price">
                                    <span class="exchange-name">Coinbase</span>
                                    <span class="price-value">$44,987.32</span>
                                    <span class="price-status buy">BUY</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="profit-breakdown">
                            <div class="profit-item">
                                <span>Gross Profit</span>
                                <span class="positive">$1,375.21</span>
                            </div>
                            <div class="profit-item">
                                <span>Trading Fees</span>
                                <span class="negative">-$89.45</span>
                            </div>
                            <div class="profit-item">
                                <span>Transfer Costs</span>
                                <span class="negative">-$38.76</span>
                            </div>
                            <div class="profit-item total">
                                <span>Net Profit</span>
                                <span class="positive">$1,247.00</span>
                            </div>
                        </div>
                        
                        <button class="primary-btn" onclick="executeArbitrage()">
                            <i class="fas fa-rocket"></i> Execute Arbitrage
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(arbModal);
    openModal('arbitrageModal');
}

function openTechnicalAnalysis() {
    showNotification('📊 Opening Advanced Technical Analysis...', 'success');
    
    // Create technical analysis modal
    const techModal = document.createElement('div');
    techModal.className = 'modal';
    techModal.id = 'technicalAnalysisModal';
    techModal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h3>📊 Advanced Technical Analysis</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="technical-dashboard">
                    <div class="indicators-grid">
                        <h4>📈 Technical Indicators Overview</h4>
                        <div class="indicators-summary">
                            <div class="indicator-category">
                                <h5>Trend Indicators</h5>
                                <div class="indicator-list">
                                    <div class="indicator-item bullish">
                                        <span>EMA 20/50 Cross</span>
                                        <span class="signal-strength">Strong Buy</span>
                                    </div>
                                    <div class="indicator-item bullish">
                                        <span>MACD Histogram</span>
                                        <span class="signal-strength">Buy</span>
                                    </div>
                                    <div class="indicator-item neutral">
                                        <span>ADX Trend</span>
                                        <span class="signal-strength">Neutral</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="indicator-category">
                                <h5>Momentum Indicators</h5>
                                <div class="indicator-list">
                                    <div class="indicator-item bearish">
                                        <span>RSI (14)</span>
                                        <span class="signal-strength">Overbought</span>
                                    </div>
                                    <div class="indicator-item bullish">
                                        <span>Stochastic %K</span>
                                        <span class="signal-strength">Buy</span>
                                    </div>
                                    <div class="indicator-item neutral">
                                        <span>Williams %R</span>
                                        <span class="signal-strength">Neutral</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="indicator-category">
                                <h5>Volume Indicators</h5>
                                <div class="indicator-list">
                                    <div class="indicator-item bullish">
                                        <span>Volume Profile</span>
                                        <span class="signal-strength">Strong Buy</span>
                                    </div>
                                    <div class="indicator-item bullish">
                                        <span>OBV Trend</span>
                                        <span class="signal-strength">Buy</span>
                                    </div>
                                    <div class="indicator-item bullish">
                                        <span>A/D Line</span>
                                        <span class="signal-strength">Buy</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="pattern-analysis">
                        <h4>🔍 Advanced Pattern Recognition</h4>
                        <div class="detected-patterns">
                            <div class="pattern-card bullish-pattern">
                                <div class="pattern-header">
                                    <span class="pattern-name">Bullish Engulfing</span>
                                    <span class="pattern-timeframe">4H</span>
                                </div>
                                <div class="pattern-details">
                                    <span class="confidence">Confidence: 94%</span>
                                    <span class="target">Target: $48,500</span>
                                    <span class="stop-loss">Stop: $44,200</span>
                                </div>
                            </div>
                            
                            <div class="pattern-card neutral-pattern">
                                <div class="pattern-header">
                                    <span class="pattern-name">Triangle Formation</span>
                                    <span class="pattern-timeframe">1D</span>
                                </div>
                                <div class="pattern-details">
                                    <span class="confidence">Confidence: 78%</span>
                                    <span class="target">Breakout: TBD</span>
                                    <span class="stop-loss">Watch: $43,000</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(techModal);
    openModal('technicalAnalysisModal');
}

function applyOptimization() {
    showNotification('✨ Applying portfolio optimization...', 'success');
    setTimeout(() => {
        showNotification('🎉 Portfolio optimized successfully! Expected 18.2% improvement in risk-adjusted returns.', 'success');
        closeModal();
    }, 2000);
}

function executeArbitrage() {
    showNotification('🚀 Executing arbitrage opportunity...', 'success');
    setTimeout(() => {
        showNotification('💰 Arbitrage executed! Profit: $1,247.00 (2.8% return)', 'success');
        closeModal();
    }, 3000);
}

// Update dashboard with real-time AI insights
function updateAIInsights() {
    const sentimentElement = document.getElementById('aiSentiment');
    const volatilityElement = document.getElementById('volatilityScore');
    const scoreElement = document.getElementById('portfolioScore');
    
    if (sentimentElement) {
        const sentiment = Math.floor(Math.random() * 30 + 60); // 60-90%
        sentimentElement.textContent = `${sentiment}% Bullish`;
        const sentimentBar = document.querySelector('.sentiment-fill');
        if (sentimentBar) {
            sentimentBar.style.width = `${sentiment}%`;
        }
    }
    
    if (volatilityElement) {
        const volatility = (Math.random() * 3 + 5).toFixed(1); // 5.0-8.0
        volatilityElement.textContent = `${volatility}/10`;
    }
    
    if (scoreElement) {
        const score = (Math.random() * 2 + 7.5).toFixed(1); // 7.5-9.5
        scoreElement.textContent = `${score}/10`;
    }
}

// =============================================
// Export Functions
// =============================================
function exportScreenerResults() {
    const results = document.querySelectorAll('#screenerResults tr');
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Coin,Price,24h Change,7d Change,Market Cap,RSI\n';
    
    results.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 0) {
            const rowData = [
                cells[0].textContent.trim(),
                cells[1].textContent.trim(),
                cells[2].textContent.trim(),
                cells[3].textContent.trim(),
                cells[4].textContent.trim(),
                cells[5].textContent.trim()
            ];
            csvContent += rowData.join(',') + '\n';
        }
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'screener_results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Results exported successfully!', 'success');
}

// =============================================
// Real-time Updates for Advanced Features
// =============================================
function setupAdvancedUpdates() {
    // Update trading data every 5 seconds
    setInterval(() => {
        if (appState.currentSection === 'trading') {
            renderOrderBook();
            renderRecentTrades();
            updateTradingPrice();
        }
    }, 5000);
    
    // Update analytics every 30 seconds
    setInterval(() => {
        if (appState.currentSection === 'analytics') {
            renderAdvancedAnalytics();
        }
    }, 30000);
}

function updateTradingPrice() {
    const btcCoin = appState.coins.find(c => c.id === 'bitcoin');
    if (btcCoin) {
        document.getElementById('tradingPrice').textContent = formatCurrency(btcCoin.current_price);
        document.getElementById('obCurrentPrice').textContent = formatCurrency(btcCoin.current_price);
        
        const change = btcCoin.price_change_percentage_24h || 0;
        const changeElement = document.getElementById('tradingChange');
        changeElement.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
        changeElement.className = `price-change ${change >= 0 ? 'positive' : 'negative'}`;
    }
}

// =============================================
// Initialize App on Load
// =============================================
window.switchSection = switchSection;
window.openModal = openModal;
window.closeModal = closeModal;
window.addToWatchlist = addToWatchlist;
window.removeFromWatchlist = removeFromWatchlist;
window.openCoinDetail = openCoinDetail;
window.removeAlert = removeAlert;
window.removeTransaction = removeTransaction;
window.removeHolding = removeHolding;
window.connectExchange = connectExchange;
window.openAIAnalysisModal = openAIAnalysisModal;
window.openRiskAnalysisModal = openRiskAnalysisModal;
window.openAdvancedScreener = openAdvancedScreener;
window.cancelOrder = cancelOrder;
window.exportScreenerResults = exportScreenerResults;
window.quickDemoTrade = quickDemoTrade;
window.executeDemoTrade = executeDemoTrade;
window.closeDemoPosition = closeDemoPosition;
window.executeSignal = executeSignal;
window.openAdvancedAI = openAdvancedAI;
window.openPortfolioOptimizer = openPortfolioOptimizer;
window.openArbitrageCalculator = openArbitrageCalculator;
window.openTechnicalAnalysis = openTechnicalAnalysis;
window.applyOptimization = applyOptimization;
window.executeArbitrage = executeArbitrage;