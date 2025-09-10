const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const NodeCache = require('node-cache');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const cache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes
const PORT = process.env.PORT || 5000;

// Enhanced Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com", "https://cdnjs.cloudflare.com"],
            connectSrc: ["'self'", "https:", "wss:"],
            frameSrc: ["'self'", "https://js.stripe.com"]
        }
    }
}));
app.use(compression());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? false : '*',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static('.', {
    setHeaders: (res, path) => {
        if (path.endsWith('.html') || path.endsWith('.css') || path.endsWith('.js')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    }
}));

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Enhanced Cryptocurrency Data APIs
app.get('/api/coins', async (req, res) => {
    try {
        const { page = 1, limit = 50, sort = 'market_cap_desc' } = req.query;
        const cacheKey = `coins_${page}_${limit}_${sort}`;

        let data = cache.get(cacheKey);
        if (!data) {
            // Fetch real cryptocurrency data
            data = await fetchRealCryptoData(parseInt(limit));
            cache.set(cacheKey, data, 120); // Cache for 2 minutes to avoid rate limits
        }

        res.json({
            data,
            pagination: {
                current_page: parseInt(page),
                per_page: parseInt(limit),
                total: 2500
            }
        });
    } catch (error) {
        console.error('Error fetching coins:', error);
        res.status(500).json({ error: 'Failed to fetch market data' });
    }
});

app.get('/api/coins/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const cacheKey = `coin_detail_${id}`;

        let data = cache.get(cacheKey);
        if (!data) {
            data = await fetchCoinDetail(id);
            cache.set(cacheKey, data, 60); // Cache for 1 minute
        }

        res.json(data);
    } catch (error) {
        console.error('Error fetching coin detail:', error);
        res.status(500).json({ error: 'Failed to fetch coin data' });
    }
});

// Real coin detail fetching function
async function fetchCoinDetail(coinId) {
    try {
        // Primary: Use CoinGecko detailed API
        const response = await fetch(
            `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=false&sparkline=true`
        );

        if (response.ok) {
            const coin = await response.json();
            console.log(`✅ Fetched detailed data for ${coinId} from CoinGecko`);
            
            return {
                id: coin.id,
                name: coin.name,
                symbol: coin.symbol,
                description: coin.description?.en || 'No description available',
                current_price: coin.market_data?.current_price?.usd || 0,
                market_cap: coin.market_data?.market_cap?.usd || 0,
                market_cap_rank: coin.market_cap_rank || 0,
                total_volume: coin.market_data?.total_volume?.usd || 0,
                high_24h: coin.market_data?.high_24h?.usd || 0,
                low_24h: coin.market_data?.low_24h?.usd || 0,
                price_change_24h: coin.market_data?.price_change_24h || 0,
                price_change_percentage_24h: coin.market_data?.price_change_percentage_24h || 0,
                price_change_percentage_7d: coin.market_data?.price_change_percentage_7d || 0,
                price_change_percentage_30d: coin.market_data?.price_change_percentage_30d || 0,
                circulating_supply: coin.market_data?.circulating_supply || 0,
                total_supply: coin.market_data?.total_supply || 0,
                max_supply: coin.market_data?.max_supply || 0,
                ath: coin.market_data?.ath?.usd || 0,
                ath_date: coin.market_data?.ath_date?.usd || new Date().toISOString(),
                atl: coin.market_data?.atl?.usd || 0,
                atl_date: coin.market_data?.atl_date?.usd || new Date().toISOString(),
                image: coin.image?.large || coin.image?.small || '',
                homepage: coin.links?.homepage?.[0] || '',
                blockchain_site: coin.links?.blockchain_site?.[0] || '',
                github: coin.links?.repos_url?.github?.[0] || '',
                twitter: coin.links?.twitter_screen_name || '',
                telegram: coin.links?.telegram_channel_identifier || '',
                reddit: coin.links?.subreddit_url || '',
                sparkline: coin.market_data?.sparkline_7d?.price || [],
                sentiment_votes_up_percentage: coin.sentiment_votes_up_percentage || 50,
                sentiment_votes_down_percentage: coin.sentiment_votes_down_percentage || 50,
                watchlist_portfolio_users: coin.watchlist_portfolio_users || 0,
                market_cap_fdv_ratio: coin.market_data?.market_cap_fdv_ratio || 0,
                mcap_to_tvl_ratio: coin.market_data?.mcap_to_tvl_ratio || 0,
                fdv_to_tvl_ratio: coin.market_data?.fdv_to_tvl_ratio || 0,
                last_updated: coin.last_updated || new Date().toISOString()
            };
        }

        // Fallback to generated data
        throw new Error('CoinGecko API failed');
        
    } catch (error) {
        console.error(`❌ Error fetching detail for ${coinId}:`, error);
        console.log('🔄 Using generated coin detail...');
        return generateCoinDetail(coinId);
    }
}

