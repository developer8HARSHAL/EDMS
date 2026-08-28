import React, { useState } from 'react';
import { Check, LockKeyhole, UserRound } from 'lucide-react';
import Avatar from '../ui/Avatar';

const extractId = (value) => (typeof value === 'string' ? value : value?._id);

const resolveUser = (value, members) => {
  if (!value) return null;
  if (typeof value === 'object' && value.name) return value;
  const id = extractId(value);
  const member = members.find((memberItem) => extractId(memberItem.user) === id);
  return member?.user || null;
};

const AssignmentDisplay = ({ label, assignedUser }) => (
  <div className="flex min-w-0 items-center gap-3">
    <span className="w-24 shrink-0 text-sm font-medium text-ink-muted">
      {label}
    </span>

    {assignedUser ? (
      <div className="flex min-w-0 items-center gap-2">
        <Avatar name={assignedUser.name} size="xs" />
        <span className="truncate text-sm font-medium text-ink">
          {assignedUser.name}
        </span>
      </div>
    ) : (
      <span className="text-sm italic text-ink-muted">Unassigned</span>
    )}
  </div>
);

const WorkflowAssignmentPanel = ({
  workflow,
  members = [],
  canManageWorkflow = false,
  onChange,
  loading = false,
}) => {
  const reviewer = resolveUser(workflow?.reviewer, members);
  const approver = resolveUser(workflow?.approver, members);
  const reviewerId = extractId(workflow?.reviewer) || null;
  const approverId = extractId(workflow?.approver) || null;

  const [editing, setEditing] = useState(false);
  const [draftReviewerId, setDraftReviewerId] = useState(reviewerId || '');
  const [draftApproverId, setDraftApproverId] = useState(approverId || '');

  const startEditing = () => {
    setDraftReviewerId(reviewerId || '');
    setDraftApproverId(approverId || '');
    setEditing(true);
  };

  const cancelEditing = () => setEditing(false);

  const handleSave = () => {
    if (!draftReviewerId || !draftApproverId) return;
    onChange?.({
      reviewerId: draftReviewerId,
      approverId: draftApproverId,
    });
    setEditing(false);
  };

  const canSave =
    !!draftReviewerId &&
    !!draftApproverId &&
    draftReviewerId !== draftApproverId;

  if (!editing) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface p-3">
            <AssignmentDisplay label="Reviewer" assignedUser={reviewer} />
          </div>

          <div className="rounded-lg border border-border bg-surface p-3">
            <AssignmentDisplay label="Final approver" assignedUser={approver} />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 text-xs text-ink-muted">
            {canManageWorkflow ? (
              <UserRound className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            )}
            <span>
              {canManageWorkflow
                ? 'You can assign both workflow roles.'
                : 'Only users with workflow management permission can change assignments.'}
            </span>
          </div>

          {canManageWorkflow && !loading && (
            <button
              type="button"
              onClick={startEditing}
              className="shrink-0 text-sm font-medium text-primary-700 transition-colors hover:text-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              {reviewer || approver
                ? 'Change assignments'
                : 'Assign workflow roles'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="min-w-0">
          <span className="mb-1.5 block text-sm font-medium text-ink">
            Reviewer
          </span>
          <select
            value={draftReviewerId}
            onChange={(event) => setDraftReviewerId(event.target.value)}
            className="input-field"
          >
            <option value="">Select reviewer...</option>
            {members
              .filter((member) => extractId(member.user) !== draftApproverId)
              .map((member) => (
                <option key={extractId(member.user)} value={extractId(member.user)}>
                  {member.user?.name || member.user?.email || extractId(member.user)}
                </option>
              ))}
          </select>
        </label>

        <label className="min-w-0">
          <span className="mb-1.5 block text-sm font-medium text-ink">
            Final approver
          </span>
          <select
            value={draftApproverId}
            onChange={(event) => setDraftApproverId(event.target.value)}
            className="input-field"
          >
            <option value="">Select approver...</option>
            {members
              .filter((member) => extractId(member.user) !== draftReviewerId)
              .map((member) => (
                <option key={extractId(member.user)} value={extractId(member.user)}>
                  {member.user?.name || member.user?.email || extractId(member.user)}
                </option>
              ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <Check className="h-4 w-4" aria-hidden="true" />
          Save assignments
        </button>

        <button
          type="button"
          onClick={cancelEditing}
          className="rounded-full px-3.5 py-2 text-sm text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default WorkflowAssignmentPanel;