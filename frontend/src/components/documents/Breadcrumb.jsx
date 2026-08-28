import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const Breadcrumb = ({ workspaceId, workspaceName, documentName }) => (
  <nav
    aria-label="Breadcrumb"
    className="flex min-w-0 items-center gap-1.5 text-sm"
  >
    <Link
      to="/documents"
      className="shrink-0 text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      Documents
    </Link>

    {workspaceName && (
      <>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-muted" aria-hidden="true" />
        <Link
          to={`/workspaces/${workspaceId}`}
          title={workspaceName}
          className="min-w-0 max-w-[200px] truncate text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          {workspaceName}
        </Link>
      </>
    )}

    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-muted" aria-hidden="true" />

    <span
      title={documentName}
      className="min-w-0 max-w-[280px] truncate font-medium text-ink"
    >
      {documentName}
    </span>
  </nav>
);

export default Breadcrumb;