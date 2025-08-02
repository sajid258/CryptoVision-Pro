const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
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
app.get('/api/market-data', (req, res) => {
    // Enhanced mock market data
    const marketData = {
        totalMarketCap: 1230000000000,
        totalVolume: 45670000000,
        btcDominance: 48.5,
        fearGreedIndex: Math.floor(Math.random() * 100),
        activeCoins: 2847,
        exchanges: 156,
        defiTvl: 125400000000
    };
    res.json(marketData);
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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`CryptoVision Pro server running on port ${PORT}`);
    console.log(`Access the app at: http://localhost:${PORT}`);
});