import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import {
  AIperpArena,
  AgentNFT,
  PriceOracle,
  MockUSDT,
} from "../typechain-types";

describe("AIperpArena", function () {
  let arena: AIperpArena;
  let nft: AgentNFT;
  let oracle: PriceOracle;
  let usdt: MockUSDT;
  let owner: Signer;
  let user1: Signer;
  let user2: Signer;
  let feeRecipient: Signer;

  const MINT_COST = 100n * 10n ** 6n; // 100 USDT
  const DEPOSIT_AMOUNT = 1000n * 10n ** 6n; // 1000 USDT
  const COLLATERAL = 500n * 10n ** 6n; // 500 USDT
  const PRICE_PRECISION = 10n ** 8n;

  beforeEach(async function () {
    [owner, user1, user2, feeRecipient] = await ethers.getSigners();

    // Deploy USDT
    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    usdt = await MockUSDT.deploy();

    // Deploy Oracle
    const PriceOracle = await ethers.getContractFactory("PriceOracle");
    oracle = await PriceOracle.deploy();

    // Deploy NFT
    const AgentNFT = await ethers.getContractFactory("AgentNFT");
    nft = await AgentNFT.deploy(await usdt.getAddress(), "https://api.aiperp.fun/nft/");

    // Deploy Arena
    const AIperpArena = await ethers.getContractFactory("AIperpArena");
    arena = await AIperpArena.deploy(
      await usdt.getAddress(),
      await nft.getAddress(),
      await oracle.getAddress(),
      await feeRecipient.getAddress()
    );

    // Configure
    await nft.setArenaContract(await arena.getAddress());
    await oracle.addUpdater(await arena.getAddress());
    await oracle.addUpdater(await owner.getAddress());

    // Set initial prices
    await oracle.updatePrice("BTC", 65000n * PRICE_PRECISION);

    // Mint USDT to users
    await usdt.mint(await user1.getAddress(), DEPOSIT_AMOUNT * 10n);
    await usdt.mint(await user2.getAddress(), DEPOSIT_AMOUNT * 10n);

    // Approve spending
    await usdt.connect(user1).approve(await arena.getAddress(), DEPOSIT_AMOUNT * 10n);
    await usdt.connect(user1).approve(await nft.getAddress(), MINT_COST * 10n);
    await usdt.connect(user2).approve(await arena.getAddress(), DEPOSIT_AMOUNT * 10n);
    await usdt.connect(user2).approve(await nft.getAddress(), MINT_COST * 10n);
  });

  describe("Deployment", function () {
    it("Should deploy all contracts correctly", async function () {
      expect(await arena.usdtToken()).to.equal(await usdt.getAddress());
      expect(await arena.agentNFT()).to.equal(await nft.getAddress());
      expect(await arena.priceOracle()).to.equal(await oracle.getAddress());
    });
  });

  describe("Deposits and Withdrawals", function () {
    it("Should allow users to deposit USDT", async function () {
      await arena.connect(user1).deposit(DEPOSIT_AMOUNT);
      expect(await arena.userBalances(await user1.getAddress())).to.equal(DEPOSIT_AMOUNT);
    });

    it("Should allow users to withdraw USDT", async function () {
      await arena.connect(user1).deposit(DEPOSIT_AMOUNT);
      await arena.connect(user1).withdraw(DEPOSIT_AMOUNT / 2n);
      expect(await arena.userBalances(await user1.getAddress())).to.equal(DEPOSIT_AMOUNT / 2n);
    });

    it("Should not allow withdrawal more than balance", async function () {
      await arena.connect(user1).deposit(DEPOSIT_AMOUNT);
      await expect(arena.connect(user1).withdraw(DEPOSIT_AMOUNT * 2n)).to.be.revertedWith(
        "Arena: Insufficient balance"
      );
    });
  });

  describe("Agent Minting", function () {
    it("Should allow users to mint Agent NFT", async function () {
      await nft.connect(user1).mintAgent(
        "Test Agent",
        "A test agent",
        "Aggressive",
        "seed123",
        2 // MEDIUM risk
      );

      expect(await nft.ownerOf(1)).to.equal(await user1.getAddress());
      const attrs = await nft.agentAttributes(1);
      expect(attrs.name).to.equal("Test Agent");
      expect(attrs.riskLevel).to.equal(2);
    });

    it("Should charge correct mint cost", async function () {
      const balanceBefore = await usdt.balanceOf(await user1.getAddress());
      
      await nft.connect(user1).mintAgent(
        "Test Agent",
        "A test agent",
        "Aggressive",
        "seed123",
        2
      );

      const balanceAfter = await usdt.balanceOf(await user1.getAddress());
      expect(balanceBefore - balanceAfter).to.equal(MINT_COST);
    });
  });

  describe("Agent Deployment", function () {
    beforeEach(async function () {
      // Mint agent
      await nft.connect(user1).mintAgent(
        "Test Agent",
        "A test agent",
        "Aggressive",
        "seed123",
        2
      );

      // Deposit to arena
      await arena.connect(user1).deposit(DEPOSIT_AMOUNT);
    });

    it("Should allow deploying agent", async function () {
      await arena.connect(user1).deployAgent(
        1, // tokenId
        0, // LONG
        10, // 10x leverage
        COLLATERAL,
        0, // no take profit
        0, // no stop loss
        "BTC"
      );

      const agent = await arena.agents(1);
      expect(agent.owner).to.equal(await user1.getAddress());
      expect(agent.status).to.equal(1); // ACTIVE
      expect(agent.collateral).to.equal(COLLATERAL);
    });

    it("Should deduct collateral from user balance", async function () {
      const balanceBefore = await arena.userBalances(await user1.getAddress());
      
      await arena.connect(user1).deployAgent(1, 0, 10, COLLATERAL, 0, 0, "BTC");
      
      const balanceAfter = await arena.userBalances(await user1.getAddress());
      expect(balanceBefore - balanceAfter).to.equal(COLLATERAL);
    });

    it("Should not allow deploying with insufficient balance", async function () {
      await expect(
        arena.connect(user1).deployAgent(1, 0, 10, DEPOSIT_AMOUNT * 2n, 0, 0, "BTC")
      ).to.be.revertedWith("Arena: Insufficient balance");
    });

    it("Should not allow deploying below minimum collateral", async function () {
      await expect(
        arena.connect(user1).deployAgent(1, 0, 10, 10n * 10n ** 6n, 0, 0, "BTC")
      ).to.be.revertedWith("Arena: Below min collateral");
    });
  });

  describe("Battle Settlement", function () {
    beforeEach(async function () {
      // Setup agents for both sides
      await nft.connect(user1).mintAgent("Long Agent", "Long", "Aggressive", "seed1", 2);
      await nft.connect(user2).mintAgent("Short Agent", "Short", "Defensive", "seed2", 2);

      await arena.connect(user1).deposit(DEPOSIT_AMOUNT);
      await arena.connect(user2).deposit(DEPOSIT_AMOUNT);

      await arena.connect(user1).deployAgent(1, 0, 10, COLLATERAL, 0, 0, "BTC"); // LONG
      await arena.connect(user2).deployAgent(2, 1, 10, COLLATERAL, 0, 0, "BTC"); // SHORT
    });

    it("Should settle battle round", async function () {
      // Wait for round to end
      await ethers.provider.send("evm_increaseTime", [60]); // 1 minute
      await ethers.provider.send("evm_mine");

      // Price goes up 5% - LONG wins
      const newPrice = (65000n * PRICE_PRECISION * 105n) / 100n;
      
      await expect(arena.connect(owner).settleBattleRound("BTC", newPrice))
        .to.emit(arena, "BattleSettled");

      const round = await arena.battleRounds(1);
      expect(round.settled).to.be.true;
      expect(round.winningSide).to.equal(0); // LONG wins
    });

    it("Should start new round after settlement", async function () {
      await ethers.provider.send("evm_increaseTime", [60]);
      await ethers.provider.send("evm_mine");

      const newPrice = (65000n * PRICE_PRECISION * 105n) / 100n;
      await arena.connect(owner).settleBattleRound("BTC", newPrice);

      expect(await arena.currentRoundId()).to.equal(2);
      
      const newRound = await arena.battleRounds(2);
      expect(newRound.settled).to.be.false;
    });
  });

  describe("Agent Exit", function () {
    beforeEach(async function () {
      await nft.connect(user1).mintAgent("Test Agent", "Test", "Aggressive", "seed1", 2);
      await arena.connect(user1).deposit(DEPOSIT_AMOUNT);
      await arena.connect(user1).deployAgent(1, 0, 10, COLLATERAL, 0, 0, "BTC");
    });

    it("Should allow exiting agent", async function () {
      const balanceBefore = await arena.userBalances(await user1.getAddress());
      
      await arena.connect(user1).exitAgent(1);
      
      const agent = await arena.agents(1);
      expect(agent.status).to.equal(0); // IDLE
    });

    it("Should not allow non-owner to exit", async function () {
      await expect(arena.connect(user2).exitAgent(1)).to.be.revertedWith("Arena: Not owner");
    });
  });

  describe("Pause Functionality", function () {
    it("Should allow owner to pause and unpause", async function () {
      await arena.connect(owner).pause();
      expect(await arena.paused()).to.be.true;

      await arena.connect(owner).unpause();
      expect(await arena.paused()).to.be.false;
    });

    it("Should not allow deposits when paused", async function () {
      await arena.connect(owner).pause();
      await expect(arena.connect(user1).deposit(DEPOSIT_AMOUNT)).to.be.reverted;
    });

    it("Should not allow withdrawals when paused", async function () {
      await arena.connect(user1).deposit(DEPOSIT_AMOUNT);
      await arena.connect(owner).pause();
      await expect(arena.connect(user1).withdraw(DEPOSIT_AMOUNT / 2n)).to.be.reverted;
    });

    it("Should not allow non-owner to pause", async function () {
      await expect(arena.connect(user1).pause()).to.be.reverted;
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await nft.connect(user1).mintAgent("Test Agent", "Test", "Aggressive", "seed1", 2);
      await arena.connect(user1).deposit(DEPOSIT_AMOUNT);
      await arena.connect(user1).deployAgent(1, 0, 10, COLLATERAL, 0, 0, "BTC");
    });

    it("Should return current round stats", async function () {
      const stats = await arena.getCurrentRoundStats();
      expect(stats.longTotal).to.equal(COLLATERAL);
      expect(stats.shortTotal).to.equal(0);
      expect(stats.canSettle).to.be.false;
    });

    it("Should calculate agent PnL", async function () {
      const [pnl, shouldLiquidate] = await arena.calculateAgentCurrentPnL(1);
      expect(shouldLiquidate).to.be.false;
    });

    it("Should return all active agents", async function () {
      const activeAgents = await arena.getAllActiveAgents();
      expect(activeAgents.length).to.equal(1);
      expect(activeAgents[0]).to.equal(1);
    });

    it("Should check if asset is supported", async function () {
      expect(await arena.isAssetSupported("BTC")).to.be.true;
      expect(await arena.isAssetSupported("XYZ")).to.be.false;
    });
  });

  describe("Liquidation", function () {
    beforeEach(async function () {
      await nft.connect(user1).mintAgent("Test Agent", "Test", "Aggressive", "seed1", 2);
      await arena.connect(user1).deposit(DEPOSIT_AMOUNT);
      // Deploy with high leverage
      await arena.connect(user1).deployAgent(1, 0, 50, COLLATERAL, 0, 0, "BTC");
    });

    it("Should liquidate agent when price drops significantly", async function () {
      // Wait for round to end
      await ethers.provider.send("evm_increaseTime", [60]);
      await ethers.provider.send("evm_mine");

      // Price drops 50% - should trigger liquidation with 50x leverage
      const newPrice = (65000n * PRICE_PRECISION * 50n) / 100n;

      await arena.connect(owner).settleBattleRound("BTC", newPrice);

      const agent = await arena.agents(1);
      expect(agent.status).to.equal(2); // LIQUIDATED
    });
  });

  describe("Reward Distribution", function () {
    beforeEach(async function () {
      // Setup agents for both sides
      await nft.connect(user1).mintAgent("Long Agent", "Long", "Aggressive", "seed1", 2);
      await nft.connect(user2).mintAgent("Short Agent", "Short", "Defensive", "seed2", 2);

      await arena.connect(user1).deposit(DEPOSIT_AMOUNT);
      await arena.connect(user2).deposit(DEPOSIT_AMOUNT);

      await arena.connect(user1).deployAgent(1, 0, 10, COLLATERAL, 0, 0, "BTC");
      await arena.connect(user2).deployAgent(2, 1, 10, COLLATERAL, 0, 0, "BTC");
    });

    it("Should distribute rewards to winners", async function () {
      await ethers.provider.send("evm_increaseTime", [60]);
      await ethers.provider.send("evm_mine");

      // Price goes up 10% - LONG wins
      const newPrice = (65000n * PRICE_PRECISION * 110n) / 100n;

      await expect(arena.connect(owner).settleBattleRound("BTC", newPrice))
        .to.emit(arena, "LootDistributed");

      // Check that long agent received rewards
      const agent = await arena.agents(1);
      expect(agent.pnl).to.be.gt(0);
    });

    it("Should record loot events", async function () {
      await ethers.provider.send("evm_increaseTime", [60]);
      await ethers.provider.send("evm_mine");

      const newPrice = (65000n * PRICE_PRECISION * 110n) / 100n;
      await arena.connect(owner).settleBattleRound("BTC", newPrice);

      const loots = await arena.getRoundLoots(1);
      expect(loots.length).to.be.gt(0);
    });
  });
});
