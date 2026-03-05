/**
 * Transaction Validation Middleware
 * 
 * This module provides comprehensive transaction validation middleware
 * for the blockchain system, ensuring all transactions meet validation criteria.
 * 
 * @author Team Member 2 - Blockchain & Smart Contracts Developer
 * @version 1.0.0
 */

const { TRANSACTION_TYPES } = require('./transactions');
const { batchTracking } = require('./batch-tracking');
const { localStorageBlockchain } = require('./blockchain-storage-local');

/**
 * Transaction Validation Middleware
 * Provides comprehensive transaction validation and processing
 */
class TransactionValidationMiddleware {
  constructor() {
    this.validationRules = {
      collection: this.getCollectionValidationRules(),
      'lab-test': this.getLabTestValidationRules(),
      manufacturing: this.getManufacturingValidationRules(),
      order: this.getOrderValidationRules(),
      insurance: this.getInsuranceValidationRules()
    };
    this.validationHistory = [];
    this.blockedTransactions = [];
  }

  /**
   * Validate transaction through middleware pipeline
   * @param {Object} transaction - Transaction to validate
   * @returns {Object} Validation result
   */
  async validateTransaction(transaction) {
    const validationContext = {
      transaction,
      errors: [],
      warnings: [],
      isValid: true,
      validationSteps: []
    };

    try {
      // 1. Basic structure validation
      this.validateTransactionStructure(validationContext);

      if (!validationContext.isValid) {
        return this.createValidationResult(validationContext);
      }

      // 2. Type-specific validation
      this.validateTransactionType(validationContext);

      if (!validationContext.isValid) {
        return this.createValidationResult(validationContext);
      }

      // 3. User authorization validation
      await this.validateUserAuthorization(validationContext);

      if (!validationContext.isValid) {
        return this.createValidationResult(validationContext);
      }

      // 4. Data integrity validation
      this.validateDataIntegrity(validationContext);

      if (!validationContext.isValid) {
        return this.createValidationResult(validationContext);
      }

      // 5. Business rule validation
      await this.validateBusinessRules(validationContext);

      if (!validationContext.isValid) {
        return this.createValidationResult(validationContext);
      }

      // 6. Batch validation
      await this.validateBatchRules(validationContext);

      if (!validationContext.isValid) {
        return this.createValidationResult(validationContext);
      }

      // 7. Smart contract validation
      await this.validateSmartContractRules(validationContext);

      return this.createValidationResult(validationContext);

    } catch (error) {
      console.error('Transaction validation middleware failed:', error);
      validationContext.isValid = false;
      validationContext.errors.push(`Validation error: ${error.message}`);
      return this.createValidationResult(validationContext);
    }
  }

  /**
   * Validate transaction structure
   * @param {Object} context - Validation context
   */
  validateTransactionStructure(context) {
    const { transaction } = context;
    const steps = context.validationSteps;

    steps.push('structure_validation');

    // Check required fields
    if (!transaction.type) {
      context.isValid = false;
      context.errors.push('Transaction type is required');
    }

    if (!transaction.data) {
      context.isValid = false;
      context.errors.push('Transaction data is required');
    }

    if (!transaction.userId) {
      context.isValid = false;
      context.errors.push('User ID is required');
    }

    if (!transaction.timestamp) {
      context.isValid = false;
      context.errors.push('Timestamp is required');
    }

    // Validate transaction type
    if (!TRANSACTION_TYPES[transaction.type.toUpperCase()]) {
      context.isValid = false;
      context.errors.push(`Invalid transaction type: ${transaction.type}`);
    }

    // Validate timestamp format
    if (transaction.timestamp) {
      const date = new Date(transaction.timestamp);
      if (isNaN(date.getTime())) {
        context.isValid = false;
        context.errors.push('Invalid timestamp format');
      }
    }

    steps.push('structure_validation_complete');
  }

