import React from 'react';
import { Check, Circle, FileText, ShieldCheck } from 'lucide-react';

/*
 * Document workflow state is functional information, not decoration.
 *
 * Workflow status uses the product primary family for active/review stages,
 * neutral treatment for draft, and the semantic success family for completion.
 */
const STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    shortLabel: 'Draft',
    icon: FileText,
    tone: 'bg-surface-2 border-border text-ink',
    iconTone: 'text-ink-muted',
    aria: 'Draft — document has been created but is not yet in review',
  },
  'in-review': {
    label: 'In review',
    shortLabel: 'In review',
    icon: Circle,
    tone: 'bg-primary-50 border-primary-200 text-primary-700',
    iconTone: 'text-primary-600',
    aria: 'In review — waiting for reviewer action',
  },
  'final-review': {
    label: 'Final review',
    shortLabel: 'Final review',
    icon: ShieldCheck,
    tone: 'bg-primary-100 border-primary-300 text-primary-800',
    iconTone: 'text-primary-700',
    aria: 'Final review — waiting for final approver action',
  },
  approved: {
    label: 'Approved',
    shortLabel: 'Approved',
    icon: Check,
    tone: 'bg-success-subtle border-success-subtle-ink/20 text-success-subtle-ink',
    iconTone: 'text-success-subtle-ink',
    aria: 'Approved — workflow is complete',
  },
};

const STATUS_FALLBACK = {
  label: 'Unknown status',
  shortLabel: 'Unknown',
  icon: Circle,
  tone: 'bg-surface-2 border-border text-ink-muted',
  iconTone: 'text-ink-muted',
  aria: 'Unknown document status',
};

const StatusPill = ({
  status,
  size = 'sm',
  showIcon = true,
  showBorder = true,
}) => {
  const config = STATUS_CONFIG[status] || {
    ...STATUS_FALLBACK,
    label: status || STATUS_FALLBACK.label,
    shortLabel: status || STATUS_FALLBACK.shortLabel,
  };

  const Icon = config.icon;

  const sizeClasses =
    size === 'xs'
      ? 'min-h-6 gap-1.5 px-2 py-0.5 text-[11px]'
      : size === 'md'
        ? 'min-h-8 gap-1.5 px-2.5 py-1 text-sm'
        : 'min-h-7 gap-1.5 px-2 py-0.5 text-xs';

  return (
    <span
      className={[
        'inline-flex max-w-full items-center whitespace-nowrap rounded-full font-medium leading-none',
        sizeClasses,
        config.tone,
        showBorder ? 'border' : 'border border-transparent',
      ].join(' ')}
      aria-label={config.aria}
      title={config.aria}
    >
      {showIcon && (
        <Icon
          className={`shrink-0 ${config.iconTone} ${
            size === 'md' ? 'h-3.5 w-3.5' : 'h-3 w-3'
          }`}
          aria-hidden="true"
          strokeWidth={size === 'xs' ? 2 : 1.9}
        />
      )}

      <span className="truncate">{config.shortLabel}</span>
    </span>
  );
};

export { STATUS_CONFIG };
export default StatusPill;