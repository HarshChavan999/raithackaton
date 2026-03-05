import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { MapPin, Calendar, Droplet, Scale, Plus, Save } from 'lucide-react';

interface CollectionFormData {
  herbType: string;
  quantity: number;
  collectionDate: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  notes: string;
}

export const HerbCollectionForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<CollectionFormData>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const onSubmit = async (data: CollectionFormData) => {
    setIsSubmitting(true);
    try {
      // Integrate with blockchain system
      console.log('Collection data:', data);
      // This would call the blockchain transaction system
      alert('Collection submitted successfully!');
    } catch (error) {
      console.error('Error submitting collection:', error);
      alert('Error submitting collection. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });
          setValue('location.latitude', latitude);
          setValue('location.longitude', longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get current location. Please enter manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">New Herb Collection</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Herb Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Plus className="inline w-4 h-4 mr-1" />
              Herb Type
            </label>
            <select
              {...register('herbType', { required: 'Please select a herb type' })}
              className="input-field"
            >
              <option value="">Select herb type...</option>
              <option value="ashwagandha">Ashwagandha</option>
              <option value="turmeric">Turmeric</option>
              <option value="neem">Neem</option>
              <option value="tulsi">Tulsi</option>
              <option value="brahmi">Brahmi</option>
              <option value="ginseng">Ginseng</option>
              <option value="licorice">Licorice</option>
              <option value="other">Other</option>
            </select>
            {errors.herbType && <p className="text-red-500 text-sm mt-1">{errors.herbType.message}</p>}
          </div>

          {/* Quantity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Scale className="inline w-4 h-4 mr-1" />
                Quantity Collected
              </label>
              <input
                type="number"
                step="0.01"
                {...register('quantity', { 
                  required: 'Please enter quantity',
                  min: { value: 0.01, message: 'Quantity must be greater than 0' }
                })}
                className="input-field"
                placeholder="e.g., 5.5"
              />
              {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Droplet className="inline w-4 h-4 mr-1" />
                Quality Assessment
              </label>
              <select
                {...register('quality', { required: 'Please select quality' })}
                className="input-field"
              >
                <option value="">Select quality...</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
              {errors.quality && <p className="text-red-500 text-sm mt-1">{errors.quality.message}</p>}
            </div>
          </div>

          {/* Collection Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              Collection Date
            </label>
            <input
              type="date"
              {...register('collectionDate', { required: 'Please select collection date' })}
              className="input-field"
            />
            {errors.collectionDate && <p className="text-red-500 text-sm mt-1">{errors.collectionDate.message}</p>}
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="inline w-4 h-4 mr-1" />
              Collection Location
            </label>
            <div className="space-y-2">
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="btn-secondary text-sm"
                >
                  Use Current Location
                </button>
                <span className="text-sm text-gray-500 mt-2">
                  {location && `(${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)})`}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="number"
                  step="0.000001"
                  placeholder="Latitude"
                  {...register('location.latitude', { required: 'Please enter latitude' })}
                  className="input-field"
                />
                <input
                  type="number"
                  step="0.000001"
                  placeholder="Longitude"
                  {...register('location.longitude', { required: 'Please enter longitude' })}
                  className="input-field"
                />
              </div>
              
              <input
                type="text"
                placeholder="Address (optional)"
                {...register('location.address')}
                className="input-field"
              />
            </div>
            {errors.location?.latitude && <p className="text-red-500 text-sm mt-1">{errors.location.latitude.message}</p>}
            {errors.location?.longitude && <p className="text-red-500 text-sm mt-1">{errors.location.longitude.message}</p>}
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
              placeholder="Any additional observations about the collection..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Collection'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Collection Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Collection Guidelines</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Ensure herbs are collected during optimal seasons</li>
          <li>• Record accurate GPS coordinates for traceability</li>
          <li>• Assess quality based on appearance, aroma, and moisture content</li>
          <li>• Store herbs properly to maintain quality</li>
          <li>• Submit collections within 24 hours for best quality tracking</li>
        </ul>
      </div>
    </div>
  );
};