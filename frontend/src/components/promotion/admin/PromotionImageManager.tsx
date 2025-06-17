/**
 * Promotion Image Manager
 * Component for managing promotion images with upload, edit, and delete functionality
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { PromotionImage } from '@/types/promotion';
import { 
  getPromotionImages, 
  addPromotionImage, 
  uploadPromotionImageFile, 
  deletePromotionImage 
} from '@/api/promotion';

interface PromotionImageManagerProps {
  configId: number;
}

interface ImageFormData {
  imageTitle: string;
  imageDescription: string;
  displayOrder: number;
}

export const PromotionImageManager: React.FC<PromotionImageManagerProps> = ({ configId }) => {
  const [images, setImages] = useState<PromotionImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);
  
  // Form state for adding new image
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<ImageFormData>({
    imageTitle: '',
    imageDescription: '',
    displayOrder: 1,
  });

  const loadImages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const imageList = await getPromotionImages(configId);
      setImages(imageList);
      
      // After loading images, update the default displayOrder for new images
      const maxOrder = imageList.length > 0 ? Math.max(...imageList.map(img => img.displayOrder)) : 0;
      setFormData(prev => ({
        ...prev,
        displayOrder: maxOrder + 1,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load images');
    } finally {
      setLoading(false);
    }
  }, [configId]);

  // Load images
  useEffect(() => {
    loadImages();
  }, [configId, loadImages]);

  const handleAddImage = async () => {
    if (!selectedFile) {
      setError('Please select an image file');
      return;
    }

    try {
      setUploading(-1); // Use -1 for new image upload
      setError(null);

      // First, create the image record
      const newImage = await addPromotionImage({
        promotionConfigId: configId,
        imageTitle: formData.imageTitle.trim() || undefined,
        imageDescription: formData.imageDescription.trim() || undefined,
        displayOrder: formData.displayOrder,
      });

      // Then upload the file
      await uploadPromotionImageFile(newImage.id, selectedFile);

      // Reload images to get the updated list
      await loadImages();

      // Reset form - displayOrder will be automatically updated by loadImages
      setShowAddForm(false);
      setSelectedFile(null);
      setFormData(prev => ({
        imageTitle: '',
        imageDescription: '',
        displayOrder: prev.displayOrder + 1, // Increment for next potential image
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add image');
    } finally {
      setUploading(null);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      return;
    }

    try {
      await deletePromotionImage(imageId);
      await loadImages(); // Reload images
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete image');
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'displayOrder' ? parseInt(value) || 1 : value,
    }));
  };

  const handleShowAddForm = () => {
    // Calculate the next available display order
    const maxOrder = images.length > 0 ? Math.max(...images.map(img => img.displayOrder)) : 0;
    setFormData(prev => ({
      ...prev,
      displayOrder: maxOrder + 1,
    }));
    setShowAddForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading images...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Promotion Images
          </h2>
          <p className="text-gray-600">
            Manage images that will be displayed on the promotion page
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={handleShowAddForm}
          disabled={showAddForm}
        >
          Add Image
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Add Image Form */}
      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Add New Image</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowAddForm(false);
                setSelectedFile(null);
                setError(null);
                // Reset form data with correct displayOrder
                const maxOrder = images.length > 0 ? Math.max(...images.map(img => img.displayOrder)) : 0;
                setFormData({
                  imageTitle: '',
                  imageDescription: '',
                  displayOrder: maxOrder + 1,
                });
              }}
              disabled={uploading === -1}
            >
              Cancel
            </Button>
          </div>

          <div className="space-y-6">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Image File *
              </label>
              <ImageUploader
                onFileSelected={setSelectedFile}
                file={selectedFile}
                maxFileSize={10 * 1024 * 1024} // 10MB for promotion images
                maxImagesMessage="This image will be displayed on the promotion page."
              />
            </div>

            {/* Image Title */}
            <div>
              <label htmlFor="imageTitle" className="block text-sm font-medium text-gray-900 mb-2">
                Image Title (Optional)
              </label>
              <input
                type="text"
                id="imageTitle"
                name="imageTitle"
                value={formData.imageTitle}
                onChange={handleFormChange}
                placeholder="Enter a title for this image"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Image Description */}
            <div>
              <label htmlFor="imageDescription" className="block text-sm font-medium text-gray-900 mb-2">
                Image Description (Optional)
              </label>
              <textarea
                id="imageDescription"
                name="imageDescription"
                value={formData.imageDescription}
                onChange={handleFormChange}
                placeholder="Enter a description for this image"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Display Order */}
            <div>
              <label htmlFor="displayOrder" className="block text-sm font-medium text-gray-900 mb-2">
                Display Order
              </label>
              <input
                type="number"
                id="displayOrder"
                name="displayOrder"
                value={formData.displayOrder}
                onChange={handleFormChange}
                min="1"
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Lower numbers appear first
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <Button
                variant="primary"
                size="md"
                onClick={handleAddImage}
                disabled={!selectedFile || uploading === -1}
                className="min-w-[120px]"
              >
                {uploading === -1 ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Uploading...
                  </div>
                ) : (
                  'Add Image'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Images List */}
      {images.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No images yet</h3>
          <p className="text-gray-600">
            Add your first image to start building your promotion page.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {images
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((image) => (
              <div key={image.id} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex gap-6">
                  {/* Image Preview */}
                  <div className="flex-shrink-0">
                    <div className="w-48 h-32 bg-gray-100 rounded-lg overflow-hidden relative">
                      {image.imageUrl ? (
                        <Image
                          src={image.imageUrl}
                          alt={image.imageTitle || 'Promotion image'}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Image Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-gray-900">
                          {image.imageTitle || 'Untitled Image'}
                        </h4>
                        {image.imageDescription && (
                          <p className="text-gray-600 mt-1 text-sm leading-relaxed">
                            {image.imageDescription}
                          </p>
                        )}
                        <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                          <span>Order: {image.displayOrder}</span>
                          {image.imageWidth && image.imageHeight && (
                            <span>{image.imageWidth} × {image.imageHeight}</span>
                          )}
                          <span>Added: {new Date(image.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteImage(image.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Usage Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm">
            <p className="text-blue-900 font-medium">Image Storage</p>
            <p className="text-blue-700 mt-1">
              Promotion images are stored separately from regular submission images in the dedicated promotion folder.
              Images will be displayed in order from lowest to highest display order number.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 