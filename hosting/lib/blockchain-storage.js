/**
 * Blockchain Data Persistence
 * 
 * This module provides blockchain data storage in Firestore, integrity verification,
 * backup and recovery system, and performance optimization for the VaidyaChain system.
 * 
 * @author Team Member 1 - Backend & Database Specialist
 * @version 1.0.0
 */

const admin = require('firebase-admin');
const crypto = require('crypto');
const { logSecurityEvent } = require('./security');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Blockchain Storage Service
 * Handles blockchain data persistence and integrity verification
 */
class BlockchainStorage {
  constructor() {
    this.chainCollection = 'blockchain_chain';
    this.blocksCollection = 'blockchain_blocks';
    this.indexCollection = 'blockchain_index';
    this.backupCollection = 'blockchain_backups';
  }

  /**
   * Store a block in Firestore
   * @param {Object} block - Block to store
   * @returns {Promise<Object>} Storage result
   */
  async storeBlock(block) {
    try {
      // Validate block structure
      if (!this.validateBlockStructure(block)) {
        throw new Error('Invalid block structure');
      }

      // Calculate block hash for verification
      const calculatedHash = this.calculateBlockHash(block);
      if (calculatedHash !== block.hash) {
        throw new Error('Block hash mismatch');
      }

      // Store block data
      const blockData = {
        blockId: block.hash,
        index: block.index,
        timestamp: block.timestamp,
        data: block.data,
        previousHash: block.previousHash,
        hash: block.hash,
        nonce: block.nonce || 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        storedAt: new Date().toISOString()
      };

      // Store in blocks collection
      await db.collection(this.blocksCollection).doc(block.hash).set(blockData);

      // Update chain index
      await this.updateChainIndex(block.index, block.hash);

      // Log storage event
      logSecurityEvent('block_stored', {
        blockId: block.hash,
        index: block.index,
        dataSize: JSON.stringify(block.data).length
      });

      return {
        success: true,
        blockId: block.hash,
        index: block.index,
        storedAt: new Date().toISOString()
      };

    } catch (error) {
      logSecurityEvent('block_storage_failed', {
        error: error.message,
        blockId: block.hash
      });

      throw error;
    }
  }

  /**
   * Retrieve a block from Firestore
   * @param {string} blockId - Block hash or index
   * @returns {Promise<Object>} Retrieved block
   */
  async retrieveBlock(blockId) {
    try {
      let blockDoc;

      // Check if blockId is a hash (string) or index (number)
      if (typeof blockId === 'string' && blockId.length === 64) {
        // Assume it's a hash
        blockDoc = await db.collection(this.blocksCollection).doc(blockId).get();
      } else {
        // Assume it's an index
        const indexDoc = await db.collection(this.indexCollection).doc(blockId.toString()).get();
        if (!indexDoc.exists) {
          throw new Error('Block index not found');
        }
        const blockHash = indexDoc.data().blockId;
        blockDoc = await db.collection(this.blocksCollection).doc(blockHash).get();
      }

      if (!blockDoc.exists) {
        throw new Error('Block not found');
      }

      const blockData = blockDoc.data();

      // Reconstruct block object
      const block = {
        index: blockData.index,
        timestamp: blockData.timestamp,
        data: blockData.data,
        previousHash: blockData.previousHash,
        hash: blockData.hash,
        nonce: blockData.nonce || 0
      };

      // Verify block integrity
      if (!this.verifyBlockIntegrity(block)) {
        throw new Error('Block integrity verification failed');
      }

      return block;

    } catch (error) {
      logSecurityEvent('block_retrieval_failed', {
        error: error.message,
        blockId
      });

      throw error;
    }
  }