  /**
   * Validate transaction type specific rules
   * @param {Object} context - Validation context
   */
  validateTransactionType(context) {
    const { transaction } = context;
    const steps = context.validationSteps;

    steps.push('type_specific_validation');

    const rules = this.validationRules[transaction.type];
    if (!rules) {
      context.isValid = false;
      context.errors.push(`No validation rules defined for type: ${transaction.type}`);
      return;
    }

    // Apply type-specific validation rules
    for (const rule of rules) {
      const result = rule.validator(transaction.data);
      if (!result.valid) {
        context.isValid = false;
        context.errors.push(...result.errors);
        context.warnings.push(...result.warnings);
      }
    }

    steps.push('type_specific_validation_complete');
  }

  /**
   * Validate user authorization
   * @param {Object} context - Validation context
   */
  async validateUserAuthorization(context) {
    const { transaction } = context;
    const steps = context.validationSteps;

    steps.push('authorization_validation');

    try {
      // This would integrate with the authentication system
      // For now, we'll implement basic validation
      
      // Check if user exists (would check Firebase auth)
      if (!transaction.userId || transaction.userId.length < 5) {
        context.isValid = false;
        context.errors.push('Invalid user ID format');
      }

      // Check user permissions based on transaction type
      const permissions = this.getUserPermissions(transaction.type);
      if (!permissions.allowedRoles.includes(transaction.userRole || 'user')) {
        context.isValid = false;
        context.errors.push('User not authorized for this transaction type');
      }

      steps.push('authorization_validation_complete');

    } catch (error) {
      context.isValid = false;
      context.errors.push(`Authorization validation failed: ${error.message}`);
    }
  }

  /**
   * Validate data integrity
   * @param {Object} context - Validation context
   */
  validateDataIntegrity(context) {
    const { transaction } = context;
    const steps = context.validationSteps;

    steps.push('integrity_validation');

    // Check for data tampering
    if (transaction.dataHash && !this.verifyDataHash(transaction.data, transaction.dataHash)) {
      context.isValid = false;
      context.errors.push('Data integrity check failed - possible tampering');
    }

    // Validate data format
    if (typeof transaction.data !== 'object') {
      context.isValid = false;
      context.errors.push('Transaction data must be an object');
    }

    // Check for required fields based on type
    const requiredFields = this.getRequiredFields(transaction.type);
    for (const field of requiredFields) {
      if (!transaction.data[field]) {
        context.isValid = false;
        context.errors.push(`Missing required field: ${field}`);
      }
    }

    steps.push('integrity_validation_complete');
  }

  /**
   * Validate business rules
   * @param {Object} context - Validation context
   */
  async validateBusinessRules(context) {
    const { transaction } = context;
    const steps = context.validationSteps;

    steps.push('business_rules_validation');

    try {
      // Validate business-specific rules
      switch (transaction.type) {
        case TRANSACTION_TYPES.COLLECTION:
          await this.validateCollectionRules(context);
          break;
        case TRANSACTION_TYPES.LAB_TEST:
          await this.validateLabTestRules(context);
          break;
        case TRANSACTION_TYPES.MANUFACTURING:
          await this.validateManufacturingRules(context);
          break;
        case TRANSACTION_TYPES.ORDER:
          await this.validateOrderRules(context);
          break;
        case TRANSACTION_TYPES.INSURANCE:
          await this.validateInsuranceRules(context);
          break;
      }

      steps.push('business_rules_validation_complete');

    } catch (error) {
      context.isValid = false;
      context.errors.push(`Business rules validation failed: ${error.message}`);
    }
  }

