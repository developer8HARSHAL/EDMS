import React from 'react';

const Table = ({ columns, data, onRowClick, emptyMessage = 'No results found.' }) => {
  return (
    <div className="card overflow-x-auto no-scrollbar">
      <table className="min-w-full text-left border-collapse">
        <thead className="bg-surface-2 border-b border-border">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`
                  px-6 py-3
                  text-xs font-semibold uppercase tracking-wider
                  text-ink-muted
                  ${column.align === 'center' ? 'text-center' : ''}
                  ${column.align === 'right' ? 'text-right' : ''}
                  ${!column.align ? 'text-left' : ''}
                `}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-border bg-surface">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-10 text-center text-sm text-ink-muted">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={row._id || row.id}
                onClick={() => onRowClick?.(row)}
                onKeyDown={(e) => {
                  if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onRowClick(row);
                  }
                }}
                role={onRowClick ? 'button' : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                className={`
                  transition-colors
                  ${
                    onRowClick
                      ? 'cursor-pointer hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500'
                      : ''
                  }
                `}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`
                      px-6 py-4 text-sm text-ink
                      ${column.nowrap ? 'whitespace-nowrap' : ''}
                      ${column.align === 'center' ? 'text-center' : ''}
                      ${column.align === 'right' ? 'text-right' : ''}
                      ${!column.align ? 'text-left' : ''}
                    `}
                  >
                    {column.render ? column.render(row) : row[column.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;