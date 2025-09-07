import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User, Tag, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CreateDiscussionRequest } from '@/api/community';

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
  const [formData, setFormData] = useState<CreateDiscussionRequest>({
    title: '',
    content: '',
    category: '',
    author: '',
  });

  const [errors, setErrors] = useState<Partial<CreateDiscussionRequest>>({});

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
    setFormData({ title: '', content: '', category: '', author: '' });
    setErrors({});
    onClose();
  };

  const handleInputChange = (field: keyof CreateDiscussionRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
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