  /**
   * Validate batch rules
   * @param {Object} context - Validation context
   */
  async validateBatchRules(context) {
    const { transaction } = context;
    const steps = context.validationSteps;

    steps.push('batch_validation');

    if (!transaction.data.batchId) {
      steps.push('batch_validation_complete');
      return; // No batch ID, skip batch validation
    }

    try {
      // Check if batch exists and is valid
      const blockchain = localStorageBlockchain.loadBlockchain();
      if (blockchain) {
        const batchBlock = blockchain.getBlockByBatchId(transaction.data.batchId);
        
        if (!batchBlock) {
          context.warnings.push(`Batch ${transaction.data.batchId} not found in blockchain`);
        } else {
          // Validate batch state based on transaction type
          await this.validateBatchState(context, batchBlock);
        }
      }

      steps.push('batch_validation_complete');

    } catch (error) {
      context.warnings.push(`Batch validation warning: ${error.message}`);
    }
  }

  /**
   * Validate smart contract rules
   * @param {Object} context - Validation context
   */
  async validateSmartContractRules(context) {
    const { transaction } = context;
    const steps = context.validationSteps;

    steps.push('smart_contract_validation');

    try {
      // This would integrate with smart contract validation
      // For now, implement basic contract rule validation
      
      // Check if transaction complies with contract terms
      const contractCompliance = this.checkContractCompliance(transaction);
      if (!contractCompliance.valid) {
        context.isValid = false;
        context.errors.push(...contractCompliance.errors);
      }

      steps.push('smart_contract_validation_complete');

    } catch (error) {
      context.warnings.push(`Smart contract validation warning: ${error.message}`);
    }
  }

  /**
   * Validate collection-specific rules
   * @param {Object} context - Validation context
   */
  async validateCollectionRules(context) {
    const { transaction } = context;
    const data = transaction.data;

    // Validate herb type
    if (data.herbType && !this.isValidHerbType(data.herbType)) {
      context.errors.push('Invalid herb type');
    }

    // Validate quantity
    if (data.quantity && (data.quantity <= 0 || data.quantity > 10000)) {
      context.errors.push('Invalid quantity - must be between 1 and 10000');
    }

    // Validate location format
    if (data.location && data.location.length < 5) {
      context.errors.push('Invalid location format');
    }

    // Validate batch ID format
    if (data.batchId && !this.isValidBatchId(data.batchId)) {
      context.errors.push('Invalid batch ID format');
    }
  }

  /**
   * Validate lab test-specific rules
   * @param {Object} context - Validation context
   */
  async validateLabTestRules(context) {
    const { transaction } = context;
    const data = transaction.data;

    // Validate test type
    const validTestTypes = ['purity', 'potency', 'contamination', 'identity'];
    if (data.testType && !validTestTypes.includes(data.testType)) {
      context.errors.push('Invalid test type');
    }

    // Validate results format
    if (data.results && typeof data.results !== 'object') {
      context.errors.push('Invalid results format');
    }

    // Validate lab ID
    if (data.labId && data.labId.length < 5) {
      context.errors.push('Invalid lab ID format');
    }
  }

  /**
   * Validate manufacturing-specific rules
   * @param {Object} context - Validation context
   */
  async validateManufacturingRules(context) {
    const { transaction } = context;
    const data = transaction.data;

    // Validate product type
    if (data.productType && data.productType.length < 2) {
      context.errors.push('Invalid product type format');
    }

    // Validate quantity
    if (data.quantity && data.quantity <= 0) {
      context.errors.push('Invalid manufacturing quantity');
    }

    // Validate process steps
    if (data.processSteps && !Array.isArray(data.processSteps)) {
      context.errors.push('Process steps must be an array');
    }
  }

  /**
   * Validate order-specific rules
   * @param {Object} context - Validation context
   */
  async validateOrderRules(context) {
    const { transaction } = context;
    const data = transaction.data;

    // Validate product ID
    if (data.productId && data.productId.length < 5) {
      context.errors.push('Invalid product ID format');
    }

    // Validate quantity
    if (data.quantity && data.quantity <= 0) {
      context.errors.push('Invalid order quantity');
    }

    // Validate amount
    if (data.totalAmount && data.totalAmount <= 0) {
      context.errors.push('Invalid total amount');
    }

    // Validate currency
    if (data.currency && !['INR', 'USD', 'EUR'].includes(data.currency)) {
      context.errors.push('Invalid currency type');
    }
  }

