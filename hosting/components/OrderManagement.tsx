import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Download,
  TrendingUp,
  Users
} from 'lucide-react';

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  product: string;
  quantity: number;
  orderDate: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  shippingAddress: string;
  paymentStatus: 'paid' | 'pending' | 'failed';
}

export const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Fetch orders from blockchain system
    const fetchOrders = async () => {
      setLoading(true);
      try {
        // This would integrate with the blockchain system
        const mockOrders: Order[] = [
          {
            id: 'ORD-001',
            customerName: 'Amit Sharma',
            customerEmail: 'amit@example.com',
            product: 'Ashwagandha Capsules',
            quantity: 2,
            orderDate: '2024-01-15',
            status: 'processing',
            totalAmount: 1200,
            shippingAddress: '123 Main St, Mumbai, Maharashtra',
            paymentStatus: 'paid'
          },
          {
            id: 'ORD-002',
            customerName: 'Priya Singh',
            customerEmail: 'priya@example.com',
            product: 'Turmeric Powder',
            quantity: 1,
            orderDate: '2024-01-14',
            status: 'shipped',
            totalAmount: 450,
            shippingAddress: '456 Park Ave, Delhi',
            paymentStatus: 'paid'
          },
          {
            id: 'ORD-003',
            customerName: 'Rajesh Kumar',
            customerEmail: 'rajesh@example.com',
            product: 'Brahmi Oil',
            quantity: 3,
            orderDate: '2024-01-13',
            status: 'delivered',
            totalAmount: 2250,
            shippingAddress: '789 Beach Rd, Chennai',
            paymentStatus: 'paid'
          }
        ];
        setOrders(mockOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
  };

  const exportOrder = (order: Order) => {
    const csvContent = [
      'Order ID,Customer,Product,Quantity,Amount,Status,Payment Status,Order Date',
      `"${order.id}","${order.customerName}","${order.product}","${order.quantity}","₹${order.totalAmount}","${order.status}","${order.paymentStatus}","${order.orderDate}"`
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order-${order.id}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStats = () => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((acc, order) => acc + order.totalAmount, 0);
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    
    return { totalOrders, totalRevenue, deliveredOrders, pendingOrders };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Delivered</p>
              <p className="text-2xl font-bold text-gray-900">{stats.deliveredOrders}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Truck className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === status 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Orders List */}
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
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-500">
              No orders found for the selected filter.
            </div>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <h3 className="text-lg font-semibold text-gray-900">{order.product}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status.toUpperCase()}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                    {order.paymentStatus.toUpperCase()}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => exportOrder(order)}
                    className="btn-secondary text-sm flex items-center space-x-1"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                  </button>
                  <button className="btn-primary text-sm flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>View Details</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{order.customerName}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <span className="font-medium">Qty:</span>
                  <span className="font-semibold">{order.quantity}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <span className="font-medium">Amount:</span>
                  <span className="font-semibold">₹{order.totalAmount}</span>
                </div>
                <div className="text-gray-600">
                  <span className="font-medium">Order Date:</span> {new Date(order.orderDate).toLocaleDateString()}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Customer Email:</span>
                  <p className="font-semibold text-gray-900 mt-1">{order.customerEmail}</p>
                </div>
                <div>
                  <span className="text-gray-600">Shipping Address:</span>
                  <p className="font-semibold text-gray-900 mt-1">{order.shippingAddress}</p>
                </div>
              </div>

              {/* Status Actions */}
              {order.status !== 'delivered' && order.status !== 'cancelled' && (
                <div className="mt-4 flex space-x-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'processing')}
                      className="btn-primary text-sm"
                    >
                      Process Order
                    </button>
                  )}
                  {order.status === 'processing' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'shipped')}
                      className="btn-primary text-sm"
                    >
                      Mark as Shipped
                    </button>
                  )}
                  {order.status === 'shipped' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                      className="btn-primary text-sm"
                    >
                      Mark as Delivered
                    </button>
                  )}
                  {order.status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'cancelled')}
                      className="btn-secondary text-sm flex items-center space-x-1"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Cancel Order</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};