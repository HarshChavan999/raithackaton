import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  ExternalLink, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface TestResult {
  id: string;
  batchId: string;
  herbType: string;
  testDate: string;
  testType: string;
  results: {
    moistureContent: number;
    purityPercentage: number;
    activeCompounds: Array<{
      compound: string;
      concentration: number;
    }>;
    contaminants: Array<{
      type: string;
      level: number;
      unit: string;
    }>;
  };
  conclusion: string;
  testerName: string;
  status: 'pending' | 'approved' | 'rejected';
  blockchainHash: string;
}

export const TestResults: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Fetch test results from blockchain system
    const fetchResults = async () => {
      setLoading(true);
      try {
        // This would integrate with the blockchain system
        const mockResults: TestResult[] = [
          {
            id: 'TEST-001',
            batchId: 'BATCH-001',
            herbType: 'ashwagandha',
            testDate: '2024-01-16',
            testType: 'Full Analysis',
            results: {
              moistureContent: 8.5,
              purityPercentage: 95.2,
              activeCompounds: [
                { compound: 'Withanolide A', concentration: 2.1 },
                { compound: 'Withanolide B', concentration: 1.8 }
              ],
              contaminants: [
                { type: 'Heavy Metals', level: 0.5, unit: 'ppm' },
                { type: 'Pesticides', level: 0.1, unit: 'ppm' }
              ]
            },
            conclusion: 'Excellent quality batch with high active compound concentration and minimal contaminants.',
            testerName: 'Dr. Anjali Sharma',
            status: 'approved',
            blockchainHash: '0xabc123...'
          },
          {
            id: 'TEST-002',
            batchId: 'BATCH-002',
            herbType: 'turmeric',
            testDate: '2024-01-15',
            testType: 'Quality Assessment',
            results: {
              moistureContent: 12.3,
              purityPercentage: 87.6,
              activeCompounds: [
                { compound: 'Curcumin', concentration: 3.2 }
              ],
              contaminants: [
                { type: 'Microbial', level: 150, unit: 'CFU/g' }
              ]
            },
            conclusion: 'Batch meets quality standards but has elevated microbial count.',
            testerName: 'Dr. Ramesh Patel',
            status: 'pending',
            blockchainHash: '0xdef456...'
          }
        ];
        setResults(mockResults);
      } catch (error) {
        console.error('Error fetching test results:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getQualityIndicator = (purity: number) => {
    if (purity >= 95) return { color: 'text-green-600', icon: <CheckCircle className="w-4 h-4" /> };
    if (purity >= 85) return { color: 'text-blue-600', icon: <TrendingUp className="w-4 h-4" /> };
    return { color: 'text-red-600', icon: <AlertTriangle className="w-4 h-4" /> };
  };

  const filteredResults = results.filter(result => {
    if (filter === 'all') return true;
    return result.status === filter;
  });

  const exportResult = (result: TestResult) => {
    const csvContent = [
      'Test ID,Batch ID,Herb Type,Test Date,Test Type,Purity (%),Moisture (%),Tester,Status,Conclusion',
      `"${result.id}","${result.batchId}","${result.herbType}","${result.testDate}","${result.testType}","${result.results.purityPercentage}","${result.results.moistureContent}","${result.testerName}","${result.status}","${result.conclusion}"`
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-result-${result.id}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'approved', 'rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === status 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Results List */}
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
        ) : filteredResults.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-500">
              No test results found for the selected filter.
            </div>
          </div>
        ) : (
          filteredResults.map((result) => (
            <div key={result.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <h3 className="text-lg font-semibold text-gray-900">{result.herbType.toUpperCase()}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                    {result.status.toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-500">Test ID: {result.id}</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => exportResult(result)}
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                <div className="flex items-center space-x-2 text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span>{result.testType}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <span className="font-medium">Purity:</span>
                  <span className={`font-semibold ${getQualityIndicator(result.results.purityPercentage).color}`}>
                    {getQualityIndicator(result.results.purityPercentage).icon}
                    {result.results.purityPercentage}%
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <span className="font-medium">Moisture:</span>
                  <span className="font-semibold">{result.results.moistureContent}%</span>
                </div>
                <div className="text-gray-600">
                  <span className="font-medium">Tester:</span> {result.testerName}
                </div>
              </div>

              {/* Active Compounds */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Active Compounds</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {result.results.activeCompounds.map((compound, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-2">
                      <span className="text-sm font-medium text-gray-900">{compound.compound}</span>
                      <span className="text-sm text-gray-600 ml-2">({compound.concentration}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contaminants */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Contaminants</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {result.results.contaminants.map((contaminant, index) => (
                    <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-2">
                      <span className="text-sm font-medium text-red-900">{contaminant.type}</span>
                      <span className="text-sm text-red-700 ml-2">({contaminant.level} {contaminant.unit})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conclusion */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700">{result.conclusion}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Total Tests</h4>
          <p className="text-2xl font-bold text-gray-900">{results.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Approved</h4>
          <p className="text-2xl font-bold text-green-600">{results.filter(r => r.status === 'approved').length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Pending</h4>
          <p className="text-2xl font-bold text-yellow-600">{results.filter(r => r.status === 'pending').length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Average Purity</h4>
          <p className="text-2xl font-bold text-blue-600">
            {results.length > 0 
              ? (results.reduce((acc, r) => acc + r.results.purityPercentage, 0) / results.length).toFixed(1)
              : '0.0'}%
          </p>
        </div>
      </div>
    </div>
  );
};