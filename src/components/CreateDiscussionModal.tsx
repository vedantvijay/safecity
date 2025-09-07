import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User, Tag, FileText, MapPin, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CreateDiscussionRequest } from '@/api/community';
import { toast } from 'sonner';

interface CreateDiscussionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDiscussionRequest) => void;
  isLoading?: boolean;
}

const CreateDiscussionModal: React.FC<CreateDiscussionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<CreateDiscussionRequest & { latitude?: number; longitude?: number }>({
    title: '',
    content: '',
    category: '',
    author: '',
    latitude: undefined,
    longitude: undefined,
  });

  const [errors, setErrors] = useState<Partial<CreateDiscussionRequest>>({});
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [moderationResult, setModerationResult] = useState<any>(null);

  const categories = [
    { value: 'safety', label: 'Safety', icon: '🛡️' },
    { value: 'community', label: 'Community', icon: '👥' },
    { value: 'information', label: 'Information', icon: 'ℹ️' },
    { value: 'general', label: 'General', icon: '💬' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Partial<CreateDiscussionRequest> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.content.trim()) newErrors.content = 'Content is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.author.trim()) newErrors.author = 'Author name is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  const handleClose = () => {
    setFormData({ title: '', content: '', category: '', author: '', latitude: undefined, longitude: undefined });
    setErrors({});
    setLocation(null);
    setModerationResult(null);
    onClose();
  };

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      if (!navigator.geolocation) {
        toast.error('Geolocation is not supported by this browser');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setLocation(coords);
          setFormData(prev => ({
            ...prev,
            latitude: coords.lat,
            longitude: coords.lng
          }));
          toast.success('Location added to your post');
        },
        (error) => {
          toast.error('Failed to get location');
          console.error('Geolocation error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        }
      );
    } finally {
      setIsGettingLocation(false);
    }
  };

  const checkContentModeration = async (content: string) => {
    if (!content.trim()) return;
    
    try {
      // Simulate moderation check (in real app, this would call the backend)
      const response = await fetch('/api/moderate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, type: 'discussion' })
      });
      
      if (response.ok) {
        const result = await response.json();
        setModerationResult(result);
      }
    } catch (error) {
      console.log('Moderation check failed:', error);
      // Continue without moderation result
    }
  };

  const handleInputChange = (field: keyof CreateDiscussionRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Check moderation for content changes
    if (field === 'content' && value.length > 20) {
      checkContentModeration(value);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={handleClose}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Create New Discussion</span>
              </DialogTitle>
            </DialogHeader>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Discussion Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter a descriptive title for your discussion..."
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title}</p>
                )}
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Category *
                </label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange('category', value)}
                >
                  <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        <div className="flex items-center space-x-2">
                          <span>{category.icon}</span>
                          <span>{category.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-red-500">{errors.category}</p>
                )}
              </div>

              {/* Author */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Your Name *
                </label>
                <Input
                  value={formData.author}
                  onChange={(e) => handleInputChange('author', e.target.value)}
                  placeholder="Enter your name..."
                  className={errors.author ? 'border-red-500' : ''}
                />
                {errors.author && (
                  <p className="text-sm text-red-500">{errors.author}</p>
                )}
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Location (Optional)
                </label>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                    className="flex items-center space-x-2"
                  >
                    <MapPin className="h-4 w-4" />
                    <span>{isGettingLocation ? 'Getting...' : 'Add Location'}</span>
                  </Button>
                  {location && (
                    <Badge variant="outline" className="text-xs">
                      📍 {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Adding your location helps other community members understand the context of your post.
                </p>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Discussion Content *
                </label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  placeholder="Share your thoughts, questions, or information with the community..."
                  rows={6}
                  className={errors.content ? 'border-red-500' : ''}
                />
                {errors.content && (
                  <p className="text-sm text-red-500">{errors.content}</p>
                )}
                
                {/* Moderation Result */}
                {moderationResult && (
                  <div className={`p-3 rounded-lg border ${
                    moderationResult.is_safe 
                      ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
                      : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <Brain className={`h-4 w-4 ${
                        moderationResult.is_safe ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`} />
                      <span className={`text-sm font-medium ${
                        moderationResult.is_safe ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                      }`}>
                        {moderationResult.is_safe ? 'Content looks good!' : 'Content needs review'}
                      </span>
                    </div>
                    {moderationResult.reasoning && (
                      <p className={`text-xs mt-1 ${
                        moderationResult.is_safe ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {moderationResult.reasoning}
                      </p>
                    )}
                    {moderationResult.suggestions && moderationResult.suggestions.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-red-700 dark:text-red-300">Suggestions:</p>
                        <ul className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {moderationResult.suggestions.map((suggestion: string, index: number) => (
                            <li key={index}>• {suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Create Discussion</span>
                    </>
                  )}
                </Button>
              </div>
            </motion.form>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default CreateDiscussionModal;
