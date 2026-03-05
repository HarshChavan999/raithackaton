/**
 * Transaction Validation Logic
 * 
 * This module provides comprehensive transaction validation for all transaction types
 * in the VaidyaChain blockchain system, including fraud detection and prevention.
 * 
 * @author Team Member 1 - Backend & Database Specialist
 * @version 1.0.0
 */

const admin = require('firebase-admin');
const { validateInput, sanitizeInput } = require('./validation');
const { logSecurityEvent } = require('./security');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Transaction Validator Class
 * Handles validation for all transaction types with fraud detection
 */
class TransactionValidator {
  constructor() {
    this.validationRules = this.initializeValidationRules();
    this.fraudPatterns = this.initializeFraudPatterns();
    this.transactionCache = new Map(); // Cache for duplicate detection
  }

  /**
   * Initialize validation rules for all transaction types
   */
  initializeValidationRules() {
    return {
      collection: {
        requiredFields: ['batchId', 'herbType', 'quantity', 'location', 'farmerId'],
        fieldRules: {
          batchId: { type: 'string', pattern: /^[A-Z0-9]{8,}$/, maxLength: 50 },
          herbType: { type: 'string', minLength: 2, maxLength: 100 },
          quantity: { type: 'number', min: 0.01, max: 10000 },
          location: { type: 'object', required: ['lat', 'lng'] },
          farmerId: { type: 'string', pattern: /^[a-zA-Z0-9_-]{8,}$/ },
          timestamp: { type: 'date' }
        }
      },
      'lab-test': {
        requiredFields: ['batchId', 'labId', 'testType', 'results', 'standards'],
        fieldRules: {
          batchId: { type: 'string', pattern: /^[A-Z0-9]{8,}$/ },
          labId: { type: 'string', pattern: /^[a-zA-Z0-9_-]{8,}$/ },
          testType: { type: 'string', enum: ['purity', 'potency', 'contamination', 'identity'] },
          results: { type: 'object' },
          standards: { type: 'object' },
          testDate: { type: 'date' }
        }
      },
      manufacturing: {
        requiredFields: ['batchId', 'manufacturerId', 'productType', 'quantity', 'processSteps'],
        fieldRules: {
          batchId: { type: 'string', pattern: /^[A-Z0-9]{8,}$/ },
          manufacturerId: { type: 'string', pattern: /^[a-zA-Z0-9_-]{8,}$/ },
          productType: { type: 'string', minLength: 2, maxLength: 100 },
          quantity: { type: 'number', min: 1, max: 50000 },
          processSteps: { type: 'array', minLength: 1 },
          manufacturingDate: { type: 'date' }
        }
      },
      order: {
        requiredFields: ['productId', 'consumerId', 'quantity', 'totalAmount'],
        fieldRules: {
          productId: { type: 'string', pattern: /^[A-Z0-9]{8,}$/ },
          consumerId: { type: 'string', pattern: /^[a-zA-Z0-9_-]{8,}$/ },
          quantity: { type: 'number', min: 1, max: 1000 },
          totalAmount: { type: 'number', min: 0.01, max: 50000 },
          orderDate: { type: 'date' }
        }
      },
      insurance: {
        requiredFields: ['policyId', 'userId', 'incidentType', 'description', 'estimatedLoss'],
        fieldRules: {
          policyId: { type: 'string', pattern: /^[A-Z0-9]{8,}$/ },
          userId: { type: 'string', pattern: /^[a-zA-Z0-9_-]{8,}$/ },
          incidentType: { type: 'string', enum: ['theft', 'damage', 'contamination', 'delay'] },
          description: { type: 'string', maxLength: 1000 },
          estimatedLoss: { type: 'number', min: 0, max: 1000000 },
          incidentDate: { type: 'date' }
        }
      }
    };
  }

  /**
   * Initialize fraud detection patterns
   */
  initializeFraudPatterns() {
    return {
      duplicateTransactions: {
        timeWindow: 60000, // 1 minute
        fields: ['batchId', 'amount', 'userId']
      },
      suspiciousAmounts: {
        thresholds: [0.01, 999999.99], // Very small or very large amounts
        roundNumbers: true // Check for round numbers like 1000, 5000
      },
      invalidUserPatterns: {
        nonExistentUsers: true,
        inactiveUsers: true,
        roleViolations: true
      },
      timingAnomalies: {
        futureDates: true,
        impossibleSpeeds: true // Transactions happening impossibly fast
      }
    };
  }

