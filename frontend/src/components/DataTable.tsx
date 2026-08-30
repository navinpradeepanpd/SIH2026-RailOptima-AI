import React from 'react';

interface Column {
  header: string;
  accessor: string;
  render?: (val: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  title: string;
  columns: Column[];
  data: any[];
  emptyMessage?: string;
}

export default function DataTable({ title, columns, data, emptyMessage }: DataTableProps) {
  return (
    <div className="glass-panel-elevated overflow-hidden flex flex-col">
      <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">{title}</h2>
        {data.length > 0 && (
          <span className="text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-deep)] px-2 py-1 rounded">
            {data.length} {data.length === 1 ? 'record' : 'records'}
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--bg-deep)]">
              {columns.map((col, i) => (
                <th key={i} className="px-5 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.1em] border-b border-[var(--border-subtle)]">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center text-[var(--text-muted)] text-sm">
                  {emptyMessage || "No data available"}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] transition-colors duration-150 animate-fade-in"
                  style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
                >
                  {columns.map((col, j) => (
                    <td key={j} className="px-5 py-3.5 text-sm text-[var(--text-secondary)]">
                      {col.render ? col.render(row[col.accessor], row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
