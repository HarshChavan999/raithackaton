/**
 * Batch Index Optimization System
 * 
 * This module provides batch index optimization for the blockchain system,
 * improving performance and batch lookup efficiency.
 * 
 * @author Team Member 2 - Blockchain & Smart Contracts Developer
 * @version 1.0.0
 */

const { Blockchain } = require('./blockchain');
const { localStorageBlockchain } = require('./blockchain-storage-local');

/**
 * Batch Index Optimizer
 * Manages batch index optimization and performance improvements
 */
class BatchIndexOptimizer {
  constructor() {
    this.optimizationStats = {
      totalBatches: 0,
      optimizationCount: 0,
      lastOptimizationTime: null,
      performanceMetrics: {
        averageLookupTime: 0,
        memoryUsage: 0,
        indexSize: 0
      }
    };
    this.lookupCache = new Map();
    this.batchMetadata = new Map();
  }

  /**
   * Optimize batch index for a blockchain
   * @param {Blockchain} blockchain - Blockchain to optimize
   * @returns {Object} Optimization result
   */
  optimizeBatchIndex(blockchain) {
    try {
      const startTime = Date.now();
      
      // 1. Rebuild batch index from scratch
      const optimizedIndex = this.rebuildBatchIndex(blockchain.chain);
      
      // 2. Update blockchain batch index
      blockchain.batchIndex = optimizedIndex;
      
      // 3. Build batch metadata cache
      this.buildBatchMetadata(blockchain.chain);
      
      // 4. Clear and rebuild lookup cache
      this.lookupCache.clear();
      
      // 5. Update statistics
      const endTime = Date.now();
      const optimizationTime = endTime - startTime;
      
      this.optimizationStats.totalBatches = optimizedIndex.size;
      this.optimizationStats.optimizationCount++;
      this.optimizationStats.lastOptimizationTime = new Date().toISOString();
      this.optimizationStats.performanceMetrics.averageLookupTime = this.calculateAverageLookupTime();
      this.optimizationStats.performanceMetrics.memoryUsage = this.calculateMemoryUsage();
      this.optimizationStats.performanceMetrics.indexSize = optimizedIndex.size;

      return {
        success: true,
        optimizationTime,
        batchesOptimized: optimizedIndex.size,
        message: 'Batch index optimization completed successfully'
      };

    } catch (error) {
      console.error('Batch index optimization failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Rebuild batch index from blockchain chain
   * @param {Array} chain - Blockchain chain
   * @returns {Map} Optimized batch index
   */
  rebuildBatchIndex(chain) {
    const batchIndex = new Map();

    for (let i = 0; i < chain.length; i++) {
      const block = chain[i];
      
      if (block.data && block.data.batchId) {
        // Store block index for batch
        batchIndex.set(block.data.batchId, i);
      } else if (block.data && block.data.transactions) {
        // Handle batch transactions
        for (const transaction of block.data.transactions) {
          if (transaction.data && transaction.data.batchId) {
            batchIndex.set(transaction.data.batchId, i);
          }
        }
      }
    }

    return batchIndex;
  }

  /**
   * Build batch metadata cache
   * @param {Array} chain - Blockchain chain
   */
  buildBatchMetadata(chain) {
    this.batchMetadata.clear();

    for (let i = 0; i < chain.length; i++) {
      const block = chain[i];
      
      if (block.data && block.data.batchId) {
        this.batchMetadata.set(block.data.batchId, {
          blockIndex: i,
          timestamp: block.timestamp,
          transactionType: block.data.type,
          hash: block.hash
        });
      } else if (block.data && block.data.transactions) {
        for (const transaction of block.data.transactions) {
          if (transaction.data && transaction.data.batchId) {
            this.batchMetadata.set(transaction.data.batchId, {
              blockIndex: i,
              timestamp: block.timestamp,
              transactionType: transaction.type,
              hash: block.hash
            });
          }
        }
      }
    }
  }

  /**
   * Get batch information with caching
   * @param {string} batchId - Batch ID
   * @param {Blockchain} blockchain - Blockchain to search
   * @returns {Object|null} Batch information
   */
  getBatchInfo(batchId, blockchain) {
    // Check cache first
    if (this.lookupCache.has(batchId)) {
      return this.lookupCache.get(batchId);
    }

    const startTime = Date.now();
    
    try {
      // Use optimized batch index
      const blockIndex = blockchain.batchIndex.get(batchId);
      
      if (blockIndex !== undefined) {
        const block = blockchain.chain[blockIndex];
        const batchInfo = {
          batchId,
          blockIndex,
          timestamp: block.timestamp,
          hash: block.hash,
          data: block.data,
          found: true
        };

        // Cache the result
        this.lookupCache.set(batchId, batchInfo);
        
        // Update performance metrics
        const lookupTime = Date.now() - startTime;
        this.updateLookupPerformance(lookupTime);

        return batchInfo;
      }

      // If not found in index, search manually (fallback)
      const block = blockchain.getBlockByBatchId(batchId);
      if (block) {
        const batchInfo = {
          batchId,
          blockIndex: block.index,
          timestamp: block.timestamp,
          hash: block.hash,
          data: block.data,
          found: true
        };

        this.lookupCache.set(batchId, batchInfo);
        const lookupTime = Date.now() - startTime;
        this.updateLookupPerformance(lookupTime);

        return batchInfo;
      }

      // Not found
      const batchInfo = {
        batchId,
        found: false
      };

      this.lookupCache.set(batchId, batchInfo);
      const lookupTime = Date.now() - startTime;
      this.updateLookupPerformance(lookupTime);

      return batchInfo;

    } catch (error) {
      console.error('Error getting batch info:', error);
      return {
        batchId,
        found: false,
        error: error.message
      };
    }
  }

  /**
   * Get batch history with optimization
   * @param {string} batchId - Batch ID
   * @param {Blockchain} blockchain - Blockchain to search
   * @returns {Array} Batch history
   */
  getBatchHistory(batchId, blockchain) {
    const history = [];
    
    for (let i = 0; i < blockchain.chain.length; i++) {
      const block = blockchain.chain[i];
      
      if (this.matchesBatchId(block, batchId)) {
        history.push({
          blockIndex: i,
          timestamp: block.timestamp,
          hash: block.hash,
          transactionType: block.data.type || 'unknown',
          data: block.data
        });
      }
    }

    return history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  /**
   * Check if block matches batch ID
   * @param {Block} block - Block to check
   * @param {string} batchId - Batch ID to match
   * @returns {boolean} True if matches
   */
  matchesBatchId(block, batchId) {
    if (block.data && block.data.batchId === batchId) {
      return true;
    }
    
    if (block.data && block.data.transactions) {
      return block.data.transactions.some(tx => 
        tx.data && tx.data.batchId === batchId
      );
    }

    return false;
  }

  /**
   * Update lookup performance metrics
   * @param {number} lookupTime - Lookup time in milliseconds
   */
  updateLookupPerformance(lookupTime) {
    const currentAvg = this.optimizationStats.performanceMetrics.averageLookupTime;
    const count = this.optimizationStats.optimizationCount;
    
    // Calculate new average
    const newAvg = (currentAvg * (count - 1) + lookupTime) / count;
    this.optimizationStats.performanceMetrics.averageLookupTime = newAvg;
  }

  /**
   * Calculate memory usage
   * @returns {number} Memory usage in bytes
   */
  calculateMemoryUsage() {
    let totalSize = 0;
    
    // Calculate batch index size
    totalSize += this.estimateMapSize(this.batchMetadata);
    
    // Calculate lookup cache size
    totalSize += this.estimateMapSize(this.lookupCache);
    
    return totalSize;
  }

  /**
   * Estimate map size in bytes
   * @param {Map} map - Map to estimate
   * @returns {number} Estimated size in bytes
   */
  estimateMapSize(map) {
    let size = 0;
    for (const [key, value] of map.entries()) {
      size += key.length * 2; // UTF-16 characters
      size += JSON.stringify(value).length * 2; // UTF-16 characters
    }
    return size;
  }

  /**
   * Calculate average lookup time
   * @returns {number} Average lookup time in milliseconds
   */
  calculateAverageLookupTime() {
    // This would be calculated based on actual lookup times
    // For now, return a placeholder
    return this.optimizationStats.performanceMetrics.averageLookupTime;
  }

  /**
   * Clear lookup cache
   */
  clearCache() {
    this.lookupCache.clear();
  }

  /**
   * Clear batch metadata
   */
  clearMetadata() {
    this.batchMetadata.clear();
  }

  /**
   * Get optimization statistics
   * @returns {Object} Optimization statistics
   */
  getOptimizationStats() {
    return {
      ...this.optimizationStats,
      cacheSize: this.lookupCache.size,
      metadataSize: this.batchMetadata.size,
      totalMemoryUsage: this.calculateMemoryUsage()
    };
  }

  /**
   * Analyze batch distribution
   * @param {Blockchain} blockchain - Blockchain to analyze
   * @returns {Object} Distribution analysis
   */
  analyzeBatchDistribution(blockchain) {
    const distribution = {
      batchesPerBlock: new Map(),
      blockTypes: new Map(),
      timeDistribution: new Map(),
      totalBatches: 0
    };

    for (let i = 0; i < blockchain.chain.length; i++) {
      const block = blockchain.chain[i];
      let batchCount = 0;

      if (block.data && block.data.batchId) {
        batchCount = 1;
        const type = block.data.type || 'unknown';
        distribution.blockTypes.set(type, (distribution.blockTypes.get(type) || 0) + 1);
      }

      if (block.data && block.data.transactions) {
        for (const transaction of block.data.transactions) {
          if (transaction.data && transaction.data.batchId) {
            batchCount++;
            distribution.blockTypes.set(transaction.type, (distribution.blockTypes.get(transaction.type) || 0) + 1);
          }
        }
      }

      if (batchCount > 0) {
        distribution.batchesPerBlock.set(i, batchCount);
        distribution.totalBatches += batchCount;

        // Time distribution (by hour)
        const hour = new Date(block.timestamp).getHours();
        distribution.timeDistribution.set(hour, (distribution.timeDistribution.get(hour) || 0) + batchCount);
      }
    }

    return distribution;
  }

  /**
   * Optimize for specific batch ID (pre-fetch)
   * @param {string} batchId - Batch ID to optimize for
   * @param {Blockchain} blockchain - Blockchain to optimize
   */
  optimizeForBatch(batchId, blockchain) {
    const batchInfo = this.getBatchInfo(batchId, blockchain);
    
    if (batchInfo && batchInfo.found) {
      // Pre-fetch related batches (same time period)
      this.preFetchRelatedBatches(batchInfo, blockchain);
    }
  }

  /**
   * Pre-fetch related batches
   * @param {Object} batchInfo - Batch information
   * @param {Blockchain} blockchain - Blockchain to search
   */
  preFetchRelatedBatches(batchInfo, blockchain) {
    const batchTime = new Date(batchInfo.timestamp);
    const timeWindow = 30 * 60 * 1000; // 30 minutes
    
    for (let i = 0; i < blockchain.chain.length; i++) {
      const block = blockchain.chain[i];
      const blockTime = new Date(block.timestamp);
      
      if (Math.abs(blockTime - batchTime) <= timeWindow) {
        if (block.data && block.data.batchId) {
          this.getBatchInfo(block.data.batchId, blockchain);
        } else if (block.data && block.data.transactions) {
          for (const transaction of block.data.transactions) {
            if (transaction.data && transaction.data.batchId) {
              this.getBatchInfo(transaction.data.batchId, blockchain);
            }
          }
        }
      }
    }
  }

  /**
   * Perform batch index maintenance
   * @param {Blockchain} blockchain - Blockchain to maintain
   * @returns {Object} Maintenance result
   */
  performMaintenance(blockchain) {
    try {
      // 1. Optimize batch index
      const optimizationResult = this.optimizeBatchIndex(blockchain);
      
      // 2. Clean up cache
      this.cleanupCache();
      
      // 3. Analyze distribution
      const distribution = this.analyzeBatchDistribution(blockchain);
      
      return {
        success: true,
        optimizationResult,
        distribution,
        message: 'Batch index maintenance completed'
      };

    } catch (error) {
      console.error('Batch index maintenance failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Clean up cache (remove old entries)
   */
  cleanupCache() {
    const maxCacheSize = 1000;
    
    if (this.lookupCache.size > maxCacheSize) {
      // Remove oldest entries
      const entriesToRemove = this.lookupCache.size - maxCacheSize;
      let removed = 0;
      
      for (const [key] of this.lookupCache.entries()) {
        if (removed >= entriesToRemove) break;
        this.lookupCache.delete(key);
        removed++;
      }
    }
  }
}

/**
 * Batch Performance Monitor
 * Monitors batch lookup performance and suggests optimizations
 */
class BatchPerformanceMonitor {
  constructor() {
    this.metrics = {
      totalLookups: 0,
      successfulLookups: 0,
      failedLookups: 0,
      averageResponseTime: 0,
      slowLookups: [],
      cacheHitRate: 0
    };
    this.monitoringActive = false;
  }

  /**
   * Start monitoring
   */
  startMonitoring() {
    this.monitoringActive = true;
    console.log('Batch performance monitoring started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    this.monitoringActive = false;
    console.log('Batch performance monitoring stopped');
  }

  /**
   * Record lookup performance
   * @param {string} batchId - Batch ID
   * @param {boolean} found - Whether batch was found
   * @param {number} responseTime - Response time in milliseconds
   */
  recordLookup(batchId, found, responseTime) {
    if (!this.monitoringActive) return;

    this.metrics.totalLookups++;
    
    if (found) {
      this.metrics.successfulLookups++;
    } else {
      this.metrics.failedLookups++;
    }

    // Update average response time
    const currentAvg = this.metrics.averageResponseTime;
    const count = this.metrics.totalLookups;
    this.metrics.averageResponseTime = (currentAvg * (count - 1) + responseTime) / count;

    // Track slow lookups
    if (responseTime > 100) { // Slower than 100ms
      this.metrics.slowLookups.push({
        batchId,
        responseTime,
        timestamp: new Date().toISOString()
      });
    }

    // Keep only last 100 slow lookups
    if (this.metrics.slowLookups.length > 100) {
      this.metrics.slowLookups = this.metrics.slowLookups.slice(-100);
    }

    // Update cache hit rate (would need cache monitoring integration)
    this.updateCacheHitRate();
  }

  /**
   * Update cache hit rate
   */
  updateCacheHitRate() {
    // This would be implemented based on actual cache monitoring
    // For now, calculate based on success rate
    if (this.metrics.totalLookups > 0) {
      this.metrics.cacheHitRate = (this.metrics.successfulLookups / this.metrics.totalLookups) * 100;
    }
  }

  /**
   * Get performance report
   * @returns {Object} Performance report
   */
  getPerformanceReport() {
    return {
      ...this.metrics,
      monitoringActive: this.monitoringActive,
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Generate performance recommendations
   * @returns {Array} Recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    if (this.metrics.averageResponseTime > 50) {
      recommendations.push('Consider increasing batch index optimization frequency');
    }

    if (this.metrics.failedLookups / this.metrics.totalLookups > 0.1) {
      recommendations.push('High failure rate detected - check data consistency');
    }

    if (this.metrics.slowLookups.length > 10) {
      recommendations.push('Multiple slow lookups detected - consider pre-fetching');
    }

    if (this.metrics.cacheHitRate < 80) {
      recommendations.push('Low cache hit rate - optimize cache strategy');
    }

    return recommendations;
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      totalLookups: 0,
      successfulLookups: 0,
      failedLookups: 0,
      averageResponseTime: 0,
      slowLookups: [],
      cacheHitRate: 0
    };
  }
}

// Export optimization classes
module.exports = {
  BatchIndexOptimizer,
  BatchPerformanceMonitor
};