  /**
   * Validate insurance-specific rules
   * @param {Object} context - Validation context
   */
  async validateInsuranceRules(context) {
    const { transaction } = context;
    const data = transaction.data;

    // Validate policy ID
    if (data.policyId && data.policyId.length < 5) {
      context.errors.push('Invalid policy ID format');
    }

    // Validate incident type
    const validIncidentTypes = ['theft', 'damage', 'contamination', 'delay'];
    if (data.incidentType && !validIncidentTypes.includes(data.incidentType)) {
      context.errors.push('Invalid incident type');
    }

    // Validate estimated loss
    if (data.estimatedLoss && data.estimatedLoss < 0) {
      context.errors.push('Invalid estimated loss amount');
    }

    // Validate description
    if (data.description && data.description.length < 10) {
      context.errors.push('Description too short');
    }
  }

  /**
   * Validate batch state
   * @param {Object} context - Validation context
   * @param {Object} batchBlock - Batch block from blockchain
   */
  async validateBatchState(context, batchBlock) {
    const { transaction } = context;
    
    // Check if batch is already processed
    if (batchBlock.data.status === 'processed') {
      context.errors.push('Batch has already been processed');
    }

    // Validate batch state transitions
    const currentState = batchBlock.data.status || 'collected';
    const nextState = this.getNextBatchState(transaction.type);
    
    if (!this.isValidStateTransition(currentState, nextState)) {
      context.errors.push(`Invalid batch state transition: ${currentState} -> ${nextState}`);
    }
  }

  /**
   * Check contract compliance
   * @param {Object} transaction - Transaction to check
   * @returns {Object} Compliance result
   */
  checkContractCompliance(transaction) {
    const result = {
      valid: true,
      errors: []
    };

    // Basic contract compliance checks
    if (transaction.data.contractId && transaction.data.contractId.length < 5) {
      result.valid = false;
      result.errors.push('Invalid contract ID');
    }

    // Check contract expiration
    if (transaction.data.contractExpiry) {
      const expiryDate = new Date(transaction.data.contractExpiry);
      if (expiryDate < new Date()) {
        result.valid = false;
        result.errors.push('Contract has expired');
      }
    }

    return result;
  }

  /**
   * Get collection validation rules
   * @returns {Array} Validation rules
   */
  getCollectionValidationRules() {
    return [
      {
        validator: (data) => {
          const result = { valid: true, errors: [], warnings: [] };
          
          if (!data.herbType) {
            result.valid = false;
            result.errors.push('Herb type is required');
          }
          
          if (!data.quantity || data.quantity <= 0) {
            result.valid = false;
            result.errors.push('Valid quantity is required');
          }
          
          if (!data.location) {
            result.valid = false;
            result.errors.push('Location is required');
          }
          
          return result;
        }
      }
    ];
  }

  /**
   * Get lab test validation rules
   * @returns {Array} Validation rules
   */
  getLabTestValidationRules() {
    return [
      {
        validator: (data) => {
          const result = { valid: true, errors: [], warnings: [] };
          
          if (!data.testType) {
            result.valid = false;
            result.errors.push('Test type is required');
          }
          
          if (!data.results) {
            result.valid = false;
            result.errors.push('Test results are required');
          }
          
          if (!data.labId) {
            result.valid = false;
            result.errors.push('Lab ID is required');
          }
          
          return result;
        }
      }
    ];
  }

  /**
   * Get manufacturing validation rules
   * @returns {Array} Validation rules
   */
  getManufacturingValidationRules() {
    return [
      {
        validator: (data) => {
          const result = { valid: true, errors: [], warnings: [] };
          
          if (!data.productType) {
            result.valid = false;
            result.errors.push('Product type is required');
          }
          
          if (!data.quantity || data.quantity <= 0) {
            result.valid = false;
            result.errors.push('Valid quantity is required');
          }
          
          if (!data.processSteps || !Array.isArray(data.processSteps)) {
            result.valid = false;
            result.errors.push('Process steps are required');
          }
          
          return result;
        }
      }
    ];
  }

