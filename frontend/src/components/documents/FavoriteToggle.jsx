import React from 'react';
import { Star } from 'lucide-react';

const FavoriteToggle = ({
  isFavorite,
  onToggle,
  size = 'md',
  disabled = false,
}) => {
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  const handleClick = (event) => {
    event.stopPropagation();
    if (!disabled) onToggle?.();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={isFavorite}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      <Star
        className={[
          iconSize,
          isFavorite ? 'fill-primary-500 text-primary-500' : 'text-current',
        ].join(' ')}
        aria-hidden="true"
      />
    </button>
  );
};

export default FavoriteToggle;