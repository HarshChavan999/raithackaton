/**
 * Blockchain Backup and Restore System
 * 
 * This module provides comprehensive backup and restore functionality
 * for the blockchain system, ensuring data safety and recovery capabilities.
 * 
 * @author Team Member 2 - Blockchain & Smart Contracts Developer
 * @version 1.0.0
 */

const { Blockchain } = require('./blockchain');
const { localStorageBlockchain } = require('./blockchain-storage-local');

/**
 * Blockchain Backup Manager
 * Manages blockchain backup and restore operations
 */
class BlockchainBackupManager {
  constructor() {
    this.backupStorageKey = 'vaidyachain_backups';
    this.backupHistory = [];
    this.maxBackups = 10; // Keep last 10 backups
  }

  /**
   * Create a backup of the current blockchain
   * @param {string} backupName - Name for the backup
   * @param {Blockchain} blockchain - Blockchain to backup
   * @returns {Object} Backup result
   */
  async createBackup(backupName, blockchain) {
    try {
      const timestamp = new Date().toISOString();
      const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Get current backup data
      const backupData = {
        id: backupId,
        name: backupName || `Backup_${timestamp}`,
        timestamp: timestamp,
        blockchainData: blockchain.getBlockchainData(),
        metadata: {
          chainLength: blockchain.getChainLength(),
          difficulty: blockchain.difficulty,
          totalSize: 0, // Will be calculated
          backupType: 'full'
        }
      };

      // Calculate backup size
      const jsonString = JSON.stringify(backupData);
      backupData.metadata.totalSize = new Blob([jsonString]).size;

      // Load existing backups
      const existingBackups = this.loadBackupHistory();
      
      // Add new backup
      existingBackups.push(backupData);
      
      // Maintain backup limit
      if (existingBackups.length > this.maxBackups) {
        // Remove oldest backup
        const oldestBackup = existingBackups.shift();
        console.log(`Removed oldest backup: ${oldestBackup.name}`);
      }

      // Save updated backup history
      this.saveBackupHistory(existingBackups);

      // Also save individual backup file
      localStorage.setItem(`${this.backupStorageKey}_${backupId}`, jsonString);

      // Update backup history
      this.backupHistory = existingBackups;

      return {
        success: true,
        backupId: backupId,
        backupName: backupData.name,
        timestamp: timestamp,
        chainLength: backupData.metadata.chainLength,
        size: backupData.metadata.totalSize,
        message: 'Backup created successfully'
      };

    } catch (error) {
      console.error('Backup creation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Restore blockchain from backup
   * @param {string} backupId - ID of backup to restore
   * @returns {Object} Restore result
   */
  async restoreBackup(backupId) {
    try {
      // Load backup data
      const backupData = this.getBackupData(backupId);
      
      if (!backupData) {
        return {
          success: false,
          error: 'Backup not found'
        };
      }

      // Create new blockchain from backup
      const restoredBlockchain = new Blockchain();
      restoredBlockchain.chain = backupData.blockchainData.chain;
      restoredBlockchain.batchIndex = new Map(Object.entries(backupData.blockchainData.batchIndex));
      restoredBlockchain.difficulty = backupData.blockchainData.difficulty;

      // Verify blockchain integrity
      const integrityCheck = await this.verifyBackupIntegrity(restoredBlockchain);
      
      if (!integrityCheck.isValid) {
        return {
          success: false,
          error: 'Backup integrity check failed',
          issues: integrityCheck.errors
        };
      }

      // Save to LocalStorage
      const saveResult = localStorageBlockchain.saveBlockchain(restoredBlockchain);
      
      if (!saveResult.success) {
        return {
          success: false,
          error: 'Failed to save restored blockchain',
          details: saveResult.error
        };
      }

      return {
        success: true,
        backupId: backupId,
        backupName: backupData.name,
        chainLength: backupData.metadata.chainLength,
        timestamp: backupData.timestamp,
        message: 'Blockchain restored successfully'
      };

    } catch (error) {
      console.error('Backup restoration failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get backup data by ID
   * @param {string} backupId - Backup ID
   * @returns {Object|null} Backup data
   */
  getBackupData(backupId) {
    try {
      const backupString = localStorage.getItem(`${this.backupStorageKey}_${backupId}`);
      
      if (!backupString) {
        return null;
      }

      return JSON.parse(backupString);
    } catch (error) {
      console.error('Error loading backup data:', error);
      return null;
    }
  }

  /**
   * Load backup history
   * @returns {Array} Backup history
   */
  loadBackupHistory() {
    try {
      const historyString = localStorage.getItem(this.backupStorageKey);
      
      if (!historyString) {
        return [];
      }

      return JSON.parse(historyString);
    } catch (error) {
      console.error('Error loading backup history:', error);
      return [];
    }
  }

  /**
   * Save backup history
   * @param {Array} backups - Backup history to save
   */
  saveBackupHistory(backups) {
    try {
      localStorage.setItem(this.backupStorageKey, JSON.stringify(backups));
      this.backupHistory = backups;
    } catch (error) {
      console.error('Error saving backup history:', error);
    }
  }

  /**
   * Get list of all backups
   * @returns {Array} List of backups
   */
  getBackupList() {
    const backups = this.loadBackupHistory();
    
    return backups.map(backup => ({
      id: backup.id,
      name: backup.name,
      timestamp: backup.timestamp,
      chainLength: backup.metadata.chainLength,
      size: backup.metadata.totalSize,
      backupType: backup.metadata.backupType
    })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Delete a specific backup
   * @param {string} backupId - Backup ID to delete
   * @returns {Object} Deletion result
   */
  deleteBackup(backupId) {
    try {
      // Remove from backup history
      const backups = this.loadBackupHistory();
      const backupIndex = backups.findIndex(b => b.id === backupId);
      
      if (backupIndex === -1) {
        return {
          success: false,
          error: 'Backup not found'
        };
      }

      const deletedBackup = backups.splice(backupIndex, 1)[0];
      
      // Remove individual backup file
      localStorage.removeItem(`${this.backupStorageKey}_${backupId}`);
      
      // Save updated history
      this.saveBackupHistory(backups);

      return {
        success: true,
        deletedBackup: deletedBackup.name,
        message: 'Backup deleted successfully'
      };

    } catch (error) {
      console.error('Backup deletion failed:', error);
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
  clearAllBackups() {
    try {
      const backups = this.loadBackupHistory();
      const backupCount = backups.length;

      // Remove all individual backup files
      for (const backup of backups) {
        localStorage.removeItem(`${this.backupStorageKey}_${backup.id}`);
      }

      // Clear backup history
      localStorage.removeItem(this.backupStorageKey);
      this.backupHistory = [];

      return {
        success: true,
        deletedCount: backupCount,
        message: 'All backups cleared successfully'
      };

    } catch (error) {
      console.error('Failed to clear all backups:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify backup integrity
   * @param {Blockchain} blockchain - Blockchain to verify
   * @returns {Object} Verification result
   */
  async verifyBackupIntegrity(blockchain) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      // Check chain validity
      if (!blockchain.isChainValid()) {
        result.isValid = false;
        result.errors.push('Blockchain chain is invalid');
      }

      // Check genesis block
      const genesisBlock = blockchain.chain[0];
      if (!genesisBlock || genesisBlock.index !== 0) {
        result.isValid = false;
        result.errors.push('Invalid genesis block');
      }

      // Check chain length consistency
      if (blockchain.chain.length !== blockchain.getChainLength()) {
        result.isValid = false;
        result.errors.push('Chain length mismatch');
      }

      // Check batch index consistency
      const batchIndexSize = blockchain.batchIndex.size;
      const uniqueBatchIds = new Set();
      
      for (const block of blockchain.chain) {
        if (block.data && block.data.batchId) {
          uniqueBatchIds.add(block.data.batchId);
        }
      }

      if (batchIndexSize !== uniqueBatchIds.size) {
        result.warnings.push('Batch index may be inconsistent');
      }

      return result;

    } catch (error) {
      result.isValid = false;
      result.errors.push(`Integrity check failed: ${error.message}`);
      return result;
    }
  }

  /**
   * Export backup to external format
   * @param {string} backupId - Backup ID to export
   * @returns {string|null} Exported backup data
   */
  exportBackup(backupId) {
    try {
      const backupData = this.getBackupData(backupId);
      
      if (!backupData) {
        console.error('Backup not found for export');
        return null;
      }

      // Add export metadata
      const exportData = {
        ...backupData,
        exportInfo: {
          exportedAt: new Date().toISOString(),
          exportVersion: '1.0.0',
          format: 'vaidyachain-backup'
        }
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Backup export failed:', error);
      return null;
    }
  }

  /**
   * Import backup from external format
   * @param {string} jsonString - JSON string of backup data
   * @returns {Object} Import result
   */
  async importBackup(jsonString) {
    try {
      const importData = JSON.parse(jsonString);
      
      // Validate import format
      if (!importData.blockchainData || !importData.metadata) {
        return {
          success: false,
          error: 'Invalid backup format'
        };
      }

      // Create backup entry
      const backupId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const backupData = {
        id: backupId,
        name: importData.name || `Imported_Backup_${new Date().toISOString()}`,
        timestamp: importData.timestamp || new Date().toISOString(),
        blockchainData: importData.blockchainData,
        metadata: {
          ...importData.metadata,
          importSource: importData.exportInfo ? importData.exportInfo.exportedAt : 'unknown',
          importTimestamp: new Date().toISOString()
        }
      };

      // Save backup
      localStorage.setItem(`${this.backupStorageKey}_${backupId}`, JSON.stringify(backupData));
      
      // Update backup history
      const backups = this.loadBackupHistory();
      backups.push(backupData);
      this.saveBackupHistory(backups);

      return {
        success: true,
        backupId: backupId,
        backupName: backupData.name,
        chainLength: backupData.metadata.chainLength,
        message: 'Backup imported successfully'
      };

    } catch (error) {
      console.error('Backup import failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get backup statistics
   * @returns {Object} Backup statistics
   */
  getBackupStats() {
    const backups = this.loadBackupHistory();
    
    let totalSize = 0;
    let totalBlocks = 0;
    
    for (const backup of backups) {
      totalSize += backup.metadata.totalSize;
      totalBlocks += backup.metadata.chainLength;
    }

    return {
      totalBackups: backups.length,
      totalSize: totalSize,
      averageSize: backups.length > 0 ? totalSize / backups.length : 0,
      totalBlocks: totalBlocks,
      averageBlocks: backups.length > 0 ? totalBlocks / backups.length : 0,
      oldestBackup: backups.length > 0 ? backups[backups.length - 1].timestamp : null,
      newestBackup: backups.length > 0 ? backups[0].timestamp : null,
      maxBackups: this.maxBackups,
      spaceUsed: totalSize
    };
  }

  /**
   * Auto-backup current blockchain
   * @param {Blockchain} blockchain - Blockchain to backup
   * @returns {Object} Auto-backup result
   */
  async autoBackup(blockchain) {
    const timestamp = new Date().toISOString();
    const backupName = `Auto_Backup_${timestamp}`;
    
    return await this.createBackup(backupName, blockchain);
  }

  /**
   * Schedule regular backups
   * @param {number} interval - Backup interval in milliseconds
   * @param {Blockchain} blockchain - Blockchain to backup
   */
  scheduleBackups(interval, blockchain) {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
    }

    this.backupInterval = setInterval(async () => {
      await this.autoBackup(blockchain);
    }, interval);

    console.log(`Backup scheduler started with ${interval}ms interval`);
  }

  /**
   * Stop scheduled backups
   */
  stopScheduledBackups() {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
      console.log('Backup scheduler stopped');
    }
  }
}

/**
 * Blockchain Recovery Manager
 * Manages blockchain recovery scenarios and disaster recovery
 */
class BlockchainRecoveryManager {
  constructor() {
    this.recoveryAttempts = [];
    this.lastRecoveryTime = null;
  }

  /**
   * Attempt automatic recovery
   * @param {Blockchain} currentBlockchain - Current blockchain
   * @returns {Object} Recovery result
   */
  async attemptRecovery(currentBlockchain) {
    try {
      const recoveryResult = {
        success: false,
        recovered: false,
        backupUsed: null,
        message: ''
      };

      // Check if current blockchain is valid
      if (currentBlockchain.isChainValid()) {
        recoveryResult.message = 'Current blockchain is valid, no recovery needed';
        return recoveryResult;
      }

      // Get available backups
      const backupManager = new BlockchainBackupManager();
      const backups = backupManager.getBackupList();

      if (backups.length === 0) {
        recoveryResult.message = 'No backups available for recovery';
        return recoveryResult;
      }

      // Try to restore from latest backup
      const latestBackup = backups[0];
      const restoreResult = await backupManager.restoreBackup(latestBackup.id);

      if (restoreResult.success) {
        recoveryResult.success = true;
        recoveryResult.recovered = true;
        recoveryResult.backupUsed = latestBackup.id;
        recoveryResult.message = `Successfully recovered from backup: ${latestBackup.name}`;
        this.lastRecoveryTime = new Date().toISOString();
      } else {
        recoveryResult.message = `Recovery failed: ${restoreResult.error}`;
      }

      // Log recovery attempt
      this.recoveryAttempts.push({
        timestamp: new Date().toISOString(),
        success: recoveryResult.success,
        backupUsed: recoveryResult.backupUsed,
        reason: 'Automatic recovery attempt'
      });

      return recoveryResult;

    } catch (error) {
      console.error('Recovery attempt failed:', error);
      return {
        success: false,
        recovered: false,
        message: `Recovery failed: ${error.message}`
      };
    }
  }

  /**
   * Get recovery history
   * @returns {Array} Recovery history
   */
  getRecoveryHistory() {
    return this.recoveryAttempts;
  }

  /**
   * Clear recovery history
   */
  clearRecoveryHistory() {
    this.recoveryAttempts = [];
  }

  /**
   * Perform disaster recovery
   * @param {string} backupId - Specific backup to use for recovery
   * @returns {Object} Recovery result
   */
  async performDisasterRecovery(backupId) {
    try {
      const backupManager = new BlockchainBackupManager();
      const restoreResult = await backupManager.restoreBackup(backupId);

      if (restoreResult.success) {
        this.recoveryAttempts.push({
          timestamp: new Date().toISOString(),
          success: true,
          backupUsed: backupId,
          reason: 'Disaster recovery'
        });

        return {
          success: true,
          message: `Disaster recovery successful using backup: ${restoreResult.backupName}`
        };
      } else {
        return {
          success: false,
          message: `Disaster recovery failed: ${restoreResult.error}`
        };
      }

    } catch (error) {
      console.error('Disaster recovery failed:', error);
      return {
        success: false,
        message: `Disaster recovery failed: ${error.message}`
      };
    }
  }
}

// Export backup and recovery classes
module.exports = {
  BlockchainBackupManager,
  BlockchainRecoveryManager
};