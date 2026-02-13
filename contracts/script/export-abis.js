#!/usr/bin/env node

/**
 * Export contract ABIs from Foundry artifacts for frontend integration
 * Run with: node script/export-abis.js
 */

const fs = require('fs');
const path = require('path');

const CONTRACTS_DIR = path.join(__dirname, '../out');
const OUTPUT_DIR = path.join(__dirname, '../abis');

// Contract names to export
const CONTRACTS = [
  'AIperpArena',
  'AgentNFT',
  'PriceOracle',
  'MockUSDT'
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function exportABIs() {
  console.log('Exporting contract ABIs...\n');
  
  ensureDir(OUTPUT_DIR);
  
  for (const contractName of CONTRACTS) {
    const artifactPath = path.join(CONTRACTS_DIR, `${contractName}.sol`, `${contractName}.json`);
    
    if (!fs.existsSync(artifactPath)) {
      console.error(`✗ ${contractName}: Artifact not found at ${artifactPath}`);
      console.error('  Run "forge build" first to compile contracts');
      continue;
    }
    
    try {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      const abi = artifact.abi;
      
      // Export JSON
      const jsonPath = path.join(OUTPUT_DIR, `${contractName}.json`);
      fs.writeFileSync(jsonPath, JSON.stringify(abi, null, 2));
      
      // Export TypeScript
      const tsPath = path.join(OUTPUT_DIR, `${contractName}.ts`);
      const tsContent = `export const ${contractName}ABI = ${JSON.stringify(abi, null, 2)} as const;\n`;
      fs.writeFileSync(tsPath, tsContent);
      
      console.log(`✓ ${contractName}`);
      console.log(`  - JSON: ${jsonPath}`);
      console.log(`  - TypeScript: ${tsPath}`);
    } catch (error) {
      console.error(`✗ ${contractName}: ${error.message}`);
    }
  }
  
  // Generate index.ts
  const indexContent = CONTRACTS
    .map(name => `export { ${name}ABI } from './${name}';`)
    .join('\n') + '\n';
  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.ts'), indexContent);
  
  // Generate index.js
  const jsContent = CONTRACTS
    .map(name => `const ${name}ABI = require('./${name}.json');`)
    .join('\n') + '\n\nmodule.exports = {\n' + 
    CONTRACTS.map(name => `  ${name}ABI,`).join('\n') + '\n};\n';
  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.js'), jsContent);
  
  console.log('\n✅ ABI export completed!');
  console.log(`\nFiles exported to: ${OUTPUT_DIR}`);
  console.log('\nUsage:');
  console.log('  import { AIperpArenaABI } from \'./abis\';');
  console.log('  // or');
  console.log('  const { AIperpArenaABI } = require(\'./abis\');');
}

exportABIs();