  /**
   * Get order validation rules
   * @returns {Array} Validation rules
   */
  getOrderValidationRules() {
    return [
      {
        validator: (data) => {
          const result = { valid: true, errors: [], warnings: [] };
          
          if (!data.productId) {
            result.valid = false;
            result.errors.push('Product ID is required');
          }
          
          if (!data.quantity || data.quantity <= 0) {
            result.valid = false;
            result.errors.push('Valid quantity is required');
          }
          
          if (!data.totalAmount || data.totalAmount <= 0) {
            result.valid = false;
            result.errors.push('Valid total amount is required');
          }
          
          return result;
        }
      }
    ];
  }

  /**
   * Get insurance validation rules
   * @returns {Array} Validation rules
   */
  getInsuranceValidationRules() {
    return [
      {
        validator: (data) => {
          const result = { valid: true, errors: [], warnings: [] };
          
          if (!data.policyId) {
            result.valid = false;
            result.errors.push('Policy ID is required');
          }
          
          if (!data.incidentType) {
            result.valid = false;
            result.errors.push('Incident type is required');
          }
          
          if (!data.description) {
            result.valid = false;
            result.errors.push('Incident description is required');
          }
          
          if (!data.estimatedLoss || data.estimatedLoss < 0) {
            result.valid = false;
            result.errors.push('Valid estimated loss is required');
          }
          
          return result;
        }
      }
    ];
  }

  /**
   * Get user permissions for transaction type
   * @param {string} transactionType - Type of transaction
   * @returns {Object} User permissions
   */
  getUserPermissions(transactionType) {
    const permissions = {
      [TRANSACTION_TYPES.COLLECTION]: {
        allowedRoles: ['farmer', 'admin'],
        requiredPermissions: ['create_collection']
      },
      [TRANSACTION_TYPES.LAB_TEST]: {
        allowedRoles: ['lab', 'admin'],
        requiredPermissions: ['create_lab_test']
      },
      [TRANSACTION_TYPES.MANUFACTURING]: {
        allowedRoles: ['manufacturer', 'admin'],
        requiredPermissions: ['create_manufacturing']
      },
      [TRANSACTION_TYPES.ORDER]: {
        allowedRoles: ['consumer', 'admin'],
        requiredPermissions: ['create_order']
      },
      [TRANSACTION_TYPES.INSURANCE]: {
        allowedRoles: ['farmer', 'manufacturer', 'admin'],
        requiredPermissions: ['create_insurance']
      }
    };

    return permissions[transactionType] || { allowedRoles: ['admin'], requiredPermissions: [] };
  }

  /**
   * Get required fields for transaction type
   * @param {string} transactionType - Type of transaction
   * @returns {Array} Required fields
   */
  getRequiredFields(transactionType) {
    const requiredFields = {
      [TRANSACTION_TYPES.COLLECTION]: ['herbType', 'quantity', 'location', 'batchId'],
      [TRANSACTION_TYPES.LAB_TEST]: ['testType', 'results', 'labId', 'batchId'],
      [TRANSACTION_TYPES.MANUFACTURING]: ['productType', 'quantity', 'processSteps'],
      [TRANSACTION_TYPES.ORDER]: ['productId', 'quantity', 'totalAmount'],
      [TRANSACTION_TYPES.INSURANCE]: ['policyId', 'incidentType', 'description', 'estimatedLoss']
    };

    return requiredFields[transactionType] || [];
  }

  /**
   * Verify data hash
   * @param {Object} data - Data to verify
   * @param {string} hash - Hash to verify against
   * @returns {boolean} True if hash is valid
   */
  verifyDataHash(data, hash) {
    // This would implement actual hash verification
    // For now, return true for demonstration
    return true;
  }

