import React, { useState } from 'react';
import { InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

const DISMISS_KEY = 'guestBannerDismissed';

// Persistent-per-session notice that this is the shared demo account.
// Dismiss state lives in sessionStorage so it reappears on the next fresh session.
const GuestBanner = ({ isGuest }) => {
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISS_KEY) === 'true');

  if (!isGuest || dismissed) return null;

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, 'true');
    setDismissed(true);
  };

  return (
    <div className="flex items-center justify-between gap-3 bg-primary-50 dark:bg-primary-950 border-b border-primary-200 dark:border-primary-800 px-4 sm:px-6 py-2 text-sm">
      <div className="flex items-center gap-2 text-primary-800 dark:text-primary-200">
        <InformationCircleIcon className="h-4 w-4 shrink-0" />
        <span>You're using a shared guest demo account — other guests can see and change this data.</span>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="p-1 rounded text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900"
        aria-label="Dismiss"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
};

export default GuestBanner;