  /**
   * Validate a transaction
   * @param {Object} transaction - Transaction to validate
   * @returns {Object} Validation result
   */
  async validateTransaction(transaction) {
    try {
      // Sanitize input
      const sanitizedTransaction = sanitizeInput(transaction);
      
      // Basic structure validation
      const basicValidation = this.validateBasicStructure(sanitizedTransaction);
      if (!basicValidation.valid) {
        return this.createValidationError('basic_structure', basicValidation.errors);
      }

      // Type-specific validation
      const typeValidation = await this.validateTransactionType(sanitizedTransaction);
      if (!typeValidation.valid) {
        return this.createValidationError('type_specific', typeValidation.errors);
      }

      // Fraud detection
      const fraudCheck = await this.detectFraud(sanitizedTransaction);
      if (!fraudCheck.valid) {
        return this.createValidationError('fraud_detection', fraudCheck.errors);
      }

      // Business rule validation
      const businessValidation = await this.validateBusinessRules(sanitizedTransaction);
      if (!businessValidation.valid) {
        return this.createValidationError('business_rules', businessValidation.errors);
      }

      // Log successful validation
      logSecurityEvent('transaction_validated', {
        transactionType: sanitizedTransaction.type,
        transactionId: sanitizedTransaction.transactionId,
        userId: sanitizedTransaction.userId
      });

      return {
        valid: true,
        transaction: sanitizedTransaction,
        validationTime: new Date().toISOString()
      };

    } catch (error) {
      logSecurityEvent('validation_error', {
        error: error.message,
        transactionType: transaction.type,
        transactionId: transaction.transactionId
      });

      return this.createValidationError('system_error', [error.message]);
    }
  }

