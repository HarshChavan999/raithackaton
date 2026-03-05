import React, { useState, useContext } from 'react';
import { Card } from './Card';
import { BatchTestingForm } from './BatchTestingForm';
import { TestResults } from './TestResults';
import { LabCertification } from './LabCertification';
import { useAuth } from './AuthContext';

export const LabDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('testing');

  const tabs = [
    { id: 'testing', name: 'Batch Testing', icon: '🧪' },
    { id: 'results', name: 'Test Results', icon: '📊' },
    { id: 'certification', name: 'Lab Certification', icon: '📜' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome, {user?.name} 🧪
            </h1>
            <p className="text-gray-600 mt-1">
              Laboratory Dashboard - Quality Testing & Analysis
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Certified Lab</div>
            <div className="text-lg font-semibold text-gray-900">
              {user?.profile?.certifications?.join(', ') || 'Standard Certification'}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Pending Tests" value="12" trend="+3 new batches" />
        <Card title="Completed Tests" value="156" trend="98% accuracy rate" />
        <Card title="Average Turnaround" value="2.3 days" trend="Within SLA" />
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
                    ? 'border-blue-500 text-blue-600'
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
          {activeTab === 'testing' && <BatchTestingForm />}
          {activeTab === 'results' && <TestResults />}
          {activeTab === 'certification' && <LabCertification />}
        </div>
      </div>
    </div>
  );
};