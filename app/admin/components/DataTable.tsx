"use client";

import React, { useState } from 'react';
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

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: Action<T>[];
  bulkActions?: BulkAction[];
  keyExtractor: (row: T) => string | number;
  loading?: boolean;
}

export default function DataTable<T>({ 
  data, 
  columns, 
  actions = [], 
  bulkActions = [],
  keyExtractor,
  loading = false 
}: DataTableProps<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(data.map(keyExtractor)));
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
                  checked={data.length > 0 && selectedIds.size === data.length}
                />
              </th>
              {columns.map((col, idx) => (
                <th key={idx} className="px-6 py-3 font-semibold whitespace-nowrap">
                  {col.label}
                </th>
              ))}
              {actions.length > 0 && (
                <th className="px-6 py-3 text-right font-semibold">Actions</th>
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
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="px-6 py-12 text-center text-gray-500">
                  No records found.
                </td>
              </tr>
            ) : (
              data.map((row) => {
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
                      <td key={idx} className="px-6 py-4 align-middle">
                        {col.render ? col.render(row) : (row as any)[col.key]}
                      </td>
                    ))}
                    {actions.length > 0 && (
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {actions.map((action, idx) => {
                            const isDisabled = action.disabled ? action.disabled(row) : false;
                            return (
                              <button
                                key={idx}
                                onClick={() => !isDisabled && action.onClick(row)}
                                disabled={isDisabled}
                                className={clsx(
                                  "p-1.5 rounded-lg transition-colors font-medium text-xs flex items-center gap-1",
                                  isDisabled ? "opacity-40 cursor-not-allowed text-gray-400 dark:text-gray-600" : (
                                    action.color === 'danger' ? "text-red-600 hover:bg-red-50" :
                                    action.color === 'success' ? "text-green-600 hover:bg-green-50" :
                                    "text-gray-600 hover:bg-gray-100"
                                  )
                                )}
                                title={isDisabled ? `${action.label} (Disabled)` : action.label}
                              >
                                {action.icon}
                                <span className="hidden xl:inline">{action.label}</span>
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

      {/* Pagination */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Showing <span className="font-medium text-gray-900 dark:text-white">1</span> to <span className="font-medium text-gray-900 dark:text-white">{data.length}</span> of <span className="font-medium text-gray-900 dark:text-white">100</span> results
        </span>
        <div className="flex items-center gap-2">
          <button className="p-2 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50">
            <ChevronLeft size={18} />
          </button>
          <button className="p-2 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