  /**
   * Check if herb type is valid
   * @param {string} herbType - Herb type to check
   * @returns {boolean} True if valid
   */
  isValidHerbType(herbType) {
    const validHerbs = ['ashwagandha', 'turmeric', 'neem', 'tulsi', 'ginseng'];
    return validHerbs.includes(herbType.toLowerCase());
  }

  /**
   * Check if batch ID is valid
   * @param {string} batchId - Batch ID to check
   * @returns {boolean} True if valid
   */
  isValidBatchId(batchId) {
    return batchId.length >= 5 && /^[A-Z0-9-]+$/.test(batchId);
  }

  /**
   * Get next batch state for transaction type
   * @param {string} transactionType - Type of transaction
   * @returns {string} Next batch state
   */
  getNextBatchState(transactionType) {
    const stateTransitions = {
      [TRANSACTION_TYPES.COLLECTION]: 'collected',
      [TRANSACTION_TYPES.LAB_TEST]: 'tested',
      [TRANSACTION_TYPES.MANUFACTURING]: 'manufactured',
      [TRANSACTION_TYPES.ORDER]: 'ordered',
      [TRANSACTION_TYPES.INSURANCE]: 'claimed'
    };

    return stateTransitions[transactionType] || 'unknown';
  }

  /**
   * Check if state transition is valid
   * @param {string} currentState - Current state
   * @param {string} nextState - Next state
   * @returns {boolean} True if valid
   */
  isValidStateTransition(currentState, nextState) {
    const validTransitions = {
      'collected': ['tested', 'claimed'],
      'tested': ['manufactured', 'claimed'],
      'manufactured': ['ordered', 'claimed'],
      'ordered': ['claimed'],
      'claimed': []
    };

    const allowedNextStates = validTransitions[currentState] || [];
    return allowedNextStates.includes(nextState);
  }

  /**
   * Create validation result
   * @param {Object} context - Validation context
   * @returns {Object} Validation result
   */
  createValidationResult(context) {
    const result = {
      valid: context.isValid,
      errors: context.errors,
      warnings: context.warnings,
      validationSteps: context.validationSteps,
      timestamp: new Date().toISOString()
    };

    // Log validation result
    this.validationHistory.push({
      transactionId: context.transaction.transactionId,
      type: context.transaction.type,
      valid: context.isValid,
      errors: context.errors.length,
      warnings: context.warnings.length,
      timestamp: new Date().toISOString()
    });

    // Store blocked transactions
    if (!context.isValid) {
      this.blockedTransactions.push({
        ...context.transaction,
        blockedAt: new Date().toISOString(),
        reason: context.errors.join(', ')
      });
    }

    return result;
  }

  /**
   * Get validation statistics
   * @returns {Object} Validation statistics
   */
  getValidationStats() {
    const totalValidations = this.validationHistory.length;
    const validCount = this.validationHistory.filter(v => v.valid).length;
    const invalidCount = totalValidations - validCount;
    const blockRate = totalValidations > 0 ? (invalidCount / totalValidations) * 100 : 0;

    return {
      totalValidations,
      validCount,
      invalidCount,
      blockRate: blockRate.toFixed(2),
      blockedTransactions: this.blockedTransactions.length,
      recentValidations: this.validationHistory.slice(-10)
    };
  }

  /**
   * Clear validation history
   */
  clearValidationHistory() {
    this.validationHistory = [];
  }

  /**
   * Clear blocked transactions
   */
  clearBlockedTransactions() {
    this.blockedTransactions = [];
  }

  /**
   * Get blocked transactions
   * @returns {Array} Blocked transactions
   */
  getBlockedTransactions() {
    return this.blockedTransactions;
  }
}

// Export transaction validation middleware
module.exports = {
  TransactionValidationMiddleware
};