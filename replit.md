# CryptoVision Pro

## Overview
CryptoVision Pro is an advanced cryptocurrency dashboard and portfolio tracker that provides real-time market data, portfolio management, and trading insights. The application includes both a frontend interface and a Node.js/Express backend server.

## Recent Changes
- **September 10, 2025**: Fresh GitHub import successfully configured for Replit environment
- Dependencies installed and server configured for port 5000
- Workflow set up for automatic server startup with nodemon
- CORS enabled for proper proxy handling
- WebSocket connections tested and verified working
- Deployment configuration set for autoscale production deployment
- Application fully functional with real-time cryptocurrency data
- **Enhanced Features**: Complete backend API overhaul with WebSocket support
- **Mobile Optimization**: Full responsive design with touch-friendly interface
- **Real-time Updates**: Live price updates via WebSocket connections
- **Advanced Security**: Helmet, compression, and caching implemented
- **Portfolio Management**: Complete portfolio tracking with P&L calculations
- **Alert System**: Price alert management with real-time notifications

## Project Architecture
- **Frontend**: HTML5/CSS3/JavaScript single-page application
- **Backend**: Node.js with Express.js server
- **Port**: 5000 (configured for Replit)
- **Host**: 0.0.0.0 (required for Replit proxy)
- **APIs**: Mock cryptocurrency data endpoints, Stripe payment integration
- **Features**: 
  - Real-time market data dashboard
  - Portfolio tracking and management
  - Price alerts and notifications
  - Trading interface
  - AI-powered market analysis
  - Web3 integration support

## User Preferences
- Project structure: Single repository with frontend and backend combined
- Development server: nodemon for auto-restart during development
- Deployment: Express.js production server

## Files Structure
- `index.html` - Main application frontend
- `style.css` - Complete application styles
- `script.js` - Frontend JavaScript functionality
- `payment-server.js` - Express.js backend server
- `package.json` - Node.js dependencies and scripts
- `manifest.json` - PWA manifest for mobile support

## Development
- Run: `npm run dev` (nodemon for development)
- Production: `npm start` (direct Node.js)
- Dependencies: Express, CORS, Stripe, Nodemon

## Current State
The application is fully functional and running on port 5000. The server includes mock data for demonstration purposes and is ready for production deployment.