import React from 'react';

import {

  ArrowRight,
  Check,
  File,
  FileSpreadsheet,
  FileText,
  User,
  UserCheck,
} from 'lucide-react';


import { UserAvatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import StatusPill from '../documents/StatusPill';
import { DueDateChip } from '../documents/DueDateChip';
import {
  formatDisplayName,
  formatRelativeTime,
} from '../../utils/dashboardUtils';




const WORKFLOW_STAGES = [
  { key: 'draft', label: 'Draft' },
  { key: 'in-review', label: 'In Review' },
  { key: 'final-review', label: 'Final Review' },
  { key: 'approved', label: 'Approved' },
];


const STAGE_ICON_MAP = {
  draft: FileText,
  'in-review': User,
  'final-review': UserCheck,
  approved: Check,
};

const formatRoleLabel = (role = '') => {
  if (!role) return 'workflow owner';

  return role
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const WorkflowStepper = ({
  status,
  stages = [],
}) => {
  if (!stages.length) return null;

  const currentIndex = stages.findIndex(
    (stage) => stage.stageKey === status
  );

  const hasCurrentStage = currentIndex >= 0;

  return (
    <div
      className="mt-5 w-full"
      role="group"
      aria-label={`Workflow progress${hasCurrentStage
          ? `, currently at ${stages[currentIndex].label}`
          : ''
        }`}
    >
      <div className="relative">
        {/* Base line */}
        <div
          className="absolute left-0 right-0 top-4 h-px bg-border"
          aria-hidden="true"
        />

        {/* Completed/current progress line */}
        {hasCurrentStage && currentIndex > 0 && (
          <div
            className="absolute left-0 top-4 h-px bg-primary-600 dark:bg-primary-500"
            style={{
              width: `${(currentIndex / (stages.length - 1)) * 100
                }%`,
            }}
            aria-hidden="true"
          />
        )}

        <div className="relative grid grid-cols-4 gap-3">
          {stages.map((stage, index) => {
            const isCompleted =
              hasCurrentStage && index < currentIndex;

            const isCurrent =
              hasCurrentStage && index === currentIndex;

            const isPending =
              !isCompleted && !isCurrent;

            return (
              <div
                key={stage.stageKey}
                className="min-w-0"
              >
                {/* Stage node */}
                <div className="flex justify-center">
                  <span
                    className={[
                      'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-150',
                      isCompleted
                        ? 'border-primary-600 bg-primary-600 text-white'
                        : '',
                      isCurrent
                        ? 'border-primary-600 bg-surface text-primary-700 ring-4 ring-primary-50 dark:bg-surface dark:text-primary-400 dark:ring-primary-950/50'
                        : '',
                      isPending
                        ? 'border-border bg-surface text-ink-muted'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    aria-label={`${stage.label}: ${isCompleted
                        ? 'Completed'
                        : isCurrent
                          ? 'Current'
                          : 'Pending'
                      }`}
                  >
                    {isCompleted ? (
                      <Check
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                    ) : (
                      <span
                        className={[
                          'h-2 w-2 rounded-full',
                          isCurrent
                            ? 'bg-primary-600 dark:bg-primary-500'
                            : 'bg-border',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        aria-hidden="true"
                      />
                    )}
                  </span>
                </div>

                {/* Stage label */}
                <p
                  className={[
                    'mt-2 truncate text-center text-xs leading-4',
                    isCurrent
                      ? 'font-semibold text-ink'
                      : isCompleted
                        ? 'font-medium text-ink'
                        : 'font-normal text-ink-muted',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {stage.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const ActiveWorkflowRow = ({
  documentId,
  title,
  workspaceName,
  status,
  waitingOnName,
  waitingOnRole,
  uploader,
  reviewer,
  finalApprover,
  dueDate,
  lastUpdatedText,
  workflowStages = [],
  size,
  type,
  onClick,
}) => {
  const currentStageIndex = workflowStages.findIndex(
    (stage) => stage.stageKey === status
  );

  const currentStage =
    currentStageIndex >= 0
      ? workflowStages[currentStageIndex]
      : null;

  const waitingLabel = waitingOnName
    ? `Waiting on ${formatDisplayName(waitingOnName)}${waitingOnRole
      ? ` · ${formatRoleLabel(waitingOnRole)}`
      : ''
    }`
    : waitingOnRole
      ? `Waiting for ${formatRoleLabel(
        waitingOnRole
      ).toLowerCase()} to be assigned`
      : 'Waiting for assignment';

  const { icon: FileIcon, badgeClass } =
    FILE_TYPE_CONFIG[type] || DEFAULT_FILE_TYPE;

  const formattedSize =
    typeof size === 'number'
      ? formatFileSize(size)
      : null;

  const metaTextItems = [workspaceName, formattedSize].filter(
    Boolean
  );

  const participants = [
    uploader,
    reviewer,
    finalApprover,
  ]
    .filter(Boolean)
    .filter(
      (person, index, all) =>
        all.findIndex(
          (p) =>
            (p._id || p.name) ===
            (person._id || person.name)
        ) === index
    );

  const visibleParticipants = participants.slice(
    0,
    MAX_VISIBLE_MEMBERS
  );

  const hiddenParticipantCount =
    participants.length - visibleParticipants.length;

  /*
   * dashboardUtils already returns values such as:
   * "Uploaded 11d ago"
   *
   * Normalize defensively so this component never renders:
   * "Uploaded Uploaded 11d ago"
   */
  const uploadLabel = lastUpdatedText
    ? lastUpdatedText.startsWith('Uploaded ')
      ? lastUpdatedText
      : `Uploaded ${lastUpdatedText}`
    : null;

  return (
    <article className="px-5 py-4 sm:px-6">
      <div
        className="
          overflow-hidden
          rounded-2xl
          border
          border-border
          bg-surface-2
          transition-colors
          duration-150
          hover:border-primary-300
          dark:hover:border-primary-800
        "
      >
        {/* DOCUMENT HEADER */}
        <div className="px-5 pb-4 pt-4 sm:px-6">
          <div className="flex min-w-0 items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <span
                className={`icon-badge ${badgeClass} mt-0.5 h-9 w-9 shrink-0`}
              >
                <FileIcon
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </span>

              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => onClick?.(documentId)}
                  title={title}
                  className="
                    block
                    max-w-full
                    truncate
                    text-left
                    font-sans
                    text-base
                    font-semibold
                    leading-5
                    tracking-tight
                    text-ink
                    transition-colors
                    hover:text-primary-700
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-primary-500
                    focus-visible:ring-offset-2
                    focus-visible:ring-offset-primary-50
                    dark:focus-visible:ring-offset-primary-950
                  "
                >
                  {title}
                </button>

                <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  {metaTextItems.map((item, index) => (
                    <React.Fragment key={item}>
                      {index > 0 && (
                        <span
                          aria-hidden="true"
                          className="text-ink-muted"
                        >
                          ·
                        </span>
                      )}

                      <span
                        title={item}
                        className="truncate font-sans text-xs text-ink-muted"
                      >
                        {item}
                      </span>
                    </React.Fragment>
                  ))}

                  {metaTextItems.length > 0 && (
                    <span
                      aria-hidden="true"
                      className="text-ink-muted"
                    >
                      ·
                    </span>
                  )}

                  {dueDate ? (
                    <DueDateChip date={dueDate} />
                  ) : (
                    <span className="font-sans text-xs text-ink-muted">
                      No due date
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              {participants.length > 0 && (
                <div
                  className="hidden items-center -space-x-2 sm:flex"
                  aria-hidden="true"
                >
                  {visibleParticipants.map((person) => (
                    <span
                      key={person._id || person.name}
                      title={formatDisplayName(person.name)}
                      className="rounded-full ring-2 ring-primary-50 dark:ring-primary-950"
                    >
                      <UserAvatar
                        user={person}
                        size="sm"
                        ariaLabel={person.name}
                      />
                    </span>
                  ))}

                  {hiddenParticipantCount > 0 && (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-700 text-[11px] font-semibold text-white ring-2 ring-primary-50 dark:bg-primary-600 dark:ring-primary-950">
                      +{hiddenParticipantCount}
                    </span>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onClick?.(documentId);
                }}
                aria-label={`Open ${title}`}
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  border
                  border-primary-200
                  bg-surface/70
                  text-primary-700
                  transition-colors
                  hover:bg-surface
                  hover:text-primary-800
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-primary-500
                  focus-visible:ring-offset-2
                  focus-visible:ring-offset-primary-50
                  dark:border-primary-800
                  dark:bg-surface
                  dark:text-primary-300
                  dark:hover:bg-surface-2
                  dark:focus-visible:ring-offset-primary-950
                "
              >
                <ArrowRight
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>

          {/* CURRENT STATE — stage name itself is communicated by the
              WorkflowStepper below; this line only needs to add the detail
              the stepper can't show: who it's waiting on. */}
          {currentStage && (
            <div className="mt-4 flex min-w-0 items-center gap-2">
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-600 dark:bg-primary-400"
                aria-hidden="true"
              />

              <span
                title={waitingLabel}
                className={`min-w-0 flex-1 truncate font-sans text-sm leading-5 ${waitingOnName
                    ? 'font-medium text-ink'
                    : 'font-normal text-ink-muted'
                  }`}
              >
                {waitingLabel}
              </span>
            </div>
          )}

          {/* WORKFLOW STEPPER */}
          <WorkflowStepper
            status={status}
            stages={workflowStages}
          />
        </div>

        {/* UPLOAD DATE */}
        {uploadLabel && (
          <div className="border-t border-border bg-surface/60 px-5 py-2.5 sm:px-6">
            <p className="font-sans text-[11px] text-ink-muted">
              {uploadLabel}
            </p>
          </div>
        )}
      </div>
    </article>
  );
};





export const AttentionQueueItem = ({
  documentId,
  title,
  workspaceName,
  attentionAction,
  dueDate,
  onClick,
}) => {
  const actionRequired =
    attentionAction === 'ApprovalRequested'
      ? 'Approve document'
      : 'Review document';

  return (
    <div className="border-t border-border first:border-t-0 font-sans">
      <div className="group relative px-5 py-4 sm:px-6">
        <div className="absolute inset-y-3 left-0 w-0.5 rounded-r-full bg-primary-500 opacity-0 transition-opacity duration-150 group-hover:opacity-100" />

        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span
              className="icon-badge icon-badge-3 mt-0.5 h-9 w-9 shrink-0"
              aria-hidden="true"
            >
              <FileText className="h-4 w-4" />
            </span>

            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => onClick?.(documentId)}
                title={title}
                className="
                  block w-full truncate text-left
                  text-sm font-semibold leading-5 tracking-tight text-ink
                  transition-colors duration-150
                  hover:text-primary-700
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-primary-500
                  focus-visible:ring-offset-2
                  focus-visible:ring-offset-surface
                "
              >
                {title}
              </button>

              {workspaceName && (
                <p
                  title={workspaceName}
                  className="mt-0.5 truncate text-xs leading-4 text-ink-muted"
                >
                  {workspaceName}
                </p>
              )}
            </div>
          </div>

         <div className="flex shrink-0 items-center gap-4">
  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-surface-2 px-2.5 py-1.5 text-xs font-medium text-ink whitespace-nowrap">
    <span
      className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500"
      aria-hidden="true"
    />
    <span>{actionRequired}</span>
  </span>

  <div className="shrink-0">
    <DueDateChip date={dueDate} />
  </div>
</div>

          <button
            type="button"
            onClick={() => onClick?.(documentId)}
            aria-label={`Open ${title}`}
            className="
              flex h-8 w-8 shrink-0 items-center justify-center
              rounded-lg text-primary-700
              transition-colors duration-150
              hover:bg-primary-50 hover:text-primary-800
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-primary-500
              focus-visible:ring-offset-2
              focus-visible:ring-offset-surface
              dark:hover:bg-primary-950/60 dark:hover:text-primary-300
            "
          >
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};



const ROLE_ICON_MAP = {
  uploader: FileText,
  reviewer: User,
  approver: Check,
  'final-approver': Check,
};

const formatJoinedDate = (value) => {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    year: 'numeric',
  }).format(date);
};

// Single source of truth for the folder/document silhouette used behind the
// profile card. Exported so the loading skeleton (Dashboard.js) can render
// the identical shape instead of a separate mask-image asset that can drift
// out of sync with this path.
export const ProfileCardShape = ({ className = '' }) => (
  <svg
    viewBox="0 0 284 282"
    preserveAspectRatio="none"
    className={`absolute inset-0 h-full w-full text-primary-600 dark:text-primary-700 ${className}`}
    aria-hidden="true"
  >
    <path
      fill="currentColor"
      d="M0 70.5154C0 58.3861 9.83276 48.5533 21.9621 48.5533H147.556C153.401 48.5533 159.005 46.2232 163.127 42.0788L198.54 6.47452C202.662 2.33016 208.266 0 214.111 0H261.105C273.234 0 283.067 9.83276 283.067 21.9621V259.275C283.067 271.404 273.234 281.237 261.105 281.237H21.9621C9.83277 281.237 0 271.404 0 259.275V70.5154Z"
    />
  </svg>
);

export const ProfileCard = ({
  user = null,
  workspaces = [],
  workflow = null,
  attentionCount = 0,
  onViewProfile,
  onReviewAttention,
}) => {
  const userName = formatDisplayName(user?.name) || 'User';

  const workflowRole =
    workflow?.role || user?.role || null;

  const activeWorkflowCount =
    workflow?.activeCount ?? 0;

  const RoleIcon =
    (workflowRole && ROLE_ICON_MAP[workflowRole]) || User;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-sm animate-fade-in xl:max-w-none">
      {/* Exact folder path, rendered at a locked 1:1 ratio so it can never stretch/distort */}
      <ProfileCardShape />

      {/* Avatar */}
      <div className="absolute right-7 top-6 z-20">
        <div className="relative">

          <UserAvatar
            user={user}
            size="xl"
            ariaLabel={userName}
          />


          {onViewProfile && (
            <button
              type="button"
              onClick={onViewProfile}
              aria-label="View profile"
              className="
          absolute
          -right-1
          -top-1
          flex
          h-6
          w-6
          items-center
          justify-center
          rounded-full
          border
          border-border
          bg-surface
          text-primary-700
          shadow-sm
          transition-all
          duration-150
          hover:scale-105
          hover:bg-surface-2
          active:scale-95
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-primary-500
          focus-visible:ring-offset-2
          focus-visible:ring-offset-surface
        "
            >
              <ArrowRight
                className="h-3 w-3 -rotate-45"
                aria-hidden="true"
              />
            </button>
          )}
        </div>
      </div>

      {/* Content overlay — scrolls internally so it can never overflow the fixed shape */}
      <div className="absolute mt-4 inset-0 z-10 flex flex-col overflow-y-auto px-5 pb-4 pt-16 sm:px-6">
        {/* Identity */}
        <div className="mx-auto w-full max-w-[86%] text-center">
          <h2
            title={userName}
            className="truncate font-sans text-base font-semibold leading-5 tracking-tight text-white"
          >
            {userName}
          </h2>

          {user?.email && (
            <p
              title={user.email}
              className="mt-0.5 truncate font-sans text-xs leading-4 text-white/75"
            >
              {user.email}
            </p>
          )}

          {workflowRole && (
            <span className="mt-1.5 inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 font-sans text-xs font-medium text-white">
              <RoleIcon
                className="h-3.5 w-3.5 shrink-0"
                aria-hidden="true"
              />

              <span className="truncate">
                {formatRoleLabel(workflowRole)}
              </span>
            </span>
          )}
        </div>

        {/* Workspace access */}
        <section className="mt-3 border-t border-white/15 pt-2.5">
          <div className="flex items-center justify-between gap-3">
            <p className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/75">
              Workspace access
            </p>

            <span className="font-mono text-[11px] tabular-nums text-white/70">
              {workspaces.length}
            </span>
          </div>

          {workspaces.length > 0 ? (
            <div className="no-scrollbar mt-1.5 max-h-[76px] space-y-1 overflow-y-auto">
              {workspaces.map((workspace) => {
                const joinedDate = formatJoinedDate(
                  workspace.joinedAt
                );

                return (
                  <div
                    key={
                      workspace.id ??
                      workspace._id ??
                      `${workspace.name}-${workspace.userRole || 'member'}`
                    }
                    className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full bg-primary-200 ring-2 ring-white/10"
                      aria-hidden="true"
                    />

                    <div className="min-w-0">
                      <p className="truncate font-sans text-sm font-medium leading-5 text-white">
                        {workspace.name}
                      </p>

                      <p className="truncate font-sans text-[11px] leading-4 text-white/70">
                        {workspace.userRole
                          ? formatRoleLabel(workspace.userRole)
                          : 'Member'}
                      </p>
                    </div>

                    <span className="shrink-0 pt-0.5 text-right font-sans text-[10px] leading-4 text-white/65">
                      {joinedDate
                        ? `Since ${joinedDate}`
                        : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-1.5 font-sans text-xs text-white/70">
              No workspace access
            </p>
          )}
        </section>

        {/* Workflow */}
        <section className="mt-3 border-t border-white/15 pt-2.5">
          <p className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/75">
            Your workflow
          </p>

          <dl className="mt-1.5 space-y-1">
            <div className="flex items-center justify-between gap-4">
              <dt className="font-sans text-sm text-white/85">
                Active
              </dt>

              <dd className="font-mono text-sm font-semibold tabular-nums text-white">
                {activeWorkflowCount}
              </dd>
            </div>

            <div className="flex items-center justify-between gap-4">
              <dt className="font-sans text-sm text-white/85">
                Needs attention
              </dt>

              <dd
                className={
                  attentionCount > 0
                    ? 'font-mono text-sm font-semibold tabular-nums text-white'
                    : 'font-mono text-sm font-semibold tabular-nums text-white/60'
                }
              >
                {attentionCount}
              </dd>
            </div>
          </dl>


        </section>
      </div>
    </div>
  );
};






const FILE_TYPE_CONFIG = {
  'application/pdf': { icon: File, badgeClass: 'icon-badge-4' },
  'text/csv': { icon: FileSpreadsheet, badgeClass: 'icon-badge-2' },
  'text/plain': { icon: FileText, badgeClass: 'icon-badge-1' },
};
const DEFAULT_FILE_TYPE = { icon: FileText, badgeClass: 'icon-badge-1' };

// Candidate for dashboardUtils.js if file-size formatting is needed
// elsewhere — kept local for now since that file wasn't available to check.
const formatFileSize = (bytes = 0) => {
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb > 0 && kb < 0.01 ? '<0.01' : kb.toFixed(2)} KB`;
  }
  return `${(kb / 1024).toFixed(2)} MB`;
};

const MAX_VISIBLE_MEMBERS = 3;

const RecentDocumentRow = ({ document, currentUserId, onClick }) => {
  const {
    _id: documentId,
    name,
    type,
    size,
    workspace,
    status,
    uploadDate,
    uploadedBy,
    workflow,
  } = document;

  const { icon: FileIcon, badgeClass } =
    FILE_TYPE_CONFIG[type] || DEFAULT_FILE_TYPE;

  const ownerName =
    currentUserId && uploadedBy?._id === currentUserId
      ? 'Me'
      : uploadedBy?.name
        ? formatDisplayName(uploadedBy.name)
        : 'Unassigned';

  const participants = [uploadedBy, workflow?.reviewer, workflow?.approver]
    .filter(Boolean)
    .filter(
      (person, index, all) =>
        all.findIndex((p) => p._id === person._id) === index
    );

  const visibleParticipants = participants.slice(0, MAX_VISIBLE_MEMBERS);
  const hiddenParticipantCount =
    participants.length - visibleParticipants.length;

  return (
    <tr className="group transition-colors hover:bg-surface-2">
      <td className="min-w-[220px] px-5 py-3.5 sm:px-6">
        <button
          type="button"
          onClick={() => onClick?.(documentId)}
          className="flex min-w-0 items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          <span className={`icon-badge ${badgeClass} h-8 w-8 shrink-0`}>
            <FileIcon className="h-4 w-4" aria-hidden="true" />
          </span>

          <span className="min-w-0">
            <span className="block truncate font-sans text-sm font-semibold leading-5 text-ink transition-colors group-hover:text-primary-700">
              {name}
            </span>
            {workspace?.name && (
              <span className="block truncate font-sans text-xs leading-4 text-ink-muted">
                {workspace.name}
              </span>
            )}
          </span>
        </button>
      </td>

      <td className="px-4 py-3.5 align-top">
        <p className="font-sans text-sm leading-5 text-ink">
          {formatRelativeTime(uploadDate)}
        </p>
        <p className="mt-0.5 font-sans text-xs leading-4 text-ink-muted">
          By {ownerName}
        </p>
      </td>

      <td className="hidden px-4 py-3.5 align-top lg:table-cell">
        <p className="font-sans text-sm tabular-nums leading-5 text-ink">
          {formatFileSize(size)}
        </p>
      </td>

      <td className="px-4 py-3.5 align-top">
        <StatusPill status={status} size="xs" showIcon={false} />
      </td>

      <td className="px-4 py-3.5 align-top">
        <p className="truncate font-sans text-sm leading-5 text-ink">
          {ownerName}
        </p>
      </td>

      <td className="hidden px-4 py-3.5 align-top lg:table-cell">
        {participants.length > 0 ? (
          <div className="flex items-center -space-x-2">
            {visibleParticipants.map((person) => (
              <span
                key={person._id}
                title={formatDisplayName(person.name)}
                className="rounded-full ring-2 ring-surface"
              >
                <UserAvatar user={person} size="sm" ariaLabel={person.name} />
              </span>
            ))}

            {hiddenParticipantCount > 0 && (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-700 text-[11px] font-semibold text-white ring-2 ring-surface dark:bg-primary-600">
                +{hiddenParticipantCount}
              </span>
            )}
          </div>
        ) : (
          <span className="font-sans text-xs text-ink-muted">—</span>
        )}
      </td>

      <td className="w-12 px-4 py-3.5 text-right sm:pr-6">
        <button
          type="button"
          onClick={() => onClick?.(documentId)}
          aria-label={`Open ${name}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-primary-700 transition-colors hover:bg-surface-2 hover:text-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface dark:hover:bg-primary-950/60 dark:hover:text-primary-300"
        >
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </td>
    </tr>
  );
};

export const RecentDocumentsTable = ({
  documents = [],
  currentUserId,
  onClick,
  onViewAll,
}) => (
  <div className="flex flex-col">
    <div className="flex items-baseline justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
      <div className="min-w-0">
        <h2 className="font-sans text-base font-semibold tracking-tight text-ink sm:text-lg">
          Recently added
        </h2>

      </div>

      {onViewAll && (
        <Button variant="outline" size="sm" onClick={onViewAll}>
          View all
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      )}
    </div>

    {documents.length === 0 ? (
      <div className="flex min-h-[160px] items-center justify-center px-5 py-10 sm:px-6">
        <div className="max-w-sm text-center">
          <p className="font-sans text-sm font-semibold text-ink">
            No documents yet
          </p>
          <p className="mt-1 font-sans text-xs leading-5 text-ink-muted sm:text-sm">
            Documents will appear here as they&apos;re uploaded.
          </p>
        </div>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse lg:min-w-[760px]">
          <thead>
            <tr className="border-b border-border">
              <th
                scope="col"
                className="px-5 py-2.5 text-left font-sans text-[11px] font-medium uppercase tracking-wide text-ink-muted sm:px-6"
              >
                Name
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-left font-sans text-[11px] font-medium uppercase tracking-wide text-ink-muted"
              >
                Last modified
              </th>
              <th
                scope="col"
                className="hidden px-4 py-2.5 text-left font-sans text-[11px] font-medium uppercase tracking-wide text-ink-muted lg:table-cell"
              >
                Size
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-left font-sans text-[11px] font-medium uppercase tracking-wide text-ink-muted"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-left font-sans text-[11px] font-medium uppercase tracking-wide text-ink-muted"
              >
                Owner
              </th>
              <th
                scope="col"
                className="hidden px-4 py-2.5 text-left font-sans text-[11px] font-medium uppercase tracking-wide text-ink-muted lg:table-cell"
              >
                Members
              </th>
              <th scope="col" className="w-12 px-4 py-2.5 sm:pr-6" />
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {documents.map((document) => (
              <RecentDocumentRow
                key={document._id}
                document={document}
                currentUserId={currentUserId}
                onClick={onClick}
              />
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);



export const WorkflowPipelineStrip = ({
  stages = [],
}) => {
  const chartStages = stages.slice(0, WORKFLOW_STAGES.length);

  const total = chartStages.reduce(
    (sum, stage) => sum + Math.max(0, stage.count || 0),
    0
  );

  const BADGE_CLASS_BY_INDEX = [
    'icon-badge-1',
    'icon-badge-2',
    'icon-badge-3',
    'icon-badge-4',
  ];

  const STROKE_CLASS_BY_INDEX = [
    'text-primary-200',
    'text-primary-400',
    'text-primary-600',
    'text-primary-800',
  ];

  const enrichedStages = chartStages.map((stage, index) => {
    const count = Math.max(0, stage.count || 0);

    return {
      ...stage,
      count,
      percentage:
        total > 0 ? Math.round((count / total) * 100) : 0,
      badgeClass:
        BADGE_CLASS_BY_INDEX[index] || 'icon-badge-1',
      strokeClass:
        STROKE_CLASS_BY_INDEX[index] || 'text-primary-400',
    };
  });

  const radius = 70;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;

  const donutStages = enrichedStages.map((stage) => {
    const segmentLength =
      (stage.percentage / 100) * circumference;

    const result = {
      ...stage,
      segmentLength,
      offset,
    };

    offset += segmentLength;

    return result;
  });

  return (
    <div className="flex h-full min-h-0 flex-col px-4 py-4 sm:px-5 sm:py-5">
      {/* Header */}
      <div className="flex shrink-0 items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-sans text-base font-semibold tracking-tight text-ink sm:text-lg">
            Workflow distribution
          </h2>

          <p className="mt-0.5 font-sans text-xs text-ink-muted sm:text-sm">
            {total}{' '}
            {total === 1 ? 'document' : 'documents'} in workflow
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="font-mono text-xl font-semibold leading-none tabular-nums text-ink">
            {total}
          </p>

          <p className="mt-1 font-sans text-[10px] font-medium uppercase tracking-wide text-ink-muted">
            Total
          </p>
        </div>
      </div>

      {/* Donut */}
      <div className="flex min-h-0 shrink-0 items-center justify-center py-3 sm:py-4">
        <div className="relative h-36 w-36">
          <svg
            viewBox="0 0 180 180"
            className="h-full w-full -rotate-90"
            role="img"
            aria-label={`Workflow distribution across ${total} documents`}
          >
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="18"
              className="text-surface-2"
            />

            {donutStages.map((stage) =>
              stage.percentage > 0 ? (
                <circle
                  key={stage.stageKey}
                  cx="90"
                  cy="90"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="18"
                  strokeLinecap="butt"
                  className={stage.strokeClass}
                  strokeDasharray={`${stage.segmentLength} ${circumference}`}
                  strokeDashoffset={-stage.offset}
                />
              ) : null
            )}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-2xl font-semibold leading-none tabular-nums text-ink">
              {total}
            </span>

            <span className="mt-1 font-sans text-[11px] font-medium text-ink-muted">
              Total
            </span>
          </div>
        </div>
      </div>

      {/* Stage grid */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
        {enrichedStages.map((stage) => {
          const StageIcon =
            STAGE_ICON_MAP[stage.stageKey] || FileText;

          const hasDocuments = stage.count > 0;

          return (
            <div
              key={stage.stageKey}
              role="group"
              aria-label={`${stage.label}: ${stage.count} ${stage.count === 1
                  ? 'document'
                  : 'documents'
                }, ${stage.percentage}%`}
              className="flex min-h-0 flex-col justify-between rounded-xl border border-border bg-surface-2/40 p-3.5"
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`icon-badge ${stage.badgeClass} h-10 w-10 shrink-0`}
                  aria-hidden="true"
                >
                  <StageIcon
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                </span>

                <span
                  className={`font-sans text-lg font-semibold tabular-nums ${hasDocuments
                      ? 'text-primary-700 dark:text-primary-300'
                      : 'text-ink-muted'
                    }`}
                >
                  {stage.percentage}%
                </span>
              </div>

              <div className="mt-3">
                <p
                  className={`truncate font-sans text-sm font-semibold leading-5 ${hasDocuments
                      ? 'text-ink'
                      : 'text-ink-muted'
                    }`}
                >
                  {stage.label}
                </p>

                <p className="mt-1 font-sans text-xs text-ink-muted">
                  {stage.count}{' '}
                  {stage.count === 1
                    ? 'document'
                    : 'documents'}
                </p>
              </div>

              <div className="mt-3">
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
                  <div
                    className={`h-full rounded-full ${stage.strokeClass.replace(
                      'text-',
                      'bg-'
                    )
                      }`}
                    style={{
                      width: `${stage.percentage}%`,
                    }}
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};