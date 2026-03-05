/**
 * Blockchain Integrity Verification System
 * 
 * This module provides comprehensive blockchain integrity verification,
 * including hash validation, chain consistency checks, and tamper detection.
 * 
 * @author Team Member 2 - Blockchain & Smart Contracts Developer
 * @version 1.0.0
 */

const { Blockchain, Block } = require('./blockchain');
const { localStorageBlockchain } = require('./blockchain-storage-local');

/**
 * Blockchain Integrity Verifier
 * Manages blockchain integrity checks and validation
 */
class BlockchainIntegrityVerifier {
  constructor() {
    this.verificationHistory = [];
    this.tamperDetection = [];
  }

  /**
   * Verify complete blockchain integrity
   * @param {Blockchain} blockchain - Blockchain to verify
   * @returns {Object} Verification result
   */
  async verifyBlockchainIntegrity(blockchain) {
    const verificationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      chainLength: blockchain.getChainLength(),
      verificationTime: new Date().toISOString(),
      checks: {
        hashValidation: false,
        chainConsistency: false,
        genesisBlock: false,
        timestampValidation: false,
        proofOfWork: false
      }
    };

    try {
      // 1. Verify genesis block
      const genesisResult = this.verifyGenesisBlock(blockchain.getChain()[0]);
      verificationResult.checks.genesisBlock = genesisResult.valid;
      if (!genesisResult.valid) {
        verificationResult.errors.push(...genesisResult.errors);
        verificationResult.isValid = false;
      }

      // 2. Verify hash validation for all blocks
      const hashResult = this.verifyHashValidation(blockchain.getChain());
      verificationResult.checks.hashValidation = hashResult.valid;
      if (!hashResult.valid) {
        verificationResult.errors.push(...hashResult.errors);
        verificationResult.isValid = false;
      }

      // 3. Verify chain consistency
      const chainResult = this.verifyChainConsistency(blockchain.getChain());
      verificationResult.checks.chainConsistency = chainResult.valid;
      if (!chainResult.valid) {
        verificationResult.errors.push(...chainResult.errors);
        verificationResult.isValid = false;
      }

      // 4. Verify timestamp validation
      const timestampResult = this.verifyTimestampValidation(blockchain.getChain());
      verificationResult.checks.timestampValidation = timestampResult.valid;
      if (!timestampResult.valid) {
        verificationResult.warnings.push(...timestampResult.warnings);
      }

      // 5. Verify proof of work
      const powResult = this.verifyProofOfWork(blockchain.getChain(), blockchain.difficulty);
      verificationResult.checks.proofOfWork = powResult.valid;
      if (!powResult.valid) {
        verificationResult.errors.push(...powResult.errors);
        verificationResult.isValid = false;
      }

      // 6. Check for tampering
      const tamperResult = this.detectTampering(blockchain.getChain());
      if (tamperResult.detected) {
        verificationResult.errors.push(...tamperResult.errors);
        verificationResult.isValid = false;
        this.tamperDetection.push({
          timestamp: new Date().toISOString(),
          detectedAt: tamperResult.detectedAt,
          affectedBlocks: tamperResult.affectedBlocks,
          tamperType: tamperResult.tamperType
        });
      }

      // Store verification result
      this.verificationHistory.push(verificationResult);

      return verificationResult;

    } catch (error) {
      console.error('Blockchain integrity verification failed:', error);
      verificationResult.isValid = false;
      verificationResult.errors.push(`Verification failed: ${error.message}`);
      return verificationResult;
    }
  }

  /**
   * Verify genesis block
   * @param {Block} genesisBlock - Genesis block
   * @returns {Object} Verification result
   */
  verifyGenesisBlock(genesisBlock) {
    const result = {
      valid: true,
      errors: []
    };

    // Check index
    if (genesisBlock.index !== 0) {
      result.valid = false;
      result.errors.push('Genesis block must have index 0');
    }

    // Check previous hash
    if (genesisBlock.previousHash !== '0') {
      result.valid = false;
      result.errors.push('Genesis block must have previousHash as "0"');
    }

    // Check hash calculation
    const calculatedHash = this.calculateBlockHash(genesisBlock);
    if (genesisBlock.hash !== calculatedHash) {
      result.valid = false;
      result.errors.push('Genesis block hash is invalid');
    }

    // Check data
    if (!genesisBlock.data || genesisBlock.data.type !== 'genesis') {
      result.valid = false;
      result.errors.push('Genesis block must have valid genesis data');
    }

    return result;
  }

  /**
   * Verify hash validation for all blocks
   * @param {Array} chain - Blockchain chain
   * @returns {Object} Verification result
   */
  verifyHashValidation(chain) {
    const result = {
      valid: true,
      errors: []
    };

    for (let i = 0; i < chain.length; i++) {
      const block = chain[i];
      const calculatedHash = this.calculateBlockHash(block);

      if (block.hash !== calculatedHash) {
        result.valid = false;
        result.errors.push(`Block ${i} has invalid hash. Expected: ${calculatedHash}, Got: ${block.hash}`);
      }
    }

    return result;
  }

  /**
   * Verify chain consistency
   * @param {Array} chain - Blockchain chain
   * @returns {Object} Verification result
   */
  verifyChainConsistency(chain) {
    const result = {
      valid: true,
      errors: []
    };

    for (let i = 1; i < chain.length; i++) {
      const currentBlock = chain[i];
      const previousBlock = chain[i - 1];

      // Check previous hash linkage
      if (currentBlock.previousHash !== previousBlock.hash) {
        result.valid = false;
        result.errors.push(`Block ${i} has invalid previousHash. Expected: ${previousBlock.hash}, Got: ${currentBlock.previousHash}`);
      }

      // Check index sequence
      if (currentBlock.index !== previousBlock.index + 1) {
        result.valid = false;
        result.errors.push(`Block ${i} has invalid index sequence. Expected: ${previousBlock.index + 1}, Got: ${currentBlock.index}`);
      }
    }

    return result;
  }

  /**
   * Verify timestamp validation
   * @param {Array} chain - Blockchain chain
   * @returns {Object} Verification result
   */
  verifyTimestampValidation(chain) {
    const result = {
      valid: true,
      warnings: []
    };

    for (let i = 1; i < chain.length; i++) {
      const currentBlock = chain[i];
      const previousBlock = chain[i - 1];

      const currentTime = new Date(currentBlock.timestamp);
      const previousTime = new Date(previousBlock.timestamp);

      // Check if timestamp is in the future
      if (currentTime > new Date()) {
        result.warnings.push(`Block ${i} has future timestamp: ${currentBlock.timestamp}`);
      }

      // Check if timestamp is before previous block
      if (currentTime < previousTime) {
        result.warnings.push(`Block ${i} has timestamp before previous block: ${currentBlock.timestamp} < ${previousBlock.timestamp}`);
      }
    }

    return result;
  }

  /**
   * Verify proof of work
   * @param {Array} chain - Blockchain chain
   * @param {number} difficulty - Mining difficulty
   * @returns {Object} Verification result
   */
  verifyProofOfWork(chain, difficulty) {
    const result = {
      valid: true,
      errors: []
    };

    const target = '0'.repeat(difficulty);

    for (let i = 0; i < chain.length; i++) {
      const block = chain[i];
      
      // Skip genesis block for PoW check
      if (i === 0) continue;

      // Check if hash meets difficulty requirement
      if (block.hash.substring(0, difficulty) !== target) {
        result.valid = false;
        result.errors.push(`Block ${i} does not meet proof of work requirement. Hash: ${block.hash}`);
      }

      // Verify nonce by recalculating hash
      const testBlock = new Block(block.index, block.timestamp, block.data, block.previousHash);
      testBlock.nonce = block.nonce;
      const testHash = testBlock.calculateHash();

      if (testHash !== block.hash) {
        result.valid = false;
        result.errors.push(`Block ${i} has invalid nonce. Recalculated hash: ${testHash}`);
      }
    }

    return result;
  }

  /**
   * Detect tampering in blockchain
   * @param {Array} chain - Blockchain chain
   * @returns {Object} Tamper detection result
   */
  detectTampering(chain) {
    const result = {
      detected: false,
      detectedAt: null,
      affectedBlocks: [],
      tamperType: null,
      errors: []
    };

    // Check for hash mismatches (data tampering)
    for (let i = 0; i < chain.length; i++) {
      const block = chain[i];
      const calculatedHash = this.calculateBlockHash(block);

      if (block.hash !== calculatedHash) {
        result.detected = true;
        result.detectedAt = new Date().toISOString();
        result.affectedBlocks.push(i);
        result.tamperType = 'data_tampering';
        result.errors.push(`Block ${i} data has been tampered with`);
      }
    }

    // Check for broken chain links (chain tampering)
    for (let i = 1; i < chain.length; i++) {
      const currentBlock = chain[i];
      const previousBlock = chain[i - 1];

      if (currentBlock.previousHash !== previousBlock.hash) {
        result.detected = true;
        result.detectedAt = new Date().toISOString();
        result.affectedBlocks.push(i);
        result.tamperType = 'chain_tampering';
        result.errors.push(`Block ${i} chain link has been broken`);
      }
    }

    return result;
  }

  /**
   * Calculate block hash
   * @param {Block} block - Block to calculate hash for
   * @returns {string} Calculated hash
   */
  calculateBlockHash(block) {
    const crypto = require('crypto');
    return crypto
      .createHash('sha256')
      .update(
        block.index +
        block.previousHash +
        block.timestamp +
        JSON.stringify(block.data) +
        block.nonce
      )
      .digest('hex');
  }

  /**
   * Verify specific block integrity
   * @param {Block} block - Block to verify
   * @param {Block} previousBlock - Previous block for comparison
   * @returns {Object} Verification result
   */
  verifyBlockIntegrity(block, previousBlock = null) {
    const result = {
      valid: true,
      errors: [],
      warnings: []
    };

    // Verify hash
    const calculatedHash = this.calculateBlockHash(block);
    if (block.hash !== calculatedHash) {
      result.valid = false;
      result.errors.push(`Block hash is invalid. Expected: ${calculatedHash}, Got: ${block.hash}`);
    }

    // Verify previous hash if previous block is provided
    if (previousBlock && block.previousHash !== previousBlock.hash) {
      result.valid = false;
      result.errors.push(`Block previous hash is invalid. Expected: ${previousBlock.hash}, Got: ${block.previousHash}`);
    }

    // Verify index sequence if previous block is provided
    if (previousBlock && block.index !== previousBlock.index + 1) {
      result.valid = false;
      result.errors.push(`Block index is invalid. Expected: ${previousBlock.index + 1}, Got: ${block.index}`);
    }

    // Check timestamp
    const blockTime = new Date(block.timestamp);
    if (blockTime > new Date()) {
      result.warnings.push(`Block timestamp is in the future: ${block.timestamp}`);
    }

    return result;
  }

  /**
   * Get verification history
   * @returns {Array} Verification history
   */
  getVerificationHistory() {
    return this.verificationHistory;
  }

  /**
   * Get tamper detection history
   * @returns {Array} Tamper detection history
   */
  getTamperDetectionHistory() {
    return this.tamperDetection;
  }

  /**
   * Clear verification history
   */
  clearVerificationHistory() {
    this.verificationHistory = [];
  }

  /**
   * Clear tamper detection history
   */
  clearTamperDetectionHistory() {
    this.tamperDetection = [];
  }

  /**
   * Generate integrity report
   * @param {Blockchain} blockchain - Blockchain to generate report for
   * @returns {Object} Integrity report
   */
  async generateIntegrityReport(blockchain) {
    const verificationResult = await this.verifyBlockchainIntegrity(blockchain);
    
    const report = {
      reportGeneratedAt: new Date().toISOString(),
      blockchainLength: blockchain.getChainLength(),
      integrityStatus: verificationResult.isValid ? 'PASS' : 'FAIL',
      verificationDetails: verificationResult,
      tamperDetection: this.tamperDetection,
      recommendations: this.generateRecommendations(verificationResult)
    };

    return report;
  }

  /**
   * Generate security recommendations
   * @param {Object} verificationResult - Verification result
   * @returns {Array} Recommendations
   */
  generateRecommendations(verificationResult) {
    const recommendations = [];

    if (!verificationResult.checks.hashValidation) {
      recommendations.push('Implement stronger hash validation mechanisms');
    }

    if (!verificationResult.checks.chainConsistency) {
      recommendations.push('Review chain consistency validation logic');
    }

    if (!verificationResult.checks.proofOfWork) {
      recommendations.push('Verify proof of work implementation and difficulty settings');
    }

    if (verificationResult.warnings.length > 0) {
      recommendations.push('Review and address timestamp validation warnings');
    }

    if (verificationResult.errors.length > 0) {
      recommendations.push('Investigate and resolve all integrity errors immediately');
    }

    if (this.tamperDetection.length > 0) {
      recommendations.push('Implement enhanced security measures to prevent tampering');
    }

    return recommendations;
  }
}

