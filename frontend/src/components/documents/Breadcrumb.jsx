import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

const Breadcrumb = ({ workspaceId, workspaceName, documentName }) => (
  <nav className="flex items-center gap-1.5 text-sm mb-4">
    <Link to="/documents" className="text-ink-muted hover:text-ink">
      Documents
    </Link>
    {workspaceName && (
      <>
        <ChevronRightIcon className="h-3.5 w-3.5 text-ink-muted" />
        <Link to={`/workspaces/${workspaceId}`} className="text-ink-muted hover:text-ink truncate max-w-[160px]">
          {workspaceName}
        </Link>
      </>
    )}
    <ChevronRightIcon className="h-3.5 w-3.5 text-ink-muted" />
    <span className="text-ink font-medium truncate max-w-[240px]">{documentName}</span>
  </nav>
);

export default Breadcrumb;