app.get('/api/coins/:id/chart', async (req, res) => {
    try {
        const { id } = req.params;
        const { days = 7 } = req.query;
        const cacheKey = `chart_${id}_${days}`;

        let data = cache.get(cacheKey);
        if (!data) {
            data = await fetchChartData(id, parseInt(days));
            cache.set(cacheKey, data, 300); // Cache for 5 minutes
        }

        res.json(data);
    } catch (error) {
        console.error('Error fetching chart data:', error);
        res.status(500).json({ error: 'Failed to fetch chart data' });
    }
});

// Real chart data fetching function
async function fetchChartData(coinId, days) {
    try {
        // Use CoinGecko market chart API
        const response = await fetch(
            `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=${days <= 1 ? 'hourly' : 'daily'}`
        );

        if (response.ok) {
            const data = await response.json();
            console.log(`✅ Fetched chart data for ${coinId} (${days} days) from CoinGecko`);
            
            const prices = data.prices || [];
            const volumes = data.total_volumes || [];
            const marketCaps = data.market_caps || [];
            
            return {
                prices: prices.map(([timestamp, price]) => ({
                    time: timestamp,
                    value: price
                })),
                volumes: volumes.map(([timestamp, volume]) => ({
                    time: timestamp,
                    value: volume
                })),
                market_caps: marketCaps.map(([timestamp, mcap]) => ({
                    time: timestamp,
                    value: mcap
                })),
                coin_id: coinId,
                days: days,
                last_updated: new Date().toISOString()
            };
        }

        throw new Error('CoinGecko chart API failed');
        
    } catch (error) {
        console.error(`❌ Error fetching chart data for ${coinId}:`, error);
        console.log('🔄 Using generated chart data...');
        return generateChartData(coinId, days);
    }
}

// Portfolio Management APIs
app.get('/api/portfolio/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        // In a real app, this would fetch from database
        const portfolio = {
            totalValue: 54729.82,
            totalPnL: 8945.67,
            pnlPercentage: 19.55,
            holdings: [
                {
                    id: 'bitcoin',
                    symbol: 'BTC',
                    name: 'Bitcoin',
                    amount: 1.2345,
                    averagePrice: 38500,
                    currentPrice: 45234,
                    value: 55863.15,
                    pnl: 8302.81,
                    pnlPercentage: 17.45
                },
                {
                    id: 'ethereum',
                    symbol: 'ETH',
                    name: 'Ethereum',
                    amount: 5.67,
                    averagePrice: 2800,
                    currentPrice: 3187,
                    value: 18070.29,
                    pnl: 2194.49,
                    pnlPercentage: 13.82
                }
            ]
        };
        res.json(portfolio);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch portfolio' });
    }
});

