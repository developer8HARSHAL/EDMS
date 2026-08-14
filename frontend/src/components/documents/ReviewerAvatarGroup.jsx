import React from 'react';
import Avatar from '../ui/Avatar';

// document.reviewers[] is raw ID strings — backend does not populate them (confirmed live).
// Parent passes workspace.members[] so we can resolve name/email for display here.
// Member shape tolerates both { user: {_id,name} } and a flat { _id, name } — unverified live.
const resolveMember = (id, members) =>
  members.find((m) => (m.user?._id || m.user || m._id) === id);

const ReviewerAvatarGroup = ({ reviewerIds = [], members = [], max = 4, size = 'xs' }) => {
  if (!reviewerIds.length) return null;

  const resolved = reviewerIds.map((id) => resolveMember(id, members)).filter(Boolean);
  const visible = resolved.slice(0, max);
  const remaining = resolved.length - visible.length;

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((m, i) => {
        const name = m.user?.name || m.name;
        return (
          <Avatar
            key={m.user?._id || m._id || i}
            name={name}
            size={size}
            ariaLabel={name}
            className="ring-2 ring-surface"
          />
        );
      })}
      {remaining > 0 && (
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-2 text-xs font-medium text-ink-muted ring-2 ring-surface">
          +{remaining}
        </div>
      )}
    </div>
  );
};

export default ReviewerAvatarGroup;
