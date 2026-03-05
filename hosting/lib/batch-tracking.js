/**
 * Batch Tracking System
 * 
 * This module provides comprehensive batch tracking functionality for the VaidyaChain
 * supply chain, including batch lifecycle management, status monitoring, and
 * integration with blockchain and smart contracts.
 * 
 * @author Team Member 1 - Backend & Database Specialist
 * @version 1.0.0
 */

const admin = require('firebase-admin');
const { logSecurityEvent } = require('./security');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Batch Tracking Service
 * Manages batch creation, lifecycle tracking, and status monitoring
 */
class BatchTracking {
  constructor() {
    this.batchesCollection = 'batches';
    this.batchHistoryCollection = 'batch_history';
    this.batchStatusCollection = 'batch_status';
  }

  /**
   * Create a new batch
   * @param {Object} batchData - Batch creation data
   * @returns {Promise<Object>} Created batch
   */
  async createBatch(batchData) {
    try {
      // Validate batch data
      const validatedData = this.validateBatchData(batchData);
      
      // Generate batch ID
      const batchId = this.generateBatchId(validatedData);
      
      // Create batch record
      const batch = {
        batchId,
        herbType: validatedData.herbType,
        quantity: validatedData.quantity,
        unit: validatedData.unit || 'kg',
        location: validatedData.location,
        ownerId: validatedData.ownerId,
        ownerRole: validatedData.ownerRole,
        status: 'created',
        qualityStatus: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          creationMethod: validatedData.creationMethod || 'manual',
          source: validatedData.source || 'unknown',
          batchType: validatedData.batchType || 'raw_material'
        },
        lifecycle: [
          {
            status: 'created',
            timestamp: new Date().toISOString(),
            userId: validatedData.ownerId,
            role: validatedData.ownerRole,
            notes: 'Batch created'
          }
        ]
      };

      // Store batch
      await db.collection(this.batchesCollection).doc(batchId).set(batch);

      // Log creation event
      logSecurityEvent('batch_created', {
        batchId,
        herbType: validatedData.herbType,
        quantity: validatedData.quantity,
        ownerId: validatedData.ownerId
      });

      // Create initial status record
      await this.updateBatchStatus(batchId, 'created', validatedData.ownerId, validatedData.ownerRole);

      return {
        success: true,
        batchId,
        batch,
        message: 'Batch created successfully'
      };

    } catch (error) {
      logSecurityEvent('batch_creation_failed', {
        error: error.message,
        herbType: batchData.herbType,
        ownerId: batchData.ownerId
      });

      throw error;
    }
  }

  /**
   * Update batch status and lifecycle
   * @param {string} batchId - Batch ID
   * @param {string} newStatus - New status
   * @param {string} userId - User making the update
   * @param {string} role - User role
   * @param {Object} additionalData - Additional data for the update
   * @returns {Promise<Object>} Update result
   */
  async updateBatchStatus(batchId, newStatus, userId, role, additionalData = {}) {
    try {
      const batchDoc = await db.collection(this.batchesCollection).doc(batchId).get();
      
      if (!batchDoc.exists) {
        throw new Error('Batch not found');
      }

      const batch = batchDoc.data();
      const previousStatus = batch.status;

      // Validate status transition
      const validTransitions = this.getValidStatusTransitions(previousStatus);
      if (!validTransitions.includes(newStatus)) {
        throw new Error(`Invalid status transition from ${previousStatus} to ${newStatus}`);
      }

      // Update batch
      const updateData = {
        status: newStatus,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        ...additionalData
      };

      await db.collection(this.batchesCollection).doc(batchId).update(updateData);

      // Add to lifecycle history
      const lifecycleEntry = {
        status: newStatus,
        previousStatus,
        timestamp: new Date().toISOString(),
        userId,
        role,
        notes: additionalData.notes || `Status changed to ${newStatus}`,
        ...additionalData
      };

      await db.collection(this.batchHistoryCollection).add({
        batchId,
        ...lifecycleEntry
      });

      // Update current status record
      await this.updateCurrentStatus(batchId, newStatus, userId, role);

      // Log status change
      logSecurityEvent('batch_status_updated', {
        batchId,
        previousStatus,
        newStatus,
        userId,
        role
      });

      return {
        success: true,
        batchId,
        previousStatus,
        newStatus,
        timestamp: new Date().toISOString(),
        message: `Batch status updated to ${newStatus}`
      };

    } catch (error) {
      logSecurityEvent('batch_status_update_failed', {
        error: error.message,
        batchId,
        newStatus,
        userId
      });

      throw error;
    }
  }

  /**
   * Get batch details
   * @param {string} batchId - Batch ID
   * @returns {Promise<Object>} Batch details
   */
  async getBatchDetails(batchId) {
    try {
      const batchDoc = await db.collection(this.batchesCollection).doc(batchId).get();
      
      if (!batchDoc.exists) {
        throw new Error('Batch not found');
      }

      const batch = batchDoc.data();
      
      // Get lifecycle history
      const historySnapshot = await db.collection(this.batchHistoryCollection)
        .where('batchId', '==', batchId)
        .orderBy('timestamp', 'desc')
        .get();

      const lifecycle = historySnapshot.docs.map(doc => doc.data());
      
      // Get current status
      const statusDoc = await db.collection(this.batchStatusCollection).doc(batchId).get();
      const currentStatus = statusDoc.exists ? statusDoc.data() : null;

      return {
        batchId,
        herbType: batch.herbType,
        quantity: batch.quantity,
        unit: batch.unit,
        location: batch.location,
        ownerId: batch.ownerId,
        ownerRole: batch.ownerRole,
        status: batch.status,
        qualityStatus: batch.qualityStatus,
        createdAt: batch.createdAt,
        updatedAt: batch.updatedAt,
        metadata: batch.metadata,
        lifecycle,
        currentStatus,
        historyCount: lifecycle.length
      };

    } catch (error) {
      logSecurityEvent('batch_details_failed', {
        error: error.message,
        batchId
      });

      throw error;
    }
  }

  /**
   * Get batch lifecycle history
   * @param {string} batchId - Batch ID
   * @param {number} limit - Limit results
   * @returns {Promise<Array>} Lifecycle history
   */
  async getBatchHistory(batchId, limit = 50) {
    try {
      const historySnapshot = await db.collection(this.batchHistoryCollection)
        .where('batchId', '==', batchId)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return historySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));

    } catch (error) {
      logSecurityEvent('batch_history_failed', {
        error: error.message,
        batchId
      });

      throw error;
    }
  }

  /**
   * Transfer batch ownership
   * @param {string} batchId - Batch ID
   * @param {string} newOwnerId - New owner ID
   * @param {string} newOwnerRole - New owner role
   * @param {string} userId - User initiating transfer
   * @param {string} role - User role
   * @param {Object} transferData - Transfer details
   * @returns {Promise<Object>} Transfer result
   */
  async transferBatch(batchId, newOwnerId, newOwnerRole, userId, role, transferData = {}) {
    try {
      const batchDoc = await db.collection(this.batchesCollection).doc(batchId).get();
      
      if (!batchDoc.exists) {
        throw new Error('Batch not found');
      }

      const batch = batchDoc.data();
      const previousOwner = {
        id: batch.ownerId,
        role: batch.ownerRole
      };

      // Validate transfer rules
      if (!this.validateTransferRules(batch, newOwnerRole, role)) {
        throw new Error('Transfer not allowed based on current status or roles');
      }

      // Update batch ownership
      const updateData = {
        ownerId: newOwnerId,
        ownerRole: newOwnerRole,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        ...transferData
      };

      await db.collection(this.batchesCollection).doc(batchId).update(updateData);

      // Add transfer to lifecycle
      const transferEntry = {
        status: 'transferred',
        previousStatus: batch.status,
        timestamp: new Date().toISOString(),
        userId,
        role,
        notes: `Batch transferred from ${previousOwner.role} (${previousOwner.id}) to ${newOwnerRole} (${newOwnerId})`,
        transferDetails: {
          from: previousOwner,
          to: {
            id: newOwnerId,
            role: newOwnerRole
          },
          ...transferData
        }
      };

      await db.collection(this.batchHistoryCollection).add({
        batchId,
        ...transferEntry
      });

      // Log transfer
      logSecurityEvent('batch_transferred', {
        batchId,
        from: previousOwner,
        to: {
          id: newOwnerId,
          role: newOwnerRole
        },
        userId,
        role
      });

      return {
        success: true,
        batchId,
        previousOwner,
        newOwner: {
          id: newOwnerId,
          role: newOwnerRole
        },
        timestamp: new Date().toISOString(),
        message: 'Batch transfer completed successfully'
      };

    } catch (error) {
      logSecurityEvent('batch_transfer_failed', {
        error: error.message,
        batchId,
        newOwnerId,
        userId
      });

      throw error;
    }
  }

  /**
   * Update batch quality status
   * @param {string} batchId - Batch ID
   * @param {string} qualityStatus - Quality status
   * @param {string} testResults - Test results
   * @param {string} labId - Lab ID
   * @returns {Promise<Object>} Quality update result
   */
  async updateQualityStatus(batchId, qualityStatus, testResults, labId) {
    try {
      const batchDoc = await db.collection(this.batchesCollection).doc(batchId).get();
      
      if (!batchDoc.exists) {
        throw new Error('Batch not found');
      }

      // Update quality status
      await db.collection(this.batchesCollection).doc(batchId).update({
        qualityStatus,
        testResults,
        labId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Add quality check to lifecycle
      const qualityEntry = {
        status: 'quality_checked',
        timestamp: new Date().toISOString(),
        userId: labId,
        role: 'lab',
        notes: `Quality status updated to ${qualityStatus}`,
        qualityDetails: {
          status: qualityStatus,
          testResults,
          labId
        }
      };

      await db.collection(this.batchHistoryCollection).add({
        batchId,
        ...qualityEntry
      });

      // Log quality update
      logSecurityEvent('batch_quality_updated', {
        batchId,
        qualityStatus,
        labId,
        testResults: testResults ? Object.keys(testResults).length : 0
      });

      return {
        success: true,
        batchId,
        qualityStatus,
        labId,
        timestamp: new Date().toISOString(),
        message: 'Batch quality status updated'
      };

    } catch (error) {
      logSecurityEvent('batch_quality_update_failed', {
        error: error.message,
        batchId,
        qualityStatus,
        labId
      });

      throw error;
    }
  }

  /**
   * Search batches by criteria
   * @param {Object} criteria - Search criteria
   * @param {number} limit - Result limit
   * @returns {Promise<Array>} Search results
   */
  async searchBatches(criteria, limit = 100) {
    try {
      let query = db.collection(this.batchesCollection);

      // Apply filters
      if (criteria.herbType) {
        query = query.where('herbType', '==', criteria.herbType);
      }

      if (criteria.status) {
        query = query.where('status', '==', criteria.status);
      }

      if (criteria.ownerId) {
        query = query.where('ownerId', '==', criteria.ownerId);
      }

      if (criteria.ownerRole) {
        query = query.where('ownerRole', '==', criteria.ownerRole);
      }

      if (criteria.location) {
        query = query.where('location', '==', criteria.location);
      }

      if (criteria.qualityStatus) {
        query = query.where('qualityStatus', '==', criteria.qualityStatus);
      }

      if (criteria.createdAt) {
        query = query.where('createdAt', '>=', criteria.createdAt);
      }

      const snapshot = await query.limit(limit).get();
      
      const results = [];
      for (const doc of snapshot.docs) {
        const batch = doc.data();
        
        // Get recent history
        const historySnapshot = await db.collection(this.batchHistoryCollection)
          .where('batchId', '==', batch.batchId)
          .orderBy('timestamp', 'desc')
          .limit(1)
          .get();

        const recentHistory = historySnapshot.docs.length > 0 ? 
          historySnapshot.docs[0].data() : null;

        results.push({
          ...batch,
          recentHistory,
          id: doc.id
        });
      }

      return results;

    } catch (error) {
      logSecurityEvent('batch_search_failed', {
        error: error.message,
        criteria
      });

      throw error;
    }
  }

  /**
   * Get batch analytics
   * @param {Object} filters - Analytics filters
   * @returns {Promise<Object>} Analytics data
   */
  async getBatchAnalytics(filters = {}) {
    try {
      const batches = await this.searchBatches(filters);
      
      const analytics = {
        totalBatches: batches.length,
        statusDistribution: {},
        herbTypeDistribution: {},
        qualityStatusDistribution: {},
        averageAge: 0,
        totalQuantity: 0,
        byLocation: {},
        byOwnerRole: {}
      };

      let totalAge = 0;
      const now = new Date();

      for (const batch of batches) {
        // Status distribution
        analytics.statusDistribution[batch.status] = 
          (analytics.statusDistribution[batch.status] || 0) + 1;

        // Herb type distribution
        analytics.herbTypeDistribution[batch.herbType] = 
          (analytics.herbTypeDistribution[batch.herbType] || 0) + 1;

        // Quality status distribution
        analytics.qualityStatusDistribution[batch.qualityStatus] = 
          (analytics.qualityStatusDistribution[batch.qualityStatus] || 0) + 1;

        // Location distribution
        analytics.byLocation[batch.location] = 
          (analytics.byLocation[batch.location] || 0) + 1;

        // Owner role distribution
        analytics.byOwnerRole[batch.ownerRole] = 
          (analytics.byOwnerRole[batch.ownerRole] || 0) + 1;

        // Quantity aggregation
        analytics.totalQuantity += batch.quantity;

        // Age calculation
        if (batch.createdAt) {
          const createdAt = batch.createdAt.toDate ? batch.createdAt.toDate() : new Date(batch.createdAt);
          totalAge += now - createdAt;
        }
      }

      // Calculate average age in days
      if (batches.length > 0) {
        analytics.averageAge = Math.round((totalAge / batches.length) / (1000 * 60 * 60 * 24));
      }

      return analytics;

    } catch (error) {
      logSecurityEvent('batch_analytics_failed', {
        error: error.message,
        filters
      });

      throw error;
    }
  }

  /**
   * Validate batch data
   * @param {Object} batchData - Batch data to validate
   * @returns {Object} Validated data
   */
  validateBatchData(batchData) {
    const errors = [];

    if (!batchData.herbType || typeof batchData.herbType !== 'string') {
      errors.push('Invalid herb type');
    }

    if (!batchData.quantity || batchData.quantity <= 0) {
      errors.push('Invalid quantity');
    }

    if (!batchData.location || typeof batchData.location !== 'string') {
      errors.push('Invalid location');
    }

    if (!batchData.ownerId || typeof batchData.ownerId !== 'string') {
      errors.push('Invalid owner ID');
    }

    if (!batchData.ownerRole || !['farmer', 'lab', 'manufacturer', 'consumer'].includes(batchData.ownerRole)) {
      errors.push('Invalid owner role');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    return batchData;
  }

  /**
   * Generate batch ID
   * @param {Object} batchData - Batch data
   * @returns {string} Generated batch ID
   */
  generateBatchId(batchData) {
    const timestamp = Date.now().toString(36);
    const herbCode = batchData.herbType.substring(0, 3).toUpperCase();
    const ownerCode = batchData.ownerId.substring(0, 4).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    
    return `${herbCode}-${timestamp}-${ownerCode}-${random}`;
  }

  /**
   * Get valid status transitions
   * @param {string} currentStatus - Current status
   * @returns {Array} Valid next statuses
   */
  getValidStatusTransitions(currentStatus) {
    const transitions = {
      'created': ['collected', 'testing', 'manufacturing', 'distributed', 'sold'],
      'collected': ['testing', 'stored'],
      'testing': ['quality_checked', 'rejected'],
      'quality_checked': ['manufacturing', 'stored'],
      'rejected': ['disposed'],
      'manufacturing': ['manufactured', 'rejected'],
      'manufactured': ['distributed', 'stored'],
      'distributed': ['sold', 'stored'],
      'sold': ['delivered'],
      'stored': ['distributed', 'sold', 'disposed'],
      'delivered': ['completed'],
      'disposed': [],
      'completed': []
    };

    return transitions[currentStatus] || [];
  }

  /**
   * Validate transfer rules
   * @param {Object} batch - Batch data
   * @param {string} newOwnerRole - New owner role
   * @param {string} currentRole - Current user role
   * @returns {boolean} Validation result
   */
  validateTransferRules(batch, newOwnerRole, currentRole) {
    // Only certain roles can transfer to certain other roles
    const transferRules = {
      'farmer': ['lab', 'manufacturer'],
      'lab': ['manufacturer'],
      'manufacturer': ['manufacturer', 'consumer'],
      'consumer': []
    };

    const allowedTransfers = transferRules[currentRole] || [];
    return allowedTransfers.includes(newOwnerRole);
  }

  /**
   * Update current status record
   * @param {string} batchId - Batch ID
   * @param {string} status - Current status
   * @param {string} userId - User ID
   * @param {string} role - User role
   */
  async updateCurrentStatus(batchId, status, userId, role) {
    try {
      const statusData = {
        batchId,
        status,
        userId,
        role,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection(this.batchStatusCollection).doc(batchId).set(statusData);

    } catch (error) {
      logSecurityEvent('current_status_update_failed', {
        error: error.message,
        batchId,
        status,
        userId
      });

      throw error;
    }
  }

  /**
   * Get batch statistics
   * @returns {Promise<Object>} Batch statistics
   */
  async getBatchStatistics() {
    try {
      const snapshot = await db.collection(this.batchesCollection).get();
      
      const stats = {
        totalBatches: snapshot.size,
        statusCounts: {},
        herbTypeCounts: {},
        qualityStatusCounts: {},
        averageQuantity: 0,
        totalQuantity: 0
      };

      let totalQuantity = 0;

      snapshot.docs.forEach(doc => {
        const batch = doc.data();
        
        // Count by status
        stats.statusCounts[batch.status] = (stats.statusCounts[batch.status] || 0) + 1;
        
        // Count by herb type
        stats.herbTypeCounts[batch.herbType] = (stats.herbTypeCounts[batch.herbType] || 0) + 1;
        
        // Count by quality status
        stats.qualityStatusCounts[batch.qualityStatus] = (stats.qualityStatusCounts[batch.qualityStatus] || 0) + 1;
        
        // Aggregate quantity
        totalQuantity += batch.quantity;
      });

      stats.totalQuantity = totalQuantity;
      stats.averageQuantity = snapshot.size > 0 ? totalQuantity / snapshot.size : 0;

      return stats;

    } catch (error) {
      logSecurityEvent('batch_statistics_failed', {
        error: error.message
      });

      throw error;
    }
  }
}

// Export batch tracking instance
const batchTracking = new BatchTracking();

module.exports = {
  BatchTracking,
  batchTracking
};