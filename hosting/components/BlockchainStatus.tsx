import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Database, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  HardDrive,
  Wifi,
  WifiOff
} from 'lucide-react';

interface BlockchainStatus {
  isSynced: boolean;
  lastSync: string;
  pendingTransactions: number;
  blockchainHealth: 'excellent' | 'good' | 'fair' | 'poor';
  storageUsage: number;
  connectionStatus: 'connected' | 'disconnected' | 'syncing';
}

export const BlockchainStatus: React.FC = () => {
  const [status, setStatus] = useState<BlockchainStatus>({
    isSynced: true,
    lastSync: new Date().toISOString(),
    pendingTransactions: 0,
    blockchainHealth: 'excellent',
    storageUsage: 45,
    connectionStatus: 'connected'
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Simulate real-time status updates
    const interval = setInterval(() => {
      // This would integrate with the blockchain system
      setStatus(prev => ({
        ...prev,
        lastSync: new Date().toISOString(),
        pendingTransactions: Math.floor(Math.random() * 5),
        blockchainHealth: Math.random() > 0.8 ? 'fair' : 'excellent'
      }));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const refreshStatus = async () => {
    setIsRefreshing(true);
    try {
      // This would call the blockchain integrity verification system
      await new Promise(resolve => setTimeout(resolve, 2000));
      setStatus(prev => ({
        ...prev,
        isSynced: true,
        lastSync: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error refreshing blockchain status:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'fair': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getConnectionColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-100';
      case 'syncing': return 'text-blue-600 bg-blue-100';
      case 'disconnected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <Wifi className="w-5 h-5" />;
      case 'syncing': return <RefreshCw className="w-5 h-5 animate-spin" />;
      case 'disconnected': return <WifiOff className="w-5 h-5" />;
      default: return <Wifi className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Connection Status</p>
              <p className={`mt-1 px-2 py-1 rounded-full text-xs font-medium ${getConnectionColor(status.connectionStatus)}`}>
                {status.connectionStatus.toUpperCase()}
              </p>
            </div>
            <div className={`p-3 rounded-full ${getConnectionColor(status.connectionStatus).split(' ')[1]}`}>
              {getStatusIcon(status.connectionStatus)}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Blockchain Health</p>
              <p className={`mt-1 px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(status.blockchainHealth)}`}>
                {status.blockchainHealth.toUpperCase()}
              </p>
            </div>
            <div className={`p-3 rounded-full ${getHealthColor(status.blockchainHealth).split(' ')[1]}`}>
              <Shield className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Transactions</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{status.pendingTransactions}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Storage Usage</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{status.storageUsage}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <HardDrive className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Blockchain Actions</h3>
          <button
            onClick={refreshStatus}
            disabled={isRefreshing}
            className="btn-primary flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Status'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <h4 className="font-medium text-green-900">Blockchain Integrity</h4>
                <p className="text-sm text-green-700">All blocks verified and tamper-free</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <Database className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="font-medium text-blue-900">Data Synchronization</h4>
                <p className="text-sm text-blue-700">Local and cloud data in sync</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Information */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Status</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Last Synchronization</h4>
            <p className="text-gray-600">
              {new Date(status.lastSync).toLocaleString()}
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Blockchain Status</h4>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.isSynced ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {status.isSynced ? 'SYNCHRONIZED' : 'OUT OF SYNC'}
              </span>
              {status.isSynced ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600" />
              )}
            </div>
          </div>
        </div>

        {/* Storage Details */}
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Storage Details</h4>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${status.storageUsage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-1">
            <span>{status.storageUsage}% used</span>
            <span>{100 - status.storageUsage}% available</span>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Network</h4>
            <p className="text-sm text-gray-600">Connected to blockchain network</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Validation</h4>
            <p className="text-sm text-gray-600">All transactions validated</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Backup</h4>
            <p className="text-sm text-gray-600">Automatic backups enabled</p>
          </div>
        </div>
      </div>
    </div>
  );
};