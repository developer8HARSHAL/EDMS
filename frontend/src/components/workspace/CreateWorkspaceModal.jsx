import React, { useState, useEffect } from 'react';
import { Lock, Globe, AlertCircle } from 'lucide-react';
import { FormModal } from '../ui/Modal';
import { Input } from '../ui/Input';

const CreateWorkspaceModal = ({ isOpen, onClose, onCreateWorkspace, isLoading = false }) => {
  const [formData, setFormData] = useState({ name: '', description: '', isPublic: false });
  const [errors, setErrors] = useState({});

  // Reset form each time the modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({ name: '', description: '', isPublic: false });
      setErrors({});
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    const trimmedName = formData.name.trim();

    if (!trimmedName) newErrors.name = 'Workspace name is required';
    else if (trimmedName.length < 3) newErrors.name = 'Workspace name must be at least 3 characters';
    else if (trimmedName.length > 50) newErrors.name = 'Workspace name must be less than 50 characters';

    if (formData.description.length > 200) newErrors.description = 'Description must be less than 200 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await onCreateWorkspace({
        name: formData.name.trim(),
        description: formData.description.trim(),
        settings: { isPublic: formData.isPublic },
      });
      onClose();
    } catch (err) {
      const message =
        typeof err === 'string'
          ? err
          : err?.response?.data?.message || err?.response?.data || err?.message || 'Failed to create workspace. Please try again.';
      setErrors({ submit: message });
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Create new workspace"
      submitText="Create workspace"
      cancelText="Cancel"
      isLoading={isLoading}
      submitDisabled={!formData.name.trim()}
      size="md"
    >
      <div className="space-y-5">
        <Input
          label="Workspace name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Enter workspace name"
          maxLength={50}
          disabled={isLoading}
          error={errors.name}
          helperText={`${formData.name.length}/50 characters`}
        />

        <div>
          <label className="block text-sm font-medium text-ink mb-1">Description (optional)</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            maxLength={200}
            disabled={isLoading}
            placeholder="Brief description of your workspace"
            className={`w-full px-3.5 py-2.5 bg-surface border rounded-xl shadow-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 transition-colors duration-200 resize-none ${
              errors.description
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-border focus:border-primary-500 focus:ring-primary-500'
            }`}
          />
          {errors.description ? (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
          ) : (
            <p className="mt-1 text-sm text-ink-muted">{formData.description.length}/200 characters</p>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-ink mb-2">Visibility</p>
          <div className="space-y-2">
            <label className="flex items-start gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-surface-2 transition-colors">
              <input
                type="radio"
                name="isPublic"
                checked={!formData.isPublic}
                onChange={() => setFormData((prev) => ({ ...prev, isPublic: false }))}
                disabled={isLoading}
                className="mt-1 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <Lock className="h-4 w-4 text-ink-muted" />
                  <span className="text-sm font-medium text-ink">Private</span>
                </div>
                <p className="text-xs text-ink-muted">Only invited members can access this workspace</p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-surface-2 transition-colors">
              <input
                type="radio"
                name="isPublic"
                checked={formData.isPublic}
                onChange={() => setFormData((prev) => ({ ...prev, isPublic: true }))}
                disabled={isLoading}
                className="mt-1 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <Globe className="h-4 w-4 text-ink-muted" />
                  <span className="text-sm font-medium text-ink">Public</span>
                </div>
                <p className="text-xs text-ink-muted">Anyone with the link can view this workspace</p>
              </div>
            </label>
          </div>
        </div>

        {errors.submit && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {errors.submit}
          </div>
        )}
      </div>
    </FormModal>
  );
};

export default CreateWorkspaceModal;