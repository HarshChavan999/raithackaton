import React, { useState, useEffect } from 'react';
import { 
  Search, 
  QrCode, 
  Eye, 
  Star, 
  Shield, 
  MapPin, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Download
} from 'lucide-react';

interface ProductTraceability {
  id: string;
  productName: string;
  batchId: string;
  qrCode: string;
  manufacturingDate: string;
  expiryDate: string;
  ingredients: Array<{
    herbType: string;
    batchId: string;
    farmer: string;
    location: string;
    quality: string;
    testResults: {
      purity: number;
      moisture: number;
    };
  }>;
  ratings: {
    average: number;
    count: number;
  };
  blockchainHash: string;
  status: 'verified' | 'pending' | 'expired';
}

export const ConsumerPortal: React.FC = () => {
  const [products, setProducts] = useState<ProductTraceability[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);

  useEffect(() => {
    // Fetch verified products from blockchain system
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // This would integrate with the blockchain system
        const mockProducts: ProductTraceability[] = [
          {
            id: 'PROD-001',
            productName: 'Ashwagandha Capsules',
            batchId: 'BATCH-001',
            qrCode: 'https://example.com/qr/BATCH-001',
            manufacturingDate: '2024-01-10',
            expiryDate: '2025-01-10',
            ingredients: [
              {
                herbType: 'ashwagandha',
                batchId: 'BATCH-001',
                farmer: 'Ramesh Kumar',
                location: 'Nagpur, Maharashtra',
                quality: 'excellent',
                testResults: {
                  purity: 95.2,
                  moisture: 8.5
                }
              }
            ],
            ratings: {
              average: 4.5,
              count: 128
            },
            blockchainHash: '0xabc123...',
            status: 'verified'
          },
          {
            id: 'PROD-002',
            productName: 'Turmeric Powder',
            batchId: 'BATCH-002',
            qrCode: 'https://example.com/qr/BATCH-002',
            manufacturingDate: '2024-01-05',
            expiryDate: '2024-12-05',
            ingredients: [
              {
                herbType: 'turmeric',
                batchId: 'BATCH-002',
                farmer: 'Priya Singh',
                location: 'Bangalore, Karnataka',
                quality: 'good',
                testResults: {
                  purity: 87.6,
                  moisture: 12.3
                }
              }
            ],
            ratings: {
              average: 4.2,
              count: 89
            },
            blockchainHash: '0xdef456...',
            status: 'verified'
          }
        ];
        setProducts(mockProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = products.filter(product => 
    product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.batchId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const verifyProduct = (qrCode: string) => {
    // This would integrate with QR code scanning and blockchain verification
    console.log('Verifying product with QR code:', qrCode);
    alert('Product verification initiated. Please scan the QR code.');
  };

  const exportProductInfo = (product: ProductTraceability) => {
    const csvContent = [
      'Product Name,Batch ID,Manufacturing Date,Expiry Date,Status,Average Rating',
      `"${product.productName}","${product.batchId}","${product.manufacturingDate}","${product.expiryDate}","${product.status}","${product.ratings.average}"`
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `product-${product.batchId}-info.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-8 text-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Product Traceability & Verification</h1>
          <p className="text-green-100 mb-6">
            Scan QR codes to verify product authenticity and trace the complete supply chain journey 
            from farm to your hands. All information is securely stored on the blockchain.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setShowQRScanner(true)}
              className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center space-x-2"
            >
              <QrCode className="w-5 h-5" />
              <span>Scan QR Code</span>
            </button>
            <button className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products by name or batch ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          <button className="btn-primary flex items-center space-x-2">
            <Search className="w-4 h-4" />
            <span>Search Products</span>
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-3 bg-gray-300 rounded w-full"></div>
                <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          ))
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-500">
              No products found. Try searching with a different keyword or scan a QR code.
            </div>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Shield className="w-6 h-6 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{product.productName}</h3>
                    <p className="text-sm text-gray-600">Batch: {product.batchId}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                  {product.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Manuf: {new Date(product.manufacturingDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Expiry: {new Date(product.expiryDate).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Ingredients */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Ingredients</h4>
                <div className="space-y-2">
                  {product.ingredients.map((ingredient, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-gray-900">{ingredient.herbType}</span>
                          <span className="text-xs text-gray-600 ml-2">Batch: {ingredient.batchId}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          ingredient.quality === 'excellent' ? 'bg-green-100 text-green-800' :
                          ingredient.quality === 'good' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {ingredient.quality.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600 mt-1">
                        <span>Farmer: {ingredient.farmer}</span>
                        <span>{ingredient.location}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-600 mt-1">
                        <span>Purity: {ingredient.testResults.purity}%</span>
                        <span>Moisture: {ingredient.testResults.moisture}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ratings */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-900">{product.ratings.average}</span>
                  <span className="text-sm text-gray-600">({product.ratings.count} reviews)</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => exportProductInfo(product)}
                    className="btn-secondary text-sm flex items-center space-x-1"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                  </button>
                  <button className="btn-primary text-sm flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>Full Details</span>
                  </button>
                </div>
              </div>

              {/* Blockchain Hash */}
              <div className="text-xs text-gray-500 border-t border-gray-200 pt-2">
                Blockchain Hash: {product.blockchainHash}
              </div>
            </div>
          ))
        )}
      </div>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full m-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">QR Code Scanner</h3>
              <button
                onClick={() => setShowQRScanner(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Position the QR code within the frame to scan</p>
              <button
                onClick={() => {
                  setShowQRScanner(false);
                  verifyProduct('mock-qr-code');
                }}
                className="btn-primary"
              >
                Simulate Scan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trust Indicators */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Why Trust VaidyaChain?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900">Blockchain Verified</h4>
            <p className="text-sm text-gray-600">All data is immutable and verified on the blockchain</p>
          </div>
          <div className="text-center">
            <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900">Transparent Supply Chain</h4>
            <p className="text-sm text-gray-600">Track every step from farm to consumer</p>
          </div>
          <div className="text-center">
            <MapPin className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900">Geographic Verification</h4>
            <p className="text-sm text-gray-600">GPS coordinates verify origin and authenticity</p>
          </div>
        </div>
      </div>
    </div>
  );
};