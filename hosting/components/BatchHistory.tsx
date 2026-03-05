import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Droplet, Eye, Download, ExternalLink } from 'lucide-react';

interface Batch {
  id: string;
  herbType: string;
  quantity: number;
  collectionDate: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  status: 'pending' | 'submitted' | 'verified' | 'manufactured';
  blockchainHash: string;
  notes: string;
}

export const BatchHistory: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Fetch batch history from blockchain system
    const fetchBatches = async () => {
      setLoading(true);
      try {
        // This would integrate with the blockchain system
        const mockBatches: Batch[] = [
          {
            id: 'BATCH-001',
            herbType: 'ashwagandha',
            quantity: 15.5,
            collectionDate: '2024-01-15',
            location: {
              latitude: 21.1458,
              longitude: 79.0882,
              address: 'Nagpur, Maharashtra'
            },
            quality: 'excellent',
            status: 'verified',
            blockchainHash: '0xabc123...',
            notes: 'Excellent quality, optimal season collection'
          },
          {
            id: 'BATCH-002',
            herbType: 'turmeric',
            quantity: 8.2,
            collectionDate: '2024-01-10',
            location: {
              latitude: 12.9716,
              longitude: 77.5946,
              address: 'Bangalore, Karnataka'
            },
            quality: 'good',
            status: 'submitted',
            blockchainHash: '0xdef456...',
            notes: 'Good quality, slight moisture content'
          }
        ];
        setBatches(mockBatches);
      } catch (error) {
        console.error('Error fetching batch history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBatches();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'verified': return 'bg-green-100 text-green-800';
      case 'manufactured': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredBatches = batches.filter(batch => {
    if (filter === 'all') return true;
    return batch.status === filter;
  });

  const exportBatch = (batch: Batch) => {
    const csvContent = [
      'Batch ID,Herb Type,Quantity,Collection Date,Quality,Status,Location,Blockchain Hash,Notes',
      `"${batch.id}","${batch.herbType}","${batch.quantity}","${batch.collectionDate}","${batch.quality}","${batch.status}","${batch.location.address}","${batch.blockchainHash}","${batch.notes}"`
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch-${batch.id}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'submitted', 'verified', 'manufactured'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === status 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Batch List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-4 bg-gray-300 rounded w-full"></div>
                ))}
              </div>
            </div>
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-500">
              No batches found for the selected filter.
            </div>
          </div>
        ) : (
          filteredBatches.map((batch) => (
            <div key={batch.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <h3 className="text-lg font-semibold text-gray-900">{batch.herbType.toUpperCase()}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(batch.status)}`}>
                    {batch.status.toUpperCase()}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getQualityColor(batch.quality)}`}>
                    {batch.quality.toUpperCase()}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => exportBatch(batch)}
                    className="btn-secondary text-sm flex items-center space-x-1"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                  </button>
                  <button className="btn-primary text-sm flex items-center space-x-1">
                    <ExternalLink className="w-4 h-4" />
                    <span>View on Blockchain</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(batch.collectionDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Droplet className="w-4 h-4" />
                  <span>{batch.quantity} kg</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{batch.location.address}</span>
                </div>
                <div className="text-gray-600">
                  <span className="font-medium">Hash:</span> {batch.blockchainHash}
                </div>
              </div>

              {batch.notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">{batch.notes}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Total Batches</h4>
          <p className="text-2xl font-bold text-gray-900">{batches.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Pending</h4>
          <p className="text-2xl font-bold text-yellow-600">{batches.filter(b => b.status === 'pending').length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Verified</h4>
          <p className="text-2xl font-bold text-green-600">{batches.filter(b => b.status === 'verified').length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Excellent Quality</h4>
          <p className="text-2xl font-bold text-blue-600">{batches.filter(b => b.quality === 'excellent').length}</p>
        </div>
      </div>
    </div>
  );
};