import React, { useState, useEffect } from 'react';
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  BarChart3,
  Download
} from 'lucide-react';

interface InventoryItem {
  id: string;
  productName: string;
  batchId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderLevel: number;
  expiryDate: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'expired';
  lastUpdated: string;
}

export const InventoryTracking: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Fetch inventory from blockchain system
    const fetchInventory = async () => {
      setLoading(true);
      try {
        // This would integrate with the blockchain system
        const mockInventory: InventoryItem[] = [
          {
            id: 'INV-001',
            productName: 'Ashwagandha Capsules',
            batchId: 'BATCH-001',
            quantity: 1000,
            reservedQuantity: 150,
            availableQuantity: 850,
            reorderLevel: 200,
            expiryDate: '2025-06-15',
            status: 'in-stock',
            lastUpdated: '2024-01-15T10:30:00Z'
          },
          {
            id: 'INV-002',
            productName: 'Turmeric Powder',
            batchId: 'BATCH-002',
            quantity: 50,
            reservedQuantity: 20,
            availableQuantity: 30,
            reorderLevel: 100,
            expiryDate: '2024-12-20',
            status: 'low-stock',
            lastUpdated: '2024-01-14T14:20:00Z'
          },
          {
            id: 'INV-003',
            productName: 'Brahmi Oil',
            batchId: 'BATCH-003',
            quantity: 0,
            reservedQuantity: 0,
            availableQuantity: 0,
            reorderLevel: 50,
            expiryDate: '2024-08-10',
            status: 'out-of-stock',
            lastUpdated: '2024-01-10T09:15:00Z'
          }
        ];
        setInventory(mockInventory);
      } catch (error) {
        console.error('Error fetching inventory:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock': return 'bg-green-100 text-green-800';
      case 'low-stock': return 'bg-yellow-100 text-yellow-800';
      case 'out-of-stock': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in-stock': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'low-stock': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'out-of-stock': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'expired': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const filteredInventory = inventory.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const getStats = () => {
    const totalProducts = inventory.length;
    const inStock = inventory.filter(i => i.status === 'in-stock').length;
    const lowStock = inventory.filter(i => i.status === 'low-stock').length;
    const outOfStock = inventory.filter(i => i.status === 'out-of-stock').length;
    const totalValue = inventory.reduce((acc, item) => acc + (item.availableQuantity * 100), 0); // Mock pricing
    
    return { totalProducts, inStock, lowStock, outOfStock, totalValue };
  };

  const stats = getStats();

  const exportInventory = () => {
    const csvContent = [
      'Product Name,Batch ID,Available,Reserved,Total,Status,Expiry Date,Reorder Level',
      ...inventory.map(item => 
        `"${item.productName}","${item.batchId}","${item.availableQuantity}","${item.reservedQuantity}","${item.quantity}","${item.status}","${item.expiryDate}","${item.reorderLevel}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory-report.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const updateInventory = (itemId: string, field: string, value: any) => {
    setInventory(inventory.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Stock</p>
              <p className="text-2xl font-bold text-green-600">{stats.inStock}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inventory Value</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.totalValue.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', 'in-stock', 'low-stock', 'out-of-stock', 'expired'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === status 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {status.replace('-', ' ').charAt(0).toUpperCase() + status.replace('-', ' ').slice(1)}
          </button>
        ))}
        <button
          onClick={exportInventory}
          className="btn-secondary text-sm flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Export Report</span>
        </button>
      </div>

      {/* Inventory List */}
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
        ) : filteredInventory.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-500">
              No inventory items found for the selected filter.
            </div>
          </div>
        ) : (
          filteredInventory.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(item.status)}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{item.productName}</h3>
                    <p className="text-sm text-gray-600">Batch: {item.batchId}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                    {item.status.toUpperCase()}
                  </span>
                  <button className="btn-primary text-sm flex items-center space-x-1">
                    <BarChart3 className="w-4 h-4" />
                    <span>Analytics</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                <div>
                  <span className="text-gray-600">Available:</span>
                  <p className="font-semibold text-gray-900 mt-1">{item.availableQuantity} units</p>
                </div>
                <div>
                  <span className="text-gray-600">Reserved:</span>
                  <p className="font-semibold text-gray-900 mt-1">{item.reservedQuantity} units</p>
                </div>
                <div>
                  <span className="text-gray-600">Total:</span>
                  <p className="font-semibold text-gray-900 mt-1">{item.quantity} units</p>
                </div>
                <div>
                  <span className="text-gray-600">Reorder Level:</span>
                  <p className="font-semibold text-gray-900 mt-1">{item.reorderLevel} units</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Expiry Date:</span>
                  <p className="font-semibold text-gray-900 mt-1">{new Date(item.expiryDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-gray-600">Last Updated:</span>
                  <p className="font-semibold text-gray-900 mt-1">{new Date(item.lastUpdated).toLocaleString()}</p>
                </div>
              </div>

              {/* Stock Level Indicator */}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Stock Level</span>
                  <span>{item.availableQuantity} / {item.reorderLevel} (Reorder Point)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      item.availableQuantity < item.reorderLevel ? 'bg-red-600' : 'bg-green-600'
                    }`}
                    style={{ 
                      width: `${Math.min((item.availableQuantity / item.reorderLevel) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* Actions */}
              {item.status === 'low-stock' || item.status === 'out-of-stock' && (
                <div className="mt-4 flex space-x-2">
                  <button className="btn-primary text-sm">
                    Reorder Now
                  </button>
                  <button className="btn-secondary text-sm">
                    View Supplier
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Inventory Alerts */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-900 mb-2">Inventory Alerts</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• 2 products are below reorder level</li>
          <li>• 1 product is out of stock</li>
          <li>• Check expiry dates for upcoming expirations</li>
          <li>• Consider bulk ordering for high-demand items</li>
        </ul>
      </div>
    </div>
  );
};