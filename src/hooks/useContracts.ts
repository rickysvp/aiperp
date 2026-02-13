import { useContractRead, useContractWrite, useAccount } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';

// Contract ABIs (simplified - full ABIs should be imported from artifacts)
const ARENA_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
      {"internalType": "uint8", "name": "direction", "type": "uint8"},
      {"internalType": "uint256", "name": "leverage", "type": "uint256"},
      {"internalType": "uint256", "name": "collateral", "type": "uint256"},
      {"internalType": "uint256", "name": "takeProfit", "type": "uint256"},
      {"internalType": "uint256", "name": "stopLoss", "type": "uint256"},
      {"internalType": "string", "name": "asset", "type": "string"}
    ],
    "name": "deployAgent",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "exitAgent",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "userBalances",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "agents",
    "outputs": [
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
      {"internalType": "address", "name": "owner", "type": "address"},
      {"internalType": "uint8", "name": "direction", "type": "uint8"},
      {"internalType": "uint256", "name": "leverage", "type": "uint256"},
      {"internalType": "uint256", "name": "collateral", "type": "uint256"},
      {"internalType": "int256", "name": "pnl", "type": "int256"},
      {"internalType": "uint256", "name": "entryPrice", "type": "uint256"},
      {"internalType": "uint256", "name": "lastUpdateTime", "type": "uint256"},
      {"internalType": "uint8", "name": "status", "type": "uint8"},
      {"internalType": "uint256", "name": "takeProfit", "type": "uint256"},
      {"internalType": "uint256", "name": "stopLoss", "type": "uint256"},
      {"internalType": "string", "name": "asset", "type": "string"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

const NFT_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "_name", "type": "string"},
      {"internalType": "string", "name": "_bio", "type": "string"},
      {"internalType": "string", "name": "_strategy", "type": "string"},
      {"internalType": "string", "name": "_avatarSeed", "type": "string"},
      {"internalType": "uint8", "name": "_riskLevel", "type": "uint8"}
    ],
    "name": "mintAgent",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "getUserAgents",
    "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "agentAttributes",
    "outputs": [
      {"internalType": "string", "name": "name", "type": "string"},
      {"internalType": "string", "name": "bio", "type": "string"},
      {"internalType": "string", "name": "strategy", "type": "string"},
      {"internalType": "string", "name": "avatarSeed", "type": "string"},
      {"internalType": "uint8", "name": "riskLevel", "type": "uint8"},
      {"internalType": "uint256", "name": "mintTime", "type": "uint256"},
      {"internalType": "address", "name": "minter", "type": "address"},
      {"internalType": "bool", "name": "isActive", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

const ERC20_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "spender", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "owner", "type": "address"},
      {"internalType": "address", "name": "spender", "type": "address"}
    ],
    "name": "allowance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Contract addresses (to be updated after deployment)
export const CONTRACT_ADDRESSES = {
  monadTestnet: {
    ARENA: '0x...',
    AGENT_NFT: '0x...',
    PRICE_ORACLE: '0x...',
    USDT: '0x...',
  }
};

// USDT decimals
const USDT_DECIMALS = 6;

export function useArenaContract() {
  const { address } = useAccount();
  const addresses = CONTRACT_ADDRESSES.monadTestnet;

  // Read user balance
  const { data: userBalance } = useContractRead({
    address: addresses.ARENA,
    abi: ARENA_ABI,
    functionName: 'userBalances',
    args: address ? [address] : undefined,
    enabled: !!address,
  });

  // Deposit
  const { write: deposit, isLoading: isDepositing } = useContractWrite({
    address: addresses.ARENA,
    abi: ARENA_ABI,
    functionName: 'deposit',
  });

  // Withdraw
  const { write: withdraw, isLoading: isWithdrawing } = useContractWrite({
    address: addresses.ARENA,
    abi: ARENA_ABI,
    functionName: 'withdraw',
  });

  // Deploy Agent
  const { write: deployAgent, isLoading: isDeploying } = useContractWrite({
    address: addresses.ARENA,
    abi: ARENA_ABI,
    functionName: 'deployAgent',
  });

  // Exit Agent
  const { write: exitAgent, isLoading: isExiting } = useContractWrite({
    address: addresses.ARENA,
    abi: ARENA_ABI,
    functionName: 'exitAgent',
  });

  return {
    userBalance: userBalance ? formatUnits(userBalance, USDT_DECIMALS) : '0',
    deposit,
    withdraw,
    deployAgent,
    exitAgent,
    isDepositing,
    isWithdrawing,
    isDeploying,
    isExiting,
  };
}

export function useNFTContract() {
  const { address } = useAccount();
  const addresses = CONTRACT_ADDRESSES.monadTestnet;

  // Read user's agents
  const { data: userAgents } = useContractRead({
    address: addresses.AGENT_NFT,
    abi: NFT_ABI,
    functionName: 'getUserAgents',
    args: address ? [address] : undefined,
    enabled: !!address,
  });

  // Mint Agent
  const { write: mintAgent, isLoading: isMinting } = useContractWrite({
    address: addresses.AGENT_NFT,
    abi: NFT_ABI,
    functionName: 'mintAgent',
  });

  return {
    userAgents: userAgents || [],
    mintAgent,
    isMinting,
  };
}

export function useUSDTContract() {
  const { address } = useAccount();
  const addresses = CONTRACT_ADDRESSES.monadTestnet;

  // Read balance
  const { data: balance } = useContractRead({
    address: addresses.USDT,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    enabled: !!address,
  });

  // Read allowance
  const { data: allowance } = useContractRead({
    address: addresses.USDT,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, addresses.ARENA] : undefined,
    enabled: !!address,
  });

  // Approve
  const { write: approve, isLoading: isApproving } = useContractWrite({
    address: addresses.USDT,
    abi: ERC20_ABI,
    functionName: 'approve',
  });

  return {
    balance: balance ? formatUnits(balance, USDT_DECIMALS) : '0',
    allowance: allowance ? formatUnits(allowance, USDT_DECIMALS) : '0',
    approve,
    isApproving,
  };
}

// Helper function to parse USDT amount
export function parseUSDT(amount: string): bigint {
  return parseUnits(amount, USDT_DECIMALS);
}

// Helper function to format USDT amount
export function formatUSDT(amount: bigint): string {
  return formatUnits(amount, USDT_DECIMALS);
}
