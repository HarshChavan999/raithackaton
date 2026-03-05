/**
 * Smart Contracts Backend Framework
 * 
 * This module provides the backend infrastructure for smart contract execution,
 * state management, and event logging for the VaidyaChain blockchain system.
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
 * Smart Contract Registry
 * Manages all contract types and their execution engines
 */
class ContractRegistry {
  constructor() {
    this.contracts = new Map();
    this.initializeContracts();
  }

  /**
   * Initialize all contract types
   */
  initializeContracts() {
    this.contracts.set('payment', new PaymentContract());
    this.contracts.set('insurance', new InsuranceContract());
    this.contracts.set('quality', new QualityContract());
    this.contracts.set('supply-chain', new SupplyChainContract());
  }

  /**
   * Get contract instance by type
   * @param {string} contractType - Type of contract
   * @returns {Object} Contract instance
   */
  getContract(contractType) {
    const contract = this.contracts.get(contractType);
    if (!contract) {
      throw new Error(`Contract type '${contractType}' not found`);
    }
    return contract;
  }

  /**
   * List all available contract types
   * @returns {Array} Array of contract type names
   */
  listContractTypes() {
    return Array.from(this.contracts.keys());
  }
}

/**
 * Base Smart Contract Class
 * Provides common functionality for all contract types
 */
class SmartContract {
  constructor() {
    this.type = '';
    this.state = {};
    this.events = [];
  }

  /**
   * Execute contract function
   * @param {string} functionName - Name of function to execute
   * @param {Object} params - Parameters for the function
   * @returns {Object} Execution result
   */
  async execute(functionName, params) {
    try {
      // Validate input parameters
      const validatedParams = await this.validateParams(functionName, params);
      
      // Execute the function
      const result = await this[functionName](validatedParams);
      
      // Log the execution
      await this.logEvent(functionName, params, result);
      
      return {
        success: true,
        result,
        contractType: this.type,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      await this.logEvent(functionName, params, { error: error.message }, 'error');
      throw error;
    }
  }

  /**
   * Validate function parameters
   * @param {string} functionName - Name of function
   * @param {Object} params - Parameters to validate
   * @returns {Object} Validated parameters
   */
  async validateParams(functionName, params) {
    // Base validation - can be overridden by specific contracts
    if (!params || typeof params !== 'object') {
      throw new Error('Invalid parameters provided');
    }
    return params;
  }

  /**
   * Log contract execution event
   * @param {string} functionName - Function name executed
   * @param {Object} params - Input parameters
   * @param {Object} result - Execution result
   * @param {string} eventType - Type of event (success, error)
   */
  async logEvent(functionName, params, result, eventType = 'success') {
    const event = {
      contractType: this.type,
      functionName,
      params: sanitizeInput(params),
      result: sanitizeInput(result),
      eventType,
      timestamp: new Date().toISOString(),
      userId: params.userId || 'system'
    };

    // Log to Firestore
    await db.collection('contract_events').add(event);
    
    // Log to security system
    logSecurityEvent('contract_execution', {
      contractType: this.type,
      functionName,
      eventType,
      userId: params.userId
    });

    this.events.push(event);
  }

  /**
   * Get contract state
   * @returns {Object} Current contract state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Update contract state
   * @param {Object} newState - New state to merge
   */
  updateState(newState) {
    this.state = { ...this.state, ...newState };
  }
}

/**
 * Payment Contract
 * Handles automatic payments between stakeholders
 */
class PaymentContract extends SmartContract {
  constructor() {
    super();
    this.type = 'payment';
    this.state = {
      paymentRules: {},
      pendingPayments: [],
      completedPayments: []
    };
  }

