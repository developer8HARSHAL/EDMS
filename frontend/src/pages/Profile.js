// src/pages/Profile.js - Migrated to Tailwind CSS
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import {Button} from '../components/ui/Button';
import {Input} from '../components/ui/Input';
import {Alert} from '../components/ui/Alert';
import {Card} from '../components/ui/Card';

const Profile = () => {
  const { user, updateProfile, error } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when field is edited
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const validateForm = () => {
    const errors = {};
    
    // Validate name
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    // Validate password change if attempted
    if (formData.newPassword || formData.currentPassword) {
      // If one password field is filled, both must be filled
      if (!formData.currentPassword) {
        errors.currentPassword = 'Current password is required to set a new password';
      }
      
      if (!formData.newPassword) {
        errors.newPassword = 'Please provide a new password';
      } else if (formData.newPassword.length < 8) {
        errors.newPassword = 'Password must be at least 8 characters';
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous success message
    setSuccessMessage('');
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare data for API - only send what's needed
      const profileData = {
        name: formData.name
      };
      
      // Only include password fields if both are provided
      if (formData.currentPassword && formData.newPassword) {
        profileData.currentPassword = formData.currentPassword;
        profileData.newPassword = formData.newPassword;
      }
      
      // Call API to update profile
      await updateProfile(profileData);
      
      setSuccessMessage('Your profile has been successfully updated');
      
      // Reset password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      // Error is already handled by context
      console.error('Profile update failed in component:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <Card className="p-6">
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-semibold">
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  getInitials(user?.name)
                )}
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Your Profile
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Manage your account settings
              </p>
            </div>
          </div>
          
          {/* Divider */}
          <hr className="border-gray-200 dark:border-gray-700" />
          
          {/* Error Alert */}
          {error && (
            <Alert variant="error">
              {error}
            </Alert>
          )}
          
          {/* Success Alert */}
          {successMessage && (
            <Alert variant="success">
              {successMessage}
            </Alert>
          )}
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name
              </label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={formErrors.name}
                className="w-full"
              />
              {formErrors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {formErrors.name}
                </p>
              )}
            </div>
            
            {/* Email Field (Read-only) */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <Input
                id="email"
                name="email"
                value={formData.email}
                readOnly
                className="w-full bg-gray-50 dark:bg-gray-800"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Email cannot be changed
              </p>
            </div>
            
            {/* Password Section */}
            <div className="pt-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Change Password
              </h2>
              
              {/* Current Password */}
              <div className="mb-4">
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current Password
                </label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  error={formErrors.currentPassword}
                  className="w-full"
                />
                {formErrors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {formErrors.currentPassword}
                  </p>
                )}
              </div>
              
              {/* New Password */}
              <div className="mb-4">
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Password
                </label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  error={formErrors.newPassword}
                  className="w-full"
                />
                {formErrors.newPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {formErrors.newPassword}
                  </p>
                )}
              </div>
              
              {/* Confirm Password */}
              <div className="mb-4">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm New Password
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={formErrors.confirmPassword}
                  className="w-full"
                />
                {formErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {formErrors.confirmPassword}
                  </p>
                )}
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="pt-6">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? 'Updating...' : 'Update Profile'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default Profile;