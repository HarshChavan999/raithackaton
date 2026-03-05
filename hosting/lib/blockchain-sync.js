/**
 * Blockchain Synchronization System
 * 
 * This module provides synchronization between LocalStorage and Firebase
 * for the blockchain system, ensuring data consistency across platforms.
 * 
 * @author Team Member 2 - Blockchain & Smart Contracts Developer
 * @version 1.0.0
 */

const { Blockchain } = require('./blockchain');
const { localStorageBlockchain } = require('./blockchain-storage-local');
const { blockchainStorage } = require('./blockchain-storage');

/**
 * Blockchain Synchronization Manager
 * Manages synchronization between LocalStorage and Firebase
 */
class BlockchainSyncManager {
  constructor() {
    this.syncStatus = {
      isSyncing: false,
      lastSyncTime: null,
      syncErrors: [],
      conflicts: []
    };
    this.syncInterval = null;
    this.autoSyncEnabled = false;
  }

  /**
   * Initialize synchronization
   * @param {number} syncInterval - Auto-sync interval in milliseconds
   */
  async initialize(syncInterval = 300000) { // Default: 5 minutes
    try {
      // Check if we have data in either storage
      const localStorageData = localStorageBlockchain.loadBlockchain();
      const firebaseData = await this.getFirebaseBlockchain();

      if (!localStorageData && !firebaseData) {
        // Create new blockchain
        const newBlockchain = new Blockchain();
        localStorageBlockchain.saveBlockchain(newBlockchain);
        await this.saveToFirebase(newBlockchain);
        console.log('Initialized new blockchain');
      } else if (localStorageData && !firebaseData) {
        // Sync LocalStorage to Firebase
        await this.saveToFirebase(localStorageData);
        console.log('Synced LocalStorage to Firebase');
      } else if (!localStorageData && firebaseData) {
        // Sync Firebase to LocalStorage
        localStorageBlockchain.saveBlockchain(firebaseData);
        console.log('Synced Firebase to LocalStorage');
      } else {
        // Both have data, need conflict resolution
        await this.resolveConflicts(localStorageData, firebaseData);
      }

      // Start auto-sync if interval provided
      if (syncInterval > 0) {
        this.startAutoSync(syncInterval);
      }

      this.syncStatus.lastSyncTime = new Date().toISOString();
      return { success: true, message: 'Synchronization initialized' };

    } catch (error) {
      console.error('Synchronization initialization failed:', error);
      this.syncStatus.syncErrors.push({
        timestamp: new Date().toISOString(),
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Start auto-sync
   * @param {number} interval - Sync interval in milliseconds
   */
  startAutoSync(interval) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      await this.sync();
    }, interval);

    this.autoSyncEnabled = true;
    console.log(`Auto-sync started with ${interval}ms interval`);
  }

  /**
   * Stop auto-sync
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.autoSyncEnabled = false;
    console.log('Auto-sync stopped');
  }

  /**
   * Perform synchronization
   */
  async sync() {
    if (this.syncStatus.isSyncing) {
      console.log('Sync already in progress');
      return;
    }

    this.syncStatus.isSyncing = true;

    try {
      const localStorageData = localStorageBlockchain.loadBlockchain();
      const firebaseData = await this.getFirebaseBlockchain();

      if (!localStorageData && !firebaseData) {
        // No data to sync
        return { success: true, message: 'No data to sync' };
      }

      if (!localStorageData) {
        // Only Firebase has data
        localStorageBlockchain.saveBlockchain(firebaseData);
        return { success: true, message: 'Synced Firebase to LocalStorage' };
      }

      if (!firebaseData) {
        // Only LocalStorage has data
        await this.saveToFirebase(localStorageData);
        return { success: true, message: 'Synced LocalStorage to Firebase' };
      }

      // Both have data, perform merge
      const mergedBlockchain = this.mergeBlockchains(localStorageData, firebaseData);
      localStorageBlockchain.saveBlockchain(mergedBlockchain);
      await this.saveToFirebase(mergedBlockchain);

      this.syncStatus.lastSyncTime = new Date().toISOString();
      return { success: true, message: 'Synchronization completed' };

    } catch (error) {
      console.error('Synchronization failed:', error);
      this.syncStatus.syncErrors.push({
        timestamp: new Date().toISOString(),
        error: error.message
      });
      return { success: false, error: error.message };
    } finally {
      this.syncStatus.isSyncing = false;
    }
  }

  /**
   * Resolve conflicts between LocalStorage and Firebase
   * @param {Blockchain} localStorageData - LocalStorage blockchain
   * @param {Blockchain} firebaseData - Firebase blockchain
   */
  async resolveConflicts(localStorageData, firebaseData) {
    const localStorageLength = localStorageData.getChainLength();
    const firebaseLength = firebaseData.getChainLength();

    if (localStorageLength > firebaseLength) {
      // LocalStorage is newer, sync to Firebase
      await this.saveToFirebase(localStorageData);
      console.log('Resolved conflict: LocalStorage is newer');
    } else if (firebaseLength > localStorageLength) {
      // Firebase is newer, sync to LocalStorage
      localStorageBlockchain.saveBlockchain(firebaseData);
      console.log('Resolved conflict: Firebase is newer');
    } else {
      // Same length, check for differences
      const localStorageHash = localStorageData.getLatestBlock().hash;
      const firebaseHash = firebaseData.getLatestBlock().hash;

      if (localStorageHash !== firebaseHash) {
        // Different chains, manual resolution needed
        this.syncStatus.conflicts.push({
          timestamp: new Date().toISOString(),
          type: 'chain_divergence',
          localStorageHash,
          firebaseHash,
          localStorageLength,
          firebaseLength
        });
        console.warn('Conflict detected: Chain divergence');
      }
    }
  }

  /**
   * Merge two blockchains
   * @param {Blockchain} blockchain1 - First blockchain
   * @param {Blockchain} blockchain2 - Second blockchain
   * @returns {Blockchain} Merged blockchain
   */
  mergeBlockchains(blockchain1, blockchain2) {
    const mergedChain = new Blockchain();
    
    // Start with the longer chain
    const longerChain = blockchain1.getChainLength() >= blockchain2.getChainLength() 
      ? blockchain1 : blockchain2;
    const shorterChain = blockchain1.getChainLength() < blockchain2.getChainLength() 
      ? blockchain1 : blockchain2;

    // Copy longer chain
    mergedChain.chain = [...longerChain.chain];
    mergedChain.batchIndex = new Map(longerChain.batchIndex);
    mergedChain.difficulty = longerChain.difficulty;

    // Try to merge shorter chain
    for (const block of shorterChain.chain) {
      if (!this.blockExists(mergedChain, block)) {
        // Add missing blocks
        mergedChain.chain.push(block);
        if (block.data.batchId) {
          mergedChain.batchIndex.set(block.data.batchId, block.index);
        }
      }
    }

    // Sort by index
    mergedChain.chain.sort((a, b) => a.index - b.index);

    return mergedChain;
  }

  /**
   * Check if block exists in blockchain
   * @param {Blockchain} blockchain - Blockchain to check
   * @param {Block} block - Block to find
   * @returns {boolean} True if block exists
   */
  blockExists(blockchain, block) {
    return blockchain.chain.some(b => b.hash === block.hash);
  }

  /**
   * Save blockchain to Firebase
   * @param {Blockchain} blockchain - Blockchain to save
   */
  async saveToFirebase(blockchain) {
    try {
      // Convert blockchain to format suitable for Firebase
      const blockchainData = blockchain.getBlockchainData();
      
      // Save to Firebase (this would integrate with the existing Firebase storage)
      await blockchainStorage.storeBlockchain(blockchainData);
      
      return { success: true, message: 'Saved to Firebase successfully' };
    } catch (error) {
      console.error('Error saving to Firebase:', error);
      throw error;
    }
  }

  /**
   * Get blockchain from Firebase
   * @returns {Blockchain|null} Blockchain from Firebase
   */
  async getFirebaseBlockchain() {
    try {
      // Get blockchain from Firebase (this would integrate with existing Firebase storage)
      const blockchainData = await blockchainStorage.getLatestBlockchain();
      
      if (!blockchainData) {
        return null;
      }

      // Convert Firebase data to Blockchain object
      const blockchain = new Blockchain();
      blockchain.chain = blockchainData.chain;
      blockchain.batchIndex = new Map(Object.entries(blockchainData.batchIndex));
      blockchain.difficulty = blockchainData.difficulty;

      return blockchain;
    } catch (error) {
      console.error('Error getting from Firebase:', error);
      return null;
    }
  }

  /**
   * Force sync from LocalStorage to Firebase
   */
  async forceSyncToFirebase() {
    try {
      const localStorageData = localStorageBlockchain.loadBlockchain();
      if (!localStorageData) {
        return { success: false, error: 'No data in LocalStorage' };
      }

      await this.saveToFirebase(localStorageData);
      this.syncStatus.lastSyncTime = new Date().toISOString();
      
      return { success: true, message: 'Forced sync to Firebase completed' };
    } catch (error) {
      console.error('Force sync to Firebase failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Force sync from Firebase to LocalStorage
   */
  async forceSyncFromFirebase() {
    try {
      const firebaseData = await this.getFirebaseBlockchain();
      if (!firebaseData) {
        return { success: false, error: 'No data in Firebase' };
      }

      localStorageBlockchain.saveBlockchain(firebaseData);
      this.syncStatus.lastSyncTime = new Date().toISOString();
      
      return { success: true, message: 'Forced sync from Firebase completed' };
    } catch (error) {
      console.error('Force sync from Firebase failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get synchronization status
   * @returns {Object} Synchronization status
   */
  getSyncStatus() {
    return {
      ...this.syncStatus,
      autoSyncEnabled: this.autoSyncEnabled,
      localStorageAvailable: localStorageBlockchain.isLocalStorageAvailable(),
      lastSyncTime: this.syncStatus.lastSyncTime
    };
  }

  /**
   * Clear synchronization errors
   */
  clearSyncErrors() {
    this.syncStatus.syncErrors = [];
  }

  /**
   * Clear synchronization conflicts
   */
  clearConflicts() {
    this.syncStatus.conflicts = [];
  }

  /**
   * Get synchronization statistics
   * @returns {Object} Synchronization statistics
   */
  getSyncStats() {
    const localStorageData = localStorageBlockchain.loadBlockchain();
    const firebaseData = this.getFirebaseBlockchain();

    return {
      localStorageBlocks: localStorageData ? localStorageData.getChainLength() : 0,
      firebaseBlocks: firebaseData ? firebaseData.getChainLength() : 0,
      syncErrorsCount: this.syncStatus.syncErrors.length,
      conflictsCount: this.syncStatus.conflicts.length,
      autoSyncEnabled: this.autoSyncEnabled,
      lastSyncTime: this.syncStatus.lastSyncTime,
      isSyncing: this.syncStatus.isSyncing
    };
  }
}

/**
 * Offline Sync Manager
 * Manages offline blockchain operations and sync when online
 */
class OfflineSyncManager {
  constructor() {
    this.pendingOperations = [];
    this.isOnline = navigator.onLine;
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processPendingOperations();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Queue operation for later sync
   * @param {string} operation - Operation type
   * @param {Object} data - Operation data
   */
  queueOperation(operation, data) {
    this.pendingOperations.push({
      operation,
      data,
      timestamp: new Date().toISOString()
    });

    // Save to LocalStorage for persistence
    localStorage.setItem('vaidyachain_pending_ops', JSON.stringify(this.pendingOperations));
  }

  /**
   * Process pending operations when online
   */
  async processPendingOperations() {
    if (!this.isOnline || this.pendingOperations.length === 0) {
      return;
    }

    console.log(`Processing ${this.pendingOperations.length} pending operations`);

    for (const operation of this.pendingOperations) {
      try {
        await this.executeOperation(operation);
      } catch (error) {
        console.error('Failed to process operation:', operation, error);
      }
    }

    // Clear processed operations
    this.pendingOperations = [];
    localStorage.removeItem('vaidyachain_pending_ops');
  }

  /**
   * Execute a single operation
   * @param {Object} operation - Operation to execute
   */
  async executeOperation(operation) {
    switch (operation.operation) {
      case 'add_transaction':
        // Process transaction
        break;
      case 'create_block':
        // Create block
        break;
      case 'update_contract':
        // Update smart contract
        break;
      default:
        console.warn('Unknown operation:', operation.operation);
    }
  }

  /**
   * Get pending operations count
   * @returns {number} Pending operations count
   */
  getPendingOperationsCount() {
    return this.pendingOperations.length;
  }

  /**
   * Clear pending operations
   */
  clearPendingOperations() {
    this.pendingOperations = [];
    localStorage.removeItem('vaidyachain_pending_ops');
  }
}

// Export synchronization classes
module.exports = {
  BlockchainSyncManager,
  OfflineSyncManager
};