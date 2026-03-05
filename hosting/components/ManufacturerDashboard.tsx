import React, { useState, useContext } from 'react';
import { Card } from './Card';
import { ProductCreationForm } from './ProductCreationForm';
import { OrderManagement } from './OrderManagement';
import { InventoryTracking } from './InventoryTracking';
import { useAuth } from './AuthContext';

export const ManufacturerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('products');

  const tabs = [
    { id: 'products', name: 'Product Creation', icon: '🏭' },
    { id: 'orders', name: 'Order Management', icon: '📦' },
    { id: 'inventory', name: 'Inventory Tracking', icon: '📊' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome, {user?.name} 🏭
            </h1>
            <p className="text-gray-600 mt-1">
              Manufacturer Dashboard - Product Creation & Supply Chain
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Company</div>
            <div className="text-lg font-semibold text-gray-900">
              {user?.profile?.company || 'Ayurvedic Products Ltd.'}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Active Products" value="15" trend="+3 new products" />
        <Card title="Pending Orders" value="23" trend="High demand" />
        <Card title="Inventory Value" value="₹2.5M" trend="Growing stock" />
      </div>

      {/* Main Content Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'products' && <ProductCreationForm />}
          {activeTab === 'orders' && <OrderManagement />}
          {activeTab === 'inventory' && <InventoryTracking />}
        </div>
      </div>
    </div>
  );
};