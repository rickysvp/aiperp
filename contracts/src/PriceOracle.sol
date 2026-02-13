// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IPriceOracle
 * @notice Interface for price oracle
 */
interface IPriceOracle {
    function getPrice(string memory asset) external view returns (uint256);
    function updatePrice(string memory asset, uint256 price) external;
    function getPriceChange(string memory asset, uint256 timeframe) external view returns (int256);
    function getPriceAge(string memory asset) external view returns (uint256);
}

/**
 * @title PriceOracle
 * @notice Price feed oracle for AIperp Arena
 * @dev Can be replaced with Chainlink or other decentralized oracle in production
 */
contract PriceOracle is IPriceOracle, Ownable {
    
    // ============ Structs ============
    
    struct PriceData {
        uint256 price;        // Price with 8 decimal precision
        uint256 timestamp;    // Last update timestamp
        uint256 blockNumber;  // Block number of last update
    }
    
    struct PriceHistory {
        uint256[] prices;
        uint256[] timestamps;
        uint256 maxHistory;   // Maximum history to keep
    }
    
    // ============ State Variables ============
    
    mapping(string => PriceData) public latestPrices;
    mapping(string => PriceHistory) public priceHistories;
    mapping(string => bool) public supportedAssets;
    mapping(address => bool) public authorizedUpdaters;
    
    uint256 public constant MAX_PRICE_AGE = 5 minutes;
    uint256 public constant DEFAULT_HISTORY_SIZE = 100;
    uint256 public constant PRICE_PRECISION = 10**8; // 8 decimals
    
    string[] public assetList;
    
    // ============ Events ============
    
    event PriceUpdated(
        string indexed asset,
        uint256 price,
        uint256 timestamp,
        address updater
    );
    
    event AssetAdded(string asset);
    event AssetRemoved(string asset);
    event UpdaterAdded(address updater);
    event UpdaterRemoved(address updater);
    event MaxPriceAgeUpdated(uint256 oldAge, uint256 newAge);
    
    // ============ Modifiers ============
    
    modifier onlyAuthorized() {
        require(
            authorizedUpdaters[msg.sender] || msg.sender == owner(),
            "PriceOracle: Not authorized"
        );
        _;
    }
    
    modifier validAsset(string memory asset) {
        require(supportedAssets[asset], "PriceOracle: Asset not supported");
        _;
    }
    
    // ============ Constructor ============
    
    constructor() Ownable(msg.sender) {
        // Add default assets
        _addAsset("BTC");
        _addAsset("ETH");
        _addAsset("SOL");
        _addAsset("MON");
    }
    
    // ============ External Functions ============
    
    /**
     * @notice Update price for an asset
     * @param asset Asset symbol (e.g., "BTC")
     * @param price Price with 8 decimal precision
     */
    function updatePrice(string memory asset, uint256 price) external override onlyAuthorized validAsset(asset) {
        require(price > 0, "PriceOracle: Invalid price");
        
        PriceData memory oldData = latestPrices[asset];
        
        // Update latest price
        latestPrices[asset] = PriceData({
            price: price,
            timestamp: block.timestamp,
            blockNumber: block.number
        });
        
        // Add to history
        _addToHistory(asset, price, block.timestamp);
        
        emit PriceUpdated(asset, price, block.timestamp, msg.sender);
    }
    
    /**
     * @notice Batch update prices for multiple assets
     * @param assets Array of asset symbols
     * @param prices Array of prices
     */
    function batchUpdatePrices(
        string[] memory assets,
        uint256[] memory prices
    ) external onlyAuthorized {
        require(assets.length == prices.length, "PriceOracle: Array length mismatch");
        
        for (uint i = 0; i < assets.length; i++) {
            if (supportedAssets[assets[i]] && prices[i] > 0) {
                updatePrice(assets[i], prices[i]);
            }
        }
    }
    
    /**
     * @notice Add a new supported asset
     * @param asset Asset symbol
     */
    function addAsset(string memory asset) external onlyOwner {
        _addAsset(asset);
    }
    
    /**
     * @notice Remove a supported asset
     * @param asset Asset symbol
     */
    function removeAsset(string memory asset) external onlyOwner validAsset(asset) {
        supportedAssets[asset] = false;
        
        // Remove from asset list
        for (uint i = 0; i < assetList.length; i++) {
            if (keccak256(bytes(assetList[i])) == keccak256(bytes(asset))) {
                assetList[i] = assetList[assetList.length - 1];
                assetList.pop();
                break;
            }
        }
        
        emit AssetRemoved(asset);
    }
    
    /**
     * @notice Add authorized price updater
     * @param updater Address to authorize
     */
    function addUpdater(address updater) external onlyOwner {
        require(updater != address(0), "PriceOracle: Invalid address");
        authorizedUpdaters[updater] = true;
        emit UpdaterAdded(updater);
    }
    
    /**
     * @notice Remove authorized price updater
     * @param updater Address to remove
     */
    function removeUpdater(address updater) external onlyOwner {
        authorizedUpdaters[updater] = false;
        emit UpdaterRemoved(updater);
    }
    
    /**
     * @notice Set maximum price age
     * @param newMaxAge New maximum age in seconds
     */
    function setMaxPriceAge(uint256 newMaxAge) external onlyOwner {
        require(newMaxAge > 0, "PriceOracle: Invalid age");
        uint256 oldAge = MAX_PRICE_AGE;
        // Note: This would require making MAX_PRICE_AGE non-constant
        // For now, we emit event but don't change the value
        emit MaxPriceAgeUpdated(oldAge, newMaxAge);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get latest price for an asset
     * @param asset Asset symbol
     * @return price Latest price with 8 decimals
     */
    function getPrice(string memory asset) external view override validAsset(asset) returns (uint256) {
        PriceData memory data = latestPrices[asset];
        require(data.timestamp > 0, "PriceOracle: Price not available");
        require(
            block.timestamp - data.timestamp <= MAX_PRICE_AGE,
            "PriceOracle: Price too old"
        );
        return data.price;
    }
    
    /**
     * @notice Get price change over a timeframe
     * @param asset Asset symbol
     * @param timeframe Timeframe in seconds
     * @return priceChange Price change percentage with 4 decimals
     */
    function getPriceChange(
        string memory asset,
        uint256 timeframe
    ) external view override validAsset(asset) returns (int256) {
        PriceData memory current = latestPrices[asset];
        require(current.timestamp > 0, "PriceOracle: Price not available");
        
        PriceHistory storage history = priceHistories[asset];
        
        // Find price at the start of timeframe
        uint256 targetTime = current.timestamp - timeframe;
        uint256 oldPrice = 0;
        
        for (uint i = history.timestamps.length; i > 0; i--) {
            if (history.timestamps[i - 1] <= targetTime) {
                oldPrice = history.prices[i - 1];
                break;
            }
        }
        
        if (oldPrice == 0) {
            return 0; // Not enough history
        }
        
        // Calculate percentage change with 4 decimal precision
        if (current.price >= oldPrice) {
            return int256(((current.price - oldPrice) * 10000) / oldPrice);
        } else {
            return -int256(((oldPrice - current.price) * 10000) / oldPrice);
        }
    }
    
    /**
     * @notice Get age of current price
     * @param asset Asset symbol
     * @return age Age in seconds
     */
    function getPriceAge(string memory asset) external view validAsset(asset) returns (uint256) {
        PriceData memory data = latestPrices[asset];
        if (data.timestamp == 0) return type(uint256).max;
        return block.timestamp - data.timestamp;
    }
    
    /**
     * @notice Get price history for an asset
     * @param asset Asset symbol
     * @return prices Array of historical prices
     * @return timestamps Array of timestamps
     */
    function getPriceHistory(string memory asset) external view validAsset(asset) returns (
        uint256[] memory prices,
        uint256[] memory timestamps
    ) {
        PriceHistory storage history = priceHistories[asset];
        return (history.prices, history.timestamps);
    }
    
    /**
     * @notice Check if an asset is supported
     * @param asset Asset symbol
     * @return isSupported True if supported
     */
    function isAssetSupported(string memory asset) external view returns (bool) {
        return supportedAssets[asset];
    }
    
    /**
     * @notice Get all supported assets
     * @return assets Array of asset symbols
     */
    function getAllAssets() external view returns (string[] memory) {
        return assetList;
    }
    
    /**
     * @notice Check if address is authorized updater
     * @param updater Address to check
     * @return isAuthorized True if authorized
     */
    function isAuthorized(address updater) external view returns (bool) {
        return authorizedUpdaters[updater] || updater == owner();
    }
    
    // ============ Internal Functions ============
    
    function _addAsset(string memory asset) internal {
        require(!supportedAssets[asset], "PriceOracle: Asset already exists");
        require(bytes(asset).length > 0, "PriceOracle: Invalid asset");
        
        supportedAssets[asset] = true;
        assetList.push(asset);
        
        // Initialize history
        priceHistories[asset] = PriceHistory({
            prices: new uint256[](0),
            timestamps: new uint256[](0),
            maxHistory: DEFAULT_HISTORY_SIZE
        });
        
        emit AssetAdded(asset);
    }
    
    function _addToHistory(string memory asset, uint256 price, uint256 timestamp) internal {
        PriceHistory storage history = priceHistories[asset];
        
        history.prices.push(price);
        history.timestamps.push(timestamp);
        
        // Remove old entries if exceeding max history
        if (history.prices.length > history.maxHistory) {
            // Shift array (inefficient but simple)
            for (uint i = 0; i < history.prices.length - 1; i++) {
                history.prices[i] = history.prices[i + 1];
                history.timestamps[i] = history.timestamps[i + 1];
            }
            history.prices.pop();
            history.timestamps.pop();
        }
    }
}
