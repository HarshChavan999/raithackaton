import React, { useState, useContext } from 'react';
import { Card } from './Card';
import { HerbCollectionForm } from './HerbCollectionForm';
import { BatchHistory } from './BatchHistory';
import { BlockchainStatus } from './BlockchainStatus';
import { useAuth } from './AuthContext';

export const FarmerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('collection');

  const tabs = [
    { id: 'collection', name: 'Herb Collection', icon: '🌿' },
    { id: 'history', name: 'Collection History', icon: '📋' },
    { id: 'blockchain', name: 'Blockchain Status', icon: '🔗' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome, {user?.name} 🌿
            </h1>
            <p className="text-gray-600 mt-1">
              Farmer Dashboard - Ayurvedic Herb Collection
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Member since</div>
            <div className="text-lg font-semibold text-gray-900">
              {user?.profile?.location || 'Unknown Location'}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Total Collections" value="24" trend="+12% this month" />
        <Card title="Active Batches" value="8" trend="2 pending blockchain submission" />
        <Card title="Quality Score" value="94%" trend="Excellent" />
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
                    ? 'border-green-500 text-green-600'
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
          {activeTab === 'collection' && <HerbCollectionForm />}
          {activeTab === 'history' && <BatchHistory />}
          {activeTab === 'blockchain' && <BlockchainStatus />}
        </div>
      </div>
    </div>
  );
};

// Reusable Card Component
interface CardProps {
  title: string;
  value: string;
  trend: string;
}

const Card: React.FC<CardProps> = ({ title, value, trend }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      <div className="mt-2">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500 mt-1">{trend}</div>
      </div>
    </div>
  );
};