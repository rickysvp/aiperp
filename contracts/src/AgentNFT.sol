// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title AgentNFT
 * @notice AIperp Arena Agent NFT Contract
 * @dev ERC721 token representing AI trading agents
 */
contract AgentNFT is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable, ReentrancyGuard {
    
    // ============ Structs ============
    
    struct AgentAttributes {
        string name;
        string bio;
        string strategy;
        string avatarSeed;
        uint8 riskLevel; // 1-4: LOW, MEDIUM, HIGH, EXTREME
        uint256 mintTime;
        address minter;
        bool isActive;
    }
    
    // ============ State Variables ============
    
    mapping(uint256 => AgentAttributes) public agentAttributes;
    mapping(address => uint256[]) public userAgents;
    mapping(uint256 => uint256) public agentIndexInUserArray;
    
    uint256 public constant MINT_COST = 100 * 10**6; // 100 USDT (6 decimals)
    uint256 public nextTokenId = 1;
    
    address public arenaContract;
    address public usdtToken;
    
    string public baseTokenURI;
    
    // ============ Events ============
    
    event AgentMinted(
        uint256 indexed tokenId,
        address indexed minter,
        string name,
        uint8 riskLevel,
        uint256 cost
    );
    
    event AgentStatusUpdated(
        uint256 indexed tokenId,
        bool isActive
    );
    
    event ArenaContractUpdated(
        address indexed oldArena,
        address indexed newArena
    );
    
    // ============ Modifiers ============
    
    modifier onlyArena() {
        require(msg.sender == arenaContract, "AgentNFT: Only arena can call");
        _;
    }
    
    // ============ Constructor ============
    
    constructor(
        address _usdtToken,
        string memory _baseTokenURI
    ) ERC721("AIperp Agent", "AIAGENT") Ownable(msg.sender) {
        require(_usdtToken != address(0), "AgentNFT: Invalid USDT address");
        usdtToken = _usdtToken;
        baseTokenURI = _baseTokenURI;
    }
    
    // ============ External Functions ============
    
    /**
     * @notice Mint a new Agent NFT
     * @param _name Agent name
     * @param _bio Agent bio/description
     * @param _strategy Trading strategy
     * @param _avatarSeed Seed for avatar generation
     * @param _riskLevel Risk level (1-4)
     * @return tokenId The ID of the newly minted token
     */
    function mintAgent(
        string memory _name,
        string memory _bio,
        string memory _strategy,
        string memory _avatarSeed,
        uint8 _riskLevel
    ) external nonReentrant returns (uint256) {
        require(_riskLevel >= 1 && _riskLevel <= 4, "AgentNFT: Invalid risk level");
        require(bytes(_name).length > 0 && bytes(_name).length <= 32, "AgentNFT: Invalid name length");
        
        // Transfer USDT payment
        IERC20(usdtToken).transferFrom(msg.sender, address(this), MINT_COST);
        
        uint256 tokenId = nextTokenId++;
        _safeMint(msg.sender, tokenId);
        
        agentAttributes[tokenId] = AgentAttributes({
            name: _name,
            bio: _bio,
            strategy: _strategy,
            avatarSeed: _avatarSeed,
            riskLevel: _riskLevel,
            mintTime: block.timestamp,
            minter: msg.sender,
            isActive: false
        });
        
        // Track user's agents
        agentIndexInUserArray[tokenId] = userAgents[msg.sender].length;
        userAgents[msg.sender].push(tokenId);
        
        emit AgentMinted(tokenId, msg.sender, _name, _riskLevel, MINT_COST);
        return tokenId;
    }
    
    /**
     * @notice Update agent active status (called by Arena)
     * @param tokenId The agent token ID
     * @param isActive New active status
     */
    function updateAgentStatus(uint256 tokenId, bool isActive) external onlyArena {
        require(_exists(tokenId), "AgentNFT: Agent does not exist");
        agentAttributes[tokenId].isActive = isActive;
        emit AgentStatusUpdated(tokenId, isActive);
    }
    
    /**
     * @notice Set the arena contract address
     * @param _arenaContract New arena contract address
     */
    function setArenaContract(address _arenaContract) external onlyOwner {
        require(_arenaContract != address(0), "AgentNFT: Invalid address");
        address oldArena = arenaContract;
        arenaContract = _arenaContract;
        emit ArenaContractUpdated(oldArena, _arenaContract);
    }
    
    /**
     * @notice Update base token URI
     * @param _baseTokenURI New base URI
     */
    function setBaseTokenURI(string memory _baseTokenURI) external onlyOwner {
        baseTokenURI = _baseTokenURI;
    }
    
    /**
     * @notice Withdraw USDT from contract
     * @param amount Amount to withdraw
     */
    function withdrawUSDT(uint256 amount) external onlyOwner {
        IERC20(usdtToken).transfer(owner(), amount);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get all agents owned by a user
     * @param user User address
     * @return Array of token IDs
     */
    function getUserAgents(address user) external view returns (uint256[] memory) {
        return userAgents[user];
    }
    
    /**
     * @notice Get detailed info for multiple agents
     * @param tokenIds Array of token IDs
     * @return Array of agent attributes
     */
    function getAgentsInfo(uint256[] memory tokenIds) 
        external 
        view 
        returns (AgentAttributes[] memory) 
    {
        AgentAttributes[] memory infos = new AgentAttributes[](tokenIds.length);
        for (uint i = 0; i < tokenIds.length; i++) {
            infos[i] = agentAttributes[tokenIds[i]];
        }
        return infos;
    }
    
    /**
     * @notice Check if agent exists
     */
    function exists(uint256 tokenId) external view returns (bool) {
        return _exists(tokenId);
    }
    
    // ============ Internal Functions ============
    
    function _exists(uint256 tokenId) internal view returns (bool) {
        return tokenId > 0 && tokenId < nextTokenId;
    }
    
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        address from = super._update(to, tokenId, auth);
        
        // Update userAgents tracking
        if (from != address(0)) {
            _removeAgentFromUser(from, tokenId);
        }
        if (to != address(0)) {
            agentIndexInUserArray[tokenId] = userAgents[to].length;
            userAgents[to].push(tokenId);
        }
        
        return from;
    }
    
    function _removeAgentFromUser(address user, uint256 tokenId) internal {
        uint256 index = agentIndexInUserArray[tokenId];
        uint256 lastIndex = userAgents[user].length - 1;
        
        if (index != lastIndex) {
            uint256 lastTokenId = userAgents[user][lastIndex];
            userAgents[user][index] = lastTokenId;
            agentIndexInUserArray[lastTokenId] = index;
        }
        
        userAgents[user].pop();
        delete agentIndexInUserArray[tokenId];
    }
    
    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }
    
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
