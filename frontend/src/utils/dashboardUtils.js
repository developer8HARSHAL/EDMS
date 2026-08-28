// src/utils/dashboardUtils.js
//
// Pure, framework-free helpers that turn raw dashboard-data API fields into
// UI-ready props. No React, no redux — everything here is unit-testable in
// isolation and safe to call from useDashboard's useMemo blocks.
//
// Status enum used throughout matches StatusPill.jsx / the real backend
// values: 'draft' | 'in-review' | 'final-review' | 'approved'.

// ---------------------------------------------------------------------------
// Real-API-shape adapters
//
// Everything below in this section exists because the raw dashboard-data
// response (confirmed live, this session) doesn't match the QueueItem shape
// the rest of this file was written against — different field names, a
// nested workflow object instead of flat reviewer/finalApprover, lowercase
// singular attentionAction values, and no stageEnteredAt anywhere in the
// backend. These adapters are the one place that gap is bridged; everything
// downstream (scoreItem, buildAttentionGroups, etc.) still works on the
// original QueueItem shape unchanged.
// ---------------------------------------------------------------------------

const ATTENTION_ACTION_MAP = { review: 'ReviewRequested', approve: 'ApprovalRequested' };
const ATTENTION_ROLE_LABEL = { reviewer: 'Reviewer', approver: 'Final Approver' };

function toPersonRef(user) {
  if (!user) return undefined;

  return {
    id: user._id ?? user.id ?? null,
    name: user.name ?? null,
    email: user.email ?? null,
  };
}

/**
 * Adapts a raw pendingReview item into the QueueItem shape below expects.
 * Real shape confirmed live: { _id, name, workspace:{_id,name}, status,
 * uploadedBy, workflow:{reviewer,approver}, attentionRole, attentionAction, dueDate }.
 */
export function mapPendingReviewItem(raw) {
  return {
    documentId: raw._id,
    title: raw.name,
    workspaceName: raw.workspace?.name,
    status: raw.status,
    uploader: toPersonRef(raw.uploadedBy),
    reviewer: toPersonRef(raw.workflow?.reviewer),
    finalApprover: toPersonRef(raw.workflow?.approver),
    attentionRole: ATTENTION_ROLE_LABEL[raw.attentionRole] || raw.attentionRole,
    attentionAction: ATTENTION_ACTION_MAP[raw.attentionAction] || raw.attentionAction,
    dueDate: raw.dueDate ?? null,
    // Not tracked anywhere in the backend yet (no timestamps, no per-stage
    // entry date) — scoreItem below guards against this being null/NaN.
    stageEnteredAt: null,
  };
}

// ---------------------------------------------------------------------------
// Display formatting
// ---------------------------------------------------------------------------

/** "harshal pinge" -> "Harshal Pinge". Presentation-only; doesn't touch the
 *  stored value, so it's safe even if the backend never normalizes casing. */
