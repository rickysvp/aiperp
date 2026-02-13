// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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
