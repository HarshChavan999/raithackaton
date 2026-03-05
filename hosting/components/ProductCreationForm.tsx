import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Save, Search, QrCode, Package, Droplet } from 'lucide-react';

interface ProductFormData {
  productName: string;
  productType: string;
  batchId: string;
  quantity: number;
  manufacturingDate: string;
  expiryDate: string;
  ingredients: Array<{
    herbType: string;
    quantity: number;
    batchId: string;
  }>;
  qualityScore: number;
  qrCodeGenerated: boolean;
  notes: string;
}

export const ProductCreationForm: React.FC = () => {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ProductFormData>();
  const [batchInfo, setBatchInfo] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [ingredients, setIngredients] = useState<Array<{
    herbType: string;
    quantity: number;
    batchId: string;
  }>>([]);

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
        quality: 'excellent',
        farmer: 'Ramesh Kumar',
        testResults: {
          purity: 95.2,
          moisture: 8.5
        }
      };
      setBatchInfo(mockBatch);
    } catch (error) {
      console.error('Error searching batch:', error);
      alert('Batch not found. Please check the batch ID.');
    } finally {
      setIsSearching(false);
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { herbType: '', quantity: 0, batchId: '' }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: string, value: any) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setIngredients(newIngredients);
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      // Integrate with blockchain system for manufacturing transactions
      console.log('Product creation data:', { ...data, ingredients });
      alert('Product created successfully!');
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Error creating product. Please try again.');
    }
  };

  const generateQRCode = () => {
    // This would integrate with QR code generation system
    setValue('qrCodeGenerated', true);
    alert('QR Code generated successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Creation Interface</h3>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Product Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Package className="inline w-4 h-4 mr-1" />
                Product Name
              </label>
              <input
                {...register('productName', { required: 'Please enter product name' })}
                className="input-field"
                placeholder="e.g., Ashwagandha Capsules"
              />
              {errors.productName && <p className="text-red-500 text-sm mt-1">{errors.productName.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Type
              </label>
              <select
                {...register('productType', { required: 'Please select product type' })}
                className="input-field"
              >
                <option value="">Select product type...</option>
                <option value="capsules">Capsules</option>
                <option value="powder">Powder</option>
                <option value="oil">Oil</option>
                <option value="tablet">Tablet</option>
                <option value="decoction">Decoction</option>
              </select>
              {errors.productType && <p className="text-red-500 text-sm mt-1">{errors.productType.message}</p>}
            </div>
          </div>

          {/* Manufacturing Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manufacturing Date
              </label>
              <input
                type="date"
                {...register('manufacturingDate', { required: 'Please select manufacturing date' })}
                className="input-field"
              />
              {errors.manufacturingDate && <p className="text-red-500 text-sm mt-1">{errors.manufacturingDate.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date
              </label>
              <input
                type="date"
                {...register('expiryDate', { required: 'Please select expiry date' })}
                className="input-field"
              />
              {errors.expiryDate && <p className="text-red-500 text-sm mt-1">{errors.expiryDate.message}</p>}
            </div>
          </div>

          {/* Main Ingredient (Batch) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="inline w-4 h-4 mr-1" />
              Main Ingredient Batch
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

            {batchInfo && (
              <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Batch Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                  <div><span className="text-gray-600">Batch ID:</span> {batchInfo.id}</div>
                  <div><span className="text-gray-600">Herb Type:</span> {batchInfo.herbType}</div>
                  <div><span className="text-gray-600">Quality:</span> {batchInfo.quality}</div>
                  <div><span className="text-gray-600">Purity:</span> {batchInfo.testResults.purity}%</div>
                </div>
              </div>
            )}
          </div>

          {/* Additional Ingredients */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Ingredients
            </label>
            <div className="space-y-2">
              {ingredients.map((ingredient, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 border border-gray-200 rounded-lg">
                  <input
                    type="text"
                    placeholder="Herb type"
                    value={ingredient.herbType}
                    onChange={(e) => updateIngredient(index, 'herbType', e.target.value)}
                    className="input-field"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Quantity (g)"
                    value={ingredient.quantity || ''}
                    onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value))}
                    className="input-field"
                  />
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Batch ID"
                      value={ingredient.batchId}
                      onChange={(e) => updateIngredient(index, 'batchId', e.target.value)}
                      className="input-field"
                    />
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="btn-secondary text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addIngredient}
                className="btn-secondary text-sm flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Ingredient</span>
              </button>
            </div>
          </div>

          {/* Product Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Droplet className="inline w-4 h-4 mr-1" />
                Quality Score
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                {...register('qualityScore', { 
                  required: 'Please enter quality score',
                  min: 0,
                  max: 10
                })}
                className="input-field"
                placeholder="e.g., 8.5"
              />
              {errors.qualityScore && <p className="text-red-500 text-sm mt-1">{errors.qualityScore.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity Produced
              </label>
              <input
                type="number"
                step="1"
                {...register('quantity', { 
                  required: 'Please enter quantity',
                  min: 1
                })}
                className="input-field"
                placeholder="e.g., 1000"
              />
              {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>}
            </div>
          </div>

          {/* QR Code Generation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <QrCode className="inline w-4 h-4 mr-1" />
              QR Code Generation
            </label>
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={generateQRCode}
                className="btn-primary flex items-center space-x-2"
              >
                <QrCode className="w-4 h-4" />
                <span>Generate QR Code</span>
              </button>
              <span className="text-sm text-gray-600">
                {watch('qrCodeGenerated') ? 'QR Code generated successfully!' : 'Click to generate traceability QR code'}
              </span>
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="input-field"
              placeholder="Any additional manufacturing notes..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="btn-primary flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Create Product</span>
            </button>
          </div>
        </form>
      </div>

      {/* Manufacturing Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Manufacturing Guidelines</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Ensure all ingredients are from verified batches</li>
          <li>• Maintain proper hygiene and quality standards</li>
          <li>• Record accurate quantities and batch information</li>
          <li>• Generate QR codes for all products for traceability</li>
          <li>• Submit product information to blockchain within 24 hours</li>
        </ul>
      </div>
    </div>
  );
};