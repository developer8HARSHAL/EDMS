import React from 'react';
import { StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

// Pure presentational toggle — parent owns the actual toggleFavorite(docId, name) call
// from useDocuments(), same separation used by DocumentRow for navigation.
const FavoriteToggle = ({ isFavorite, onToggle, size = 'md', disabled = false }) => {
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  const handleClick = (e) => {
    e.stopPropagation();
    if (!disabled) onToggle?.();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      className="shrink-0 text-ink-muted hover:text-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isFavorite ? (
        <StarIconSolid className={`${iconSize} text-amber-400`} />
      ) : (
        <StarIcon className={iconSize} />
      )}
    </button>
  );
};

export default FavoriteToggle;
