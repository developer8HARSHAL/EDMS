import React, { useState } from 'react';
import toast from 'react-hot-toast';
import apiService from '../../services/apiService';
import Avatar from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

// shareDocument exists in apiService but isn't wired into useDocuments/documentsSlice
// (no thunk calls it) — calling apiService directly here, same pattern DocumentPreview
// already used for downloadDocument. shareData shape ({email, role}) is NOT live-verified,
// only inferred from the endpoint name — flag if the backend expects something different.
const ROLES = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'editor', label: 'Editor' },
];

// permissions[].user is expected populated ({_id,name,email}) per backend briefing but
// not yet confirmed live — falls back to showing the raw id if it comes back unpopulated.
const permissionLabel = (perm) => {
  if (typeof perm.user === 'string') return perm.user;
  return perm.user?.name || perm.user?.email || 'Unknown user';
};

const ShareRow = ({ documentId, permissions = [], onShared }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [submitting, setSubmitting] = useState(false);

  const handleShare = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    try {
      await apiService.documentApi.shareDocument(documentId, { email: email.trim(), role });
      toast.success(`Shared with ${email.trim()}`);
      setEmail('');
      onShared?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to share document');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleShare} className="flex items-center gap-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          className="flex-1"
          required
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-lg border border-border bg-surface px-2 py-2 text-sm text-ink"
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? 'Sharing...' : 'Share'}
        </Button>
      </form>

      {permissions.length > 0 && (
        <ul className="mt-3 space-y-2">
          {permissions.map((perm, i) => (
            <li key={perm._id || i} className="flex items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <Avatar name={permissionLabel(perm)} size="xs" />
                <span className="truncate text-ink">{permissionLabel(perm)}</span>
              </div>
              <span className="shrink-0 text-xs capitalize text-ink-muted">{perm.role || perm.permission}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ShareRow;