export function formatDisplayName(name) {
  if (!name) return 'User';
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

// A deadline only counts as "needs your attention right now" if it's close —
// otherwise every upcoming deadline, however distant, would crowd the
// Attention Queue with the same unconditional urgency as an actual pending
// approval. Overdue items always qualify: daysBetween (defined below) clamps
// negative diffs to 0, so an overdue date reads as "0 days out" — still
// inside the window.
const DEADLINE_ATTENTION_WINDOW_DAYS = 3;

/**
 * Adapts a raw upcomingDeadlines item. Real shape has no uploadedBy/workflow
 * at all — { _id, name, workspace:{_id,name}, status, dueDate } — so the
 * RoleChain degrades to nothing rendered (handled: it returns null when all
 * three are undefined) rather than guessing at who's involved.
 *
 * attentionAction is only set to 'DeadlineApproaching' when the due date
 * falls inside DEADLINE_ATTENTION_WINDOW_DAYS — otherwise left null so
 * buildAttentionGroups naturally excludes it (no GROUP_ORDER key matches
 * null). The item still surfaces in Active Workflows regardless of distance,
 * via buildActiveWorkflows, since "what's moving" isn't windowed the same
 * way "what needs you right now" is.
 */
export function mapDeadlineItem(raw) {
  const daysUntilDue = raw.dueDate
    ? daysBetween(new Date(), new Date(raw.dueDate))
    : null;
  const isApproaching =
    daysUntilDue !== null && daysUntilDue <= DEADLINE_ATTENTION_WINDOW_DAYS;

  return {
    documentId: raw._id,
    title: raw.name,
    workspaceName: raw.workspace?.name,
    status: raw.status,
    uploader: toPersonRef(raw.uploadedBy),
    reviewer: undefined,
    finalApprover: undefined,
    attentionRole: 'Assignee',
    attentionAction: isApproaching ? 'DeadlineApproaching' : null,
    dueDate: raw.dueDate ?? null,
    stageEnteredAt: null,
  };
}

/**
 * Adapts a raw recentDocuments item — used only by Active Workflows below,
 * not by the attention queue. Real shape: { _id, name, size, type,
 * workspace:{_id,name}, status, dueDate, uploadDate, workflow:{reviewer,approver} }.
 * No uploadedBy field on this endpoint's projection, so uploader is
 * unavailable here even though it exists on the document in the DB.
 */
export function mapRecentDocumentItem(raw) {
  return {
    documentId: raw._id,
    title: raw.name,
    workspaceName: raw.workspace?.name,
    status: raw.status,
    uploader: toPersonRef(raw.uploadedBy),
    reviewer: toPersonRef(raw.workflow?.reviewer),
    finalApprover: toPersonRef(raw.workflow?.approver),
    dueDate: raw.dueDate ?? null,
    // uploadDate, not a true "last modified" timestamp — see buildActiveWorkflows.
    uploadedAt: raw.uploadDate ?? null,
  };
}



const ACTION_WEIGHT = {
  ApprovalRequested: 4,
  ReviewRequested: 3,
  DeadlineApproaching: 1,
};

const GROUP_ORDER = ['ApprovalRequested', 'ReviewRequested', 'DeadlineApproaching'];

const GROUP_LABELS = {
  ApprovalRequested: 'Approval needed',
  ReviewRequested: 'Review needed',
  DeadlineApproaching: 'Deadlines',
};

const STAGE_AGE_CAP_DAYS = 10;
const OVERDUE_BONUS = 50;
const MS_PER_DAY = 86_400_000;

function daysBetween(from, to) {
  return Math.max(0, Math.floor((to - from) / MS_PER_DAY));
}

// Mirrors the backend's status→role resolution, for the RoleChain's "who has
// the ball right now" emphasis. Presentation-only — if this ever drifts from
// backend truth, promote it to a real field rather than patching it here.
function resolveCurrentOwnerId(item) {
  switch (item.status) {
    case 'in-review':
      return item.reviewer?.id ?? null;
    case 'final-review':
      return item.finalApprover?.id ?? null;
    case 'draft':
      return item.uploader?.id ?? null;
    default:
      return null;
  }
}

function scoreItem(item, now) {
  const isOverdue = !!item.dueDate && new Date(item.dueDate) < now;
  // stageEnteredAt is always null right now (see real-API-shape adapters
  // above) — guarded rather than fed to `new Date(null)`, which would
  // silently produce NaN and corrupt every downstream sort comparison.
  const daysInStage = item.stageEnteredAt ? daysBetween(new Date(item.stageEnteredAt), now) : 0;
  const stageAgeBonus = Math.min(daysInStage, STAGE_AGE_CAP_DAYS);
  const overdueBonus = isOverdue ? OVERDUE_BONUS : 0;
  const actionWeight = ACTION_WEIGHT[item.attentionAction] ?? 0;

  return {
    score: actionWeight * 100 + overdueBonus + stageAgeBonus,
    isOverdue,
    daysInStage,
  };
}

function toItemProps(item, now) {
  const { score, isOverdue, daysInStage } = scoreItem(item, now);
  return {
    documentId: item.documentId,
    title: item.title,
    workspaceName: item.workspaceName,
    status: item.status,
    uploader: item.uploader,
    reviewer: item.reviewer,
    finalApprover: item.finalApprover,
    currentOwnerId: resolveCurrentOwnerId(item),
    attentionRole: item.attentionRole,
    attentionAction: item.attentionAction,
    dueDate: item.dueDate,
    isOverdue,
    daysInStage,
    _score: score,
  };
}


function dedupeByDocument(items) {
  const byId = new Map();

  items.forEach((item) => {
    if (!item.documentId) return;
    const existing = byId.get(item.documentId);
    if (!existing) {
      byId.set(item.documentId, item);
      return;
    }
    const existingWeight = ACTION_WEIGHT[existing.attentionAction] ?? 0;
    const itemWeight = ACTION_WEIGHT[item.attentionAction] ?? 0;
    if (itemWeight > existingWeight) byId.set(item.documentId, item);
  });

  return Array.from(byId.values());
}



/**
 * Merges pendingReview + upcomingDeadlines into one urgency-ranked,
+ * action-grouped list, deduped by documentId. Empty groups are omitted.
 *
 * @param {Array} pendingReview - raw QueueItem[] from dashboard-data
 * @param {Array} upcomingDeadlines - raw QueueItem[] from dashboard-data
 * @param {Date} [now] - injectable for testing
 * @returns {Array<{ groupKey: string, groupLabel: string, items: object[] }>}
 */



export function buildAttentionGroups(pendingReview, upcomingDeadlines, now = new Date()) {
     const merged = dedupeByDocument([...(pendingReview ?? []), ...(upcomingDeadlines ?? [])]);
  const scored = merged.map((item) => toItemProps(item, now));

  return GROUP_ORDER
    .map((groupKey) => ({
      groupKey,
      groupLabel: GROUP_LABELS[groupKey],
      items: scored
        .filter((i) => i.attentionAction === groupKey)
        .sort((a, b) => b._score - a._score)
        .map(({ _score, ...rest }) => rest),
    }))
    .filter((group) => group.items.length > 0);
}

export function isAllCaughtUp(attentionGroups) {
  return attentionGroups.length === 0;
}

// ---------------------------------------------------------------------------
// Activity feed formatting
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Recent activity — compact placeholder built from recentDocuments
//
// activityFeed (rich per-event objects with actorName/eventType/timestamp)
// does not exist anywhere in the real API — confirmed live. The approved v2
// wireframe already anticipated this: "Recent Activity ... built from
// recentDocuments (title, workspace, status, relative time), explicitly a
// placeholder shape that upgrades cleanly once a real history/event API
// exists." This is that placeholder — no actor name, since recentDocuments
// doesn't carry one.
// ---------------------------------------------------------------------------

export function formatRecentDocumentsAsActivity(recentDocuments) {
  return (recentDocuments ?? []).map((doc) => ({
    documentId: doc._id,
    title: doc.name,
    workspaceId: doc.workspace?._id ?? null,
    workspaceName: doc.workspace?.name,
    status: doc.status,
    timestamp: doc.uploadDate,
  }));
}

// ---------------------------------------------------------------------------
// Active Workflows — union of pendingReview + upcomingDeadlines +
// recentDocuments, deduplicated by documentId, excluding anything approved.
//
// This is a derived view over 3 existing endpoints' data, not a new backend
// query — it can only show documents that already surface in one of those
// three arrays, not a full unfiltered scan of every in-flight document in
// the user's workspaces. Dashboard.js labels this a snapshot for exactly
// that reason ("Active workflows · Showing N").
// ---------------------------------------------------------------------------

const WAITING_ROLE_LABEL = { draft: 'Uploader', 'in-review': 'Reviewer', 'final-review': 'Final Approver' };

/** Who currently has the ball, by id+name+role, for the "Waiting on X (Role)" line. */
export function resolveWaitingOn(item) {
  const role = WAITING_ROLE_LABEL[item.status];
  if (!role) return null;
  const person = item.status === 'draft' ? item.uploader
    : item.status === 'in-review' ? item.reviewer
    : item.status === 'final-review' ? item.finalApprover
    : null;
  return person ? { id: person.id ?? null, name: person.name, role } : null;
}

const MS_PER_HOUR = 3_600_000;

/** "2d ago" / "3h ago" — used only for recentDocuments-sourced rows below,
 *  where uploadDate is a real (if imprecise — see buildActiveWorkflows) date. */
export function formatRelativeTime(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;
  const diffMs = Date.now() - date.getTime();
  if (diffMs < MS_PER_DAY) return `${Math.max(1, Math.floor(diffMs / MS_PER_HOUR))}h ago`;
  return `${Math.floor(diffMs / MS_PER_DAY)}d ago`;
}

/**
 * @param {Array} mappedPendingReview - already through mapPendingReviewItem
 * @param {Array} mappedDeadlines - already through mapDeadlineItem
 * @param {Array} rawRecentDocuments - raw recentDocuments[], mapped internally
 * @param {number} [limit=6]
 */
export function buildActiveWorkflows(
  mappedPendingReview,
  mappedDeadlines,
  rawRecentDocuments,
  limit = 6
) {
  const byId = new Map();

  const buildWorkflowRecord = (item, lastUpdatedText = null) => {
    return {
      documentId: item.documentId,
      title: item.title,
      workspaceName: item.workspaceName,
      status: item.status,
      uploader: item.uploader,
      reviewer: item.reviewer,
      finalApprover: item.finalApprover,
      dueDate: item.dueDate ?? null,
      lastUpdatedText,
    };
  };

  const mergeWorkflowRecord = (existing, incoming) => {
    const merged = {
      ...existing,

      // Preserve the first authoritative value, but fill any
      // missing information from the other API representation.
      title: existing.title ?? incoming.title,
      workspaceName: existing.workspaceName ?? incoming.workspaceName,
      status: existing.status ?? incoming.status,

      uploader: existing.uploader ?? incoming.uploader,
      reviewer: existing.reviewer ?? incoming.reviewer,
      finalApprover: existing.finalApprover ?? incoming.finalApprover,

      dueDate: existing.dueDate ?? incoming.dueDate,

      // If the first source has no timestamp but another source does,
      // keep the available timestamp instead of throwing it away.
      lastUpdatedText:
        existing.lastUpdatedText ?? incoming.lastUpdatedText ?? null,
    };

    const waitingOn = resolveWaitingOn(merged);

    return {
      ...merged,
      waitingOnId: waitingOn?.id ?? null,
      waitingOnName: waitingOn?.name ?? null,
      waitingOnRole: waitingOn?.role ?? null,
    };
  };

  const addItem = (item, lastUpdatedText = null) => {
    if (!item.documentId || item.status === 'approved') return;

    const incoming = buildWorkflowRecord(item, lastUpdatedText);
    const existing = byId.get(item.documentId);

    if (!existing) {
      const waitingOn = resolveWaitingOn(incoming);

      byId.set(item.documentId, {
        ...incoming,
        waitingOnId: waitingOn?.id ?? null,
        waitingOnName: waitingOn?.name ?? null,
        waitingOnRole: waitingOn?.role ?? null,
      });

      return;
    }

    byId.set(
      item.documentId,
      mergeWorkflowRecord(existing, incoming)
    );
  };

  // 1. Action/attention data
  (mappedPendingReview ?? []).forEach((item) => {
    addItem(item);
  });

  // 2. Deadline data
  (mappedDeadlines ?? []).forEach((item) => {
    addItem(item);
  });

  // 3. Recent-document data
  (rawRecentDocuments ?? []).forEach((raw) => {
    const item = mapRecentDocumentItem(raw);

    if (!item.documentId || item.status === 'approved') {
      return;
    }

    const lastUpdatedText = item.uploadedAt
      ? `Uploaded ${formatRelativeTime(item.uploadedAt)}`
      : null;

    addItem(item, lastUpdatedText);
  });

  return Array.from(byId.values()).slice(0, limit);
}

// ---------------------------------------------------------------------------
// Team Workload — groups Active Workflows by who currently holds the ball.
//
// Grouped by waitingOnId (the underlying user id, carried through via
// resolveWaitingOn/toPersonRef), falling back to name only in the rare case
// an id wasn't resolvable — two different people sharing a display name no
// longer collapse into one bucket. Items with no waitingOnName (draft
// documents sourced only from recentDocuments, where uploader is unavailable
// on that endpoint's projection — see mapRecentDocumentItem) simply don't
// count toward anyone's workload, same "omit rather than fabricate" rule
// applied elsewhere here.
// ---------------------------------------------------------------------------

/**
 * @param {Array} activeWorkflows - already-built output of buildActiveWorkflows
 * @returns {Array<{ id: string|null, name: string, role: string|null, count: number }>}
 *   sorted highest workload first
 */
export function buildTeamWorkload(activeWorkflows) {
  const byId = new Map();

  (activeWorkflows ?? []).forEach((item) => {
    if (!item.waitingOnName) return;

    const key = item.waitingOnId ?? item.waitingOnName;
    const existing = byId.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      byId.set(key, {
        id: item.waitingOnId ?? null,
        name: item.waitingOnName,
        role: item.waitingOnRole ?? null,
        count: 1,
      });
    }
  });

  return Array.from(byId.values()).sort((a, b) => b.count - a.count);
}

