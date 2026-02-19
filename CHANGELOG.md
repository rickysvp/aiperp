# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [2.2.0] - 2026-02-16

### Changed
- 🗑️ Removed WalletV2 Header component
- 🔄 Unified version numbering system across all files
- 🔗 Added local and production access links in VersionInfo

### Version Consistency
- package.json: 2.2.0
- VERSION.md: v2.2.0
- VersionInfo.tsx: v2.2.0
- CHANGELOG.md: 2.2.0

### Access Links
- Production: https://aiperp.fun
- Development: http://localhost:3000

## [2.1.1] - 2026-02-14

### Changed
- Updated Supabase integration

## [2.1.0] - 2026-02-14

### Added
- ✨ New neural network style Logo design
- 🎨 NFT style Agent card display
- 📊 24-hour PnL history chart
- 🔄 Agent withdraw/exit functionality (auto-exit when balance depleted, non-death mechanism)
- 🔗 Minted By Twitter link (clickable)
- 🚀 Optimized minting page (step indicator, visual enhancements)
- 🎯 Optimized deployment page (card layout, summary panel)

### Changed
- Improved Agent state management (IDLE/ACTIVE, removed LIQUIDATED)
- Optimized terminology: Collateral → Margin (more perp-friendly)
- Improved mobile responsive layout
- Added loading animations and transition effects

## [2.0.0] - 2026-02-14

### Changed
- Replaced Dynamic wallet with local Mock wallet system
- Simplified dependencies by removing @dynamic-labs packages

### Added
- Created WalletContext for local wallet management
- Auto-generate random wallet address on connect
- Initial balance: 10,000 USDT for testing
- Wallet state persistence in localStorage

## [1.3.0] - 2025-02-14

### Changed
- Bumped version to 1.3.0
- Updated header subtitle to display version number (v1.3.0)
- Updated build date to 2025-02-14

### Smart Contract Development
- Following AIperps Trae Vibe Prompt document for contract development
- Implementing 7-step Vibe development process
- Target: Monad Testnet deployment

## [1.2.0] - 2025-02-14

### Changed
- Replaced Dynamic wallet with local Mock wallet system
- Simplified dependencies by removing @dynamic-labs packages

### Added
- Created WalletContext for local wallet management
- Auto-generate random wallet address on connect
- Initial balance: 10,000 USDT for testing
- Wallet state persistence in localStorage

## [1.1.0] - 2025-02-11

### Added
- Initial release with Dynamic wallet integration
- AI Agent NFT minting system
- Arena battle mechanics
- Multi-asset support (BTC, ETH, SOL, MON)
- Real-time PnL tracking
- Leaderboard system
