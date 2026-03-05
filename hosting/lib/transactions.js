/**
 * Transaction Types Implementation
 * 
 * This module defines and implements different transaction types for the
 * VaidyaChain blockchain system, including validation and processing logic.
 * 
 * @author Team Member 2 - Blockchain & Smart Contracts Developer
 * @version 1.0.0
 */

const { Block, Blockchain } = require('./blockchain');
const { transactionValidator } = require('./transaction-validation');

/**
 * Transaction Types
 */
const TRANSACTION_TYPES = {
  COLLECTION: 'collection',
  LAB_TEST: 'lab-test',
  MANUFACTURING: 'manufacturing',
  ORDER: 'order',
  INSURANCE: 'insurance'
};

/**
 * Transaction Class
 * Base class for all transaction types
 */
class Transaction {
  constructor(type, data, userId) {
    this.type = type;
    this.data = data;
    this.userId = userId;
    this.timestamp = new Date().toISOString();
    this.transactionId = this.generateTransactionId();
    this.blockchainHash = null;
  }

  /**
   * Generate unique transaction ID
   * @returns {string} Transaction ID
   */
  generateTransactionId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `${this.type}_${timestamp}_${random}`;
  }

  /**
   * Validate transaction
   * @returns {Object} Validation result
   */
  async validate() {
    return await transactionValidator.validateTransaction({
      type: this.type,
      data: this.data,
      batchId: this.data.batchId,
      userId: this.userId
    });
  }

  /**
   * Process transaction
   * @returns {Object} Processing result
   */
  async process() {
    const validation = await this.validate();
    
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
        transactionId: this.transactionId
      };
    }

    return {
      success: true,
      transactionId: this.transactionId,
      data: this.data,
      type: this.type,
      timestamp: this.timestamp
    };
  }
}

/**
 * Collection Transaction
 * Represents herb collection by farmers
 */
class CollectionTransaction extends Transaction {
  constructor(data, userId) {
    super(TRANSACTION_TYPES.COLLECTION, data, userId);
  }