// Only 3 real counts exist in dashboard-data stats (draftCount/inReviewCount/
// approvedCount) — no finalReviewCount anywhere, confirmed live. Per the
// approved v2 wireframe: one segmented bar built honestly from what's there,
// not a 4th fabricated bucket. Where a document IS in final-review, it still
// shows correctly at the item level (StatusPill) in the Attention Queue and
// Active Workflows — just not as a separate aggregate segment here.
// ---------------------------------------------------------------------------
// Pipeline stages
// ---------------------------------------------------------------------------

const PIPELINE_STAGE_ORDER = [
  { stageKey: 'draft', label: 'Draft' },
  { stageKey: 'in-review', label: 'In Review' },
  { stageKey: 'final-review', label: 'Final Review' },
  { stageKey: 'approved', label: 'Approved' },
];

/**
 * Derives the four real workflow stages from the existing dashboard stats.
 * The backend exposes totalDocs, draftCount, inReviewCount and approvedCount.
 * Because the document model has exactly four statuses, Final Review is the
 * remaining bucket: total - draft - inReview - approved.
 */
export function buildPipelineStages(stats) {
  const totalDocs = Math.max(0, stats?.totalDocs ?? 0);
  const draft = Math.max(0, stats?.draftCount ?? 0);
  const inReview = Math.max(0, stats?.inReviewCount ?? 0);
  const approved = Math.max(0, stats?.approvedCount ?? 0);
  const finalReview = Math.max(0, totalDocs - draft - inReview - approved);

  const counts = {
    draft,
    'in-review': inReview,
    'final-review': finalReview,
    approved,
  };

  const denominator = Math.max(1, totalDocs);

  return PIPELINE_STAGE_ORDER.map(({ stageKey, label }) => ({
    stageKey,
    label,
    count: counts[stageKey],
    fillPercent: counts[stageKey] / denominator,
  }));
}