  /**
   * Validate basic transaction structure
   * @param {Object} transaction - Transaction to validate
   */
  validateBasicStructure(transaction) {
    const errors = [];

    // Check required fields
    const requiredFields = ['transactionId', 'type', 'data', 'timestamp', 'userId'];
    for (const field of requiredFields) {
      if (!transaction[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Check transaction type
    const validTypes = Object.keys(this.validationRules);
    if (!validTypes.includes(transaction.type)) {
      errors.push(`Invalid transaction type: ${transaction.type}`);
    }

    // Check timestamp format
    if (transaction.timestamp) {
      const date = new Date(transaction.timestamp);
      if (isNaN(date.getTime())) {
        errors.push('Invalid timestamp format');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate transaction type-specific rules
   * @param {Object} transaction - Transaction to validate
   */
  async validateTransactionType(transaction) {
    const errors = [];
    const typeRules = this.validationRules[transaction.type];
    
    if (!typeRules) {
      errors.push(`No validation rules defined for type: ${transaction.type}`);
      return { valid: false, errors };
    }

    const data = transaction.data;

    // Check required fields for this type
    for (const field of typeRules.requiredFields) {
      if (!data[field]) {
        errors.push(`Missing required field for ${transaction.type}: ${field}`);
      }
    }

    // Validate field rules
    for (const [fieldName, rule] of Object.entries(typeRules.fieldRules)) {
      if (data[fieldName] !== undefined) {
        const fieldValidation = this.validateField(fieldName, data[fieldName], rule);
        if (!fieldValidation.valid) {
          errors.push(...fieldValidation.errors);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate individual field against rules
   * @param {string} fieldName - Name of field
   * @param {*} value - Value to validate
   * @param {Object} rule - Validation rule
   */
  validateField(fieldName, value, rule) {
    const errors = [];

    // Type checking
    if (rule.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rule.type) {
        errors.push(`Field ${fieldName} must be of type ${rule.type}, got ${actualType}`);
      }
    }

    // Pattern matching
    if (rule.pattern && typeof value === 'string') {
      if (!rule.pattern.test(value)) {
        errors.push(`Field ${fieldName} does not match required pattern`);
      }
    }

    // Length validation
    if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
      errors.push(`Field ${fieldName} must be at least ${rule.minLength} characters long`);
    }

    if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
      errors.push(`Field ${fieldName} must not exceed ${rule.maxLength} characters`);
    }

    // Numeric validation
    if (rule.min !== undefined && typeof value === 'number' && value < rule.min) {
      errors.push(`Field ${fieldName} must be at least ${rule.min}`);
    }

    if (rule.max !== undefined && typeof value === 'number' && value > rule.max) {
      errors.push(`Field ${fieldName} must not exceed ${rule.max}`);
    }

    // Enum validation
    if (rule.enum && !rule.enum.includes(value)) {
      errors.push(`Field ${fieldName} must be one of: ${rule.enum.join(', ')}`);
    }

    // Array validation
    if (rule.minLength && Array.isArray(value) && value.length < rule.minLength) {
      errors.push(`Field ${fieldName} must contain at least ${rule.minLength} items`);
    }

    // Object validation
    if (rule.required && typeof value === 'object' && value !== null) {
      for (const requiredProp of rule.required) {
        if (!value[requiredProp]) {
          errors.push(`Field ${fieldName} must contain property: ${requiredProp}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Detect fraudulent transactions
   * @param {Object} transaction - Transaction to check
   */
  async detectFraud(transaction) {
    const errors = [];

    // Check for duplicate transactions
    const duplicateCheck = this.checkForDuplicates(transaction);
    if (!duplicateCheck.valid) {
      errors.push(...duplicateCheck.errors);
    }

    // Check for suspicious amounts
    const amountCheck = this.checkSuspiciousAmounts(transaction);
    if (!amountCheck.valid) {
      errors.push(...amountCheck.errors);
    }

    // Check for invalid user patterns
    const userCheck = await this.checkInvalidUsers(transaction);
    if (!userCheck.valid) {
      errors.push(...userCheck.errors);
    }

    // Check for timing anomalies
    const timingCheck = this.checkTimingAnomalies(transaction);
    if (!timingCheck.valid) {
      errors.push(...timingCheck.errors);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check for duplicate transactions
   * @param {Object} transaction - Transaction to check
   */
  checkForDuplicates(transaction) {
    const errors = [];
    const key = this.createTransactionKey(transaction);

    if (this.transactionCache.has(key)) {
      const cachedTime = this.transactionCache.get(key);
      const currentTime = Date.now();

      if (currentTime - cachedTime < this.fraudPatterns.duplicateTransactions.timeWindow) {
        errors.push('Duplicate transaction detected within time window');
        
        // Log security event
        logSecurityEvent('duplicate_transaction', {
          transactionId: transaction.transactionId,
          userId: transaction.userId,
          type: transaction.type
        });
      }
    }

    // Cache this transaction
    this.transactionCache.set(key, Date.now());

    // Clean up old cache entries (keep last hour)
    if (this.transactionCache.size > 1000) {
      const cutoff = Date.now() - (60 * 60 * 1000);
      for (const [key, time] of this.transactionCache.entries()) {
        if (time < cutoff) {
          this.transactionCache.delete(key);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Create a key for duplicate detection
   * @param {Object} transaction - Transaction to create key for
   */
  createTransactionKey(transaction) {
    const fields = this.fraudPatterns.duplicateTransactions.fields;
    const keyParts = fields.map(field => transaction.data[field] || transaction[field]);
    return keyParts.join('|');
  }

  /**
   * Check for suspicious amounts
   * @param {Object} transaction - Transaction to check
   */
  checkSuspiciousAmounts(transaction) {
    const errors = [];
    const amount = transaction.data.amount || transaction.data.totalAmount || transaction.data.estimatedLoss;

    if (amount !== undefined) {
      // Check threshold violations
      const thresholds = this.fraudPatterns.suspiciousAmounts.thresholds;
      if (amount <= thresholds[0] || amount >= thresholds[1]) {
        errors.push('Transaction amount is suspiciously small or large');
      }

      // Check for round numbers (potential fraud indicator)
      if (this.fraudPatterns.suspiciousAmounts.roundNumbers && amount % 1000 === 0) {
        errors.push('Round number transaction amount detected');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check for invalid user patterns
   * @param {Object} transaction - Transaction to check
   */
  async checkInvalidUsers(transaction) {
    const errors = [];
    const userId = transaction.userId;

    if (!userId) {
      return { valid: true, errors: [] };
    }

    try {
      // Check if user exists
      const userDoc = await db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        errors.push('User does not exist in system');
        return { valid: false, errors };
      }

      const userData = userDoc.data();

      // Check if user is active
      if (this.fraudPatterns.invalidUserPatterns.inactiveUsers && !userData.isActive) {
        errors.push('User account is inactive');
      }

      // Check role violations (if applicable)
      if (this.fraudPatterns.invalidUserPatterns.roleViolations) {
        const roleCheck = this.validateUserRole(transaction, userData.role);
        if (!roleCheck.valid) {
          errors.push(...roleCheck.errors);
        }
      }

    } catch (error) {
      errors.push('Error validating user: ' + error.message);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate user role for transaction type
   * @param {Object} transaction - Transaction to validate
   * @param {string} userRole - User's role
   */
  validateUserRole(transaction, userRole) {
    const errors = [];
    
    // Define role permissions for transaction types
    const rolePermissions = {
      'collection': ['farmer'],
      'lab-test': ['lab'],
      'manufacturing': ['manufacturer'],
      'order': ['consumer', 'manufacturer'],
      'insurance': ['farmer', 'manufacturer', 'consumer']
    };

    const allowedRoles = rolePermissions[transaction.type];
    
    if (allowedRoles && !allowedRoles.includes(userRole)) {
      errors.push(`User role '${userRole}' not permitted for transaction type '${transaction.type}'`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check for timing anomalies
   * @param {Object} transaction - Transaction to check
   */
  checkTimingAnomalies(transaction) {
    const errors = [];

    if (this.fraudPatterns.timingAnomalies.futureDates) {
      const timestamp = new Date(transaction.timestamp);
      if (timestamp > new Date()) {
        errors.push('Transaction timestamp is in the future');
      }
    }

    // Additional timing checks could be added here
    // For example: checking if transactions happen impossibly fast

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate business rules
   * @param {Object} transaction - Transaction to validate
   */
  async validateBusinessRules(transaction) {
    const errors = [];

    // Business rule: Batch must exist for collection transactions
    if (transaction.type === 'collection' && transaction.data.batchId) {
      const batchExists = await this.checkBatchExists(transaction.data.batchId);
      if (!batchExists) {
        errors.push('Batch does not exist');
      }
    }

    // Business rule: User must have appropriate role
    const userRole = await this.getUserRole(transaction.userId);
    if (userRole) {
      const roleValidation = this.validateUserRole(transaction, userRole);
      if (!roleValidation.valid) {
        errors.push(...roleValidation.errors);
      }
    }

    // Additional business rules can be added here

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if batch exists
   * @param {string} batchId - Batch ID to check
   */
  async checkBatchExists(batchId) {
    try {
      const batchDoc = await db.collection('batches').doc(batchId).get();
      return batchDoc.exists;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user role from database
   * @param {string} userId - User ID
   */
  async getUserRole(userId) {
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      return userDoc.exists ? userDoc.data().role : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Create validation error response
   * @param {string} errorType - Type of error
   * @param {Array} errors - Array of error messages
   */
  createValidationError(errorType, errors) {
    const errorResponse = {
      valid: false,
      errorType,
      errors,
      timestamp: new Date().toISOString()
    };

    // Log security event for validation failures
    logSecurityEvent('transaction_validation_failed', {
      errorType,
      errorCount: errors.length,
      errors: errors.slice(0, 3) // Log first 3 errors only
    });

    return errorResponse;
  }

  /**
   * Get validation statistics
   */
  getValidationStats() {
    return {
      cachedTransactions: this.transactionCache.size,
      validationRulesCount: Object.keys(this.validationRules).length,
      fraudPatternsCount: Object.keys(this.fraudPatterns).length
    };
  }
}

// Export validator instance
const transactionValidator = new TransactionValidator();

module.exports = {
  TransactionValidator,
  transactionValidator
};