import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  CalendarIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { useDocuments } from '../hooks/useDocuments';
import { DueDateChip, ExpiryDateChip } from '../components/documents/DueDateChip';
import { Dropdown, DropdownItem } from '../components/ui/Dropdown';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const toKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;

const keyToLocalDate = (key) => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const buildMonthGrid = (year, month) => {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  const weeks = [];
  const cursor = new Date(start);

  for (let week = 0; week < 6; week += 1) {
    const days = [];
    for (let day = 0; day < 7; day += 1) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(days);
  }

  return weeks;
};

const isSameMonth = (date, year, month) =>
  date.getFullYear() === year && date.getMonth() === month;

const isToday = (date) => toKey(date) === toKey(new Date());

const Calendar = () => {
  const navigate = useNavigate();
  const today = useMemo(() => new Date(), []);

  const [cursorYear, setCursorYear] = useState(today.getFullYear());
  const [cursorMonth, setCursorMonth] = useState(today.getMonth());
  const [selectedDayKey, setSelectedDayKey] = useState(null);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('all');
  const [isFetchingRange, setIsFetchingRange] = useState(false);

  const { workspaces = [], isLoading: workspacesLoading } = useWorkspaces();
  const { fetchWorkspaceDocuments } = useDocuments();

  const workspaceDocumentsMap = useSelector(
    (state) => state.documents.workspaceDocuments || {}
  );

  const weeks = useMemo(
    () => buildMonthGrid(cursorYear, cursorMonth),
    [cursorYear, cursorMonth]
  );

  const rangeStart = weeks[0][0];
  const rangeEnd = weeks[weeks.length - 1][6];

  const selectedWorkspaceName = useMemo(() => {
    if (selectedWorkspaceId === 'all') return 'All workspaces';
    return (
      workspaces.find((workspace) => workspace._id === selectedWorkspaceId)?.name ||
      'Workspace'
    );
  }, [selectedWorkspaceId, workspaces]);

  const monthLabel = useMemo(
    () =>
      new Date(cursorYear, cursorMonth, 1).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      }),
    [cursorYear, cursorMonth]
  );

  useEffect(() => {
    if (!workspaces.length) return undefined;

    let cancelled = false;

    const workspacesToFetch =
      selectedWorkspaceId === 'all'
        ? workspaces
        : workspaces.filter(
            (workspace) => workspace._id === selectedWorkspaceId
          );

    const run = async () => {
      setIsFetchingRange(true);

      try {
        await Promise.all(
          workspacesToFetch.map((workspace) =>
            fetchWorkspaceDocuments(workspace._id, {
              dueDateFrom: toKey(rangeStart),
              dueDateTo: toKey(rangeEnd),
            })
          )
        );
      } finally {
        if (!cancelled) setIsFetchingRange(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
    // Fetch when workspace/month changes; hook functions may be unstable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaces.length, selectedWorkspaceId, cursorYear, cursorMonth]);

  const eventsByDay = useMemo(() => {
    const result = {};
    const seen = new Set();

    const documents =
      selectedWorkspaceId === 'all'
        ? Object.values(workspaceDocumentsMap).flat()
        : workspaceDocumentsMap[selectedWorkspaceId] || [];

    documents.forEach((document) => {
      if (!document?._id || seen.has(document._id)) return;
      seen.add(document._id);

      if (document.dueDate) {
        const key = toKey(new Date(document.dueDate));
        result[key] = result[key] || { due: [], expiry: [] };
        result[key].due.push(document);
      }

      if (document.expiryDate) {
        const key = toKey(new Date(document.expiryDate));
        result[key] = result[key] || { due: [], expiry: [] };
        result[key].expiry.push(document);
      }
    });

    return result;
  }, [workspaceDocumentsMap, selectedWorkspaceId]);

  const goToMonth = useCallback(
    (delta) => {
      setSelectedDayKey(null);

      let month = cursorMonth + delta;
      let year = cursorYear;

      if (month < 0) {
        month = 11;
        year -= 1;
      } else if (month > 11) {
        month = 0;
        year += 1;
      }

      setCursorMonth(month);
      setCursorYear(year);
    },
    [cursorMonth, cursorYear]
  );

  const goToToday = useCallback(() => {
    setCursorYear(today.getFullYear());
    setCursorMonth(today.getMonth());
    setSelectedDayKey(toKey(today));
  }, [today]);

  const handleDayClick = (dateKey, dayEvents) => {
    const combined = [
      ...(dayEvents?.due || []).map((document) => ({
        document,
        type: 'due',
      })),
      ...(dayEvents?.expiry || []).map((document) => ({
        document,
        type: 'expiry',
      })),
    ];

    if (!combined.length) return;

    if (combined.length === 1) {
      navigate(`/documents/preview/${combined[0].document._id}`);
      return;
    }

    setSelectedDayKey((current) =>
      current === dateKey ? null : dateKey
    );
  };

  const selectedDayEvents = selectedDayKey
    ? eventsByDay[selectedDayKey]
    : null;

  const selectedDayCombined = selectedDayEvents
    ? [
        ...(selectedDayEvents.due || []).map((document) => ({
          document,
          type: 'due',
        })),
        ...(selectedDayEvents.expiry || []).map((document) => ({
          document,
          type: 'expiry',
        })),
      ]
    : [];

  const hasAnyEvents = Object.keys(eventsByDay).length > 0;

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden px-4 py-4 sm:px-6">
      <div className="mx-auto flex h-full max-w-7xl flex-col">
        {/* Header */}
        <header className="shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <CalendarIcon className="h-5 w-5 shrink-0 text-ink-muted" />
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold tracking-tight text-ink">
                  Calendar
                </h1>
             
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Dropdown
                trigger={
                  <button
                    type="button"
                    disabled={workspacesLoading || !workspaces.length}
                    aria-label="Select workspace"
                    className="input-field flex min-w-[11rem] items-center justify-between gap-2 py-2 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="truncate text-ink">{selectedWorkspaceName}</span>
                    <ChevronDownIcon className="h-4 w-4 shrink-0 text-ink-muted" />
                  </button>
                }
              >
                <DropdownItem
                  onClick={() => {
                    setSelectedWorkspaceId('all');
                    setSelectedDayKey(null);
                  }}
                >
                  All workspaces
                </DropdownItem>
                {workspaces.map((workspace) => (
                  <DropdownItem
                    key={workspace._id}
                    onClick={() => {
                      setSelectedWorkspaceId(workspace._id);
                      setSelectedDayKey(null);
                    }}
                  >
                    {workspace.name}
                  </DropdownItem>
                ))}
              </Dropdown>

              <button
                type="button"
                onClick={goToToday}
                className="btn-tertiary !px-3 !py-2 text-sm"
              >
                Today
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-y border-border py-2.5">
            <div className="min-w-0">
              <p className="truncate text-[10px] font-medium uppercase tracking-[0.14em] text-ink-muted">
                {selectedWorkspaceName}
              </p>
              <h2 className="mt-0.5 text-base font-semibold tracking-tight text-ink">
                {monthLabel}
              </h2>
            </div>

            <div className="flex shrink-0 items-center overflow-hidden rounded-md border border-border bg-surface">
              <button
                type="button"
                onClick={() => goToMonth(-1)}
                className="border-r border-border p-1.5 text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
                aria-label="Previous month"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => goToMonth(1)}
                className="p-1.5 text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
                aria-label="Next month"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {isFetchingRange && (
          <div className="flex h-5 shrink-0 items-center gap-2 text-[11px] text-ink-muted">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-500" />
            Loading deadlines…
          </div>
        )}

        {/* Calendar */}
        <section className="mt-2 min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-surface">
          <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)]">
            {/* Weekday header */}
            <div className="grid grid-cols-7 border-b border-border bg-surface-2/40">
              {WEEKDAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="border-r border-border px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-ink-muted last:border-r-0"
                >
                  {label}
                </div>
              ))}
            </div>

            {/* 6-week grid — always fits available viewport */}
            <div className="grid min-h-0 grid-cols-7 grid-rows-6">
              {weeks.flat().map((date) => {
                const dateKey = toKey(date);
                const dayEvents = eventsByDay[dateKey];
                const inMonth = isSameMonth(
                  date,
                  cursorYear,
                  cursorMonth
                );
                const due = dayEvents?.due || [];
                const expiry = dayEvents?.expiry || [];
                const totalCount = due.length + expiry.length;
                const shownCount = Math.min(2, due.length) + Math.min(2, expiry.length);
                const isSelected = selectedDayKey === dateKey;

                return (
                  <button
                    type="button"
                    key={dateKey}
                    onClick={() => handleDayClick(dateKey, dayEvents)}
                    disabled={!totalCount}
                    aria-label={`${date.toLocaleDateString(
                      undefined,
                      {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      }
                    )}${totalCount ? `, ${totalCount} deadlines` : ''}`}
                    className={`
                      group relative min-h-0 overflow-hidden border-b border-r border-border
                      p-2 text-left transition-colors
                      ${inMonth ? 'bg-surface' : 'bg-surface-2/20'}
                      ${totalCount ? 'cursor-pointer hover:bg-surface-2/70' : 'cursor-default'}
                      ${isSelected ? 'bg-primary-50/60 ring-1 ring-inset ring-primary-500 dark:bg-primary-950/20' : ''}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`
                          flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-semibold
                          ${isToday(date)
                            ? 'bg-primary-600 text-white'
                            : inMonth
                              ? 'text-ink'
                              : 'text-ink-muted'}
                        `}
                      >
                        {date.getDate()}
                      </span>

                      {totalCount > 0 && (
                        <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-ink-muted">
                          {totalCount}
                        </span>
                      )}
                    </div>

                    {totalCount > 0 && (
                      <div className="mt-1.5 space-y-1">
                        {due.slice(0, 2).map((document) => (
                          <div
                            key={`due-${document._id}`}
                            className="truncate rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium leading-4 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                            title={`${document.name} — due`}
                          >
                            {document.name}
                          </div>
                        ))}

                        {expiry.slice(0, 2).map((document) => (
                          <div
                            key={`expiry-${document._id}`}
                            className="truncate rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium leading-4 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                            title={`${document.name} — expiry`}
                          >
                            {document.name}
                          </div>
                        ))}

                        {totalCount > shownCount && (
                          <div className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-ink-muted">
                            +{totalCount - shownCount} more
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Compact footer / legend */}
        <div className="flex shrink-0 items-center justify-between gap-4 py-2 text-[11px] text-ink-muted">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-amber-400" />
              Due
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-red-500" />
              Expiry
            </span>
          </div>

          {!hasAnyEvents && !isFetchingRange && (
            <span>No deadlines in this view</span>
          )}
        </div>
      </div>

      {/* Selected-day overlay */}
      {selectedDayEvents && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/20 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Selected day deadlines"
            className="w-full max-w-lg overflow-hidden border border-border bg-surface shadow-panel"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-muted">
                  Selected day
                </p>
                <h3 className="mt-0.5 text-sm font-semibold text-ink">
                  {keyToLocalDate(selectedDayKey).toLocaleDateString(
                    undefined,
                    {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    }
                  )}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDayKey(null)}
                className="rounded-md p-1.5 text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
                aria-label="Close selected day"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[min(60vh,28rem)] divide-y divide-border overflow-y-auto">
              {selectedDayCombined.map(({ document, type }) => (
                <button
                  key={`${document._id}-${type}`}
                  type="button"
                  onClick={() => navigate(`/documents/preview/${document._id}`)}
                  className="group flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-surface-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink group-hover:text-primary-700 dark:group-hover:text-primary-400">
                      {document.name}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {type === 'due' ? 'Due date' : 'Expiry date'}
                      {document.status ? ` · ${document.status}` : ''}
                    </p>
                  </div>

                  <div className="shrink-0">
                    {type === 'due' ? (
                      <DueDateChip date={document.dueDate} />
                    ) : (
                      <ExpiryDateChip date={document.expiryDate} />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;