/**
 * LocalStorage Blockchain Persistence
 * 
 * This module provides LocalStorage-based persistence for the blockchain
 * system, enabling offline functionality and data backup capabilities.
 * 
 * @author Team Member 2 - Blockchain & Smart Contracts Developer
 * @version 1.0.0
 */

const { Blockchain } = require('./blockchain');

/**
 * LocalStorage Blockchain Storage
 * Manages blockchain persistence using browser LocalStorage
 */
class LocalStorageBlockchain {
  constructor() {
    this.storageKey = 'vaidyachain_blockchain';
    this.backupKey = 'vaidyachain_backup';
    this.syncKey = 'vaidyachain_sync';
  }

  /**
   * Save blockchain to LocalStorage
   * @param {Blockchain} blockchain - Blockchain instance
   * @returns {Object} Save result
   */
  saveBlockchain(blockchain) {
    try {
      const blockchainData = blockchain.getBlockchainData();
      const jsonString = JSON.stringify(blockchainData);
      
      // Check if LocalStorage is available
      if (!this.isLocalStorageAvailable()) {
        return {
          success: false,
          error: 'LocalStorage not available'
        };
      }

      // Check storage size limit (5MB limit for safety)
      const sizeInBytes = new Blob([jsonString]).size;
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (sizeInBytes > maxSize) {
        return {
          success: false,
          error: 'Blockchain data too large for LocalStorage'
        };
      }

      localStorage.setItem(this.storageKey, jsonString);
      
      // Update sync timestamp
      this.updateSyncTimestamp();
      
      return {
        success: true,
        size: sizeInBytes,
        blocks: blockchainData.chain.length
      };

    } catch (error) {
      console.error('Error saving blockchain to LocalStorage:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Load blockchain from LocalStorage
   * @returns {Blockchain|null} Loaded blockchain or null
   */
  loadBlockchain() {
    try {
      if (!this.isLocalStorageAvailable()) {
        return null;
      }

      const jsonString = localStorage.getItem(this.storageKey);
      
      if (!jsonString) {
        return null;
      }

      const blockchainData = JSON.parse(jsonString);
      const blockchain = new Blockchain();
      
      // Import data into blockchain
      blockchain.chain = blockchainData.chain.map(blockData => {
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
      
      blockchain.batchIndex = new Map(Object.entries(blockchainData.batchIndex));
      blockchain.difficulty = blockchainData.difficulty;

      return blockchain;

    } catch (error) {
      console.error('Error loading blockchain from LocalStorage:', error);
      return null;
    }
  }

  /**
   * Create backup of current blockchain
   * @param {string} backupName - Name for the backup
   * @returns {Object} Backup result
   */
  createBackup(backupName) {
    try {
      if (!this.isLocalStorageAvailable()) {
        return {
          success: false,
          error: 'LocalStorage not available'
        };
      }

      const currentData = localStorage.getItem(this.storageKey);
      
      if (!currentData) {
        return {
          success: false,
          error: 'No blockchain data to backup'
        };
      }

      const backupData = {
        name: backupName || `Backup_${new Date().toISOString()}`,
        timestamp: new Date().toISOString(),
        data: JSON.parse(currentData)
      };

      const backupKey = `${this.backupKey}_${backupData.name}`;
      localStorage.setItem(backupKey, JSON.stringify(backupData));

      return {
        success: true,
        backupName: backupData.name,
        timestamp: backupData.timestamp
      };

    } catch (error) {
      console.error('Error creating backup:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Restore blockchain from backup
   * @param {string} backupName - Name of backup to restore
   * @returns {Object} Restore result
   */
  restoreFromBackup(backupName) {
    try {
      if (!this.isLocalStorageAvailable()) {
        return {
          success: false,
          error: 'LocalStorage not available'
        };
      }

      const backupKey = `${this.backupKey}_${backupName}`;
      const backupDataString = localStorage.getItem(backupKey);
      
      if (!backupDataString) {
        return {
          success: false,
          error: 'Backup not found'
        };
      }

      const backupData = JSON.parse(backupDataString);
      
      // Save backup data as current blockchain
      localStorage.setItem(this.storageKey, JSON.stringify(backupData.data));
      
      // Update sync timestamp
      this.updateSyncTimestamp();

      return {
        success: true,
        backupName: backupData.name,
        timestamp: backupData.timestamp
      };

    } catch (error) {
      console.error('Error restoring from backup:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get list of available backups
   * @returns {Array} List of backups
   */
  getBackups() {
    try {
      if (!this.isLocalStorageAvailable()) {
        return [];
      }

      const backups = [];
      const prefix = `${this.backupKey}_`;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        if (key && key.startsWith(prefix)) {
          try {
            const backupDataString = localStorage.getItem(key);
            const backupData = JSON.parse(backupDataString);
            
            backups.push({
              name: backupData.name,
              timestamp: backupData.timestamp,
              size: backupDataString.length
            });
          } catch (error) {
            console.warn('Invalid backup data:', key, error);
          }
        }
      }

      return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    } catch (error) {
      console.error('Error getting backups:', error);
      return [];
    }
  }

  /**
   * Delete a specific backup
   * @param {string} backupName - Name of backup to delete
   * @returns {Object} Delete result
   */
  deleteBackup(backupName) {
    try {
      if (!this.isLocalStorageAvailable()) {
        return {
          success: false,
          error: 'LocalStorage not available'
        };
      }

      const backupKey = `${this.backupKey}_${backupName}`;
      const backupData = localStorage.getItem(backupKey);
      
      if (!backupData) {
        return {
          success: false,
          error: 'Backup not found'
        };
      }

      localStorage.removeItem(backupKey);

      return {
        success: true,
        message: `Backup '${backupName}' deleted successfully`
      };

    } catch (error) {
      console.error('Error deleting backup:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Clear all blockchain data
   * @returns {Object} Clear result
   */
  clearBlockchain() {
    try {
      if (!this.isLocalStorageAvailable()) {
        return {
          success: false,
          error: 'LocalStorage not available'
        };
      }

      localStorage.removeItem(this.storageKey);

      return {
        success: true,
        message: 'Blockchain data cleared'
      };

    } catch (error) {
      console.error('Error clearing blockchain:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Clear all backups
   * @returns {Object} Clear result
   */
  clearBackups() {
    try {
      if (!this.isLocalStorageAvailable()) {
        return {
          success: false,
          error: 'LocalStorage not available'
        };
      }

      const prefix = `${this.backupKey}_`;
      const keysToDelete = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        if (key && key.startsWith(prefix)) {
          keysToDelete.push(key);
        }
      }

      keysToDelete.forEach(key => localStorage.removeItem(key));

      return {
        success: true,
        deletedCount: keysToDelete.length,
        message: 'All backups cleared'
      };

    } catch (error) {
      console.error('Error clearing backups:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get storage statistics
   * @returns {Object} Storage statistics
   */
  getStorageStats() {
    try {
      if (!this.isLocalStorageAvailable()) {
        return {
          available: false,
          totalSize: 0,
          usedSize: 0,
          freeSize: 0,
          backupsCount: 0
        };
      }

      let totalSize = 0;
      let usedSize = 0;
      let backupsCount = 0;

      // Calculate total used size
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        
        if (key && value) {
          totalSize += key.length + value.length;
          
          if (key === this.storageKey) {
            usedSize = value.length;
          } else if (key.startsWith(this.backupKey)) {
            backupsCount++;
          }
        }
      }

      // LocalStorage limit is typically 5MB (5,242,880 bytes)
      const limit = 5 * 1024 * 1024;
      const freeSize = Math.max(0, limit - totalSize);

      return {
        available: true,
        totalSize: totalSize,
        usedSize: usedSize,
        freeSize: freeSize,
        backupsCount: backupsCount,
        limit: limit
      };

    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        available: false,
        error: error.message
      };
    }
  }

  /**
   * Check if LocalStorage is available
   * @returns {boolean} True if available
   */
  isLocalStorageAvailable() {
    try {
      const testKey = '__localStorage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Update sync timestamp
   */
  updateSyncTimestamp() {
    try {
      if (this.isLocalStorageAvailable()) {
        localStorage.setItem(this.syncKey, new Date().toISOString());
      }
    } catch (error) {
      console.warn('Could not update sync timestamp:', error);
    }
  }

  /**
   * Get last sync timestamp
   * @returns {string|null} Last sync timestamp
   */
  getLastSyncTimestamp() {
    try {
      if (!this.isLocalStorageAvailable()) {
        return null;
      }

      return localStorage.getItem(this.syncKey);
    } catch (error) {
      console.warn('Could not get sync timestamp:', error);
      return null;
    }
  }

  /**
   * Export blockchain data for external use
   * @returns {string} JSON string
   */
  exportBlockchain() {
    try {
      if (!this.isLocalStorageAvailable()) {
        return null;
      }

      const data = localStorage.getItem(this.storageKey);
      return data;
    } catch (error) {
      console.error('Error exporting blockchain:', error);
      return null;
    }
  }

  /**
   * Import blockchain data from external source
   * @param {string} jsonString - JSON string
   * @returns {Object} Import result
   */
  importBlockchain(jsonString) {
    try {
      if (!this.isLocalStorageAvailable()) {
        return {
          success: false,
          error: 'LocalStorage not available'
        };
      }

      // Validate JSON
      JSON.parse(jsonString);

      localStorage.setItem(this.storageKey, jsonString);
      this.updateSyncTimestamp();

      return {
        success: true,
        message: 'Blockchain imported successfully'
      };

    } catch (error) {
      console.error('Error importing blockchain:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export LocalStorage blockchain instance
const localStorageBlockchain = new LocalStorageBlockchain();

module.exports = {
  LocalStorageBlockchain,
  localStorageBlockchain
};