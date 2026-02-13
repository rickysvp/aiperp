import { ethers } from "hardhat";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

/**
 * Export contract ABIs for frontend integration
 * Run with: npx hardhat run scripts/export-abis.ts
 */
async function main() {
  const contractsDir = join(__dirname, "../abis");
  
  // Create abis directory if not exists
  if (!existsSync(contractsDir)) {
    mkdirSync(contractsDir, { recursive: true });
  }

  console.log("Exporting contract ABIs...\n");

  // Contract names to export
  const contracts = [
    "AIperpArena",
    "AgentNFT",
    "PriceOracle",
    "MockUSDT"
  ];

  for (const contractName of contracts) {
    try {
      const artifact = await ethers.getContractFactory(contractName);
      const { abi } = artifact;

      // Export full ABI
      const abiPath = join(contractsDir, `${contractName}.json`);
      writeFileSync(abiPath, JSON.stringify(abi, null, 2));

      // Export TypeScript version
      const tsPath = join(contractsDir, `${contractName}.ts`);
      const tsContent = `export const ${contractName}ABI = ${JSON.stringify(abi, null, 2)} as const;\n`;
      writeFileSync(tsPath, tsContent);

      console.log(`✓ ${contractName}`);
      console.log(`  - JSON: ${abiPath}`);
      console.log(`  - TypeScript: ${tsPath}`);
    } catch (error) {
      console.error(`✗ ${contractName}: ${error.message}`);
    }
  }

  // Generate index.ts
  const indexContent = contracts
    .map(name => `export { ${name}ABI } from './${name}';`)
    .join("\n");
  writeFileSync(join(contractsDir, "index.ts"), indexContent + "\n");

  // Generate index.js
  const jsContent = contracts
    .map(name => `const ${name}ABI = require('./${name}.json');`)
    .join("\n") + "\n\nmodule.exports = {\n" + 
    contracts.map(name => `  ${name}ABI,`).join("\n") + "\n};\n";
  writeFileSync(join(contractsDir, "index.js"), jsContent);

  console.log("\n✅ ABI export completed!");
  console.log(`\nFiles exported to: ${contractsDir}`);
  console.log("\nUsage:");
  console.log("  import { AIperpArenaABI } from './abis';");
  console.log("  // or");
  console.log("  const { AIperpArenaABI } = require('./abis');");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