app.post('/api/portfolio/:userId/transaction', (req, res) => {
    try {
        const { userId } = req.params;
        const { coinId, type, amount, price, timestamp } = req.body;

        // Validate transaction data
        if (!coinId || !type || !amount || !price) {
            return res.status(400).json({ error: 'Missing required transaction data' });
        }

        // In a real app, save to database
        const transaction = {
            id: Date.now().toString(),
            userId,
            coinId,
            type,
            amount: parseFloat(amount),
            price: parseFloat(price),
            timestamp: timestamp || new Date().toISOString(),
            total: parseFloat(amount) * parseFloat(price)
        };

        res.json({ success: true, transaction });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add transaction' });
    }
});

// Price Alerts API
app.get('/api/alerts/:userId', (req, res) => {
    try {
        const alerts = [
            {
                id: '1',
                coinId: 'bitcoin',
                symbol: 'BTC',
                name: 'Bitcoin',
                condition: 'above',
                targetPrice: 50000,
                currentPrice: 45234,
                active: true,
                created: new Date().toISOString()
            }
        ];
        res.json(alerts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
});

app.post('/api/alerts/:userId', (req, res) => {
    try {
        const { coinId, condition, targetPrice } = req.body;
        const alert = {
            id: Date.now().toString(),
            coinId,
            condition,
            targetPrice: parseFloat(targetPrice),
            active: true,
            created: new Date().toISOString()
        };
        res.json({ success: true, alert });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create alert' });
    }
});

// User authentication and management
const users = new Map(); // In production, use a proper database
const sessions = new Map(); // In production, use Redis or similar

// Helper function to generate session tokens
function generateSessionToken() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// User registration endpoint
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, name, plan = 'free' } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, password, and name are required' });
        }

        // Check if user already exists
        const existingUser = Array.from(users.values()).find(user => user.email === email);
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Create new user
        const userId = Date.now().toString();
        const user = {
            id: userId,
            email,
            password, // In production, hash this password
            name,
            plan,
            createdAt: new Date().toISOString(),
            portfolio: {
                totalValue: 0,
                holdings: []
            },
            watchlist: [],
            alerts: []
        };

        users.set(userId, user);

        // Create session
        const sessionToken = generateSessionToken();
        sessions.set(sessionToken, { userId, createdAt: Date.now() });

        res.json({ 
            success: true, 
            user: { 
                id: user.id, 
                email: user.email, 
                name: user.name, 
                plan: user.plan 
            },
            sessionToken
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// User login endpoint
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const user = Array.from(users.values()).find(u => u.email === email && u.password === password);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Create session
        const sessionToken = generateSessionToken();
        sessions.set(sessionToken, { userId: user.id, createdAt: Date.now() });

        res.json({ 
            success: true, 
            user: { 
                id: user.id, 
                email: user.email, 
                name: user.name, 
                plan: user.plan 
            },
            sessionToken
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// User logout endpoint
app.post('/api/auth/logout', (req, res) => {
    try {
        const sessionToken = req.headers.authorization?.replace('Bearer ', '');
        if (sessionToken) {
            sessions.delete(sessionToken);
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Logout failed' });
    }
});

// Get user profile
app.get('/api/auth/profile', (req, res) => {
    try {
        const sessionToken = req.headers.authorization?.replace('Bearer ', '');
        const session = sessions.get(sessionToken);

        if (!session) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const user = users.get(session.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            plan: user.plan,
            portfolio: user.portfolio,
            watchlist: user.watchlist,
            alerts: user.alerts
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

// Update user portfolio
app.post('/api/portfolio/update', (req, res) => {
    try {
        const sessionToken = req.headers.authorization?.replace('Bearer ', '');
        const session = sessions.get(sessionToken);

        if (!session) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const user = users.get(session.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { portfolio } = req.body;
        user.portfolio = portfolio;
        users.set(session.userId, user);

        res.json({ success: true, portfolio: user.portfolio });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update portfolio' });
    }
});

// Mock payment endpoint for demo
app.post('/create-payment-intent', async (req, res) => {
    try {
        const { amount, currency = 'usd' } = req.body;

        // Simulate successful payment intent creation
        const paymentIntent = {
            id: 'pi_' + Math.random().toString(36).substr(2, 9),
            client_secret: 'pi_' + Math.random().toString(36).substr(2, 9) + '_secret_' + Math.random().toString(36).substr(2, 9),
            amount: amount,
            currency: currency,
            status: 'requires_payment_method'
        };

        res.json(paymentIntent);
    } catch (error) {
        console.error('Payment intent creation failed:', error);
        res.status(500).json({ error: 'Payment failed' });
    }
});

// Mock webhook endpoint
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    console.log('Webhook received');
    res.json({ received: true });
});

// API endpoints for enhanced features
app.get('/api/market-data', async (req, res) => {
    try {
        const cacheKey = 'global_market_data';
        let marketData = cache.get(cacheKey);

        if (!marketData) {
            marketData = await fetchGlobalMarketData();
            cache.set(cacheKey, marketData, 300); // Cache for 5 minutes
        }

        res.json(marketData);
    } catch (error) {
        console.error('Error fetching market data:', error);
        res.status(500).json({ error: 'Failed to fetch global market data' });
    }
});

app.get('/api/trending', (req, res) => {
    const trending = [
        { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', trend_score: 95 },
        { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', trend_score: 89 },
        { id: 'chainlink', name: 'Chainlink', symbol: 'LINK', trend_score: 82 }
    ];
    res.json(trending);
});

app.get('/api/defi-pools', (req, res) => {
    const pools = [
        {
            protocol: 'Uniswap V3',
            pair: 'ETH/USDC',
            apy: 12.5,
            tvl: 450000000,
            volume24h: 125000000
        },
        {
            protocol: 'Compound',
            pair: 'USDC',
            apy: 5.2,
            tvl: 2800000000,
            volume24h: 45000000
        },
        {
            protocol: 'Aave',
            pair: 'ETH',
            apy: 3.8,
            tvl: 1200000000,
            volume24h: 89000000
        }
    ];
    res.json(pools);
});

// WebSocket connection for real-time updates
wss.on('connection', function connection(ws) {
    console.log('Client connected via WebSocket');

    // Send initial market data
    try {
        const initialData = JSON.stringify({
            type: 'initial_data',
            data: Array.isArray(mockMarketData) ? mockMarketData : generateComprehensiveMarketData(10)
        });
        ws.send(initialData);
    } catch (error) {
        console.error('Failed to send initial data:', error);
    }

    // Send real-time updates with live data
    const interval = setInterval(async () => {
        if (ws.readyState === ws.OPEN) {
            try {
                // Fetch fresh data every 30 seconds
                const liveData = await fetchRealCryptoData(20); // Top 20 for real-time updates
                if (liveData && Array.isArray(liveData)) {
                    ws.send(JSON.stringify({
                        type: 'price_update',
                        data: liveData,
                        timestamp: new Date().toISOString()
                    }));
                    console.log('📊 Sent live price update to client');
                }
            } catch (error) {
                console.error('Failed to send live price update:', error);
                // Send mock data as fallback
                try {
                    const fallbackUpdate = generateMockPriceUpdate();
                    if (fallbackUpdate && Array.isArray(fallbackUpdate)) {
                        ws.send(JSON.stringify({
                            type: 'price_update',
                            data: fallbackUpdate,
                            timestamp: new Date().toISOString()
                        }));
                    }
                } catch (fallbackError) {
                    console.error('Fallback price update also failed:', fallbackError);
                    clearInterval(interval);
                }
            }
        } else {
            clearInterval(interval);
        }
    }, 30000); // Real-time updates every 30 seconds

    ws.on('close', () => {
        console.log('Client disconnected');
        clearInterval(interval);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        clearInterval(interval);
    });
});

// Broadcast real-time price updates every 60 seconds
setInterval(async () => {
    try {
        const realPriceUpdates = await fetchRealCryptoData(10);
        const priceUpdates = realPriceUpdates.map(coin => ({
            id: coin.id,
            price: coin.current_price,
            change: coin.price_change_percentage_24h,
            timestamp: Date.now()
        }));

        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'price_update',
                    data: priceUpdates
                }));
            }
        });
    } catch (error) {
        console.error('Error broadcasting price updates:', error);
    }
}, 60000);

// Real cryptocurrency data fetching
async function fetchRealCryptoData(limit = 50) {
    try {
        // Primary: Use CoinGecko API for more comprehensive data
        const coingeckoResponse = await fetch(
            `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=1h%2C24h%2C7d`
        );

        if (coingeckoResponse.ok) {
            const data = await coingeckoResponse.json();
            console.log('✅ Fetched live data from CoinGecko API');
            
            return data.map(coin => ({
                id: coin.id,
                name: coin.name,
                symbol: coin.symbol,
                current_price: coin.current_price || 0,
                market_cap_rank: coin.market_cap_rank || 0,
                market_cap: coin.market_cap || 0,
                total_volume: coin.total_volume || 0,
                price_change_percentage_24h: coin.price_change_percentage_24h || 0,
                price_change_percentage_7d_in_currency: coin.price_change_percentage_7d_in_currency || 0,
                price_change_percentage_1h_in_currency: coin.price_change_percentage_1h_in_currency || 0,
                high_24h: coin.high_24h || coin.current_price * 1.05,
                low_24h: coin.low_24h || coin.current_price * 0.95,
                image: coin.image || `https://static.coinpaprika.com/coin/${coin.id}/logo.png`,
                last_updated: coin.last_updated || new Date().toISOString(),
                circulating_supply: coin.circulating_supply || 0,
                total_supply: coin.total_supply || 0,
                max_supply: coin.max_supply || 0,
                ath: coin.ath || 0,
                atl: coin.atl || 0
            }));
        }

        // Fallback: Use CoinPaprika API
        console.log('⚠️  CoinGecko unavailable, trying CoinPaprika...');
        const paprikaResponse = await fetch(`https://api.coinpaprika.com/v1/tickers?limit=${limit}`);

        if (paprikaResponse.ok) {
            const data = await paprikaResponse.json();
            console.log('✅ Fetched live data from CoinPaprika API');
            
            return data.map((coin, index) => ({
                id: coin.id,
                name: coin.name,
                symbol: coin.symbol,
                current_price: coin.quotes?.USD?.price || 0,
                market_cap_rank: index + 1,
                market_cap: coin.quotes?.USD?.market_cap || 0,
                total_volume: coin.quotes?.USD?.volume_24h || 0,
                price_change_percentage_24h: coin.quotes?.USD?.percent_change_24h || 0,
                price_change_percentage_7d_in_currency: coin.quotes?.USD?.percent_change_7d || 0,
                price_change_percentage_1h_in_currency: coin.quotes?.USD?.percent_change_1h || 0,
                high_24h: coin.quotes?.USD?.price * 1.05 || 0,
                low_24h: coin.quotes?.USD?.price * 0.95 || 0,
                image: `https://static.coinpaprika.com/coin/${coin.id}/logo.png`,
                last_updated: coin.last_updated || new Date().toISOString(),
                circulating_supply: coin.circulating_supply || 0,
                total_supply: coin.total_supply || 0,
                max_supply: coin.max_supply || 0
            }));
        }

        throw new Error('All APIs failed');
        
    } catch (error) {
        console.error('❌ Error fetching real crypto data:', error);
        console.log('🔄 Using enhanced fallback data...');
        return generateComprehensiveMarketData(limit);
    }
}

async function fetchGlobalMarketData() {
    try {
        // Primary: Use CoinGecko Global API
        const coingeckoResponse = await fetch('https://api.coingecko.com/api/v3/global');
        
        if (coingeckoResponse.ok) {
            const result = await coingeckoResponse.json();
            const data = result.data;
            console.log('✅ Fetched global market data from CoinGecko');
            
            return {
                totalMarketCap: data.total_market_cap?.usd || 1230000000000,
                totalVolume: data.total_volume?.usd || 45670000000,
                btcDominance: data.market_cap_percentage?.btc || 48.5,
                ethDominance: data.market_cap_percentage?.eth || 18.2,
                fearGreedIndex: await fetchFearGreedIndex(),
                activeCoins: data.active_cryptocurrencies || 2847,
                exchanges: data.markets || 156,
                marketCapChange24h: data.market_cap_change_percentage_24h_usd || 0,
                ongoingICOs: data.ongoing_icos || 0,
                upcomingICOs: data.upcoming_icos || 0,
                endedICOs: data.ended_icos || 0
            };
        }

        // Fallback: Use CoinPaprika
        console.log('⚠️  CoinGecko global data unavailable, trying CoinPaprika...');
        const paprikaResponse = await fetch('https://api.coinpaprika.com/v1/global');

        if (paprikaResponse.ok) {
            const data = await paprikaResponse.json();
            console.log('✅ Fetched global market data from CoinPaprika');
            
            return {
                totalMarketCap: data.market_cap_usd || 1230000000000,
                totalVolume: data.volume_24h_usd || 45670000000,
                btcDominance: data.bitcoin_dominance_percentage || 48.5,
                ethDominance: 18.2, // Not available in CoinPaprika
                fearGreedIndex: await fetchFearGreedIndex(),
                activeCoins: data.cryptocurrencies_number || 2847,
                exchanges: data.markets_number || 156,
                marketCapChange24h: 0, // Not available
                ongoingICOs: 0,
                upcomingICOs: 0,
                endedICOs: 0
            };
        }

        throw new Error('All global market APIs failed');
        
    } catch (error) {
        console.error('❌ Error fetching global market data:', error);
        console.log('🔄 Using fallback global market data...');
        
        return {
            totalMarketCap: 1230000000000,
            totalVolume: 45670000000,
            btcDominance: 48.5,
            ethDominance: 18.2,
            fearGreedIndex: Math.floor(Math.random() * 100),
            activeCoins: 2847,
            exchanges: 156,
            marketCapChange24h: Math.random() * 10 - 5,
            ongoingICOs: 12,
            upcomingICOs: 24,
            endedICOs: 3456
        };
    }
}

// Fetch Fear & Greed Index from alternative API
async function fetchFearGreedIndex() {
    try {
        const response = await fetch('https://api.alternative.me/fng/?limit=1');
        if (response.ok) {
            const data = await response.json();
            return parseInt(data.data[0]?.value) || Math.floor(Math.random() * 100);
        }
    } catch (error) {
        console.debug('Fear & Greed Index API unavailable');
    }
    return Math.floor(Math.random() * 100);
}

// Helper functions for data generation (fallback)
function generateComprehensiveMarketData(limit) {
    const coins = [
        { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
        { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
        { id: 'binancecoin', name: 'BNB', symbol: 'BNB' },
        { id: 'cardano', name: 'Cardano', symbol: 'ADA' },
        { id: 'solana', name: 'Solana', symbol: 'SOL' },
        { id: 'polkadot', name: 'Polkadot', symbol: 'DOT' },
        { id: 'chainlink', name: 'Chainlink', symbol: 'LINK' },
        { id: 'litecoin', name: 'Litecoin', symbol: 'LTC' },
        { id: 'polygon', name: 'Polygon', symbol: 'MATIC' },
        { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX' }
    ];

    return coins.slice(0, limit).map((coin, index) => {
        const basePrice = Math.random() * 1000 + 10;
        const change24h = (Math.random() - 0.5) * 20;
        const change7d = (Math.random() - 0.5) * 40;

        return {
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol,
            current_price: basePrice,
            market_cap_rank: index + 1,
            market_cap: basePrice * Math.random() * 10000000,
            total_volume: basePrice * Math.random() * 1000000,
            price_change_percentage_24h: change24h,
            price_change_percentage_7d_in_currency: change7d,
            high_24h: basePrice * (1 + Math.random() * 0.1),
            low_24h: basePrice * (1 - Math.random() * 0.1),
            image: `https://assets.coingecko.com/coins/images/${index + 1}/small/${coin.id}.png`,
            last_updated: new Date().toISOString()
        };
    });
}

function generateCoinDetail(id) {
    const basePrice = Math.random() * 1000 + 10;
    return {
        id,
        name: id.charAt(0).toUpperCase() + id.slice(1),
        symbol: id.substring(0, 3).toUpperCase(),
        current_price: basePrice,
        market_cap: basePrice * Math.random() * 10000000,
        total_volume: basePrice * Math.random() * 1000000,
        price_change_percentage_24h: (Math.random() - 0.5) * 20,
        price_change_percentage_7d: (Math.random() - 0.5) * 40,
        price_change_percentage_30d: (Math.random() - 0.5) * 80,
        high_24h: basePrice * 1.1,
        low_24h: basePrice * 0.9,
        ath: basePrice * 2,
        ath_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        atl: basePrice * 0.3,
        atl_date: new Date(Date.now() - Math.random() * 1000 * 24 * 60 * 60 * 1000).toISOString(),
        description: `${id.charAt(0).toUpperCase() + id.slice(1)} is a revolutionary cryptocurrency that aims to transform the digital economy.`,
        links: {
            homepage: [`https://${id}.org`],
            blockchain_site: [`https://explorer.${id}.org`]
        }
    };
}

function generateChartData(id, days) {
    const data = [];
    const basePrice = Math.random() * 1000 + 10;
    const now = Date.now();
    const interval = (days * 24 * 60 * 60 * 1000) / 100;

    for (let i = 0; i < 100; i++) {
        const timestamp = now - (99 - i) * interval;
        const price = basePrice * (1 + (Math.random() - 0.5) * 0.1 * Math.sin(i / 10));
        data.push([timestamp, price]);
    }

    return { prices: data };
}

function generatePriceUpdates() {
    const coins = ['bitcoin', 'ethereum', 'binancecoin', 'cardano', 'solana'];
    return coins.map(id => ({
        id,
        price: Math.random() * 1000 + 10,
        change: (Math.random() - 0.5) * 10,
        timestamp: Date.now()
    }));
}

// Mock data for initial WebSocket message (replace with actual data fetching if needed)
const mockMarketData = generateComprehensiveMarketData(10); // Generate mock data for initial load

// Mock function to generate price updates for WebSocket
function generateMockPriceUpdate() {
    return generatePriceUpdates();
}

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 CryptoVision Pro server running on port ${PORT}`);
    console.log(`📱 Access the app at: http://0.0.0.0:${PORT}`);
    console.log(`🌐 Mobile access available`);
    console.log(`⚡ WebSocket enabled for real-time updates`);
});

// Real-time news endpoint
app.get("/api/news", async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const cacheKey = `crypto_news_${limit}`;
        
        let news = cache.get(cacheKey);
        if (!news) {
            news = await fetchCryptoNews(parseInt(limit));
            cache.set(cacheKey, news, 900); // Cache for 15 minutes
        }
        
        res.json(news);
    } catch (error) {
        console.error("Error fetching news:", error);
        res.status(500).json({ error: "Failed to fetch news data" });
    }
});

// Real crypto news function
async function fetchCryptoNews(limit = 10) {
    try {
        // Primary: Use CoinGecko news API
        const response = await fetch("https://api.coingecko.com/api/v3/news");
        
        if (response.ok) {
            const data = await response.json();
            console.log("✅ Fetched crypto news from CoinGecko");
            
            return data.data.slice(0, limit).map(article => ({
                id: article.id || Date.now() + Math.random(),
                title: article.title || "",
                description: article.description || "",
                url: article.url || "",
                image: article.thumb_2x || article.thumb || "",
                author: article.author || "CoinGecko",
                published_at: article.updated_at || new Date().toISOString(),
                source: "CoinGecko",
                sentiment: analyzeSentiment(article.title + " " + article.description)
            }));
        }
        
        throw new Error("CoinGecko news API failed");
        
    } catch (error) {
        console.error("❌ Error fetching crypto news:", error);
        console.log("🔄 Using fallback news data...");
        
        return generateFallbackNews(limit);
    }
}

// Simple sentiment analysis
function analyzeSentiment(text) {
    const positiveWords = ["rise", "surge", "bull", "gain", "profit", "up", "high", "moon", "pump", "rally", "breakout", "adoption"];
    const negativeWords = ["fall", "crash", "bear", "loss", "down", "low", "dump", "sell", "drop", "decline", "correction"];
    
    const lowerText = text.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveWords.forEach(word => {
        if (lowerText.includes(word)) positiveCount++;
    });
    
    negativeWords.forEach(word => {
        if (lowerText.includes(word)) negativeCount++;
    });
    
    if (positiveCount > negativeCount) return "bullish";
    if (negativeCount > positiveCount) return "bearish";
    return "neutral";
}

// Fallback news data
function generateFallbackNews(limit) {
    const fallbackNews = [
        {
            id: 1,
            title: "Bitcoin Reaches New Weekly High Amid Institutional Interest",
            description: "Major cryptocurrency Bitcoin has surged to new weekly highs as institutional investors continue to show strong interest in digital assets.",
            url: "https://example.com/news/1",
            image: "https://via.placeholder.com/300x200/f7931e/ffffff?text=BTC",
            author: "CryptoNews",
            published_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            source: "CryptoNews",
            sentiment: "bullish"
        },
        {
            id: 2,
            title: "Ethereum 2.0 Staking Rewards Show Strong Performance",
            description: "The Ethereum network continues to demonstrate robust staking rewards as more validators join the consensus mechanism.",
            url: "https://example.com/news/2",
            image: "https://via.placeholder.com/300x200/627eea/ffffff?text=ETH",
            author: "DeFiDaily",
            published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            source: "DeFiDaily",
            sentiment: "bullish"
        },
        {
            id: 3,
            title: "Regulatory Clarity Brings Confidence to Crypto Markets",
            description: "Recent regulatory developments have provided much-needed clarity for cryptocurrency markets and institutional adoption.",
            url: "https://example.com/news/3",
            image: "https://via.placeholder.com/300x200/2ecc71/ffffff?text=NEWS",
            author: "RegulationToday",
            published_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            source: "RegulationToday",
            sentiment: "bullish"
        },
        {
            id: 4,
            title: "DeFi Protocols Experience Record Trading Volumes",
            description: "Decentralized Finance protocols are seeing unprecedented trading volumes as user adoption continues to grow.",
            url: "https://example.com/news/4",
            image: "https://via.placeholder.com/300x200/9b59b6/ffffff?text=DeFi",
            author: "DeFiPulse",
            published_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            source: "DeFiPulse",
            sentiment: "bullish"
        },
        {
            id: 5,
            title: "NFT Market Shows Signs of Recovery and Innovation",
            description: "The NFT marketplace is experiencing a resurgence with new innovative projects and improved utility features.",
            url: "https://example.com/news/5",
            image: "https://via.placeholder.com/300x200/e74c3c/ffffff?text=NFT",
            author: "NFTInsider",
            published_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            source: "NFTInsider",
            sentiment: "neutral"
        }
    ];
    
    return fallbackNews.slice(0, limit);
}
