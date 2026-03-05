import React from 'react';
import { useAuth } from '../components/AuthContext';
import { FarmerDashboard } from '../components/FarmerDashboard';
import { LabDashboard } from '../components/LabDashboard';
import { ManufacturerDashboard } from '../components/ManufacturerDashboard';
import { ConsumerPortal } from '../components/ConsumerPortal';
import { Layout } from '../components/Layout';

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md w-full">
          <div className="text-center">
            <div className="h-16 w-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">VC</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">VaidyaChain</h1>
            <p className="text-gray-600 mb-6">Welcome to the Ayurvedic Supply Chain Traceability Platform</p>
            
            <div className="space-y-4">
              <button className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors">
                Sign In
              </button>
              <button className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors">
                Register
              </button>
            </div>

            <div className="mt-6 text-sm text-gray-500">
              <p>Or scan a QR code to verify product authenticity</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout userRole={user.role} userName={user.name}>
      {user.role === 'farmer' && <FarmerDashboard />}
      {user.role === 'lab' && <LabDashboard />}
      {user.role === 'manufacturer' && <ManufacturerDashboard />}
      {user.role === 'consumer' && <ConsumerPortal />}
    </Layout>
  );
}