  /**
   * Execute payment between parties
   * @param {Object} params - Payment parameters
   */
  async executePayment(params) {
    const { fromUserId, toUserId, amount, reason, batchId } = params;

    // Validate payment parameters
    if (!fromUserId || !toUserId || !amount || amount <= 0) {
      throw new Error('Invalid payment parameters');
    }

    // Check if payment already exists
    const existingPayment = this.state.pendingPayments.find(
      p => p.fromUserId === fromUserId && p.toUserId === toUserId && p.batchId === batchId
    );

    if (existingPayment) {
      throw new Error('Payment already in progress for this batch');
    }

    // Create payment record
    const payment = {
      paymentId: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fromUserId,
      toUserId,
      amount,
      reason,
      batchId,
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    // Add to pending payments
    this.state.pendingPayments.push(payment);
    
    // Update state
    this.updateState({
      pendingPayments: this.state.pendingPayments
    });

    return {
      paymentId: payment.paymentId,
      status: 'pending',
      message: 'Payment initiated successfully'
    };
  }

  /**
   * Complete payment execution
   * @param {Object} params - Completion parameters
   */
  async completePayment(params) {
    const { paymentId, transactionHash } = params;

    const paymentIndex = this.state.pendingPayments.findIndex(p => p.paymentId === paymentId);
    
    if (paymentIndex === -1) {
      throw new Error('Payment not found or already completed');
    }

    const payment = this.state.pendingPayments[paymentIndex];
    
    // Update payment status
    payment.status = 'completed';
    payment.transactionHash = transactionHash;
    payment.completedAt = new Date().toISOString();

    // Move to completed payments
    this.state.completedPayments.push(payment);
    this.state.pendingPayments.splice(paymentIndex, 1);

    // Update state
    this.updateState({
      pendingPayments: this.state.pendingPayments,
      completedPayments: this.state.completedPayments
    });

    return {
      paymentId,
      status: 'completed',
      transactionHash,
      message: 'Payment completed successfully'
    };
  }

  /**
   * Get payment history for a user
   * @param {Object} params - Query parameters
   */
  async getPaymentHistory(params) {
    const { userId, limit = 50 } = params;

    const pendingPayments = this.state.pendingPayments.filter(
      p => p.fromUserId === userId || p.toUserId === userId
    );

    const completedPayments = this.state.completedPayments.filter(
      p => p.fromUserId === userId || p.toUserId === userId
    );

    return {
      pendingPayments: pendingPayments.slice(0, limit),
      completedPayments: completedPayments.slice(0, limit),
      totalPending: pendingPayments.length,
      totalCompleted: completedPayments.length
    };
  }
}

/**
 * Insurance Contract
 * Handles parametric insurance for supply chain risks
 */
class InsuranceContract extends SmartContract {
  constructor() {
    super();
    this.type = 'insurance';
    this.state = {
      policies: [],
      claims: [],
      riskFactors: {}
    };
  }

  /**
   * Create insurance policy
   * @param {Object} params - Policy parameters
   */
  async createPolicy(params) {
    const { userId, batchId, coverageAmount, premium, riskFactors } = params;

    if (!userId || !batchId || !coverageAmount || !premium) {
      throw new Error('Invalid policy parameters');
    }

    const policy = {
      policyId: `pol_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      batchId,
      coverageAmount,
      premium,
      riskFactors,
      status: 'active',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    };

    this.state.policies.push(policy);
    this.updateState({ policies: this.state.policies });

    return {
      policyId: policy.policyId,
      status: 'created',
      message: 'Insurance policy created successfully'
    };
  }

  /**
   * File insurance claim
   * @param {Object} params - Claim parameters
   */
  async fileClaim(params) {
    const { policyId, userId, incidentType, description, estimatedLoss } = params;

    const policy = this.state.policies.find(p => p.policyId === policyId && p.userId === userId);
    
    if (!policy) {
      throw new Error('Policy not found or not owned by user');
    }

    if (policy.status !== 'active') {
      throw new Error('Policy is not active');
    }

    const claim = {
      claimId: `cla_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      policyId,
      userId,
      incidentType,
      description,
      estimatedLoss,
      status: 'pending',
      filedAt: new Date().toISOString()
    };

    this.state.claims.push(claim);
    this.updateState({ claims: this.state.claims });

    return {
      claimId: claim.claimId,
      status: 'filed',
      message: 'Insurance claim filed successfully'
    };
  }

  /**
   * Process insurance claim
   * @param {Object} params - Processing parameters
   */
  async processClaim(params) {
    const { claimId, approvedAmount, reason } = params;

    const claimIndex = this.state.claims.findIndex(c => c.claimId === claimId);
    
    if (claimIndex === -1) {
      throw new Error('Claim not found');
    }

    const claim = this.state.claims[claimIndex];
    const policy = this.state.policies.find(p => p.policyId === claim.policyId);

    if (!policy) {
      throw new Error('Associated policy not found');
    }

    // Update claim status
    claim.status = 'processed';
    claim.approvedAmount = approvedAmount;
    claim.reason = reason;
    claim.processedAt = new Date().toISOString();

    this.state.claims[claimIndex] = claim;
    this.updateState({ claims: this.state.claims });

    return {
      claimId,
      status: 'processed',
      approvedAmount,
      reason,
      message: 'Claim processed successfully'
    };
  }
}

/**
 * Quality Assurance Contract
 * Handles quality verification and compliance checking
 */
class QualityContract extends SmartContract {
  constructor() {
    super();
    this.type = 'quality';
    this.state = {
      qualityStandards: {},
      testResults: [],
      complianceRecords: []
    };
  }

