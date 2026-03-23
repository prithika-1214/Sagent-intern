import { useEffect, useMemo, useState } from 'react';
import EmptyState from './EmptyState';

const MAX_VISIBLE_PAGES = 5;

const DataTable = ({ columns, rows, rowKey, actions, loading, emptyTitle, emptyDescription, pageSize }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const resolvedRows = rows || [];
  const hasPagination = Number.isFinite(pageSize) && pageSize > 0;
  const totalPages = hasPagination ? Math.max(1, Math.ceil(resolvedRows.length / pageSize)) : 1;

  useEffect(() => {
    setCurrentPage((previousPage) => {
      if (!hasPagination) {
        return 1;
      }

      return Math.min(Math.max(previousPage, 1), totalPages);
    });
  }, [hasPagination, totalPages]);

  const paginatedRows = useMemo(() => {
    if (!hasPagination) {
      return resolvedRows;
    }

    const startIndex = (currentPage - 1) * pageSize;
    return resolvedRows.slice(startIndex, startIndex + pageSize);
  }, [currentPage, hasPagination, pageSize, resolvedRows]);

  const visiblePages = useMemo(() => {
    if (!hasPagination) {
      return [];
    }

    const windowSize = Math.min(MAX_VISIBLE_PAGES, totalPages);
    const halfWindow = Math.floor(windowSize / 2);
    let startPage = Math.max(1, currentPage - halfWindow);
    let endPage = startPage + windowSize - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - windowSize + 1);
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
  }, [currentPage, hasPagination, totalPages]);

  const startRecord = resolvedRows.length ? (currentPage - 1) * pageSize + 1 : 0;
  const endRecord = hasPagination ? Math.min(currentPage * pageSize, resolvedRows.length) : resolvedRows.length;

  if (loading) {
    return (
      <div className="table-shell">
        <div className="table-loading">Loading table data...</div>
      </div>
    );
  }

  if (!resolvedRows.length) {
    return <EmptyState title={emptyTitle || 'No records available'} description={emptyDescription} />;
  }

  return (
    <div className="table-shell">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
            {actions ? <th>Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {paginatedRows.map((row, index) => (
            <tr key={rowKey(row, index)}>
              {columns.map((column) => (
                <td key={column.key} data-label={column.label}>
                  {column.render ? column.render(row, index) : row[column.key]}
                </td>
              ))}
              {actions ? (
                <td data-label="Actions">
                  <div className="table-actions">{actions(row)}</div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
      {hasPagination ? (
        <div className="table-footer">
          <p className="pagination-summary">
            Showing {startRecord}-{endRecord} of {resolvedRows.length}
          </p>
          <div className="table-pagination">
            <button
              type="button"
              className="btn btn-small btn-outline"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <div className="pagination-pages">
              {visiblePages.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  className={`pagination-page ${pageNumber === currentPage ? 'is-active' : ''}`.trim()}
                  onClick={() => setCurrentPage(pageNumber)}
                  aria-current={pageNumber === currentPage ? 'page' : undefined}
                >
                  {pageNumber}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-small btn-outline"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default DataTable;
