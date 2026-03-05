import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { TestTube, Droplet, Thermometer, Scale, Save, Search } from 'lucide-react';

interface TestFormData {
  batchId: string;
  herbType: string;
  testDate: string;
  testType: string;
  results: {
    moistureContent: number;
    purityPercentage: number;
    activeCompounds: {
      compound: string;
      concentration: number;
    }[];
    contaminants: {
      type: string;
      level: number;
      unit: string;
    }[];
  };
  conclusion: string;
  testerName: string;
  notes: string;
}

export const BatchTestingForm: React.FC = () => {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<TestFormData>();
  const [batchInfo, setBatchInfo] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  const watchBatchId = watch('batchId');

  const searchBatch = async () => {
    if (!watchBatchId) return;
    
    setIsSearching(true);
    try {
      // This would integrate with the blockchain system to fetch batch details
      const mockBatch = {
        id: watchBatchId,
        herbType: 'ashwagandha',
        quantity: 15.5,
        collectionDate: '2024-01-15',
        farmer: 'Ramesh Kumar',
        location: 'Nagpur, Maharashtra'
      };
      setBatchInfo(mockBatch);
      setValue('herbType', mockBatch.herbType);
    } catch (error) {
      console.error('Error searching batch:', error);
      alert('Batch not found. Please check the batch ID.');
    } finally {
      setIsSearching(false);
    }
  };

  const onSubmit = async (data: TestFormData) => {
    try {
      // Integrate with blockchain system for lab test transactions
      console.log('Test results:', data);
      alert('Test results submitted successfully!');
    } catch (error) {
      console.error('Error submitting test results:', error);
      alert('Error submitting test results. Please try again.');
    }
  };

  const addActiveCompound = () => {
    const currentCompounds = watch('results.activeCompounds') || [];
    setValue('results.activeCompounds', [...currentCompounds, { compound: '', concentration: 0 }]);
  };

  const addContaminant = () => {
    const currentContaminants = watch('results.contaminants') || [];
    setValue('results.contaminants', [...currentContaminants, { type: '', level: 0, unit: 'ppm' }]);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Batch Testing Interface</h3>
        
        {/* Batch Search */}
        <div className="mb-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="inline w-4 h-4 mr-1" />
                Batch ID
              </label>
              <div className="flex space-x-2">
                <input
                  {...register('batchId', { required: 'Please enter batch ID' })}
                  className="input-field flex-1"
                  placeholder="e.g., BATCH-001"
                />
                <button
                  onClick={searchBatch}
                  disabled={isSearching || !watchBatchId}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Search className="w-4 h-4" />
                  <span>{isSearching ? 'Searching...' : 'Search'}</span>
                </button>
              </div>
              {errors.batchId && <p className="text-red-500 text-sm mt-1">{errors.batchId.message}</p>}
            </div>
          </div>

          {batchInfo && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Batch Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                <div><span className="text-gray-600">Batch ID:</span> {batchInfo.id}</div>
                <div><span className="text-gray-600">Herb Type:</span> {batchInfo.herbType}</div>
                <div><span className="text-gray-600">Quantity:</span> {batchInfo.quantity} kg</div>
                <div><span className="text-gray-600">Farmer:</span> {batchInfo.farmer}</div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Test Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <TestTube className="inline w-4 h-4 mr-1" />
                Test Date
              </label>
              <input
                type="date"
                {...register('testDate', { required: 'Please select test date' })}
                className="input-field"
              />
              {errors.testDate && <p className="text-red-500 text-sm mt-1">{errors.testDate.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Thermometer className="inline w-4 h-4 mr-1" />
                Test Type
              </label>
              <select
                {...register('testType', { required: 'Please select test type' })}
                className="input-field"
              >
                <option value="">Select test type...</option>
                <option value="quality">Quality Assessment</option>
                <option value="purity">Purity Analysis</option>
                <option value="contaminant">Contaminant Testing</option>
                <option value="full">Full Analysis</option>
              </select>
              {errors.testType && <p className="text-red-500 text-sm mt-1">{errors.testType.message}</p>}
            </div>
          </div>

          {/* Test Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Droplet className="inline w-4 h-4 mr-1" />
                Moisture Content (%)
              </label>
              <input
                type="number"
                step="0.01"
                {...register('results.moistureContent', { 
                  required: 'Please enter moisture content',
                  min: 0,
                  max: 100
                })}
                className="input-field"
                placeholder="e.g., 8.5"
              />
              {errors.results?.moistureContent && <p className="text-red-500 text-sm mt-1">{errors.results.moistureContent.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Scale className="inline w-4 h-4 mr-1" />
                Purity Percentage (%)
              </label>
              <input
                type="number"
                step="0.01"
                {...register('results.purityPercentage', { 
                  required: 'Please enter purity percentage',
                  min: 0,
                  max: 100
                })}
                className="input-field"
                placeholder="e.g., 95.2"
              />
              {errors.results?.purityPercentage && <p className="text-red-500 text-sm mt-1">{errors.results.purityPercentage.message}</p>}
            </div>
          </div>

          {/* Active Compounds */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Active Compounds
            </label>
            <div className="space-y-2">
              {/* This would be dynamic in a real implementation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Compound name (e.g., Withanolide)"
                  className="input-field"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Concentration (%)"
                  className="input-field"
                />
              </div>
              <button
                type="button"
                onClick={addActiveCompound}
                className="btn-secondary text-sm"
              >
                + Add Compound
              </button>
            </div>
          </div>

          {/* Contaminants */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contaminants
            </label>
            <div className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Contaminant type"
                  className="input-field"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Level"
                  className="input-field"
                />
                <select className="input-field">
                  <option value="ppm">ppm</option>
                  <option value="ppb">ppb</option>
                  <option value="mg/kg">mg/kg</option>
                </select>
              </div>
              <button
                type="button"
                onClick={addContaminant}
                className="btn-secondary text-sm"
              >
                + Add Contaminant
              </button>
            </div>
          </div>

          {/* Conclusion */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Conclusion
            </label>
            <textarea
              {...register('conclusion', { required: 'Please enter test conclusion' })}
              rows={3}
              className="input-field"
              placeholder="Summary of test results and quality assessment..."
            />
            {errors.conclusion && <p className="text-red-500 text-sm mt-1">{errors.conclusion.message}</p>}
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tester Name
              </label>
              <input
                {...register('testerName', { required: 'Please enter tester name' })}
                className="input-field"
                placeholder="Your name"
              />
              {errors.testerName && <p className="text-red-500 text-sm mt-1">{errors.testerName.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <input
                {...register('notes')}
                className="input-field"
                placeholder="Any additional observations..."
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="btn-primary flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Submit Test Results</span>
            </button>
          </div>
        </form>
      </div>

      {/* Testing Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Testing Guidelines</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Ensure all equipment is calibrated before testing</li>
          <li>• Follow standard operating procedures for each test type</li>
          <li>• Record all measurements accurately and objectively</li>
          <li>• Submit results within 24 hours of testing completion</li>
          <li>• Maintain chain of custody documentation</li>
        </ul>
      </div>
    </div>
  );
};