  /**
   * Submit quality test results
   * @param {Object} params - Test result parameters
   */
  async submitTestResults(params) {
    const { batchId, labId, testType, results, standards } = params;

    if (!batchId || !labId || !testType || !results) {
      throw new Error('Invalid test result parameters');
    }

    const testResult = {
      testId: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      batchId,
      labId,
      testType,
      results,
      standards,
      submittedAt: new Date().toISOString(),
      status: 'pending_review'
    };

    this.state.testResults.push(testResult);
    this.updateState({ testResults: this.state.testResults });

    return {
      testId: testResult.testId,
      status: 'submitted',
      message: 'Test results submitted successfully'
    };
  }

  /**
   * Verify quality compliance
   * @param {Object} params - Verification parameters
   */
  async verifyCompliance(params) {
    const { testId, complianceStatus, reviewerId } = params;

    const testIndex = this.state.testResults.findIndex(t => t.testId === testId);
    
    if (testIndex === -1) {
      throw new Error('Test result not found');
    }

    const test = this.state.testResults[testIndex];
    test.status = complianceStatus;
    test.reviewedAt = new Date().toISOString();
    test.reviewerId = reviewerId;

    // Create compliance record
    const complianceRecord = {
      complianceId: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      testId,
      batchId: test.batchId,
      complianceStatus,
      reviewerId,
      createdAt: new Date().toISOString()
    };

    this.state.complianceRecords.push(complianceRecord);
    this.state.testResults[testIndex] = test;

    this.updateState({
      testResults: this.state.testResults,
      complianceRecords: this.state.complianceRecords
    });

    return {
      complianceId: complianceRecord.complianceId,
      testId,
      complianceStatus,
      message: 'Compliance verification completed'
    };
  }
}

/**
 * Supply Chain Contract
 * Handles stakeholder verification and batch transfer validation
 */
class SupplyChainContract extends SmartContract {
  constructor() {
    super();
    this.type = 'supply-chain';
    this.state = {
      stakeholders: [],
      transferRecords: [],
      complianceChecks: []
    };
  }

  /**
   * Register stakeholder
   * @param {Object} params - Stakeholder parameters
   */
  async registerStakeholder(params) {
    const { userId, role, certifications, complianceStatus } = params;

    if (!userId || !role || !certifications) {
      throw new Error('Invalid stakeholder parameters');
    }

    const stakeholder = {
      stakeholderId: `stake_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      role,
      certifications,
      complianceStatus: complianceStatus || 'pending',
      registeredAt: new Date().toISOString()
    };

    this.state.stakeholders.push(stakeholder);
    this.updateState({ stakeholders: this.state.stakeholders });

    return {
      stakeholderId: stakeholder.stakeholderId,
      status: 'registered',
      message: 'Stakeholder registered successfully'
    };
  }

  /**
   * Transfer batch between stakeholders
   * @param {Object} params - Transfer parameters
   */
  async transferBatch(params) {
    const { batchId, fromStakeholderId, toStakeholderId, transferReason } = params;

    const fromStakeholder = this.state.stakeholders.find(s => s.stakeholderId === fromStakeholderId);
    const toStakeholder = this.state.stakeholders.find(s => s.stakeholderId === toStakeholderId);

    if (!fromStakeholder || !toStakeholder) {
      throw new Error('Invalid stakeholder IDs');
    }

    const transfer = {
      transferId: `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      batchId,
      fromStakeholderId,
      toStakeholderId,
      transferReason,
      transferredAt: new Date().toISOString(),
      status: 'completed'
    };

    this.state.transferRecords.push(transfer);
    this.updateState({ transferRecords: this.state.transferRecords });

    return {
      transferId: transfer.transferId,
      status: 'completed',
      message: 'Batch transfer completed successfully'
    };
  }

  /**
   * Verify supply chain compliance
   * @param {Object} params - Verification parameters
   */
  async verifyCompliance(params) {
    const { batchId, checks } = params;

    const complianceCheck = {
      checkId: `check_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      batchId,
      checks,
      verifiedAt: new Date().toISOString(),
      status: 'verified'
    };

    this.state.complianceChecks.push(complianceCheck);
    this.updateState({ complianceChecks: this.state.complianceChecks });

    return {
      checkId: complianceCheck.checkId,
      status: 'verified',
      message: 'Supply chain compliance verified'
    };
  }
}

// Export contract registry instance
const contractRegistry = new ContractRegistry();

module.exports = {
  ContractRegistry,
  SmartContract,
  PaymentContract,
  InsuranceContract,
  QualityContract,
  SupplyChainContract,
  contractRegistry
};