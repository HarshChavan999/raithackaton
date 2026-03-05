/**
 * Core Blockchain Implementation
 * 
 * This module provides the core blockchain data structures and functionality
 * for the VaidyaChain system, including Block and Blockchain classes.
 * 
 * @author Team Member 2 - Blockchain & Smart Contracts Developer
 * @version 1.0.0
 */

const crypto = require('crypto');

/**
 * Block Class
 * Represents a single block in the blockchain
 */
class Block {
  constructor(index, timestamp, data, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
    this.nonce = 0;
  }

  /**
   * Calculate hash for the block
   * @returns {string} SHA256 hash of the block
   */
  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(
        this.index +
        this.previousHash +
        this.timestamp +
        JSON.stringify(this.data) +
        this.nonce
      )
      .digest('hex');
  }

  /**
   * Mine block with proof of work
   * @param {number} difficulty - Mining difficulty
   */
  mineBlock(difficulty) {
    const target = '0'.repeat(difficulty);
    
    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    
    console.log(`Block mined: ${this.hash}`);
  }
}

/**
 * Blockchain Class
 * Manages the chain of blocks
 */
class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 2;
    this.pendingTransactions = [];
    this.batchIndex = new Map(); // Fast batch lookup
  }

  /**
   * Create genesis block
   * @returns {Block} Genesis block
   */
  createGenesisBlock() {
    return new Block(0, new Date().toISOString(), {
      type: 'genesis',
      data: 'Genesis Block - VaidyaChain'
    }, '0');
  }

  /**
   * Get the latest block
   * @returns {Block} Latest block
   */
  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Add a new block to the chain
   * @param {Block} newBlock - Block to add
   */
  addBlock(newBlock) {
    newBlock.previousHash = this.getLatestBlock().hash;
    newBlock.mineBlock(this.difficulty);
    this.chain.push(newBlock);
    
    // Update batch index if block contains batch data
    if (newBlock.data.batchId) {
      this.batchIndex.set(newBlock.data.batchId, newBlock.index);
    }
  }

  /**
   * Create and add a new block with transaction data
   * @param {Object} transactionData - Transaction data
   * @returns {Block} Created block
   */
  createBlock(transactionData) {
    const newBlock = new Block(
      this.chain.length,
      new Date().toISOString(),
      transactionData,
      this.getLatestBlock().hash
    );
    
    this.addBlock(newBlock);
    return newBlock;
  }

  /**
   * Check if blockchain is valid
   * @returns {boolean} True if valid
   */
  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // Check if current block hash is valid
      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }

      // Check if previous hash matches
      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get blockchain length
   * @returns {number} Chain length
   */
  getChainLength() {
    return this.chain.length;
  }

  /**
   * Get block by index
   * @param {number} index - Block index
   * @returns {Block|null} Block or null if not found
   */
  getBlock(index) {
    if (index >= 0 && index < this.chain.length) {
      return this.chain[index];
    }
    return null;
  }

  /**
   * Get block by hash
   * @param {string} hash - Block hash
   * @returns {Block|null} Block or null if not found
   */
  getBlockByHash(hash) {
    return this.chain.find(block => block.hash === hash) || null;
  }

  /**
   * Get block by batch ID
   * @param {string} batchId - Batch ID
   * @returns {Block|null} Block or null if not found
   */
  getBlockByBatchId(batchId) {
    const blockIndex = this.batchIndex.get(batchId);
    if (blockIndex !== undefined) {
      return this.chain[blockIndex];
    }
    return null;
  }

  /**
   * Get all blocks
   * @returns {Array} All blocks
   */
  getAllBlocks() {
    return this.chain;
  }

  /**
   * Get blockchain data as JSON
   * @returns {Object} Blockchain data
   */
  getBlockchainData() {
    return {
      chain: this.chain,
      length: this.chain.length,
      difficulty: this.difficulty,
      batchIndex: Object.fromEntries(this.batchIndex)
    };
  }

  /**
   * Replace chain if valid and longer
   * @param {Blockchain} newChain - New blockchain
   */
  replaceChain(newChain) {
    if (newChain.getChainLength() > this.chain.length && newChain.isChainValid()) {
      this.chain = newChain.chain;
      this.batchIndex = newChain.batchIndex;
      console.log('Chain replaced with longer valid chain');
    } else {
      console.log('New chain is not longer or invalid');
    }
  }

  /**
   * Export blockchain to JSON
   * @returns {string} JSON string
   */
  export() {
    return JSON.stringify(this.getBlockchainData(), null, 2);
  }

  /**
   * Import blockchain from JSON
   * @param {string} jsonString - JSON string
   */
  import(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      this.chain = data.chain.map(blockData => {
        const block = new Block(
          blockData.index,
          blockData.timestamp,
          blockData.data,
          blockData.previousHash
        );
        block.hash = blockData.hash;
        block.nonce = blockData.nonce;
        return block;
      });
      this.batchIndex = new Map(Object.entries(data.batchIndex));
      this.difficulty = data.difficulty;
    } catch (error) {
      console.error('Error importing blockchain:', error);
      throw new Error('Invalid blockchain data');
    }
  }
}

// Export blockchain classes
module.exports = {
  Block,
  Blockchain
};