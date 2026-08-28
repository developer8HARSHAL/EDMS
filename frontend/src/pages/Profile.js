// src/pages/Profile.js
import React, { useEffect, useState } from 'react';
import { Pencil, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { Card } from '../components/ui/Card';
import {
  DEFAULT_PROFILE_AVATAR,
  PROFILE_AVATARS,
  PROFILE_AVATAR_KEYS,
} from '../constants/profileAvatars';

const Profile = () => {
  const { user, updateProfile, error } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    avatar: user?.avatar || DEFAULT_PROFILE_AVATAR,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  useEffect(() => {
    if (!user) return;

    setFormData((prev) => ({
      ...prev,
      name: user.name || '',
      email: user.email || '',
      avatar: user.avatar || DEFAULT_PROFILE_AVATAR,
    }));
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleAvatarSelect = (avatarKey) => {
    setFormData((prev) => ({
      ...prev,
      avatar: avatarKey,
    }));

    setShowAvatarPicker(false);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (formData.newPassword || formData.currentPassword) {
      if (!formData.currentPassword) {
        errors.currentPassword =
          'Current password is required to set a new password';
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

    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const profileData = {
        name: formData.name,
        avatar: formData.avatar,
      };

      if (formData.currentPassword && formData.newPassword) {
        profileData.currentPassword = formData.currentPassword;
        profileData.newPassword = formData.newPassword;
      }

      await updateProfile(profileData);

      setSuccessMessage('Your profile has been successfully updated');

      setFormData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    }  catch (submitError) {
  console.error('Profile update failed in component:', submitError);
  setFormData((prev) => ({
    ...prev,
    avatar: user?.avatar || DEFAULT_PROFILE_AVATAR,
  }));
} finally {
  setIsSubmitting(false);
}
  };

  const selectedAvatarSrc =
    PROFILE_AVATARS[formData.avatar] ||
    PROFILE_AVATARS[DEFAULT_PROFILE_AVATAR];

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Card className="p-6">
        <div className="space-y-6">
          {/* Profile identity */}
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowAvatarPicker(true)}
                className="group relative h-20 w-20 overflow-hidden rounded-full bg-surface-2 ring-1 ring-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                aria-label="Change profile avatar"
              >
                <img
                  src={selectedAvatarSrc}
                  alt={`${user?.name || 'User'} profile avatar`}
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                />

                <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <Pencil
                    className="h-4 w-4 text-white"
                    aria-hidden="true"
                  />
                </span>
              </button>

              <p className="mt-2 text-center text-[11px] text-ink-muted">
                Change avatar
              </p>
            </div>

            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-ink">
                Your Profile
              </h1>

              <p className="mt-1 text-ink-muted">
                Manage your account settings
              </p>

              <p className="mt-2 truncate text-sm font-medium text-ink">
                {user?.name || 'User'}
              </p>

              <p className="truncate text-xs text-ink-muted">
                {user?.email || ''}
              </p>
            </div>
          </div>

          {/* Avatar picker */}
          {showAvatarPicker && (
            <div className="rounded-xl border border-border bg-surface-2/40 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    Choose your avatar
                  </p>

                  <p className="mt-0.5 text-xs text-ink-muted">
                    Select one of the predefined profile avatars.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  aria-label="Close avatar picker"
                >
                  <X
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-5 gap-3">
                {PROFILE_AVATAR_KEYS.map((avatarKey) => {
                  const selected = formData.avatar === avatarKey;

                  return (
                    <button
                      key={avatarKey}
                      type="button"
                      onClick={() => handleAvatarSelect(avatarKey)}
                      aria-label={`Select ${avatarKey}`}
                      aria-pressed={selected}
                      className={`group relative aspect-square overflow-hidden rounded-full border bg-surface transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                        selected
                          ? 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-950'
                          : 'border-border hover:border-primary-300'
                      }`}
                    >
                      <img
                        src={PROFILE_AVATARS[avatarKey]}
                        alt=""
                        aria-hidden="true"
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />

                      {selected && (
                        <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-700 text-[11px] font-semibold text-white shadow-sm">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <hr className="border-border" />

          {error && (
            <Alert variant="error">
              {error}
            </Alert>
          )}

          {successMessage && (
            <Alert variant="success">
              {successMessage}
            </Alert>
          )}

          {/* Profile form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="mb-1.5 block text-sm font-medium text-ink"
              >
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
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-ink"
              >
                Email Address
              </label>

              <Input
                id="email"
                name="email"
                value={formData.email}
                readOnly
                className="w-full bg-surface-2"
              />

              <p className="mt-1 text-sm text-ink-muted">
                Email cannot be changed
              </p>
            </div>

            <div className="pt-4">
              <h2 className="mb-4 text-lg font-semibold text-ink">
                Change Password
              </h2>

              <div className="mb-4">
                <label
                  htmlFor="currentPassword"
                  className="mb-1.5 block text-sm font-medium text-ink"
                >
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
              </div>

              <div className="mb-4">
                <label
                  htmlFor="newPassword"
                  className="mb-1.5 block text-sm font-medium text-ink"
                >
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
              </div>

              <div className="mb-4">
                <label
                  htmlFor="confirmPassword"
                  className="mb-1.5 block text-sm font-medium text-ink"
                >
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
              </div>
            </div>

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