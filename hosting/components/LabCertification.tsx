import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Award, 
  FileText, 
  Upload, 
  CheckCircle, 
  XCircle,
  Clock
} from 'lucide-react';

interface Certification {
  id: string;
  name: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'pending';
  documentUrl: string;
}

interface LabProfile {
  name: string;
  licenseNumber: string;
  address: string;
  contactPerson: string;
  email: string;
  phone: string;
  certifications: Certification[];
  accreditationLevel: string;
}

export const LabCertification: React.FC = () => {
  const [labProfile, setLabProfile] = useState<LabProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // Fetch lab profile and certifications from blockchain system
    const fetchLabProfile = async () => {
      setLoading(true);
      try {
        // This would integrate with the blockchain system
        const mockProfile: LabProfile = {
          name: 'Ayurvedic Research Laboratory',
          licenseNumber: 'ARL-2024-001',
          address: '123 Science Park, Mumbai, Maharashtra',
          contactPerson: 'Dr. Anjali Sharma',
          email: 'contact@ayur-lab.com',
          phone: '+91 22 1234 5678',
          accreditationLevel: 'ISO 17025 Certified',
          certifications: [
            {
              id: 'CERT-001',
              name: 'ISO 17025:2017',
              issuingAuthority: 'Bureau of Indian Standards',
              issueDate: '2023-01-15',
              expiryDate: '2026-01-14',
              status: 'active',
              documentUrl: '#'
            },
            {
              id: 'CERT-002',
              name: 'Good Laboratory Practice (GLP)',
              issuingAuthority: 'Central Drugs Standard Control Organization',
              issueDate: '2022-12-01',
              expiryDate: '2025-11-30',
              status: 'active',
              documentUrl: '#'
            },
            {
              id: 'CERT-003',
              name: 'Ayurvedic Herb Testing Certification',
              issuingAuthority: 'AYUSH Ministry',
              issueDate: '2023-06-20',
              expiryDate: '2024-06-19',
              status: 'expired',
              documentUrl: '#'
            }
          ]
        };
        setLabProfile(mockProfile);
      } catch (error) {
        console.error('Error fetching lab profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLabProfile();
  }, []);

  const uploadCertification = async (file: File) => {
    setIsUploading(true);
    try {
      // This would integrate with the blockchain system for document storage
      console.log('Uploading certification:', file);
      alert('Certification uploaded successfully!');
    } catch (error) {
      console.error('Error uploading certification:', error);
      alert('Error uploading certification. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'expired': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      default: return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 bg-gray-300 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!labProfile) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="text-gray-500">Unable to load lab profile.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lab Profile Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Laboratory Profile</h3>
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-green-600" />
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              {labProfile.accreditationLevel}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Laboratory Name:</span>
            <p className="font-semibold text-gray-900 mt-1">{labProfile.name}</p>
          </div>
          <div>
            <span className="text-gray-600">License Number:</span>
            <p className="font-semibold text-gray-900 mt-1">{labProfile.licenseNumber}</p>
          </div>
          <div>
            <span className="text-gray-600">Contact Person:</span>
            <p className="font-semibold text-gray-900 mt-1">{labProfile.contactPerson}</p>
          </div>
          <div>
            <span className="text-gray-600">Email:</span>
            <p className="font-semibold text-gray-900 mt-1">{labProfile.email}</p>
          </div>
          <div>
            <span className="text-gray-600">Phone:</span>
            <p className="font-semibold text-gray-900 mt-1">{labProfile.phone}</p>
          </div>
          <div>
            <span className="text-gray-600">Address:</span>
            <p className="font-semibold text-gray-900 mt-1">{labProfile.address}</p>
          </div>
        </div>
      </div>

      {/* Certifications */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Certifications & Accreditations</h3>
          <div className="flex space-x-2">
            <label className="btn-secondary text-sm flex items-center space-x-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Upload New</span>
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadCertification(file);
                }}
                disabled={isUploading}
              />
            </label>
          </div>
        </div>

        <div className="space-y-4">
          {labProfile.certifications.map((cert) => (
            <div key={cert.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(cert.status)}
                  <div>
                    <h4 className="font-semibold text-gray-900">{cert.name}</h4>
                    <p className="text-sm text-gray-600">{cert.issuingAuthority}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cert.status)}`}>
                    {cert.status.toUpperCase()}
                  </span>
                  <button className="text-gray-400 hover:text-gray-600">
                    <FileText className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                <div>Issue Date: {new Date(cert.issueDate).toLocaleDateString()}</div>
                <div>Expiry Date: {new Date(cert.expiryDate).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Certification Requirements */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Certification Requirements</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• All certifications must be current and valid</li>
          <li>• ISO 17025 certification is mandatory for all testing labs</li>
          <li>• GLP certification required for quality assurance</li>
          <li>• Regular audits and renewals must be maintained</li>
          <li>• All documents must be uploaded to the blockchain system</li>
        </ul>
      </div>

      {/* Expiring Certifications Alert */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-900 mb-2">Attention Required</h4>
        <p className="text-sm text-yellow-800">
          One or more certifications are expired or will expire soon. Please renew them to maintain lab status.
        </p>
      </div>
    </div>
  );
};