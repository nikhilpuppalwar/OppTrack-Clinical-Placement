import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  itemName = 'items',
  accentColor = '#087F71',
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, safePage * pageSize);

  // Generate page numbers with smart ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (safePage <= 3) {
      return [1, 2, 3, 4, '...', totalPages];
    }
    if (safePage >= totalPages - 2) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', safePage - 1, safePage, safePage + 1, '...', totalPages];
  };

  const pages = getPageNumbers();

  const btnBase = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
    minWidth: 32,
    padding: '0 8px',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
    fontFamily: 'inherit',
    border: '1px solid #E5EAF0',
    background: '#FFFFFF',
    color: '#344054',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        padding: '14px 18px',
        background: '#F8FAFD',
        borderTop: '1px solid #E5EAF0',
        fontSize: 13,
        color: '#475467',
      }}
    >
      {/* Left: Summary & Per-page selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span>
          Showing <strong style={{ color: '#0B1F3A', fontWeight: 600 }}>{startItem}</strong>–
          <strong style={{ color: '#0B1F3A', fontWeight: 600 }}>{endItem}</strong> of{' '}
          <strong style={{ color: '#0B1F3A', fontWeight: 600 }}>{totalItems}</strong> {itemName}
        </span>

        {onPageSizeChange && pageSizeOptions && pageSizeOptions.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#667085' }}>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                onPageSizeChange(newSize);
              }}
              style={{
                height: 30,
                padding: '0 8px',
                borderRadius: 6,
                border: '1px solid #D0D5DD',
                background: '#FFFFFF',
                color: '#1D2939',
                fontSize: 12.5,
                fontWeight: 500,
                outline: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} per page
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Page Navigation Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* First Page */}
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => onPageChange(1)}
            title="First page"
            style={{
              ...btnBase,
              opacity: safePage <= 1 ? 0.45 : 1,
              cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
            }}
          >
            <ChevronsLeft size={15} />
          </button>

          {/* Previous Page */}
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
            title="Previous page"
            style={{
              ...btnBase,
              opacity: safePage <= 1 ? 0.45 : 1,
              cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
            }}
          >
            <ChevronLeft size={15} />
          </button>

          {/* Page numbers */}
          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 32,
                    color: '#98A2B3',
                    fontWeight: 600,
                  }}
                >
                  …
                </span>
              );
            }

            const isActive = p === safePage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                style={{
                  ...btnBase,
                  background: isActive ? accentColor : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : '#344054',
                  borderColor: isActive ? accentColor : '#E5EAF0',
                  fontWeight: isActive ? 600 : 500,
                  boxShadow: isActive ? `0 1px 3px ${accentColor}40` : 'none',
                }}
              >
                {p}
              </button>
            );
          })}

          {/* Next Page */}
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(safePage + 1)}
            title="Next page"
            style={{
              ...btnBase,
              opacity: safePage >= totalPages ? 0.45 : 1,
              cursor: safePage >= totalPages ? 'not-allowed' : 'pointer',
            }}
          >
            <ChevronRight size={15} />
          </button>

          {/* Last Page */}
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(totalPages)}
            title="Last page"
            style={{
              ...btnBase,
              opacity: safePage >= totalPages ? 0.45 : 1,
              cursor: safePage >= totalPages ? 'not-allowed' : 'pointer',
            }}
          >
            <ChevronsRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
