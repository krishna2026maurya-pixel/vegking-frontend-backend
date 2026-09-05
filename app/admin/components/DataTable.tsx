"use client";

import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
import clsx from 'clsx';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

export interface Action<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  color?: 'primary' | 'danger' | 'success' | 'warning' | 'default';
  disabled?: (row: T) => boolean;
}

export interface BulkAction {
  label: string;
  icon?: React.ReactNode;
  onClick: (selectedIds: (string | number)[]) => void;
  color?: 'primary' | 'danger' | 'success' | 'warning' | 'default';
}

export interface DataTablePagination {
  page: number;
  totalPages: number;
  total: number;
  limit?: number;
  onPageChange: (page: number) => void;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: Action<T>[];
  bulkActions?: BulkAction[];
  keyExtractor: (row: T) => string | number;
  loading?: boolean;
  hideToolbar?: boolean;
  hideFooter?: boolean;
  pagination?: DataTablePagination;
}

export default function DataTable<T>({
  data,
  columns,
  actions = [],
  bulkActions = [],
  keyExtractor,
  loading = false,
  hideToolbar = false,
  hideFooter = false,
  pagination,
}: DataTableProps<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  // Client-side pagination state for sections that don't pass external pagination
  const [clientPage, setClientPage] = useState(1);
  const pageSize = pagination?.limit || 10;

  const isServerPaged = Boolean(pagination);
  const currentPage = isServerPaged ? pagination!.page : clientPage;
  const totalItems = isServerPaged ? pagination!.total : data.length;
  const totalPages = isServerPaged ? Math.max(1, pagination!.totalPages) : Math.max(1, Math.ceil(data.length / pageSize));

  // Sliced data for client-side pagination, or full server data if server-paged
  const displayedData = isServerPaged ? data : data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    if (!isServerPaged && clientPage > totalPages) {
      setClientPage(Math.max(1, totalPages));
    }
  }, [data.length, totalPages, isServerPaged, clientPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    if (isServerPaged) {
      pagination!.onPageChange(newPage);
    } else {
      setClientPage(newPage);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(displayedData.map(keyExtractor)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string | number, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) newSelected.add(id);
    else newSelected.delete(id);
    setSelectedIds(newSelected);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Toolbar */}
      {!hideToolbar ? (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-64 md:w-80 shadow-sm"
              />
            </div>
            {selectedIds.size > 0 && bulkActions.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500">{selectedIds.size} selected</span>
                {bulkActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => action.onClick(Array.from(selectedIds))}
                    className={clsx(
                      "px-3 py-1.5 text-xs font-medium rounded-lg shadow-sm border flex items-center gap-1",
                      action.color === 'danger' ? "text-red-700 bg-red-50 border-red-200 hover:bg-red-100" :
                        action.color === 'success' ? "text-green-700 bg-green-50 border-green-200 hover:bg-green-100" :
                          "text-gray-700 bg-white border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 shadow-sm">
            <Filter size={16} className="mr-2" />
            Filter
          </button>
        </div>
      ) : (selectedIds.size > 0 && bulkActions.length > 0) ? (
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 bg-emerald-50/60 dark:bg-emerald-950/30">
          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">{selectedIds.size} item(s) selected</span>
          {bulkActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => action.onClick(Array.from(selectedIds))}
              className={clsx(
                "px-2.5 py-1 text-xs font-bold rounded-lg shadow-xs border flex items-center gap-1 cursor-pointer transition",
                action.color === 'danger' ? "text-red-700 bg-red-50 border-red-200 hover:bg-red-100" :
                  action.color === 'success' ? "text-green-700 bg-green-50 border-green-200 hover:bg-green-100" :
                    "text-gray-700 bg-white border-gray-300 hover:bg-gray-50"
              )}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      ) : null}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 py-3 w-10 text-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                  onChange={handleSelectAll}
                  checked={displayedData.length > 0 && selectedIds.size === displayedData.length}
                />
              </th>
              {columns.map((col, idx) => (
                <th key={idx} className="px-4 py-2.5 font-bold whitespace-nowrap text-xs text-gray-700 dark:text-gray-300">
                  {col.label}
                </th>
              ))}
              {actions.length > 0 && (
                <th className="px-6 py-3 text-right font-bold whitespace-nowrap text-xs">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + 2} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex justify-center items-center space-x-2">
                    <div className="w-4 h-4 rounded-full animate-pulse bg-green-500"></div>
                    <div className="w-4 h-4 rounded-full animate-pulse bg-green-500" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-4 h-4 rounded-full animate-pulse bg-green-500" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </td>
              </tr>
            ) : displayedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="px-6 py-12 text-center text-gray-500">
                  No records found.
                </td>
              </tr>
            ) : (
              displayedData.map((row) => {
                const id = keyExtractor(row);
                const isSelected = selectedIds.has(id);
                return (
                  <tr
                    key={id}
                    className={clsx(
                      "border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors",
                      isSelected && "bg-green-50 dark:bg-green-900/20"
                    )}
                  >
                    <td className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                        checked={isSelected}
                        onChange={(e) => handleSelectRow(id, e.target.checked)}
                      />
                    </td>
                    {columns.map((col, idx) => (
                      <td key={idx} className="px-4 py-2 align-middle text-xs whitespace-nowrap">
                        {col.render ? col.render(row) : (row as any)[col.key]}
                      </td>
                    ))}
                    {actions.length > 0 && (
                      <td className="px-4 py-1.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {actions.map((action, idx) => {
                            const isDisabled = action.disabled ? action.disabled(row) : false;
                            return (
                              <button
                                key={idx}
                                onClick={() => !isDisabled && action.onClick(row)}
                                disabled={isDisabled}
                                className={clsx(
                                  "p-1 rounded-lg transition-colors font-semibold text-xs flex items-center gap-1",
                                  isDisabled ? "opacity-40 cursor-not-allowed text-gray-400 dark:text-gray-650" : (
                                    action.color === 'danger' ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20" :
                                      action.color === 'success' ? "text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/20" :
                                        action.color === 'primary' ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20" :
                                          action.color === 'warning' ? "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20" :
                                            "text-gray-600 dark:text-gray-450 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                                  )
                                )}
                                title={isDisabled ? `${action.label} (Disabled)` : action.label}
                              >
                                {action.icon}
                                <span className="hidden 2xl:inline">{action.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Real, functional pagination working in all sections */}
      {!hideFooter && totalItems > 0 && (
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-gray-800">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Showing <span className="font-semibold text-gray-800 dark:text-white">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-semibold text-gray-800 dark:text-white">{Math.min(currentPage * pageSize, totalItems)}</span> of <span className="font-semibold text-gray-800 dark:text-white">{totalItems}</span> results
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">Page {currentPage} of {totalPages}</span>
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1.5 cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft size={15} /> Prev
            </button>
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1.5 cursor-pointer"
              title="Next Page"
            >
              Next <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