/**
 * Blockchain Monitor
 * Continuously monitors blockchain integrity
 */
class BlockchainMonitor {
  constructor() {
    this.verifier = new BlockchainIntegrityVerifier();
    this.monitoringInterval = null;
    this.monitoringActive = false;
  }

  /**
   * Start monitoring blockchain
   * @param {number} interval - Monitoring interval in milliseconds
   */
  startMonitoring(interval = 60000) { // Default: 1 minute
    if (this.monitoringActive) {
      console.log('Monitoring is already active');
      return;
    }

    this.monitoringInterval = setInterval(async () => {
      try {
        const blockchain = localStorageBlockchain.loadBlockchain();
        if (blockchain) {
          const result = await this.verifier.verifyBlockchainIntegrity(blockchain);
          
          if (!result.isValid) {
            console.warn('Blockchain integrity check failed:', result.errors);
            // Could trigger alerts or notifications here
          }
        }
      } catch (error) {
        console.error('Monitoring error:', error);
      }
    }, interval);

    this.monitoringActive = true;
    console.log(`Blockchain monitoring started with ${interval}ms interval`);
  }

  /**
   * Stop monitoring blockchain
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.monitoringActive = false;
    console.log('Blockchain monitoring stopped');
  }

  /**
   * Get current monitoring status
   * @returns {Object} Monitoring status
   */
  getMonitoringStatus() {
    return {
      active: this.monitoringActive,
      interval: this.monitoringInterval,
      lastVerification: this.verifier.getVerificationHistory().slice(-1)[0]
    };
  }
}

// Export integrity verification classes
module.exports = {
  BlockchainIntegrityVerifier,
  BlockchainMonitor
};