  /**
   * Get blockchain length
   * @returns {Promise<number>} Chain length
   */
  async getChainLength() {
    try {
      const indexSnapshot = await db.collection(this.indexCollection).orderBy('index', 'desc').limit(1).get();
      
      if (indexSnapshot.empty) {
        return 0;
      }

      const latestIndex = indexSnapshot.docs[0].data().index;
      return latestIndex + 1; // +1 because index is 0-based

    } catch (error) {
      logSecurityEvent('chain_length_failed', {
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Get blockchain range
   * @param {number} start - Start index
   * @param {number} end - End index
   * @returns {Promise<Array>} Array of blocks
   */
  async getBlockRange(start = 0, end = null) {
    try {
      const chainLength = await this.getChainLength();
      end = end || chainLength - 1;

      if (start < 0 || end >= chainLength || start > end) {
        throw new Error('Invalid range specified');
      }

      const blocks = [];
      
      // Get blocks in range
      for (let i = start; i <= end; i++) {
        const block = await this.retrieveBlock(i);
        blocks.push(block);
      }

      return blocks;

    } catch (error) {
      logSecurityEvent('block_range_failed', {
        error: error.message,
        start,
        end
      });

      throw error;
    }
  }

  /**
   * Verify blockchain integrity
   * @returns {Promise<Object>} Verification result
   */
  async verifyBlockchainIntegrity() {
    try {
      const chainLength = await this.getChainLength();
      const verificationResult = {
        isValid: true,
        errors: [],
        verifiedBlocks: 0,
        totalBlocks: chainLength
      };

      if (chainLength === 0) {
        verificationResult.isValid = true;
        return verificationResult;
      }

      let previousHash = '';
      
      // Verify each block in sequence
      for (let i = 0; i < chainLength; i++) {
        const block = await this.retrieveBlock(i);
        
        // Check genesis block
        if (i === 0) {
          if (block.previousHash !== '0') {
            verificationResult.isValid = false;
            verificationResult.errors.push(`Genesis block has invalid previousHash: ${block.previousHash}`);
          }
        } else {
          // Check previous hash linkage
          if (block.previousHash !== previousHash) {
            verificationResult.isValid = false;
            verificationResult.errors.push(`Block ${i} has invalid previousHash. Expected: ${previousHash}, Got: ${block.previousHash}`);
          }
        }

        // Check hash validity
        const calculatedHash = this.calculateBlockHash(block);
        if (calculatedHash !== block.hash) {
          verificationResult.isValid = false;
          verificationResult.errors.push(`Block ${i} has invalid hash. Expected: ${calculatedHash}, Got: ${block.hash}`);
        }

        previousHash = block.hash;
        verificationResult.verifiedBlocks++;
      }

      // Log verification result
      logSecurityEvent('blockchain_verification', {
        isValid: verificationResult.isValid,
        verifiedBlocks: verificationResult.verifiedBlocks,
        totalBlocks: verificationResult.totalBlocks,
        errors: verificationResult.errors.length
      });

      return verificationResult;

    } catch (error) {
      logSecurityEvent('blockchain_verification_failed', {
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Create blockchain backup
   * @param {string} backupName - Name for the backup
   * @returns {Promise<Object>} Backup result
   */
  async createBackup(backupName) {
    try {
      const chainLength = await this.getChainLength();
      const backupData = {
        backupId: `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: backupName,
        chainLength,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        blocks: []
      };

      // Retrieve all blocks for backup
      for (let i = 0; i < chainLength; i++) {
        const block = await this.retrieveBlock(i);
        backupData.blocks.push(block);
      }

      // Store backup
      await db.collection(this.backupCollection).doc(backupData.backupId).set(backupData);

      // Log backup creation
      logSecurityEvent('blockchain_backup_created', {
        backupId: backupData.backupId,
        name: backupName,
        chainLength,
        dataSize: JSON.stringify(backupData).length
      });

      return {
        success: true,
        backupId: backupData.backupId,
        name: backupName,
        chainLength,
        createdAt: new Date().toISOString()
      };

    } catch (error) {
      logSecurityEvent('blockchain_backup_failed', {
        error: error.message,
        backupName
      });

      throw error;
    }
  }

  /**
   * Restore blockchain from backup
   * @param {string} backupId - ID of backup to restore
   * @returns {Promise<Object>} Restoration result
   */
  async restoreFromBackup(backupId) {
    try {
      // Get backup data
      const backupDoc = await db.collection(this.backupCollection).doc(backupId).get();
      
      if (!backupDoc.exists) {
        throw new Error('Backup not found');
      }

      const backupData = backupDoc.data();

      // Clear existing chain (in a real system, you might want to archive first)
      await this.clearChain();

      // Restore blocks
      for (const block of backupData.blocks) {
        await this.storeBlock(block);
      }

      // Log restoration
      logSecurityEvent('blockchain_restored', {
        backupId,
        chainLength: backupData.chainLength,
        restoredAt: new Date().toISOString()
      });

      return {
        success: true,
        backupId,
        chainLength: backupData.chainLength,
        restoredAt: new Date().toISOString()
      };

    } catch (error) {
      logSecurityEvent('blockchain_restore_failed', {
        error: error.message,
        backupId
      });

      throw error;
    }
  }

  /**
   * Clear the blockchain (for testing/restore purposes)
   */
  async clearChain() {
    try {
      // Clear blocks collection
      const blocksSnapshot = await db.collection(this.blocksCollection).get();
      const blockDeletePromises = blocksSnapshot.docs.map(doc => doc.ref.delete());
      await Promise.all(blockDeletePromises);

      // Clear index collection
      const indexSnapshot = await db.collection(this.indexCollection).get();
      const indexDeletePromises = indexSnapshot.docs.map(doc => doc.ref.delete());
      await Promise.all(indexDeletePromises);

      logSecurityEvent('blockchain_cleared', {
        clearedAt: new Date().toISOString()
      });

    } catch (error) {
      logSecurityEvent('blockchain_clear_failed', {
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Update chain index for fast block lookup
   * @param {number} index - Block index
   * @param {string} blockId - Block hash
   */
  async updateChainIndex(index, blockId) {
    try {
      const indexData = {
        index,
        blockId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection(this.indexCollection).doc(index.toString()).set(indexData);

    } catch (error) {
      logSecurityEvent('index_update_failed', {
        error: error.message,
        index,
        blockId
      });

      throw error;
    }
  }

  /**
   * Validate block structure
   * @param {Object} block - Block to validate
   * @returns {boolean} Validation result
   */
  validateBlockStructure(block) {
    const requiredFields = ['index', 'timestamp', 'data', 'previousHash', 'hash'];
    
    for (const field of requiredFields) {
      if (block[field] === undefined || block[field] === null) {
        return false;
      }
    }

    // Validate hash format (should be 64 character hex string)
    if (typeof block.hash !== 'string' || block.hash.length !== 64) {
      return false;
    }

    return true;
  }

  /**
   * Verify block integrity
   * @param {Object} block - Block to verify
   * @returns {boolean} Verification result
   */
  verifyBlockIntegrity(block) {
    const calculatedHash = this.calculateBlockHash(block);
    return calculatedHash === block.hash;
  }

  /**
   * Calculate block hash
   * @param {Object} block - Block to hash
   * @returns {string} Calculated hash
   */
  calculateBlockHash(block) {
    const blockString = JSON.stringify({
      index: block.index,
      timestamp: block.timestamp,
      data: block.data,
      previousHash: block.previousHash,
      nonce: block.nonce || 0
    });

    return crypto.createHash('sha256').update(blockString).digest('hex');
  }

  /**
   * Get storage statistics
   * @returns {Promise<Object>} Storage statistics
   */
  async getStorageStats() {
    try {
      const chainLength = await this.getChainLength();
      
      // Get blocks count
      const blocksSnapshot = await db.collection(this.blocksCollection).get();
      const blocksCount = blocksSnapshot.size;

      // Get index count
      const indexSnapshot = await db.collection(this.indexCollection).get();
      const indexCount = indexSnapshot.size;

      // Get backups count
      const backupSnapshot = await db.collection(this.backupCollection).get();
      const backupCount = backupSnapshot.size;

      return {
        chainLength,
        blocksCount,
        indexCount,
        backupCount,
        storageEfficiency: blocksCount === chainLength ? 'optimal' : 'degraded',
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      logSecurityEvent('storage_stats_failed', {
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Optimize storage by cleaning up unused indexes
   */
  async optimizeStorage() {
    try {
      const chainLength = await this.getChainLength();
      
      // Get all index entries
      const indexSnapshot = await db.collection(this.indexCollection).get();
      
      const optimizationResult = {
        removedIndexes: 0,
        errors: []
      };

      // Remove indexes that are beyond the current chain length
      for (const doc of indexSnapshot.docs) {
        const index = parseInt(doc.id);
        if (index >= chainLength) {
          try {
            await doc.ref.delete();
            optimizationResult.removedIndexes++;
          } catch (error) {
            optimizationResult.errors.push(`Failed to remove index ${index}: ${error.message}`);
          }
        }
      }

      // Log optimization
      logSecurityEvent('storage_optimized', {
        removedIndexes: optimizationResult.removedIndexes,
        errors: optimizationResult.errors.length
      });

      return optimizationResult;

    } catch (error) {
      logSecurityEvent('storage_optimization_failed', {
        error: error.message
      });

      throw error;
    }
  }
}

// Export storage instance
const blockchainStorage = new BlockchainStorage();

module.exports = {
  BlockchainStorage,
  blockchainStorage
};