  /**
   * Validate collection transaction
   * @returns {Object} Validation result
   */
  async validate() {
    const baseValidation = await super.validate();
    
    if (!baseValidation.valid) {
      return baseValidation;
    }

    const errors = [];
    
    // Additional collection-specific validation
    if (!this.data.herbType || typeof this.data.herbType !== 'string') {
      errors.push('Invalid herb type');
    }
    
    if (!this.data.quantity || this.data.quantity <= 0) {
      errors.push('Invalid quantity');
    }
    
    if (!this.data.location || typeof this.data.location !== 'string') {
      errors.push('Invalid location');
    }
    
    if (!this.data.batchId || typeof this.data.batchId !== 'string') {
      errors.push('Invalid batch ID');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Lab Test Transaction
 * Represents quality testing by laboratories
 */
class LabTestTransaction extends Transaction {
  constructor(data, userId) {
    super(TRANSACTION_TYPES.LAB_TEST, data, userId);
  }

  /**
   * Validate lab test transaction
   * @returns {Object} Validation result
   */
  async validate() {
    const baseValidation = await super.validate();
    
    if (!baseValidation.valid) {
      return baseValidation;
    }

    const errors = [];
    
    // Additional lab test-specific validation
    if (!this.data.testType || !['purity', 'potency', 'contamination', 'identity'].includes(this.data.testType)) {
      errors.push('Invalid test type');
    }
    
    if (!this.data.results || typeof this.data.results !== 'object') {
      errors.push('Invalid test results');
    }
    
    if (!this.data.standards || typeof this.data.standards !== 'object') {
      errors.push('Invalid quality standards');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Manufacturing Transaction
 * Represents product manufacturing by manufacturers
 */
class ManufacturingTransaction extends Transaction {
  constructor(data, userId) {
    super(TRANSACTION_TYPES.MANUFACTURING, data, userId);
  }

  /**
   * Validate manufacturing transaction
   * @returns {Object} Validation result
   */
  async validate() {
    const baseValidation = await super.validate();
    
    if (!baseValidation.valid) {
      return baseValidation;
    }

    const errors = [];
    
    // Additional manufacturing-specific validation
    if (!this.data.productType || typeof this.data.productType !== 'string') {
      errors.push('Invalid product type');
    }
    
    if (!this.data.quantity || this.data.quantity <= 0) {
      errors.push('Invalid manufacturing quantity');
    }
    
    if (!this.data.processSteps || !Array.isArray(this.data.processSteps)) {
      errors.push('Invalid process steps');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Order Transaction
 * Represents product orders by consumers
 */
class OrderTransaction extends Transaction {
  constructor(data, userId) {
    super(TRANSACTION_TYPES.ORDER, data, userId);
  }

  /**
   * Validate order transaction
   * @returns {Object} Validation result
   */
  async validate() {
    const baseValidation = await super.validate();
    
    if (!baseValidation.valid) {
      return baseValidation;
    }

    const errors = [];
    
    // Additional order-specific validation
    if (!this.data.productId || typeof this.data.productId !== 'string') {
      errors.push('Invalid product ID');
    }
    
    if (!this.data.quantity || this.data.quantity <= 0) {
      errors.push('Invalid order quantity');
    }
    
    if (!this.data.totalAmount || this.data.totalAmount <= 0) {
      errors.push('Invalid total amount');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Insurance Transaction
 * Represents insurance claims and policies
 */
class InsuranceTransaction extends Transaction {
  constructor(data, userId) {
    super(TRANSACTION_TYPES.INSURANCE, data, userId);
  }

  /**
   * Validate insurance transaction
   * @returns {Object} Validation result
   */
  async validate() {
    const baseValidation = await super.validate();
    
    if (!baseValidation.valid) {
      return baseValidation;
    }

    const errors = [];
    
    // Additional insurance-specific validation
    if (!this.data.policyId || typeof this.data.policyId !== 'string') {
      errors.push('Invalid policy ID');
    }
    
    if (!this.data.incidentType || !['theft', 'damage', 'contamination', 'delay'].includes(this.data.incidentType)) {
      errors.push('Invalid incident type');
    }
    
    if (!this.data.description || typeof this.data.description !== 'string') {
      errors.push('Invalid incident description');
    }
    
    if (this.data.estimatedLoss < 0) {
      errors.push('Invalid estimated loss');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Transaction Factory
 * Creates appropriate transaction instances based on type
 */
class TransactionFactory {
  /**
   * Create transaction instance
   * @param {string} type - Transaction type
   * @param {Object} data - Transaction data
   * @param {string} userId - User ID
   * @returns {Transaction} Transaction instance
   */
  static createTransaction(type, data, userId) {
    switch (type) {
      case TRANSACTION_TYPES.COLLECTION:
        return new CollectionTransaction(data, userId);
      case TRANSACTION_TYPES.LAB_TEST:
        return new LabTestTransaction(data, userId);
      case TRANSACTION_TYPES.MANUFACTURING:
        return new ManufacturingTransaction(data, userId);
      case TRANSACTION_TYPES.ORDER:
        return new OrderTransaction(data, userId);
      case TRANSACTION_TYPES.INSURANCE:
        return new InsuranceTransaction(data, userId);
      default:
        throw new Error(`Unknown transaction type: ${type}`);
    }
  }

  /**
   * Get all transaction types
   * @returns {Array} Array of transaction types
   */
  static getTransactionTypes() {
    return Object.values(TRANSACTION_TYPES);
  }
}

/**
 * Blockchain Transaction Manager
 * Manages transaction processing and blockchain integration
 */
class TransactionManager {
  constructor() {
    this.blockchain = new Blockchain();
    this.pendingTransactions = [];
  }

  /**
   * Add transaction to pending list
   * @param {Transaction} transaction - Transaction to add
   * @returns {Object} Result
   */
  async addTransaction(transaction) {
    const validation = await transaction.validate();
    
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
        transactionId: transaction.transactionId
      };
    }

    this.pendingTransactions.push(transaction);
    
    return {
      success: true,
      message: 'Transaction added to pending list',
      transactionId: transaction.transactionId
    };
  }

  /**
   * Process pending transactions and create new block
   * @returns {Object} Block creation result
   */
  async processPendingTransactions() {
    if (this.pendingTransactions.length === 0) {
      return {
        success: false,
        message: 'No pending transactions to process'
      };
    }

    // Create block data from pending transactions
    const blockData = {
      type: 'batch',
      transactions: this.pendingTransactions.map(t => ({
        transactionId: t.transactionId,
        type: t.type,
        data: t.data,
        userId: t.userId,
        timestamp: t.timestamp
      })),
      timestamp: new Date().toISOString(),
      blockNumber: this.blockchain.getChainLength()
    };

    // Create and add block to blockchain
    const newBlock = this.blockchain.createBlock(blockData);
    
    // Clear pending transactions
    const processedTransactions = this.pendingTransactions;
    this.pendingTransactions = [];

    return {
      success: true,
      block: {
        index: newBlock.index,
        hash: newBlock.hash,
        timestamp: newBlock.timestamp,
        transactionCount: processedTransactions.length
      },
      transactions: processedTransactions.map(t => t.transactionId)
    };
  }

  /**
   * Get transaction by ID
   * @param {string} transactionId - Transaction ID
   * @returns {Object|null} Transaction details
   */
  getTransaction(transactionId) {
    // Search in pending transactions
    const pendingTransaction = this.pendingTransactions.find(t => t.transactionId === transactionId);
    if (pendingTransaction) {
      return {
        status: 'pending',
        transaction: pendingTransaction
      };
    }

    // Search in blockchain
    for (const block of this.blockchain.getAllBlocks()) {
      if (block.data.transactions) {
        const foundTransaction = block.data.transactions.find(t => t.transactionId === transactionId);
        if (foundTransaction) {
          return {
            status: 'completed',
            block: {
              index: block.index,
              hash: block.hash,
              timestamp: block.timestamp
            },
            transaction: foundTransaction
          };
        }
      }
    }

    return null;
  }

  /**
   * Get all transactions for a user
   * @param {string} userId - User ID
   * @returns {Array} User transactions
   */
  getUserTransactions(userId) {
    const transactions = [];

    // Check pending transactions
    for (const transaction of this.pendingTransactions) {
      if (transaction.userId === userId) {
        transactions.push({
          transactionId: transaction.transactionId,
          type: transaction.type,
          data: transaction.data,
          status: 'pending',
          timestamp: transaction.timestamp
        });
      }
    }

    // Check blockchain transactions
    for (const block of this.blockchain.getAllBlocks()) {
      if (block.data.transactions) {
        for (const transaction of block.data.transactions) {
          if (transaction.userId === userId) {
            transactions.push({
              transactionId: transaction.transactionId,
              type: transaction.type,
              data: transaction.data,
              status: 'completed',
              blockIndex: block.index,
              blockHash: block.hash,
              timestamp: transaction.timestamp
            });
          }
        }
      }
    }

    return transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Get blockchain status
   * @returns {Object} Blockchain status
   */
  getBlockchainStatus() {
    return {
      chainLength: this.blockchain.getChainLength(),
      pendingTransactions: this.pendingTransactions.length,
      isValid: this.blockchain.isChainValid(),
      difficulty: this.blockchain.difficulty,
      latestBlock: {
        index: this.blockchain.getLatestBlock().index,
        hash: this.blockchain.getLatestBlock().hash
      }
    };
  }

  /**
   * Export blockchain data
   * @returns {string} JSON string
   */
  exportBlockchain() {
    return this.blockchain.export();
  }

  /**
   * Import blockchain data
   * @param {string} jsonString - JSON string
   */
  importBlockchain(jsonString) {
    this.blockchain.import(jsonString);
  }
}

// Export transaction classes and manager
module.exports = {
  Transaction,
  CollectionTransaction,
  LabTestTransaction,
  ManufacturingTransaction,
  OrderTransaction,
  InsuranceTransaction,
  TransactionFactory,
  TransactionManager,
  TRANSACTION_TYPES
};